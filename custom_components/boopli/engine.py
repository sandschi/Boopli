"""Boopli engine: pure chore and run logic.

Nothing in this module imports Home Assistant, so it can be tested on its own.
Every function takes the current time explicitly (`now`, timezone-aware) so
tests can control time. Timestamps are stored as ISO 8601 strings in UTC.

Concepts
--------
Chore   A recipe: a name, a repeat rule and an ordered list of steps.
Run     One round of a chore in progress. It keeps a snapshot of the steps.
Step    pending  -> not reachable yet (an earlier step is not done)
        waiting  -> the previous step is done, a wait is running
        active   -> it is the user's turn
        done     -> finished

There is deliberately no "overdue" state. A step is active until it is done.
"""

from __future__ import annotations

import colorsys
import uuid
from dataclasses import asdict, dataclass, field, replace
from datetime import date, datetime, time as dtime, timedelta, timezone, tzinfo
from typing import Any

# --- constants -----------------------------------------------------------

WHERE_HOME = "home"
WHERE_ANYWHERE = "anywhere"
WHERE_VALUES = (WHERE_HOME, WHERE_ANYWHERE)

REPEAT_NONE = "none"  # on demand: the user starts it
REPEAT_SCHEDULE = "schedule"  # certain days, each with its own times
REPEAT_EVERY_N_DAYS = "every_n_days"  # counted from completion
REPEAT_TYPES = (REPEAT_NONE, REPEAT_SCHEDULE, REPEAT_EVERY_N_DAYS)
# Older data used "daily" and "weekly"; both are converted to a schedule on load.
REPEAT_DAILY = "daily"
REPEAT_WEEKLY = "weekly"
MAX_TIMES_PER_DAY = 6
PREVIEW_MAX = 10

RESOLVE_MANUAL = "manual"  # only the user finishes the step
RESOLVE_AUTO = "auto"  # the step also finishes by itself (it has triggers)

# Triggers: what finishes a step by itself
TRIGGER_STATE = "state"  # an entity is in a state, or above/below a number
TRIGGER_TAG = "tag"  # an NFC tag is scanned
TRIGGER_BUTTON = "button"  # a button or event entity is pressed
TRIGGER_KINDS = (TRIGGER_STATE, TRIGGER_TAG, TRIGGER_BUTTON)
MODE_HAPPENS = "happens"  # it has to happen after the step became active
MODE_IS = "is"  # already being true also counts (checked when the step starts)
MODE_VALUES = (MODE_HAPPENS, MODE_IS)
MAX_TRIGGERS = 5  # per step
FOR_MINUTES_MAX = 24 * 60
BY_MANUAL = "manual"
BY_AUTO = "auto"
NO_STATE = ("unavailable", "unknown", "")

STEP_PENDING = "pending"
STEP_WAITING = "waiting"
STEP_ACTIVE = "active"
STEP_DONE = "done"

RUN_ACTIVE = "active"
RUN_DONE = "done"

MAX_WAIT_MINUTES = 7 * 24 * 60
MAX_STEPS = 50

# How big a step is. Harder steps are worth more XP.
SIZE_SMALL = "small"
SIZE_MEDIUM = "medium"
SIZE_BIG = "big"
SIZE_VALUES = (SIZE_SMALL, SIZE_MEDIUM, SIZE_BIG)
SIZE_XP = {SIZE_SMALL: 10, SIZE_MEDIUM: 15, SIZE_BIG: 20}
GROUP_MAX = 40  # characters of a step's group ("Table", "Floor")
STEP_TITLE_MAX = 200
NOTES_MAX = 4000
MAX_QUESTIONS = 8  # yes/no questions a chore can ask before it starts
QUESTION_MAX = 120
QUESTION_WAIT_DEFAULT = 30  # minutes the first nudge waits for the questions of a run that started by itself

EVENT_AWAY_STARTED = "away_started"
EVENT_AWAY_ENDED = "away_ended"
AWAY_MAX_DAYS = 400
AWAY_STAGGER_MINUTES = 2  # back from away: the frozen chores nudge one after the other, not all at once
EVENT_QUESTIONS_ANSWERED = "questions_answered"
EVENT_CHORE_STARTED = "chore_started"
EVENT_STEP_ACTIVE = "step_active"
EVENT_STEP_DONE = "step_done"
EVENT_CHORE_DONE = "chore_done"
EVENT_NUDGE_SENT = "nudge_sent"

# Nudge styles (per chore)
STYLE_QUIET = "quiet"  # panel only, never nudges
STYLE_ONE = "one"
STYLE_ESCALATING = "escalating"
STYLE_PERSISTENT = "persistent"
STYLE_VALUES = (STYLE_QUIET, STYLE_ONE, STYLE_ESCALATING, STYLE_PERSISTENT)

# Minutes between nudges for the escalating style, after nudge 1, 2, 3, ...
ESCALATING_GAPS = (30, 15, 10, 5, 5, 5)
PERSISTENT_GAP = 5

# Phone notification levels
LEVEL_NORMAL = "normal"
LEVEL_HIGH = "high"  # pops up; on many phones only looks different
LEVEL_ALARM = "alarm"  # plays on the alarm volume
LEVEL_ALARM_MAX = "alarm_max"  # asks for maximum volume (not on every phone)
LEVEL_VALUES = (LEVEL_NORMAL, LEVEL_HIGH, LEVEL_ALARM, LEVEL_ALARM_MAX)

# Light modes
LIGHT_BLINK = "blink"  # Boopli blinks the light itself, then restores it
LIGHT_INDICATOR = "indicator"  # on in a color until the step is resolved
LIGHT_MODE_VALUES = (LIGHT_BLINK, LIGHT_INDICATOR)
# Older versions saved "auto" and "flash" (they used the light's built-in flash,
# which some lights claim to support and ignore). Both now mean "blink".
LEGACY_LIGHT_MODES = ("auto", "flash")

BLINK_MS_DEFAULT = 1500
BLINK_MS_MIN, BLINK_MS_MAX = 100, 30000
GAP_MS_DEFAULT = 1000
GAP_MS_MIN, GAP_MS_MAX = 0, 30000
REPEATS_DEFAULT = 1
REPEATS_MIN, REPEATS_MAX = 1, 5

# Speakers: three levels per speaker. A speaker plays the highest enabled level
# that has been reached (they would cut each other off on one speaker).
SPEAKER_CUE = "cue"  # a small ding
SPEAKER_SPEECH = "speech"  # a spoken sentence
SPEAKER_ALARM = "alarm"  # a loud sound, repeated for a while
SPEAKER_LEVELS = (SPEAKER_CUE, SPEAKER_SPEECH, SPEAKER_ALARM)  # low to high

SOUND_ALEXA = "alexa"  # one of Amazon's built-in sounds, by id
SOUND_FILE = "file"  # a file in Home Assistant's media folder, or a URL
SOUND_KINDS = (SOUND_ALEXA, SOUND_FILE)

SPEECH_ALEXA_MEDIA = "alexa_media"  # notify.alexa_media_* (Alexa Media Player)
SPEECH_ALEXA_DEVICES = "alexa_devices"  # a notify.*_speak/_announce entity
SPEECH_TTS = "tts"  # tts.speak on any media player
SPEECH_ROUTES = (SPEECH_ALEXA_MEDIA, SPEECH_ALEXA_DEVICES, SPEECH_TTS)

START_AT_MIN, START_AT_MAX = 1, 20
ALARM_SECONDS_DEFAULT = 30
ALARM_SECONDS_MIN, ALARM_SECONDS_MAX = 3, 600
ALARM_REPEAT_DEFAULT = 5  # seconds between plays of an alarm sound; 0 = play once
ALARM_REPEAT_MAX = 60
ALARM_DEVICE_DOMAINS = ("siren", "switch", "input_boolean", "script")
SPEECH_TEMPLATE_DEFAULT = "{chore}: {step}"
ALEXA_ALARM_SOUND = "amzn_sfx_scifi_alarm_01"
ALEXA_DING_SOUND = "amzn_sfx_doorbell_chime_01"

# Which channels a nudge may use
CHANNELS_ALL = "all"
CHANNELS_PHONE_ONLY = "phone_only"

# The setup wizard: where the user is in it. Existing installs count as done.
SETUP_NEW = "new"  # never opened: the panel opens the wizard by itself
SETUP_IN_PROGRESS = "in_progress"  # opened but not finished
SETUP_SKIPPED = "skipped"  # the user chose "Skip for now"
SETUP_DONE = "done"
SETUP_STATUSES = (SETUP_NEW, SETUP_IN_PROGRESS, SETUP_SKIPPED, SETUP_DONE)
SETUP_STEP_MAX = 40

# XP and the pet. Rewards only: nothing here ever takes XP or a level away.
EVENT_XP_GAINED = "xp_gained"
XP_STEP = 10  # for every step finished
XP_CHORE = 20  # extra, for the step that finishes the chore
XP_QUICK = 5  # extra, for a step finished within QUICK_MINUTES of its turn
QUICK_MINUTES = 10
XP_RUNS_PER_DAY = 3  # runs of one chore that earn XP per day
PROGRESS_DAYS_KEPT = 7  # how long the per-day XP bookkeeping is kept
PET_NAME_DEFAULT = "Boopli"
PET_NAME_MAX = 30

MOOD_HAPPY = "happy"  # you finished something today
MOOD_CONTENT = "content"  # yesterday, or just getting started
MOOD_SLEEPY = "sleepy"  # 2 days quiet
MOOD_SAD = "sad"  # 3 to 6 days quiet
MOOD_HIBERNATING = "hibernating"  # 7 days or more: asleep like a bear, never gone
MOOD_VALUES = (MOOD_HAPPY, MOOD_CONTENT, MOOD_SLEEPY, MOOD_SAD, MOOD_HIBERNATING)
SLEEPY_AFTER_DAYS = 2
SAD_AFTER_DAYS = 3
HIBERNATE_AFTER_DAYS = 7

ACTION_DONE = "BOOPLI_DONE"
ACTION_SNOOZE = "BOOPLI_SNOOZE"
ACTION_ALL_STEPS = "BOOPLI_ALLSTEPS"  # "Start with all steps" on the questions notification
QUESTIONS_STEP = "q"  # stands in for a step id in the notification of the questions


def new_id() -> str:
    """Return a short unique id."""
    return uuid.uuid4().hex[:12]


def parse_ts(ts: str) -> datetime:
    """Parse a stored ISO timestamp into an aware datetime."""
    return datetime.fromisoformat(ts)


def fmt_ts(dt: datetime) -> str:
    """Format an aware datetime as a UTC ISO string."""
    return dt.astimezone(timezone.utc).isoformat()


# --- data classes --------------------------------------------------------


