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


def send(n, rung, channels=engine.CHANNELS_ALL, light_color=None):
    asyncio.run(n.async_send("run", "Pills", "s1", "Take one", channels, 2, "", rung, light_color))


def test_only_the_ticked_devices_act_at_their_levels():
    rung = engine.Rung(
        phones={"pixel": "alarm"},
        lights={"light.desk": engine.RungLight()},
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
    first = engine.Rung(phones={"pixel": "normal"}, lights={"light.hall": engine.RungLight()})
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
        lights={"light.gone": engine.RungLight()},
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
    rung = engine.Rung(phones={"pixel": "normal"}, lights={"light.hall": engine.RungLight()}, alarms=["siren.hall"])
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


# --- lights: mode and color of one nudge ---------------------------------------------------------


def lights_sent(n):
    return {c.args[0].entity_id: (c.args[0].mode, c.args[0].color) for c in n._nudge_light.await_args_list}


def test_a_nudge_can_make_a_light_blink_or_a_status_light_in_its_own_color():
    n = make(None)
    n.manager.settings.lights[0].mode = engine.LIGHT_INDICATOR  # the hall light is a status light by default
    n.manager.settings.lights[0].color = [0, 0, 255]
    rung = engine.Rung(
        lights={
            "light.hall": engine.RungLight(engine.LIGHT_BLINK),  # this nudge: blink (not its own mode), its own color
            "light.desk": engine.RungLight(engine.LIGHT_INDICATOR, [255, 0, 0]),
        }
    )
    send(n, rung)
    sent = lights_sent(n)
    assert sent["light.hall"] == (engine.LIGHT_BLINK, [0, 0, 255])
    assert sent["light.desk"] == (engine.LIGHT_INDICATOR, [255, 0, 0])


def test_the_color_is_the_chores_then_the_nudges_then_the_lights_own():
    own = engine.LightCfg(entity_id="light.hall").color
    rung = engine.Rung(lights={"light.hall": engine.RungLight(), "light.desk": engine.RungLight(color=[1, 1, 1])})
    n = make(None)
    send(n, rung)
    assert lights_sent(n)["light.hall"][1] == own  # nothing set: the light's own
    assert lights_sent(n)["light.desk"][1] == [1, 1, 1]  # the nudge's color
    n = make(None)
    send(n, rung, light_color=[9, 9, 9])  # the chore has a color: it wins over the nudge's
    assert lights_sent(n)["light.hall"][1] == [9, 9, 9]
    assert lights_sent(n)["light.desk"][1] == [9, 9, 9]


def test_the_lights_own_mode_is_used_for_an_older_ladder():
    n = make(None)
    n.manager.settings.lights[0].mode = engine.LIGHT_INDICATOR
    rung = engine.Rung(lights={"light.hall": engine.RungLight(mode=engine.LIGHT_OWN_MODE)})
    send(n, rung)
    assert lights_sent(n)["light.hall"][0] == engine.LIGHT_INDICATOR


def test_the_color_of_a_chore_also_colors_the_lights_of_a_built_in_style():
    n = make(None)
    asyncio.run(n.async_send("run", "Laundry", "s1", "Fold", engine.CHANNELS_ALL, 1, "", None, [5, 6, 7]))
    assert len(lights_sent(n)) == 2
    assert all(v[1] == [5, 6, 7] for v in lights_sent(n).values())


# --- speakers: one pick per nudge, from the speaker's sounds ----------------------------------------


def speaker_calls(n):
    return [(c.args[0].entity_id, c.args[1], c.args[5]) for c in n._play_speaker.await_args_list]


def test_speaks_and_speaks_with_chime_are_two_choices():
    n = make(None)
    n.manager.settings.speakers[0].speech.enabled = True
    plain = engine.Rung(speakers={"media_player.kitchen": engine.SPEAKER_SPEECH})
    chime = engine.Rung(speakers={"media_player.kitchen": engine.SPEAKER_SPEECH_CHIME})
    send(n, plain)
    send(n, chime)
    assert speaker_calls(n) == [
        ("media_player.kitchen", engine.SPEAKER_SPEECH, False),
        ("media_player.kitchen", engine.SPEAKER_SPEECH_CHIME, True),
    ]


def test_a_speaker_can_play_one_of_its_extra_sounds():
    n = make(None)
    n.manager.settings.speakers[0].sounds = [engine.ExtraSound("f1", "Fanfare", engine.SOUND_ALEXA, "x")]
    send(n, engine.Rung(speakers={"media_player.kitchen": "sound:f1"}))
    assert speaker_calls(n) == [("media_player.kitchen", "sound:f1", None)]
    n._play_speaker.reset_mock()
    send(n, engine.Rung(speakers={"media_player.kitchen": "sound:gone"}))  # a sound that was removed
    n._play_speaker.assert_not_awaited()
