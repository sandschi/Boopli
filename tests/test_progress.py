"""Tests for Blubs, XP, levels, the shop, feeding and the pet's mood."""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest

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


def test_level_thresholds_start_at_20_and_reach_540_at_level_10():
    assert [engine.level_threshold(n) for n in (1, 2, 3, 4, 5)] == [0, 20, 50, 90, 140]
    assert engine.level_threshold(10) == 540


def test_level_2_is_reached_after_the_first_chore():
    # one step that finishes the chore, quick: 35 Blubs = a medium and a small meal = 20 XP
    assert engine.level_for(20)[0] == 2
    assert engine.FOOD["medium"][1] + engine.FOOD["small"][1] == 20


def test_from_level_10_each_step_is_about_6_percent_dearer_then_flat_from_level_20():
    assert engine.level_step(10) == 110
    steps = [engine.level_step(n) for n in range(10, 20)]
    assert steps == sorted(steps) and steps[-1] < 200
    assert all(1.05 < b / a < 1.07 for a, b in zip(steps, steps[1:]))
    assert {engine.level_step(n) for n in range(20, 60)} == {200}
    assert engine.level_threshold(21) - engine.level_threshold(20) == 200
    assert engine.level_threshold(101) - engine.level_threshold(100) == 200  # no maximum level


def test_the_curve_matches_the_pace_it_was_made_for():
    per_day = 45  # about 3 chores a day
    assert 11 <= engine.level_threshold(10) / per_day <= 13  # level 10 after about 12 days
    assert 5 * 7 <= engine.level_threshold(20) / per_day <= 7 * 7  # level 20 after about 6 weeks
    assert 2.5 * 30 <= engine.level_threshold(30) / per_day <= 3.5 * 30  # level 30 after about 3 months


def test_level_for_gives_progress_inside_the_level():
    assert engine.level_for(0) == (1, 0, 20)
    assert engine.level_for(19) == (1, 19, 20)
    assert engine.level_for(20) == (2, 0, 30)
    assert engine.level_for(49) == (2, 29, 30)
    assert engine.level_for(50) == (3, 0, 40)
    assert engine.level_for(10_000)[0] > 20


# --- Blubs -----------------------------------------------------------------


def test_a_step_gives_10_blubs_and_no_xp():
    p = engine.Progress()
    a = give(p)
    assert (a.blubs, a.total_blubs, p.blubs, p.total_xp) == (10, 10, 10, 0)


def test_bigger_steps_give_15_and_20_blubs():
    sizes = {"small": 10, "medium": 15, "big": 20}
    for size, blubs in sizes.items():
        p = engine.Progress()
        award = engine.award_step(p, "c1", "r1", NOON, TZ, None, False, size)
        assert award.blubs == blubs, size


def test_the_step_that_finishes_the_chore_gives_20_more():
    assert give(engine.Progress(), chore_done=True).blubs == 30


def test_a_quick_answer_gives_5_more_but_a_slow_one_loses_nothing():
    active = NOON - timedelta(minutes=10)
    assert give(engine.Progress(), active_at=engine.fmt_ts(active)).blubs == 15
    slow = NOON - timedelta(minutes=11)
    assert give(engine.Progress(), active_at=engine.fmt_ts(slow)).blubs == 10
    assert give(engine.Progress(), active_at=engine.fmt_ts(NOON - timedelta(days=2))).blubs == 10


def test_one_step_with_chore_end_and_quick_is_35_blubs():
    p = engine.Progress()
    assert give(p, chore_done=True, active_at=engine.fmt_ts(NOON - timedelta(minutes=2))).blubs == 35


def test_all_steps_of_one_run_earn_blubs_even_beyond_the_run_cap():
    p = engine.Progress()
    assert [give(p, run="r1").blubs for _ in range(6)] == [10] * 6


def test_only_the_first_three_runs_of_a_chore_earn_blubs_per_day():
    p = engine.Progress()
    assert [give(p, run=f"r{i}").blubs for i in range(5)] == [10, 10, 10, 0, 0]
    assert give(p, run="r1").blubs == 10  # a run that already earned keeps earning
    assert give(p, chore="other", run="x").blubs == 10  # another chore has its own cap


def test_the_cap_starts_fresh_the_next_day():
    p = engine.Progress()
    for i in range(4):
        give(p, run=f"r{i}")
    assert give(p, run="r9", now=day(1)).blubs == 10


