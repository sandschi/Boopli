"""Websocket commands used by the Boopli panel."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store
from homeassistant.loader import async_get_integration

from . import breakdown, engine
from .const import DOMAIN
from .errors import message_key
from .manager import BoopliError, BoopliManager


def _manager(hass: HomeAssistant) -> BoopliManager | None:
    return hass.data.get(DOMAIN)


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all Boopli websocket commands (once)."""
    websocket_api.async_register_command(hass, ws_state)
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_chore_save)
    websocket_api.async_register_command(hass, ws_chore_delete)
    websocket_api.async_register_command(hass, ws_chore_start)
    websocket_api.async_register_command(hass, ws_questions_answer)
    websocket_api.async_register_command(hass, ws_away_set)
    websocket_api.async_register_command(hass, ws_away_end)
    websocket_api.async_register_command(hass, ws_egg_found)
    websocket_api.async_register_command(hass, ws_part_park)
    websocket_api.async_register_command(hass, ws_part_time)
    websocket_api.async_register_command(hass, ws_step_complete)
    websocket_api.async_register_command(hass, ws_step_snooze)
    websocket_api.async_register_command(hass, ws_step_on_it)
    websocket_api.async_register_command(hass, ws_step_not_on_it)
    websocket_api.async_register_command(hass, ws_settings_save)
    websocket_api.async_register_command(hass, ws_setup_save)
    websocket_api.async_register_command(hass, ws_schedule_preview)
    websocket_api.async_register_command(hass, ws_ai_questions)
    websocket_api.async_register_command(hass, ws_ai_steps)
    websocket_api.async_register_command(hass, ws_ai_defaults)
    websocket_api.async_register_command(hass, ws_home_save)
    websocket_api.async_register_command(hass, ws_home_sync)
    websocket_api.async_register_command(hass, ws_rooms_guess)
    websocket_api.async_register_command(hass, ws_ai_preview)
    websocket_api.async_register_command(hass, ws_room_questions)
    websocket_api.async_register_command(hass, ws_room_notes)
    websocket_api.async_register_command(hass, ws_room_photos)
    websocket_api.async_register_command(hass, ws_scene_photos)
    websocket_api.async_register_command(hass, ws_chat_prompt)
    websocket_api.async_register_command(hass, ws_paste_notes)
    websocket_api.async_register_command(hass, ws_task_add)
    websocket_api.async_register_command(hass, ws_test_channel)
    websocket_api.async_register_command(hass, ws_claude_token)
    websocket_api.async_register_command(hass, ws_claude_test)
    websocket_api.async_register_command(hass, ws_sound_test_get)  # TEMPORARY
    websocket_api.async_register_command(hass, ws_sound_test_set)  # TEMPORARY
    websocket_api.async_register_command(hass, ws_backup_export)
    websocket_api.async_register_command(hass, ws_backup_preview)
    websocket_api.async_register_command(hass, ws_backup_import)


def _wire_values(params: dict[str, Any]) -> dict[str, Any]:
    """The values of a message as JSON. A value that is itself a Boopli message (a reason inside
    "Step 'x': {error}") goes as {key, params, text} so the panel can translate it too; any other
    object (an error from outside) becomes its text."""
    out: dict[str, Any] = {}
    for name, value in params.items():
        if getattr(value, "template", None) is not None:
            out[name] = {"key": message_key(value.template), "params": _wire_values(getattr(value, "params", {})), "text": str(value)}
        elif isinstance(value, (str, int, float, bool)) or value is None:
            out[name] = value
        else:
            out[name] = str(value)
    return out


def _wire_note(result: dict[str, Any]) -> dict[str, Any]:
    """A test result with its note as a message: the English text stays in `note`, and `note_key` and
    `note_params` let the panel show the note in its own language."""
    note = result.get("note")
    template = getattr(note, "template", None)
    if template is None:
        return result
    return {
        **result,
        "note": str(note),
        "note_key": message_key(template),
        "note_params": _wire_values(getattr(note, "params", {})),
    }


def _send_error(
    connection: websocket_api.ActiveConnection, msg: dict[str, Any], code: str, err: Exception
) -> None:
    """Send a problem to the panel. The panel shows its own translation of err.code, and the English text is the fallback."""
    if isinstance(err, BoopliError):
        connection.send_error(
            msg["id"],
            code,
            str(err),
            translation_key=err.code,
            translation_domain=DOMAIN,
            translation_placeholders=_wire_values(err.params),
        )
    else:
        connection.send_error(msg["id"], code, str(err))


