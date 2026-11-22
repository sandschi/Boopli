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
- Group the steps by part or area ("Table", "Chairs", "Floor") with "group", and keep the steps of a group together. Use an empty group for a task without parts. A part is something the person can set aside and do another day, so every group must be complete on its own.
- A task about a whole room or area ("clean the living room") means the whole job. When the notes name the things in that room, make one group for each thing that can be tidied or cleaned (a sofa, a table, a desk, the kitchen counter, the floor, the bin). Every such group gets its own full set of small steps in this order: gather the things that do not belong there, throw away the rubbish, put things back where they belong, clear the surface, wipe or clean it. Do not write just one step per object. Things that need no cleaning (a clock, a door) get no group. Put the floor and the bin last.
- Treat what you know about the place as background, never as a list of jobs. Do not move or rearrange furniture and big objects, and do not hang, fix or build anything unless the task says so.
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


def format_known(notes: str, rooms: str = "") -> str:
    """What the AI already knows: the chore's own notes, then the notes of the rooms involved."""
    parts = [clean_text(notes, 4000), rooms.strip()]
    return "\n".join(p for p in parts if p) or "(nothing yet)"


# --- rooms ("My home") -------------------------------------------------------------

ROOM_NOTES_SENT_MAX = 1500  # per room, so a request stays small
WHOLE_HOME_WORDS = (
    "whole flat", "whole house", "whole home", "whole apartment", "entire flat",
    "entire house", "entire home", "entire apartment", "everywhere", "every room",
    "all rooms", "the whole place", "the house", "ganze wohnung", "ganzes haus", "gesamte wohnung",
    "ganze bude", "alle zimmer", "alle räume", "überall", "ueberall",
)


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w]+", " ", text.lower())).strip()


def guess_rooms(task: str, rooms: list[tuple[str, str]]) -> list[str]:
    """The ids of the rooms a task is about, from the room names in the task.

    `rooms` is (id, name). A task about the whole flat means every room. The
    panel shows the guess and the user can change it before anything is sent.
    """
    text = f" {_norm(task)} "
    if any(f" {_norm(word)} " in text for word in WHOLE_HOME_WORDS):
        return [room_id for room_id, _ in rooms]
    found: list[str] = []
    for room_id, name in rooms:
        wanted = _norm(name)
        if wanted and f" {wanted} " in text:
            found.append(room_id)
    return found


def rooms_text(rooms: list[tuple[str, str]]) -> tuple[str, bool]:
    """The notes block for an AI request from (name, notes) pairs, and whether any was shortened."""
    lines: list[str] = []
    shortened = False
    for name, notes in rooms:
        notes = (notes or "").strip()
        if not notes:
            continue
        if len(notes) > ROOM_NOTES_SENT_MAX:
            notes = notes[:ROOM_NOTES_SENT_MAX].rstrip() + " …"
            shortened = True
        lines.append(f"Room \"{clean_text(name, 60)}\": " + notes.replace("\n", "; "))
    return "\n".join(lines), shortened


ROOM_QUESTIONS_PROMPT = """You help a person with ADHD describe a room in their home, so a helper can later split chores in that room into small steps that really fit it.

Room: {room}

What is already known about this room:
{known}

Their answers so far:
{answers}

Ask short questions about what is in the room and how it is used: furniture and appliances, where things are stored, surfaces and floors, what usually gets messy, and anything awkward (a sticking door, a hard-to-reach corner). Once, also ask where things belong in this room (where papers, clothes, dishes or tools go); this one is optional and the person may skip it. Do not ask about anything already known or already answered.
- Keep every question short, one topic each. Give 2 to 6 short answer options that fit on a button. Set "multiple" to true when several options can be true at once. The person can always type their own words, so do not add an "other" option.
- Ask at most 4 questions at a time. When the picture is good enough, set "enough" to true and leave "questions" empty.
- Write in the language of the room name and the notes.

Answer with a single JSON object and nothing else, like this:
{"enough": false, "questions": [{"text": "What is on the floor?", "options": ["Carpet", "Wood", "Tiles"], "multiple": false}]}"""

