"""Backup of the setup: what goes into the file, how a file is read and checked, what it points to."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_DIR = Path(__file__).parents[1] / "custom_components" / "boopli"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, _DIR / file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


engine = _load("boopli_engine_backup", "engine.py")

ALL = list(engine.BACKUP_PARTS)


def a_chore(id="c1", name="Take pills", style=None):
    chore = engine.Chore(id=id, name=name, steps=[engine.Step("a", "Take your pills")])
    if style:
        chore.nudge_style = style
    return chore


def a_ladder(id="l1"):
    return engine.Ladder(id=id, name="Pills", rungs=[engine.Rung(gap=5, phones={"pixel": "normal"})], repeat_last=False)


def make(parts=ALL, settings=None, chores=None, history=None):
    progress = engine.Progress(total_xp=260, started_at="2026-11-01T08:00:00Z")
    home = engine.Home.from_dict({"enabled": True, "rooms": [{"id": "r1", "name": "Kitchen", "notes": "Sink on the left"}]})
    return engine.build_backup(
        parts,
        settings=settings or engine.Settings.from_dict({"pet_name": "Pip"}),
        chores=chores if chores is not None else [a_chore()],
        home=home,
        progress=progress,
        history=history if history is not None else [],
        boopli_version="0.0.50",
        exported_at="2026-11-23T20:00:00Z",
    )


# --- what goes into the file ------------------------------------------------------------------


def test_a_full_backup_has_the_four_parts_and_a_header():
    data = make()
    assert data["format"] == engine.BACKUP_FORMAT and data["version"] == engine.BACKUP_VERSION
    assert data["boopli_version"] == "0.0.50" and data["exported_at"] == "2026-11-23T20:00:00Z"
    assert set(data) == {"format", "version", "boopli_version", "exported_at", "settings", "chores", "home", "pet"}


def test_only_the_parts_asked_for_go_in():
    assert set(make(["settings"])) == {"format", "version", "boopli_version", "exported_at", "settings"}
    assert "pet" in make(["pet", "home"]) and "chores" not in make(["pet", "home"])


def test_nothing_temporary_goes_in():
    text = str(make())
    for word in ("runs", "away", "indicator_on", "alarm_on"):
        assert f"'{word}'" not in text


# --- reading a file back ----------------------------------------------------------------------


def test_a_full_backup_reads_back_the_same():
    history = [engine.HistoryEntry(ts="2026-11-22T09:00:00Z", kind="step_done", chore_id="c1", chore_name="Take pills", run_id="r1", step_title="Take your pills", by="manual")]
    backup = engine.parse_backup(make(history=history))
    assert backup.parts == ALL
    assert backup.settings.pet_name == "Pip"
    assert [c.name for c in backup.chores] == ["Take pills"]
    assert [r.name for r in backup.home.rooms] == ["Kitchen"] and backup.home.rooms[0].notes == "Sink on the left"
    assert backup.progress.total_xp == 260
    assert [h.step_title for h in backup.history] == ["Take your pills"]
    assert backup.boopli_version == "0.0.50"


def test_a_partial_backup_only_has_its_parts():
    backup = engine.parse_backup(make(["home"]))
    assert backup.parts == ["home"] and backup.settings is None and backup.chores is None and backup.progress is None


def test_the_wall_boards_and_ladders_come_back_with_the_settings():
    s = engine.Settings.from_dict({})
    s.ladders = [a_ladder()]
    backup = engine.parse_backup(make(["settings"], settings=s))
    assert [lad.id for lad in backup.settings.ladders] == ["l1"]
    assert backup.settings.boards[0].name == "Wall" and backup.settings.boards[0].columns == 16


def test_the_history_is_cut_to_the_most_recent():
    many = [engine.HistoryEntry(ts=f"2026-01-01T00:{i % 60:02d}:00Z", kind="step_done", chore_id="c", chore_name="c", run_id=str(i)) for i in range(engine.BACKUP_HISTORY_MAX + 5)]
    backup = engine.parse_backup(make(["pet"], history=many))
    assert len(backup.history) == engine.BACKUP_HISTORY_MAX
    assert backup.history[-1].run_id == str(engine.BACKUP_HISTORY_MAX + 4)


# --- a file that cannot be used ---------------------------------------------------------------


@pytest.mark.parametrize("junk", [None, "text", 5, [], {}, {"format": "something-else", "version": 1}])
def test_something_that_is_not_a_backup_is_refused(junk):
    with pytest.raises(engine.BackupError, match="not a Boopli backup"):
        engine.parse_backup(junk)


def test_a_newer_backup_is_refused_and_a_version_has_to_make_sense():
    data = make()
    data["version"] = engine.BACKUP_VERSION + 1
    with pytest.raises(engine.BackupError, match="newer Boopli"):
        engine.parse_backup(data)
    for bad in (0, "1", True, None):
        data["version"] = bad
        with pytest.raises(engine.BackupError, match="readable version"):
            engine.parse_backup(data)


def test_a_file_with_nothing_in_it_is_refused():
    data = make()
    for part in ALL:
        data.pop(part)
    with pytest.raises(engine.BackupError, match="nothing in it"):
        engine.parse_backup(data)


def test_damaged_parts_are_refused_with_words_not_a_crash():
    for part, value in (("settings", []), ("chores", {}), ("chores", [5]), ("home", "x"), ("pet", []), ("pet", {"history": [1]})):
        data = make()
        data[part] = value
        with pytest.raises(engine.BackupError):
            engine.parse_backup(data)


def test_a_value_of_the_wrong_kind_inside_a_chore_is_refused():
    data = make()
    data["chores"][0]["steps"][0]["wait_minutes"] = "soon"
    with pytest.raises(engine.BackupError, match="damaged"):
        engine.parse_backup(data)


def test_settings_that_would_not_pass_a_normal_save_are_refused():
    data = make()
    data["settings"]["boards"][0]["night"] = "purple"
    with pytest.raises(engine.BackupError, match="settings in this file are not valid"):
        engine.parse_backup(data)


def test_a_chore_that_would_not_pass_a_normal_save_is_refused():
    data = make()
    data["chores"][0]["steps"] = []
    with pytest.raises(engine.BackupError, match="Take pills' is not valid"):
        engine.parse_backup(data)


def test_two_chores_with_the_same_id_are_refused():
    with pytest.raises(engine.BackupError, match="same id"):
        engine.parse_backup(make(chores=[a_chore("c1", "A"), a_chore("c1", "B")]))


def test_too_many_chores_are_refused():
    data = make(chores=[])
    data["chores"] = [engine.to_dict(a_chore(f"c{i}", f"Chore {i}")) for i in range(engine.BACKUP_CHORES_MAX + 1)]
    with pytest.raises(engine.BackupError, match="at most"):
        engine.parse_backup(data)


def test_a_chore_needs_the_ladder_it_uses():
    chore = a_chore(style=engine.ladder_style("l1"))
    with pytest.raises(engine.BackupError, match="not valid"):
        engine.parse_backup(make(["chores"], chores=[chore]))  # no ladder here, none given
    assert engine.parse_backup(make(["chores"], chores=[chore]), ["l1"]).parts == ["chores"]  # this install has it
    s = engine.Settings.from_dict({})
    s.ladders = [a_ladder()]
    assert engine.parse_backup(make(["settings", "chores"], settings=s, chores=[chore])).parts == ["settings", "chores"]


# --- the parts picked have to fit together ----------------------------------------------------


def test_picking_nothing_or_a_part_the_file_lacks_is_refused():
    backup = engine.parse_backup(make(["home"]))
    here = engine.Settings.from_dict({})
    assert "at least one" in engine.check_backup_selection(backup, [], here, [])
    assert "no chores" in engine.check_backup_selection(backup, ["chores"], here, [])
    assert engine.check_backup_selection(backup, ["home"], here, []) is None


def test_chores_picked_without_settings_must_fit_the_ladders_here():
    chore = a_chore(style=engine.ladder_style("l1"))
    s = engine.Settings.from_dict({})
    s.ladders = [a_ladder()]
    backup = engine.parse_backup(make(ALL, settings=s, chores=[chore]))
    no_ladder_here = engine.Settings.from_dict({})
    assert "does not fit" in engine.check_backup_selection(backup, ["chores"], no_ladder_here, [])
    assert engine.check_backup_selection(backup, ["chores", "settings"], no_ladder_here, []) is None
    assert engine.check_backup_selection(backup, ["chores"], s, []) is None


def test_settings_picked_without_chores_must_not_take_a_ladder_away_from_a_chore():
    here = engine.Settings.from_dict({})
    here.ladders = [a_ladder()]
    using = a_chore(style=engine.ladder_style("l1"))
    backup = engine.parse_backup(make(["settings"]))  # a file whose settings have no ladders
    error = engine.check_backup_selection(backup, ["settings"], here, [using])
    assert "Pills" in error and "Take pills" in error
    assert engine.check_backup_selection(backup, ["settings"], here, []) is None


# --- what the file points to ------------------------------------------------------------------


def test_the_references_of_a_backup_are_listed():
    s = engine.Settings.from_dict(
        {
            "lights": [{"entity_id": "light.hall"}],
            "phones": [{"service": "mobile_app_pixel", "level": "normal"}],
            "speakers": [{"entity_id": "media_player.kitchen"}],
            "presence_entity": "person.sam",
            "boards": [{"name": "Wall", "tiles": [{"type": "weather", "options": {"entity_id": "weather.home"}}]}],
        }
    )
    chore = a_chore()
    chore.steps[0].triggers = [engine.Trigger(kind="state", entity_id="binary_sensor.door", state="on")]
    chore.steps[0].image = "camera.front"
    entities, services = engine.backup_references(s, [chore])
    assert entities == ["binary_sensor.door", "camera.front", "light.hall", "media_player.kitchen", "person.sam", "weather.home"]
    assert services == ["mobile_app_pixel"]


def test_without_settings_or_chores_there_are_no_references():
    assert engine.backup_references(None, None) == ([], [])
