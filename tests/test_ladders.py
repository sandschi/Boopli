"""Nudge it your way: ladders of your own (when to nudge, and which devices act at each nudge)."""

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


engine = _load("boopli_engine_ladders", "engine.py")

UTC = timezone.utc
T0 = datetime(2026, 11, 23, 10, 0, tzinfo=UTC)


def rung(gap=5, **kw):
    return engine.Rung(gap=gap, **kw)


def ladder(rungs=None, name="Pills", id="p1", repeat_last=False):
    rungs = rungs if rungs is not None else [rung(5, phones={"pixel": "normal"})]
    return engine.Ladder(id=id, name=name, rungs=rungs, repeat_last=repeat_last)


def settings(*ladders, **kw):
    return engine.Settings(ladders=list(ladders), **kw)


# --- the data -------------------------------------------------------------------------------


def test_a_ladder_survives_saving_and_loading():
    lad = ladder(
        [
            rung(5, phones={"pixel": "normal"}, lights={"light.hall": engine.RungLight("blink", [255, 0, 0])}),
            rung(10, phones={"pixel": "alarm"}, speakers={"media_player.kitchen": "alarm"}, alarms=["siren.hall"]),
        ],
        repeat_last=True,
    )
    s = settings(lad, default_style=engine.ladder_style("p1"))
    again = engine.Settings.from_dict(engine.to_dict(s))
    assert again.ladders == [lad]
    assert again.default_style == "ladder:p1"
    assert engine.validate_settings(again) is None


def test_old_settings_without_ladders_still_load():
    s = engine.Settings.from_dict({"default_style": "escalating"})
    assert s.ladders == []
    assert engine.validate_settings(s) is None


def test_a_ladder_without_an_id_gets_one():
    s = engine.Settings.from_dict({"ladders": [{"name": "A", "rungs": [{"gap": 5}]}]})
    assert s.ladders[0].id
    assert engine.validate_settings(s) is None


def test_junk_in_a_ladder_is_ignored_not_a_crash():
    s = engine.Settings.from_dict(
        {"ladders": ["x", {"id": "a", "name": "A", "rungs": ["junk", {"gap": "7", "phones": "no", "lights": {"a": 1}}]}]}
    )
    (lad,) = s.ladders
    assert [r.gap for r in lad.rungs] == [7]
    assert lad.rungs[0].phones == {}
    assert lad.rungs[0].lights == {"a": engine.RungLight()}  # a value that is not a mode: a blink


# --- checks ---------------------------------------------------------------------------------


def test_ladders_are_checked():
    assert engine.validate_ladders([ladder()]) is None
    assert "name" in engine.validate_ladders([ladder(name="")])
    assert "at most" in engine.validate_ladders([ladder(name="x" * 41)])
    assert "two ladders" in engine.validate_ladders([ladder(), ladder(id="p2", name="pills")])  # not case sensitive
    assert "same id" in engine.validate_ladders([ladder(), ladder(name="Other")])
    assert "nudges" in engine.validate_ladders([ladder(rungs=[])])
    assert "nudges" in engine.validate_ladders([ladder(rungs=[rung()] * 13)])
    assert engine.validate_ladders([ladder(rungs=[rung()] * 12)]) is None
    assert "wait" in engine.validate_ladders([ladder(rungs=[rung(0)])])
    assert "wait" in engine.validate_ladders([ladder(rungs=[rung(721)])])
    assert engine.validate_ladders([ladder(rungs=[rung(720)])]) is None
    assert "phone" in engine.validate_ladders([ladder(rungs=[rung(phones={"pixel": "screaming"})])])
    assert "speaker" in engine.validate_ladders([ladder(rungs=[rung(speakers={"media_player.k": "opera"})])])
    too_many = [ladder(id=str(i), name=f"L{i}") for i in range(21)]
    assert "at most" in engine.validate_ladders(too_many)


def test_the_default_style_can_be_a_ladder_but_only_one_that_exists():
    s = settings(ladder(), default_style="ladder:p1")
    assert engine.validate_settings(s) is None
    s = settings(ladder(), default_style="ladder:gone")
    assert engine.validate_settings(s)


