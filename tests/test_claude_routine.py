"""Ask Claude: the optional routine. A fake routine server stands in for Claude's cloud."""

from __future__ import annotations

import asyncio
import json
import re
import sys
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
    m = manager_module.BoopliManager(hass)
    m._secret_store = MagicMock(async_save=AsyncMock(), async_load=AsyncMock(return_value={}))
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
    [(401, "refused the token"), (403, "refused the token"), (404, "does not know"), (429, "too often"), (503, "trouble")],
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
        assert "did not send an answer" in message

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
        assert "this hour" in message
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
    if isinstance(body, Exception):
        request.json = AsyncMock(side_effect=body)
    else:
        request.json = AsyncMock(return_value=body)
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


# --- the token is a secret -----------------------------------------------------------------------


def test_the_token_is_nowhere_in_what_the_panel_or_a_backup_gets():
    async def body(m, fake):
        await m.async_set_claude_token("  " + TOKEN + "  ")
        assert m._claude_token == TOKEN
        saved = m._secret_store.async_save.call_args.args[0]
        assert saved["token"] == TOKEN  # it is kept, in its own place

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