def test_a_capped_step_still_counts_as_activity():
    p = engine.Progress()
    for i in range(3):
        give(p, run=f"r{i}")
    later = day(1)
    for i in range(3, 6):
        give(p, run=f"r{i}", now=later)
    a = give(p, run="r7", now=later)
    assert a.blubs == 0
    assert p.last_activity == engine.fmt_ts(later)


def test_bookkeeping_older_than_a_week_is_dropped():
    p = engine.Progress()
    give(p, run="old", now=NOON)
    p.fed[NOON.date().isoformat()] = 2
    give(p, run="new", now=day(9))
    assert list(p.credited) == [day(9).date().isoformat()]
    assert p.fed == {}


def test_nothing_ever_takes_blubs_xp_or_a_level_away():
    p = engine.Progress(total_xp=500, blubs=70, started_at=engine.fmt_ts(NOON - timedelta(days=30)))
    assert engine.mood_for(p, NOON, TZ) == "hibernating"
    assert (p.total_xp, p.blubs) == (500, 70)
    assert engine.level_for(p.total_xp)[0] == 9


def test_the_start_gift_is_30_blubs_once():
    p = engine.Progress()
    assert engine.hand_out_start_gift(p) and p.blubs == 30 == engine.BLUBS_START
    assert not engine.hand_out_start_gift(p) and p.blubs == 30


# --- feeding ---------------------------------------------------------------


def test_feeding_costs_food_from_the_stock_and_gives_xp():
    p = engine.Progress(food={"small": 1, "medium": 2, "big": 1})
    expected = {"small": 5, "medium": 15, "big": 30}
    for size, xp in expected.items():
        meal = engine.feed_pet(p, size, NOON, TZ)
        assert meal.xp == xp
    assert p.total_xp == 50 and p.food == {"medium": 1}
    assert p.fed == {NOON.date().isoformat(): 3}


def test_food_prices_match_what_the_pet_gets():
    assert engine.FOOD == {"small": (10, 5), "medium": (25, 15), "big": (50, 30)}
    for item in engine.SHOP_ITEMS:
        if item.kind == engine.KIND_FOOD:
            assert item.price == engine.FOOD[item.food][0]


def test_feeding_needs_food_in_the_stock():
    p = engine.Progress()
    with pytest.raises(engine.ShopError):
        engine.feed_pet(p, "small", NOON, TZ)
    with pytest.raises(engine.ShopError):
        engine.feed_pet(p, "huge", NOON, TZ)


def test_after_three_meals_the_pet_is_full_and_the_food_stays():
    p = engine.Progress(food={"small": 5})
    for _ in range(3):
        engine.feed_pet(p, "small", NOON, TZ)
    xp = p.total_xp
    with pytest.raises(engine.ShopError):
        engine.feed_pet(p, "small", NOON, TZ)
    assert p.total_xp == xp and p.food == {"small": 2}
    engine.feed_pet(p, "small", day(1), TZ)  # the next day it is hungry again
    assert p.total_xp == xp + 5


def test_the_day_is_the_local_day():
    p = engine.Progress(food={"small": 5})
    for _ in range(3):
        engine.feed_pet(p, "small", NOON.replace(hour=23, minute=50), TZ)
    assert engine.meals_today(p, NOON.replace(hour=23, minute=55), TZ) == 3
    assert engine.meals_today(p, NOON.replace(hour=23, minute=55) + timedelta(minutes=10), TZ) == 0


def test_feeding_can_level_up_and_says_so_once():
    p = engine.Progress(food={"medium": 2}, total_xp=10)
    first = engine.feed_pet(p, "medium", NOON, TZ)
    assert first.level_up and first.level == 2
    assert not engine.feed_pet(p, "medium", NOON, TZ).level_up


# --- the shop --------------------------------------------------------------


def test_the_shop_items_are_what_the_plan_says():
    by_id = engine.SHOP_BY_ID
    assert (by_id["water_bowl"].price, by_id["water_bowl"].min_level) == (30, 1)
    assert (by_id["food_bowl"].price, by_id["food_bowl"].min_level) == (40, 2)
    assert (by_id["bed"].price, by_id["bed"].min_level) == (80, 3)
    assert by_id["color_sky"].price == by_id["pattern_dots"].price == 20
    assert (by_id["meal_4"].price, by_id["meal_4"].min_level) == (300, 5)
    assert (by_id["meal_5"].price, by_id["meal_5"].min_level) == (800, 10)
    assert len(by_id) == len(engine.SHOP_ITEMS)  # ids are unique


