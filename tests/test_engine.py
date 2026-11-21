"""Tests for the pure Boopli engine (no Home Assistant needed)."""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

# Load engine.py directly so the test does not import Home Assistant.
_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "engine.py"
_SPEC = importlib.util.spec_from_file_location("boopli_engine", _PATH)
engine = importlib.util.module_from_spec(_SPEC)
sys.modules["boopli_engine"] = engine
_SPEC.loader.exec_module(engine)

UTC = timezone.utc
VIENNA = ZoneInfo("Europe/Vienna")
T0 = datetime(2026, 11, 21, 10, 0, tzinfo=UTC)


def dishwasher() -> "engine.Chore":
    return engine.Chore(
        id="dw",
        name="Dishwasher",
        steps=[
            engine.Step("s1", "Load the dishwasher"),
            engine.Step("s2", "Start the dishwasher"),
            engine.Step("s3", "Open it to dry"),
            engine.Step("s4", "Empty it", wait_minutes=180),
        ],
    )


def names(events) -> list[str]:
    return [e.name for e in events]


# --- runs and steps ------------------------------------------------------


def test_dishwasher_flow_with_wait():
    run, events = engine.start_run(dishwasher(), T0)
    assert names(events) == ["chore_started", "step_active"]
    assert [s.status for s in run.steps] == ["active", "pending", "pending", "pending"]

    assert names(engine.complete_step(run, "s1", T0)) == ["step_done", "step_active"]
    assert names(engine.complete_step(run, "s2", T0)) == ["step_done", "step_active"]

    t_open = T0 + timedelta(minutes=30)
    ev = engine.complete_step(run, "s3", t_open)
    assert names(ev) == ["step_done"]  # the last step is waiting, not active yet
    last = run.steps[3]
    assert last.status == "waiting"
    assert engine.parse_ts(last.active_at) == t_open + timedelta(minutes=180)

    # Too early: nothing happens.
    assert engine.wake_steps(run, t_open + timedelta(minutes=179)) == []
    assert last.status == "waiting"

    # After the wait it is the user's turn.
    woke = engine.wake_steps(run, t_open + timedelta(minutes=181))
    assert names(woke) == ["step_active"]
    assert last.status == "active"

    done = engine.complete_step(run, "s4", t_open + timedelta(minutes=200))
    assert names(done) == ["step_done", "chore_done"]
    assert run.status == "done"
    assert run.finished_at is not None


def test_complete_step_is_idempotent_and_ordered():
    run, _ = engine.start_run(dishwasher(), T0)
    assert engine.complete_step(run, "s2", T0) == []  # not active yet
    assert engine.complete_step(run, "nope", T0) == []
    assert engine.complete_step(run, "s1", T0)
    assert engine.complete_step(run, "s1", T0) == []  # already done


def test_restart_mid_wait_loses_nothing():
    """State is plain data: serialize, reload, then wake up on time."""
    run, _ = engine.start_run(dishwasher(), T0)
    for sid in ("s1", "s2", "s3"):
        engine.complete_step(run, sid, T0)
    stored = json.loads(json.dumps(engine.to_dict(run)))
    reloaded = engine.Run.from_dict(stored)
    assert reloaded.steps[3].status == "waiting"
    woke = engine.wake_steps(reloaded, T0 + timedelta(hours=4))
    assert names(woke) == ["step_active"]


def test_first_step_wait_delays_start():
    chore = engine.Chore(id="c", name="Laundry", steps=[engine.Step("a", "Hang", 60)])
    run, events = engine.start_run(chore, T0)
    assert names(events) == ["chore_started"]
    assert run.steps[0].status == "waiting"


def test_single_step_chore_finishes():
    chore = engine.Chore(id="c", name="Pills", steps=[engine.Step("a", "Take pills")])
    run, _ = engine.start_run(chore, T0)
    ev = engine.complete_step(run, "a", T0)
    assert names(ev) == ["step_done", "chore_done"]


# --- schedules -----------------------------------------------------------


def test_daily_next_due():
    rep = engine.Repeat.daily("09:00")
    before = datetime(2026, 11, 21, 7, 0, tzinfo=VIENNA)
    after = datetime(2026, 11, 21, 9, 0, tzinfo=VIENNA)
    assert engine.compute_next_due(rep, before, VIENNA) == datetime(
        2026, 11, 21, 9, 0, tzinfo=VIENNA
    )
    assert engine.compute_next_due(rep, after, VIENNA) == datetime(
        2026, 11, 22, 9, 0, tzinfo=VIENNA
    )


