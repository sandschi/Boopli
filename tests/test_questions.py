"""Tests for questions a chore asks when it starts (steps that only apply on yes)."""

from __future__ import annotations

import importlib.util
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

_DIR = Path(__file__).parents[1] / "custom_components" / "boopli"


def _load(name: str, file: str):
    spec = importlib.util.spec_from_file_location(name, _DIR / file)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


engine = _load("boopli_engine_questions", "engine.py")
bd = _load("boopli_breakdown_questions", "breakdown.py")

UTC = timezone.utc
T0 = datetime(2026, 11, 21, 10, 0, tzinfo=UTC)
TABLE = "table"
LAUNDRY = "laundry"


def room() -> "engine.Chore":
    """Declutter steps only when the table is cluttered; wiping is always there."""
    return engine.Chore(
        id="room",
        name="Clean the living room",
        where="home",
        questions=[
            engine.Question(TABLE, "Does the table need decluttering?"),
            engine.Question(LAUNDRY, "Is there laundry on the floor?"),
        ],
        steps=[
            engine.Step("a1", "Pick things up off the table", group="Table", only_if=TABLE),
            engine.Step("a2", "Wipe the table", group="Table"),
            engine.Step("b1", "Pick up the laundry", group="Floor", only_if=LAUNDRY),
            engine.Step("c1", "Vacuum the floor", group="Floor"),
        ],
    )


def titles(run: "engine.Run") -> list[str]:
    return [s.title for s in run.steps]


# --- starting with answers -------------------------------------------------


def test_no_answer_leaves_out_only_the_steps_that_point_to_that_question():
    run, events = engine.start_run(room(), T0, {TABLE: False, LAUNDRY: True})
    assert titles(run) == ["Wipe the table", "Pick up the laundry", "Vacuum the floor"]
    assert not run.questions_open
    assert run.answers == {TABLE: False, LAUNDRY: True}
    started = next(e for e in events if e.name == engine.EVENT_CHORE_STARTED)
    assert started.data["answers"] == {
        "Does the table need decluttering?": False,
        "Is there laundry on the floor?": True,
    }


def test_an_unanswered_question_counts_as_yes():
    run, _ = engine.start_run(room(), T0, {TABLE: False})
    assert "Pick up the laundry" in titles(run)


def test_yes_to_everything_keeps_every_step():
    run, _ = engine.start_run(room(), T0, {TABLE: True, LAUNDRY: True})
    assert len(run.steps) == 4


def test_answers_that_leave_nothing_raise():
    chore = engine.Chore(
        id="c",
        name="Tidy",
        questions=[engine.Question("q", "Messy?")],
        steps=[engine.Step("a", "Tidy up", only_if="q")],
    )
    with pytest.raises(ValueError):
        engine.start_run(chore, T0, {"q": False})


def test_a_chore_without_questions_starts_as_before():
    chore = engine.Chore(id="c", name="L", steps=[engine.Step("a", "Hang")])
    run, _ = engine.start_run(chore, T0)
    assert titles(run) == ["Hang"]
    assert not run.questions_open and run.asking_until is None


# --- starting by itself: all steps, then answering ---------------------------


def test_started_without_answers_has_all_steps_and_holds_the_first_nudge():
    run, events = engine.start_run(room(), T0, None, 30)
    assert len(run.steps) == 4
    assert run.questions_open
    assert run.steps[0].status == engine.STEP_ACTIVE  # triggers and Done work right away
    assert engine.nudges_held(run, T0 + timedelta(minutes=29))
    assert not engine.nudges_held(run, T0 + timedelta(minutes=31))  # then it nudges as normal
    started = next(e for e in events if e.name == engine.EVENT_CHORE_STARTED)
    assert started.data["questions_open"] is True


def test_answering_early_removes_the_steps_that_do_not_apply():
    run, _ = engine.start_run(room(), T0, None, 30)
    events = engine.answer_questions(run, {TABLE: False, LAUNDRY: True}, T0 + timedelta(minutes=5))
    assert titles(run) == ["Wipe the table", "Pick up the laundry", "Vacuum the floor"]
    assert not run.questions_open and run.asking_until is None
    assert not engine.nudges_held(run, T0 + timedelta(minutes=6))
    assert run.steps[0].status == engine.STEP_ACTIVE
    answered = next(e for e in events if e.name == engine.EVENT_QUESTIONS_ANSWERED)
    assert answered.data["answers"]["Does the table need decluttering?"] is False


def test_answering_with_nothing_means_all_steps():
    run, _ = engine.start_run(room(), T0, None, 30)
    engine.answer_questions(run, {}, T0)
    assert len(run.steps) == 4
    assert not run.questions_open


def test_answering_late_keeps_steps_that_are_already_done():
    run, _ = engine.start_run(room(), T0, None, 30)
    engine.complete_step(run, "a1", T0 + timedelta(minutes=2))  # did it before answering
    engine.answer_questions(run, {TABLE: False, LAUNDRY: False}, T0 + timedelta(minutes=3))
    assert titles(run) == ["Pick things up off the table", "Wipe the table", "Vacuum the floor"]
    assert run.steps[0].status == engine.STEP_DONE
    assert run.steps[1].status == engine.STEP_ACTIVE


