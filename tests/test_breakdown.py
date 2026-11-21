"""Tests for the AI breakdown prompts and the reading of the answers."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pytest

_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "breakdown.py"
_SPEC = importlib.util.spec_from_file_location("boopli_breakdown", _PATH)
bd = importlib.util.module_from_spec(_SPEC)
sys.modules["boopli_breakdown"] = bd
_SPEC.loader.exec_module(bd)

_ENGINE_PATH = Path(__file__).parents[1] / "custom_components" / "boopli" / "engine.py"
_ESPEC = importlib.util.spec_from_file_location("boopli_engine_breakdown", _ENGINE_PATH)
engine = importlib.util.module_from_spec(_ESPEC)
sys.modules["boopli_engine_breakdown"] = engine
_ESPEC.loader.exec_module(engine)


def js(obj) -> dict:
    """What a model returns through the structure: one text field holding JSON."""
    return {"json": json.dumps(obj)}


# --- prompts ---------------------------------------------------------------


def test_the_prompts_fill_in_task_kind_notes_and_answers():
    text = bd.questions_instructions(
        "Clean the room",
        "recurring",
        [{"question": "What is in the room?", "answer": "A table and two chairs"}],
        "Room has: bed.",
    )
    assert "Task: Clean the room" in text
    assert "comes back again and again" in text
    assert "- What is in the room? A table and two chairs" in text
    assert "Room has: bed." in text
    assert "{task}" not in text and "{answers}" not in text and "{known}" not in text


def test_a_task_for_now_asks_for_few_questions():
    assert "few" in bd.questions_instructions("Dishes", "now")


def test_empty_answers_and_notes_say_so():
    text = bd.steps_instructions("Dishes", "now")
    assert "(none yet)" in text and "(nothing yet)" in text


def test_the_json_example_braces_survive_filling():
    text = bd.steps_instructions("Dishes", "now")
    assert '"steps": [{"title"' in text


def test_a_custom_prompt_replaces_the_built_in_one():
    text = bd.steps_instructions("Dishes", "now", custom="Do {task} tiny. Known: {known}")
    assert text == "Do Dishes tiny. Known: (nothing yet)"


def test_the_steps_prompt_has_no_cap_of_twelve_and_asks_for_tiny_steps():
    p = bd.STEPS_PROMPT
    assert "at most 50" in p and "12" not in p
    assert "under two minutes" in p and "verb" in p and "wait_minutes" in p


def test_task_text_is_cleaned_and_limited():
    text = bd.steps_instructions("  Clean\n\nthe   room  " + "x" * 1000, "now")
    assert "Task: Clean the room x" in text
    assert len(text) < len(bd.STEPS_PROMPT) + 1500


def test_answers_from_the_panel_are_checked():
    cleaned = bd.clean_answers(
        [{"question": "Q?", "answer": " a  b "}, {"question": "", "answer": "x"}, "junk", {"answer": "y"}]
    )
    assert cleaned == [{"question": "Q?", "answer": "a b"}]
    assert len(bd.clean_answers([{"question": "q", "answer": "a"}] * 500)) == bd.MAX_ANSWERS
    assert bd.clean_answers(None) == []


# --- reading questions -----------------------------------------------------


def test_questions_are_read_and_cleaned():
    data = js(
        {
            "enough": False,
            "questions": [
                {"text": "What is in the room?", "options": ["Table", "table", "Chairs", ""], "multiple": True},
                {"text": "How much energy?", "options": ["Little", "Lots"]},
                {"text": "", "options": ["x"]},
            ],
        }
    )
    enough, questions = bd.parse_questions(data)
    assert enough is False
    assert [q.text for q in questions] == ["What is in the room?", "How much energy?"]
    assert questions[0].options == ["Table", "Chairs"] and questions[0].multiple is True
    assert questions[1].multiple is False


def test_enough_means_no_questions_are_returned():
    enough, questions = bd.parse_questions(js({"enough": True, "questions": [{"text": "x?", "options": ["a"]}]}))
    assert enough is True and questions == []


def test_no_usable_question_counts_as_enough_so_there_is_no_dead_end():
    assert bd.parse_questions(js({"enough": False, "questions": []})) == (True, [])
    assert bd.parse_questions(js({"enough": False})) == (True, [])


def test_there_is_no_limit_on_rounds_but_a_limit_per_round():
    many = [{"text": f"Q{i}?", "options": ["a", "b"]} for i in range(20)]
    _, questions = bd.parse_questions(js({"enough": False, "questions": many}))
    assert len(questions) == bd.MAX_QUESTIONS


def test_options_are_limited():
    q = {"text": "Which?", "options": [f"o{i}" for i in range(30)]}
    _, questions = bd.parse_questions(js({"questions": [q]}))
    assert len(questions[0].options) == bd.MAX_OPTIONS


# --- reading steps -----------------------------------------------------------


def test_steps_are_read_with_size_group_and_wait():
    data = js(
        {
            "summary": "Room has: table.",
            "steps": [
                {"title": "Clear the table", "group": "Table", "size": "small", "wait_minutes": 0},
                {"title": "Wipe the table", "group": "Table", "size": "Medium", "wait_minutes": "5"},
                {"title": "Vacuum", "group": "Floor", "size": "huge"},
            ],
        }
    )
    steps, summary = bd.parse_steps(data)
    assert summary == "Room has: table."
    assert [(s.title, s.group, s.size, s.wait_minutes) for s in steps] == [
        ("Clear the table", "Table", "small", 0),
        ("Wipe the table", "Table", "medium", 5),
        ("Vacuum", "Floor", "small", 0),  # an unknown size becomes small
    ]


def test_plain_strings_work_as_steps():
    steps, _ = bd.parse_steps(js({"steps": ["Stand up", "Open the window"]}))
    assert [s.title for s in steps] == ["Stand up", "Open the window"]


def test_up_to_fifty_steps_are_kept_and_more_are_cut():
    many = [{"title": f"Step {i}"} for i in range(80)]
    steps, _ = bd.parse_steps(js({"steps": many}))
    assert len(steps) == 50
    assert len(bd.parse_steps(js({"steps": many}), max_steps=10)[0]) == 10


def test_empty_and_repeated_steps_are_dropped():
    steps, _ = bd.parse_steps(js({"steps": [{"title": "  "}, {"title": "Wash"}, {"title": "wash"}, {"title": "Dry"}]}))
    assert [s.title for s in steps] == ["Wash", "Dry"]


def test_waits_are_kept_inside_their_range():
    steps, _ = bd.parse_steps(js({"steps": [{"title": "A", "wait_minutes": -5}, {"title": "B", "wait_minutes": 10**9}]}))
    assert steps[0].wait_minutes == 0 and steps[1].wait_minutes == bd.WAIT_MAX


def test_no_steps_is_an_error_with_a_plain_message():
    with pytest.raises(bd.BreakdownError, match="did not send any steps"):
        bd.parse_steps(js({"steps": []}))


def test_long_titles_and_groups_are_shortened():
    steps, _ = bd.parse_steps(js({"steps": [{"title": "x" * 900, "group": "g" * 300}]}))
    assert len(steps[0].title) == bd.TITLE_MAX and len(steps[0].group) == bd.GROUP_MAX


# --- reading whatever shape the model returns ------------------------------------


def test_code_fences_and_chatter_around_the_json_are_ignored():
    text = 'Sure! Here you go:\n```json\n{"steps": [{"title": "Start"}]}\n```\nGood luck.'
    steps, _ = bd.parse_steps({"json": text})
    assert steps[0].title == "Start"


def test_a_model_that_returns_the_fields_directly_works():
    steps, _ = bd.parse_steps({"steps": [{"title": "Go"}], "summary": ""})
    assert steps[0].title == "Go"
    assert bd.parse_questions({"enough": True}) == (True, [])


def test_a_bare_string_answer_works():
    steps, _ = bd.parse_steps('{"steps": [{"title": "Go"}]}')
    assert steps[0].title == "Go"


@pytest.mark.parametrize("bad", ["", "no json here", "{broken", "[1, 2]", None, {"json": ""}, {"json": "[]"}])
def test_unreadable_answers_raise_a_plain_error(bad):
    with pytest.raises(bd.BreakdownError):
        bd.parse_steps(bad)


# --- what a real model really sent --------------------------------------------------

# From a real run on 2026-11-21 (OpenRouter's free router): one line has a stray
# `")` where a closing brace belongs, which makes the whole answer invalid JSON.
REAL_BROKEN = """{
  "summary": "Typical bedroom has: bed, desk, floor.",
  "steps": [
    {"title": "Set a timer for 5 minutes", "group": "Start", "size": "small", "wait_minutes": 0},
    {"title": "Pick up one item from the floor", "group": "Floor", "size": "small", "wait_minutes": 0},
    {"title": "Move relocated items to their proper room", "group": "Desk", "size": "small", "wait_minutes": 0"),
    {"title": "Repeat: process each desk item until surface is clear", "group": "Desk", "size": "medium", "wait_minutes": 0},
    {"title": "Bring the empty basket back", "group": "Laundry", "size": "small", "wait_minutes": 30}
  ]
}"""


def test_a_real_answer_with_one_broken_line_still_gives_all_its_steps():
    steps, summary = bd.parse_steps(REAL_BROKEN)
    assert [s.title for s in steps] == [
        "Set a timer for 5 minutes",
        "Pick up one item from the floor",
        "Move relocated items to their proper room",
        "Repeat: process each desk item until surface is clear",
        "Bring the empty basket back",
    ]
    assert summary == "Typical bedroom has: bed, desk, floor."
    assert (steps[3].size, steps[4].wait_minutes, steps[4].group) == ("medium", 30, "Laundry")


def test_rescued_steps_still_get_the_same_cleaning_and_limits():
    broken = '{"steps": [\n{"title": "A", "size": "huge", "wait_minutes": "7"),\n{"title": "a"},\n{"title": "B\\"q"}'
    steps, _ = bd.parse_steps(broken)
    assert [(s.title, s.size, s.wait_minutes) for s in steps] == [("A", "small", 7), ("B\"q", "small", 0)]


def test_text_with_no_steps_at_all_is_still_an_error():
    with pytest.raises(bd.BreakdownError):
        bd.parse_steps("...")
    with pytest.raises(bd.BreakdownError):
        bd.parse_steps({"json": "..."})  # what the forced structure once produced


def test_a_plain_text_questions_answer_from_a_real_model_is_read():
    real = '{"enough": false, "questions": [{"text": "What is in the room?", "options": ["Bed", "Desk"], "multiple": true}, {"text": "Is the bed made?", "options": ["Yes", "No"], "multiple": false}]}'
    enough, questions = bd.parse_questions(real)
    assert enough is False and [q.text for q in questions] == ["What is in the room?", "Is the bed made?"]


def test_no_structure_is_forced_on_the_agent():
    assert not hasattr(bd, "STRUCTURE")


# --- the XP and the engine side ---------------------------------------------------


def test_step_sizes_give_10_15_20_xp_and_own_steps_default_to_small():
    assert engine.SIZE_XP == {"small": 10, "medium": 15, "big": 20}
    assert engine.Step.from_dict({"title": "x"}).size == "small"
    assert engine.Step.from_dict({"title": "x", "size": "huge"}).size == "small"
    assert engine.Step.from_dict({"title": "x", "size": "big", "group": " Table "}).group == "Table"


def test_a_big_step_earns_20_and_the_bonuses_still_add_on_top():
    from datetime import datetime, timezone

    now = datetime(2026, 11, 21, 12, tzinfo=timezone.utc)
    p = engine.Progress()
    a = engine.award_step(p, "c", "r", now, timezone.utc, None, False, "big")
    assert a.xp == 20
    a = engine.award_step(p, "c", "r", now, timezone.utc, now.isoformat(), True, "medium")
    assert a.xp == 15 + engine.XP_CHORE + engine.XP_QUICK


def test_a_run_snapshots_size_and_group():
    from datetime import datetime, timezone

    chore = engine.Chore(
        id="c", name="Room", steps=[engine.Step("a", "Clear", size="big", group="Table")]
    )
    run, _ = engine.start_run(chore, datetime(2026, 11, 21, tzinfo=timezone.utc))
    assert (run.steps[0].size, run.steps[0].group) == ("big", "Table")


def test_a_chore_can_have_fifty_steps_but_not_fifty_one():
    def chore(n):
        return engine.Chore(id="c", name="Big", steps=[engine.Step(f"s{i}", f"Do {i}") for i in range(n)])

    assert engine.validate_chore(chore(50)) is None
    assert engine.validate_chore(chore(51))


def test_notes_and_ai_settings_roundtrip_and_validate():
    chore = engine.Chore.from_dict({"name": "Room", "steps": [{"title": "x"}], "notes": " Room has: table. "})
    assert chore.notes == "Room has: table."
    again = engine.Chore.from_dict(json.loads(json.dumps(engine.to_dict(chore))))
    assert again == chore
    s = engine.Settings.from_dict({"ai": {"enabled": True, "entity_id": "ai_task.x"}})
    assert s.ai.enabled and engine.validate_settings(s) is None
    assert engine.Settings.from_dict(json.loads(json.dumps(engine.to_dict(s)))) == s
    assert engine.Settings.from_dict({}).ai.enabled is False  # off by default
    assert engine.validate_settings(engine.Settings.from_dict({"ai": {"entity_id": "light.x"}}))
    assert engine.validate_settings(engine.Settings.from_dict({"ai": {"steps_prompt": "x" * 9000}}))
