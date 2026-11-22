"""Tests for setting a part (group) of a running task aside to do later."""

from __future__ import annotations

import importlib.util
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

_DIR = Path(__file__).parents[1] / "custom_components" / "boopli"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, _DIR / file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


engine = _load("boopli_engine_parts", "engine.py")
bd = _load("boopli_breakdown_parts", "breakdown.py")

UTC = timezone.utc
VIENNA = ZoneInfo("Europe/Vienna")
T0 = datetime(2026, 11, 21, 10, 0, tzinfo=UTC)  # 11:00 in Vienna


def room_chore() -> "engine.Chore":
    steps = [
        engine.Step("a1", "Gather the cups", group="Desk"),
        engine.Step("a2", "Wipe the desk", group="Desk", wait_minutes=5),
        engine.Step("b1", "Fold the blankets", group="Sofa"),
        engine.Step("b2", "Plump the pillows", group="Sofa"),
        engine.Step("c1", "Vacuum the floor", group="Floor"),
    ]
    return engine.Chore(id="room", name="Clean the living room", steps=steps, where="home")


def test_park_a_part_moves_only_its_open_steps_and_run_goes_on():
    run, _ = engine.start_run(room_chore(), T0)
    moved, events = engine.park_part(run, "Desk", T0)
    assert [s.step_id for s in moved] == ["a1", "a2"]
    assert [s.step_id for s in run.steps] == ["b1", "b2", "c1"]
    # the parked step was the active one, so the next step is the user's turn now
    assert run.steps[0].status == engine.STEP_ACTIVE
    assert [e.name for e in events] == ["step_active"]


def test_park_keeps_done_steps_and_a_waiting_step_elsewhere_untouched():
    run, _ = engine.start_run(room_chore(), T0)
    engine.complete_step(run, "a1", T0)  # a2 now waits 5 minutes
    assert run.steps[1].status == engine.STEP_WAITING
    moved, events = engine.park_part(run, "Sofa", T0)
    assert [s.step_id for s in moved] == ["b1", "b2"]
    assert [s.step_id for s in run.steps] == ["a1", "a2", "c1"]
    assert run.steps[1].status == engine.STEP_WAITING and events == []  # nothing else changed


def test_park_only_the_open_steps_of_a_part_that_is_partly_done():
    run, _ = engine.start_run(room_chore(), T0)
    engine.complete_step(run, "a1", T0)
    moved, _ = engine.park_part(run, "Desk", T0)
    assert [s.step_id for s in moved] == ["a2"]
    assert [s.step_id for s in run.steps] == ["a1", "b1", "b2", "c1"]


def test_park_refuses_what_makes_no_sense():
    run, _ = engine.start_run(room_chore(), T0)
    for group, message in [("", "belong"), ("Garage", "Nothing in that part")]:
        with pytest.raises(ValueError, match=message):
            engine.park_part(run, group, T0)
    engine.park_part(run, "Desk", T0)
    engine.park_part(run, "Sofa", T0)
    with pytest.raises(ValueError, match="all that is left"):
        engine.park_part(run, "Floor", T0)  # the last part: use Snooze instead
    assert [s.step_id for s in run.steps] == ["c1"]  # and nothing was lost
    run.status = engine.RUN_DONE
    with pytest.raises(ValueError, match="not running"):
        engine.park_part(run, "Floor", T0)


def test_parked_chore_is_a_small_one_off_that_keeps_the_steps():
    chore = room_chore()
    chore.nudge_style = engine.STYLE_PERSISTENT
    run, _ = engine.start_run(chore, T0)
    moved, _ = engine.park_part(run, "Desk", T0)
    parked = engine.parked_chore(run, chore, "Desk", moved, None, T0)
    assert parked.name == "Clean the living room: Desk"
    assert parked.one_off and parked.parked and parked.next_due is None
    assert [s.title for s in parked.steps] == ["Gather the cups", "Wipe the desk"]
    assert parked.steps[0].wait_minutes == 0 and parked.steps[1].wait_minutes == 5
    assert parked.nudge_style == engine.STYLE_PERSISTENT
    assert engine.validate_chore(parked) is None
    assert parked.id != chore.id and parked.steps[0].id != "a1"