ROOM_NOTES_PROMPT = """Write short notes about a room in a person's home, from what they told you. The notes help a helper split chores in this room into small steps that fit it.

Room: {room}

What was already known about this room:
{known}

Their answers:
{answers}

Rules:
- Plain short facts, one per line, for example "Dishwasher is under the counter" or "Balcony door sticks". When they said where things belong, write that too, for example "Clothes go in the wardrobe". Keep what was already known unless an answer replaces it.
- Only facts about the room. No advice and no chores. At most 1500 characters.
- Write in the language of the room name and the notes.

Answer with a single JSON object and nothing else, like this:
{"notes": "Dishwasher is under the counter\\nBalcony door sticks"}"""


def clean_room_notes(value: Any, limit: int = 2000) -> str:
    """Notes keep their line breaks; blank lines and stray spaces go."""
    if isinstance(value, list):  # a model that answered with one fact per list item
        value = "\n".join(str(v) for v in value)
    lines = [" ".join(str(line).split()) for line in str(value or "").splitlines()]
    return "\n".join(line for line in lines if line)[:limit]


def room_instructions(default: str, room: str, answers: Any, notes: str) -> str:
    return fill(
        default,
        room=clean_text(room, 60),
        known=clean_room_notes(notes, 2000) or "(nothing yet)",
        answers=format_answers(clean_answers(answers)),
    )


def parse_room_notes(data: Any) -> str:
    """The notes the agent wrote. A plain-text answer is accepted as the notes."""
    try:
        parsed = extract_json(data)
    except BreakdownError:
        text = raw_text(data).strip()
        if not text:
            raise
        broken = re.search(r'"notes"\s*:\s*"((?:[^"\\]|\\.)*)"', text)
        if broken:  # JSON that does not parse, but the notes are readable
            return clean_room_notes(_unescape(broken.group(1)))
        if text.lstrip().startswith("{"):
            raise
        return clean_room_notes(re.sub(r"^```\w*\s*|\s*```$", "", text))
    notes = clean_room_notes(parsed.get("notes"))
    if not notes:
        raise BreakdownError("The AI agent did not write any notes.")
    return notes


ROOM_PHOTOS_PROMPT = """Look at the attached photo(s) of one room in a person's home and write short notes about the room. The notes help a helper split chores in this room into small steps that fit it.

Room: {room}

What was already known about this room:
{known}

Rules:
- Plain short facts about what you can see, one per line, for example "Dishwasher is under the counter" or "Carpet on the floor, a desk by the window". Keep what was already known unless a photo clearly shows something different.
- Only fixed things and furniture: appliances, furniture, storage, floors and surfaces, windows and doors, and places where things pile up. No people, no pets, no screens, no papers, no names, no addresses, no brands. Do not guess what you cannot see. No advice and no chores. At most 1500 characters.
- Write in the language of the room name and the notes.

Answer with a single JSON object and nothing else, like this:
{"notes": "Dishwasher is under the counter\\nWindow above the sink"}"""

# --- talking it out in the person's own AI chat (copy a prompt, paste the result back) ---

ROOM_CHAT_PROMPT = """I want to describe the room "{room}" in my home, so a helper app can later split chores in that room into small steps that fit it. Please interview me about it. I may be talking by voice, so keep it relaxed.

How to do it:
- Ask one or two short questions at a time: what is in the room, where things are stored, floors and surfaces, what usually gets messy, anything awkward (a sticking door, a hard-to-reach corner), and, if I know, where things belong (where papers, clothes, dishes or tools go).
- Do not ask about things I already told you. Keep going until I say I am done.
{known}
When I say I am done, answer with ONLY the notes, in one code block, one short fact per line, with no title, no bullets and no comments. For example:
```
Dishwasher is under the counter
Balcony door sticks
```
Facts about the room only: no advice and no chores. Write the notes in the language I speak.

Start now with your first question."""

