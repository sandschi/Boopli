"""Tests for nudging: ladders, quiet hours, snooze, presence rules, payloads."""

from __future__ import annotations

import importlib.util
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "engine.py"
_SPEC = importlib.util.spec_from_file_location("boopli_engine_nudging", _PATH)
engine = importlib.util.module_from_spec(_SPEC)
sys.modules["boopli_engine_nudging"] = engine
_SPEC.loader.exec_module(engine)

UTC = timezone.utc
VIENNA = ZoneInfo("Europe/Vienna")
T0 = datetime(2026, 11, 21, 10, 0, tzinfo=UTC)


def vienna(y, m, d, hh, mm) -> datetime:
    return datetime(y, m, d, hh, mm, tzinfo=VIENNA)


def working_week_quiet() -> "engine.QuietHours":
    """Mon-Fri nudges from 07:30 to 22:00, Sat and Sun from 11:00 to 22:00."""
    days = {str(d): engine.QuietDay("07:30", "22:00") for d in range(5)}
    days["5"] = engine.QuietDay("11:00", "22:00")
    days["6"] = engine.QuietDay("11:00", "22:00")
    return engine.QuietHours(enabled=True, days=days)


def active_step(now=T0) -> "engine.StepRun":
    chore = engine.Chore(id="c", name="Dishes", steps=[engine.Step("s1", "Do the dishes")])
    run, _ = engine.start_run(chore, now)
    return run.steps[0]


# --- ladders -------------------------------------------------------------


def test_new_active_step_is_due_for_a_nudge_right_away():
    step = active_step()
    assert step.status == "active"
    assert step.nudge_count == 0
    assert step.next_nudge_at == step.active_at


def test_waking_a_waiting_step_makes_its_nudge_due():
    chore = engine.Chore(
        id="c", name="Laundry", steps=[engine.Step("a", "Hang", 60)]
    )
    run, _ = engine.start_run(chore, T0)
    assert run.steps[0].next_nudge_at is None  # waiting steps are not nudged
    engine.wake_steps(run, T0 + timedelta(minutes=61))
    assert run.steps[0].status == "active"
    assert run.steps[0].next_nudge_at == run.steps[0].active_at


