"""Tests for speakers (cue, speech, alarm), alarm devices and nudge levels."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "engine.py"
_SPEC = importlib.util.spec_from_file_location("boopli_engine_speakers", _PATH)
engine = importlib.util.module_from_spec(_SPEC)
sys.modules["boopli_engine_speakers"] = engine
_SPEC.loader.exec_module(engine)


def speaker(**kw) -> "engine.SpeakerCfg":
    return engine.SpeakerCfg("media_player.wohnzimmer_dot", **kw)


def all_on() -> "engine.SpeakerCfg":
    s = speaker()
    s.cue = engine.SoundCfg(enabled=True, sound="amzn_sfx_x", start_at=1)
    s.speech = engine.SpeechCfg(enabled=True, target="alexa_media_wohnzimmer_dot", start_at=2)
    s.alarm.enabled = True
    return s


def settings_with(s=None, **kw) -> "engine.Settings":
    return engine.Settings(speakers=[s] if s else [], **kw)


# --- levels ----------------------------------------------------------------


def test_a_speaker_plays_the_highest_enabled_level_reached():
    s = all_on()  # cue 1, speech 2, alarm 4 (defaults)
    assert [engine.speaker_level(s, n) for n in range(1, 7)] == [
        "cue", "speech", "speech", "alarm", "alarm", "alarm",
    ]


def test_a_speaker_with_nothing_enabled_plays_nothing():
    assert engine.speaker_level(speaker(), 5) is None


def test_a_disabled_level_is_skipped_not_replaced_by_a_lower_one():
    s = all_on()
    s.speech.enabled = False
    assert [engine.speaker_level(s, n) for n in (1, 2, 3, 4)] == ["cue", "cue", "cue", "alarm"]


def test_levels_do_not_have_to_be_in_order():
    s = all_on()
    s.cue.start_at = 3
    assert engine.speaker_level(s, 1) is None
    assert engine.speaker_level(s, 2) == "speech"
    assert engine.speaker_level(s, 3) == "speech"  # speech outranks the cue


def test_start_at_decides_when_a_channel_joins():
    assert engine.reached(1, 1)
    assert engine.reached(2, 5)
    assert not engine.reached(4, 3)


def test_defaults_are_cue_1_speech_2_alarm_4_and_everything_off():
    s = speaker()
    assert (s.cue.start_at, s.speech.start_at, s.alarm.start_at) == (1, 2, 4)
    assert not (s.cue.enabled or s.speech.enabled or s.alarm.enabled)
    assert s.alarm.sound == "amzn_sfx_scifi_alarm_01"
    assert s.cue.sound == "amzn_sfx_doorbell_chime_01"  # confirmed on a real Echo Dot
    assert engine.SpeakerCfg.from_dict({"entity_id": "media_player.x"}).cue.sound == s.cue.sound
    assert (s.alarm.seconds, s.alarm.repeat_s) == (30, 5)


# --- sounds ----------------------------------------------------------------


def test_alexa_sound_is_played_as_a_sound():
    assert engine.sound_play_data("alexa", " amzn_sfx_scifi_alarm_01 ") == {
        "media_content_id": "amzn_sfx_scifi_alarm_01",
        "media_content_type": "sound",
    }


def test_a_bare_file_name_means_the_media_folder():
    assert engine.sound_play_data("file", "boopli/ding.mp3") == {
        "media_content_id": "media-source://media_source/local/boopli/ding.mp3",
        "media_content_type": "music",
    }
    assert engine.sound_play_data("file", "ding.mp3")["media_content_id"].endswith("/local/ding.mp3")


def test_full_ids_and_urls_are_used_as_given():
    for given in (
        "media-source://media_source/local/a.mp3",
        "/local/a.mp3",
        "https://example.com/a.mp3",
    ):
        assert engine.sound_play_data("file", given)["media_content_id"] == given


def test_alarm_play_count_rounds_up_and_zero_repeat_plays_once():
    assert engine.alarm_plays(30, 5) == 6
    assert engine.alarm_plays(32, 5) == 7
    assert engine.alarm_plays(3, 5) == 1
    assert engine.alarm_plays(30, 0) == 1


# --- speech ----------------------------------------------------------------


def test_speech_text_fills_chore_and_step():
    assert engine.speech_text("{chore}: {step}", "Dishwasher", "Empty it") == "Dishwasher: Empty it"
    assert engine.speech_text("Time for {step}!", "Dishwasher", "Empty it") == "Time for Empty it!"
    assert engine.speech_text("{chore} {chore}", "A", "B") == "A A"


def test_alexa_media_speech_is_plain_speech_unless_announce_is_chosen():
    s = all_on()
    domain, service, data = engine.speech_call(s, "Hello")
    assert (domain, service) == ("notify", "alexa_media_wohnzimmer_dot")
    assert data == {"message": "Hello", "data": {"type": "tts"}}
    s.speech.announce = True
    assert engine.speech_call(s, "Hello")[2]["data"]["type"] == "announce"
    s.speech.target = "notify.alexa_media_wohnzimmer_dot"  # a prefix is tolerated
    assert engine.speech_call(s, "Hello")[1] == "alexa_media_wohnzimmer_dot"


def test_alexa_devices_speech_uses_the_notify_entity():
    s = all_on()
    s.speech.route = "alexa_devices"
    s.speech.target = "notify.wohnzimmer_dot_speak"
    assert engine.speech_call(s, "Hello") == (
        "notify", "send_message", {"entity_id": "notify.wohnzimmer_dot_speak", "message": "Hello"},
    )


def test_tts_speech_goes_to_the_speaker_with_the_chosen_voice():
    s = all_on()
    s.speech.route = "tts"
    s.speech.target = "tts.google_ai_tts"
    assert engine.speech_call(s, "Hello") == (
        "tts",
        "speak",
        {
            "entity_id": "tts.google_ai_tts",
            "media_player_entity_id": "media_player.wohnzimmer_dot",
            "message": "Hello",
        },
    )


# --- alarm devices ----------------------------------------------------------


def test_alarm_device_calls_use_the_right_domain():
    assert engine.device_alarm_call("siren.garage", True) == ("siren", "turn_on", {"entity_id": "siren.garage"})
    assert engine.device_alarm_call("switch.horn", False) == ("switch", "turn_off", {"entity_id": "switch.horn"})
    assert engine.device_alarm_call("script.alarm", True)[0] == "script"


# --- settings: round trip and validation -------------------------------------


def full_settings() -> "engine.Settings":
    s = settings_with(all_on(), speech_template="{chore}: {step}")
    s.alarm_devices = [engine.AlarmDeviceCfg("siren.garage", 20, 5)]
    s.lights = [engine.LightCfg("light.x", start_at=2)]
    s.phones = [engine.PhoneCfg("mobile_app_x", "high", 3)]
    s.standard_done = True
    return s


def test_settings_with_speakers_roundtrip():
    s = full_settings()
    assert engine.validate_settings(s) is None
    again = engine.Settings.from_dict(json.loads(json.dumps(engine.to_dict(s))))
    assert again == s


def test_old_settings_without_speakers_still_load():
    s = engine.Settings.from_dict({"lights": [{"entity_id": "light.x"}], "phones": [{"service": "mobile_app_x"}]})
    assert s.speakers == [] and s.alarm_devices == []
    assert s.lights[0].start_at == 1 and s.phones[0].start_at == 1
    assert s.speech_template == "{chore}: {step}"
    assert engine.validate_settings(s) is None


def test_speaker_validation_errors():
    def check(fn):
        s = full_settings()
        fn(s)
        return engine.validate_settings(s)

    assert check(lambda s: setattr(s.speakers[0], "entity_id", "light.x"))
    assert check(lambda s: setattr(s.speakers[0].cue, "sound", "")) is None  # no ding yet: fine to save, it just is not offered
    assert check(lambda s: setattr(s.speakers[0].cue, "kind", "radio"))
    assert check(lambda s: setattr(s.speakers[0].cue, "start_at", 0))
    assert check(lambda s: setattr(s.speakers[0].alarm, "start_at", 21))
    assert check(lambda s: setattr(s.speakers[0].alarm, "seconds", 2))
    assert check(lambda s: setattr(s.speakers[0].alarm, "seconds", 601))
    assert check(lambda s: setattr(s.speakers[0].alarm, "repeat_s", 61))
    assert check(lambda s: setattr(s.speakers[0].speech, "route", "carrier_pigeon"))
    assert check(lambda s: setattr(s.speakers[0].speech, "target", ""))
    s = full_settings()
    s.speakers[0].speech.route = "tts"
    s.speakers[0].speech.target = "notify.x"
    assert engine.validate_settings(s)
    s.speakers[0].speech.route = "alexa_devices"
    s.speakers[0].speech.target = "wohnzimmer_dot_speak"  # needs the notify. prefix
    assert engine.validate_settings(s)
    s.speakers[0].speech.target = "notify.wohnzimmer_dot_speak"
    assert engine.validate_settings(s) is None


def test_a_switched_off_speaker_level_may_be_empty():
    s = settings_with(speaker())  # all levels off, no sounds chosen
    assert engine.validate_settings(s) is None


def test_alarm_device_and_other_validation_errors():
    def check(fn):
        s = full_settings()
        fn(s)
        return engine.validate_settings(s)

    assert check(lambda s: setattr(s.alarm_devices[0], "entity_id", "light.x"))
    assert check(lambda s: setattr(s.alarm_devices[0], "entity_id", "siren"))
    assert check(lambda s: setattr(s.alarm_devices[0], "seconds", 0))
    assert check(lambda s: setattr(s.alarm_devices[0], "start_at", 0))
    assert check(lambda s: setattr(s.lights[0], "start_at", 21))
    assert check(lambda s: setattr(s.phones[0], "start_at", 0))
    assert check(lambda s: setattr(s, "speech_template", "Hello there"))


def test_testing_a_level_does_not_need_it_switched_on():
    s = speaker()
    assert engine.validate_speaker_test(s, "alarm") is None  # default sound is set
    assert engine.validate_speaker_test(s, "cue") is None  # so is the default ding
    s.cue.sound = ""
    assert engine.validate_speaker_test(s, "cue")  # emptied: nothing to play
    assert engine.validate_speaker_test(s, "speech")  # no target yet
    assert engine.validate_speaker_test(s, "loud")
