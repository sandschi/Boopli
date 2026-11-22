"""Tests for XP, levels and the pet's mood."""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "engine.py"
_SPEC = importlib.util.spec_from_file_location("boopli_engine_progress", _PATH)
engine = importlib.util.module_from_spec(_SPEC)
sys.modules["boopli_engine_progress"] = engine
_SPEC.loader.exec_module(engine)

TZ = ZoneInfo("Europe/Vienna")
NOON = datetime(2026, 11, 21, 12, 0, tzinfo=TZ)


def day(n: int, hour: int = 12) -> datetime:
    return (NOON + timedelta(days=n)).replace(hour=hour)


def give(p, chore="c1", run="r1", now=NOON, active_at=None, chore_done=False):
    return engine.award_step(p, chore, run, now, TZ, active_at, chore_done)


# --- levels ----------------------------------------------------------------


def test_level_thresholds_are_100_250_450_and_slow_down():
    assert [engine.level_threshold(n) for n in (1, 2, 3, 4, 5)] == [0, 100, 250, 450, 700]


def test_level_for_gives_progress_inside_the_level():
    assert engine.level_for(0) == (1, 0, 100)
    assert engine.level_for(99) == (1, 99, 100)
    assert engine.level_for(100) == (2, 0, 150)
    assert engine.level_for(249) == (2, 149, 150)
    assert engine.level_for(250) == (3, 0, 200)
    assert engine.level_for(10_000)[0] > 10


# --- XP --------------------------------------------------------------------


def test_a_step_gives_10_xp():
    p = engine.Progress()
    a = give(p)
    assert (a.xp, a.total_xp, p.total_xp) == (10, 10, 10)


def test_the_step_that_finishes_the_chore_gives_20_more():
    assert give(engine.Progress(), chore_done=True).xp == 30


def test_a_quick_answer_gives_5_more_but_a_slow_one_loses_nothing():
    active = NOON - timedelta(minutes=10)
    assert give(engine.Progress(), active_at=engine.fmt_ts(active)).xp == 15
    slow = NOON - timedelta(minutes=11)
    assert give(engine.Progress(), active_at=engine.fmt_ts(slow)).xp == 10
    assert give(engine.Progress(), active_at=engine.fmt_ts(NOON - timedelta(days=2))).xp == 10


def test_all_steps_of_one_run_earn_xp_even_beyond_the_run_cap():
    p = engine.Progress()
    assert [give(p, run="r1").xp for _ in range(6)] == [10] * 6


def test_only_the_first_three_runs_of_a_chore_earn_xp_per_day():
    p = engine.Progress()
    assert [give(p, run=f"r{i}").xp for i in range(5)] == [10, 10, 10, 0, 0]
    assert give(p, run="r1").xp == 10  # a run that already earned keeps earning
    assert give(p, chore="other", run="x").xp == 10  # another chore has its own cap


def test_the_cap_starts_fresh_the_next_day():
    p = engine.Progress()
    for i in range(4):
        give(p, run=f"r{i}")
    assert give(p, run="r9", now=day(1)).xp == 10


def test_a_capped_step_still_counts_as_activity():
    p = engine.Progress()
    for i in range(3):
        give(p, run=f"r{i}")
    later = day(1)
    for i in range(3, 6):
        give(p, run=f"r{i}", now=later)  # the last of these is capped? no: new day
    a = give(p, run="r7", now=later)
    assert a.xp == 0
    assert p.last_activity == engine.fmt_ts(later)


def test_xp_bookkeeping_older_than_a_week_is_dropped():
    p = engine.Progress()
    give(p, run="old", now=NOON)
    give(p, run="new", now=day(9))
    assert list(p.credited) == [day(9).date().isoformat()]


def test_xp_never_goes_down():
    p = engine.Progress(total_xp=500, started_at=engine.fmt_ts(NOON - timedelta(days=30)))
    assert engine.mood_for(p, NOON, TZ) == "hibernating"
    assert p.total_xp == 500
    assert engine.level_for(p.total_xp)[0] == 4


def test_level_up_is_reported_once():
    p = engine.Progress(total_xp=95)
    first = give(p)
    assert first.level_up and first.level == 2
    assert not give(p, run="r2").level_up


