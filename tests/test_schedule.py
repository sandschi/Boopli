"""Tests for chore schedules with a different time per day."""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "engine.py"
_SPEC = importlib.util.spec_from_file_location("boopli_engine_schedule", _PATH)
engine = importlib.util.module_from_spec(_SPEC)
sys.modules["boopli_engine_schedule"] = engine
_SPEC.loader.exec_module(engine)

VIENNA = ZoneInfo("Europe/Vienna")


def at(y, mo, d, h=0, mi=0):
    return datetime(y, mo, d, h, mi, tzinfo=VIENNA)


def local(dt):
    return dt.astimezone(VIENNA)


def schedule(**days):
    """schedule(mon=["19:30"], sat=["11:00"])"""
    names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    return engine.Repeat(
        type="schedule", days={str(names.index(k)): v for k, v in days.items()}
    )


# 2026-11-16 is a Monday.


def test_each_day_has_its_own_time():
    rep = schedule(mon=["19:30"], tue=["19:30"], wed=["19:30"], thu=["19:30"], fri=["19:30"], sat=["11:00"])
    got = engine.compute_next_due(rep, at(2026, 11, 16, 8), VIENNA)
    assert (local(got).day, local(got).hour, local(got).minute) == (16, 19, 30)  # Mon
    got = engine.compute_next_due(rep, at(2026, 11, 20, 20), VIENNA)  # Fri evening
    assert (local(got).day, local(got).hour, local(got).minute) == (21, 11, 0)  # Sat 11:00
    got = engine.compute_next_due(rep, at(2026, 11, 21, 12), VIENNA)  # Sat after 11:00
    assert (local(got).day, local(got).hour, local(got).minute) == (23, 19, 30)  # Sunday has none: Mon


def test_several_times_in_one_day():
    rep = engine.Repeat.daily("08:00")
    rep.days["0"] = ["20:00", "08:00"]  # Monday twice, given out of order
    rep = engine.Repeat.from_dict(engine.to_dict(rep))  # times are sorted when loaded
    assert rep.days["0"] == ["08:00", "20:00"]
    mon = at(2026, 11, 16)
    first = engine.compute_next_due(rep, mon, VIENNA)
    second = engine.compute_next_due(rep, first, VIENNA)
    third = engine.compute_next_due(rep, second, VIENNA)
    assert [(local(x).day, local(x).hour) for x in (first, second, third)] == [(16, 8), (16, 20), (17, 8)]


def test_a_time_that_has_just_passed_is_not_due_again():
    rep = schedule(mon=["09:00"])
    got = engine.compute_next_due(rep, at(2026, 11, 16, 9, 0), VIENNA)
    assert (local(got).month, local(got).day) == (11, 23)  # next Monday, not now


def test_only_one_day_in_the_week_finds_next_week():
    rep = schedule(thu=["19:00"])
    got = engine.compute_next_due(rep, at(2026, 11, 19, 19, 0), VIENNA)  # Thu 19:00 exactly
    assert (local(got).month, local(got).day) == (11, 26)


def test_daylight_saving_keeps_the_local_time():
    rep = schedule(sun=["09:00"], mon=["09:00"])
    before = at(2026, 10, 24, 12)  # Saturday, summer time
    got = engine.compute_next_due(rep, before, VIENNA)  # Sunday 25 Oct, the day the clocks go back
    assert (local(got).day, local(got).hour) == (25, 9)
    assert got.astimezone(timezone.utc).hour == 8  # 09:00 CET is 08:00 UTC


def test_every_n_days_still_counts_from_completion():
    rep = engine.Repeat(type="every_n_days", time="09:00", every_n_days=7)
    first = engine.first_due(rep, at(2026, 11, 21, 7), VIENNA)
    assert (local(first).day, local(first).hour) == (21, 9)
    after = engine.compute_next_due(rep, at(2026, 11, 21, 10), VIENNA)
    assert (local(after).month, local(after).day) == (11, 28)


def test_scheduled_chores_keep_their_schedule_after_a_run_starts():
    chore = engine.Chore(id="c", name="Dishes", steps=[engine.Step("a", "Do it")])
    chore.repeat = schedule(mon=["19:00"], thu=["19:00"])
    now = at(2026, 11, 16, 19, 0)
    engine.advance_after_due(chore, now, VIENNA)
    assert (local(engine.parse_ts(chore.next_due)).day) == 19  # Thursday


# --- preview ---------------------------------------------------------------


def test_preview_lists_the_next_runs_in_order():
    rep = schedule(mon=["19:30"], sat=["11:00"])
    runs = engine.preview_schedule(rep, at(2026, 11, 16, 8), VIENNA, 4)
    assert [(local(x).month, local(x).day, local(x).hour, local(x).minute) for x in runs] == [
        (11, 16, 19, 30),
        (11, 21, 11, 0),
        (11, 23, 19, 30),
        (11, 28, 11, 0),
    ]