def test_a_chore_can_use_a_ladder_that_exists():
    chore = engine.Chore(id="c", name="Pills", steps=[engine.Step("a", "Take one")], nudge_style="ladder:p1")
    assert engine.validate_chore(chore, ["p1"]) is None
    assert engine.validate_chore(chore, ["other"])
    assert engine.validate_chore(chore)  # no ladders known


def test_which_chores_use_a_ladder():
    mk = lambda i, name, style: engine.Chore(id=i, name=name, steps=[], nudge_style=style)
    chores = [mk("1", "Laundry", "ladder:p1"), mk("2", "Dishes", "one"), mk("3", "Bins", "ladder:p1"), mk("4", "Pills", "ladder:p2")]
    assert engine.chores_using("p1", chores) == ["Bins", "Laundry"]
    assert engine.chores_using("zz", chores) == []


# --- timing ---------------------------------------------------------------------------------


def test_the_waits_come_from_the_ladder():
    lad = ladder([rung(5), rung(7), rung(11)])
    ladders = [lad]
    style = "ladder:p1"
    # After nudge 1 the next one comes after rung 2's wait, and so on; then it is over.
    assert engine.next_gap(style, 1, ladders) == 7
    assert engine.next_gap(style, 2, ladders) == 11
    assert engine.next_gap(style, 3, ladders) is None


def test_a_ladder_can_repeat_its_last_nudge():
    lad = ladder([rung(5), rung(9, phones={"pixel": "alarm"})], repeat_last=True)
    assert engine.next_gap("ladder:p1", 2, [lad]) == 9
    assert engine.next_gap("ladder:p1", 50, [lad]) == 9
    assert engine.rung_for(lad, 50) is lad.rungs[-1]


def test_one_nudge_ladders_and_missing_ladders_send_nothing_more():
    assert engine.next_gap("ladder:p1", 1, [ladder([rung()])]) is None
    assert engine.next_gap("ladder:gone", 1, [ladder()]) is None
    assert engine.rung_for(ladder([]), 1) is None
    assert engine.rung_for(ladder(), 0) is None


def test_built_in_styles_are_unchanged():
    assert engine.next_gap(engine.STYLE_ESCALATING, 1) == 30
    assert engine.next_gap(engine.STYLE_PERSISTENT, 9) == 5
    assert engine.next_gap(engine.STYLE_ONE, 1) is None
    assert engine.next_gap(engine.STYLE_ESCALATING, 1, [ladder()]) == 30


def test_recording_a_nudge_schedules_the_next_one_from_the_ladder():
    lad = ladder([rung(5), rung(8), rung(20)])
    chore = engine.Chore(id="c", name="Pills", steps=[engine.Step("a", "Take one")], nudge_style="ladder:p1")
    run, _ = engine.start_run(chore, T0)
    step = run.steps[0]
    engine.record_nudge(step, "ladder:p1", T0, [lad])
    assert step.nudge_count == 1
    assert step.next_nudge_at == engine.fmt_ts(T0 + timedelta(minutes=8))
    engine.record_nudge(step, "ladder:p1", T0 + timedelta(minutes=8), [lad])
    assert step.next_nudge_at == engine.fmt_ts(T0 + timedelta(minutes=28))
    engine.record_nudge(step, "ladder:p1", T0 + timedelta(minutes=28), [lad])
    assert step.next_nudge_at is None  # the ladder is over


# --- who has been nudged (green "On it", "Still on it?", the questions) -----------------------


def phones_setup():
    return settings(
        ladder(
            [
                rung(5, phones={"pixel": "normal"}),
                rung(5, lights={"light.hall": engine.RungLight()}),  # nudge 2: no phone at all
                rung(5, phones={"ipad": "alarm"}),
            ]
        ),
        phones=[
            engine.PhoneCfg("pixel", start_at=1),
            engine.PhoneCfg("ipad", start_at=3),
            engine.PhoneCfg("old", start_at=1),
        ],
    )


def names(phones):
    return [p.service for p in phones]