def test_escalating_gaps_shrink_then_stop():
    step = active_step()
    now = T0
    gaps = []
    for _ in range(10):
        engine.record_nudge(step, "escalating", now)
        if step.next_nudge_at is None:
            break
        gap = engine.parse_ts(step.next_nudge_at) - now
        gaps.append(int(gap.total_seconds() // 60))
        now = engine.parse_ts(step.next_nudge_at)
    assert gaps == [30, 15, 10, 5, 5, 5]
    assert step.nudge_count == 7
    assert step.next_nudge_at is None


def test_persistent_never_stops():
    step = active_step()
    for _ in range(50):
        engine.record_nudge(step, "persistent", T0)
        assert step.next_nudge_at is not None
    assert engine.next_gap("persistent", 999) == 5


def test_one_nudge_style_sends_once():
    step = active_step()
    engine.record_nudge(step, "one", T0)
    assert step.next_nudge_at is None
    assert step.nudge_count == 1


# --- decisions -----------------------------------------------------------


def decide(step, *, where="home", style="one", ignore=False, quiet=None, home=True, now=T0):
    return engine.decide_nudge(
        step, where, style, ignore, quiet or engine.QuietHours(), home, now, VIENNA
    )


def test_due_step_at_home_sends_on_all_channels():
    d = decide(active_step())
    assert (d.action, d.channels) == ("send", "all")


def test_quiet_style_never_nudges():
    assert decide(active_step(), style="quiet").action == "none"


def test_not_due_yet_waits_until_due():
    step = active_step()
    engine.record_nudge(step, "escalating", T0)
    d = decide(step, style="escalating", now=T0 + timedelta(minutes=1))
    assert d.action == "wait"
    assert d.wake_at == T0 + timedelta(minutes=30)


def test_away_anywhere_chore_uses_phone_only():
    d = decide(active_step(), where="anywhere", home=False)
    assert (d.action, d.channels) == ("send", "phone_only")


def test_away_home_chore_waits_for_presence():
    d = decide(active_step(), where="home", home=False)
    assert d.action == "wait"
    assert d.wake_at is None


def test_quiet_hours_off_by_default():
    assert not engine.is_quiet(T0, engine.QuietHours(), VIENNA)
    assert decide(active_step(), quiet=engine.QuietHours()).action == "send"


def test_weekday_morning_holds_until_0730():
    q = working_week_quiet()
    monday_0600 = vienna(2026, 11, 23, 6, 0)  # a Monday
    assert engine.is_quiet(monday_0600, q, VIENNA)
    assert engine.quiet_ends(monday_0600, q, VIENNA) == vienna(2026, 11, 23, 7, 30)
    assert not engine.is_quiet(vienna(2026, 11, 23, 7, 30), q, VIENNA)


def test_saturday_morning_holds_until_11():
    q = working_week_quiet()
    sat_0900 = vienna(2026, 11, 21, 9, 0)  # a Saturday
    assert engine.is_quiet(sat_0900, q, VIENNA)
    assert engine.quiet_ends(sat_0900, q, VIENNA) == vienna(2026, 11, 21, 11, 0)
    # Sunday works the same
    sun_1059 = vienna(2026, 11, 22, 10, 59)
    assert engine.is_quiet(sun_1059, q, VIENNA)
    assert not engine.is_quiet(vienna(2026, 11, 22, 11, 0), q, VIENNA)


def test_friday_night_holds_until_saturday_11():
    q = working_week_quiet()
    fri_2300 = vienna(2026, 11, 20, 23, 0)
    assert engine.is_quiet(fri_2300, q, VIENNA)
    assert engine.quiet_ends(fri_2300, q, VIENNA) == vienna(2026, 11, 21, 11, 0)


def test_sunday_night_holds_until_monday_0730():
    q = working_week_quiet()
    sun_2230 = vienna(2026, 11, 22, 22, 30)
    assert engine.quiet_ends(sun_2230, q, VIENNA) == vienna(2026, 11, 23, 7, 30)


def test_day_without_window_has_no_restriction():
    q = working_week_quiet()
    q.days["5"] = None  # Saturday unrestricted
    assert not engine.is_quiet(vienna(2026, 11, 21, 3, 0), q, VIENNA)
    # but Friday night is still held until Saturday midnight, which is already allowed
    fri_2300 = vienna(2026, 11, 20, 23, 0)
    assert engine.quiet_ends(fri_2300, q, VIENNA) == vienna(2026, 11, 21, 0, 0)


def test_quiet_hours_defer_a_nudge_unless_opted_out():
    q = working_week_quiet()
    sat_0900 = vienna(2026, 11, 21, 9, 0)
    step = active_step(sat_0900)  # the step became active, and is due, at 09:00
    d = decide(step, quiet=q, now=sat_0900)
    assert d.action == "wait"
    assert d.wake_at == vienna(2026, 11, 21, 11, 0)
    d = decide(step, quiet=q, ignore=True, now=sat_0900)  # pills
    assert d.action == "send"


# --- snooze --------------------------------------------------------------


def test_snooze_delays_but_keeps_step_active():
    step = active_step()
    engine.record_nudge(step, "escalating", T0)
    count = step.nudge_count
    assert engine.snooze_step(step, 15, T0 + timedelta(minutes=2))
    assert step.status == "active"
    assert step.nudge_count == count
    assert engine.parse_ts(step.next_nudge_at) == T0 + timedelta(minutes=17)
    assert step.snoozed_until == step.next_nudge_at


def test_snooze_on_a_one_nudge_step_nudges_once_more():
    step = active_step()
    engine.record_nudge(step, "one", T0)
    assert step.next_nudge_at is None
    engine.snooze_step(step, 15, T0 + timedelta(minutes=1))
    later = T0 + timedelta(minutes=16)
    assert decide(step, now=later).action == "send"
    engine.record_nudge(step, "one", later)
    assert step.next_nudge_at is None


def test_snooze_ignored_when_step_not_active():
    chore = engine.Chore(id="c", name="L", steps=[engine.Step("a", "Hang", 60)])
    run, _ = engine.start_run(chore, T0)
    assert engine.snooze_step(run.steps[0], 15, T0) is False


def test_nudge_state_survives_serialization():
    step = active_step()
    engine.record_nudge(step, "escalating", T0)
    engine.snooze_step(step, 15, T0)
    again = engine.StepRun.from_dict(json.loads(json.dumps(engine.to_dict(step))))
    assert again == step


# --- settings ------------------------------------------------------------


def good_settings() -> "engine.Settings":
    return engine.Settings(
        lights=[engine.LightCfg("light.wohnzimmer"), engine.LightCfg("light.spot", "indicator")],
        phones=[engine.PhoneCfg("mobile_app_sm_a335g", "high")],
        quiet_hours=working_week_quiet(),
        presence_entity="person.sandro",
        standard_done=True,
    )


def test_settings_validate_and_roundtrip():
    s = good_settings()
    assert engine.validate_settings(s) is None
    again = engine.Settings.from_dict(json.loads(json.dumps(engine.to_dict(s))))
    assert again == s


def test_settings_defaults_are_valid_and_quiet_hours_off():
    s = engine.Settings()
    assert engine.validate_settings(s) is None
    assert s.quiet_hours.enabled is False
    assert s.snooze_minutes == 15


def test_settings_validation_errors():
    def with_change(fn):
        s = good_settings()
        fn(s)
        return engine.validate_settings(s)

    assert with_change(lambda s: s.lights.append(engine.LightCfg("switch.x")))
    assert with_change(lambda s: s.lights.append(engine.LightCfg("light.x", "disco")))
    assert with_change(lambda s: s.phones.append(engine.PhoneCfg("notify.mobile_app_x")))
    assert with_change(lambda s: s.phones.append(engine.PhoneCfg("x", "loudest")))
    assert with_change(lambda s: s.quiet_hours.days.update({"3": engine.QuietDay("22:00", "07:00")}))
    assert with_change(lambda s: s.quiet_hours.days.update({"3": engine.QuietDay("7am", "22:00")}))
    assert with_change(lambda s: s.quiet_hours.days.update({"9": engine.QuietDay("07:00", "22:00")}))
    assert with_change(lambda s: setattr(s, "snooze_minutes", 0))
    assert with_change(lambda s: setattr(s, "default_style", "loud"))
    assert with_change(lambda s: setattr(s, "presence_entity", "sandro"))


def test_chore_nudge_style_is_validated():
    chore = engine.Chore(id="c", name="X", steps=[engine.Step("a", "Do")])
    assert engine.validate_chore(chore) is None
    chore.nudge_style = "shouting"
    assert engine.validate_chore(chore)


# --- payloads ------------------------------------------------------------


def test_action_ids_roundtrip():
    a = engine.action_id("BOOPLI_DONE", "run123abc456", "step123abc45")
    assert engine.parse_action(a) == ("BOOPLI_DONE", "run123abc456", "step123abc45")
    s = engine.action_id("BOOPLI_SNOOZE", "r1", "s1")
    assert engine.parse_action(s) == ("BOOPLI_SNOOZE", "r1", "s1")
    assert engine.parse_action("SOMETHING_ELSE") is None
    assert engine.parse_action("BOOPLI_DONE_onlyone") is None
    assert engine.parse_action("BOOPLI_DONE__") is None


def test_phone_payload_levels():
    def make(level):
        return engine.phone_payload(level, "r1", "s1", "Dishwasher", "Empty it", 15)

    normal = make("normal")["data"]
    assert normal["tag"] == "boopli-r1-s1"
    assert [a["title"] for a in normal["actions"]] == ["Done", "Snooze 15 min", "On it"]
    assert "channel" not in normal

    high = make("high")["data"]
    assert (high["channel"], high["importance"], high["priority"], high["ttl"]) == (
        "Boopli high priority", "high", "high", 0,
    )
    assert make("alarm")["data"]["channel"] == "alarm_stream"
    assert make("alarm_max")["data"]["channel"] == "alarm_stream_max"
    assert make("normal")["title"] == "Dishwasher"
    assert make("normal")["message"] == "Empty it"


# --- lights --------------------------------------------------------------


def test_indicator_on_a_hs_light_uses_hs_color():
    plan = engine.light_plan("indicator", ["color_temp", "hs"], [255, 90, 0])  # Spot
    assert plan["mode"] == "indicator"
    assert plan["data"]["brightness"] == 255
    assert "hs_color" in plan["data"] and "rgb_color" not in plan["data"]


def test_rgb_light_indicator_uses_rgb_color():
    plan = engine.light_plan("indicator", ["rgb"], [1, 2, 3])
    assert plan["data"]["rgb_color"] == [1, 2, 3]


def test_on_off_light_indicator_has_no_color_or_brightness():
    assert engine.light_plan("indicator", ["onoff"], [255, 90, 0])["data"] == {}


def test_new_light_defaults_to_blink_once():
    cfg = engine.LightCfg("light.x")
    assert (cfg.mode, cfg.blink_ms, cfg.repeats, cfg.gap_ms) == ("blink", 1500, 1, 1000)
    assert cfg.blink_seconds() == 1.5


def test_blink_seconds_counts_repeats_and_pauses():
    cfg = engine.LightCfg("light.x", blink_ms=1000, repeats=3, gap_ms=500)
    assert cfg.blink_seconds() == 4.0  # 3 x 1 s on, 2 x 0.5 s pause


def test_old_auto_and_flash_modes_become_blink():
    for old in ("auto", "flash"):
        cfg = engine.LightCfg.from_dict({"entity_id": "light.x", "mode": old})
        assert cfg.mode == "blink"
        assert (cfg.blink_ms, cfg.repeats, cfg.gap_ms) == (1500, 1, 1000)


def test_light_blink_settings_are_validated():
    def check(**kw):
        s = engine.Settings(lights=[engine.LightCfg("light.x", **kw)])
        return engine.validate_settings(s)

    assert check(blink_ms=100, repeats=5, gap_ms=0) is None
    assert check(blink_ms=99)
    assert check(blink_ms=30001)
    assert check(gap_ms=-1)
    assert check(gap_ms=30001)
    assert check(repeats=0)
    assert check(repeats=6)


def test_blink_on_a_color_light_shows_the_color():
    service, data = engine.blink_alert(["color_temp", "rgb"], [255, 0, 0], True)
    assert service == "turn_on"
    assert data == {"rgb_color": [255, 0, 0], "brightness": 255}


def test_blink_on_a_light_without_color_goes_dark_when_it_was_on():
    assert engine.blink_alert(["brightness"], [255, 0, 0], True) == ("turn_off", {})
    assert engine.blink_alert(["onoff"], [255, 0, 0], True) == ("turn_off", {})


def test_blink_on_a_light_without_color_lights_up_when_it_was_off():
    assert engine.blink_alert(["brightness"], [255, 0, 0], False) == (
        "turn_on", {"brightness": 255},
    )
    assert engine.blink_alert(["onoff"], [255, 0, 0], False) == ("turn_on", {})


def test_restore_puts_a_warm_white_light_back():
    attrs = {"brightness": 255, "color_mode": "color_temp", "color_temp_kelvin": 4000,
             "rgb_color": [255, 206, 166]}  # the Wohnzimmer strip
    assert engine.restore_plan("on", attrs) == (
        "turn_on", {"brightness": 255, "color_temp_kelvin": 4000},
    )


def test_restore_puts_a_colored_light_back():
    attrs = {"brightness": 120, "color_mode": "rgb", "rgb_color": (10, 20, 30)}
    assert engine.restore_plan("on", attrs) == (
        "turn_on", {"brightness": 120, "rgb_color": [10, 20, 30]},
    )
    hs = {"brightness": 50, "color_mode": "hs", "hs_color": (200.0, 40.0)}
    assert engine.restore_plan("on", hs)[1]["hs_color"] == [200.0, 40.0]


def test_restore_turns_a_light_that_was_off_back_off():
    assert engine.restore_plan("off", {"brightness": None}) == ("turn_off", {})


def test_restore_of_an_on_off_light_is_a_plain_turn_on():
    assert engine.restore_plan("on", {"color_mode": "onoff"}) == ("turn_on", {})