def test_preview_for_on_demand_and_every_n_days():
    assert engine.preview_schedule(engine.Repeat(), at(2026, 11, 16), VIENNA) == []
    rep = engine.Repeat(type="every_n_days", time="09:00", every_n_days=7)
    assert len(engine.preview_schedule(rep, at(2026, 11, 16, 7), VIENNA)) == 1


def test_preview_count_is_limited():
    rep = engine.Repeat.daily("09:00")
    assert len(engine.preview_schedule(rep, at(2026, 11, 16), VIENNA, 500)) == engine.PREVIEW_MAX
    assert len(engine.preview_schedule(rep, at(2026, 11, 16), VIENNA, 0)) == 1


# --- converting what older versions stored ---------------------------------


def test_old_daily_becomes_every_day_at_the_same_time():
    rep = engine.Repeat.from_dict({"type": "daily", "time": "9:00"})
    assert rep.type == "schedule"
    assert rep.days == {str(i): ["09:00"] for i in range(7)}


def test_old_weekly_becomes_those_days_at_the_same_time():
    rep = engine.Repeat.from_dict({"type": "weekly", "time": "19:30", "weekdays": [2, 0]})
    assert rep.type == "schedule"
    assert rep.days == {"0": ["19:30"], "2": ["19:30"]}


def test_old_every_n_days_and_on_demand_are_unchanged():
    rep = engine.Repeat.from_dict({"type": "every_n_days", "time": "07:15", "every_n_days": 3})
    assert (rep.type, rep.time, rep.every_n_days) == ("every_n_days", "07:15", 3)
    assert engine.Repeat.from_dict(None).type == "none"
    assert engine.Repeat.from_dict({"type": "none", "weekdays": [1]}).days == {}


def test_a_chore_with_an_old_repeat_loads_and_validates():
    chore = engine.Chore.from_dict(
        {"name": "Trash", "steps": [{"title": "Out"}], "repeat": {"type": "weekly", "time": "19:00", "weekdays": [3]}}
    )
    assert engine.validate_chore(chore) is None
    assert chore.repeat.days == {"3": ["19:00"]}


def test_times_are_cleaned_sorted_and_deduplicated():
    rep = engine.Repeat.from_dict({"type": "schedule", "days": {"1": ["8:5", "08:05", "07:00"], "2": []}})
    assert rep.days == {"1": ["07:00", "08:05"]}


# --- validation and storage ------------------------------------------------


def chore_with(rep):
    return engine.Chore(id="c", name="X", steps=[engine.Step("a", "Do")], repeat=rep)


def test_valid_schedules_pass():
    assert engine.validate_chore(chore_with(schedule(mon=["09:00"]))) is None
    assert engine.validate_chore(chore_with(schedule(mon=["09:00", "21:00"], sun=["00:00"]))) is None
    assert engine.validate_chore(chore_with(engine.Repeat())) is None


def test_invalid_schedules_are_refused():
    assert engine.validate_chore(chore_with(engine.Repeat(type="schedule")))  # no days
    assert engine.validate_chore(chore_with(schedule(mon=["25:00"])))
    assert engine.validate_chore(chore_with(schedule(mon=["nine"])))
    assert engine.validate_chore(chore_with(engine.Repeat(type="schedule", days={"7": ["09:00"]})))
    assert engine.validate_chore(chore_with(engine.Repeat(type="schedule", days={"0": []})))
    too_many = [f"{h:02d}:00" for h in range(engine.MAX_TIMES_PER_DAY + 1)]
    assert engine.validate_chore(chore_with(schedule(mon=too_many)))
    assert engine.validate_chore(chore_with(engine.Repeat(type="every_n_days", time="99:00")))
    assert engine.validate_chore(chore_with(engine.Repeat(type="every_n_days", every_n_days=0)))
    assert engine.validate_chore(chore_with(engine.Repeat(type="yearly")))


def test_the_schedule_roundtrips_through_json():
    chore = chore_with(schedule(mon=["19:30"], sat=["11:00", "20:00"]))
    again = engine.Chore.from_dict(json.loads(json.dumps(engine.to_dict(chore))))
    assert again == chore


def test_init_schedule_sets_the_first_due_time():
    chore = chore_with(schedule(fri=["19:00"]))
    engine.init_schedule(chore, at(2026, 11, 16, 8), VIENNA)
    due = local(engine.parse_ts(chore.next_due))
    assert (due.day, due.hour) == (20, 19)
    chore.repeat = engine.Repeat()
    engine.init_schedule(chore, at(2026, 11, 16, 8), VIENNA)
    assert chore.next_due is None


def test_due_time_never_goes_backwards():
    rep = schedule(mon=["09:00", "21:00"], wed=["12:00"])
    t = at(2026, 11, 16)
    seen = []
    for _ in range(12):
        t = engine.compute_next_due(rep, t, VIENNA)
        seen.append(t)
    assert seen == sorted(seen) and len(set(seen)) == 12
    assert all(b - a > timedelta(0) for a, b in zip(seen, seen[1:]))