def test_buying_pays_and_the_item_is_owned_and_cannot_be_bought_twice():
    p = engine.Progress(blubs=100)
    engine.buy_item(p, "water_bowl", 1)
    assert p.blubs == 70 and p.owned == ["water_bowl"]
    with pytest.raises(engine.ShopError):
        engine.buy_item(p, "water_bowl", 1)
    assert p.blubs == 70


def test_the_start_gift_exactly_buys_the_water_bowl():
    p = engine.Progress()
    engine.hand_out_start_gift(p)
    engine.buy_item(p, "water_bowl", 1)
    assert p.blubs == 0


def test_a_poor_household_or_a_low_level_cannot_buy():
    with pytest.raises(engine.ShopError):
        engine.buy_item(engine.Progress(blubs=29), "water_bowl", 1)
    rich = engine.Progress(blubs=1000)
    with pytest.raises(engine.ShopError):
        engine.buy_item(rich, "food_bowl", 1)  # needs level 2
    engine.buy_item(rich, "food_bowl", 2)
    assert rich.blubs == 960
    with pytest.raises(engine.ShopError):
        engine.buy_item(rich, "not_an_item", 99)


def test_food_is_always_buyable_and_goes_into_the_stock():
    p = engine.Progress(blubs=100)
    for item in ("food_small", "food_small", "food_medium", "food_big"):
        engine.buy_item(p, item, 1)
    assert p.food == {"small": 2, "medium": 1, "big": 1} and p.blubs == 100 - 10 - 10 - 25 - 50
    assert p.owned == []


def test_an_item_with_an_achievement_stays_locked_until_it_is_reached():
    item = engine.ShopItem("gold", engine.KIND_COLOR, 10, achievement="chores_100")
    p = engine.Progress(blubs=100)
    assert engine.item_locked(p, item, 1) == "achievement"
    p.achievements.append("chores_100")
    assert engine.item_locked(p, item, 1) == ""


def test_an_attachment_needs_the_item_it_sits_on_and_a_species_item_only_fits_its_pet():
    gem = engine.ShopItem("gem", engine.KIND_EXTRA, 10, attach_to="water_bowl")
    p = engine.Progress()
    assert engine.item_locked(p, gem, 1) == "requires"
    p.owned.append("water_bowl")
    assert engine.item_locked(p, gem, 1) == ""
    hat = engine.ShopItem("hat", engine.KIND_EXTRA, 10, species="cat")
    assert engine.item_locked(p, hat, 1, "dog") == "species"
    assert engine.item_locked(p, hat, 1, "cat") == ""


def test_the_meal_upgrades_raise_the_limit_for_good_and_build_on_each_other():
    p = engine.Progress(blubs=2000)
    assert engine.meals_allowed(p) == 3
    with pytest.raises(engine.ShopError):
        engine.buy_item(p, "meal_4", 4)  # level 5
    with pytest.raises(engine.ShopError):
        engine.buy_item(p, "meal_5", 10)  # the 4th meal first
    engine.buy_item(p, "meal_4", 5)
    assert engine.meals_allowed(p) == 4
    engine.buy_item(p, "meal_5", 10)
    assert engine.meals_allowed(p) == 5
    p.food = {"small": 6}
    for _ in range(5):
        engine.feed_pet(p, "small", NOON, TZ)
    with pytest.raises(engine.ShopError):
        engine.feed_pet(p, "small", NOON, TZ)


def test_a_colour_or_pattern_can_be_put_on_the_wall_or_floor_and_changed_or_removed():
    p = engine.Progress(owned=["color_sky", "pattern_dots", "water_bowl"])
    engine.place_item(p, "wall", "color_sky")
    engine.place_item(p, "floor", "pattern_dots")
    assert p.placed == {"wall": "color_sky", "floor": "pattern_dots"}
    engine.place_item(p, "wall", "pattern_dots")
    assert p.placed["wall"] == "pattern_dots"
    engine.place_item(p, "wall", "")
    assert p.placed == {"floor": "pattern_dots"}
    for place, item in (("ceiling", "color_sky"), ("wall", "water_bowl"), ("wall", "nope")):
        with pytest.raises(engine.ShopError):
            engine.place_item(p, place, item)
    unowned = engine.Progress()
    with pytest.raises(engine.ShopError):
        engine.place_item(unowned, "wall", "color_sky")


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


