"""AI breakdown: the prompts and the reading of the answers.

Nothing here imports Home Assistant, so it is tested with plain pytest. The
prompts are plain text with four placeholders ({task}, {kind}, {known},
{answers}); a user may replace them in Settings. The agent is asked for ONE
JSON object as plain text (a forced structure made a real model answer "..."),
and the answer is read tolerantly and checked here before anything is used:
models sometimes break a bracket, so single steps are rescued line by line.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any

KIND_NOW = "now"  # a one-off task to start right away
KIND_RECURRING = "recurring"  # a chore that repeats, set up once and reused
KINDS = (KIND_NOW, KIND_RECURRING)

MAX_QUESTIONS = 6  # per round
MAX_OPTIONS = 8
MAX_STEPS = 50
MAX_ANSWERS = 80  # question and answer pairs kept in a request
TEXT_MAX = 500
QUESTION_MAX = 240
OPTION_MAX = 80
TITLE_MAX = 200
GROUP_MAX = 40
WAIT_MAX = 7 * 24 * 60
SIZES = ("small", "medium", "big")

KIND_TEXT = {
    KIND_NOW: (
        "a one-off task they want to start right away. Keep the questions short and few."
    ),
    KIND_RECURRING: (
        "a chore that comes back again and again. It is set up once and reused, "
        "so find out what it really involves."
    ),
}

QUESTIONS_PROMPT = """You help a person with ADHD turn a task into very small steps. Before writing the steps you may ask them questions about the task.

Task: {task}
This is {kind}

What you already know about it:
{known}

Their answers so far:
{answers}

Decide whether you know enough to write really small, concrete steps for THIS person in THIS situation.
- If the task is already clear and small (for example "take out the trash"), you need no questions: set "enough" to true.
- Otherwise ask what you need to know. For a task made of several parts (cleaning a room, laundry, tidying up), find out what is in it and how it looks now: which things there are (table, chairs, floor, bed, desk, shelves, windows...), what state they are in, what is already done, and how much time and energy they have today.
- For a chore that repeats, dig deeper: ask about each part and what usually has to be done, so the steps can be tiny and complete.
- Keep every question short, one topic each. Give 2 to 6 short answer options that fit on a button. Set "multiple" to true when several options can be true at once (for example a list of the things in a room). The person can always type their own words, so do not add an "other" option.
- Never ask something they already answered or that is already in "What you already know". Ask only what would change the steps.
- When you know enough, set "enough" to true and leave "questions" empty.
- Write in the language of the task.

Answer with a single JSON object and nothing else, like this:
{"enough": false, "questions": [{"text": "How does the floor look?", "options": ["Clear", "A few things", "Covered"], "multiple": false}]}"""

STEPS_PROMPT = """Split a task into very small steps for a person with ADHD.

Task: {task}
This is {kind}

What you already know about it:
{known}

Their answers:
{answers}

Rules:
- Each step is ONE concrete physical action that starts with a verb ("Put all the cups on the tray"). No explanations and no motivation talk inside a step.
- Make the steps really small: usually one to five minutes, even smaller when the person has little energy. A big job becomes many tiny steps. Use as many steps as it takes, at most 50.
- The first step is the easiest possible way to start and takes under two minutes.
- Group the steps by part or area ("Table", "Chairs", "Floor") with "group", and keep the steps of a group together. Use an empty group for a task without parts.
- Order the steps so nothing has to be done twice.
- Give every step a size: "small" (quick and easy), "medium" (takes some effort) or "big" (hard or long). Most steps are small.
- If time has to pass before a step (washing machine running, something drying or soaking), put the minutes in "wait_minutes" of the step that comes after the waiting, otherwise 0.
- "summary" is one short sentence with what you learned about this task or place, to remember for next time (for example "Room has: table, 2 chairs, floor, shelf."). Leave it empty if you learned nothing.
- Write in the language of the task.

Answer with a single JSON object and nothing else, like this:
{"summary": "Room has: table, floor.", "steps": [{"title": "Put the cups on the tray", "group": "Table", "size": "small", "wait_minutes": 0}]}"""

class BreakdownError(Exception):
    """The agent's answer could not be used."""


@dataclass
class Question:
    text: str
    options: list[str] = field(default_factory=list)
    multiple: bool = False


@dataclass
class StepDraft:
    title: str
    group: str = ""
    size: str = "small"
    wait_minutes: int = 0


# --- prompts -----------------------------------------------------------------


def clean_text(value: Any, limit: int = TEXT_MAX) -> str:
    """One line of text, trimmed and limited."""
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def clean_answers(answers: Any) -> list[dict[str, str]]:
    """The question and answer pairs from the panel, checked and limited."""
    out: list[dict[str, str]] = []
    for item in (answers or [])[:MAX_ANSWERS]:
        if not isinstance(item, dict):
            continue
        question = clean_text(item.get("question"), QUESTION_MAX)
        answer = clean_text(item.get("answer"))
        if question and answer:
            out.append({"question": question, "answer": answer})
    return out


def format_answers(answers: list[dict[str, str]]) -> str:
    if not answers:
        return "(none yet)"
    return "\n".join(f"- {a['question']} {a['answer']}" for a in answers)


def format_known(notes: str) -> str:
    return clean_text(notes, 4000) or "(nothing yet)"


def fill(template: str, **values: str) -> str:
    """Replace {name} placeholders. Unlike str.format it leaves the JSON braces alone."""
    for key, value in values.items():
        template = template.replace("{" + key + "}", value)
    return template