def _float_or_none(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


@dataclass
class Trigger:
    """Something that finishes a step by itself. Any one of a step's triggers is enough."""

    kind: str = TRIGGER_STATE
    entity_id: str = ""  # state and button
    mode: str = MODE_HAPPENS  # state only; tags and buttons always "happen"
    state: str = ""  # state: the state to wait for, for example "on" or "open"
    above: float | None = None  # state: a number the value must be above
    below: float | None = None  # state: a number the value must be below
    for_minutes: int = 0  # state: it has to hold this long
    tag_id: str = ""  # tag
    press: str = ""  # button: a specific event_type, empty = any press

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Trigger:
        return cls(
            kind=str(d.get("kind", TRIGGER_STATE)),
            entity_id=str(d.get("entity_id", "")).strip(),
            mode=str(d.get("mode", MODE_HAPPENS)),
            state=str(d.get("state", "")).strip(),
            above=_float_or_none(d.get("above")),
            below=_float_or_none(d.get("below")),
            for_minutes=int(d.get("for_minutes", 0) or 0),
            tag_id=str(d.get("tag_id", "")).strip(),
            press=str(d.get("press", "")).strip(),
        )


@dataclass
class Question:
    """A yes/no question a chore asks when it starts ("Does the table need decluttering?").

    Steps that point to it with `only_if` are only part of the run when the answer is yes.
    """

    id: str
    text: str

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Question:
        return cls(id=str(d.get("id") or new_id()), text=str(d.get("text", "")).strip())


@dataclass
class Step:
    """One step of a chore."""

    id: str
    title: str
    wait_minutes: int = 0  # wait after the previous step is done
    resolve: str = RESOLVE_MANUAL
    triggers: list[Trigger] = field(default_factory=list)
    size: str = SIZE_SMALL  # small, medium or big: worth 10, 15 or 20 XP
    group: str = ""  # the part of the task it belongs to ("Table")
    # "Wait until this happens": the step stays quiet until one of these is met.
    # `wait_minutes` is then the longest it waits (0 = as long as it takes).
    wait_for: list[Trigger] = field(default_factory=list)
    only_if: str = ""  # id of a question of the chore: the step is only there when it is answered yes

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Step:
        triggers = [Trigger.from_dict(t) for t in d.get("triggers") or []]
        size = str(d.get("size", SIZE_SMALL))
        return cls(
            only_if=str(d.get("only_if") or "").strip(),
            wait_for=[Trigger.from_dict(t) for t in d.get("wait_for") or []],
            id=str(d.get("id") or new_id()),
            title=str(d.get("title", "")).strip(),
            wait_minutes=int(d.get("wait_minutes", 0) or 0),
            resolve=RESOLVE_AUTO if triggers else RESOLVE_MANUAL,
            triggers=triggers,
            size=size if size in SIZE_VALUES else SIZE_SMALL,
            group=str(d.get("group") or "").strip()[:GROUP_MAX],
        )


def _clean_time(value: Any) -> str:
    """Write a time as HH:MM when it can be read, otherwise keep it for validation."""
    text = str(value).strip()
    try:
        hours, minutes = text.split(":")
        return f"{int(hours):02d}:{int(minutes):02d}"
    except ValueError:
        return text


@dataclass
class Repeat:
    """When a chore comes due on its own.

    `schedule`: each weekday ("0" = Monday ... "6" = Sunday) has its own list of
    local times, or is missing when the chore does not come that day.
    `every_n_days`: N days after the last run was finished, at `time`.
    """

    type: str = REPEAT_NONE
    time: str = "09:00"  # local time, HH:MM (every_n_days only)
    every_n_days: int = 1
    days: dict[str, list[str]] = field(default_factory=dict)  # schedule only

    @classmethod
    def daily(cls, time: str) -> Repeat:
        """A schedule with the same time every day."""
        return cls(type=REPEAT_SCHEDULE, days={str(i): [time] for i in range(7)})

    @classmethod
    def weekly(cls, time: str, weekdays: list[int]) -> Repeat:
        """A schedule with the same time on some days."""
        return cls(type=REPEAT_SCHEDULE, days={str(i): [time] for i in sorted(set(weekdays))})

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Repeat:
        d = d or {}
        kind = str(d.get("type", REPEAT_NONE))
        time = _clean_time(d.get("time", "09:00"))
        # Convert what older versions stored.
        if kind == REPEAT_DAILY:
            return cls.daily(time)
        if kind == REPEAT_WEEKLY:
            return cls.weekly(time, [int(x) for x in d.get("weekdays", [])])
        days: dict[str, list[str]] = {}
        for key, times in (d.get("days") or {}).items():
            cleaned = sorted({_clean_time(t) for t in times or []})
            if cleaned:
                days[str(key)] = cleaned
        return cls(
            type=kind,
            time=time,
            every_n_days=int(d.get("every_n_days", 1) or 1),
            days=days,
        )


@dataclass
class Chore:
    """A chore: a recipe for runs."""

    id: str
    name: str
    steps: list[Step]
    repeat: Repeat = field(default_factory=Repeat)
    where: str = WHERE_HOME
    enabled: bool = True
    one_off: bool = False  # deleted automatically once its run is done
    next_due: str | None = None
    created_at: str = ""
    nudge_style: str = STYLE_ONE
    ignore_quiet_hours: bool = False  # for things like pills
    notes: str = ""  # what the AI learned about the task, kept for "update steps"
    parked: bool = False  # a part of a task that was set aside to do later
    questions: list[Question] = field(default_factory=list)  # asked every time it starts
    keeps_going: bool = False  # runs as usual while away mode is on (pills, feeding a cat)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Chore:
        return cls(
            keeps_going=bool(d.get("keeps_going", False)),
            questions=[Question.from_dict(q) for q in d.get("questions") or []],
            parked=bool(d.get("parked", False)),
            notes=str(d.get("notes") or "").strip()[:NOTES_MAX],
            id=str(d.get("id") or new_id()),
            name=str(d.get("name", "")).strip(),
            steps=[Step.from_dict(s) for s in d.get("steps", [])],
            repeat=Repeat.from_dict(d.get("repeat")),
            where=str(d.get("where", WHERE_HOME)),
            enabled=bool(d.get("enabled", True)),
            one_off=bool(d.get("one_off", False)),
            next_due=d.get("next_due"),
            created_at=str(d.get("created_at", "")),
            nudge_style=str(d.get("nudge_style", STYLE_ONE)),
            ignore_quiet_hours=bool(d.get("ignore_quiet_hours", False)),
        )


@dataclass
class StepRun:
    """State of one step inside a run."""

    step_id: str
    title: str
    wait_minutes: int
    status: str = STEP_PENDING
    active_at: str | None = None  # when it is (or was) the user's turn
    done_at: str | None = None
    nudge_count: int = 0  # nudges sent for this step so far
    next_nudge_at: str | None = None  # when the next nudge is due (also holds a snooze)
    snoozed_until: str | None = None  # only for display in the panel
    triggers: list[Trigger] = field(default_factory=list)  # snapshot from the chore
    done_by: str | None = None  # "manual" or "auto"
    done_reason: str | None = None  # for "auto": what happened
    size: str = SIZE_SMALL  # snapshot from the chore
    group: str = ""  # snapshot from the chore
    wait_for: list[Trigger] = field(default_factory=list)  # snapshot from the chore
    only_if: str = ""  # snapshot from the chore: a question id

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> StepRun:
        size = str(d.get("size", SIZE_SMALL))
        return cls(
            only_if=str(d.get("only_if") or ""),
            wait_for=[Trigger.from_dict(t) for t in d.get("wait_for") or []],
            size=size if size in SIZE_VALUES else SIZE_SMALL,
            group=str(d.get("group") or ""),
            step_id=str(d["step_id"]),
            title=str(d.get("title", "")),
            wait_minutes=int(d.get("wait_minutes", 0) or 0),
            status=str(d.get("status", STEP_PENDING)),
            active_at=d.get("active_at"),
            done_at=d.get("done_at"),
            nudge_count=int(d.get("nudge_count", 0) or 0),
            next_nudge_at=d.get("next_nudge_at"),
            snoozed_until=d.get("snoozed_until"),
            triggers=[Trigger.from_dict(t) for t in d.get("triggers") or []],
            done_by=d.get("done_by"),
            done_reason=d.get("done_reason"),
        )


@dataclass
class Run:
    """One round of a chore."""

    id: str
    chore_id: str
    chore_name: str
    where: str
    started_at: str
    steps: list[StepRun]
    status: str = RUN_ACTIVE
    finished_at: str | None = None
    questions: list[Question] = field(default_factory=list)  # snapshot from the chore
    answers: dict[str, bool] = field(default_factory=dict)  # question id -> yes
    questions_open: bool = False  # started without answers: all steps are in, still to be asked
    asking_until: str | None = None  # the first nudge waits for the answers until then

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Run:
        return cls(
            questions=[Question.from_dict(q) for q in d.get("questions") or []],
            answers={str(k): bool(v) for k, v in (d.get("answers") or {}).items()},
            questions_open=bool(d.get("questions_open", False)),
            asking_until=d.get("asking_until"),
            id=str(d["id"]),
            chore_id=str(d["chore_id"]),
            chore_name=str(d.get("chore_name", "")),
            where=str(d.get("where", WHERE_HOME)),
            started_at=str(d["started_at"]),
            steps=[StepRun.from_dict(s) for s in d.get("steps", [])],
            status=str(d.get("status", RUN_ACTIVE)),
            finished_at=d.get("finished_at"),
        )


@dataclass
class HistoryEntry:
    """A completed step or chore, kept as a log."""

    ts: str
    kind: str  # "step_done" or "chore_done"
    chore_id: str
    chore_name: str
    run_id: str
    step_title: str | None = None
    by: str | None = None  # "manual" or "auto" (step_done only)
    reason: str | None = None  # for "auto": what happened

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> HistoryEntry:
        return cls(
            ts=str(d["ts"]),
            kind=str(d["kind"]),
            chore_id=str(d["chore_id"]),
            chore_name=str(d.get("chore_name", "")),
            run_id=str(d.get("run_id", "")),
            step_title=d.get("step_title"),
            by=d.get("by"),
            reason=d.get("reason"),
        )


@dataclass
class Event:
    """Something the manager should announce (fire on the HA event bus)."""

    name: str
    data: dict[str, Any]


def to_dict(obj: Any) -> dict[str, Any]:
    """Serialize any engine dataclass to plain JSON-safe data."""
    return asdict(obj)


# --- setup wizard state ------------------------------------------------------


@dataclass
class Setup:
    """Whether the setup wizard has been done, and where the user stopped."""

    status: str = SETUP_NEW
    step: str = ""  # id of the wizard step to resume at

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Setup:
        d = d or {}
        status = str(d.get("status", SETUP_NEW))
        return cls(
            status=status if status in SETUP_STATUSES else SETUP_NEW,
            step=str(d.get("step", ""))[:SETUP_STEP_MAX],
        )


def initial_setup(stored: dict[str, Any]) -> Setup:
    """The setup state for stored data that has none yet.

    Data from before the wizard existed (any chores, settings or history) means
    an existing install: it counts as done, so the wizard never ambushes it.
    """
    if any(stored.get(key) for key in ("chores", "settings", "runs", "history")):
        return Setup(status=SETUP_DONE)
    return Setup()


# --- "My home": rooms and what the user wants the AI to know about them --------

ROOM_NAME_MAX = 60
ROOM_NOTES_MAX = 2000
MAX_ROOMS = 40


def _clean_notes(value: Any, limit: int) -> str:
    """Notes keep their line breaks; blank lines and stray spaces go."""
    lines = [" ".join(str(line).split()) for line in str(value or "").splitlines()]
    return "\n".join(line for line in lines if line)[:limit]


@dataclass
class Room:
    """One room (or place) with notes the user may let the AI see."""

    id: str
    name: str
    area_id: str = ""  # the Home Assistant area it came from; empty = added by hand
    notes: str = ""
    hidden: bool = False  # an area room the user does not want; kept so it stays gone

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Room:
        return cls(
            id=str(d.get("id") or new_id()),
            name=" ".join(str(d.get("name", "")).split())[:ROOM_NAME_MAX],
            area_id=str(d.get("area_id") or ""),
            notes=_clean_notes(d.get("notes"), ROOM_NOTES_MAX),
            hidden=bool(d.get("hidden", False)),
        )


@dataclass
class Home:
    """The rooms, stored only in Boopli. Notes leave only inside an AI request."""

    enabled: bool = True  # whether room notes go along with AI requests
    rooms: list[Room] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Home:
        d = d or {}
        return cls(
            enabled=bool(d.get("enabled", True)),
            rooms=[Room.from_dict(r) for r in (d.get("rooms") or []) if isinstance(r, dict)],
        )


def validate_home(home: Home) -> str | None:
    if len(home.rooms) > MAX_ROOMS:
        return f"At most {MAX_ROOMS} rooms."
    seen: set[str] = set()
    for room in home.rooms:
        if not room.name:
            return "Every room needs a name."
        if room.id in seen:
            return "Two rooms share the same id."
        seen.add(room.id)
    return None


def merge_areas(home: Home, areas: list[tuple[str, str]]) -> bool:
    """Add a room for every Home Assistant area that has none yet. True if anything changed."""
    known = {r.area_id for r in home.rooms if r.area_id}
    changed = False
    for area_id, name in areas:
        if area_id in known or len(home.rooms) >= MAX_ROOMS:
            continue
        home.rooms.append(Room(id=new_id(), name=name[:ROOM_NAME_MAX], area_id=area_id))
        changed = True
    return changed


def validate_setup(setup: Setup) -> str | None:
    if setup.status not in SETUP_STATUSES:
        return "Unknown setup status."
    if len(setup.step) > SETUP_STEP_MAX:
        return "Unknown setup step."
    return None


# --- XP, levels and the pet ------------------------------------------------


@dataclass
class Progress:
    """The pet's progress. XP only ever goes up."""

    total_xp: int = 0
    started_at: str = ""  # when the pet first appeared
    last_activity: str | None = None  # the last time a step was finished
    # local date -> chore id -> ids of the runs that earned XP that day
    credited: dict[str, dict[str, list[str]]] = field(default_factory=dict)
    egg_found: bool = False  # the Easter egg gave its one-time gift

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Progress:
        d = d or {}
        return cls(
            egg_found=bool(d.get("egg_found", False)),
            total_xp=max(0, int(d.get("total_xp", 0) or 0)),
            started_at=str(d.get("started_at", "")),
            last_activity=d.get("last_activity"),
            credited={
                str(day): {str(c): [str(r) for r in runs] for c, runs in chores.items()}
                for day, chores in (d.get("credited") or {}).items()
            },
        )


@dataclass
class Award:
    """What finishing a step gave."""

    xp: int
    total_xp: int
    level: int
    level_up: bool
    woke_up: bool  # the pet was sad or hibernating until now
    mood: str


def level_threshold(level: int) -> int:
    """Total XP needed to reach `level` (level 1 starts at 0, then 100, 250, 450, ...)."""
    return 25 * (level - 1) * (level + 2) if level > 1 else 0


def level_for(total_xp: int) -> tuple[int, int, int]:
    """Return (level, XP gained inside this level, XP this level needs in all)."""
    level = 1
    while level_threshold(level + 1) <= total_xp:
        level += 1
    start = level_threshold(level)
    return level, total_xp - start, level_threshold(level + 1) - start


def mood_for(
    progress: Progress, now: datetime, tz: tzinfo, has_chores: bool = True
) -> str:
    """How the pet feels. It only depends on how long since a step was finished.

    Without any enabled chore there is nothing to be late for, so the pet never
    gets sleepier than content.
    """
    reference = progress.last_activity or progress.started_at
    if not reference:
        return MOOD_CONTENT
    days = (now.astimezone(tz).date() - parse_ts(reference).astimezone(tz).date()).days
    if days <= 0:
        return MOOD_HAPPY if progress.last_activity else MOOD_CONTENT
    if days < SLEEPY_AFTER_DAYS or not has_chores:
        return MOOD_CONTENT
    if days < SAD_AFTER_DAYS:
        return MOOD_SLEEPY
    if days < HIBERNATE_AFTER_DAYS:
        return MOOD_SAD
    return MOOD_HIBERNATING


def award_step(
    progress: Progress,
    chore_id: str,
    run_id: str,
    now: datetime,
    tz: tzinfo,
    active_at: str | None,
    chore_done: bool,
    size: str = SIZE_SMALL,
) -> Award:
    """Give XP for a finished step and note the activity.

    A step is worth 10, 15 or 20 XP for small, medium or big. Per chore and day
    only the first XP_RUNS_PER_DAY runs earn XP, so running a chore over and
    over cannot be farmed. Finishing still wakes the pet up.
    """
    mood_before = mood_for(progress, now, tz)
    level_before = level_for(progress.total_xp)[0]

    today = now.astimezone(tz).date()
    runs = progress.credited.setdefault(today.isoformat(), {}).setdefault(chore_id, [])
    xp = 0
    if run_id in runs or len(runs) < XP_RUNS_PER_DAY:
        if run_id not in runs:
            runs.append(run_id)
        xp = SIZE_XP.get(size, XP_STEP) + (XP_CHORE if chore_done else 0)
        if active_at and now - parse_ts(active_at) <= timedelta(minutes=QUICK_MINUTES):
            xp += XP_QUICK

    progress.total_xp += xp
    progress.last_activity = fmt_ts(now)
    cutoff = (today - timedelta(days=PROGRESS_DAYS_KEPT)).isoformat()
    progress.credited = {d: c for d, c in progress.credited.items() if d >= cutoff}

    level = level_for(progress.total_xp)[0]
    return Award(
        xp=xp,
        total_xp=progress.total_xp,
        level=level,
        level_up=level > level_before,
        woke_up=mood_before in (MOOD_SAD, MOOD_HIBERNATING),
        mood=mood_for(progress, now, tz),
    )


EGG_XP = 10  # the one-time gift for finding the Easter egg


def award_egg(progress: Progress, now: datetime, tz: tzinfo) -> Award:
    """Give the Easter egg's gift: EGG_XP the first time it is found, nothing afterwards.

    It is not chore work, so it does not wake the pet and does not count as activity.
    """
    level_before = level_for(progress.total_xp)[0]
    xp = 0
    if not progress.egg_found:
        progress.egg_found = True
        xp = EGG_XP
        progress.total_xp += xp
    level = level_for(progress.total_xp)[0]
    return Award(
        xp=xp,
        total_xp=progress.total_xp,
        level=level,
        level_up=level > level_before,
        woke_up=False,
        mood=mood_for(progress, now, tz),
    )


# --- validation ----------------------------------------------------------


def validate_trigger(t: Trigger) -> str | None:
    """Return an error message, or None when the trigger is valid."""
    if t.kind not in TRIGGER_KINDS:
        return "Unknown way to finish by itself."
    if t.kind == TRIGGER_TAG:
        return None if t.tag_id else "Pick an NFC tag."
    domain, _, name = t.entity_id.partition(".")
    if not domain or not name:
        return "Pick an entity."
    if t.kind == TRIGGER_BUTTON:
        return None
    if t.mode not in MODE_VALUES:
        return "Unknown mode."
    if not t.state and t.above is None and t.below is None:
        return "Say which state, or which number, finishes the step."
    if t.state and (t.above is not None or t.below is not None):
        return "Use either a state or a number, not both."
    if t.above is not None and t.below is not None and t.above >= t.below:
        return "'Above' must be lower than 'below'."
    if not 0 <= t.for_minutes <= FOR_MINUTES_MAX:
        return "'For' must be between 0 minutes and 24 hours."
    return None


def validate_chore(chore: Chore) -> str | None:
    """Return an error message, or None when the chore is valid."""
    if not chore.name:
        return "A chore needs a name."
    if not chore.steps:
        return "A chore needs at least one step."
    if len(chore.steps) > MAX_STEPS:
        return f"A chore can have at most {MAX_STEPS} steps."
    if len(chore.questions) > MAX_QUESTIONS:
        return f"A chore can ask at most {MAX_QUESTIONS} questions."
    question_ids: set[str] = set()
    for question in chore.questions:
        if not question.text:
            return "Every question needs some text."
        if len(question.text) > QUESTION_MAX:
            return f"A question can have at most {QUESTION_MAX} letters."
        if question.id in question_ids:
            return "Two questions have the same id."
        question_ids.add(question.id)
    step_ids: set[str] = set()
    for step in chore.steps:
        if step.id in step_ids:
            return "Two steps have the same id."
        step_ids.add(step.id)
        if step.only_if and step.only_if not in question_ids:
            return f"Step '{step.title}' points to a question that does not exist."
        if not step.title:
            return "Every step needs a title."
        if not 0 <= step.wait_minutes <= MAX_WAIT_MINUTES:
            return "A wait must be between 0 minutes and 7 days."
        if step.size not in SIZE_VALUES:
            return "A step is small, medium or big."
        if len(step.title) > STEP_TITLE_MAX:
            return f"A step title can have at most {STEP_TITLE_MAX} letters."
        if len(step.wait_for) > MAX_TRIGGERS:
            return f"A step can wait for at most {MAX_TRIGGERS} things."
        for trigger in step.wait_for:
            error = validate_trigger(trigger)
            if error:
                return f"Step '{step.title}' (wait until): {error}"
        if len(step.triggers) > MAX_TRIGGERS:
            return f"A step can have at most {MAX_TRIGGERS} ways to finish by itself."
        for trigger in step.triggers:
            error = validate_trigger(trigger)
            if error:
                return f"Step '{step.title}': {error}"
    if chore.where not in WHERE_VALUES:
        return "Where must be 'home' or 'anywhere'."
    if chore.nudge_style not in STYLE_VALUES:
        return "Unknown nudge style."
    return validate_repeat(chore.repeat)


def _time_ok(value: str) -> bool:
    try:
        _parse_hhmm(value)
    except (ValueError, IndexError):
        return False
    return True


def validate_repeat(rep: Repeat) -> str | None:
    """Return an error message, or None when the repeat rule is valid."""
    if rep.type not in REPEAT_TYPES:
        return "Unknown repeat type."
    if rep.type == REPEAT_EVERY_N_DAYS:
        if not _time_ok(rep.time):
            return "The time must look like 09:30."
        if not 1 <= rep.every_n_days <= 365:
            return "Repeat every N days needs N between 1 and 365."
    if rep.type == REPEAT_SCHEDULE:
        if not rep.days:
            return "Pick at least one day and a time."
        for key, times in rep.days.items():
            if key not in {str(i) for i in range(7)}:
                return "Days must be 0 (Monday) to 6 (Sunday)."
            if not 1 <= len(times) <= MAX_TIMES_PER_DAY:
                return f"A day can have 1 to {MAX_TIMES_PER_DAY} times."
            if any(not _time_ok(t) for t in times):
                return "Every time must look like 09:30."
    return None


# --- scheduling ----------------------------------------------------------


def _parse_hhmm(value: str) -> dtime:
    hours, minutes = value.split(":")
    return dtime(int(hours), int(minutes))


def _at(day: date, t: dtime, tz: tzinfo) -> datetime:
    return datetime.combine(day, t, tzinfo=tz)


def compute_next_due(repeat: Repeat, after: datetime, tz: tzinfo) -> datetime | None:
    """Return the next moment strictly after `after` that the repeat rule hits.

    For `every_n_days` this returns the moment N days after `after`'s date, at
    the repeat time. Use `first_due` for the very first occurrence.
    """
    if repeat.type == REPEAT_NONE:
        return None
    local = after.astimezone(tz)

    if repeat.type == REPEAT_SCHEDULE:
        for offset in range(0, 8):
            day = local.date() + timedelta(days=offset)
            for text in sorted(repeat.days.get(str(day.weekday()), [])):
                candidate = _at(day, _parse_hhmm(text), tz)
                if candidate > local:
                    return candidate.astimezone(timezone.utc)
        return None

    if repeat.type == REPEAT_EVERY_N_DAYS:
        day = local.date() + timedelta(days=max(1, repeat.every_n_days))
        return _at(day, _parse_hhmm(repeat.time), tz).astimezone(timezone.utc)

    return None


def first_due(repeat: Repeat, now: datetime, tz: tzinfo) -> datetime | None:
    """Return the first due moment for a new or changed chore."""
    if repeat.type == REPEAT_EVERY_N_DAYS:
        # Start at the next occurrence of the time, like a daily chore.
        return compute_next_due(Repeat.daily(repeat.time), now, tz)
    return compute_next_due(repeat, now, tz)


def preview_schedule(
    repeat: Repeat, now: datetime, tz: tzinfo, count: int = 5
) -> list[datetime]:
    """The next few moments a repeat rule comes due, for showing in the panel."""
    count = max(1, min(count, PREVIEW_MAX))
    if repeat.type == REPEAT_NONE:
        return []
    first = first_due(repeat, now, tz)
    if first is None:
        return []
    if repeat.type == REPEAT_EVERY_N_DAYS:
        return [first]  # after that it depends on when you finish
    moments = [first]
    while len(moments) < count:
        nxt = compute_next_due(repeat, moments[-1], tz)
        if nxt is None:
            break
        moments.append(nxt)
    return moments


def init_schedule(chore: Chore, now: datetime, tz: tzinfo) -> None:
    """(Re)compute `next_due` after a chore was created or its repeat changed."""
    due = first_due(chore.repeat, now, tz)
    chore.next_due = fmt_ts(due) if due else None


# --- runs ----------------------------------------------------------------


def _became_active(step: StepRun) -> None:
    """A step is now the user's turn: its first nudge is due right away."""
    step.status = STEP_ACTIVE
    step.nudge_count = 0
    step.next_nudge_at = step.active_at
    step.snoozed_until = None


def _activate(step: StepRun, base: datetime) -> bool:
    """Schedule a step after `base`. Return True when it is active right now.

    A step that waits for something to happen stays quiet until it does. Its
    `wait_minutes` is then the longest it waits (0 = as long as it takes).
    """
    if step.wait_for:
        step.status = STEP_WAITING
        step.active_at = (
            fmt_ts(base + timedelta(minutes=step.wait_minutes)) if step.wait_minutes > 0 else None
        )
        return False
    step.active_at = fmt_ts(base + timedelta(minutes=step.wait_minutes))
    if step.wait_minutes <= 0:
        _became_active(step)
        return True
    step.status = STEP_WAITING
    return False


def release_step(run: Run, step_id: str, now: datetime) -> list[Event]:
    """What a waiting step was waiting for has happened: it is the user's turn now."""
    if run.status != RUN_ACTIVE:
        return []
    step = next((s for s in run.steps if s.step_id == step_id), None)
    if step is None or step.status != STEP_WAITING:
        return []
    step.active_at = fmt_ts(now)
    _became_active(step)
    return [_step_event(EVENT_STEP_ACTIVE, run, step, now)]


def _step_event(name: str, run: Run, step: StepRun, now: datetime) -> Event:
    return Event(
        name,
        {
            "chore_id": run.chore_id,
            "chore_name": run.chore_name,
            "run_id": run.id,
            "step_id": step.step_id,
            "step_title": step.title,
            "where": run.where,
            "time": fmt_ts(now),
        },
    )


def _answers_by_text(run: Run) -> dict[str, bool]:
    """The answers with the question's own words as keys, for events and automations."""
    return {q.text: bool(run.answers.get(q.id, True)) for q in run.questions}


def start_run(
    chore: Chore,
    now: datetime,
    answers: dict[str, bool] | None = None,
    ask_minutes: int = QUESTION_WAIT_DEFAULT,
) -> tuple[Run, list[Event]]:
    """Start a new run of a chore. Its first step is scheduled from `now`.

    A chore with questions is started with the `answers` (question id -> yes): the
    steps that point to a question answered no are left out, so they never show up.
    A question without an answer counts as yes. Started with `answers=None` (by
    itself, at its time), the run has all steps and `questions_open`; the first nudge
    waits `ask_minutes` for `answer_questions`. Raises ValueError when the answers
    leave nothing to do.
    """
    asking = bool(chore.questions) and answers is None
    given = {} if asking else {q.id: bool((answers or {}).get(q.id, True)) for q in chore.questions}
    chosen = [s for s in chore.steps if asking or not s.only_if or given.get(s.only_if, True)]
    if not chosen:
        raise ValueError("With those answers there is nothing left to do.")
    run = Run(
        id=new_id(),
        chore_id=chore.id,
        chore_name=chore.name,
        where=chore.where,
        started_at=fmt_ts(now),
        steps=[
            StepRun(
                step_id=s.id,
                title=s.title,
                wait_minutes=s.wait_minutes,
                triggers=[replace(t) for t in s.triggers],
                wait_for=[replace(t) for t in s.wait_for],
                size=s.size,
                group=s.group,
                only_if=s.only_if,
            )
            for s in chosen
        ],
        questions=[replace(q) for q in chore.questions],
        answers=given,
        questions_open=asking,
        asking_until=fmt_ts(now + timedelta(minutes=max(1, ask_minutes))) if asking else None,
    )
    data: dict[str, Any] = {
        "chore_id": run.chore_id,
        "chore_name": run.chore_name,
        "run_id": run.id,
        "where": run.where,
        "time": fmt_ts(now),
    }
    if run.questions:
        data["questions_open"] = asking
        data["answers"] = {} if asking else _answers_by_text(run)
    events = [Event(EVENT_CHORE_STARTED, data)]
    if run.steps and _activate(run.steps[0], now):
        events.append(_step_event(EVENT_STEP_ACTIVE, run, run.steps[0], now))
    return run, events


def nudges_held(run: Run, now: datetime) -> bool:
    """Whether the first nudge still waits for the answers to the questions."""
    return bool(run.questions_open and run.asking_until and parse_ts(run.asking_until) > now)


def answer_questions(run: Run, answers: dict[str, bool], now: datetime) -> list[Event]:
    """Answer the questions of a run that started with all steps (idempotent).

    Steps that are not done yet and point to a question answered no are removed;
    steps already done stay. A question without an answer counts as yes ("start with
    all steps"). When nothing is left the run is over (no XP).
    """
    if run.status != RUN_ACTIVE or not run.questions_open:
        return []
    run.answers = {q.id: bool(answers.get(q.id, True)) for q in run.questions}
    run.questions_open = False
    run.asking_until = None
    run.steps = [
        s
        for s in run.steps
        if s.status == STEP_DONE or not s.only_if or run.answers.get(s.only_if, True)
    ]
    events = [
        Event(
            EVENT_QUESTIONS_ANSWERED,
            {
                "chore_id": run.chore_id,
                "chore_name": run.chore_name,
                "run_id": run.id,
                "answers": _answers_by_text(run),
                "time": fmt_ts(now),
            },
        )
    ]
    if not any(s.status != STEP_DONE for s in run.steps):
        run.status = RUN_DONE
        run.finished_at = fmt_ts(now)
        events.append(
            Event(
                EVENT_CHORE_DONE,
                {
                    "chore_id": run.chore_id,
                    "chore_name": run.chore_name,
                    "run_id": run.id,
                    "where": run.where,
                    "time": fmt_ts(now),
                },
            )
        )
        return events
    if not any(s.status in (STEP_ACTIVE, STEP_WAITING) for s in run.steps):
        upcoming = next((s for s in run.steps if s.status == STEP_PENDING), None)
        if upcoming is not None and _activate(upcoming, now):
            events.append(_step_event(EVENT_STEP_ACTIVE, run, upcoming, now))
    return events


def complete_step(
    run: Run,
    step_id: str,
    now: datetime,
    by: str = BY_MANUAL,
    reason: str = "",
) -> list[Event]:
    """Mark the active step done and advance. Idempotent: no-op if not active.

    `by` is "manual" (the user) or "auto" (a trigger); `reason` says what happened.
    """
    if run.status != RUN_ACTIVE:
        return []
    step = next((s for s in run.steps if s.step_id == step_id), None)
    if step is None or step.status != STEP_ACTIVE:
        return []

    step.status = STEP_DONE
    step.done_at = fmt_ts(now)
    step.done_by = by
    step.done_reason = reason or None
    done = _step_event(EVENT_STEP_DONE, run, step, now)
    done.data["by"] = by
    done.data["reason"] = reason
    events = [done]

    upcoming = next((s for s in run.steps if s.status == STEP_PENDING), None)
    if upcoming is not None:
        if _activate(upcoming, now):
            events.append(_step_event(EVENT_STEP_ACTIVE, run, upcoming, now))
    else:
        run.status = RUN_DONE
        run.finished_at = fmt_ts(now)
        events.append(
            Event(
                EVENT_CHORE_DONE,
                {
                    "chore_id": run.chore_id,
                    "chore_name": run.chore_name,
                    "run_id": run.id,
                    "where": run.where,
                    "time": fmt_ts(now),
                },
            )
        )
    return events


# --- parking a part of a task for later -------------------------------------

PARK_ANY = "any"  # waits until the user starts it
PARK_TOMORROW = "tomorrow"
PARK_AT = "at"  # a date and time the user picked
PARK_WHEN = (PARK_ANY, PARK_TOMORROW, PARK_AT)
PARK_TOMORROW_HOUR = 9  # "tomorrow" means 09:00 local time
PARK_NAME_MAX = 100


def park_part(run: Run, group: str, now: datetime) -> tuple[list[StepRun], list[Event]]:
    """Take a part (every unfinished step of one group) out of a run, to do later.

    Nothing is lost: the caller turns the returned steps into a task of their own.
    The run carries on with what is left. Raises ValueError with a message the
    user can read when this does not make sense.
    """
    if run.status != RUN_ACTIVE:
        raise ValueError("This task is not running.")
    group = group.strip()
    if not group:
        raise ValueError("This step does not belong to a part.")
    moving = [s for s in run.steps if s.group == group and s.status != STEP_DONE]
    if not moving:
        raise ValueError("Nothing in that part is left to do.")
    moving_ids = {s.step_id for s in moving}
    staying = [s for s in run.steps if s.step_id not in moving_ids and s.status != STEP_DONE]
    if not staying:
        raise ValueError(
            "That is all that is left of this task. Use Snooze to wait, or finish it."
        )
    run.steps = [s for s in run.steps if s.step_id not in moving_ids]
    events: list[Event] = []
    if not any(s.status in (STEP_ACTIVE, STEP_WAITING) for s in run.steps):
        upcoming = next((s for s in run.steps if s.status == STEP_PENDING), None)
        if upcoming is not None and _activate(upcoming, now):
            events.append(_step_event(EVENT_STEP_ACTIVE, run, upcoming, now))
    return moving, events


def park_time(when: str, at: str, now: datetime, tz: tzinfo) -> str | None:
    """When a parked part comes back: None (waits for the user), tomorrow 09:00, or a picked time.

    `at` is a local date and time like "2026-11-28T10:00". Raises ValueError for
    a time that is missing, unreadable or already past.
    """
    if when == PARK_ANY:
        return None
    if when == PARK_TOMORROW:
        day = now.astimezone(tz).date() + timedelta(days=1)
        return fmt_ts(datetime.combine(day, dtime(PARK_TOMORROW_HOUR, 0), tzinfo=tz))
    if when == PARK_AT:
        try:
            local = datetime.fromisoformat(str(at).strip())
        except ValueError as err:
            raise ValueError("Pick a date and a time.") from err
        due = local.replace(tzinfo=tz) if local.tzinfo is None else local
        if due <= now:
            raise ValueError("Pick a time that has not passed yet.")
        return fmt_ts(due)
    raise ValueError("Choose when it comes back.")


def parked_chore(
    run: Run, parent: Chore | None, group: str, steps: list[StepRun], next_due: str | None, now: datetime
) -> Chore:
    """The small task that holds a parked part. It starts by itself at `next_due`, if there is one."""
    parts = [
        Step(
            id=new_id(),
            title=s.title,
            wait_minutes=0 if index == 0 else s.wait_minutes,
            resolve=RESOLVE_AUTO if s.triggers else RESOLVE_MANUAL,
            triggers=[replace(t) for t in s.triggers],
            wait_for=[replace(t) for t in s.wait_for],
            size=s.size,
            group=group,
        )
        for index, s in enumerate(steps)
    ]
    return Chore(
        id=new_id(),
        name=f"{run.chore_name}: {group}"[:PARK_NAME_MAX],
        steps=parts,
        where=run.where,
        one_off=True,
        parked=True,
        next_due=next_due,
        created_at=fmt_ts(now),
        nudge_style=parent.nudge_style if parent else STYLE_ONE,
        ignore_quiet_hours=parent.ignore_quiet_hours if parent else False,
    )


def wake_steps(run: Run, now: datetime) -> list[Event]:
    """Turn waiting steps whose wait is over into active steps."""
    if run.status != RUN_ACTIVE:
        return []
    events: list[Event] = []
    for step in run.steps:
        if (
            step.status == STEP_WAITING
            and step.active_at
            and parse_ts(step.active_at) <= now
        ):
            _became_active(step)
            events.append(_step_event(EVENT_STEP_ACTIVE, run, step, now))
    return events


# --- triggers: finishing a step by itself ---------------------------------


def state_matches(t: Trigger, state: str | None) -> bool:
    """Whether an entity's current state satisfies a state trigger.

    Unavailable, unknown or missing never counts: a broken sensor must not
    finish a chore.
    """
    if state is None or state.strip().lower() in NO_STATE:
        return False
    if t.state:
        return state.strip().lower() == t.state.lower()
    try:
        value = float(state)
    except ValueError:
        return False
    if t.above is not None and not value > t.above:
        return False
    if t.below is not None and not value < t.below:
        return False
    return True


@dataclass
class TriggerWatch:
    """What Boopli has seen of one state trigger (kept in memory, not saved)."""

    seen: bool = False  # evaluated at least once
    blocked: bool = False  # "happens" mode: it was already true at the start
    since: datetime | None = None  # when it became (or was first seen) true


def advance_watch(
    t: Trigger,
    watch: TriggerWatch,
    matched: bool,
    now: datetime,
    last_changed: datetime | None = None,
) -> bool:
    """Feed the current reading of a state trigger. Return True once it is met.

    "happens": already being true when the step starts does not count; it has to
    turn false and then true again. "is": being true is enough, also at the start.
    With `for_minutes` it must stay true that long.
    """
    first = not watch.seen
    watch.seen = True
    if not matched:
        watch.since = None
        watch.blocked = False
        return False
    if watch.blocked:
        return False
    if watch.since is None:
        if first and t.mode == MODE_HAPPENS:
            watch.blocked = True
            return False
        if first and t.state and last_changed is not None and last_changed < now:
            watch.since = last_changed  # a state we can date: it has held since then
        else:
            watch.since = now
    return now >= watch.since + timedelta(minutes=t.for_minutes)


def watch_due(t: Trigger, watch: TriggerWatch) -> datetime | None:
    """When a true-but-not-yet-long-enough trigger will be met, so a timer can be set."""
    if t.for_minutes > 0 and watch.since is not None and not watch.blocked:
        return watch.since + timedelta(minutes=t.for_minutes)
    return None


def tag_matches(t: Trigger, tag_id: str) -> bool:
    return t.kind == TRIGGER_TAG and bool(t.tag_id) and t.tag_id == tag_id


def button_pressed(
    t: Trigger, old: str | None, new: str | None, event_type: str | None
) -> bool:
    """Whether a state change of a button or event entity is a press of this trigger.

    An event entity's state is the time of its last event, so every press changes
    it. Changes from or to unavailable and unknown are start-up noise, except the
    very first press, which goes from "unknown" to a time.
    """
    if t.kind != TRIGGER_BUTTON or old is None or new is None:
        return False
    if old == new or new.strip().lower() in NO_STATE:
        return False
    if old.strip().lower() == "unavailable":
        return False
    return not t.press or t.press == (event_type or "")


def trigger_reason(t: Trigger, name: str, state: str | None = None) -> str:
    """A short human sentence for what finished a step."""
    if t.kind == TRIGGER_TAG:
        return f"NFC tag {name or t.tag_id} scanned"
    if t.kind == TRIGGER_BUTTON:
        return f"{name or t.entity_id} pressed"
    name = name or t.entity_id
    if t.state:
        return f"{name} is {t.state}"
    parts = []
    if t.above is not None:
        parts.append(f"above {t.above:g}")
    if t.below is not None:
        parts.append(f"below {t.below:g}")
    return f"{name} {' and '.join(parts)}" + (f" ({state})" if state else "")


def due_action(
    chore: Chore, has_active_run: bool, now: datetime
) -> str | None:
    """Decide what a chore needs now: "start", "skip" or None.

    "skip" means the chore came due while its previous run is still going, so
    no second run is stacked on top of it.
    """
    if not chore.enabled or not chore.next_due:
        return None
    if parse_ts(chore.next_due) > now:
        return None
    return "skip" if has_active_run else "start"


def advance_after_due(chore: Chore, now: datetime, tz: tzinfo) -> None:
    """Move `next_due` forward after a run started (or was skipped).

    Scheduled chores keep their fixed schedule. "Every N days" and on-demand
    chores have no next due date until the run finishes.
    """
    if chore.repeat.type == REPEAT_SCHEDULE:
        due = compute_next_due(chore.repeat, now, tz)
        chore.next_due = fmt_ts(due) if due else None
    else:
        chore.next_due = None


def on_run_finished(chore: Chore, now: datetime, tz: tzinfo) -> bool:
    """Update the chore after its run finished. Return True to delete it."""
    if chore.one_off:
        return True
    if chore.repeat.type == REPEAT_EVERY_N_DAYS:
        due = compute_next_due(chore.repeat, now, tz)
        chore.next_due = fmt_ts(due) if due else None
    return False


# --- away mode ---------------------------------------------------------------


@dataclass
class Away:
    """Away mode: Boopli rests for a few days. Chores that keep going are not affected."""

    active: bool = False  # switched on (it may begin later, at `start`)
    start: str | None = None  # when it begins; None = it began when it was switched on
    until: str | None = None  # when it ends by itself; None = until it is switched off
    began_at: str | None = None  # when it really began (the pet's mood is frozen from then)

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Away:
        d = d or {}
        return cls(
            active=bool(d.get("active", False)),
            start=d.get("start"),
            until=d.get("until"),
            began_at=d.get("began_at"),
        )


def away_in_effect(away: Away, now: datetime) -> bool:
    """Whether away mode is on right now."""
    if not away.active:
        return False
    if away.start and parse_ts(away.start) > now:
        return False
    return not (away.until and parse_ts(away.until) <= now)


def _parse_local(text: str, tz: tzinfo) -> datetime | None:
    """A local date and time like "2026-11-28T10:00" (or empty) as an aware datetime."""
    text = (text or "").strip()
    if not text:
        return None
    try:
        value = datetime.fromisoformat(text)
    except ValueError as err:
        raise ValueError("The date and time could not be read.") from err
    if value.tzinfo is None:
        value = value.replace(tzinfo=tz)
    return value.astimezone(timezone.utc)


def set_away(start_text: str, until_text: str, now: datetime, tz: tzinfo) -> Away:
    """Switch away mode on, from `start_text` (empty = now) until `until_text` (empty = until switched off).

    Raises ValueError with a message the user can read when the dates do not make sense.
    """
    start = _parse_local(start_text, tz)
    until = _parse_local(until_text, tz)
    if until is not None and until <= now:
        raise ValueError("The end has to be in the future.")
    if start is not None and until is not None and until <= start:
        raise ValueError("It has to end after it starts.")
    if until is not None and (until - (start or now)) > timedelta(days=AWAY_MAX_DAYS):
        raise ValueError("Away mode can last at most 400 days.")
    if start is not None and start <= now:
        start = None  # it begins right away
    return Away(
        active=True,
        start=fmt_ts(start) if start else None,
        until=fmt_ts(until) if until else None,
    )


def advance_away(away: Away, now: datetime) -> str | None:
    """Notice that away mode began or ended. Returns "started", "ended" or None.

    "ended" is also returned when the end passed (the caller sends the pet and the
    chores back to normal and clears the state).
    """
    if not away.active:
        return None
    if away.until and parse_ts(away.until) <= now:
        return "ended"
    if not away.began_at and away_in_effect(away, now):
        away.began_at = fmt_ts(now)
        return "started"
    return None


def shifted_progress(progress: Progress, began_at: str | None, now: datetime) -> Progress:
    """The pet's progress with the days away not counted as days without activity.

    Anything done before away mode began counts as done `now - began_at` later (never
    later than now); things done while away are left alone.
    """
    if not began_at:
        return progress
    began = parse_ts(began_at)
    shift = now - began
    if shift <= timedelta(0):
        return progress

    def move(ts: str | None) -> str | None:
        if not ts:
            return ts
        moment = parse_ts(ts)
        return fmt_ts(min(now, moment + shift)) if moment <= began else ts

    return replace(
        progress,
        last_activity=move(progress.last_activity),
        started_at=move(progress.started_at) or progress.started_at,
    )


def return_from_away(
    away: Away,
    progress: Progress,
    frozen_runs: list[Run],
    chores: list[Chore],
    now: datetime,
    tz: tzinfo,
) -> None:
    """Back from away: the pet's mood carries on from where it was, the frozen runs nudge again
    one after the other, and recurring chores that came due while away start over from today
    (nothing is made up for). Set-aside parts and one-off tasks start now."""
    moved = shifted_progress(progress, away.began_at, now)
    progress.last_activity = moved.last_activity
    progress.started_at = moved.started_at
    for index, run in enumerate(sorted(frozen_runs, key=lambda r: r.started_at)):
        for step in run.steps:
            if step.status == STEP_ACTIVE:
                step.next_nudge_at = fmt_ts(now + timedelta(minutes=AWAY_STAGGER_MINUTES * index))
                step.snoozed_until = None
    for chore in chores:
        if chore.keeps_going or chore.parked or not chore.enabled or not chore.next_due:
            continue
        if parse_ts(chore.next_due) > now:
            continue
        if chore.repeat.type == REPEAT_SCHEDULE:
            due = compute_next_due(chore.repeat, now, tz)
            chore.next_due = fmt_ts(due) if due else None
        elif chore.repeat.type == REPEAT_EVERY_N_DAYS:
            due = compute_next_due(chore.repeat, now, tz)
            chore.next_due = fmt_ts(due) if due else None


def next_wakeup(
    chores: list[Chore],
    runs: list[Run],
    now: datetime,
    extra: list[datetime] | None = None,
) -> datetime | None:
    """Return the earliest moment something needs attention.

    `extra` holds additional moments, such as when a held-back nudge may go out.
    """
    moments: list[datetime] = list(extra or [])
    for run in runs:
        if run.status != RUN_ACTIVE:
            continue
        for step in run.steps:
            if step.status == STEP_WAITING and step.active_at:
                moments.append(parse_ts(step.active_at))
    for chore in chores:
        if chore.enabled and chore.next_due:
            moments.append(parse_ts(chore.next_due))
    return min(moments) if moments else None


# --- settings ------------------------------------------------------------


@dataclass
class LightCfg:
    """A light used for nudges."""

    entity_id: str
    mode: str = LIGHT_BLINK
    color: list[int] = field(default_factory=lambda: [255, 90, 0])
    blink_ms: int = BLINK_MS_DEFAULT  # how long the color stays on per blink
    repeats: int = REPEATS_DEFAULT  # how many blinks
    gap_ms: int = GAP_MS_DEFAULT  # pause between blinks, light back to normal
    start_at: int = 1  # used from this nudge number on

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> LightCfg:
        color = d.get("color") or [255, 90, 0]
        mode = str(d.get("mode", LIGHT_BLINK))
        if mode in LEGACY_LIGHT_MODES:
            mode = LIGHT_BLINK

        def number(key: str, default: int) -> int:
            return _int(d.get(key), default)

        return cls(
            entity_id=str(d.get("entity_id", "")).strip(),
            mode=mode,
            color=[int(c) for c in color][:3],
            blink_ms=number("blink_ms", BLINK_MS_DEFAULT),
            repeats=number("repeats", REPEATS_DEFAULT),
            gap_ms=number("gap_ms", GAP_MS_DEFAULT),
            start_at=number("start_at", 1),
        )

    def blink_seconds(self) -> float:
        """How long one full blink sequence takes."""
        return (self.repeats * self.blink_ms + (self.repeats - 1) * self.gap_ms) / 1000


@dataclass
class PhoneCfg:
    """A phone (a notify.mobile_app_* service) that receives nudges."""

    service: str  # without the "notify." prefix
    level: str = LEVEL_NORMAL
    start_at: int = 1  # used from this nudge number on

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> PhoneCfg:
        return cls(
            service=str(d.get("service", "")).strip(),
            level=str(d.get("level", LEVEL_NORMAL)),
            start_at=_int(d.get("start_at"), 1),
        )


def _int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@dataclass
class SoundCfg:
    """A sound a speaker plays: the cue (a ding) or the alarm."""

    enabled: bool = False
    kind: str = SOUND_ALEXA
    sound: str = ""  # an Alexa sound id, or a file path / media-source id / URL
    start_at: int = 1
    seconds: int = ALARM_SECONDS_DEFAULT  # alarm only: how long it keeps playing
    repeat_s: int = ALARM_REPEAT_DEFAULT  # alarm only: seconds between plays

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None, start_at: int) -> SoundCfg:
        d = d or {}
        return cls(
            enabled=bool(d.get("enabled", False)),
            kind=str(d.get("kind", SOUND_ALEXA)),
            sound=str(d.get("sound", "")).strip(),
            start_at=_int(d.get("start_at"), start_at),
            seconds=_int(d.get("seconds"), ALARM_SECONDS_DEFAULT),
            repeat_s=_int(d.get("repeat_s"), ALARM_REPEAT_DEFAULT),
        )


