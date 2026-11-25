"""Messages that can be shown in the person's own language, and the AI prompts' language line."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).parents[1]))

from custom_components.boopli import engine, manager as manager_module, websocket_api  # noqa: E402
from custom_components.boopli.errors import BoopliError, Msg, message_key  # noqa: E402

ROOT = Path(__file__).parents[1]


def test_a_message_keeps_its_template_and_values():
    err = BoopliError("No chore called {ref}.", ref="Dishes")
    assert str(err) == "No chore called Dishes."
    assert err.template == "No chore called {ref}."
    assert err.params == {"ref": "Dishes"}
    assert err.code == message_key("No chore called {ref}.")


def test_a_plain_message_works_without_values():
    err = BoopliError("Give the chore a name.")
    assert str(err) == "Give the chore a name."
    assert err.params == {}
    assert err.code.startswith("give_the_chore_a_name_")


def test_the_key_does_not_change_with_the_values_and_differs_between_messages():
    few = BoopliError("At most {n} rooms.", n=3)
    many = BoopliError("At most {n} rooms.", n=40)
    assert str(few) != str(many)  # the text has the values in it ...
    assert few.code == many.code  # ... and the key does not change with them
    assert message_key("At most {n} rooms.") != message_key("At most {n} chores.")


def test_a_message_from_a_validator_survives_being_raised():
    text = engine.Msg("A chore can have at most {max_steps} steps.", max_steps=50)
    assert text == "A chore can have at most 50 steps."  # still a normal string
    err = BoopliError(text)
    assert err.template == "A chore can have at most {max_steps} steps."
    assert err.params == {"max_steps": 50}
    assert Msg is engine.Msg


def test_another_error_can_be_wrapped_without_losing_its_values():
    inner = BoopliError("Boopli stopped waiting for Claude’s reply. Wait limit (minutes): {minutes}. Try again.", minutes=5)
    outer = BoopliError(inner)
    assert outer.code == inner.code
    assert outer.params == {"minutes": 5}
    assert str(outer) == str(inner)


def test_other_errors_become_plain_messages():
    err = BoopliError(ValueError("boom {x}"))
    assert str(err) == "boom {x}"  # a stray brace in someone else's text is not a template
    assert err.params == {}


def test_the_panel_gets_the_key_and_the_values():
    connection = MagicMock()
    websocket_api._send_error(connection, {"id": 7}, "invalid", BoopliError("No chore called {ref}.", ref="X"))
    args, kwargs = connection.send_error.call_args
    assert args == (7, "invalid", "No chore called X.")
    assert kwargs["translation_key"] == message_key("No chore called {ref}.")
    assert kwargs["translation_placeholders"] == {"ref": "X"}


def test_a_reply_that_carries_another_error_can_be_sent_as_json():
    from homeassistant.helpers.json import json_encoder_default
    import orjson

    connection = MagicMock()
    err = BoopliError("The AI agent answered with an error: {error}", error=RuntimeError("quota used up"))
    websocket_api._send_error(connection, {"id": 3}, "ai_failed", err)
    kwargs = connection.send_error.call_args.kwargs
    sent = orjson.loads(orjson.dumps(kwargs["translation_placeholders"], default=json_encoder_default))
    assert sent == {"error": "quota used up"}
    assert connection.send_error.call_args.args[2] == "The AI agent answered with an error: quota used up"


def test_a_reason_inside_a_message_is_sent_as_a_message_of_its_own():
    """"Step 'x': {error}" must reach the panel with the reason's own key, so it is translated too."""
    reason = Msg("An image file path can have up to {picture_max} characters.", picture_max=120)
    outer = BoopliError(Msg("Step '{title}': {error}", title="Pills", error=reason))
    connection = MagicMock()
    websocket_api._send_error(connection, {"id": 4}, "invalid", outer)
    values = connection.send_error.call_args.kwargs["translation_placeholders"]
    assert values["title"] == "Pills"
    assert values["error"] == {
        "key": message_key("An image file path can have up to {picture_max} characters."),
        "params": {"picture_max": 120},
        "text": "An image file path can have up to 120 characters.",
    }


