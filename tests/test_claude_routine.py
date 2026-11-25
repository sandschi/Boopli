"""Ask Claude: the optional routine. A fake routine server stands in for Claude's cloud."""

from __future__ import annotations

import asyncio
import json
import re
import sys
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest
from aiohttp import web

sys.path.insert(0, str(Path(__file__).parents[1]))

from custom_components.boopli import engine, manager as manager_module, routine  # noqa: E402

TOKEN = "sk-ant-oat01-SECRETSECRETSECRETSECRET"
STEPS = {"steps": [{"title": "Clear the sink"}, {"title": "Wipe the counter"}], "summary": "ok"}


class FakeRoutine:
    """Claude's side: takes the fire call and, when told to, posts an answer back."""

    def __init__(self, manager) -> None:
        self.manager = manager
        self.fires: list[dict] = []
        self.status = 200
        self.answers: list = [STEPS]  # one per fire; the last one repeats
        self.silent = False  # never answers (the routine got stuck)
        self.runner: web.AppRunner | None = None
        self.url = ""

    async def _fire(self, request: web.Request) -> web.Response:
        body = await request.json()
        self.fires.append({"headers": dict(request.headers), "body": body})
        if self.status != 200:
            return web.json_response({"error": "no"}, status=self.status)
        if not self.silent:
            request_id = re.search(r'"request_id": "([0-9a-f]+)"', body["text"]).group(1)
            index = min(len(self.fires) - 1, len(self.answers) - 1)
            answer = self.answers[index]
            asyncio.get_running_loop().call_later(
                0.01, lambda: self.manager._claude_waiting.answer(request_id, answer)
            )
        return web.json_response(
            {"type": "routine_fire", "claude_code_session_id": "s1", "claude_code_session_url": "u"}
        )

    async def start(self) -> None:
        app = web.Application()
        app.router.add_post("/v1/claude_code/routines/trig_test/fire", self._fire)
        self.runner = web.AppRunner(app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, "127.0.0.1", 0)
        await site.start()
        port = site._server.sockets[0].getsockname()[1]
        self.prefix = f"http://127.0.0.1:{port}/v1/claude_code/routines/"
        self.url = self.prefix + "trig_test/fire"

    async def stop(self) -> None:
        await self.runner.cleanup()


def make_manager() -> manager_module.BoopliManager:
    hass = MagicMock()
    hass.async_add_executor_job = AsyncMock(side_effect=lambda fn, *args: fn(*args))
    m = manager_module.BoopliManager(hass)
    path = Path(tempfile.mkdtemp()) / ".storage" / "boopli_claude"
    m._secret_store = MagicMock(async_save=AsyncMock(), async_load=AsyncMock(return_value={}), path=str(path))
    m._claude_webhook_id = "hook123"
    m._claude_token = TOKEN
    m.settings.ai.claude_enabled = True
    m.settings.ai.claude_ha_url = "https://ha.example.org"
    return m


def run(coro_fn):
    """Run an async test body with a fake routine; the routine address is patched in."""

    async def body():
        m = make_manager()
        fake = FakeRoutine(m)
        await fake.start()
        m.settings.ai.claude_fire_url = fake.url
        async with aiohttp.ClientSession() as session:
            with patch.object(manager_module, "async_get_clientsession", return_value=session), patch.object(
                routine, "FIRE_URL_PREFIX", fake.prefix
            ):
                try:
                    await coro_fn(m, fake)
                finally:
                    await fake.stop()

    asyncio.run(body())


def ask_steps(m, via="claude"):
    return m.async_ai_steps("Clean the kitchen", "now", via=via)


# --- the happy path ----------------------------------------------------------------------------


def test_claude_answers_the_steps_and_gets_the_right_call():
    async def body(m, fake):
        result = await ask_steps(m)
        assert [s["title"] for s in result["steps"]] == ["Clear the sink", "Wipe the counter"]
        call = fake.fires[0]
        assert call["headers"]["Authorization"] == f"Bearer {TOKEN}"
        assert call["headers"]["anthropic-beta"] == routine.BETA_HEADER
        assert call["headers"]["anthropic-version"] == routine.API_VERSION
        text = call["body"]["text"]
        assert "Clean the kitchen" in text
        assert "https://ha.example.org/api/webhook/hook123" in text
        assert TOKEN not in text  # the token never goes into the question
        assert len(m._claude_waiting) == 0  # nothing left waiting

    run(body)