def test_progress_roundtrips_with_everything_in_it():
    p = engine.Progress(food={"small": 2}, owned=["water_bowl"], placed={"wall": "color_sky"}, achievements=["a"])
    engine.hand_out_start_gift(p)
    give(p, run="r1")
    engine.feed_pet(p, "small", NOON, TZ)
    again = engine.Progress.from_dict(json.loads(json.dumps(engine.to_dict(p))))
    assert again == p
    assert engine.Progress.from_dict(None) == engine.Progress()


def test_progress_from_before_blubs_starts_over_but_keeps_the_mood_dates():
    old = {
        "total_xp": 4000,
        "started_at": "2026-11-01T08:00:00Z",
        "last_activity": "2026-11-20T08:00:00Z",
        "egg_found": True,
        "credited": {"2026-11-20": {"c1": ["r1"]}},
    }
    fresh = engine.Progress.from_dict(old)
    assert fresh == engine.Progress(started_at=old["started_at"], last_activity=old["last_activity"])
    assert engine.level_for(fresh.total_xp)[0] == 1 and not fresh.gift_given
    assert engine.reset_progress_data(old)["economy"] == engine.ECONOMY_VERSION
    assert engine.Progress.from_dict(engine.reset_progress_data(old)).total_xp == 0


def test_progress_of_this_version_is_kept_as_it_is():
    p = engine.Progress(total_xp=300, blubs=12)
    assert engine.Progress.from_dict(engine.to_dict(p)) == p


def test_damaged_progress_data_cannot_give_negative_numbers_or_unknown_places():
    p = engine.Progress.from_dict(
        {"economy": 1, "blubs": -5, "food": {"small": -2, "huge": 3}, "placed": {"ceiling": "x", "wall": ""}}
    )
    assert p.blubs == 0 and p.food == {"small": 0} and p.placed == {}


def test_the_pet_name_defaults_validates_and_roundtrips():
    s = engine.Settings.from_dict({})
    assert s.pet_name == "Boopli"
    assert engine.Settings.from_dict({"pet_name": "  "}).pet_name == "Boopli"
    named = engine.Settings.from_dict({"pet_name": " Bruno "})
    assert named.pet_name == "Bruno" and engine.validate_settings(named) is None
    assert engine.Settings.from_dict(json.loads(json.dumps(engine.to_dict(named)))) == named
    assert engine.validate_settings(engine.Settings.from_dict({"pet_name": "x" * 31}))


# --- the Easter egg's one-time gift -----------------------------------------------------


def test_easter_egg_gives_ten_blubs_only_the_first_time():
    progress = engine.Progress()
    first = engine.award_egg(progress, NOON, TZ)
    assert first.blubs == engine.EGG_BLUBS == 10 and first.total_blubs == 10 and progress.egg_found
    again = engine.award_egg(progress, NOON, TZ)
    assert again.blubs == 0 and again.total_blubs == 10


def test_easter_egg_is_not_chore_work():
    quiet = engine.Progress()
    award = engine.award_egg(quiet, NOON, TZ)
    assert quiet.last_activity is None and not award.woke_up  # it does not wake the pet
    assert quiet.total_xp == 0  # and gives no XP: XP only comes from feeding


def test_easter_egg_flag_survives_storage():
    progress = engine.Progress()
    engine.award_egg(progress, NOON, TZ)
    again = engine.Progress.from_dict(engine.to_dict(progress))
    assert again.egg_found and again.blubs == 10
    assert not engine.Progress.from_dict({"economy": 1, "blubs": 5}).egg_found


# --- achievements ------------------------------------------------------------


def _with_achievements(monkeypatch, *achievements):
    monkeypatch.setattr(engine, "ACHIEVEMENTS", tuple(achievements))


def test_there_are_no_base_achievements_yet_and_nothing_breaks_without_them():
    assert engine.ACHIEVEMENTS == ()
    p = engine.Progress()
    give(p)
    assert engine.reach_achievements(p) == []
    assert p.achievements == []