# --- mood ------------------------------------------------------------------


def progress_active(days_ago: int) -> "engine.Progress":
    when = engine.fmt_ts(day(-days_ago))
    return engine.Progress(total_xp=50, started_at=engine.fmt_ts(day(-40)), last_activity=when)


def test_mood_follows_the_days_since_the_last_finished_step():
    expected = {
        0: "happy",
        1: "content",
        2: "sleepy",
        3: "sad",
        6: "sad",
        7: "hibernating",
        60: "hibernating",
    }
    for days, mood in expected.items():
        assert engine.mood_for(progress_active(days), NOON, TZ) == mood, days


def test_the_day_counts_by_local_date_not_by_24_hours():
    p = engine.Progress(last_activity=engine.fmt_ts(NOON.replace(hour=23, minute=50)))
    assert engine.mood_for(p, NOON + timedelta(hours=12), TZ) == "content"  # just after midnight
    assert engine.mood_for(p, NOON.replace(hour=23, minute=55), TZ) == "happy"


def test_a_new_pet_is_content_and_gets_sleepy_if_nothing_happens():
    new = engine.Progress(started_at=engine.fmt_ts(NOON))
    assert engine.mood_for(new, NOON, TZ) == "content"
    assert engine.mood_for(new, day(3), TZ) == "sad"
    assert engine.mood_for(new, day(8), TZ) == "hibernating"
    assert engine.mood_for(engine.Progress(), NOON, TZ) == "content"


def test_without_enabled_chores_the_pet_is_never_sleepy_sad_or_hibernating():
    p = progress_active(30)
    assert engine.mood_for(p, NOON, TZ, has_chores=False) == "content"
    assert engine.mood_for(progress_active(0), NOON, TZ, has_chores=False) == "happy"


def test_finishing_a_step_wakes_a_sad_or_hibernating_pet():
    for days, woke in ((0, False), (1, False), (2, False), (3, True), (10, True)):
        p = progress_active(days)
        a = give(p)
        assert a.woke_up is woke, days
        assert a.mood == "happy"


# --- storage ---------------------------------------------------------------


def test_progress_roundtrips_and_old_data_without_it_loads():
    p = engine.Progress()
    give(p, run="r1")
    again = engine.Progress.from_dict(json.loads(json.dumps(engine.to_dict(p))))
    assert again == p
    assert engine.Progress.from_dict(None) == engine.Progress()


def test_the_pet_name_defaults_validates_and_roundtrips():
    s = engine.Settings.from_dict({})
    assert s.pet_name == "Boopli"
    assert engine.Settings.from_dict({"pet_name": "  "}).pet_name == "Boopli"
    named = engine.Settings.from_dict({"pet_name": " Bruno "})
    assert named.pet_name == "Bruno" and engine.validate_settings(named) is None
    assert engine.Settings.from_dict(json.loads(json.dumps(engine.to_dict(named)))) == named
    assert engine.validate_settings(engine.Settings.from_dict({"pet_name": "x" * 31}))


# --- the Easter egg's one-time gift -----------------------------------------------------


def test_easter_egg_gives_ten_xp_only_the_first_time():
    progress = engine.Progress()
    first = engine.award_egg(progress, NOON, TZ)
    assert first.xp == engine.EGG_XP == 10 and first.total_xp == 10 and progress.egg_found
    again = engine.award_egg(progress, NOON, TZ)
    assert again.xp == 0 and again.total_xp == 10 and not again.level_up


def test_easter_egg_is_not_chore_work_and_can_level_up():
    progress = engine.Progress(total_xp=95)
    assert engine.award_egg(progress, NOON, TZ).level_up  # 95 + 10 passes level 2 at 100
    quiet = engine.Progress()
    award = engine.award_egg(quiet, NOON, TZ)
    assert quiet.last_activity is None and not award.woke_up  # it does not wake the pet


def test_easter_egg_flag_survives_storage():
    progress = engine.Progress()
    engine.award_egg(progress, NOON, TZ)
    again = engine.Progress.from_dict(engine.to_dict(progress))
    assert again.egg_found and again.total_xp == 10
    assert not engine.Progress.from_dict({"total_xp": 5}).egg_found
