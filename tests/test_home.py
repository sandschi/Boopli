"""Tests for "My home": rooms, guessing the room of a task, and what goes to the AI."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pytest

_DIR = Path(__file__).parents[1] / "custom_components" / "boopli"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, _DIR / file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


bd = _load("boopli_breakdown_home", "breakdown.py")
engine = _load("boopli_engine_home", "engine.py")

ROOMS = [("k", "Küche"), ("w", "Wohnzimmer"), ("b", "Bad"), ("s", "Schlafzimmer")]


# --- rooms and storage -----------------------------------------------------------


def test_room_cleaning_and_round_trip():
    home = engine.Home.from_dict(
        {"rooms": [{"id": "a", "name": "  Küche  ", "notes": "Dishwasher is low\n\n  Door sticks  "}]}
    )
    room = home.rooms[0]
    assert room.name == "Küche"
    assert room.notes == "Dishwasher is low\nDoor sticks"
    again = engine.Home.from_dict(engine.to_dict(home))
    assert again == home


def test_home_is_on_by_default_and_can_be_off():
    assert engine.Home.from_dict(None).enabled is True
    assert engine.Home.from_dict({"enabled": False}).enabled is False


def test_validate_home():
    assert engine.validate_home(engine.Home(rooms=[engine.Room(id="a", name="")])) == "Every room needs a name."
    two = engine.Home(rooms=[engine.Room(id="a", name="x"), engine.Room(id="a", name="y")])
    assert engine.validate_home(two)
    assert engine.validate_home(engine.Home(rooms=[engine.Room(id="a", name="x")])) is None


def test_merge_areas_adds_only_new_ones_and_keeps_deleted_hidden():
    home = engine.Home(rooms=[engine.Room(id="1", name="Küche", area_id="kitchen", notes="n")])
    changed = engine.merge_areas(home, [("kitchen", "Küche"), ("bath", "Bad")])
    assert changed
    assert [r.name for r in home.rooms] == ["Küche", "Bad"]
    assert home.rooms[0].notes == "n"
    assert engine.merge_areas(home, [("kitchen", "Küche"), ("bath", "Bad")]) is False
    home.rooms[1].hidden = True  # hidden rooms stay known, so they do not come back
    assert engine.merge_areas(home, [("bath", "Bad")]) is False


# --- guessing the room ---------------------------------------------------------------


def test_guess_by_name():
    assert bd.guess_rooms("Küche putzen", ROOMS) == ["k"]
    assert bd.guess_rooms("clean the bad and the Küche", ROOMS) == ["k", "b"]


def test_guess_needs_whole_words():
    assert bd.guess_rooms("Badezimmer putzen", ROOMS) == []
    assert bd.guess_rooms("take out the trash", ROOMS) == []


def test_whole_flat_means_every_room():
    assert bd.guess_rooms("clean the whole flat", ROOMS) == ["k", "w", "b", "s"]
    assert bd.guess_rooms("Ganze Wohnung saugen", ROOMS) == ["k", "w", "b", "s"]


# --- what goes to the AI --------------------------------------------------------------


def test_rooms_text_only_rooms_with_notes():
    text, shortened = bd.rooms_text([("Küche", "Dishwasher is low\nDoor sticks"), ("Bad", "")])
    assert text == 'Room "Küche": Dishwasher is low; Door sticks'
    assert shortened is False


def test_rooms_text_is_capped_per_room_and_says_so():
    text, shortened = bd.rooms_text([("Küche", "x" * 5000)])
    assert shortened is True
    assert len(text) < bd.ROOM_NOTES_SENT_MAX + 60


def test_nothing_sent_without_rooms():
    assert bd.rooms_text([]) == ("", False)


def test_notes_reach_the_prompt_next_to_the_chore_notes():
    block, _ = bd.rooms_text([("Küche", "Dishwasher is low")])
    text = bd.steps_instructions("clean the kitchen", "now", [], "Has a table.", "", block)
    assert "Has a table." in text
    assert 'Room "Küche": Dishwasher is low' in text
    plain = bd.steps_instructions("clean the kitchen", "now", [], "", "", "")
    assert "Dishwasher" not in plain
    assert "(nothing yet)" in plain


def test_a_long_room_block_is_not_cut_by_the_chore_notes_limit():
    block, _ = bd.rooms_text([(f"R{i}", "y" * 1400) for i in range(5)])
    text = bd.questions_instructions("clean the flat", "now", [], "", "", block)
    assert text.count("Room \"R") == 5


# --- the room interview ------------------------------------------------------------------


def test_room_prompts_fill_their_placeholders():
    text = bd.room_instructions(bd.ROOM_QUESTIONS_PROMPT, "Küche", [], "")
    assert "Room: Küche" in text and "{room}" not in text and "{known}" not in text
    assert "(nothing yet)" in text and "(none yet)" in text


def test_room_questions_use_the_normal_question_reader():
    answer = {"json": json.dumps({"enough": False, "questions": [{"text": "Floor?", "options": ["Tiles"], "multiple": False}]})}
    enough, questions = bd.parse_questions(answer)
    assert not enough and questions[0].text == "Floor?"


def test_parse_room_notes_from_json():
    out = bd.parse_room_notes({"json": json.dumps({"notes": "Dishwasher is low\nDoor sticks"})})
    assert out == "Dishwasher is low\nDoor sticks"


def test_parse_room_notes_accepts_a_list_and_plain_text():
    assert bd.parse_room_notes({"json": json.dumps({"notes": ["a", "b"]})}) == "a\nb"
    assert bd.parse_room_notes("Dishwasher is low\nDoor sticks") == "Dishwasher is low\nDoor sticks"


def test_parse_room_notes_rescues_broken_json():
    broken = '{"notes": "Dishwasher is low\\nDoor sticks"'  # closing brace missing
    assert bd.parse_room_notes(broken) == "Dishwasher is low\nDoor sticks"


def test_parse_room_notes_rejects_empty():
    with pytest.raises(bd.BreakdownError):
        bd.parse_room_notes({"json": json.dumps({"notes": ""})})
    with pytest.raises(bd.BreakdownError):
        bd.parse_room_notes("")