def test_claude_can_ask_questions_and_room_things_too():
    async def body(m, fake):
        fake.answers = [{"enough": False, "questions": [{"text": "How big is it?", "options": ["Small", "Big"]}]}]
        result = await m.async_ai_questions("Clean the kitchen", "now", via="claude")
        assert result["questions"][0]["text"] == "How big is it?"
        fake.answers = [{"questions": []}]
        assert (await m.async_room_questions("Kitchen", "", via="claude"))["enough"] is True
        fake.answers = [{"notes": "A small kitchen."}]
        assert (await m.async_room_notes("Kitchen", "", via="claude"))["notes"] == "A small kitchen."

    run(body)


def test_the_normal_agent_is_not_used_when_asking_claude():
    async def body(m, fake):
        m._run_agent = AsyncMock(side_effect=AssertionError("the agent must stay out of it"))
        await ask_steps(m)

    run(body)


def test_the_normal_way_does_not_fire_the_routine():
    async def body(m, fake):
        m._run_agent = AsyncMock(return_value=STEPS)
        await ask_steps(m, via="agent")
        assert fake.fires == []

    run(body)


def test_a_wrong_choice_is_refused():
    async def body(m, fake):
        with pytest.raises(manager_module.BoopliError):
            await ask_steps(m, via="gpt")

    run(body)


# --- plain errors ------------------------------------------------------------------------------


def _error(m, fake=None):
    async def go():
        with pytest.raises(manager_module.BoopliError) as err:
            await ask_steps(m)
        return str(err.value)

    return go()


def test_switched_off_and_not_set_up_say_so():
    async def body(m, fake):
        m.settings.ai.claude_enabled = False
        assert "switched off" in await _error(m)
        m.settings.ai.claude_enabled = True
        m._claude_token = ""
        assert "not set up" in await _error(m)
        m._claude_token = TOKEN
        m.settings.ai.claude_fire_url = ""
        assert "not set up" in await _error(m)
        assert fake.fires == []

    run(body)


@pytest.mark.parametrize(
    "status,words",
    [(401, "refused the token"), (403, "refused the token"), (404, "routine trigger URL"), (429, "limited requests"), (503, "trouble")],
)
def test_claude_errors_are_plain_words(status, words):
    async def body(m, fake):
        fake.status = status
        message = await _error(m)
        assert words in message
        assert TOKEN not in message
        assert len(m._claude_waiting) == 0

    run(body)


def test_no_answer_in_time_is_a_timeout_message():
    async def body(m, fake):
        fake.silent = True
        with patch.object(routine, "WAIT_SECONDS", 0.2):
            message = await _error(m)
        assert "stopped waiting" in message

    run(body)


def test_an_unreadable_answer_gets_one_more_try_that_costs_another_fire():
    async def body(m, fake):
        fake.answers = ["no idea, sorry", STEPS]
        result = await ask_steps(m)
        assert len(result["steps"]) == 2
        assert len(fake.fires) == 2

    run(body)


def test_two_unreadable_answers_give_up():
    async def body(m, fake):
        fake.answers = ["blah", "blah"]
        await _error(m)
        assert len(fake.fires) == 2

    run(body)


# --- the hourly limit ---------------------------------------------------------------------------


def test_boopli_stops_before_claudes_limit():
    async def body(m, fake):
        for _ in range(routine.MAX_FIRES_PER_HOUR):
            await ask_steps(m)
        assert len(fake.fires) == routine.MAX_FIRES_PER_HOUR
        assert m.claude_status()["fires_left"] == 0
        message = await _error(m)
        assert "requests per hour" in message
        assert len(fake.fires) == routine.MAX_FIRES_PER_HOUR  # nothing more was sent

    run(body)


def test_the_counter_forgets_fires_older_than_an_hour():
    counter = routine.FireCounter(limit=2)
    counter.take(now=0)
    counter.take(now=10)
    with pytest.raises(routine.RoutineError):
        counter.take(now=20)
    counter.take(now=3601)  # the first one is an hour old now
    assert counter.left(now=3601) == 0


# --- the webhook (the answer coming back) ----------------------------------------------------------