def _instructions(default: str, custom: str, task: str, kind: str, answers: Any, notes: str) -> str:
    return fill(
        (custom or "").strip() or default,
        task=clean_text(task, TITLE_MAX),
        kind=KIND_TEXT.get(kind, KIND_TEXT[KIND_NOW]),
        known=format_known(notes),
        answers=format_answers(clean_answers(answers)),
    )


def questions_instructions(
    task: str, kind: str, answers: Any = None, notes: str = "", custom: str = ""
) -> str:
    return _instructions(QUESTIONS_PROMPT, custom, task, kind, answers, notes)


def steps_instructions(
    task: str, kind: str, answers: Any = None, notes: str = "", custom: str = ""
) -> str:
    return _instructions(STEPS_PROMPT, custom, task, kind, answers, notes)


# --- reading the answer ---------------------------------------------------------


def raw_text(data: Any) -> str:
    """The text of the agent's answer, whatever shape it came in."""
    if isinstance(data, dict):
        data = data.get("json", "")
    return data if isinstance(data, str) else ""


_TITLE = re.compile(r'"title"\s*:\s*"((?:[^"\\]|\\.)*)"')
_GROUP = re.compile(r'"group"\s*:\s*"((?:[^"\\]|\\.)*)"')
_SIZE = re.compile(r'"size"\s*:\s*"([A-Za-z]*)"')
_WAIT = re.compile(r'"wait_minutes"\s*:\s*"?(-?\d+)')
_SUMMARY = re.compile(r'"summary"\s*:\s*"((?:[^"\\]|\\.)*)"')


def _unescape(value: str) -> str:
    try:
        return str(json.loads(f'"{value}"'))
    except ValueError:
        return value


def salvage_steps(text: str) -> tuple[list[dict[str, Any]], str]:
    """Pick the steps out of an answer that is not valid JSON, one line at a time.

    A real model once wrote `"wait_minutes": 0"),` where a closing brace belonged.
    Strict reading would have thrown away all 45 good steps for that one line.
    """
    steps: list[dict[str, Any]] = []
    for line in text.splitlines():
        title = _TITLE.search(line)
        if not title:
            continue
        group, size, wait = _GROUP.search(line), _SIZE.search(line), _WAIT.search(line)
        steps.append(
            {
                "title": _unescape(title.group(1)),
                "group": _unescape(group.group(1)) if group else "",
                "size": size.group(1) if size else "small",
                "wait_minutes": wait.group(1) if wait else 0,
            }
        )
    summary = _SUMMARY.search(text)
    return steps, _unescape(summary.group(1)) if summary else ""


def extract_json(data: Any) -> dict[str, Any]:
    """Get the JSON object out of whatever the agent returned."""
    if isinstance(data, dict) and "json" not in data:
        return data  # a model that filled in the fields directly
    text = data.get("json") if isinstance(data, dict) else data
    if isinstance(text, dict):
        return text
    if not isinstance(text, str) or not text.strip():
        raise BreakdownError("The AI agent sent back an empty answer.")
    body = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
    start, end = body.find("{"), body.rfind("}")
    if start < 0 or end <= start:
        raise BreakdownError("The AI agent's answer was not in the expected form.")
    try:
        parsed = json.loads(body[start : end + 1])
    except ValueError as err:
        raise BreakdownError("The AI agent's answer could not be read.") from err
    if not isinstance(parsed, dict):
        raise BreakdownError("The AI agent's answer was not in the expected form.")
    return parsed


def parse_questions(data: Any) -> tuple[bool, list[Question]]:
    """Return (enough, questions). No usable question always means enough."""
    parsed = extract_json(data)
    questions: list[Question] = []
    for item in parsed.get("questions") or []:
        if not isinstance(item, dict):
            continue
        text = clean_text(item.get("text"), QUESTION_MAX)
        options: list[str] = []
        for option in item.get("options") or []:
            cleaned = clean_text(option, OPTION_MAX)
            if cleaned and cleaned.lower() not in {o.lower() for o in options}:
                options.append(cleaned)
        if text:
            questions.append(
                Question(text, options[:MAX_OPTIONS], bool(item.get("multiple", False)))
            )
        if len(questions) >= MAX_QUESTIONS:
            break
    enough = bool(parsed.get("enough", False)) or not questions
    return enough, [] if enough else questions


def _int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def parse_steps(data: Any, max_steps: int = MAX_STEPS) -> tuple[list[StepDraft], str]:
    """Return (steps, summary). Raises BreakdownError when there is no usable step."""
    try:
        parsed = extract_json(data)
    except BreakdownError:
        rescued, summary = salvage_steps(raw_text(data))
        if not rescued:
            raise
        parsed = {"steps": rescued, "summary": summary}
    steps: list[StepDraft] = []
    for item in parsed.get("steps") or []:
        if isinstance(item, str):
            item = {"title": item}
        if not isinstance(item, dict):
            continue
        title = clean_text(item.get("title"), TITLE_MAX)
        if not title:
            continue
        if steps and steps[-1].title.lower() == title.lower():
            continue  # the same step twice in a row
        size = clean_text(item.get("size"), 12).lower()
        steps.append(
            StepDraft(
                title=title,
                group=clean_text(item.get("group"), GROUP_MAX),
                size=size if size in SIZES else "small",
                wait_minutes=max(0, min(WAIT_MAX, _int(item.get("wait_minutes")))),
            )
        )
        if len(steps) >= max_steps:
            break
    if not steps:
        raise BreakdownError("The AI agent did not send any steps.")
    return steps, clean_text(parsed.get("summary"), 400)
