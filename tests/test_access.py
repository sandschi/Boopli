"""Access levels (#18): who may do what, checked in the integration and not only hidden in the panel."""

from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))

from homeassistant.exceptions import Unauthorized  # noqa: E402

from custom_components.boopli import manager as manager_module, websocket_api  # noqa: E402
from custom_components.boopli.const import (  # noqa: E402
    ACCESS_ADMIN,
    ACCESS_ALL,
    ACCESS_DEFAULT,
    ACCESS_NOTES,
    ACCESS_USE,
    DOMAIN,
)

ADMIN = SimpleNamespace(is_admin=True)
PERSON = SimpleNamespace(is_admin=False)

# What each command needs. A new command has to be added here, so someone decides on purpose.
EXPECTED = {
    "state": ACCESS_USE,
    "subscribe": ACCESS_USE,
    "chore_skip": ACCESS_USE,
    "chore_start": ACCESS_USE,
    "questions_answer": ACCESS_USE,
    "away_set": ACCESS_USE,
    "away_end": ACCESS_USE,
    "egg_found": ACCESS_USE,
    "shop_buy": ACCESS_USE,
    "shop_place": ACCESS_USE,
    "feed": ACCESS_USE,
    "quest_seen": ACCESS_USE,
    "news_seen": ACCESS_USE,
    "part_park": ACCESS_USE,
    "part_time": ACCESS_USE,
    "step_complete": ACCESS_USE,
    "step_release": ACCESS_USE,
    "step_snooze": ACCESS_USE,
    "step_on_it": ACCESS_USE,
    "step_not_on_it": ACCESS_USE,
    "chat_prompt": ACCESS_USE,
    "home_save": ACCESS_NOTES,
    "home_sync": ACCESS_NOTES,
    "rooms_guess": ACCESS_NOTES,
    "room_questions": ACCESS_NOTES,
    "room_notes": ACCESS_NOTES,
    "room_photos": ACCESS_NOTES,
    "scene_photos": ACCESS_NOTES,
    "paste_notes": ACCESS_NOTES,
    "chore_save": ACCESS_ALL,
    "chore_delete": ACCESS_ALL,
    "settings_save": ACCESS_ALL,
    "setup_save": ACCESS_ALL,
    "schedule_preview": ACCESS_ALL,
    "ai_questions": ACCESS_ALL,
    "ai_steps": ACCESS_ALL,
    "ai_defaults": ACCESS_ALL,
    "ai_preview": ACCESS_ALL,
    "task_add": ACCESS_ALL,
    "test_channel": ACCESS_ALL,
    "access_set": ACCESS_ADMIN,
    "claude_token": ACCESS_ADMIN,
    "claude_test": ACCESS_ADMIN,
    "backup_export": ACCESS_ADMIN,
    "backup_preview": ACCESS_ADMIN,
    "backup_import": ACCESS_ADMIN,
}


def registered_commands() -> dict[str, object]:
    """Every command the integration registers, by name."""
    found: dict[str, object] = {}
    hass = MagicMock()
    registered: list[object] = []
    original = websocket_api.websocket_api.async_register_command
    websocket_api.websocket_api.async_register_command = lambda _hass, handler: registered.append(handler)
    try:
        websocket_api.async_register_websocket_commands(hass)
    finally:
        websocket_api.websocket_api.async_register_command = original
    for handler in registered:
        found[handler._ws_command] = handler
    return found


def make_hass(level: int | None):
    hass = MagicMock()
    if level is None:
        hass.data = {}
    else:
        manager = manager_module.BoopliManager(hass)
        manager.access_level = level
        hass.data = {DOMAIN: manager}
    return hass


def call(handler, hass, user):
    """Call a command the way Home Assistant does; returns True when it ran."""
    connection = MagicMock()
    connection.user = user
    try:
        handler(hass, connection, {"id": 1, "type": "boopli/x"})
    except Unauthorized:
        return False
    except Exception:  # the command itself may not like this empty message; it ran
        return True
    return True


def test_every_command_has_a_level_and_it_is_the_expected_one():
    commands = registered_commands()
    names = {name.removeprefix("boopli/"): handler for name, handler in commands.items()}
    assert set(names) == set(EXPECTED), "a command was added or removed: decide its access level in EXPECTED"
    for name, handler in names.items():
        assert getattr(handler, "boopli_access", None) == EXPECTED[name], name


def test_the_default_is_the_lowest_level():
    assert ACCESS_DEFAULT == ACCESS_USE
    assert manager_module.BoopliManager(MagicMock()).access_level == ACCESS_USE


