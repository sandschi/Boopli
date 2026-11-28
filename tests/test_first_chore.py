"""The "first chore" achievement counts every way a chore is made: the editor, a quick task and reviewed AI steps."""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).parents[1]))

from custom_components.boopli import engine, manager as manager_module  # noqa: E402


def make_manager(monkeypatch):
    manager = manager_module.BoopliManager(MagicMock())
    monkeypatch.setattr(manager, "start_chore", lambda chore_id: None)  # starting a run is not what is tested
    monkeypatch.setattr(manager, "_tick", lambda: None)
    monkeypatch.setattr(manager, "_save", lambda: None)  # the real store needs a running Home Assistant
    return manager


def test_a_quick_task_counts_as_a_chore_made(monkeypatch):
    manager = make_manager(monkeypatch)
    manager.add_task("Tidy the desk")
    assert manager.progress.stats.get(engine.STAT_CHORE_CREATED) == 1
    assert "first_chore" in manager.progress.achievements


def test_reviewed_steps_count_as_a_chore_made(monkeypatch):
    manager = make_manager(monkeypatch)
    manager.add_task_steps("Clean the kitchen", [{"title": "Wipe the counter"}, {"title": "Sweep"}])
    assert manager.progress.stats.get(engine.STAT_CHORE_CREATED) == 1
    assert "first_chore" in manager.progress.achievements


def test_the_editor_counts_a_new_chore_but_not_an_edit(monkeypatch):
    manager = make_manager(monkeypatch)
    chore = manager.save_chore({"name": "Water the plants", "steps": [{"title": "Water", "id": "s1"}]})
    assert manager.progress.stats.get(engine.STAT_CHORE_CREATED) == 1
    manager.save_chore({**engine.to_dict(chore), "name": "Water the big plants"})  # an edit of the same chore
    assert manager.progress.stats.get(engine.STAT_CHORE_CREATED) == 1


def test_the_achievement_is_announced_once(monkeypatch):
    manager = make_manager(monkeypatch)
    manager.add_task("One")
    manager.add_task("Two")
    fired = [c.args[0] for c in manager.hass.bus.async_fire.call_args_list]
    assert fired.count("boopli_achievement_unlocked") == 1
    assert manager.progress.stats[engine.STAT_CHORE_CREATED] == 2