def _request(body, length=None):
    request = MagicMock()
    request.content_length = length
    raw = body if isinstance(body, bytes) else (b"{not json" if isinstance(body, Exception) else json.dumps(body).encode())

    async def read(n=-1):  # like aiohttp's stream: at most n bytes
        return raw if n < 0 else raw[:n]

    request.content.read = read
    return request


def test_each_request_id_is_accepted_once():
    async def body(m, fake):
        request_id, future = m._claude_waiting.new()
        ok = await m._handle_claude_webhook(m.hass, "hook123", _request({"request_id": request_id, "answer": {"a": 1}}))
        assert ok.status == 200
        assert future.result() == {"a": 1}
        again = await m._handle_claude_webhook(m.hass, "hook123", _request({"request_id": request_id, "answer": {"a": 2}}))
        assert again.status == 404
        assert future.result() == {"a": 1}  # the second one changed nothing

    run(body)


def test_an_unknown_or_broken_post_is_refused():
    async def body(m, fake):
        handle = m._handle_claude_webhook
        assert (await handle(m.hass, "h", _request({"request_id": "nope", "answer": 1}))).status == 404
        assert (await handle(m.hass, "h", _request({"answer": 1}))).status == 404
        assert (await handle(m.hass, "h", _request({"request_id": "x"}))).status == 400
        assert (await handle(m.hass, "h", _request(["list"]))).status == 400
        assert (await handle(m.hass, "h", _request(ValueError("bad json")))).status == 400
        assert (await handle(m.hass, "h", _request({}, length=routine.MAX_ANSWER_BYTES + 1))).status == 413

    run(body)


def test_a_streamed_body_over_the_limit_is_refused_and_keeps_the_request_id():
    async def body(m, fake):
        request_id, future = m._claude_waiting.new()
        big = json.dumps({"request_id": request_id, "answer": "x" * (routine.MAX_ANSWER_BYTES + 10)}).encode()
        # No declared length (chunked): the limit is enforced while reading.
        refused = await m._handle_claude_webhook(m.hass, "hook123", _request(big, length=None))
        assert refused.status == 413
        assert not future.done()  # the id was not used up
        ok = await m._handle_claude_webhook(m.hass, "hook123", _request({"request_id": request_id, "answer": 1}))
        assert ok.status == 200

    run(body)


def test_a_bad_home_assistant_address_is_refused():
    for bad in ("https://[home.example.org", "https://ha.example.org/#x", "https://ha.example.org/?a=1",
                "https://", "https://ha.example.org:99999", "ftp://ha.example.org"):
        with pytest.raises(routine.RoutineError):
            routine.clean_ha_url(bad)
    assert routine.clean_ha_url("") == ""
    assert routine.clean_ha_url(" https://ha.example.org:8123/ ") == "https://ha.example.org:8123"


def test_a_bad_stored_address_does_not_break_the_snapshot():
    async def body(m, fake):
        m.settings.ai.claude_ha_url = "https://[home.example.org"  # as if imported
        assert m.claude_status()["callback_host"] == ""
        m.snapshot()

    run(body)


def test_an_unreadable_secret_file_does_not_stop_the_start_or_get_overwritten():
    async def body(m, fake):
        m._secret_store.async_load = AsyncMock(side_effect=RuntimeError("newer version"))
        m._claude_webhook_id = ""
        m._claude_token = ""
        await m._async_load_claude_secrets()  # must not raise
        assert m._claude_secrets_ok is False
        assert m._claude_webhook_id == ""
        with pytest.raises(manager_module.BoopliError):
            await m.async_set_claude_token("N" * 40)
        m._secret_store.async_save.assert_not_called()
        assert not Path(m._secret_store.path).exists()  # nothing was written over it

    run(body)


# --- the token is a secret -----------------------------------------------------------------------


def test_the_token_is_nowhere_in_what_the_panel_or_a_backup_gets():
    async def body(m, fake):
        await m.async_set_claude_token("  " + TOKEN + "  ")
        assert m._claude_token == TOKEN
        envelope = json.loads(Path(m._secret_store.path).read_text())
        assert envelope["version"] == 1 and envelope["key"] == manager_module.SECRET_STORAGE_KEY
        assert envelope["data"]["token"] == TOKEN  # it is kept, in its own place

        everything = json.dumps(m.snapshot()) + json.dumps(m._data_to_save())
        everything += json.dumps(m.export_backup(list(engine.BACKUP_PARTS), "0"))
        assert TOKEN not in everything
        assert "hook123" not in everything  # the webhook id stays private too
        assert m.snapshot()["claude"]["token_set"] is True

        await m.async_set_claude_token("")
        assert m.snapshot()["claude"]["token_set"] is False

    run(body)