@dataclass
class SpeechCfg:
    """A spoken sentence on a speaker."""

    enabled: bool = False
    route: str = SPEECH_ALEXA_MEDIA
    # alexa_media: the notify service (alexa_media_xxx); alexa_devices: a notify
    # entity (notify.xxx_speak); tts: a tts entity (tts.xxx).
    target: str = ""
    announce: bool = False  # alexa_media only: announce (chime) instead of plain speech
    start_at: int = 2

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> SpeechCfg:
        d = d or {}
        return cls(
            enabled=bool(d.get("enabled", False)),
            route=str(d.get("route", SPEECH_ALEXA_MEDIA)),
            target=str(d.get("target", "")).strip(),
            announce=bool(d.get("announce", False)),
            start_at=_int(d.get("start_at"), 2),
        )


@dataclass
class SpeakerCfg:
    """A speaker (a media player) that can play a cue, speak, and sound an alarm."""

    entity_id: str
    cue: SoundCfg = field(
        default_factory=lambda: SoundCfg(sound=ALEXA_DING_SOUND, start_at=1)
    )
    speech: SpeechCfg = field(default_factory=SpeechCfg)
    alarm: SoundCfg = field(
        default_factory=lambda: SoundCfg(
            sound=ALEXA_ALARM_SOUND, start_at=4, kind=SOUND_ALEXA
        )
    )

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> SpeakerCfg:
        return cls(
            entity_id=str(d.get("entity_id", "")).strip(),
            cue=SoundCfg.from_dict(d.get("cue") or {"sound": ALEXA_DING_SOUND}, 1),
            speech=SpeechCfg.from_dict(d.get("speech")),
            alarm=SoundCfg.from_dict(d.get("alarm") or {"sound": ALEXA_ALARM_SOUND}, 4),
        )


