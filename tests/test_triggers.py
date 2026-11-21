"""Tests for steps that finish by themselves (triggers)."""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "engine.py"
_SPEC = importlib.util.spec_from_file_location("boopli_engine_triggers", _PATH)
engine = importlib.util.module_from_spec(_SPEC)
sys.modules["boopli_engine_triggers"] = engine
_SPEC.loader.exec_module(engine)

T0 = datetime(2026, 11, 21, 12, 0, tzinfo=timezone.utc)


def minutes(n: int) -> datetime:
    return T0 + timedelta(minutes=n)


def door(**kw) -> "engine.Trigger":
    return engine.Trigger(kind="state", entity_id="binary_sensor.door", state="on", **kw)


# --- state matching ----------------------------------------------------------


def test_a_state_trigger_compares_the_state_ignoring_case():
    t = door()
    assert engine.state_matches(t, "on")
    assert engine.state_matches(t, " ON ")
    assert not engine.state_matches(t, "off")


def test_unavailable_unknown_and_missing_never_count():
    t = engine.Trigger(kind="state", entity_id="sensor.x", below=50)
    for bad in (None, "", "unavailable", "unknown"):
        assert not engine.state_matches(t, bad)
    assert not engine.state_matches(door(), "unavailable")
    assert not engine.state_matches(t, "not a number")


def test_number_triggers_use_above_and_below():
    t = engine.Trigger(kind="state", entity_id="sensor.moisture", above=40)
    assert engine.state_matches(t, "41.5")
    assert not engine.state_matches(t, "40")
    both = engine.Trigger(kind="state", entity_id="sensor.t", above=10, below=20)
    assert engine.state_matches(both, "15")
    assert not engine.state_matches(both, "25")


# --- watching state triggers -------------------------------------------------


def test_happens_ignores_a_state_that_is_already_true_when_the_step_starts():
    t, w = door(), engine.TriggerWatch()
    assert not engine.advance_watch(t, w, True, minutes(0))  # door was open already
    assert not engine.advance_watch(t, w, True, minutes(5))  # still open: no
    assert not engine.advance_watch(t, w, False, minutes(6))  # closed: re-armed
    assert engine.advance_watch(t, w, True, minutes(7))  # opened again: done


def test_happens_fires_on_the_change_after_the_step_started():
    t, w = door(), engine.TriggerWatch()
    assert not engine.advance_watch(t, w, False, minutes(0))
    assert engine.advance_watch(t, w, True, minutes(3))


def test_is_counts_a_state_that_is_already_true():
    t, w = door(mode="is"), engine.TriggerWatch()
    assert engine.advance_watch(t, w, True, minutes(0))


def test_is_stays_unmet_while_false():
    t, w = door(mode="is"), engine.TriggerWatch()
    assert not engine.advance_watch(t, w, False, minutes(0))
    assert engine.advance_watch(t, w, True, minutes(1))