def test_with_a_ladder_the_phones_nudged_so_far_are_the_ones_on_its_nudges():
    s = phones_setup()
    assert names(engine.phones_reached(s, "ladder:p1", 1)) == ["pixel"]
    assert names(engine.phones_reached(s, "ladder:p1", 2)) == ["pixel"]  # still the one nudged before
    assert names(engine.phones_reached(s, "ladder:p1", 3)) == ["pixel", "ipad"]
    assert "old" not in names(engine.phones_reached(s, "ladder:p1", 9))  # never on the ladder


def test_with_a_built_in_style_the_start_at_of_each_phone_decides():
    s = phones_setup()
    assert names(engine.phones_reached(s, engine.STYLE_ESCALATING, 1)) == ["pixel", "old"]
    assert names(engine.phones_reached(s, engine.STYLE_ESCALATING, 3)) == ["pixel", "ipad", "old"]
    assert names(engine.phones_reached(s, "ladder:gone", 1)) == ["pixel", "old"]  # a missing ladder: the old way


def test_a_phone_listed_twice_counts_once():
    s = settings(ladder([rung(5, phones={"pixel": "normal"})]), phones=[engine.PhoneCfg("pixel"), engine.PhoneCfg("pixel", level="high")])
    assert names(engine.phones_reached(s, "ladder:p1", 1)) == ["pixel"]


def test_a_ladder_can_only_use_a_speaker_choice_that_is_set_up():
    speaker = engine.SpeakerCfg(entity_id="media_player.kitchen")
    assert not engine.speaker_choice_ok(speaker, engine.SPEAKER_CUE)  # off by default
    speaker.cue.enabled = True
    assert engine.speaker_choice_ok(speaker, engine.SPEAKER_CUE)
    assert not engine.speaker_choice_ok(speaker, engine.SPEAKER_ALARM)
    assert not engine.speaker_choice_ok(speaker, "opera")
    # speech, with or without the chime, needs the speech level switched on
    assert not engine.speaker_choice_ok(speaker, engine.SPEAKER_SPEECH_CHIME)
    speaker.speech.enabled = True
    assert engine.speaker_choice_ok(speaker, engine.SPEAKER_SPEECH)
    assert engine.speaker_choice_ok(speaker, engine.SPEAKER_SPEECH_CHIME)


def test_a_speaker_can_have_many_extra_sounds_and_a_ladder_can_pick_one():
    speaker = engine.SpeakerCfg(
        entity_id="media_player.kitchen",
        sounds=[engine.ExtraSound("f1", "Fanfare", engine.SOUND_ALEXA, "amzn_sfx_trumpet_bugle_01")],
    )
    assert engine.speaker_choice_ok(speaker, "sound:f1")
    assert not engine.speaker_choice_ok(speaker, "sound:gone")
    assert engine.find_extra_sound(speaker, "sound:f1").name == "Fanfare"
    assert engine.find_extra_sound(speaker, "cue") is None


def test_extra_sounds_are_saved_and_checked():
    spk = {
        "entity_id": "media_player.kitchen",
        "sounds": [{"id": "f1", "name": "Fanfare", "kind": "alexa", "sound": "amzn_sfx_x"}, "junk"],
    }
    s = engine.Settings.from_dict({"speakers": [spk]})
    assert [x.name for x in s.speakers[0].sounds] == ["Fanfare"]
    assert engine.validate_settings(s) is None
    again = engine.Settings.from_dict(engine.to_dict(s))
    assert again.speakers[0].sounds == s.speakers[0].sounds

    def with_sounds(*sounds):
        return engine.Settings(speakers=[engine.SpeakerCfg(entity_id="media_player.k", sounds=list(sounds))])

    ok = engine.ExtraSound("a", "Ding", engine.SOUND_ALEXA, "x")
    assert engine.validate_settings(with_sounds(ok)) is None
    assert "name" in engine.validate_settings(with_sounds(engine.ExtraSound("a", "", engine.SOUND_ALEXA, "x")))
    assert "same name" in engine.validate_settings(with_sounds(ok, engine.ExtraSound("b", "ding", engine.SOUND_ALEXA, "y")))
    assert "Choose the sound" in engine.validate_settings(with_sounds(engine.ExtraSound("a", "Ding", engine.SOUND_ALEXA, "")))
    assert "Unknown" in engine.validate_settings(with_sounds(engine.ExtraSound("a", "Ding", "radio", "x")))
    many = [engine.ExtraSound(str(i), f"S{i}", engine.SOUND_ALEXA, "x") for i in range(31)]
    assert "at most" in engine.validate_settings(with_sounds(*many))
    assert engine.validate_settings(with_sounds(*many[:30])) is None