@pytest.mark.parametrize("saved", [None, 0, 4, "2", 2.0, True, [], {}])
def test_a_bad_saved_level_becomes_the_default(saved):
    assert manager_module.normalize_access_level(saved) == ACCESS_DEFAULT


@pytest.mark.parametrize("saved", [1, 2, 3])
def test_a_good_saved_level_is_kept(saved):
    assert manager_module.normalize_access_level(saved) == saved


@pytest.mark.parametrize("level", [1, 2, 3])
def test_an_admin_may_do_everything_at_every_level(level):
    manager = manager_module.BoopliManager(MagicMock())
    manager.access_level = level
    for needed in (ACCESS_USE, ACCESS_NOTES, ACCESS_ALL):
        assert manager.may(ADMIN, needed)


@pytest.mark.parametrize("level", [1, 2, 3])
def test_a_person_may_do_what_the_level_reaches(level):
    manager = manager_module.BoopliManager(MagicMock())
    manager.access_level = level
    for needed in (ACCESS_USE, ACCESS_NOTES, ACCESS_ALL):
        assert manager.may(PERSON, needed) is (needed <= level)


def test_nobody_is_not_allowed():
    assert not manager_module.BoopliManager(MagicMock()).may(None, ACCESS_USE)


@pytest.mark.parametrize("level", [1, 2, 3])
def test_the_commands_follow_the_level_for_a_person(level):
    hass = make_hass(level)
    for name, needed in EXPECTED.items():
        handler = registered_commands()[f"boopli/{name}"]
        assert call(handler, hass, PERSON) is (needed <= level), f"{name} at level {level}"


@pytest.mark.parametrize("level", [1, 2, 3])
def test_an_admin_may_run_every_command_at_every_level(level):
    hass = make_hass(level)
    for name in EXPECTED:
        handler = registered_commands()[f"boopli/{name}"]
        assert call(handler, hass, ADMIN), f"{name} at level {level}"


def test_the_admin_only_commands_stay_closed_to_a_person_at_the_highest_level():
    hass = make_hass(ACCESS_ALL)
    for name, needed in EXPECTED.items():
        if needed == ACCESS_ADMIN:
            assert not call(registered_commands()[f"boopli/{name}"], hass, PERSON), name


def test_a_command_before_setup_answers_itself_but_admin_things_stay_closed():
    hass = make_hass(None)
    assert call(registered_commands()["boopli/state"], hass, PERSON)  # it says "not set up" itself
    assert not call(registered_commands()["boopli/backup_export"], hass, PERSON)


def test_the_panel_hears_what_it_may_offer():
    manager = manager_module.BoopliManager(MagicMock())
    manager.access_level = ACCESS_NOTES
    assert manager.access_for(PERSON) == {"level": 2, "admin": False, "notes": True, "all": False}
    assert manager.access_for(ADMIN) == {"level": 2, "admin": True, "notes": True, "all": True}


def test_the_level_is_saved_apart_from_the_settings():
    manager = manager_module.BoopliManager(MagicMock())
    manager.set_access_level(ACCESS_ALL)
    saved = manager._data_to_save()
    assert saved["access_level"] == ACCESS_ALL
    assert "access_level" not in saved["settings"]  # a settings save cannot change it


def test_a_settings_save_cannot_change_the_level():
    manager = manager_module.BoopliManager(MagicMock())
    manager._watch_presence = manager._watch_lights = manager._tick = MagicMock()
    manager.set_access_level(ACCESS_USE)
    manager.save_settings({"access_level": 3})
    assert manager.access_level == ACCESS_USE


def test_choosing_a_level_tells_the_panels():
    manager = manager_module.BoopliManager(MagicMock())
    heard: list[int] = []
    manager.async_add_listener(lambda: heard.append(manager.access_level))
    manager.set_access_level(ACCESS_NOTES)
    assert heard == [ACCESS_NOTES]


@pytest.mark.parametrize("bad", [0, 4, "1", None, True])
def test_a_level_that_does_not_exist_is_refused(bad):
    manager = manager_module.BoopliManager(MagicMock())
    with pytest.raises(ValueError):
        manager.set_access_level(bad)
    assert manager.access_level == ACCESS_DEFAULT


def test_a_snapshot_for_a_person_carries_the_access():
    manager = manager_module.BoopliManager(MagicMock())
    manager.snapshot = lambda: {"chores": []}  # the rest of the snapshot is not what is tested here
    snapshot = manager.snapshot_for(PERSON)
    assert snapshot["access"]["level"] == ACCESS_USE
    assert snapshot["chores"] == []
    assert "access" not in manager.snapshot()