@dataclass
class AlarmDeviceCfg:
    """A siren, switch or script that sounds the alarm for a while."""

    entity_id: str
    seconds: int = ALARM_SECONDS_DEFAULT
    start_at: int = 4

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> AlarmDeviceCfg:
        return cls(
            entity_id=str(d.get("entity_id", "")).strip(),
            seconds=_int(d.get("seconds"), ALARM_SECONDS_DEFAULT),
            start_at=_int(d.get("start_at"), 4),
        )


@dataclass
class QuietDay:
    """Nudges are allowed from `start` until `stop` on this weekday."""

    start: str
    stop: str


@dataclass
class QuietHours:
    """Per-weekday windows in which nudges may go out. Off by default.

    Days are keyed "0" (Monday) to "6" (Sunday). A missing day, or None, means
    no restriction that day. Outside a day's window it is quiet.
    """

    enabled: bool = False
    days: dict[str, QuietDay | None] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> QuietHours:
        d = d or {}
        days: dict[str, QuietDay | None] = {}
        for key, value in (d.get("days") or {}).items():
            if value is None:
                days[str(key)] = None
            else:
                days[str(key)] = QuietDay(
                    start=str(value.get("start", "")), stop=str(value.get("stop", ""))
                )
        return cls(enabled=bool(d.get("enabled", False)), days=days)

    def window(self, day: date) -> tuple[dtime, dtime] | None:
        entry = self.days.get(str(day.weekday()))
        if entry is None:
            return None
        return _parse_hhmm(entry.start), _parse_hhmm(entry.stop)