HOME_CHAT_PROMPT = """I want to describe my whole home, room by room, so a helper app can later split chores into small steps that fit each room. Please interview me about it. I may be talking by voice, so keep it relaxed.

How to do it:
- Go through one room at a time. Ask one or two short questions at a time: what is in the room, where things are stored, floors and surfaces, what usually gets messy, anything awkward (a sticking door, a hard-to-reach corner), and, if I know, where things belong (where papers, clothes, dishes or tools go).
- Do not ask about things I already told you. When a room is done, move on to the next one. Keep going until I say I am done.
{names}{known}
When I say I am done, answer with ONLY the notes, in one code block: a heading line for each room that starts with "## ", then one short fact per line, with no bullets and no comments. For example:
```
## Kitchen
Dishwasher is under the counter
Balcony door sticks
## Bedroom
Wardrobe has sliding doors
```
Facts about the rooms only: no advice and no chores. Write the notes in the language I speak.

Start now by asking which room we begin with."""


def room_chat_prompt(room: str, notes: str, include_notes: bool = True, custom: str = "") -> str:
    """The text to copy into the person's own AI chat for one room."""
    notes = clean_room_notes(notes, 2000) if include_notes else ""
    known = (
        "\nHere is what I already wrote about this room. Keep it, and add to it or correct it:\n"
        + notes
        + "\n"
        if notes
        else ""
    )
    return fill(
        (custom or "").strip() or ROOM_CHAT_PROMPT, room=clean_text(room, 60) or "my room", known=known
    )


def home_chat_prompt(
    rooms: list[tuple[str, str]], include_notes: bool = True, custom: str = ""
) -> str:
    """The text to copy into the person's own AI chat for the whole home."""
    names = [clean_text(n, 60) for n, _ in rooms if clean_text(n, 60)]
    names_text = (
        "\nMy rooms are: " + ", ".join(names) + ". Use these names for the headings when they fit.\n"
        if names
        else ""
    )
    known = ""
    if include_notes:
        lines = [
            f"{clean_text(n, 60)}: " + clean_room_notes(t, 1500).replace("\n", "; ")
            for n, t in rooms
            if (t or "").strip()
        ]
        if lines:
            known = (
                "\nHere is what I already wrote. Keep it, and add to it or correct it:\n"
                + "\n".join(lines)
                + "\n"
            )
    return fill((custom or "").strip() or HOME_CHAT_PROMPT, names=names_text, known=known)


_BULLET = re.compile(r"^\s*(?:[-*•–—]+|\d+[.)])\s+")
_HEADING = re.compile(r"^\s*(?:#{1,6}\s*|\*\*|__)\s*(.+?)\s*(?:\*\*|__)?\s*:?\s*$")
_ROOM_LABEL = re.compile(r"^\s*(?:room|raum|zimmer)\s*[:\-]\s*(.+?)\s*$", re.IGNORECASE)


def _strip_markup(line: str) -> str:
    line = _BULLET.sub("", line.strip())
    return line.replace("**", "").replace("__", "").replace("`", "").strip()


def _unfenced(text: str) -> str:
    """The inside of the first code block when there is one, else the whole text."""
    block = re.search(r"```[\w-]*\s*\n(.*?)```", text, re.DOTALL)
    return block.group(1) if block else text.replace("```", "")


def parse_pasted_notes(text: Any) -> str:
    """Notes pasted back from the person's own AI chat: bullets, markdown and fences go."""
    raw = str(text or "").strip()
    if not raw:
        raise BreakdownError("Nothing was pasted.")
    if raw.lstrip("` \n").startswith("{") or '"notes"' in raw:
        try:
            return parse_room_notes(raw)
        except BreakdownError:
            pass
    lines = []
    for line in _unfenced(raw).splitlines():
        line = _strip_markup(line)
        if line.startswith("#"):
            line = line.lstrip("# ").strip()
        if line:
            lines.append(line)
    notes = clean_room_notes(lines)
    if not notes:
        raise BreakdownError("No notes found in what was pasted.")
    return notes