def test_ladder_speaker_choices_are_checked():
    for choice in ("cue", "speech", "speech_chime", "alarm", "sound:abc"):
        assert engine.validate_ladders([ladder([rung(speakers={"media_player.k": choice})])]) is None, choice
    assert "speaker" in engine.validate_ladders([ladder([rung(speakers={"media_player.k": "opera"})])])


def test_speech_with_the_chime_is_an_alexa_announcement():
    speaker = engine.SpeakerCfg(entity_id="media_player.k")
    speaker.speech.enabled = True
    speaker.speech.target = "notify.alexa_media_kitchen"
    assert engine.speech_call(speaker, "hi")[2]["data"]["type"] == "tts"  # the speaker's own setting: plain
    assert engine.speech_call(speaker, "hi", True)[2]["data"]["type"] == "announce"
    speaker.speech.announce = True
    assert engine.speech_call(speaker, "hi")[2]["data"]["type"] == "announce"
    assert engine.speech_call(speaker, "hi", False)[2]["data"]["type"] == "tts"  # a nudge can say plain


# --- the lights of a nudge -------------------------------------------------------------------


def test_a_light_of_a_nudge_can_blink_or_stay_on_as_a_status_light_in_a_color():
    lights = {
        "light.hall": engine.RungLight("blink"),
        "light.desk": engine.RungLight("indicator", [255, 0, 0]),
    }
    assert engine.validate_ladders([ladder([rung(lights=lights)])]) is None
    again = engine.Ladder.from_dict(engine.to_dict(ladder([rung(lights=lights)])))
    assert again.rungs[0].lights == lights


def test_an_older_list_of_lights_means_the_lights_own_mode():
    r = engine.Rung.from_dict({"lights": ["light.hall"]})
    assert r.lights == {"light.hall": engine.RungLight(mode=engine.LIGHT_OWN_MODE)}
    assert engine.validate_ladders([ladder([r])]) is None


def test_light_modes_and_colors_of_a_nudge_are_checked():
    assert "light mode" in engine.validate_ladders([ladder([rung(lights={"light.a": engine.RungLight("strobe")})])])
    assert "color" in engine.validate_ladders([ladder([rung(lights={"light.a": engine.RungLight("blink", [1, 2])})])])
    assert "color" in engine.validate_ladders([ladder([rung(lights={"light.a": engine.RungLight("blink", [1, 2, 300])})])])
    assert engine.validate_ladders([ladder([rung(lights={"light.a": engine.RungLight("blink", None)})])]) is None


def test_a_color_that_is_not_three_numbers_is_dropped():
    assert engine.RungLight.from_dict({"mode": "blink", "color": "red"}).color is None
    assert engine.RungLight.from_dict({"mode": "blink", "color": [1, 2]}).color is None
    assert engine.RungLight.from_dict({"mode": "blink", "color": [1, 2, 3]}).color == [1, 2, 3]


# --- a color for a chore -----------------------------------------------------------------------


def chore_with_color(color):
    return engine.Chore(id="c", name="Pills", steps=[engine.Step("a", "Take one")], light_color=color)


def test_a_chore_can_have_a_light_color():
    assert engine.validate_chore(chore_with_color(None)) is None
    assert engine.validate_chore(chore_with_color([255, 0, 0])) is None
    assert engine.validate_chore(chore_with_color([255, 0]))
    assert engine.validate_chore(chore_with_color([255, 0, 256]))
    saved = engine.Chore.from_dict(engine.to_dict(chore_with_color([1, 2, 3])))
    assert saved.light_color == [1, 2, 3]
    assert engine.Chore.from_dict({"name": "x", "light_color": "red"}).light_color is None
    assert engine.Chore.from_dict({"name": "x"}).light_color is None  # older chores