AI_PROMPT_MAX = 8000


@dataclass
class AiSettings:
    """Optional AI help: splitting tasks into small steps with the user's own agent."""

    enabled: bool = False  # off until the user switches it on
    entity_id: str = ""  # an ai_task entity; empty = Home Assistant's default agent
    photo_entity_id: str = ""  # optional agent that reads photos; empty = the agent above
    questions_prompt: str = ""  # empty = the built-in prompt
    steps_prompt: str = ""  # empty = the built-in prompt
    chat_room_prompt: str = ""  # the text to copy into your own chat, one room; empty = built-in
    chat_home_prompt: str = ""  # the same for the whole home; empty = built-in

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> AiSettings:
        d = d or {}
        return cls(
            enabled=bool(d.get("enabled", False)),
            entity_id=str(d.get("entity_id") or "").strip(),
            photo_entity_id=str(d.get("photo_entity_id") or "").strip(),
            questions_prompt=str(d.get("questions_prompt") or "").strip(),
            steps_prompt=str(d.get("steps_prompt") or "").strip(),
            chat_room_prompt=str(d.get("chat_room_prompt") or "").strip(),
            chat_home_prompt=str(d.get("chat_home_prompt") or "").strip(),
        )


@dataclass
class Settings:
    """Boopli's global settings."""

    lights: list[LightCfg] = field(default_factory=list)
    phones: list[PhoneCfg] = field(default_factory=list)
    speakers: list[SpeakerCfg] = field(default_factory=list)
    alarm_devices: list[AlarmDeviceCfg] = field(default_factory=list)
    speech_template: str = SPEECH_TEMPLATE_DEFAULT
    quiet_hours: QuietHours = field(default_factory=QuietHours)
    presence_entity: str = ""  # optional person entity
    snooze_minutes: int = 15
    default_style: str = STYLE_ONE
    pet_name: str = PET_NAME_DEFAULT
    ai: AiSettings = field(default_factory=AiSettings)
    question_wait_minutes: int = QUESTION_WAIT_DEFAULT  # how long the first nudge waits for the questions

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Settings:
        d = d or {}
        return cls(
            question_wait_minutes=int(d.get("question_wait_minutes", QUESTION_WAIT_DEFAULT) or QUESTION_WAIT_DEFAULT),
            ai=AiSettings.from_dict(d.get("ai")),
            lights=[LightCfg.from_dict(x) for x in d.get("lights", [])],
            phones=[PhoneCfg.from_dict(x) for x in d.get("phones", [])],
            speakers=[SpeakerCfg.from_dict(x) for x in d.get("speakers", [])],
            alarm_devices=[
                AlarmDeviceCfg.from_dict(x) for x in d.get("alarm_devices", [])
            ],
            speech_template=str(
                d.get("speech_template") or SPEECH_TEMPLATE_DEFAULT
            ).strip()
            or SPEECH_TEMPLATE_DEFAULT,
            quiet_hours=QuietHours.from_dict(d.get("quiet_hours")),
            presence_entity=str(d.get("presence_entity", "")).strip(),
            snooze_minutes=int(d.get("snooze_minutes", 15) or 15),
            default_style=str(d.get("default_style", STYLE_ONE)),
            pet_name=str(d.get("pet_name") or PET_NAME_DEFAULT).strip()
            or PET_NAME_DEFAULT,
        )