def test_a_token_that_cannot_be_one_is_refused():
    async def body(m, fake):
        for bad in ("short", "has spaces in it, definitely not a token", "ünïcödé" * 5):
            with pytest.raises(manager_module.BoopliError):
                await m.async_set_claude_token(bad)

    run(body)


# --- settings -----------------------------------------------------------------------------------


def settings_with(url="", ha_url=""):
    data = engine.to_dict(engine.Settings())
    data["ai"].update({"claude_enabled": True, "claude_fire_url": url, "claude_ha_url": ha_url})
    return data


def test_only_a_real_fire_address_is_saved():
    m = make_manager()
    good = routine.FIRE_URL_PREFIX + "trig_01AbC/fire"
    m.save_settings(settings_with(good, "https://ha.example.org/"))
    assert m.settings.ai.claude_fire_url == good
    assert m.settings.ai.claude_ha_url == "https://ha.example.org"
    for bad in (
        "https://evil.example.com/v1/claude_code/routines/trig_1/fire",
        routine.FIRE_URL_PREFIX + "trig_1",
        routine.FIRE_URL_PREFIX + "a/b/fire",
    ):
        with pytest.raises(manager_module.BoopliError):
            m.save_settings(settings_with(bad))
    with pytest.raises(manager_module.BoopliError):
        m.save_settings(settings_with(good, "ftp://nope"))
    assert m.settings.ai.claude_fire_url == good  # a refused save changed nothing


def test_the_extras_are_off_by_default():
    ai = engine.Settings().ai
    assert ai.claude_enabled is False and ai.claude_fire_url == "" and ai.claude_ha_url == ""


# --- photos: Claude gets short-lived signed links, the files are deleted afterwards ----------------

JPEG = b"\xff\xd8\xff\xe0" + b"fakejpegbytes" * 5


def _photos(count=2):
    import base64

    return ["data:image/jpeg;base64," + base64.b64encode(JPEG + bytes([i])).decode() for i in range(count)]


def with_media(coro_fn):
    """Like run(), plus a media folder, a plain executor and a fake link signer."""
    import tempfile

    async def body(m, fake):
        with tempfile.TemporaryDirectory() as media:
            m.hass.config.media_dirs = {"local": media}

            async def executor(fn, *args):
                return fn(*args)

            m.hass.async_add_executor_job = executor
            signed = []

            def sign(hass, path, expiration):
                assert (Path(media) / manager_module.PHOTO_DIR / path.rsplit("/", 1)[1]).exists()  # the file is there when its link is made
                signed.append((path, expiration.total_seconds()))
                return path + "?authSig=SIGNED"

            with patch.object(manager_module, "async_sign_path", sign):
                await coro_fn(m, fake, Path(media), signed)

    run(body)


def test_claude_gets_signed_links_and_the_files_are_gone_afterwards():
    async def body(m, fake, media, signed):
        fake.answers = [{"notes": "A small kitchen with a sticky door."}]
        result = await m.async_room_photos("Kitchen", "", _photos(2), via="claude")
        assert result["notes"] == "A small kitchen with a sticky door."
        text = fake.fires[0]["body"]["text"]
        assert len(signed) == 2
        for path, _seconds in signed:
            assert f"https://ha.example.org{path}?authSig=SIGNED" in text
            assert path.startswith(f"/media/local/{manager_module.PHOTO_DIR}/") and path.endswith(".jpg")
        assert [s[1] for s in signed] == [manager_module.PHOTO_LINK_SECONDS] * 2  # a few minutes only
        assert not (media / manager_module.PHOTO_DIR).exists()  # deleted (and the folder with them)
        assert TOKEN not in text

    with_media(body)


def test_the_scene_from_photos_also_goes_to_claude():
    async def body(m, fake, media, signed):
        fake.answers = [{"notes": "Dishes in the sink."}]
        result = await m.async_scene_from_photos("Tidy the kitchen", _photos(1), via="claude")
        assert result["scene"] == "Dishes in the sink."
        assert len(fake.fires) == 1

    with_media(body)