def parse_pasted_home(text: Any, rooms: list[tuple[str, str]]) -> list[dict[str, Any]]:
    """Split pasted notes into rooms. `rooms` is (id, name); a name that matches gets its id.

    A room starts at a heading line ("## Kitchen", "**Kitchen**", "Room: Kitchen" or
    "Kitchen:" on its own). Text before the first heading is ignored. A room that is
    not in `rooms` comes back with id None, so the panel can offer to add it.
    """
    body = _unfenced(str(text or "").strip())
    known = {_norm(name): (room_id, name) for room_id, name in rooms if _norm(name)}
    sections: list[tuple[str, list[str]]] = []
    for raw_line in body.splitlines():
        if not raw_line.strip():
            continue
        title = None
        label = _ROOM_LABEL.match(_strip_markup(raw_line))
        heading = _HEADING.match(raw_line)
        stripped = _strip_markup(raw_line)
        if label and raw_line.lstrip()[:1] != "-":
            title = label.group(1)
        elif (
            heading
            and raw_line.lstrip().startswith(("#", "**", "__"))
            and "**" not in heading.group(1)
            and "__" not in heading.group(1)
        ):
            title = heading.group(1)
        elif stripped.endswith(":") and len(stripped.split()) <= 4 and not _BULLET.match(raw_line):
            title = stripped[:-1]
        elif ":" in stripped and _norm(stripped.split(":", 1)[0]) in known:
            name, _, rest = stripped.partition(":")
            sections.append((name.strip(), [rest.strip()] if rest.strip() else []))
            continue
        if title is not None:
            title = clean_text(_strip_markup(title).rstrip(":"), 60)
            if title:
                sections.append((title, []))
            continue
        if sections:
            line = stripped
            if line:
                sections[-1][1].append(line)
    result: list[dict[str, Any]] = []
    seen: dict[str, int] = {}
    for name, lines in sections:
        notes = clean_room_notes(lines)
        if not notes:
            continue
        key = _norm(name)
        if key in seen:  # the same room twice: join the notes
            entry = result[seen[key]]
            entry["notes"] = clean_room_notes([entry["notes"], notes])
            continue
        match = known.get(key)
        seen[key] = len(result)
        result.append({"name": match[1] if match else name, "id": match[0] if match else None, "notes": notes})
    if not result:
        raise BreakdownError(
            "I could not find any rooms. Each room needs a heading line, for example: ## Kitchen"
        )
    return result


def fill(template: str, **values: str) -> str:
    """Replace {name} placeholders. Unlike str.format it leaves the JSON braces alone."""
    for key, value in values.items():
        template = template.replace("{" + key + "}", value)
    return template


def _instructions(
    default: str, custom: str, task: str, kind: str, answers: Any, notes: str, rooms: str
) -> str:
    return fill(
        (custom or "").strip() or default,
        task=clean_text(task, TITLE_MAX),
        kind=KIND_TEXT.get(kind, KIND_TEXT[KIND_NOW]),
        known=format_known(notes, rooms),
        answers=format_answers(clean_answers(answers)),
    )


def questions_instructions(
    task: str, kind: str, answers: Any = None, notes: str = "", custom: str = "", rooms: str = ""
) -> str:
    return _instructions(QUESTIONS_PROMPT, custom, task, kind, answers, notes, rooms)


def steps_instructions(
    task: str, kind: str, answers: Any = None, notes: str = "", custom: str = "", rooms: str = ""
) -> str:
    return _instructions(STEPS_PROMPT, custom, task, kind, answers, notes, rooms)


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
