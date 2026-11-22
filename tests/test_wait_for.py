"""Tests for steps that wait until something happens (instead of only for minutes)."""

from __future__ import annotations

import importlib.util
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "engine.py"
_SPEC = importlib.util.spec_from_file_location("boopli_engine_wait", _PATH)
engine = importlib.util.module_from_spec(_SPEC)
sys.modules["boopli_engine_wait"] = engine
_SPEC.loader.exec_module(engine)

T0 = datetime(2026, 11, 22, 10, 0, tzinfo=timezone.utc)


def washer_event() -> "engine.Trigger":
    return engine.Trigger(kind=engine.TRIGGER_BUTTON, entity_id="event.washer_cycle_finished")


def laundry(wait_minutes: int = 0) -> "engine.Chore":
    return engine.Chore(
        id="laundry",
        name="Laundry",
        steps=[
            engine.Step("s1", "Start the washing machine"),
            engine.Step("s2", "Hang the laundry up", wait_minutes=wait_minutes, wait_for=[washer_event()]),
            engine.Step("s3", "Take it down and put it away"),
        ],
    )


def names(events) -> list[str]:
    return [e.name for e in events]


def test_a_step_with_wait_for_stays_quiet_until_released():
    run, _ = engine.start_run(laundry(), T0)
    events = engine.complete_step(run, "s1", T0)
    assert names(events) == ["step_done"]  # no step_active: nobody is nudged yet
    waiting = run.steps[1]
    assert waiting.status == engine.STEP_WAITING and waiting.active_at is None
    # time passing does not wake it
    assert engine.wake_steps(run, T0 + timedelta(days=2)) == []
    assert engine.next_wakeup([], [run], T0) is None


def test_release_makes_it_the_users_turn_with_a_first_nudge_due():
    run, _ = engine.start_run(laundry(), T0)
    engine.complete_step(run, "s1", T0)
    later = T0 + timedelta(minutes=95)
    events = engine.release_step(run, "s2", later)
    assert names(events) == ["step_active"]
    step = run.steps[1]
    assert step.status == engine.STEP_ACTIVE
    assert step.active_at == engine.fmt_ts(later) and step.next_nudge_at == step.active_at
    # releasing twice, or a step that is not waiting, does nothing
    assert engine.release_step(run, "s2", later) == []
    assert engine.release_step(run, "s3", later) == []


def test_wait_minutes_is_the_longest_it_waits_when_there_is_a_wait_for():
    run, _ = engine.start_run(laundry(wait_minutes=180), T0)
    engine.complete_step(run, "s1", T0)
    waiting = run.steps[1]
    assert waiting.status == engine.STEP_WAITING
    assert waiting.active_at == engine.fmt_ts(T0 + timedelta(minutes=180))
    assert engine.next_wakeup([], [run], T0) == T0 + timedelta(minutes=180)
    assert engine.wake_steps(run, T0 + timedelta(minutes=179)) == []
    assert names(engine.wake_steps(run, T0 + timedelta(minutes=180))) == ["step_active"]


def test_plain_minutes_still_work_without_a_wait_for():
    chore = engine.Chore(id="c", name="C", steps=[engine.Step("a", "A"), engine.Step("b", "B", wait_minutes=30)])
    run, _ = engine.start_run(chore, T0)
    engine.complete_step(run, "a", T0)
    assert run.steps[1].status == engine.STEP_WAITING
    assert run.steps[1].active_at == engine.fmt_ts(T0 + timedelta(minutes=30))


def test_a_first_step_can_wait_for_an_event_too():
    chore = engine.Chore(id="c", name="C", steps=[engine.Step("a", "A", wait_for=[washer_event()])])
    run, events = engine.start_run(chore, T0)
    assert names(events) == ["chore_started"]
    assert run.steps[0].status == engine.STEP_WAITING


def test_wait_for_is_copied_into_the_run_and_survives_storage():
    chore = laundry()
    again = engine.Chore.from_dict(engine.to_dict(chore))
    assert again.steps[1].wait_for == [washer_event()] and again.steps[0].wait_for == []
    run, _ = engine.start_run(chore, T0)
    assert run.steps[1].wait_for == [washer_event()]
    assert engine.Run.from_dict(engine.to_dict(run)).steps[1].wait_for == [washer_event()]
    # old stored data without the field still loads
    assert engine.StepRun.from_dict({"step_id": "x", "title": "t", "wait_minutes": 0}).wait_for == []


def test_wait_for_triggers_are_validated():
    bad = laundry()
    bad.steps[1].wait_for = [engine.Trigger(kind=engine.TRIGGER_BUTTON, entity_id="")]
    assert engine.validate_chore(bad)
    assert engine.validate_chore(laundry()) is None
    many = laundry()
    many.steps[1].wait_for = [washer_event() for _ in range(engine.MAX_TRIGGERS + 1)]
    assert engine.validate_chore(many)


def test_a_parked_part_keeps_what_its_steps_wait_for():
    chore = laundry()
    for s in chore.steps:
        s.group = "Wash"
    chore.steps.append(engine.Step("s4", "Water the plants", group="Plants"))
    run, _ = engine.start_run(chore, T0)
    moved, _ = engine.park_part(run, "Wash", T0)
    parked = engine.parked_chore(run, chore, "Wash", moved, None, T0)
    assert parked.steps[1].wait_for == [washer_event()]