def test_files_are_deleted_also_when_claude_fails():
    async def body(m, fake, media, signed):
        fake.status = 401
        with pytest.raises(manager_module.BoopliError):
            await m.async_room_photos("Kitchen", "", _photos(2), via="claude")
        assert not (media / manager_module.PHOTO_DIR).exists()

    with_media(body)


def test_nothing_is_written_when_claude_cannot_reach_home_assistant():
    async def body(m, fake, media, signed):
        m.settings.ai.claude_ha_url = ""
        with patch.object(manager_module, "get_url", side_effect=manager_module.NoURLAvailableError):
            with pytest.raises(manager_module.BoopliError) as err:
                await m.async_room_photos("Kitchen", "", _photos(1), via="claude")
        assert "web address" in str(err.value)
        assert not (media / manager_module.PHOTO_DIR).exists()
        assert fake.fires == []

    with_media(body)


def test_a_retry_after_an_unreadable_answer_gets_fresh_links():
    async def body(m, fake, media, signed):
        fake.answers = ["{ broken", {"notes": "Fine."}]
        result = await m.async_room_photos("Kitchen", "", _photos(1), via="claude")
        assert result["notes"] == "Fine."
        assert len(fake.fires) == 2 and len(signed) == 2

    with_media(body)


# --- CodeRabbit round: safer token save, checked fire address, protected callback text -----------


def test_a_failed_token_save_keeps_the_old_token():
    async def body(m, fake):
        # The failure is at the file write itself (Home Assistant's Store would hide this one).
        with patch.object(manager_module, "write_utf8_file_atomic", side_effect=OSError("disk full")):
            with pytest.raises(manager_module.BoopliError) as err:
                await m.async_set_claude_token("N" * 40)
        assert "old one is still in use" in str(err.value)
        assert m._claude_token == TOKEN  # nothing changed in the running manager
        assert m.claude_status()["token_set"] is True

    run(body)


def test_the_token_never_goes_to_an_address_that_is_not_a_routine():
    async def body(m, fake):
        # As if an imported backup had brought this address in, without the normal save check.
        m.settings.ai.claude_fire_url = "https://evil.example.com/collect"
        message = await _error(m)
        assert "Enter a routine trigger URL" in message
        assert fake.fires == []
        assert m.claude_status()["fires_left"] == routine.MAX_FIRES_PER_HOUR  # no fire was counted

    run(body)


def test_a_long_task_is_shortened_but_the_answer_address_stays():
    long_task = "word " * 30_000
    text = routine.fire_text(long_task, "abc123", "https://ha.example.org/api/webhook/hook", ["https://ha.example.org/p1"])
    assert len(text) <= routine.MAX_TEXT
    assert "https://ha.example.org/api/webhook/hook" in text
    assert '"request_id": "abc123"' in text
    assert "https://ha.example.org/p1" in text
    assert text.index("Pictures") < text.index("POST ")  # look first, answer last


def test_a_request_that_cannot_fit_is_refused_before_a_fire_is_counted():
    async def body(m, fake):
        with pytest.raises(routine.RoutineError):
            routine.fire_text("x", "id", "https://ha.example.org/h", ["https://ha.example.org/" + "p" * 70_000])
        m.settings.ai.claude_ha_url = "https://ha.example.org/" + "a" * 70_000
        message = await _error(m)
        assert "too big for Claude" in message
        assert fake.fires == []
        assert m.claude_status()["fires_left"] == routine.MAX_FIRES_PER_HOUR

    run(body)


def test_the_panel_is_told_which_host_to_allow():
    m = make_manager()
    assert m.claude_status()["callback_host"] == "ha.example.org"
    m.settings.ai.claude_ha_url = "https://ha.example.org:8443/"
    assert m.claude_status()["callback_host"] == "ha.example.org"
    m.settings.ai.claude_ha_url = ""
    with patch.object(manager_module, "get_url", return_value="https://home.example.net"):
        assert m.claude_status()["callback_host"] == "home.example.net"
    with patch.object(manager_module, "get_url", side_effect=manager_module.NoURLAvailableError):
        assert m.claude_status()["callback_host"] == ""
