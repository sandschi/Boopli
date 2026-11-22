"""Tests for away mode: dates, the pet's frozen mood and what happens on return."""

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


engine = _load("boopli_engine_away", "engine.py")

UTC = timezone.utc
TZ = ZoneInfo("Europe/Vienna")
NOW = datetime(2026, 11, 21, 10, 0, tzinfo=UTC)  # 11:00 in Vienna, a Saturday


def days(n: float) -> timedelta:
    return timedelta(days=n)


# --- switching it on -----------------------------------------------------------


def test_away_from_now_until_a_date():
    away = engine.set_away("", "2026-11-28T10:00", NOW, TZ)
    assert away.active and away.start is None
    assert engine.parse_ts(away.until) == datetime(2026, 11, 28, 9, 0, tzinfo=UTC)  # 10:00 in Vienna


def test_away_until_switched_off_has_no_end():
    away = engine.set_away("", "", NOW, TZ)
    assert away.active and away.until is None
    assert engine.away_in_effect(away, NOW + days(300))


def test_a_start_in_the_past_begins_now():
    assert engine.set_away("2026-11-20T08:00", "", NOW, TZ).start is None


def test_bad_dates_are_refused():
    with pytest.raises(ValueError):
        engine.set_away("", "2026-11-20T10:00", NOW, TZ)  # the end is past
    with pytest.raises(ValueError):
        engine.set_away("2026-12-05T10:00", "2026-12-01T10:00", NOW, TZ)  # ends before it starts
    with pytest.raises(ValueError):
        engine.set_away("", "2028-01-01T10:00", NOW, TZ)  # more than 400 days
    with pytest.raises(ValueError):
        engine.set_away("", "next friday", NOW, TZ)


def test_it_can_begin_later_and_end_by_itself():
    away = engine.set_away("2026-11-25T08:00", "2026-12-02T08:00", NOW, TZ)
    assert not engine.away_in_effect(away, NOW)
    assert engine.away_in_effect(away, NOW + days(5))
    assert not engine.away_in_effect(away, NOW + days(12))
    assert engine.advance_away(away, NOW) is None
    assert engine.advance_away(away, NOW + days(5)) == "started"
    assert away.began_at is not None
    assert engine.advance_away(away, NOW + days(6)) is None  # only once
    assert engine.advance_away(away, NOW + days(12)) == "ended"


def test_nothing_happens_while_it_is_off():
    assert engine.advance_away(engine.Away(), NOW) is None
    assert not engine.away_in_effect(engine.Away(), NOW)


def test_away_survives_storage():
    away = engine.set_away("", "2026-11-28T10:00", NOW, TZ)
    away.began_at = engine.fmt_ts(NOW)
    assert engine.Away.from_dict(engine.to_dict(away)) == away
    assert engine.Away.from_dict(None) == engine.Away()


# --- the pet does not get sad while you are away --------------------------------


def progress(last: datetime | None, started: datetime = NOW - days(30)) -> "engine.Progress":
    return engine.Progress(
        total_xp=100,
        started_at=engine.fmt_ts(started),
        last_activity=engine.fmt_ts(last) if last else None,
    )


def test_the_mood_stays_as_it_was_while_away():
    p = progress(NOW - timedelta(hours=2))
    before = engine.mood_for(p, NOW, TZ)
    later = NOW + days(14)
    assert engine.mood_for(p, later, TZ) == engine.MOOD_HIBERNATING  # without away mode
    frozen = engine.shifted_progress(p, engine.fmt_ts(NOW), later)
    assert engine.mood_for(frozen, later, TZ) in (before, engine.MOOD_HAPPY)


def test_activity_while_away_is_left_alone():
    began = NOW
    done_while_away = NOW + days(3)
    p = progress(done_while_away)
    moved = engine.shifted_progress(p, engine.fmt_ts(began), NOW + days(10))
    assert moved.last_activity == engine.fmt_ts(done_while_away)


def test_a_shifted_activity_is_never_in_the_future():
    p = progress(NOW - days(1))
    moved = engine.shifted_progress(p, engine.fmt_ts(NOW), NOW + days(30))
    assert engine.parse_ts(moved.last_activity) <= NOW + days(30)


def test_no_shift_without_a_start():
    p = progress(NOW - days(2))
    assert engine.shifted_progress(p, None, NOW + days(5)) is p


# --- coming back ---------------------------------------------------------------


def chore(name: str, repeat, due: datetime | None, **kw) -> "engine.Chore":
    return engine.Chore(
        id=name,
        name=name,
        steps=[engine.Step("s", "Do it")],
        repeat=repeat,
        next_due=engine.fmt_ts(due) if due else None,
        **kw,
    )


def test_back_home_recurring_chores_start_over_and_parts_start_now():
    back = NOW + days(7)
    weekly = chore("weekly", engine.Repeat.daily("09:00"), NOW + days(2))
    every3 = chore(
        "every3",
        engine.Repeat(type=engine.REPEAT_EVERY_N_DAYS, time="09:00", every_n_days=3),
        NOW + days(1),
    )
    pills = chore("pills", engine.Repeat.daily("08:00"), NOW + days(2), keeps_going=True)
    part = chore("part", engine.Repeat(), NOW + days(1), parked=True, one_off=True)
    future = chore("future", engine.Repeat.daily("09:00"), back + days(1))
    away = engine.Away(active=True, began_at=engine.fmt_ts(NOW))
    engine.return_from_away(
        away, progress(NOW - days(1)), [], [weekly, every3, pills, part, future], back, TZ
    )
    assert engine.parse_ts(weekly.next_due) > back  # missed days are not made up
    assert engine.parse_ts(every3.next_due) >= back + days(3) - timedelta(hours=24)  # counts from now
    assert engine.parse_ts(every3.next_due) > back
    assert engine.parse_ts(pills.next_due) == NOW + days(2)  # untouched: it kept going
    assert engine.parse_ts(part.next_due) <= back  # still due: starts right away
    assert engine.parse_ts(future.next_due) == back + days(1)


def test_frozen_runs_nudge_again_one_after_the_other():
    back = NOW + days(7)
    runs = []
    for index in range(3):
        run, _ = engine.start_run(chore(f"c{index}", engine.Repeat(), None), NOW + timedelta(minutes=index))
        runs.append(run)
    engine.return_from_away(engine.Away(active=True), progress(NOW), runs, [], back, TZ)
    due = [engine.parse_ts(r.steps[0].next_nudge_at) for r in runs]
    assert due == [back, back + timedelta(minutes=2), back + timedelta(minutes=4)]


def test_the_pets_days_away_do_not_count_on_return():
    began = NOW
    back = NOW + days(10)
    p = progress(NOW - timedelta(hours=3))
    engine.return_from_away(engine.Away(active=True, began_at=engine.fmt_ts(began)), p, [], [], back, TZ)
    assert engine.mood_for(p, back, TZ) != engine.MOOD_HIBERNATING


# --- the chore switch ----------------------------------------------------------


def test_keeps_going_is_saved_with_the_chore():
    c = engine.Chore.from_dict({"name": "Pills", "keeps_going": True, "steps": [{"title": "Take them"}]})
    assert c.keeps_going
    assert engine.Chore.from_dict(engine.to_dict(c)).keeps_going
    assert not engine.Chore.from_dict({"name": "x", "steps": [{"title": "y"}]}).keeps_going
