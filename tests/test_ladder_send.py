"""Sending one nudge of a ladder: only the devices ticked on that nudge act, at the levels it names."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

sys.path.insert(0, str(Path(__file__).parents[1]))

from custom_components.boopli import engine, nudger  # noqa: E402


def make(rung, phones=None):
    """A nudger whose devices are all fakes, so we can see which ones were asked to act."""
    settings = engine.Settings(
        lights=[engine.LightCfg(entity_id="light.hall"), engine.LightCfg(entity_id="light.desk")],
        phones=phones if phones is not None else [engine.PhoneCfg("pixel"), engine.PhoneCfg("ipad")],
        speakers=[engine.SpeakerCfg(entity_id="media_player.kitchen")],
        alarm_devices=[engine.AlarmDeviceCfg(entity_id="siren.hall")],
    )
    settings.speakers[0].cue.enabled = True  # the alarm level is not set up
    manager = SimpleNamespace(settings=settings, media_id=lambda: "media")
    n = nudger.BoopliNudger(MagicMock(), manager)
    n._nudge_light = AsyncMock()
    n._play_speaker = AsyncMock()
    n._start_device_alarm = MagicMock()
    n._notify = AsyncMock()
    return n


def send(n, rung, channels=engine.CHANNELS_ALL):
    asyncio.run(n.async_send("run", "Pills", "s1", "Take one", channels, 2, "", rung))


def test_only_the_ticked_devices_act_at_their_levels():
    rung = engine.Rung(
        phones={"pixel": "alarm"},
        lights=["light.desk"],
        speakers={"media_player.kitchen": engine.SPEAKER_CUE},
        alarms=["siren.hall"],
    )
    n = make(rung)
    send(n, rung)
    # one phone, at the level the nudge names (not the phone's own level)
    assert [c.args[0] for c in n._notify.await_args_list] == ["pixel"]
    assert n._notify.await_args.args[1]["data"]["channel"] == "alarm_stream"
    assert [c.args[0].entity_id for c in n._nudge_light.await_args_list] == ["light.desk"]
    assert [(c.args[0].entity_id, c.args[1]) for c in n._play_speaker.await_args_list] == [
        ("media_player.kitchen", engine.SPEAKER_CUE)
    ]
    assert [c.args[0].entity_id for c in n._start_device_alarm.call_args_list] == ["siren.hall"]


def test_an_empty_rung_sends_nothing():
    rung = engine.Rung()
    n = make(rung)
    send(n, rung)
    n._notify.assert_not_awaited()
    n._nudge_light.assert_not_awaited()
    n._play_speaker.assert_not_awaited()
    n._start_device_alarm.assert_not_called()


def test_a_light_can_be_left_out_of_a_later_nudge():
    first = engine.Rung(phones={"pixel": "normal"}, lights=["light.hall"])
    second = engine.Rung(phones={"pixel": "high"})  # no light now
    n = make(first)
    send(n, first)
    assert n._nudge_light.await_count == 1
    n._nudge_light.reset_mock()
    send(n, second)
    n._nudge_light.assert_not_awaited()


def test_a_speaker_level_that_is_not_set_up_is_skipped():
    rung = engine.Rung(speakers={"media_player.kitchen": engine.SPEAKER_ALARM})
    n = make(rung)
    send(n, rung)
    n._play_speaker.assert_not_awaited()


def test_devices_that_are_not_set_up_any_more_are_skipped():
    rung = engine.Rung(
        phones={"gone": "normal", "pixel": "normal"},
        lights=["light.gone"],
        speakers={"media_player.gone": engine.SPEAKER_CUE},
        alarms=["siren.gone"],
    )
    n = make(rung)
    send(n, rung)
    assert [c.args[0] for c in n._notify.await_args_list] == ["pixel"]
    n._nudge_light.assert_not_awaited()
    n._play_speaker.assert_not_awaited()
    n._start_device_alarm.assert_not_called()


def test_away_from_home_only_the_phones_act():
    rung = engine.Rung(phones={"pixel": "normal"}, lights=["light.hall"], alarms=["siren.hall"])
    n = make(rung)
    send(n, rung, engine.CHANNELS_PHONE_ONLY)
    assert [c.args[0] for c in n._notify.await_args_list] == ["pixel"]
    n._nudge_light.assert_not_awaited()
    n._start_device_alarm.assert_not_called()


def test_without_a_rung_the_old_start_at_rules_still_apply():
    n = make(None)
    n.manager.settings.phones[1].start_at = 3  # the second phone joins at nudge 3
    asyncio.run(n.async_send("run", "Laundry", "s1", "Fold", engine.CHANNELS_ALL, 2, ""))
    assert [c.args[0] for c in n._notify.await_args_list] == ["pixel"]
    assert n._nudge_light.await_count == 2  # both lights start at nudge 1