_START_AT_ERROR = f"'Starts at nudge' must be {START_AT_MIN} to {START_AT_MAX}."
_ALARM_SECONDS_ERROR = (
    f"An alarm must last {ALARM_SECONDS_MIN} to {ALARM_SECONDS_MAX} seconds."
)


def _validate_speaker(speaker: SpeakerCfg) -> str | None:
    if not speaker.entity_id.startswith("media_player."):
        return "A speaker must be a media player."
    for name, sound in (("cue", speaker.cue), ("alarm", speaker.alarm)):
        if not START_AT_MIN <= sound.start_at <= START_AT_MAX:
            return _START_AT_ERROR
        if sound.kind not in SOUND_KINDS:
            return f"Unknown {name} sound type."
        if sound.enabled and not sound.sound:
            return f"Choose the {name} sound for {speaker.entity_id}."
    if not ALARM_SECONDS_MIN <= speaker.alarm.seconds <= ALARM_SECONDS_MAX:
        return _ALARM_SECONDS_ERROR
    if not 0 <= speaker.alarm.repeat_s <= ALARM_REPEAT_MAX:
        return f"Alarm repeat must be 0 to {ALARM_REPEAT_MAX} seconds."
    speech = speaker.speech
    if not START_AT_MIN <= speech.start_at <= START_AT_MAX:
        return _START_AT_ERROR
    if speech.route not in SPEECH_ROUTES:
        return "Unknown way of speaking."
    if speech.enabled:
        if speech.route == SPEECH_ALEXA_DEVICES and not speech.target.startswith("notify."):
            return "Choose the Alexa notify entity (notify.…) for speech."
        if speech.route == SPEECH_TTS and not speech.target.startswith("tts."):
            return "Choose a TTS voice (tts.…) for speech."
        if speech.route == SPEECH_ALEXA_MEDIA and not speech.target:
            return "Choose the Alexa Media Player notify service for speech."
    return None


