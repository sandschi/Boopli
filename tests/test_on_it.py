"""The "On it" state: quiet while you work, one check-in, taken back, snoozed."""

from __future__ import annotations

import importlib.util
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

_DIR = Path(__file__).parents[1] / "custom_components" / "boopli"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, _DIR / file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


engine = _load("boopli_engine_on_it", "engine.py")

UTC = timezone.utc
T0 = datetime(2026, 11, 21, 10, 0, tzinfo=UTC)


def minutes(n: int) -> timedelta:
    return timedelta(minutes=n)


def active_step():
    chore = engine.Chore(
        id="c",
        name="Clean the kitchen",
        steps=[engine.Step("a", "Wipe the counter"), engine.Step("b", "Mop the floor")],
        nudge_style=engine.STYLE_ESCALATING,
    )
    run, _events = engine.start_run(chore, T0)
    step = run.steps[0]
    assert step.status == engine.STEP_ACTIVE
    return step


def decide(step, now):
    return engine.decide_nudge(
        step, "home", engine.STYLE_ESCALATING, False, engine.QuietHours(), True, now, UTC
    )


# --- in progress ---------------------------------------------------------------------------


def test_on_it_stops_nudging_until_the_check_in():
    step = active_step()
    assert decide(step, T0).action == "send"  # nudge due as usual
    assert engine.start_on_it(step, 30, T0)
    assert engine.in_progress(step)
    assert step.on_it_since == engine.fmt_ts(T0)
    for later in (1, 10, 29):
        assert decide(step, T0 + minutes(later)).action == "wait"
    check = decide(step, T0 + minutes(30))
    assert check.action == "send"


def test_the_wake_up_is_the_check_in_time():
    step = active_step()
    engine.start_on_it(step, 20, T0)
    assert decide(step, T0 + minutes(5)).wake_at == T0 + minutes(20)


def test_still_on_it_moves_the_check_in_and_keeps_the_start():
    step = active_step()
    engine.start_on_it(step, 30, T0)
    since = step.on_it_since
    engine.start_on_it(step, 30, T0 + minutes(30))
    assert step.on_it_since == since
    assert step.on_it_until == engine.fmt_ts(T0 + minutes(60))
    assert step.next_nudge_at == step.on_it_until


def test_a_step_that_is_not_waiting_for_you_cannot_be_on_it():
    step = active_step()
    step.status = engine.STEP_DONE
    assert engine.start_on_it(step, 30, T0) is False
    assert not engine.in_progress(step)


# --- taking it back, snoozing -----------------------------------------------------------------


def test_not_on_it_nudges_again_right_away():
    step = active_step()
    engine.start_on_it(step, 30, T0)
    assert engine.stop_on_it(step, T0 + minutes(5))
    assert not engine.in_progress(step)
    assert step.on_it_since is None
    assert decide(step, T0 + minutes(5)).action == "send"


def test_not_on_it_does_nothing_when_it_was_not_in_progress():
    step = active_step()
    assert engine.stop_on_it(step, T0) is False


def test_snooze_means_not_now():
    step = active_step()
    engine.start_on_it(step, 30, T0)
    assert engine.snooze_step(step, 15, T0 + minutes(1))
    assert not engine.in_progress(step)
    assert step.on_it_since is None
    assert step.next_nudge_at == engine.fmt_ts(T0 + minutes(16))


def test_a_step_that_becomes_active_again_starts_clean():
    step = active_step()
    engine.start_on_it(step, 30, T0)
    engine._became_active(step)
    assert step.on_it_since is None and step.on_it_until is None


def test_on_it_survives_a_round_trip():
    step = active_step()
    engine.start_on_it(step, 30, T0)
    again = engine.StepRun.from_dict(engine.to_dict(step))
    assert again.on_it_since == step.on_it_since
    assert again.on_it_until == step.on_it_until


def test_coming_back_from_away_shows_the_real_check_in_time():
    chore = engine.Chore(id="c", name="Kitchen", steps=[engine.Step("a", "Wipe the counter")])
    run, _events = engine.start_run(chore, T0)
    step = run.steps[0]
    engine.start_on_it(step, 30, T0)
    back = T0 + timedelta(days=3)
    away = engine.Away(active=True, began_at=engine.fmt_ts(T0))
    progress = engine.Progress(total_xp=0, started_at=engine.fmt_ts(T0 - timedelta(days=30)))
    engine.return_from_away(away, progress, [run], [], back, UTC)
    assert step.next_nudge_at == engine.fmt_ts(back)
    assert step.on_it_until == step.next_nudge_at  # what the panel shows is when it really comes


def test_a_step_that_was_not_in_progress_keeps_no_check_in_time_after_away():
    chore = engine.Chore(id="c", name="Kitchen", steps=[engine.Step("a", "Wipe the counter")])
    run, _events = engine.start_run(chore, T0)
    back = T0 + timedelta(days=3)
    progress = engine.Progress(total_xp=0, started_at=engine.fmt_ts(T0 - timedelta(days=30)))
    engine.return_from_away(engine.Away(active=True), progress, [run], [], back, UTC)
    assert run.steps[0].on_it_until is None


# --- the notifications -------------------------------------------------------------------------


def test_the_nudge_has_an_on_it_button():
    payload = engine.phone_payload("normal", "r1", "s1", "Kitchen", "Wipe", 15)
    actions = payload["data"]["actions"]
    assert [a["title"] for a in actions] == ["Done", "Snooze 15 min", "On it"]
    assert actions[2]["action"] == engine.action_id(engine.ACTION_ON_IT, "r1", "s1")


def test_the_new_buttons_are_recognised():
    for kind in (engine.ACTION_ON_IT, engine.ACTION_NOT_ON_IT):
        assert engine.parse_action(engine.action_id(kind, "r1", "s1")) == (kind, "r1", "s1")


def test_the_green_notification_replaces_the_nudge_quietly():
    nudge = engine.phone_payload("normal", "r1", "s1", "Kitchen", "Wipe", 15)
    green = engine.on_it_payload("r1", "s1", "Kitchen", "Wipe the counter", "10:05")
    assert green["data"]["tag"] == nudge["data"]["tag"]  # same tag: replaced in place
    assert green["data"]["sticky"] is True
    assert green["data"]["alert_once"] is True
    assert green["data"]["color"] == engine.ON_IT_COLOR
    assert "In progress" in green["message"] and "10:05" in green["message"]
    assert [a["title"] for a in green["data"]["actions"]] == ["Done", "Not on it"]


def test_the_check_in_goes_back_to_a_normal_notification():
    nudge = engine.phone_payload("normal", "r1", "s1", "Kitchen", "Wipe", 15)
    check = engine.check_in_payload("r1", "s1", "Kitchen", "Wipe the counter")
    assert check["data"]["tag"] == nudge["data"]["tag"]
    assert "sticky" not in check["data"] and "color" not in check["data"]
    assert "alert_once" not in check["data"]  # it should make its sound
    assert [a["title"] for a in check["data"]["actions"]] == ["Done", "Still on it"]
    assert check["data"]["actions"][1]["action"] == engine.action_id(engine.ACTION_ON_IT, "r1", "s1")


# --- the setting ---------------------------------------------------------------------------------


def test_the_check_in_time_is_a_setting():
    assert engine.Settings.from_dict({}).check_in_minutes == engine.CHECK_IN_DEFAULT == 30
    s = engine.Settings.from_dict({"check_in_minutes": 45})
    assert s.check_in_minutes == 45 and engine.validate_settings(s) is None
    s.check_in_minutes = 4
    assert engine.validate_settings(s)
    s.check_in_minutes = 721
    assert engine.validate_settings(s)