def test_finished_steps_and_chores_are_counted_only_when_they_earn_blubs():
    p = engine.Progress()
    give(p, "c1", "r1")
    give(p, "c1", "r1", chore_done=True)
    assert p.stats == {"step_done": 2, "chore_done": 1}
    # the 4th run of a chore on one day earns nothing, so it counts for nothing (no farming)
    for n in range(2, 5):
        give(p, "c1", f"r{n}", chore_done=True)
    assert p.stats == {"step_done": 4, "chore_done": 3}


def test_feeding_and_the_egg_are_counted():
    p = engine.Progress(food={"small": 2})
    engine.feed_pet(p, "small", NOON, TZ)
    engine.feed_pet(p, "small", NOON, TZ)
    engine.award_egg(p, NOON, TZ)
    engine.award_egg(p, NOON, TZ)  # a second find gives and counts nothing
    assert p.stats == {"fed": 2, "egg_found": 1}


def test_reaching_gives_the_new_ones_in_order_and_only_once(monkeypatch):
    a = engine.Achievement("two_steps", engine.STAT_STEP_DONE, 2)
    b = engine.Achievement("one_step", engine.STAT_STEP_DONE, 1)
    _with_achievements(monkeypatch, a, b)
    p = engine.Progress()
    give(p, "c1", "r1")
    assert engine.reach_achievements(p) == [b]
    give(p, "c1", "r1")
    assert engine.reach_achievements(p) == [a]
    assert engine.reach_achievements(p) == []
    assert p.achievements == ["one_step", "two_steps"]


def test_one_event_can_reach_several_at_once(monkeypatch):
    _with_achievements(
        monkeypatch,
        engine.Achievement("a", engine.STAT_STEP_DONE, 1),
        engine.Achievement("b", engine.STAT_CHORE_DONE, 1),
    )
    p = engine.Progress()
    give(p, chore_done=True)
    assert [x.id for x in engine.reach_achievements(p)] == ["a", "b"]


def test_the_level_is_a_stat_too(monkeypatch):
    _with_achievements(monkeypatch, engine.Achievement("level_2", engine.STAT_LEVEL, 2))
    p = engine.Progress(food={"big": 1})
    assert engine.reach_achievements(p) == []
    engine.feed_pet(p, "big", NOON, TZ)  # 30 XP: level 2
    assert [x.id for x in engine.reach_achievements(p)] == ["level_2"]


def test_the_streak_counts_days_in_a_row_and_a_gap_only_restarts_it():
    p = engine.Progress()
    for n in (0, 1, 2):
        give(p, "c1", f"r{n}", now=day(n))
    assert (p.streak, p.streak_best) == (3, 3)
    give(p, "c1", "r3", now=day(2))  # the same day twice is still one day
    assert (p.streak, p.streak_best) == (3, 3)
    give(p, "c1", "r4", now=day(5))  # two days without a step: the streak starts over...
    assert (p.streak, p.streak_best) == (1, 3)  # ...and the best one is not lost


def test_a_streak_achievement_stays_once_the_streak_is_broken(monkeypatch):
    _with_achievements(monkeypatch, engine.Achievement("three_days", engine.STAT_STREAK, 3))
    p = engine.Progress()
    for n in (0, 1, 2):
        give(p, "c1", f"r{n}", now=day(n))
    assert [x.id for x in engine.reach_achievements(p)] == ["three_days"]
    give(p, "c1", "r9", now=day(9))
    assert p.achievements == ["three_days"]


def test_nothing_is_ever_taken_back(monkeypatch):
    _with_achievements(monkeypatch)  # the registry may shrink in a later version: what was reached stays
    p = engine.Progress(achievements=["old_one"])
    assert engine.reach_achievements(p) == []
    assert p.achievements == ["old_one"]


def test_the_counters_and_the_streak_round_trip_through_saving():
    p = engine.Progress(stats={"step_done": 4}, streak=2, streak_best=5, streak_day="2026-11-21", achievements=["x"])
    again = engine.Progress.from_dict(engine.to_dict(p))
    assert (again.stats, again.streak, again.streak_best, again.streak_day, again.achievements) == (
        {"step_done": 4}, 2, 5, "2026-11-21", ["x"]
    )


def test_odd_saved_counters_are_cleaned():
    p = engine.Progress.from_dict({"economy": 1, "stats": {"step_done": -3, "fed": "2"}, "streak": -1})
    assert p.stats == {"step_done": 0, "fed": 2} and p.streak == 0
