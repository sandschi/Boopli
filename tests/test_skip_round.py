"""Skipping a round of a chore, and stopping a one-shot speaker sound when a step is answered."""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))

from custom_components.boopli import engine, nudger  # noqa: E402

UTC = timezone.utc
NOW = datetime(2026, 11, 26, 10, 0, tzinfo=UTC)  # a Thursday


def chore(repeat: engine.Repeat, **kw) -> engine.Chore:
    return engine.Chore(id="c", name="Bins", steps=[engine.Step("a", "Put them out")], repeat=repeat, **kw)


# --- skip this round -----------------------------------------------------------------------


def test_skipping_the_coming_round_of_a_schedule_moves_to_the_one_after():
    c = chore(engine.Repeat.weekly("09:00", [0, 3]))  # Monday and Thursday
    c.next_due = engine.fmt_ts(datetime(2026, 11, 30, 9, 0, tzinfo=UTC))  # Monday
    engine.skip_round(c, False, NOW, UTC)
    assert engine.parse_ts(c.next_due) == datetime(2026, 12, 3, 9, 0, tzinfo=UTC)  # Thursday


def test_skipping_a_round_in_progress_keeps_the_schedule_pointing_at_the_next_one():
    c = chore(engine.Repeat.weekly("09:00", [0, 3]))
    c.next_due = engine.fmt_ts(datetime(2026, 11, 30, 9, 0, tzinfo=UTC))
    engine.skip_round(c, True, NOW, UTC)
    assert engine.parse_ts(c.next_due) == datetime(2026, 11, 30, 9, 0, tzinfo=UTC)  # unchanged


def test_every_n_days_counts_from_today_when_the_running_round_is_dropped():
    c = chore(engine.Repeat(type=engine.REPEAT_EVERY_N_DAYS, every_n_days=3, time="09:00"))
    c.next_due = None  # while it runs there is no next due
    engine.skip_round(c, True, NOW, UTC)
    assert engine.parse_ts(c.next_due) == datetime(2026, 11, 29, 9, 0, tzinfo=UTC)


def test_every_n_days_skips_the_coming_round_by_another_n_days():
    c = chore(engine.Repeat(type=engine.REPEAT_EVERY_N_DAYS, every_n_days=3, time="09:00"))
    c.next_due = engine.fmt_ts(datetime(2026, 11, 28, 9, 0, tzinfo=UTC))
    engine.skip_round(c, False, NOW, UTC)
    assert engine.parse_ts(c.next_due) == datetime(2026, 12, 1, 9, 0, tzinfo=UTC)


@pytest.mark.parametrize(
    "c",
    [
        chore(engine.Repeat()),  # on demand: no rounds
        chore(engine.Repeat.daily("09:00"), one_off=True),
        chore(engine.Repeat.daily("09:00"), parked=True),
    ],
)
def test_chores_without_rounds_cannot_be_skipped(c):
    c.next_due = engine.fmt_ts(NOW + timedelta(hours=1))
    with pytest.raises(ValueError):
        engine.skip_round(c, False, NOW, UTC)


def test_nothing_to_skip_without_a_next_round_and_without_a_run():
    c = chore(engine.Repeat.daily("09:00"))
    c.next_due = None
    with pytest.raises(ValueError):
        engine.skip_round(c, False, NOW, UTC)


# --- a one-shot speaker sound is stopped when the step is answered --------------------------


def make_nudger(repeat_s: int, seconds: int = 30):
    speaker = engine.SpeakerCfg(entity_id="media_player.kitchen")
    speaker.alarm.repeat_s = repeat_s
    speaker.alarm.seconds = seconds
    n = nudger.BoopliNudger(MagicMock(), SimpleNamespace(settings=engine.Settings()))
    n._call = AsyncMock(return_value=True)

    def run_later(coro):
        coro.close()  # the play itself is not under test
        return SimpleNamespace(done=lambda: True, cancel=lambda: None)

    n.hass.async_create_task = run_later
    return n, speaker


def stops(n):
    return [c for c in n._call.await_args_list if c.args[1] == "media_stop"]


def test_a_one_shot_alarm_is_stopped_by_done_snooze_or_on_it():
    n, speaker = make_nudger(repeat_s=0)
    assert n._start_speaker_alarm(speaker, "run:s1")
    asyncio.run(n.async_silence("run:s1"))
    assert [c.args[2] for c in stops(n)] == [{"entity_id": "media_player.kitchen"}]


def test_the_stop_is_sent_only_once():
    n, speaker = make_nudger(repeat_s=0)
    n._start_speaker_alarm(speaker, "run:s1")
    asyncio.run(n.async_silence("run:s1"))
    asyncio.run(n.async_silence("run:s1"))
    assert len(stops(n)) == 1


def test_another_step_does_not_stop_the_sound():
    n, speaker = make_nudger(repeat_s=0)
    n._start_speaker_alarm(speaker, "run:s1")
    asyncio.run(n.async_silence("run:s2"))
    assert stops(n) == []


def test_a_sound_that_is_long_over_is_never_stopped():
    n, speaker = make_nudger(repeat_s=0, seconds=3)
    n._start_speaker_alarm(speaker, "run:s1")
    key, _until = n._one_shots["media_player.kitchen"]
    n._one_shots["media_player.kitchen"] = (key, nudger.time.monotonic() - 1)  # the time ran out
    asyncio.run(n.async_silence("run:s1"))
    assert stops(n) == []  # what plays there now (music, say) is not ours
    assert n._one_shots == {}


def test_a_repeating_alarm_is_not_a_one_shot():
    n, speaker = make_nudger(repeat_s=5)
    n._start_speaker_alarm(speaker, "run:s1")
    assert n._one_shots == {}  # its task is cancelled and stops the speaker itself