def test_removing_the_active_step_activates_the_next_one():
    run, _ = engine.start_run(room(), T0, None, 30)
    assert run.steps[0].step_id == "a1" and run.steps[0].status == engine.STEP_ACTIVE
    events = engine.answer_questions(run, {TABLE: False}, T0)
    active = [s for s in run.steps if s.status == engine.STEP_ACTIVE]
    assert [s.step_id for s in active] == ["a2"]
    assert any(e.name == engine.EVENT_STEP_ACTIVE for e in events)


def test_answering_twice_changes_nothing():
    run, _ = engine.start_run(room(), T0, None, 30)
    engine.answer_questions(run, {TABLE: False}, T0)
    assert engine.answer_questions(run, {TABLE: True, LAUNDRY: True}, T0) == []
    assert len(run.steps) == 3


def test_answering_can_end_a_run_with_nothing_left():
    chore = engine.Chore(
        id="c",
        name="Tidy",
        questions=[engine.Question("q", "Messy?")],
        steps=[engine.Step("a", "Tidy up", only_if="q")],
    )
    run, _ = engine.start_run(chore, T0, None, 30)
    events = engine.answer_questions(run, {"q": False}, T0)
    assert run.status == engine.RUN_DONE
    assert any(e.name == engine.EVENT_CHORE_DONE for e in events)


# --- saving, validation, storage ---------------------------------------------


def test_questions_and_only_if_survive_a_round_trip():
    chore = room()
    again = engine.Chore.from_dict(engine.to_dict(chore))
    assert [q.text for q in again.questions] == [q.text for q in chore.questions]
    assert again.steps[0].only_if == TABLE
    run, _ = engine.start_run(chore, T0, None, 30)
    back = engine.Run.from_dict(engine.to_dict(run))
    assert back.questions_open and back.questions[0].id == TABLE
    assert back.steps[0].only_if == TABLE


def test_validation_of_questions():
    assert engine.validate_chore(room()) is None
    chore = room()
    chore.steps[0].only_if = "missing"
    assert "does not exist" in engine.validate_chore(chore)
    chore = room()
    chore.questions[0].text = ""
    assert engine.validate_chore(chore)
    chore = room()
    chore.questions.append(engine.Question(TABLE, "Same id"))
    assert engine.validate_chore(chore)
    chore = room()
    chore.questions = [engine.Question(f"q{i}", "Q?") for i in range(engine.MAX_QUESTIONS + 1)]
    chore.steps[0].only_if = ""
    chore.steps[2].only_if = ""
    assert engine.validate_chore(chore)


def test_the_wait_for_the_questions_is_a_setting():
    settings = engine.Settings.from_dict({})
    assert settings.question_wait_minutes == engine.QUESTION_WAIT_DEFAULT
    assert engine.validate_settings(settings) is None
    settings.question_wait_minutes = 1
    assert engine.validate_settings(settings)


# --- the AI writes questions for a chore that repeats -------------------------


ANSWER = {
    "summary": "Room has: table, floor.",
    "questions": [
        {"id": "Q1", "text": "Does the table need decluttering?"},
        {"id": "q2", "text": "Is the bin full?"},  # nothing points to it: dropped
    ],
    "steps": [
        {"title": "Put the cups on the tray", "group": "Table", "only_if": "q1"},
        {"title": "Wipe the table", "group": "Table", "only_if": ""},
        {"title": "Vacuum the floor", "group": "Floor", "only_if": "nope"},  # unknown: a normal step
    ],
}


def test_the_ai_can_link_steps_to_its_questions():
    steps, summary, questions = bd.parse_steps_and_questions(ANSWER)
    assert [q.text for q in questions] == ["Does the table need decluttering?"]
    assert [s.only_if for s in steps] == [questions[0].id, "", ""]
    assert summary.startswith("Room has")


def test_parse_steps_still_returns_two_things():
    steps, summary = bd.parse_steps(ANSWER)
    assert len(steps) == 3


def test_an_answer_without_questions_is_unchanged():
    steps, _summary, questions = bd.parse_steps_and_questions({"steps": [{"title": "Hang the washing"}]})
    assert questions == [] and steps[0].only_if == ""


def test_ai_questions_make_a_chore_that_can_be_saved():
    steps, _s, questions = bd.parse_steps_and_questions(ANSWER)
    chore = engine.Chore.from_dict(
        {
            "name": "Clean the living room",
            "questions": [{"id": q.id, "text": q.text} for q in questions],
            "steps": [{"title": s.title, "group": s.group, "only_if": s.only_if} for s in steps],
        }
    )
    assert engine.validate_chore(chore) is None


def test_the_steps_prompt_knows_about_questions():
    text = bd.steps_instructions("Clean the living room", bd.KIND_RECURRING)
    assert "only_if" in text and "yes/no question" in text


# --- the phone notification ------------------------------------------------


def test_the_questions_notification_has_two_buttons():
    payload = engine.questions_payload("run1", "Clean the living room", 2)
    actions = payload["data"]["actions"]
    assert "2 questions" in payload["message"]
    assert actions[0]["title"] == "Start with all steps"
    assert engine.parse_action(actions[0]["action"]) == (engine.ACTION_ALL_STEPS, "run1", engine.QUESTIONS_STEP)
    assert actions[1] == {"action": "URI", "title": "Answer the questions", "uri": engine.PANEL_PATH}
    assert "1 question " in engine.questions_payload("r", "x", 1)["message"]