def _not_loaded(connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    _send_error(connection, msg, "not_loaded", BoopliError("Boopli is not set up."))


@websocket_api.websocket_command({vol.Required("type"): "boopli/state"})
@callback
def ws_state(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return a snapshot of everything the panel shows."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    connection.send_result(msg["id"], manager.snapshot())


@websocket_api.websocket_command({vol.Required("type"): "boopli/subscribe"})
@callback
def ws_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Push a fresh snapshot to the panel whenever anything changes."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return

    @callback
    def forward() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], manager.snapshot())
        )

    connection.subscriptions[msg["id"]] = manager.async_add_listener(forward)
    connection.send_result(msg["id"])
    forward()


@websocket_api.websocket_command(
    {vol.Required("type"): "boopli/chore_save", vol.Required("chore"): dict}
)
@callback
def ws_chore_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Create or update a chore."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        chore = manager.save_chore(msg["chore"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], {"id": chore.id})


@websocket_api.websocket_command(
    {vol.Required("type"): "boopli/chore_delete", vol.Required("chore_id"): str}
)
@callback
def ws_chore_delete(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Delete a chore (and any run in progress)."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        manager.delete_chore(msg["chore_id"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"])


_ANSWERS = vol.Schema({str: bool})  # question id -> yes


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/chore_start",
        vol.Required("chore_id"): str,
        # The answers to the chore's questions; left out, the chore asks them afterwards.
        vol.Optional("answers"): _ANSWERS,
    }
)
@callback
def ws_chore_start(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Start a chore now."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        run = manager.start_chore(msg["chore_id"], msg.get("answers"))
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], {"run_id": run.id})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/away_set",
        # Local "YYYY-MM-DDTHH:MM"; empty start = now, empty until = until switched off.
        vol.Optional("start", default=""): str,
        vol.Optional("until", default=""): str,
        # chore id -> keeps going while away
        vol.Optional("keep_going"): _ANSWERS,
    }
)
@callback
def ws_away_set(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Switch away mode on, or change it."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        manager.set_away(msg["start"], msg["until"], msg.get("keep_going"))
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "boopli/away_end"})
@callback
def ws_away_end(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Back now."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    manager.end_away()
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/questions_answer",
        vol.Required("run_id"): str,
        vol.Required("answers"): _ANSWERS,  # an empty object means "start with all steps"
    }
)
@callback
def ws_questions_answer(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Answer the questions of a running chore."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    manager.answer_questions(msg["run_id"], msg["answers"])
    connection.send_result(msg["id"])


_PARK_FIELDS = {
    vol.Required("when"): vol.In(["any", "tomorrow", "at"]),
    vol.Optional("at", default=""): str,  # local "YYYY-MM-DDTHH:MM" when `when` is "at"
}


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/part_park",
        vol.Required("run_id"): str,
        vol.Required("group"): str,
        **_PARK_FIELDS,
    }
)
@callback
def ws_part_park(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Set a part of a running task aside to do later."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        chore = manager.park_part(msg["run_id"], msg["group"], msg["when"], msg["at"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], {"chore_id": chore.id})


@websocket_api.websocket_command(
    {vol.Required("type"): "boopli/part_time", vol.Required("chore_id"): str, **_PARK_FIELDS}
)
@callback
def ws_part_time(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Change when a parked part comes back."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        manager.set_parked_time(msg["chore_id"], msg["when"], msg["at"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], {})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/step_complete",
        vol.Required("run_id"): str,
        vol.Required("step_id"): str,
    }
)
@callback
def ws_step_complete(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The user pressed Done on a step."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    manager.complete_step(msg["run_id"], msg["step_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/step_snooze",
        vol.Required("run_id"): str,
        vol.Required("step_id"): str,
    }
)
@callback
def ws_step_snooze(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The user pressed Snooze on a step."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    manager.snooze(msg["run_id"], msg["step_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/step_on_it",
        vol.Required("run_id"): str,
        vol.Required("step_id"): str,
    }
)
@callback
def ws_step_on_it(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The user pressed "On it" (or "Still on it") on a step."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    manager.on_it(msg["run_id"], msg["step_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/step_not_on_it",
        vol.Required("run_id"): str,
        vol.Required("step_id"): str,
    }
)
@callback
def ws_step_not_on_it(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The user took "On it" back."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    manager.not_on_it(msg["run_id"], msg["step_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {vol.Required("type"): "boopli/settings_save", vol.Required("settings"): dict}
)
@callback
def ws_settings_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Save the settings from the Settings screen."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        manager.save_settings(msg["settings"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    # The ladders as saved (a new device may have been added to the standard ones), so a screen keeping its own copy can follow.
    connection.send_result(msg["id"], {"ladders": manager.snapshot()["settings"]["ladders"]})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/schedule_preview",
        vol.Required("repeat"): dict,
        vol.Optional("count", default=5): vol.All(int, vol.Range(min=1, max=10)),
    }
)
@callback
def ws_schedule_preview(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The next due times of a schedule, worked out by the integration itself."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        times = manager.preview_schedule(msg["repeat"], msg["count"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], {"times": times})


_AI_FIELDS = {
    vol.Required("task"): str,
    vol.Optional("kind", default="now"): str,
    vol.Optional("answers", default=[]): list,
    vol.Optional("notes", default=""): str,
    # The rooms whose notes go along. Left out = guess them from the task text.
    vol.Optional("rooms"): [str],
    # What the place looks like today, from a one-time look at photos (text only).
    vol.Optional("scene", default=""): str,
    vol.Optional("via", default="agent"): str,  # "agent" (Home Assistant's) or "claude" (the routine)
}


@websocket_api.websocket_command({vol.Required("type"): "boopli/home_save", vol.Required("home"): dict})
@callback
def ws_home_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Save the rooms and their notes."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        manager.save_home(msg["home"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "boopli/home_sync"})
@callback
def ws_home_sync(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Add rooms for new Home Assistant areas and return the home."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    manager.sync_areas()
    connection.send_result(msg["id"], engine.to_dict(manager.home))


@websocket_api.websocket_command({vol.Required("type"): "boopli/rooms_guess", vol.Required("task"): str})
@callback
def ws_rooms_guess(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Which rooms a task is about, guessed from the words in it."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    connection.send_result(msg["id"], {"rooms": manager.guess_rooms(msg["task"])})


@websocket_api.websocket_command({vol.Required("type"): "boopli/ai_preview", **_AI_FIELDS})
@callback
def ws_ai_preview(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Exactly what the first request to the AI would contain."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = manager.ai_preview(
            msg["task"], msg["kind"], msg["answers"], msg["notes"], msg.get("rooms"), msg["scene"]
        )
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], result)


_ROOM_FIELDS = {
    vol.Required("room"): str,  # the room's name
    vol.Optional("notes", default=""): str,
    vol.Optional("answers", default=[]): list,
    vol.Optional("via", default="agent"): str,
}


@websocket_api.websocket_command({vol.Required("type"): "boopli/room_questions", **_ROOM_FIELDS})
@websocket_api.async_response
async def ws_room_questions(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Ask the user's AI agent what it still wants to know about a room."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = await manager.async_room_questions(
            msg["room"], msg["notes"], msg["answers"], msg["via"]
        )
    except BoopliError as err:
        _send_error(connection, msg, "ai_failed", err)
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): "boopli/room_notes", **_ROOM_FIELDS})
@websocket_api.async_response
async def ws_room_notes(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Ask the user's AI agent to write a room's notes (nothing is saved)."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = await manager.async_room_notes(
            msg["room"], msg["notes"], msg["answers"], msg["via"]
        )
    except BoopliError as err:
        _send_error(connection, msg, "ai_failed", err)
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): "boopli/ai_questions", **_AI_FIELDS})
@websocket_api.async_response
async def ws_ai_questions(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Ask the user's AI agent what it still needs to know about a task."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = await manager.async_ai_questions(
            msg["task"],
            msg["kind"],
            msg["answers"],
            msg["notes"],
            msg.get("rooms"),
            msg["scene"],
            msg["via"],
        )
    except BoopliError as err:
        _send_error(connection, msg, "ai_failed", err)
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): "boopli/ai_steps", **_AI_FIELDS})
@websocket_api.async_response
async def ws_ai_steps(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Ask the user's AI agent to split a task into small steps."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = await manager.async_ai_steps(
            msg["task"],
            msg["kind"],
            msg["answers"],
            msg["notes"],
            msg.get("rooms"),
            msg["scene"],
            msg["via"],
        )
    except BoopliError as err:
        _send_error(connection, msg, "ai_failed", err)
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/room_photos",
        vol.Required("room"): str,
        vol.Optional("notes", default=""): str,
        vol.Required("photos"): [str],  # base64, shrunk by the panel; never stored
        vol.Optional("via", default="agent"): str,
    }
)
@websocket_api.async_response
async def ws_room_photos(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Describe a room from photos, one time (the photos are deleted right after)."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = await manager.async_room_photos(
            msg["room"], msg["notes"], msg["photos"], msg["via"]
        )
    except BoopliError as err:
        _send_error(connection, msg, "ai_failed", err)
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/scene_photos",
        vol.Required("task"): str,
        vol.Required("photos"): [str],  # base64, shrunk by the panel; never stored
        vol.Optional("rooms"): [str],  # the rooms whose notes help the agent
        vol.Optional("via", default="agent"): str,
    }
)
@websocket_api.async_response
async def ws_scene_photos(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Describe what a place looks like today from photos, one time (photos are deleted)."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = await manager.async_scene_from_photos(
            msg["task"], msg["photos"], msg.get("rooms"), msg["via"]
        )
    except BoopliError as err:
        _send_error(connection, msg, "ai_failed", err)
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/chat_prompt",
        vol.Optional("room", default=""): str,  # empty = the whole home
        vol.Optional("notes", default=""): str,
        vol.Optional("include_notes", default=True): bool,
        # the panel's current rooms (it may have unsaved edits); default: the saved ones
        vol.Optional("rooms"): [{vol.Required("name"): str, vol.Optional("notes", default=""): str}],
    }
)
@callback
def ws_chat_prompt(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The text to copy into the person's own AI chat (nothing leaves Home Assistant)."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    if msg["room"].strip():
        prompt = manager.room_chat_prompt(msg["room"], msg["notes"], msg["include_notes"])
    else:
        prompt = manager.home_chat_prompt(
            msg["include_notes"],
            [(r["name"], r["notes"]) for r in msg["rooms"]] if "rooms" in msg else None,
        )
    connection.send_result(msg["id"], {"prompt": prompt})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/paste_notes",
        vol.Required("text"): str,
        vol.Optional("whole_home", default=False): bool,
        # the panel's current rooms, so a room it has not saved yet still matches
        vol.Optional("rooms"): [{vol.Required("id"): str, vol.Required("name"): str}],
    }
)
@callback
def ws_paste_notes(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Clean up notes pasted back from the person's own AI chat (nothing is saved)."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = (
            manager.paste_home(msg["text"], [(r["id"], r["name"]) for r in msg["rooms"]] if "rooms" in msg else None)
            if msg["whole_home"]
            else manager.paste_room(msg["text"])
        )
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): "boopli/egg_found"})
@callback
def ws_egg_found(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The Easter egg played. The first time it gives a small gift of XP."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    connection.send_result(msg["id"], {"xp": manager.found_egg()})


@websocket_api.websocket_command({vol.Required("type"): "boopli/ai_defaults"})
@callback
def ws_ai_defaults(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The built-in prompts, so Settings can show them and reset to them."""
    connection.send_result(
        msg["id"],
        {
            "questions_prompt": breakdown.QUESTIONS_PROMPT,
            "steps_prompt": breakdown.STEPS_PROMPT,
            "chat_room_prompt": breakdown.ROOM_CHAT_PROMPT,
            "chat_home_prompt": breakdown.HOME_CHAT_PROMPT,
        },
    )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/task_add",
        vol.Required("title"): str,
        vol.Required("steps"): list,
        vol.Optional("notes", default=""): str,
        vol.Optional("where", default="home"): str,
    }
)
@callback
def ws_task_add(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Create a one-off task from reviewed steps and start it."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        run = manager.add_task_steps(
            msg["title"], msg["steps"], msg["notes"], msg["where"]
        )
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], {"run_id": run.id})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/setup_save",
        vol.Required("status"): str,
        vol.Optional("step"): str,
    }
)
@callback
def ws_setup_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Remember how far the setup wizard got (opened, skipped, done)."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        manager.save_setup({"status": msg["status"], "step": msg.get("step", "")})
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/test_channel",
        vol.Required("kind"): vol.In(["light", "phone", "speaker", "alarm_device"]),
        vol.Optional("light"): dict,
        vol.Optional("phone"): dict,
        vol.Optional("speaker"): dict,
        vol.Optional("sounds"): list,
        vol.Optional("level"): str,
        vol.Optional("alarm_device"): dict,
    }
)
@websocket_api.async_response
async def ws_test_channel(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Try a light or a phone so the user sees what a nudge looks like."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = await manager.async_test_channel(msg)
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], _wire_note(result))


# --- TEMPORARY: which Alexa sounds really play (see frontend/src/boopli-sound-test.ts) -----------------
# The marks live in their own small file, apart from Boopli's data, and every change is also written to the log
# so it can be read from there. Remove with the "Try the sounds" window.

_SOUND_TEST_LOGGER = logging.getLogger(__name__)
_SOUND_TEST_KEY = "boopli_sound_test"
_SOUND_TEST_LOCK = asyncio.Lock()


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "boopli/sound_test_get"})
@websocket_api.async_response
async def ws_sound_test_get(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The marks set so far: sound id -> "ok" or "bad"."""
    data = await Store(hass, 1, _SOUND_TEST_KEY).async_load() or {}
    connection.send_result(msg["id"], {"marks": data.get("marks", {})})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/sound_test_set",
        vol.Required("sound"): vol.All(str, vol.Match(r"^amzn_sfx_[a-z0-9_]{1,80}$")),
        vol.Required("mark"): vol.In(["ok", "bad", ""]),
    }
)
@websocket_api.async_response
async def ws_sound_test_set(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Mark one sound as working, not working, or take the mark back ("")."""
    # one lock around load, change and save: two marks set a moment apart must not overwrite each other
    async with _SOUND_TEST_LOCK:
        store: Store[dict[str, Any]] = Store(hass, 1, _SOUND_TEST_KEY)
        data = await store.async_load() or {}
        marks: dict[str, str] = dict(data.get("marks", {}))
        if msg["mark"]:
            marks[msg["sound"]] = msg["mark"]
        else:
            marks.pop(msg["sound"], None)
        await store.async_save({"marks": marks})
    _SOUND_TEST_LOGGER.warning("Boopli sound test: %s = %s", msg["sound"], msg["mark"] or "open")
    connection.send_result(msg["id"])


# --- backup of the setup (admins only: a backup holds private data, an import replaces it) ---------


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/backup_export",
        vol.Required("parts"): [vol.In(engine.BACKUP_PARTS)],
    }
)
@websocket_api.async_response
async def ws_backup_export(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The backup file, with the parts asked for."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    integration = await async_get_integration(hass, DOMAIN)
    try:
        backup = manager.export_backup(msg["parts"], str(integration.version))
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], backup)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/backup_preview",
        vol.Required("backup"): dict,
        vol.Required("parts"): [vol.In(engine.BACKUP_PARTS)],
    }
)
@callback
def ws_backup_preview(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """What importing a backup file would do. Changes nothing."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = manager.preview_backup(msg["backup"], msg["parts"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], result)


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/backup_import",
        vol.Required("backup"): dict,
        vol.Required("parts"): [vol.In(engine.BACKUP_PARTS)],
    }
)
@callback
def ws_backup_import(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Replace the parts picked with what the backup file holds."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = manager.import_backup(msg["backup"], msg["parts"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], result)


# --- Ask Claude (the optional routine; admins only: it holds a secret and costs fires) -----------


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "boopli/claude_token", vol.Required("token"): str}
)
@websocket_api.async_response
async def ws_claude_token(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Store the Claude routine's token (empty removes it). The panel never gets it back."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        await manager.async_set_claude_token(msg["token"])
    except BoopliError as err:
        _send_error(connection, msg, "invalid", err)
        return
    connection.send_result(msg["id"], manager.claude_status())


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "boopli/claude_test"})
@websocket_api.async_response
async def ws_claude_test(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Ask the routine for a tiny answer and report the round-trip time."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        result = await manager.async_test_claude()
    except BoopliError as err:
        _send_error(connection, msg, "ai_failed", err)
        return
    connection.send_result(msg["id"], result)