def validate_speaker_test(speaker: SpeakerCfg, level: str) -> str | None:
    """Check a speaker before testing one level (which need not be switched on)."""
    if level not in SPEAKER_LEVELS:
        return "Unknown speaker level."
    probe = speaker
    if level == SPEAKER_CUE:
        probe = replace(speaker, cue=replace(speaker.cue, enabled=True))
    elif level == SPEAKER_SPEECH:
        probe = replace(speaker, speech=replace(speaker.speech, enabled=True))
    else:
        probe = replace(speaker, alarm=replace(speaker.alarm, enabled=True))
    return _validate_speaker(probe)


def validate_settings(settings: Settings) -> str | None:
    """Return an error message, or None when the settings are valid."""
    for light in settings.lights:
        if not light.entity_id.startswith("light."):
            return "A light must be a light entity."
        if light.mode not in LIGHT_MODE_VALUES:
            return "Unknown light mode."
        if len(light.color) != 3 or any(not 0 <= c <= 255 for c in light.color):
            return "A light color needs three values from 0 to 255."
        if not BLINK_MS_MIN <= light.blink_ms <= BLINK_MS_MAX:
            return f"Blink length must be {BLINK_MS_MIN} to {BLINK_MS_MAX} milliseconds."
        if not GAP_MS_MIN <= light.gap_ms <= GAP_MS_MAX:
            return f"The pause between blinks must be {GAP_MS_MIN} to {GAP_MS_MAX} milliseconds."
        if not REPEATS_MIN <= light.repeats <= REPEATS_MAX:
            return f"A light can blink {REPEATS_MIN} to {REPEATS_MAX} times."
    for phone in settings.phones:
        if not phone.service or "." in phone.service:
            return "A phone must be a notify service name."
        if phone.level not in LEVEL_VALUES:
            return "Unknown phone notification level."
    for light in settings.lights:
        if not START_AT_MIN <= light.start_at <= START_AT_MAX:
            return _START_AT_ERROR
    for phone in settings.phones:
        if not START_AT_MIN <= phone.start_at <= START_AT_MAX:
            return _START_AT_ERROR
    for speaker in settings.speakers:
        error = _validate_speaker(speaker)
        if error:
            return error
    for device in settings.alarm_devices:
        if device.entity_id.split(".")[0] not in ALARM_DEVICE_DOMAINS or "." not in device.entity_id:
            return "An alarm device must be a siren, switch, input_boolean or script."
        if not ALARM_SECONDS_MIN <= device.seconds <= ALARM_SECONDS_MAX:
            return _ALARM_SECONDS_ERROR
        if not START_AT_MIN <= device.start_at <= START_AT_MAX:
            return _START_AT_ERROR
    if "{chore}" not in settings.speech_template and "{step}" not in settings.speech_template:
        return "The spoken sentence must contain {chore} or {step}."
    for key, day in settings.quiet_hours.days.items():
        if key not in {str(i) for i in range(7)}:
            return "Quiet hours days must be 0 (Monday) to 6 (Sunday)."
        if day is None:
            continue
        try:
            start, stop = _parse_hhmm(day.start), _parse_hhmm(day.stop)
        except (ValueError, IndexError):
            return "Quiet hours times must look like 07:30."
        if start >= stop:
            return "Nudges must start before they stop on the same day."
    if settings.presence_entity and "." not in settings.presence_entity:
        return "The presence source must be an entity id."
    if not 1 <= settings.snooze_minutes <= 720:
        return "Snooze must be between 1 minute and 12 hours."
    if not 5 <= settings.question_wait_minutes <= 720:
        return "The wait for the questions must be between 5 minutes and 12 hours."
    if settings.ai.entity_id and not settings.ai.entity_id.startswith("ai_task."):
        return "Pick an AI task agent, or leave it empty for the default."
    if settings.ai.photo_entity_id and not settings.ai.photo_entity_id.startswith("ai_task."):
        return "Pick an AI task agent for photos, or leave it empty to use the same agent."
    if (
        len(settings.ai.questions_prompt) > AI_PROMPT_MAX
        or len(settings.ai.steps_prompt) > AI_PROMPT_MAX
        or len(settings.ai.chat_room_prompt) > AI_PROMPT_MAX
        or len(settings.ai.chat_home_prompt) > AI_PROMPT_MAX
    ):
        return f"A prompt can have at most {AI_PROMPT_MAX} letters."
    if len(settings.pet_name) > PET_NAME_MAX:
        return f"The pet's name can have at most {PET_NAME_MAX} letters."
    if settings.default_style not in STYLE_VALUES:
        return "Unknown default nudge style."
    return None


# --- quiet hours ---------------------------------------------------------


def is_quiet(now: datetime, quiet: QuietHours, tz: tzinfo) -> bool:
    """Whether nudges are held back at this moment."""
    if not quiet.enabled:
        return False
    local = now.astimezone(tz)
    window = quiet.window(local.date())
    if window is None:
        return False
    start, stop = window
    return not (start <= local.time() < stop)


def quiet_ends(now: datetime, quiet: QuietHours, tz: tzinfo) -> datetime | None:
    """If it is quiet now, return when nudges may go out again, else None."""
    if not is_quiet(now, quiet, tz):
        return None
    local = now.astimezone(tz)
    today = local.date()
    window = quiet.window(today)
    if window is not None and local.time() < window[0]:
        return _at(today, window[0], tz).astimezone(timezone.utc)
    # Past today's window: the next allowed moment is tomorrow's start, or
    # midnight when tomorrow has no restriction.
    tomorrow = today + timedelta(days=1)
    window = quiet.window(tomorrow)
    start = window[0] if window is not None else dtime(0, 0)
    return _at(tomorrow, start, tz).astimezone(timezone.utc)