def test_weekly_friday_and_saturday():
    rep = engine.Repeat.weekly("09:00", [4, 5])  # Fri, Sat
    wed = datetime(2026, 11, 18, 12, 0, tzinfo=VIENNA)  # a Wednesday
    fri_after = datetime(2026, 11, 20, 10, 0, tzinfo=VIENNA)
    sat_after = datetime(2026, 11, 21, 10, 0, tzinfo=VIENNA)
    got = engine.compute_next_due(rep, wed, VIENNA).astimezone(VIENNA)
    assert (got.month, got.day, got.hour) == (11, 20, 9)  # Friday
    got = engine.compute_next_due(rep, fri_after, VIENNA).astimezone(VIENNA)
    assert (got.month, got.day) == (11, 21)  # Saturday
    got = engine.compute_next_due(rep, sat_after, VIENNA).astimezone(VIENNA)
    assert (got.month, got.day) == (11, 27)  # next Friday


def test_every_n_days_counts_from_completion():
    chore = engine.Chore(
        id="c",
        name="AC filter",
        steps=[engine.Step("a", "Clean the filter")],
        repeat=engine.Repeat(type="every_n_days", time="09:00", every_n_days=90),
    )
    assert engine.on_run_finished(chore, T0, VIENNA) is False
    due = engine.parse_ts(chore.next_due).astimezone(VIENNA)
    assert (due.year, due.month, due.day, due.hour) == (2027, 2, 19, 9)


def test_first_due_every_n_days_is_next_time_of_day():
    rep = engine.Repeat(type="every_n_days", time="09:00", every_n_days=90)
    now = datetime(2026, 11, 21, 7, 0, tzinfo=VIENNA)
    got = engine.first_due(rep, now, VIENNA)
    assert got == datetime(2026, 11, 21, 9, 0, tzinfo=VIENNA)


def test_daylight_saving_keeps_local_time():
    rep = engine.Repeat.daily("09:00")
    before_change = datetime(2026, 10, 24, 12, 0, tzinfo=VIENNA)  # CEST, UTC+2
    got = engine.compute_next_due(rep, before_change, VIENNA)
    assert got.astimezone(VIENNA).hour == 9
    assert got.hour == 8  # 25 Oct 09:00 is CET (UTC+1) -> 08:00 UTC


def test_on_demand_has_no_schedule():
    rep = engine.Repeat(type="none")
    assert engine.compute_next_due(rep, T0, VIENNA) is None


def test_due_action_start_skip_and_none():
    chore = dishwasher()
    chore.repeat = engine.Repeat.daily("09:00")
    chore.next_due = engine.fmt_ts(T0)
    assert engine.due_action(chore, False, T0 - timedelta(minutes=1)) is None
    assert engine.due_action(chore, False, T0) == "start"
    assert engine.due_action(chore, True, T0) == "skip"
    chore.enabled = False
    assert engine.due_action(chore, False, T0) is None


def test_advance_after_due_daily_moves_forward_every_n_clears():
    chore = dishwasher()
    chore.repeat = engine.Repeat.daily("09:00")
    engine.advance_after_due(chore, T0, VIENNA)
    assert engine.parse_ts(chore.next_due) > T0
    chore.repeat = engine.Repeat(type="every_n_days", every_n_days=3)
    engine.advance_after_due(chore, T0, VIENNA)
    assert chore.next_due is None


def test_one_off_is_deleted_when_finished():
    chore = engine.Chore(id="c", name="Call", steps=[engine.Step("a", "Call")], one_off=True)
    assert engine.on_run_finished(chore, T0, VIENNA) is True


def test_next_wakeup_picks_earliest():
    chore = dishwasher()
    chore.repeat = engine.Repeat.daily("09:00")
    chore.next_due = engine.fmt_ts(T0 + timedelta(hours=10))
    run, _ = engine.start_run(chore, T0)
    for sid in ("s1", "s2", "s3"):
        engine.complete_step(run, sid, T0)
    # waiting step wakes at T0+3h, the chore is due at T0+10h
    assert engine.next_wakeup([chore], [run], T0) == T0 + timedelta(minutes=180)
    assert engine.next_wakeup([], [], T0) is None


# --- validation and serialization ---------------------------------------


def test_validation():
    ok = dishwasher()
    assert engine.validate_chore(ok) is None

    bad = dishwasher()
    bad.name = ""
    assert engine.validate_chore(bad)

    bad = dishwasher()
    bad.steps = []
    assert engine.validate_chore(bad)

    bad = dishwasher()
    bad.steps[0].title = ""
    assert engine.validate_chore(bad)

    bad = dishwasher()
    bad.steps[0].wait_minutes = engine.MAX_WAIT_MINUTES + 1
    assert engine.validate_chore(bad)

    bad = dishwasher()
    bad.repeat = engine.Repeat(type="schedule", days={})
    assert engine.validate_chore(bad)

    bad = dishwasher()
    bad.repeat = engine.Repeat.daily("25:99")
    assert engine.validate_chore(bad)

    bad = dishwasher()
    bad.where = "mars"
    assert engine.validate_chore(bad)


def test_chore_roundtrip_through_json():
    chore = dishwasher()
    chore.repeat = engine.Repeat.weekly("19:30", [4, 5])
    again = engine.Chore.from_dict(json.loads(json.dumps(engine.to_dict(chore))))
    assert again == chore