def test_a_plain_reason_from_a_validator_is_still_translatable():
    """A picture that is not allowed: the reason is a plain text, and it must keep its own key too."""
    chore = engine.Chore.from_dict({"name": "Pills", "steps": [{"title": "Look", "image": "http://bad.example/x.jpg"}]})
    problem = engine.validate_chore(chore, ["standard"])
    assert problem is not None and problem.template == "Step '{title}': {error}"
    connection = MagicMock()
    websocket_api._send_error(connection, {"id": 5}, "invalid", BoopliError(problem))
    reason = connection.send_error.call_args.kwargs["translation_placeholders"]["error"]
    assert reason["key"] == message_key(reason["text"])  # a text without values is its own template


def test_the_real_websocket_connection_sends_the_key_and_the_nested_values():
    """Not a mock of send_error: Home Assistant's own ActiveConnection builds the reply, which must be valid JSON."""
    import logging

    import orjson
    from homeassistant.components.websocket_api.connection import ActiveConnection
    from homeassistant.helpers.json import json_encoder_default

    sent: list = []
    class Connection:  # a connection needs a whole socket: only the real send_error is borrowed
        send_message = staticmethod(sent.append)
        send_error = ActiveConnection.send_error

    connection = Connection()
    chore = engine.Chore.from_dict({"name": "Pills", "steps": [{"title": "Look", "image": "http://bad.example/x.jpg"}]})
    problem = engine.validate_chore(chore, ["standard"])
    websocket_api._send_error(connection, {"id": 12}, "invalid", BoopliError(problem))
    raw = sent[0]  # Home Assistant turns the reply into JSON itself (bytes), or hands over a dict
    reply = orjson.loads(raw) if isinstance(raw, (bytes, str)) else orjson.loads(orjson.dumps(raw, default=json_encoder_default))
    error = reply["error"]
    assert error["code"] == "invalid"
    assert error["message"].startswith("Step 'Look': ")
    assert error["translation_key"] == message_key("Step '{title}': {error}")
    assert error["translation_placeholders"]["title"] == "Look"
    assert error["translation_placeholders"]["error"]["text"] in error["message"]


def test_a_number_stays_a_number_in_the_values():
    connection = MagicMock()
    websocket_api._send_error(connection, {"id": 1}, "invalid", BoopliError("At most {max_steps} steps.", max_steps=30))
    assert connection.send_error.call_args.kwargs["translation_placeholders"] == {"max_steps": 30}


def test_the_ai_preview_shows_the_language_line_that_is_sent():
    manager = make_manager("de")
    manager.rooms_text = MagicMock(return_value=("", False))
    manager._check_kind = MagicMock(return_value="chore")
    preview = manager.ai_preview("Clean the desk", "chore", None, "", None)
    assert 'the language with the code "de"' in preview["instructions"]


def test_a_foreign_error_is_sent_as_text_only():
    connection = MagicMock()
    websocket_api._send_error(connection, {"id": 1}, "ai_failed", RuntimeError("down"))
    connection.send_error.assert_called_once_with(1, "ai_failed", "down")


def _spec(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def test_the_panels_error_texts_match_the_messages_in_the_integration():
    """Run `python scripts/sync_error_messages.py` when this fails: a message was added or changed."""
    sync = _spec(ROOT / "scripts" / "sync_error_messages.py", "boopli_sync_error_messages")
    written = json.loads((ROOT / "frontend" / "src" / "i18n" / "en.json").read_text(encoding="utf8"))["errors"]
    assert sync.expected() == written


def make_manager(language):
    hass = MagicMock()
    hass.config.language = language
    return manager_module.BoopliManager(hass)


def test_the_agent_is_asked_to_write_in_the_language_of_the_house():
    text = make_manager("de")._with_language("Split the task into steps.")
    assert text.startswith("Split the task into steps.")
    assert 'the language with the code "de"' in text
    assert "JSON keys" in text


def test_english_and_unknown_languages_leave_the_prompt_alone():
    for language in ("en", "en-GB", "EN", "", None, MagicMock()):
        assert make_manager(language)._with_language("Split.") == "Split."