# --- nudges --------------------------------------------------------------


def next_gap(style: str, sent: int) -> int | None:
    """Minutes until the next nudge after `sent` nudges, or None for no more."""
    if style == STYLE_ESCALATING:
        index = sent - 1
        return ESCALATING_GAPS[index] if 0 <= index < len(ESCALATING_GAPS) else None
    if style == STYLE_PERSISTENT:
        return PERSISTENT_GAP
    return None  # quiet and one-nudge send nothing after the first


def channels_for(where: str, home: bool) -> str | None:
    """Which channels may be used, or None when nudging has to wait."""
    if home:
        return CHANNELS_ALL
    if where == WHERE_ANYWHERE:
        return CHANNELS_PHONE_ONLY
    return None  # a home-only chore waits until you are home


@dataclass
class NudgeDecision:
    """What to do about an active step right now."""

    action: str  # "send", "wait" or "none"
    channels: str = CHANNELS_ALL
    wake_at: datetime | None = None  # when to look again (None: wait for presence)


def decide_nudge(
    step: StepRun,
    where: str,
    style: str,
    ignore_quiet: bool,
    quiet: QuietHours,
    home: bool,
    now: datetime,
    tz: tzinfo,
) -> NudgeDecision:
    """Decide whether an active step should be nudged now."""
    if style == STYLE_QUIET or step.status != STEP_ACTIVE or not step.next_nudge_at:
        return NudgeDecision("none")
    due = parse_ts(step.next_nudge_at)
    if due > now:
        return NudgeDecision("wait", wake_at=due)
    channels = channels_for(where, home)
    if channels is None:
        return NudgeDecision("wait")  # a presence change wakes it
    if not ignore_quiet:
        end = quiet_ends(now, quiet, tz)
        if end is not None:
            return NudgeDecision("wait", wake_at=end)
    return NudgeDecision("send", channels)


def record_nudge(step: StepRun, style: str, now: datetime) -> None:
    """Remember that a nudge went out and schedule the next one."""
    step.nudge_count += 1
    step.snoozed_until = None
    gap = next_gap(style, step.nudge_count)
    step.next_nudge_at = fmt_ts(now + timedelta(minutes=gap)) if gap else None


def snooze_step(step: StepRun, minutes: int, now: datetime) -> bool:
    """Delay the next nudge. The step stays active. Returns False if not active."""
    if step.status != STEP_ACTIVE:
        return False
    when = fmt_ts(now + timedelta(minutes=minutes))
    step.next_nudge_at = when
    step.snoozed_until = when
    return True


# --- notification and light payloads -------------------------------------


def action_id(kind: str, run_id: str, step_id: str) -> str:
    """Build the id carried by a notification button."""
    return f"{kind}_{run_id}_{step_id}"


def parse_action(action: str) -> tuple[str, str, str] | None:
    """Split a button id into (kind, run_id, step_id), or None if not ours."""
    for kind in (ACTION_DONE, ACTION_SNOOZE, ACTION_ALL_STEPS):
        prefix = f"{kind}_"
        if action.startswith(prefix):
            parts = action[len(prefix) :].split("_")
            if len(parts) == 2 and all(parts):
                return kind, parts[0], parts[1]
    return None


def notification_tag(run_id: str, step_id: str) -> str:
    """One tag per step, so a new nudge replaces the old notification."""
    return f"boopli-{run_id}-{step_id}"


def phone_payload(
    level: str,
    run_id: str,
    step_id: str,
    title: str,
    message: str,
    snooze_minutes: int,
) -> dict[str, Any]:
    """Build the data for a notify.mobile_app_* call."""
    data: dict[str, Any] = {
        "tag": notification_tag(run_id, step_id),
        "actions": [
            {"action": action_id(ACTION_DONE, run_id, step_id), "title": "Done"},
            {
                "action": action_id(ACTION_SNOOZE, run_id, step_id),
                "title": f"Snooze {snooze_minutes} min",
            },
        ],
    }
    if level == LEVEL_HIGH:
        data.update(
            channel="Boopli high priority", importance="high", priority="high", ttl=0
        )
    elif level == LEVEL_ALARM:
        data.update(channel="alarm_stream", priority="high", ttl=0)
    elif level == LEVEL_ALARM_MAX:
        data.update(channel="alarm_stream_max", priority="high", ttl=0)
    return {"title": title, "message": message, "data": data}


PANEL_PATH = "/boopli"  # where Boopli lives inside Home Assistant (the app opens it from a button)


def questions_payload(run_id: str, chore_name: str, count: int) -> dict[str, Any]:
    """The phone notification for a chore that started by itself and has questions to answer.

    "Start with all steps" starts it as it is; "Answer the questions" opens Boopli in
    the Home Assistant app. The chore itself is already running either way.
    """
    many = "questions" if count != 1 else "question"
    return {
        "title": chore_name,
        "message": f"Quick look first: {count} {many} about what needs doing.",
        "data": {
            "tag": notification_tag(run_id, QUESTIONS_STEP),
            "clickAction": PANEL_PATH,
            "actions": [
                {
                    "action": action_id(ACTION_ALL_STEPS, run_id, QUESTIONS_STEP),
                    "title": "Start with all steps",
                },
                {"action": "URI", "title": "Answer the questions", "uri": PANEL_PATH},
            ],
        },
    }


def _color_data(color_modes: list[str], color: list[int]) -> dict[str, Any]:
    if any(m in color_modes for m in ("rgb", "rgbw", "rgbww", "xy")):
        return {"rgb_color": list(color)}
    if "hs" in color_modes:
        hue, sat, _ = colorsys.rgb_to_hsv(*(c / 255 for c in color))
        return {"hs_color": [round(hue * 360, 1), round(sat * 100, 1)]}
    return {}


def _has_color(color_modes: list[str]) -> bool:
    return any(m in color_modes for m in ("rgb", "rgbw", "rgbww", "xy", "hs"))


def _color_light_data(color_modes: list[str], color: list[int]) -> dict[str, Any]:
    data = _color_data(color_modes, color)
    if color_modes and set(color_modes) != {"onoff"}:
        data["brightness"] = 255
    return data


def light_plan(mode: str, color_modes: list[str], color: list[int]) -> dict[str, Any]:
    """The `light.turn_on` data for an indicator lamp (on in a color until done).

    Blinking is planned step by step with `blink_alert` and `restore_plan`.
    """
    return {"mode": mode, "data": _color_light_data(color_modes, color)}


def blink_alert(
    color_modes: list[str], color: list[int], was_on: bool
) -> tuple[str, dict[str, Any]]:
    """What one blink does to a light: (service, data) for the light domain.

    A light with color shows the color. A light without color goes dark when it
    was on, or lights up when it was off, so the blink is visible either way.
    """
    if _has_color(color_modes):
        return "turn_on", _color_light_data(color_modes, color)
    if was_on:
        return "turn_off", {}
    data: dict[str, Any] = {}
    if color_modes and set(color_modes) != {"onoff"}:
        data["brightness"] = 255
    return "turn_on", data


_COLOR_ATTRIBUTE = {
    "color_temp": "color_temp_kelvin",
    "hs": "hs_color",
    "rgb": "rgb_color",
    "rgbw": "rgbw_color",
    "rgbww": "rgbww_color",
    "xy": "xy_color",
}


def restore_plan(state: str, attrs: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    """How to put a light back as it was: (service, data) for the light domain."""
    if state != "on":
        return "turn_off", {}
    data: dict[str, Any] = {}
    if attrs.get("brightness") is not None:
        data["brightness"] = attrs["brightness"]
    attribute = _COLOR_ATTRIBUTE.get(str(attrs.get("color_mode") or ""))
    if attribute and attrs.get(attribute) is not None:
        data[attribute] = list(attrs[attribute]) if isinstance(attrs[attribute], (list, tuple)) else attrs[attribute]
    return "turn_on", data


# --- speakers and alarm devices ------------------------------------------


def reached(start_at: int, number: int) -> bool:
    """Whether a channel set to start at nudge `start_at` is used at nudge `number`."""
    return start_at <= number


def speaker_level(speaker: SpeakerCfg, number: int) -> str | None:
    """The one level a speaker plays at this nudge: the highest enabled one reached."""
    level = None
    for name, cfg in (
        (SPEAKER_CUE, speaker.cue),
        (SPEAKER_SPEECH, speaker.speech),
        (SPEAKER_ALARM, speaker.alarm),
    ):
        if cfg.enabled and reached(cfg.start_at, number):
            level = name
    return level


def speech_text(template: str, chore: str, step: str) -> str:
    """The sentence to speak. {chore} and {step} are filled in."""
    return template.replace("{chore}", chore).replace("{step}", step)


def sound_play_data(kind: str, sound: str) -> dict[str, str]:
    """`media_player.play_media` data for an Alexa sound or a file.

    A bare file path such as "boopli/ding.mp3" means a file in Home Assistant's
    media folder. A media-source id, a /local path or a URL is used as given.
    """
    sound = sound.strip()
    if kind == SOUND_ALEXA:
        return {"media_content_id": sound, "media_content_type": "sound"}
    if not (
        sound.startswith(("media-source://", "http://", "https://", "/"))
    ):
        sound = "media-source://media_source/local/" + sound.lstrip("/")
    return {"media_content_id": sound, "media_content_type": "music"}


def speech_call(
    speaker: SpeakerCfg, text: str
) -> tuple[str, str, dict[str, Any]]:
    """How to speak `text` on a speaker: (domain, service, data)."""
    cfg = speaker.speech
    if cfg.route == SPEECH_ALEXA_MEDIA:
        service = cfg.target.removeprefix("notify.")
        return (
            "notify",
            service,
            {"message": text, "data": {"type": "announce" if cfg.announce else "tts"}},
        )
    if cfg.route == SPEECH_ALEXA_DEVICES:
        return "notify", "send_message", {"entity_id": cfg.target, "message": text}
    return (
        "tts",
        "speak",
        {
            "entity_id": cfg.target,
            "media_player_entity_id": speaker.entity_id,
            "message": text,
        },
    )


def alarm_plays(seconds: int, repeat_s: int) -> int:
    """How many times an alarm sound is played in `seconds` seconds."""
    if repeat_s <= 0:
        return 1
    return max(1, -(-seconds // repeat_s))  # round up


def device_alarm_call(entity_id: str, on: bool) -> tuple[str, str, dict[str, Any]]:
    """The service call that switches an alarm device on or off."""
    domain = entity_id.split(".")[0]
    service = "turn_on" if on else "turn_off"
    if domain == "script" and not on:
        service = "turn_off"  # stops a running script
    return domain, service, {"entity_id": entity_id}