def test_for_minutes_must_hold_and_resets_when_it_breaks():
    t, w = door(for_minutes=10), engine.TriggerWatch()
    assert not engine.advance_watch(t, w, False, minutes(0))
    assert not engine.advance_watch(t, w, True, minutes(1))
    assert engine.watch_due(t, w) == minutes(11)
    assert not engine.advance_watch(t, w, True, minutes(10))
    assert not engine.advance_watch(t, w, False, minutes(10.5 // 1))  # breaks
    assert engine.watch_due(t, w) is None
    assert not engine.advance_watch(t, w, True, minutes(12))
    assert engine.advance_watch(t, w, True, minutes(22))


def test_is_with_for_uses_the_time_the_state_last_changed():
    t, w = door(mode="is", for_minutes=10), engine.TriggerWatch()
    assert engine.advance_watch(t, w, True, minutes(30), last_changed=minutes(0))
    t2, w2 = door(mode="is", for_minutes=10), engine.TriggerWatch()
    assert not engine.advance_watch(t2, w2, True, minutes(30), last_changed=minutes(25))


def test_a_number_trigger_is_dated_from_when_it_was_first_seen():
    t = engine.Trigger(kind="state", entity_id="sensor.m", mode="is", above=40, for_minutes=5)
    w = engine.TriggerWatch()
    assert not engine.advance_watch(t, w, True, minutes(0), last_changed=minutes(-100))
    assert engine.advance_watch(t, w, True, minutes(5))


# --- tags and buttons --------------------------------------------------------


def test_tag_matching_is_exact():
    t = engine.Trigger(kind="tag", tag_id="abc-123")
    assert engine.tag_matches(t, "abc-123")
    assert not engine.tag_matches(t, "other")
    assert not engine.tag_matches(engine.Trigger(kind="tag"), "")
    assert not engine.tag_matches(door(), "abc-123")


def test_a_button_press_is_a_new_event_time():
    t = engine.Trigger(kind="button", entity_id="event.button")
    assert engine.button_pressed(t, "2026-11-21T10:00:00", "2026-11-21T11:00:00", "single")
    assert engine.button_pressed(t, "unknown", "2026-11-21T11:00:00", None)  # the first press ever
    assert not engine.button_pressed(t, "2026-11-21T10:00:00", "2026-11-21T10:00:00", "single")
    assert not engine.button_pressed(t, "unavailable", "2026-11-21T10:00:00", None)  # start-up noise
    assert not engine.button_pressed(t, "2026-11-21T10:00:00", "unavailable", None)
    assert not engine.button_pressed(t, None, "2026-11-21T10:00:00", None)


def test_a_button_can_be_limited_to_one_press_type():
    t = engine.Trigger(kind="button", entity_id="event.button", press="double")
    assert engine.button_pressed(t, "a", "b", "double")
    assert not engine.button_pressed(t, "a", "b", "single")
    assert not engine.button_pressed(t, "a", "b", None)


# --- validation and storage --------------------------------------------------


def chore_with(*triggers) -> "engine.Chore":
    step = engine.Step(id="s1", title="Open to dry", triggers=list(triggers))
    return engine.Chore(id="c1", name="Dishwasher", steps=[step])


def test_valid_triggers_pass():
    ok = [
        door(),
        door(mode="is", for_minutes=5),
        engine.Trigger(kind="state", entity_id="sensor.x", above=1, below=2),
        engine.Trigger(kind="tag", tag_id="abc"),
        engine.Trigger(kind="button", entity_id="event.b"),
        engine.Trigger(kind="button", entity_id="input_button.b", press="single"),
    ]
    for t in ok:
        assert engine.validate_chore(chore_with(t)) is None, t


def test_invalid_triggers_are_refused():
    bad = [
        engine.Trigger(kind="carrier_pigeon"),
        engine.Trigger(kind="tag"),
        engine.Trigger(kind="state", entity_id="", state="on"),
        engine.Trigger(kind="state", entity_id="binary_sensor", state="on"),
        engine.Trigger(kind="state", entity_id="sensor.x"),  # nothing to wait for
        engine.Trigger(kind="state", entity_id="sensor.x", state="on", above=3),
        engine.Trigger(kind="state", entity_id="sensor.x", above=5, below=2),
        door(for_minutes=-1),
        door(for_minutes=24 * 60 + 1),
        door(mode="sometimes"),
        engine.Trigger(kind="button", entity_id="nothing"),
    ]
    for t in bad:
        assert engine.validate_chore(chore_with(t)), t
    too_many = chore_with(*[door() for _ in range(engine.MAX_TRIGGERS + 1)])
    assert engine.validate_chore(too_many)


def test_a_chore_with_triggers_roundtrips_and_marks_the_step_auto():
    chore = chore_with(door(for_minutes=2), engine.Trigger(kind="tag", tag_id="abc"))
    again = engine.Chore.from_dict(json.loads(json.dumps(engine.to_dict(chore))))
    assert again.steps[0].resolve == "auto"  # set from the triggers, whatever was stored
    chore.steps[0].resolve = "auto"
    assert again == chore
    plain = engine.Chore.from_dict({"name": "x", "steps": [{"title": "y"}]})
    assert plain.steps[0].triggers == [] and plain.steps[0].resolve == "manual"


def test_old_stored_runs_without_triggers_still_load():
    step = engine.StepRun.from_dict({"step_id": "s", "title": "t"})
    assert step.triggers == [] and step.done_by is None


# --- runs --------------------------------------------------------------------


def test_a_run_snapshots_the_triggers_so_later_edits_do_not_change_it():
    chore = chore_with(door())
    run, _ = engine.start_run(chore, T0)
    chore.steps[0].triggers[0].state = "off"
    assert run.steps[0].triggers[0].state == "on"


def test_finishing_by_a_trigger_records_who_and_why_and_advances():
    chore = engine.Chore(
        id="c1",
        name="Dishwasher",
        steps=[
            engine.Step(id="a", title="Open to dry", triggers=[door()]),
            engine.Step(id="b", title="Empty it"),
        ],
    )
    run, _ = engine.start_run(chore, T0)
    events = engine.complete_step(run, "a", minutes(1), by="auto", reason="Door is on")
    done = events[0]
    assert done.name == engine.EVENT_STEP_DONE
    assert done.data["by"] == "auto" and done.data["reason"] == "Door is on"
    assert run.steps[0].done_by == "auto" and run.steps[0].done_reason == "Door is on"
    assert run.steps[1].status == engine.STEP_ACTIVE
    assert [e.name for e in events] == [engine.EVENT_STEP_DONE, engine.EVENT_STEP_ACTIVE]


def test_manual_done_stays_manual_by_default():
    run, _ = engine.start_run(chore_with(), T0)
    events = engine.complete_step(run, "s1", minutes(1))
    assert events[0].data["by"] == "manual"
    assert run.steps[0].done_by == "manual" and run.steps[0].done_reason is None


def test_reasons_read_like_sentences():
    assert engine.trigger_reason(door(), "Front door") == "Front door is on"
    assert engine.trigger_reason(engine.Trigger(kind="tag", tag_id="abc"), "Bin tag") == "NFC tag Bin tag scanned"
    assert engine.trigger_reason(engine.Trigger(kind="button", entity_id="event.b"), "Kitchen button") == "Kitchen button pressed"
    t = engine.Trigger(kind="state", entity_id="sensor.m", above=40)
    assert engine.trigger_reason(t, "Soil", "41") == "Soil above 40 (41)"
