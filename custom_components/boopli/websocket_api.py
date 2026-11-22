"""Websocket commands used by the Boopli panel."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import breakdown, engine
from .const import DOMAIN
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
    websocket_api.async_register_command(hass, ws_part_park)
    websocket_api.async_register_command(hass, ws_part_time)
    websocket_api.async_register_command(hass, ws_step_complete)
    websocket_api.async_register_command(hass, ws_step_snooze)
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
    websocket_api.async_register_command(hass, ws_chat_prompt)
    websocket_api.async_register_command(hass, ws_paste_notes)
    websocket_api.async_register_command(hass, ws_task_add)
    websocket_api.async_register_command(hass, ws_test_channel)


def _not_loaded(connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_error(msg["id"], "not_loaded", "Boopli is not set up.")


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
        connection.send_error(msg["id"], "invalid", str(err))
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
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {vol.Required("type"): "boopli/chore_start", vol.Required("chore_id"): str}
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
        run = manager.start_chore(msg["chore_id"])
    except BoopliError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"run_id": run.id})


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
        connection.send_error(msg["id"], "invalid", str(err))
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
        connection.send_error(msg["id"], "invalid", str(err))
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
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"])


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
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"times": times})


_AI_FIELDS = {
    vol.Required("task"): str,
    vol.Optional("kind", default="now"): str,
    vol.Optional("answers", default=[]): list,
    vol.Optional("notes", default=""): str,
    # The rooms whose notes go along. Left out = guess them from the task text.
    vol.Optional("rooms"): [str],
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
        connection.send_error(msg["id"], "invalid", str(err))
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
            msg["task"], msg["kind"], msg["answers"], msg["notes"], msg.get("rooms")
        )
    except BoopliError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], result)


_ROOM_FIELDS = {
    vol.Required("room"): str,  # the room's name
    vol.Optional("notes", default=""): str,
    vol.Optional("answers", default=[]): list,
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
        result = await manager.async_room_questions(msg["room"], msg["notes"], msg["answers"])
    except BoopliError as err:
        connection.send_error(msg["id"], "ai_failed", str(err))
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
        result = await manager.async_room_notes(msg["room"], msg["notes"], msg["answers"])
    except BoopliError as err:
        connection.send_error(msg["id"], "ai_failed", str(err))
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
            msg["task"], msg["kind"], msg["answers"], msg["notes"], msg.get("rooms")
        )
    except BoopliError as err:
        connection.send_error(msg["id"], "ai_failed", str(err))
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
            msg["task"], msg["kind"], msg["answers"], msg["notes"], msg.get("rooms")
        )
    except BoopliError as err:
        connection.send_error(msg["id"], "ai_failed", str(err))
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/room_photos",
        vol.Required("room"): str,
        vol.Optional("notes", default=""): str,
        vol.Required("photos"): [str],  # base64, shrunk by the panel; never stored
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
        result = await manager.async_room_photos(msg["room"], msg["notes"], msg["photos"])
    except BoopliError as err:
        connection.send_error(msg["id"], "ai_failed", str(err))
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
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], result)


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
        connection.send_error(msg["id"], "invalid", str(err))
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
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/test_channel",
        vol.Required("kind"): vol.In(["light", "phone", "speaker", "alarm_device"]),
        vol.Optional("light"): dict,
        vol.Optional("phone"): dict,
        vol.Optional("speaker"): dict,
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
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], result)
