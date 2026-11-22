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


# --- photos: the prompt ------------------------------------------------------------------


def test_photo_prompt_keeps_people_and_private_things_out():
    text = bd.room_instructions(bd.ROOM_PHOTOS_PROMPT, "Küche", None, "Door sticks")
    assert "Room: Küche" in text and "Door sticks" in text and "{room}" not in text
    assert "No people" in text and "JSON" in text


def test_photo_answer_is_read_like_other_room_notes():
    out = bd.parse_room_notes({"json": json.dumps({"notes": "Oven by the window\nTiles"})})
    assert out == "Oven by the window\nTiles"


# --- talking it out in the person's own chat ---------------------------------------------


def test_room_chat_prompt_names_the_room_and_asks_for_plain_lines():
    text = bd.room_chat_prompt("Kitchen", "", True)
    assert '"Kitchen"' in text and "one short fact per line" in text and "{" not in text
    assert "already wrote" not in text


def test_room_chat_prompt_includes_old_notes_only_when_asked():
    with_notes = bd.room_chat_prompt("Kitchen", "Door sticks\nTiles", True)
    assert "Door sticks\nTiles" in with_notes and "already wrote" in with_notes
    without = bd.room_chat_prompt("Kitchen", "Door sticks", False)
    assert "Door sticks" not in without


def test_home_chat_prompt_lists_rooms_and_old_notes():
    text = bd.home_chat_prompt([("Kitchen", "Door sticks"), ("Bedroom", "")], True)
    assert "Kitchen, Bedroom" in text and "Kitchen: Door sticks" in text and "## Kitchen" in text
    assert "Door sticks" not in bd.home_chat_prompt([("Kitchen", "Door sticks")], False)


def test_home_chat_prompt_without_rooms_still_works():
    assert "## " in bd.home_chat_prompt([], True)


# --- pasting one room back ---------------------------------------------------------------


def test_paste_notes_strips_fences_bullets_and_markdown():
    pasted = "Here are your notes:\n```\n- Dishwasher is **under** the counter\n* Balcony door sticks\n1. Tiles\n```\nHope that helps!"
    assert bd.parse_pasted_notes(pasted) == "Dishwasher is under the counter\nBalcony door sticks\nTiles"


def test_paste_notes_without_fence_keeps_every_line():
    assert bd.parse_pasted_notes("a\n\n  b  \n- c") == "a\nb\nc"


def test_paste_notes_accepts_json_from_a_chat():
    assert bd.parse_pasted_notes('```json\n{"notes": "a\nb"}\n```') == "a\nb"


def test_paste_notes_rejects_empty():
    with pytest.raises(bd.BreakdownError):
        bd.parse_pasted_notes("   ")
    with pytest.raises(bd.BreakdownError):
        bd.parse_pasted_notes("```\n```")


def test_paste_notes_is_capped():
    assert len(bd.parse_pasted_notes("x" * 5000)) == 2000


# --- pasting the whole home back ---------------------------------------------------------

PASTE_ROOMS = [("r1", "Kitchen"), ("r2", "Living Room"), ("r3", "Bedroom")]


def test_paste_home_splits_hash_headings_and_matches_rooms():
    pasted = "```\n## Kitchen\nDishwasher is low\nDoor sticks\n## living room\nSofa by the window\n## Balkon\nTwo chairs\n```"
    out = bd.parse_pasted_home(pasted, PASTE_ROOMS)
    assert out == [
        {"name": "Kitchen", "id": "r1", "notes": "Dishwasher is low\nDoor sticks"},
        {"name": "Living Room", "id": "r2", "notes": "Sofa by the window"},
        {"name": "Balkon", "id": None, "notes": "Two chairs"},
    ]


def test_paste_home_reads_other_heading_styles():
    pasted = "Sure!\n**Kitchen**\n- Dishwasher is low\nRoom: Bedroom\n- Wardrobe sticks\nLiving Room:\n- Sofa"
    out = bd.parse_pasted_home(pasted, PASTE_ROOMS)
    assert [(r["name"], r["notes"]) for r in out] == [
        ("Kitchen", "Dishwasher is low"),
        ("Bedroom", "Wardrobe sticks"),
        ("Living Room", "Sofa"),
    ]


def test_paste_home_a_known_room_name_with_a_colon_and_a_fact():
    out = bd.parse_pasted_home("Kitchen: dishwasher is low\nOven on the left", PASTE_ROOMS)
    assert out == [{"name": "Kitchen", "id": "r1", "notes": "dishwasher is low\nOven on the left"}]


def test_paste_home_joins_a_room_that_comes_twice_and_skips_empty_ones():
    out = bd.parse_pasted_home("## Kitchen\na\n## Bedroom\n## Kitchen\nb", PASTE_ROOMS)
    assert out == [{"name": "Kitchen", "id": "r1", "notes": "a\nb"}]


def test_paste_home_a_fact_with_bold_words_is_not_a_heading():
    out = bd.parse_pasted_home("## Kitchen\n**Important** the door sticks", PASTE_ROOMS)
    assert out[0]["notes"] == "Important the door sticks"


def test_paste_home_without_any_heading_explains_what_to_do():
    with pytest.raises(bd.BreakdownError, match="heading"):
        bd.parse_pasted_home("just some lines\nwithout rooms", PASTE_ROOMS)


# --- photo settings ----------------------------------------------------------------------


def test_photo_agent_setting_round_trips_and_is_checked():
    ok = engine.Settings.from_dict({"ai": {"photo_entity_id": " ai_task.vision "}})
    assert ok.ai.photo_entity_id == "ai_task.vision"
    assert engine.validate_settings(ok) is None
    assert engine.to_dict(ok)["ai"]["photo_entity_id"] == "ai_task.vision"
    bad = engine.Settings.from_dict({"ai": {"photo_entity_id": "light.x"}})
    assert engine.validate_settings(bad)


# --- your own chat prompts ---------------------------------------------------------------


def test_custom_chat_prompts_replace_the_built_in_ones():
    room = bd.room_chat_prompt("Kitchen", "Door sticks", True, "Talk about {room}. Known: {known}")
    assert room.startswith('Talk about Kitchen. Known: \nHere is what I already wrote')
    assert "Door sticks" in room and "interview" not in room
    home = bd.home_chat_prompt([("Kitchen", "")], True, "Rooms:{names}")
    assert "Kitchen" in home and "{names}" not in home


def test_empty_custom_chat_prompt_falls_back_to_the_built_in_one():
    assert bd.room_chat_prompt("Kitchen", "", True, "  ") == bd.room_chat_prompt("Kitchen", "", True)
    assert bd.home_chat_prompt([], True, "") == bd.home_chat_prompt([], True)


def test_chat_prompt_settings_round_trip_and_are_capped():
    s = engine.Settings.from_dict({"ai": {"chat_room_prompt": " a {room} ", "chat_home_prompt": "b"}})
    assert s.ai.chat_room_prompt == "a {room}" and s.ai.chat_home_prompt == "b"
    assert engine.to_dict(s)["ai"]["chat_room_prompt"] == "a {room}"
    assert engine.validate_settings(s) is None
    s.ai.chat_home_prompt = "x" * (engine.AI_PROMPT_MAX + 1)
    assert engine.validate_settings(s)