def test_parked_flag_survives_storage():
    chore = room_chore()
    run, _ = engine.start_run(chore, T0)
    moved, _ = engine.park_part(run, "Sofa", T0)
    parked = engine.parked_chore(run, chore, "Sofa", moved, None, T0)
    assert engine.Chore.from_dict(engine.to_dict(parked)).parked is True
    assert engine.Chore.from_dict(engine.to_dict(chore)).parked is False


def test_a_parked_chore_with_a_time_starts_by_itself_and_is_deleted_when_done():
    chore = room_chore()
    run, _ = engine.start_run(chore, T0)
    moved, _ = engine.park_part(run, "Sofa", T0)
    due = engine.park_time("tomorrow", "", T0, VIENNA)
    parked = engine.parked_chore(run, chore, "Sofa", moved, due, T0)
    assert engine.due_action(parked, False, T0) is None
    assert engine.due_action(parked, False, engine.parse_ts(due)) == "start"
    assert engine.on_run_finished(parked, T0, VIENNA) is True  # one-off: gone when done


def test_park_time_options():
    assert engine.park_time("any", "", T0, VIENNA) is None
    tomorrow = engine.park_time("tomorrow", "", T0, VIENNA)
    local = engine.parse_ts(tomorrow).astimezone(VIENNA)
    assert (local.year, local.month, local.day, local.hour, local.minute) == (2026, 11, 22, 9, 0)
    picked = engine.park_time("at", "2026-11-28T10:30", T0, VIENNA)
    assert engine.parse_ts(picked).astimezone(VIENNA).strftime("%Y-%m-%d %H:%M") == "2026-11-28 10:30"


def test_park_time_rejects_bad_input():
    for when, at, message in [
        ("at", "", "Pick a date"),
        ("at", "not a time", "Pick a date"),
        ("at", "2026-11-21T09:00", "not passed"),  # an hour ago (Vienna)
        ("someday", "", "Choose when"),
    ]:
        with pytest.raises(ValueError, match=message):
            engine.park_time(when, at, T0, VIENNA)


# --- the prompts that make the parts -----------------------------------------------------


def test_steps_prompt_asks_for_a_group_per_thing_and_background_notes():
    text = bd.steps_instructions("Clean the living room", "now", [], "", "", 'Room "Living Room": Sofa; Desk')
    assert "one group for each thing" in text and "never as a list of jobs" in text
    assert "Do not move or rearrange furniture" in text
    assert 'Room "Living Room": Sofa; Desk' in text


def test_room_prompts_ask_where_things_belong_but_only_optionally():
    assert "optional" in bd.ROOM_QUESTIONS_PROMPT and "where things belong" in bd.ROOM_QUESTIONS_PROMPT
    assert "Clothes go in the wardrobe" in bd.ROOM_NOTES_PROMPT
    assert "where things belong" in bd.ROOM_CHAT_PROMPT and "where things belong" in bd.HOME_CHAT_PROMPT


# --- photos of how it looks today (one time, text only) ----------------------------------


def test_scene_is_added_to_what_the_ai_knows_only_when_there_is_one():
    plain = bd.steps_instructions("Clean the living room", "now", [], "", "", "")
    assert "looks like today" not in plain.split("Rules:")[0]
    with_scene = bd.steps_instructions(
        "Clean the living room", "now", [], "", "", 'Room "Living Room": Sofa', "Coffee table: bottles\nBin: full"
    )
    known = with_scene.split("Rules:")[0]
    assert "What it looks like today" in known and "Coffee table: bottles\nBin: full" in known
    assert 'Room "Living Room": Sofa' in known


def test_scene_is_capped_and_goes_into_questions_too():
    text = bd.questions_instructions("Clean", "now", [], "", "", "", "x" * 5000)
    assert "x" * bd.SCENE_MAX in text and "x" * (bd.SCENE_MAX + 1) not in text


def test_scene_prompt_keeps_people_and_private_things_out():
    text = bd.scene_instructions("Clean the living room", 'Room "Living Room": Sofa')
    assert "Clean the living room" in text and 'Room "Living Room": Sofa' in text
    assert "no people" in text and "RIGHT NOW" in text and "{task}" not in text
    assert "(nothing yet)" in bd.scene_instructions("Tidy", "")


def test_scene_answer_is_read_like_other_notes_and_prompts_use_it():
    assert bd.parse_room_notes({"json": '{"notes": "Bin: full\nFloor: clear"}'}) == "Bin: full\nFloor: clear"
    assert "what the place looks like today" in bd.QUESTIONS_PROMPT
    assert "real state" in bd.STEPS_PROMPT
