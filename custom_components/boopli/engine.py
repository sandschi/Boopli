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
import re
import uuid
import zlib
from dataclasses import asdict, dataclass, field, replace
from datetime import date, datetime, time as dtime, timedelta, timezone, tzinfo
from collections.abc import Iterable
from typing import Any
from urllib.parse import quote


def message_key(template: str) -> str:
    """The key of a message template in the panel's language files: a readable start plus a short fingerprint."""
    words = re.sub(r"\{\w+\}", " ", template.lower())
    words = re.sub(r"[^a-z0-9]+", " ", words).split()
    head = "_".join(words[:7])[:48] or "message"
    return f"{head}_{zlib.crc32(template.encode()) & 0xFFFF:04x}"


class Msg(str):
    """An English message that remembers its template and its values, so the panel can show it in another language."""

    template: str
    params: dict[str, Any]

    def __new__(cls, template: str, **params: Any) -> Msg:
        text = template.format(**params) if params else template
        obj = super().__new__(cls, text)
        obj.template = template
        obj.params = params
        return obj


def as_msg(text: str) -> Msg:
    """A reason that is already a Msg stays one; a plain text becomes one, so it can still be looked up by its text."""
    return text if isinstance(text, Msg) else Msg(text)


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
EVENT_STEP_ON_IT = "step_on_it"
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
# What a ladder can pick for a speaker at one nudge, besides the three levels above:
SPEAKER_SPEECH_CHIME = "speech_chime"  # speech as an Alexa announcement, which starts with a chime
SPEAKER_SOUND_PREFIX = "sound:"  # "sound:<id>": one of your own sounds (the shared list in the settings)
EXTRA_SOUNDS_MAX = 60  # your own sounds, one list for all speakers
EXTRA_SOUND_NAME_MAX = 30

SOUND_ALEXA = "alexa"  # one of Amazon's built-in sounds, by id
SOUND_FILE = "file"  # a file in Home Assistant's media folder, or a URL
SOUND_BUNDLED = "bundled"  # a sound that comes with Boopli ("ding" or "alarm"), served by Home Assistant
SOUND_KINDS = (SOUND_ALEXA, SOUND_FILE, SOUND_BUNDLED)
BUNDLED_SOUNDS = ("ding", "alarm")
BUNDLED_SOUND_URL = "/boopli_static/sounds/{sound}.mp3"  # under const.STATIC_URL

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
BUNDLED_SOUNDS_BY_LEVEL = {"cue": "ding", "alarm": "alarm"}  # which of Boopli's sounds each level starts with

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

# Blubs, XP and the pet. Rewards only: nothing here ever takes Blubs, XP or a level away.
# Finishing steps earns Blubs; feeding the pet (food bought with Blubs) earns XP.
EVENT_XP_GAINED = "xp_gained"  # the pet was fed
EVENT_BLUBS_EARNED = "blubs_earned"  # a step was finished
EVENT_ACHIEVEMENT_UNLOCKED = "achievement_unlocked"  # an achievement was reached (once each)
XP_STEP = 10  # Blubs for every step finished (small; see SIZE_XP for the others)
XP_CHORE = 20  # extra Blubs, for the step that finishes the chore
XP_QUICK = 5  # extra Blubs, for a step finished within QUICK_MINUTES of its turn
QUICK_MINUTES = 10
XP_RUNS_PER_DAY = 3  # runs of one chore that earn Blubs per day
PROGRESS_DAYS_KEPT = 7  # how long the per-day bookkeeping is kept
BLUBS_START = 30  # every household gets these once
MEALS_PER_DAY = 3  # after this many meals the pet is full (upgrades raise it)
ECONOMY_VERSION = 1  # progress saved before Blubs existed has no marker and starts over
LEVEL_QUEST = 10  # the starter quest ends here (one calm pop-up)
LEVEL_STEP_START = 110  # XP from level 10 to 11; each step after is LEVEL_STEP_GROWTH dearer...
LEVEL_STEP_GROWTH = 1.06
LEVEL_STEP_FLAT = 200  # ...until level 20, from where every level costs this much (no maximum level)
PET_NAME_DEFAULT = "Boopli"
PET_NAME_MAX = 30
PET_KINDS = ("bear", "cat", "dog", "fox", "slime")  # the pets to choose from
ACCENT_RE = re.compile(r"^#[0-9a-fA-F]{6}$")  # the panel's accent colour as "#RRGGBB"; empty means the pet's own
PET_KIND_DEFAULT = "slime"  # the first one with real animated art

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
ACTION_ON_IT = "BOOPLI_ONIT"  # "On it" / "Still on it": I am doing this step now
ACTION_NOT_ON_IT = "BOOPLI_NOTONIT"  # taken back: not working on it after all
CHECK_IN_DEFAULT = 30  # minutes until Boopli asks "still on it?"
ON_IT_COLOR = "#2e7d32"  # the green of a notification for a step that is in progress
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
    image: str = ""  # a picture for the phone notification: "camera.x" or a file in the media folder

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Step:
        triggers = [Trigger.from_dict(t) for t in d.get("triggers") or []]
        size = str(d.get("size", SIZE_SMALL))
        return cls(
            image=str(d.get("image") or "").strip(),
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
    light_color: list[int] | None = None  # the color of the lights for this chore (None: the lights' own)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Chore:
        return cls(
            light_color=_color(d.get("light_color")),
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
    on_it_since: str | None = None  # "On it": when the person said they are doing this step
    on_it_until: str | None = None  # while it is in progress: when Boopli checks in
    image: str = ""  # snapshot from the chore: the picture for the phone notification

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> StepRun:
        size = str(d.get("size", SIZE_SMALL))
        return cls(
            image=str(d.get("image") or ""),
            on_it_since=d.get("on_it_since"),
            on_it_until=d.get("on_it_until"),
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
        return Msg("At most {max_rooms} rooms.", max_rooms=MAX_ROOMS)
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
    """The household's pet: Blubs (the money), XP and level, and what the household owns.

    Blubs, XP and what is owned only ever go up, except that Blubs are spent in the shop.
    """

    total_xp: int = 0
    blubs: int = 0
    started_at: str = ""  # when the pet first appeared
    last_activity: str | None = None  # the last time a step was finished
    # local date -> chore id -> ids of the runs that earned Blubs that day
    credited: dict[str, dict[str, list[str]]] = field(default_factory=dict)
    egg_found: bool = False  # the Easter egg gave its one-time gift
    food: dict[str, int] = field(default_factory=dict)  # food size -> how many are in the inventory
    fed: dict[str, int] = field(default_factory=dict)  # local date -> meals that day
    owned: list[str] = field(default_factory=list)  # ids of the shop items bought
    placed: dict[str, str] = field(default_factory=dict)  # room place ("wall", "floor") -> item id
    achievements: list[str] = field(default_factory=list)  # ids of the achievements reached (never removed)
    stats: dict[str, int] = field(default_factory=dict)  # what the household has done so far: STAT_* -> how often
    streak: int = 0  # days in a row with a finished step, up to streak_day
    streak_best: int = 0  # the longest streak so far (a broken streak costs nothing: this stays)
    streak_day: str = ""  # the local date the streak was last counted
    gift_given: bool = False  # the BLUBS_START were handed out
    quest_seen: bool = False  # the one-time pop-up at LEVEL_QUEST was shown
    economy: int = ECONOMY_VERSION

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Progress:
        d = d or {}
        if d and "economy" not in d:
            d = reset_progress_data(d)
        return cls(
            egg_found=bool(d.get("egg_found", False)),
            total_xp=max(0, int(d.get("total_xp", 0) or 0)),
            blubs=max(0, int(d.get("blubs", 0) or 0)),
            started_at=str(d.get("started_at", "")),
            last_activity=d.get("last_activity"),
            credited={
                str(day): {str(c): [str(r) for r in runs] for c, runs in chores.items()}
                for day, chores in (d.get("credited") or {}).items()
            },
            food={str(k): max(0, int(v or 0)) for k, v in (d.get("food") or {}).items() if k in FOOD},
            fed={str(k): max(0, int(v or 0)) for k, v in (d.get("fed") or {}).items()},
            owned=[str(x) for x in (d.get("owned") or [])],
            placed={str(k): str(v) for k, v in (d.get("placed") or {}).items() if k in ROOM_PLACES and v},
            achievements=[str(x) for x in (d.get("achievements") or [])],
            stats={str(k): max(0, int(v or 0)) for k, v in (d.get("stats") or {}).items()},
            streak=max(0, int(d.get("streak", 0) or 0)),
            streak_best=max(0, int(d.get("streak_best", 0) or 0)),
            streak_day=str(d.get("streak_day", "") or ""),
            gift_given=bool(d.get("gift_given", False)),
            quest_seen=bool(d.get("quest_seen", False)),
        )


def reset_progress_data(d: dict[str, Any]) -> dict[str, Any]:
    """Progress saved before Blubs existed, started over: XP, level and everything else are gone.

    Only when the pet first appeared and when it was last active are kept, so its mood stays. Used once
    for the saved data (the store version) and for a backup file made before Blubs.
    """
    return {
        "started_at": str(d.get("started_at", "")),
        "last_activity": d.get("last_activity"),
        "economy": ECONOMY_VERSION,
    }


@dataclass
class Award:
    """What finishing a step gave."""

    blubs: int
    total_blubs: int
    woke_up: bool  # the pet was sad or hibernating until now
    mood: str


@dataclass
class Feeding:
    """What a meal gave."""

    xp: int
    total_xp: int
    level: int
    level_up: bool
    meals_today: int


def level_step(level: int) -> int:
    """XP from `level` to the next one, for level 10 and up: 6 % dearer each time, then flat from level 20."""
    if level >= 20:
        return LEVEL_STEP_FLAT
    return round(LEVEL_STEP_START * LEVEL_STEP_GROWTH ** (level - LEVEL_QUEST))


def level_threshold(level: int) -> int:
    """Total XP needed to reach `level`: level 2 at 20, level 10 at 540, then slower, no maximum level."""
    if level <= 1:
        return 0
    if level <= LEVEL_QUEST:
        return 5 * (level - 1) * (level + 2)
    return level_threshold(LEVEL_QUEST) + sum(level_step(n) for n in range(LEVEL_QUEST, level))


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
    """Give Blubs for a finished step and note the activity.

    A step is worth 10, 15 or 20 Blubs for small, medium or big. Per chore and day
    only the first XP_RUNS_PER_DAY runs earn Blubs, so running a chore over and
    over cannot be farmed. Finishing still wakes the pet up.
    """
    mood_before = mood_for(progress, now, tz)

    today = now.astimezone(tz).date()
    runs = progress.credited.setdefault(today.isoformat(), {}).setdefault(chore_id, [])
    blubs = 0
    if run_id in runs or len(runs) < XP_RUNS_PER_DAY:
        if run_id not in runs:
            runs.append(run_id)
        blubs = SIZE_XP.get(size, XP_STEP) + (XP_CHORE if chore_done else 0)
        if active_at and now - parse_ts(active_at) <= timedelta(minutes=QUICK_MINUTES):
            blubs += XP_QUICK
        # what earns Blubs also counts for the achievements (so running a chore over and over cannot farm them either)
        count_stat(progress, STAT_STEP_DONE)
        if chore_done:
            count_stat(progress, STAT_CHORE_DONE)
        note_streak(progress, today)

    progress.blubs += blubs
    progress.last_activity = fmt_ts(now)
    cutoff = (today - timedelta(days=PROGRESS_DAYS_KEPT)).isoformat()
    progress.credited = {d: c for d, c in progress.credited.items() if d >= cutoff}
    progress.fed = {d: n for d, n in progress.fed.items() if d >= cutoff}

    return Award(
        blubs=blubs,
        total_blubs=progress.blubs,
        woke_up=mood_before in (MOOD_SAD, MOOD_HIBERNATING),
        mood=mood_for(progress, now, tz),
    )


EGG_BLUBS = 10  # the one-time gift for finding the Easter egg


def award_egg(progress: Progress, now: datetime, tz: tzinfo) -> Award:
    """Give the Easter egg's gift: EGG_BLUBS the first time it is found, nothing afterwards.

    It is not chore work, so it does not wake the pet and does not count as activity.
    """
    blubs = 0
    if not progress.egg_found:
        progress.egg_found = True
        count_stat(progress, STAT_EGG_FOUND)
        blubs = EGG_BLUBS
        progress.blubs += blubs
    return Award(
        blubs=blubs,
        total_blubs=progress.blubs,
        woke_up=False,
        mood=mood_for(progress, now, tz),
    )


def hand_out_start_gift(progress: Progress) -> bool:
    """Give the household its BLUBS_START once. True when it was given just now."""
    if progress.gift_given:
        return False
    progress.gift_given = True
    progress.blubs += BLUBS_START
    return True


# --- achievements -----------------------------------------------------------------------------------
#
# Calm by design: an achievement is only ever reached, never lost, and nothing is taken away or
# counted down. The household's doings are counted (STAT_*, plus the streak and the level), and an
# achievement is reached when one of those counts gets to its target. What an achievement unlocks (a
# shop item, later things like gold) hangs on it from the other side: `ShopItem.achievement`.

STAT_STEP_DONE = "step_done"  # steps finished that earned Blubs
STAT_CHORE_DONE = "chore_done"  # chores finished (the last step of a run) that earned Blubs
STAT_FED = "fed"  # meals given to the pet
STAT_EGG_FOUND = "egg_found"  # the Easter egg (once)
STAT_STREAK = "streak"  # the longest run of days in a row with a finished step
STAT_LEVEL = "level"  # the pet's level
STATS_COUNTED = (STAT_STEP_DONE, STAT_CHORE_DONE, STAT_FED, STAT_EGG_FOUND)
STATS_ALL = (*STATS_COUNTED, STAT_STREAK, STAT_LEVEL)


@dataclass(frozen=True)
class Achievement:
    """One thing to reach: `stat` gets to `target`. The ids are what the shop and the panel refer to."""

    id: str
    stat: str
    target: int


# The achievements themselves come with the base content (the engine is what is here).
ACHIEVEMENTS: tuple[Achievement, ...] = ()


def count_stat(progress: Progress, stat: str, n: int = 1) -> None:
    """Count `n` more of something the household did."""
    progress.stats[stat] = progress.stats.get(stat, 0) + n


def note_streak(progress: Progress, today: date) -> None:
    """A step was finished today: carry on the streak (yesterday also had one), or start a new one at 1.

    A day without a step ends the streak, nothing more: the best streak stays.
    """
    day = today.isoformat()
    if progress.streak_day == day:
        return
    yesterday = (today - timedelta(days=1)).isoformat()
    progress.streak = progress.streak + 1 if progress.streak_day == yesterday else 1
    progress.streak_day = day
    progress.streak_best = max(progress.streak_best, progress.streak)


def stat_value(progress: Progress, stat: str) -> int:
    """How far the household is on one of the STATS_ALL."""
    if stat == STAT_STREAK:
        return progress.streak_best
    if stat == STAT_LEVEL:
        return level_for(progress.total_xp)[0]
    return progress.stats.get(stat, 0)


def reach_achievements(progress: Progress) -> list[Achievement]:
    """Mark every achievement whose target is reached and return the ones reached just now (in order)."""
    reached = []
    for a in ACHIEVEMENTS:
        if a.id not in progress.achievements and stat_value(progress, a.stat) >= a.target:
            progress.achievements.append(a.id)
            reached.append(a)
    return reached


# --- the shop, the inventory and feeding --------------------------------------------------------

KIND_EXTRA = "extra"  # stands in the room once bought (bowl, bed)
KIND_COLOR = "color"  # a colour for the wall or the floor
KIND_PATTERN = "pattern"  # a pattern for the wall or the floor
KIND_FOOD = "food"  # bought again and again, kept as a stock, fed to the pet
KIND_UPGRADE = "upgrade"  # works as soon as it is bought (see EFFECT_MEALS)
ITEM_KINDS = (KIND_EXTRA, KIND_COLOR, KIND_PATTERN, KIND_FOOD, KIND_UPGRADE)
ROOM_PLACES = ("wall", "floor")  # where a colour or a pattern can be put
EFFECT_MEALS = "meals"  # one more meal per day before the pet is full

# Food sizes: what it costs in Blubs and what it gives in XP.
FOOD_SMALL = "small"
FOOD_MEDIUM = "medium"
FOOD_BIG = "big"
FOOD: dict[str, tuple[int, int]] = {FOOD_SMALL: (10, 5), FOOD_MEDIUM: (25, 15), FOOD_BIG: (50, 30)}


@dataclass(frozen=True)
class ShopItem:
    """One thing in the shop. A new item is one more row in SHOP_ITEMS (and its name and picture in the panel).

    The achievement hook is there from the start: an item with an achievement stays locked until the
    household has reached it (the achievement engine itself comes later).
    """

    id: str
    kind: str
    price: int
    min_level: int = 1
    achievement: str = ""  # an achievement that unlocks it ("" = none needed)
    effect: str = ""  # what it does once bought, for upgrades (EFFECT_MEALS)
    effect_value: int = 0
    attach_to: str = ""  # an item this one sits on (a gem on the bowl); it can only be bought and shown with it
    requires: str = ""  # an item to buy first (the 5th meal needs the 4th)
    species: str = ""  # only for this pet kind ("" = every pet)
    food: str = ""  # for food: its size


SHOP_ITEMS: tuple[ShopItem, ...] = (
    ShopItem("water_bowl", KIND_EXTRA, 30, min_level=1),
    ShopItem("food_bowl", KIND_EXTRA, 40, min_level=2),
    ShopItem("bed", KIND_EXTRA, 80, min_level=3),
    ShopItem("color_sky", KIND_COLOR, 20),
    ShopItem("pattern_dots", KIND_PATTERN, 20),
    ShopItem("meal_4", KIND_UPGRADE, 300, min_level=5, effect=EFFECT_MEALS, effect_value=1),
    ShopItem("meal_5", KIND_UPGRADE, 800, min_level=10, effect=EFFECT_MEALS, effect_value=1, requires="meal_4"),
    ShopItem("food_small", KIND_FOOD, FOOD[FOOD_SMALL][0], food=FOOD_SMALL),
    ShopItem("food_medium", KIND_FOOD, FOOD[FOOD_MEDIUM][0], food=FOOD_MEDIUM),
    ShopItem("food_big", KIND_FOOD, FOOD[FOOD_BIG][0], food=FOOD_BIG),
)
SHOP_BY_ID = {item.id: item for item in SHOP_ITEMS}


class ShopError(ValueError):
    """Something the shop, the inventory or feeding cannot do. args[0] is a Msg (words for the user)."""


def item_locked(progress: Progress, item: ShopItem, level: int, kind: str = "") -> str:
    """Why the household cannot buy `item` yet: "level", "achievement", "requires", "species", or "" when it can."""
    if item.species and kind and item.species != kind:
        return "species"
    if level < item.min_level:
        return "level"
    if item.achievement and item.achievement not in progress.achievements:
        return "achievement"
    if item.requires and item.requires not in progress.owned:
        return "requires"
    if item.attach_to and item.attach_to not in progress.owned:
        return "requires"
    return ""


def meals_allowed(progress: Progress) -> int:
    """How many meals the pet eats per day before it is full: MEALS_PER_DAY and what upgrades added."""
    extra = sum(
        SHOP_BY_ID[i].effect_value for i in progress.owned if i in SHOP_BY_ID and SHOP_BY_ID[i].effect == EFFECT_MEALS
    )
    return MEALS_PER_DAY + extra


def meals_today(progress: Progress, now: datetime, tz: tzinfo) -> int:
    return progress.fed.get(now.astimezone(tz).date().isoformat(), 0)


def buy_item(progress: Progress, item_id: str, level: int, kind: str = "") -> ShopItem:
    """Pay for an item: food goes into the stock, anything else is owned from now on. Raises ShopError."""
    item = SHOP_BY_ID.get(item_id)
    if item is None:
        raise ShopError(Msg("That item is not in the shop."))
    if item.kind != KIND_FOOD and item.id in progress.owned:
        raise ShopError(Msg("You already have that."))
    reason = item_locked(progress, item, level, kind)
    if reason == "species":
        raise ShopError(Msg("That item is for another pet."))
    if reason == "level":
        raise ShopError(Msg("That item needs level {level}.", level=item.min_level))
    if reason == "achievement":
        raise ShopError(Msg("That item is not unlocked yet."))
    if reason == "requires":
        raise ShopError(Msg("Buy what it needs first."))
    if progress.blubs < item.price:
        raise ShopError(Msg("You need {blubs} Blubs for that.", blubs=item.price))
    progress.blubs -= item.price
    if item.kind == KIND_FOOD:
        progress.food[item.food] = progress.food.get(item.food, 0) + 1
    else:
        progress.owned.append(item.id)
    return item


def place_item(progress: Progress, place: str, item_id: str) -> None:
    """Put an owned colour or pattern on the wall or the floor, or empty the place with "". Raises ShopError."""
    if place not in ROOM_PLACES:
        raise ShopError(Msg("That is not a place in the room."))
    if not item_id:
        progress.placed.pop(place, None)
        return
    item = SHOP_BY_ID.get(item_id)
    if item is None or item.id not in progress.owned or item.kind not in (KIND_COLOR, KIND_PATTERN):
        raise ShopError(Msg("You cannot put that in the room."))
    progress.placed[place] = item.id


def feed_pet(progress: Progress, size: str, now: datetime, tz: tzinfo) -> Feeding:
    """Feed the pet one meal from the stock: the food is used up and its XP is gained. Raises ShopError.

    A full pet (all meals of the day eaten) takes nothing: no XP, and the food stays in the inventory.
    """
    if size not in FOOD:
        raise ShopError(Msg("That is not food."))
    if progress.food.get(size, 0) <= 0:
        raise ShopError(Msg("You have no food of that size."))
    day = now.astimezone(tz).date().isoformat()
    if progress.fed.get(day, 0) >= meals_allowed(progress):
        raise ShopError(Msg("The pet is full for today."))
    level_before = level_for(progress.total_xp)[0]
    progress.food[size] -= 1
    if progress.food[size] <= 0:
        del progress.food[size]
    progress.fed[day] = progress.fed.get(day, 0) + 1
    count_stat(progress, STAT_FED)
    xp = FOOD[size][1]
    progress.total_xp += xp
    level = level_for(progress.total_xp)[0]
    return Feeding(
        xp=xp,
        total_xp=progress.total_xp,
        level=level,
        level_up=level > level_before,
        meals_today=progress.fed[day],
    )


# --- validation ----------------------------------------------------------


def validate_trigger(t: Trigger) -> str | None:
    """Return an error message, or None when the trigger is valid."""
    if t.kind not in TRIGGER_KINDS:
        return "Choose a supported condition type."
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
        return "Enter a state or a number limit for this condition."
    if t.state and (t.above is not None or t.below is not None):
        return "Use either a state or a number, not both."
    if t.above is not None and t.below is not None and t.above >= t.below:
        return "For a range, set “Above” to the lower number and “Below” to the higher number."
    if not 0 <= t.for_minutes <= FOR_MINUTES_MAX:
        return "Enter how long the condition must stay true, from 0 minutes to 24 hours."
    return None


PICTURE_MAX = 120
# Only what phones show in a notification: the companion apps list JPEG, PNG and GIF.
PICTURE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif")
_CAMERA_RE = re.compile(r"^camera\.[a-z0-9_]+$")
_PICTURE_FILE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 _.()\-]*(/[A-Za-z0-9][A-Za-z0-9 _.()\-]*)*$")


def is_camera(image: str) -> bool:
    """Whether a picture is a camera. A name that ends like a picture file ("camera.png") is a file."""
    return bool(_CAMERA_RE.match(image)) and not image.lower().endswith(PICTURE_EXTENSIONS)


def validate_picture(image: str) -> str | None:
    """Return an error message, or None. Empty is fine (no picture).

    A picture is a camera ("camera.front_door") or a file in the media folder
    ("boopli/pills.jpg"). Never a web address, and never a way out of the folder.
    """
    if not image:
        return None
    if len(image) > PICTURE_MAX:
        return Msg("An image file path can have up to {picture_max} characters.", picture_max=PICTURE_MAX)
    if is_camera(image):
        return None
    if (
        ".." in image
        or not _PICTURE_FILE_RE.match(image)
        or not image.lower().endswith(PICTURE_EXTENSIONS)
    ):
        return "Choose a camera or a JPEG (.jpg or .jpeg), PNG or GIF file in the media folder."
    return None


def picture_data(image: str, media_id: str = "local") -> dict[str, Any]:
    """The notification data that makes the phone show the picture (empty when there is none).

    A camera: a fresh snapshot (Android reads `image`, iOS reads `entity_id`).
    A file: the media folder, which needs a login, unlike the public www folder.
    """
    if not image:
        return {}
    if is_camera(image):
        return {"image": f"/api/camera_proxy/{image}", "entity_id": image}
    return {"image": f"/media/{media_id}/{quote(image)}"}


def validate_chore(chore: Chore, ladder_ids: Iterable[str] = ()) -> str | None:
    """Return an error message, or None when the chore is valid."""
    if not chore.name:
        return "A chore needs a name."
    if not chore.steps:
        return "A chore needs at least one step."
    if len(chore.steps) > MAX_STEPS:
        return Msg("A chore can have at most {max_steps} steps.", max_steps=MAX_STEPS)
    if len(chore.questions) > MAX_QUESTIONS:
        return Msg("A chore can ask at most {max_questions} questions.", max_questions=MAX_QUESTIONS)
    question_ids: set[str] = set()
    for question in chore.questions:
        if not question.text:
            return "Every question needs some text."
        if len(question.text) > QUESTION_MAX:
            return Msg("A question can have up to {question_max} characters.", question_max=QUESTION_MAX)
        if question.id in question_ids:
            return "Two questions have the same id."
        question_ids.add(question.id)
    step_ids: set[str] = set()
    for step in chore.steps:
        if step.id in step_ids:
            return "Two steps have the same id."
        step_ids.add(step.id)
        if step.only_if and step.only_if not in question_ids:
            return Msg("Step '{title}' points to a question that does not exist.", title=step.title)
        if not step.title:
            return "Every step needs a title."
        error = validate_picture(step.image)
        if error:
            return Msg("Step '{title}': {error}", title=step.title, error=as_msg(error))
        if not 0 <= step.wait_minutes <= MAX_WAIT_MINUTES:
            return "A wait must be between 0 minutes and 7 days."
        if step.size not in SIZE_VALUES:
            return "A step is small, medium or big."
        if len(step.title) > STEP_TITLE_MAX:
            return Msg("A step title can have up to {step_title_max} characters.", step_title_max=STEP_TITLE_MAX)
        if len(step.wait_for) > MAX_TRIGGERS:
            return Msg("A step can have up to {max_triggers} wait conditions.", max_triggers=MAX_TRIGGERS)
        for trigger in step.wait_for:
            error = validate_trigger(trigger)
            if error:
                return Msg("Step '{title}' (wait until): {error}", title=step.title, error=as_msg(error))
        if len(step.triggers) > MAX_TRIGGERS:
            return Msg("A step can have up to {max_triggers} conditions for finishing automatically.", max_triggers=MAX_TRIGGERS)
        for trigger in step.triggers:
            error = validate_trigger(trigger)
            if error:
                return Msg("Step '{title}': {error}", title=step.title, error=as_msg(error))
    if chore.where not in WHERE_VALUES:
        return "Where must be 'home' or 'anywhere'."
    if chore.light_color is not None and (len(chore.light_color) != 3 or any(not 0 <= c <= 255 for c in chore.light_color)):
        return "A light color needs three values from 0 to 255."
    if chore.nudge_style not in STYLE_VALUES and chore.nudge_style not in {
        ladder_style(i) for i in ladder_ids
    }:
        return "Unknown nudge style."
    if chore.next_due not in (None, ""):
        try:
            if parse_ts(chore.next_due).tzinfo is None:
                return "The next due time needs a time zone."
        except (TypeError, ValueError):
            return "The next due time cannot be read."
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
            return "Enter 1 to 365 days after the chore is finished."
    if rep.type == REPEAT_SCHEDULE:
        if not rep.days:
            return "Pick at least one day and a time."
        for key, times in rep.days.items():
            if key not in {str(i) for i in range(7)}:
                return "Days must be 0 (Monday) to 6 (Sunday)."
            if not 1 <= len(times) <= MAX_TIMES_PER_DAY:
                return Msg("A day can have 1 to {max_times_per_day} times.", max_times_per_day=MAX_TIMES_PER_DAY)
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
    step.on_it_since = None
    step.on_it_until = None


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
                image=s.image,
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
            image=s.image,  # a part set aside keeps its pictures
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
        light_color=parent.light_color if parent else None,
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


def skip_round(chore: Chore, has_run: bool, now: datetime, tz: tzinfo) -> None:
    """The user chose to skip this round of a chore: no XP, no streak, no penalty.

    With a run in progress the caller drops that run, and the chore goes on with its next round
    (a schedule already points at it; "every N days" counts from today). With no run, the coming
    round is skipped: the chore moves on to the one after it. One-off tasks, set-aside parts and
    on-demand chores have no rounds, so they raise ValueError (the caller words the message).
    """
    if chore.one_off or chore.parked or chore.repeat.type not in (REPEAT_SCHEDULE, REPEAT_EVERY_N_DAYS):
        raise ValueError("no rounds")
    if has_run:
        if chore.repeat.type == REPEAT_EVERY_N_DAYS:
            due = compute_next_due(chore.repeat, now, tz)
            chore.next_due = fmt_ts(due) if due else None
        return  # a schedule already points at the next round
    if not chore.enabled or not chore.next_due:
        raise ValueError("no next round")  # switched off: nothing is coming
    due = compute_next_due(chore.repeat, parse_ts(chore.next_due), tz)
    chore.next_due = fmt_ts(due) if due else None


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
                if step.on_it_until:  # in progress: the check-in is what comes next, show its real time
                    step.on_it_until = step.next_nudge_at
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
class ExtraSound:
    """A named sound effect of a speaker, for ladders (the speaker's ding and alarm stay as they are)."""

    id: str = ""
    name: str = ""
    kind: str = SOUND_ALEXA
    sound: str = ""  # an Alexa sound id, or a file path / media-source id / URL

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> ExtraSound:
        return cls(
            id=str(d.get("id") or "").strip() or new_id(),
            name=str(d.get("name") or "").strip(),
            kind=str(d.get("kind", SOUND_ALEXA)),
            sound=str(d.get("sound") or "").strip(),
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
    # Older settings kept your own sounds here, one list per speaker. They are one shared list in the
    # settings now (`Settings.sounds`); this is only read, and moved there when the settings are loaded.
    sounds: list[ExtraSound] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> SpeakerCfg:
        extra = d.get("sounds")
        speaker = cls(
            sounds=[ExtraSound.from_dict(x) for x in extra if isinstance(x, dict)] if isinstance(extra, list) else [],
            entity_id=str(d.get("entity_id", "")).strip(),
            cue=SoundCfg.from_dict(d.get("cue") or {"sound": ALEXA_DING_SOUND}, 1),
            speech=SpeechCfg.from_dict(d.get("speech")),
            alarm=SoundCfg.from_dict(d.get("alarm") or {"sound": ALEXA_ALARM_SOUND}, 4),
        )
        if speaker.speech.route == SPEECH_TTS:
            # Another media player cannot play Amazon's sounds, so one that has no sound yet gets Boopli's own.
            for name in BUNDLED_SOUNDS_BY_LEVEL:
                tone = getattr(speaker, name)
                if not tone.sound or tone.kind == SOUND_ALEXA:
                    setattr(speaker, name, replace(tone, kind=SOUND_BUNDLED, sound=BUNDLED_SOUNDS_BY_LEVEL[name]))
        return speaker


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
    # "Ask Claude": an extra next to the agent above, through the user's own Claude routine.
    # The routine's token is a secret and is NOT here (see manager: its own storage key).
    claude_enabled: bool = False
    claude_fire_url: str = ""  # https://api.anthropic.com/v1/claude_code/routines/trig_…/fire
    claude_ha_url: str = ""  # where the routine posts back; empty = Home Assistant's external URL

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> AiSettings:
        d = d or {}
        return cls(
            claude_enabled=bool(d.get("claude_enabled", False)),
            claude_fire_url=str(d.get("claude_fire_url") or "").strip(),
            claude_ha_url=str(d.get("claude_ha_url") or "").strip(),
            enabled=bool(d.get("enabled", False)),
            entity_id=str(d.get("entity_id") or "").strip(),
            photo_entity_id=str(d.get("photo_entity_id") or "").strip(),
            questions_prompt=str(d.get("questions_prompt") or "").strip(),
            steps_prompt=str(d.get("steps_prompt") or "").strip(),
            chat_room_prompt=str(d.get("chat_room_prompt") or "").strip(),
            chat_home_prompt=str(d.get("chat_home_prompt") or "").strip(),
        )


# --- your own nudge ladders ("Nudge it your way") -------------------------------
#
# A built-in style sends every device from the nudge number the device is set to start at.
# A ladder of your own says it per nudge instead: how long to wait for each nudge, and
# exactly which devices act (and how loud), so "no lights at nudge 2" is possible.

LADDER_PREFIX = "ladder:"  # a chore's nudge style "ladder:<id>" points at one of your ladders
LADDER_MAX = 30
LADDER_MAX_NUDGES = 12
LADDER_GAP_MIN, LADDER_GAP_MAX = 1, 720  # minutes
LADDER_GAP_DEFAULT = 5
LADDER_NAME_MAX = 40


def _text_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(x).strip() for x in value if str(x).strip()]


def _text_map(value: Any) -> dict[str, str]:
    if not isinstance(value, dict):
        return {}
    return {str(k).strip(): str(v).strip() for k, v in value.items() if str(k).strip()}


def _color(value: Any) -> list[int] | None:
    """An [r, g, b] list, or None when it is missing or not three numbers."""
    if not isinstance(value, (list, tuple)) or len(value) != 3:
        return None
    try:
        return [int(c) for c in value]
    except (TypeError, ValueError):
        return None


LIGHT_OWN_MODE = ""  # the light's own mode (blink or indicator), as set in its settings


@dataclass
class RungLight:
    """What one light does at one nudge: blink, or stay on as a status light; maybe another color."""

    mode: str = LIGHT_BLINK
    color: list[int] | None = None  # used when the chore has no color of its own; none: the light's own

    @classmethod
    def from_dict(cls, d: Any) -> RungLight:
        if isinstance(d, dict):
            mode = d.get("mode")
            return cls(mode=mode if mode in (LIGHT_OWN_MODE, LIGHT_BLINK, LIGHT_INDICATOR) else LIGHT_BLINK, color=_color(d.get("color")))
        return cls(mode=str(d) if isinstance(d, str) else LIGHT_BLINK)


def _rung_lights(value: Any) -> dict[str, RungLight]:
    """The lights of a nudge. An older list of entity ids means "the light's own mode"."""
    if isinstance(value, list):
        return {e: RungLight(mode=LIGHT_OWN_MODE) for e in _text_list(value)}
    if isinstance(value, dict):
        return {str(k).strip(): RungLight.from_dict(v) for k, v in value.items() if str(k).strip()}
    return {}


@dataclass
class Rung:
    """One nudge of a ladder."""

    gap: int = LADDER_GAP_DEFAULT  # minutes after the previous nudge (the first goes out at once)
    phones: dict[str, str] = field(default_factory=dict)  # phone service -> notification level
    lights: dict[str, RungLight] = field(default_factory=dict)  # light entity id -> what it does
    speakers: dict[str, str] = field(default_factory=dict)  # speaker entity id -> level, speech_chime or sound:<id>
    alarms: list[str] = field(default_factory=list)  # alarm device entity ids

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Rung:
        return cls(
            gap=_int(d.get("gap"), LADDER_GAP_DEFAULT),
            phones=_text_map(d.get("phones")),
            lights=_rung_lights(d.get("lights")),
            speakers=_text_map(d.get("speakers")),
            alarms=_text_list(d.get("alarms")),
        )


@dataclass
class Ladder:
    """A named list of nudges. After the last one it stops, or repeats the last one."""

    id: str = ""
    name: str = ""
    rungs: list[Rung] = field(default_factory=list)
    repeat_last: bool = False

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Ladder:
        rungs = d.get("rungs")
        return cls(
            id=str(d.get("id") or "").strip() or new_id(),
            name=str(d.get("name") or "").strip(),
            rungs=[Rung.from_dict(r) for r in rungs if isinstance(r, dict)] if isinstance(rungs, list) else [],
            repeat_last=bool(d.get("repeat_last", False)),
        )


def ladder_style(ladder_id: str) -> str:
    """The nudge style value that points at a ladder."""
    return f"{LADDER_PREFIX}{ladder_id}"


def find_ladder(style: str, ladders: list[Ladder]) -> Ladder | None:
    """The ladder a style points at, or None (a built-in style, or a ladder that is gone)."""
    if not style.startswith(LADDER_PREFIX):
        return None
    wanted = style[len(LADDER_PREFIX):]
    return next((ladder for ladder in ladders if ladder.id == wanted), None)


def style_known(style: str, ladders: list[Ladder]) -> bool:
    """Whether a nudge style is a built-in one or one of your ladders."""
    return style in STYLE_VALUES or find_ladder(style, ladders) is not None


def chores_using(ladder_id: str, chores: Iterable[Chore]) -> list[str]:
    """The names of the chores that use a ladder, in alphabetical order."""
    style = ladder_style(ladder_id)
    return sorted(chore.name for chore in chores if chore.nudge_style == style)


def rung_for(ladder: Ladder, number: int) -> Rung | None:
    """The rung that nudge number `number` (1, 2, 3, ...) uses, or None when the ladder is over."""
    if number < 1 or not ladder.rungs:
        return None
    if number <= len(ladder.rungs):
        return ladder.rungs[number - 1]
    return ladder.rungs[-1] if ladder.repeat_last else None


# --- the standard ladders --------------------------------------------------------
#
# "One nudge", "Escalating" and "Persistent" used to be built in: which device acted when was spread
# over the settings of every device ("starts at nudge"). They are ordinary ladders now, the first three
# in the list, that you change in one place like your own. The first time older settings are loaded the
# three are made from what the devices said, so nudging stays exactly as it was.

STANDARD_LADDERS = {
    STYLE_ONE: ("standard_one", "One nudge"),
    STYLE_ESCALATING: ("standard_escalating", "Escalating"),
    STYLE_PERSISTENT: ("standard_persistent", "Persistent"),
}


def normalize_style(style: str, ladders: list[Ladder]) -> str:
    """A built-in style value (older settings, a template, an import) as the standard ladder that replaced it."""
    entry = STANDARD_LADDERS.get(style)
    if entry and any(ladder.id == entry[0] for ladder in ladders):
        return ladder_style(entry[0])
    return style


def _speaker_choice_at(speaker: SpeakerCfg, number: int) -> str | None:
    """What a speaker plays at this nudge: its highest level that is switched on and reached."""
    level = speaker_level(speaker, number)
    if level == SPEAKER_SPEECH and speaker.speech.announce and speaker.speech.route == SPEECH_ALEXA_MEDIA:
        return SPEAKER_SPEECH_CHIME
    return level


def standard_rungs(
    style: str,
    phones: Iterable[PhoneCfg],
    lights: Iterable[LightCfg],
    speakers: Iterable[SpeakerCfg],
    alarms: Iterable[AlarmDeviceCfg],
) -> list[Rung]:
    """The nudges of a standard style, with the devices given acting where their "starts at nudge" says."""
    phones, lights, speakers, alarms = list(phones), list(lights), list(speakers), list(alarms)
    if style == STYLE_ONE:
        gaps: list[int] = []
    elif style == STYLE_ESCALATING:
        gaps = list(ESCALATING_GAPS)
    else:  # persistent: as many nudges as the devices need, the last one then repeats
        starts = [p.start_at for p in phones] + [x.start_at for x in lights] + [a.start_at for a in alarms]
        starts += [c.start_at for s in speakers for c in (s.cue, s.speech, s.alarm)]
        gaps = [PERSISTENT_GAP] * (max(1, min(LADDER_MAX_NUDGES, max(starts, default=1))) - 1)
    rungs: list[Rung] = []
    for number in range(1, len(gaps) + 2):
        first = PERSISTENT_GAP if style == STYLE_PERSISTENT else LADDER_GAP_DEFAULT  # a repeating last nudge waits this long
        rung = Rung(gap=first if number == 1 else gaps[number - 2])
        for phone in phones:
            if reached(phone.start_at, number):
                rung.phones[phone.service] = phone.level
        for light in lights:
            if reached(light.start_at, number):
                rung.lights[light.entity_id] = RungLight(mode=LIGHT_OWN_MODE)
        for speaker in speakers:
            choice = _speaker_choice_at(speaker, number)
            if choice:
                rung.speakers[speaker.entity_id] = choice
        for alarm in alarms:
            if reached(alarm.start_at, number):
                rung.alarms.append(alarm.entity_id)
        rungs.append(rung)
    return rungs


def seed_standard_ladders(settings: Settings) -> None:
    """Make the three standard ladders from the devices (once) and point the default style at its ladder."""
    ids = {ladder.id for ladder in settings.ladders}
    names = {ladder.name.casefold() for ladder in settings.ladders}
    made: list[Ladder] = []
    for style, (ladder_id, name) in STANDARD_LADDERS.items():
        if ladder_id in ids:
            continue
        unique, n = name, 1
        while unique.casefold() in names:
            n += 1
            unique = f"{name} (standard)" if n == 2 else f"{name} (standard {n - 1})"
        names.add(unique.casefold())
        rungs = standard_rungs(style, settings.phones, settings.lights, settings.speakers, settings.alarm_devices)
        made.append(Ladder(id=ladder_id, name=unique, rungs=rungs, repeat_last=style == STYLE_PERSISTENT))
    settings.ladders[:0] = made
    settings.default_style = normalize_style(settings.default_style, settings.ladders)
    settings.standard_done = True


STANDARD_LADDER_IDS = frozenset(ladder_id for ladder_id, _name in STANDARD_LADDERS.values())


def deleted_standard_ladder(old: Settings, new: Settings) -> str | None:
    """The name of a standard ladder (One nudge, Escalating, Persistent) that `new` lacks but `old` has: they cannot be deleted."""
    kept = {ladder.id for ladder in new.ladders}
    return next((l.name for l in old.ladders if l.id in STANDARD_LADDER_IDS and l.id not in kept), None)


def drop_removed_devices_from_ladders(settings: Settings) -> bool:
    """Take the devices that are not set up (any more) out of every nudge. Returns whether anything changed.

    Removing a speaker, light, phone or alarm device in the settings used to leave it in the nudge
    sequences as "not set up any more", with no way to remove it from there.
    """
    phones = {p.service for p in settings.phones}
    lights = {x.entity_id for x in settings.lights}
    speakers = {s.entity_id for s in settings.speakers}
    alarms = {a.entity_id for a in settings.alarm_devices}
    changed = False
    for ladder in settings.ladders:
        for rung in ladder.rungs:
            for devices, known in ((rung.phones, phones), (rung.lights, lights), (rung.speakers, speakers)):
                for key in [k for k in devices if k not in known]:
                    del devices[key]
                    changed = True
            kept = [a for a in rung.alarms if a in alarms]
            if len(kept) != len(rung.alarms):
                rung.alarms[:] = kept
                changed = True
    return changed


def sync_phone_levels_to_standard_ladders(old: Settings, new: Settings) -> None:
    """A phone whose level was changed in the settings uses the new level in the standard ladders too."""
    changed = {
        p.service: p.level for p in new.phones if any(o.service == p.service and o.level != p.level for o in old.phones)
    }
    if not changed:
        return
    for ladder in new.ladders:
        if ladder.id not in STANDARD_LADDER_IDS:
            continue
        for rung in ladder.rungs:
            for service, level in changed.items():
                if service in rung.phones:
                    rung.phones[service] = level


def add_new_devices_to_standard_ladders(old: Settings, new: Settings) -> None:
    """Devices added in `new` act in the standard ladders the way their "starts at nudge" says (the old behaviour)."""
    phones = [p for p in new.phones if all(o.service != p.service for o in old.phones)]
    lights = [x for x in new.lights if all(o.entity_id != x.entity_id for o in old.lights)]
    speakers = [s for s in new.speakers if all(o.entity_id != s.entity_id for o in old.speakers)]
    alarms = [a for a in new.alarm_devices if all(o.entity_id != a.entity_id for o in old.alarm_devices)]
    if not (phones or lights or speakers or alarms):
        return
    for style, (ladder_id, _name) in STANDARD_LADDERS.items():
        ladder = next((x for x in new.ladders if x.id == ladder_id), None)
        if ladder is None:
            continue
        extra = standard_rungs(style, phones, lights, speakers, alarms)
        if style == STYLE_PERSISTENT:  # a device with a later "starts at nudge" needs the ladder to be that long
            while ladder.rungs and len(ladder.rungs) < len(extra):
                last = ladder.rungs[-1]
                ladder.rungs.append(
                    Rung(gap=PERSISTENT_GAP, phones=dict(last.phones), lights=dict(last.lights), speakers=dict(last.speakers), alarms=list(last.alarms))
                )
        pairs = list(zip(ladder.rungs, extra))
        if style == STYLE_PERSISTENT and extra:  # the last nudge repeats, so the new devices keep acting in the rungs after it
            pairs += [(rung, extra[-1]) for rung in ladder.rungs[len(extra):]]
        for rung, add in pairs:
            rung.phones.update(add.phones)
            rung.lights.update(add.lights)
            rung.speakers.update(add.speakers)
            rung.alarms.extend(a for a in add.alarms if a not in rung.alarms)


# --- the wall board --------------------------------------------------------------
#
# A board is a grid of tiles for a screen on the wall. You can have several (a "wall" one and a
# "desk" one). A board is a fixed grid of square cells (16 by 9 by default, the shape of a screen) that is
# scaled to fit the display. Each tile has a type (clock, pet, ...), a place and size on the grid (column x,
# row y, w columns wide, h rows tall, counted from 0) and a few options. The options of
# every type are listed in TILE_OPTIONS, which is what checks them (and what the editor shows).

BOARD_MAX = 10
BOARD_TILES_MAX = 30
BOARD_NAME_MAX = 40
BOARD_COLUMNS_MIN, BOARD_COLUMNS_MAX, BOARD_COLUMNS_DEFAULT = 2, 32, 16
BOARD_ROWS_MIN, BOARD_ROWS_MAX, BOARD_ROWS_DEFAULT = 2, 18, 9
BOARD_NAME_DEFAULT = "Wall"
NIGHT_DIM, NIGHT_BLACK, NIGHT_OFF = "dim", "black", "off"  # at night: dim, fully black, or change nothing
NIGHT_VALUES = (NIGHT_DIM, NIGHT_BLACK, NIGHT_OFF)
# Boards saved before tiles had a place had a named size; these become the size on the grid.
LEGACY_TILE_SIZES = {"small": (1, 1), "wide": (2, 1), "tall": (1, 2), "big": (2, 2)}
TILE_TEXT_MAX = 300
RETIRED_TILE_TYPES = ("away",)  # tiles that no longer exist; boards that still have one lose it (away mode is a bar now)

# type -> option -> (kind, default, extra). Kinds: choice (extra: the choices), int (extra: min, max),
# bool, text (extra: the longest), entity (extra: the allowed domains, or None for any).
TILE_OPTIONS: dict[str, dict[str, tuple[str, Any, Any]]] = {
    "clock": {"format": ("choice", "24h", ("24h", "12h")), "date": ("bool", True, None)},
    "pet": {},
    "due_now": {},
    "coming_up": {"count": ("int", 3, (1, 10))},
    "entity": {
        "entity_id": ("entity", "", None),
        "name": ("text", "", BOARD_NAME_MAX),
        "tap": ("choice", "toggle", ("toggle", "none")),
    },
    "weather": {"entity_id": ("entity", "", ("weather",))},
    "calendar": {"entity_id": ("entity", "", ("calendar",)), "count": ("int", 4, (1, 10))},
    "camera": {"entity_id": ("entity", "", ("camera",)), "refresh_s": ("int", 10, (5, 300))},
    "note": {"text": ("text", "", TILE_TEXT_MAX), "big": ("bool", False, None)},
}


def _tile_option(kind: str, default: Any, value: Any) -> Any:
    if kind == "int":
        return _int(value, default)
    if kind == "bool":
        return bool(value) if value is not None else default
    if value is None:
        return default
    return str(value).strip() if kind in ("text", "entity") else str(value)


@dataclass
class Tile:
    """One tile of a board."""

    id: str = ""
    type: str = ""
    x: int = -1  # -1: not placed yet (see place_tiles)
    y: int = -1
    w: int = 1
    h: int = 1
    options: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Tile:
        tile_type = str(d.get("type") or "")
        spec = TILE_OPTIONS.get(tile_type, {})
        given = d.get("options") if isinstance(d.get("options"), dict) else {}
        legacy_w, legacy_h = LEGACY_TILE_SIZES.get(str(d.get("size") or ""), (1, 1))
        placed = d.get("x") is not None and d.get("y") is not None
        return cls(
            id=str(d.get("id") or "").strip() or new_id(),
            type=tile_type,
            x=_int(d.get("x"), -1) if placed else -1,
            y=_int(d.get("y"), -1) if placed else -1,
            w=_int(d.get("w"), legacy_w),
            h=_int(d.get("h"), legacy_h),
            options={key: _tile_option(kind, default, given.get(key)) for key, (kind, default, _) in spec.items()},
        )


def tiles_overlap(a: Tile, b: Tile) -> bool:
    return a.x < b.x + b.w and b.x < a.x + a.w and a.y < b.y + b.h and b.y < a.y + a.h


def place_tiles(tiles: list[Tile], columns: int) -> None:
    """Give a place to every tile that has none (boards from before tiles had a place): the first free
    spot reading left to right, top to bottom, in the order of the list."""
    placed = [t for t in tiles if t.x >= 0 and t.y >= 0]
    for tile in tiles:
        if tile.x >= 0 and tile.y >= 0:
            continue
        tile.w = max(1, min(tile.w, columns))
        tile.h = max(1, min(tile.h, BOARD_ROWS_MAX))
        tile.x, tile.y = 0, BOARD_ROWS_MAX  # no room: the check reports it
        for y in range(BOARD_ROWS_MAX):
            spot = next(
                (
                    x
                    for x in range(columns - tile.w + 1)
                    if not any(tiles_overlap(Tile(x=x, y=y, w=tile.w, h=tile.h), p) for p in placed)
                ),
                None,
            )
            if spot is not None:
                tile.x, tile.y = spot, y
                break
        placed.append(tile)


@dataclass
class Board:
    """A named wall board."""

    id: str = ""
    name: str = ""
    columns: int = BOARD_COLUMNS_DEFAULT
    rows: int = BOARD_ROWS_DEFAULT
    night: str = NIGHT_DIM
    tiles: list[Tile] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Board:
        tiles = d.get("tiles")
        board = cls(
            id=str(d.get("id") or "").strip() or new_id(),
            name=str(d.get("name") or "").strip(),
            columns=_int(d.get("columns"), BOARD_COLUMNS_DEFAULT),
            rows=_int(d.get("rows"), 0),
            night=str(d.get("night") or NIGHT_DIM),
            tiles=[
                Tile.from_dict(t)
                for t in tiles
                if isinstance(t, dict) and t.get("type") not in RETIRED_TILE_TYPES
            ]
            if isinstance(tiles, list)
            else [],
        )
        if BOARD_COLUMNS_MIN <= board.columns <= BOARD_COLUMNS_MAX:
            place_tiles(board.tiles, board.columns)
        if board.rows <= 0:  # a board from before rows: as many as its tiles reach
            board.rows = max(BOARD_ROWS_MIN, max((t.y + t.h for t in board.tiles), default=0))
        return board


def default_board() -> Board:
    """The board everybody starts with: the clock, the pet, what is due now and what is coming."""
    places = (
        ("due_now", 0, 0, 8, 5),
        ("pet", 8, 0, 8, 5),
        ("clock", 0, 5, 5, 4),
        ("coming_up", 5, 5, 11, 4),
    )
    return Board(
        id=new_id(),
        name=BOARD_NAME_DEFAULT,
        columns=BOARD_COLUMNS_DEFAULT,
        rows=BOARD_ROWS_DEFAULT,
        tiles=[Tile.from_dict({"type": t, "x": x, "y": y, "w": w, "h": h}) for t, x, y, w, h in places],
    )


def validate_boards(boards: list[Board]) -> str | None:
    """Check the boards: how many, the names, the tiles, their sizes and their options."""
    if not 1 <= len(boards) <= BOARD_MAX:
        return Msg("Keep between 1 and {board_max} wall boards.", board_max=BOARD_MAX)
    ids: set[str] = set()
    names: set[str] = set()
    for board in boards:
        if board.id in ids:
            return "Two wall boards have the same ID."
        ids.add(board.id)
        if not board.name:
            return "Give each wall board a name."
        if len(board.name) > BOARD_NAME_MAX:
            return Msg("A wall board name can have up to {board_name_max} characters.", board_name_max=BOARD_NAME_MAX)
        if board.name.casefold() in names:
            return Msg("Two wall boards are named “{name}.” Give them different names.", name=board.name)
        names.add(board.name.casefold())
        if not BOARD_COLUMNS_MIN <= board.columns <= BOARD_COLUMNS_MAX:
            return Msg("'{name}': the columns must be {board_columns_min} to {board_columns_max}.", name=board.name, board_columns_min=BOARD_COLUMNS_MIN, board_columns_max=BOARD_COLUMNS_MAX)
        if not BOARD_ROWS_MIN <= board.rows <= BOARD_ROWS_MAX:
            return Msg("'{name}': the rows must be {board_rows_min} to {board_rows_max}.", name=board.name, board_rows_min=BOARD_ROWS_MIN, board_rows_max=BOARD_ROWS_MAX)
        if board.night not in NIGHT_VALUES:
            return Msg("'{name}': unknown night setting.", name=board.name)
        if len(board.tiles) > BOARD_TILES_MAX:
            return Msg("'{name}' can have at most {board_tiles_max} tiles.", name=board.name, board_tiles_max=BOARD_TILES_MAX)
        tile_ids: set[str] = set()
        for i, tile in enumerate(board.tiles):
            if tile.id in tile_ids:
                return Msg("'{name}' has two tiles with the same id.", name=board.name)
            tile_ids.add(tile.id)
            if tile.x >= 0 and any(tiles_overlap(tile, other) for other in board.tiles[:i]):
                return Msg("'{name}': two tiles are on the same spot.", name=board.name)
            spec = TILE_OPTIONS.get(tile.type)
            if spec is None:
                return Msg("'{name}': unknown tile type '{type}'.", name=board.name, type=tile.type)
            if not 1 <= tile.w <= board.columns or not 1 <= tile.h <= board.rows:
                return Msg("'{name}': a {type} tile has a size that does not fit the board.", name=board.name, type=tile.type)
            if tile.x < 0 or tile.y < 0 or tile.x + tile.w > board.columns or tile.y + tile.h > board.rows:
                return Msg("'{name}': a {type} tile is outside the board.", name=board.name, type=tile.type)
            for key, (kind, _default, extra) in spec.items():
                value = tile.options.get(key)
                if kind == "choice" and value not in extra:
                    return Msg("'{name}': a {type} tile has an unknown {key}.", name=board.name, type=tile.type, key=key)
                if kind == "int" and not extra[0] <= value <= extra[1]:
                    return Msg("'{name}': a {type} tile's {key} must be {extra} to {extra2}.", name=board.name, type=tile.type, key=key, extra=extra[0], extra2=extra[1])
                if kind == "text" and len(value) > extra:
                    return Msg("On “{name},” the {key} field for this tile (type: {type}) can have up to {extra} characters.", name=board.name, type=tile.type, key=key, extra=extra)
                if kind == "entity":
                    domain, _, rest = value.partition(".")
                    if tile.type != "entity" and not value:
                        return Msg("'{name}': pick the {extra} for the {type} tile.", name=board.name, extra=domain_label(extra), type=tile.type)
                    if tile.type == "entity" and not value:
                        return Msg("'{name}': pick an entity for the entity tile.", name=board.name)
                    if not rest or (extra and domain not in extra):
                        return Msg("'{name}': a {type} tile needs a {extra}.", name=board.name, type=tile.type, extra=domain_label(extra))
    return None


def domain_label(domains: tuple[str, ...] | None) -> str:
    """Words for the entity a tile needs, for error messages."""
    return " or ".join(domains) + " entity" if domains else "entity"


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
    pet_kind: str = PET_KIND_DEFAULT  # which pet it is (see PET_KINDS)
    accent: str = ""  # colour of buttons and bars as "#RRGGBB"; empty = the pet's own colour
    ai: AiSettings = field(default_factory=AiSettings)
    question_wait_minutes: int = QUESTION_WAIT_DEFAULT  # how long the first nudge waits for the questions
    check_in_minutes: int = CHECK_IN_DEFAULT  # after "On it": when Boopli asks "still on it?"
    ladders: list[Ladder] = field(default_factory=list)  # "Nudge it your way"
    boards: list[Board] = field(default_factory=lambda: [default_board()])  # wall boards
    sounds: list[ExtraSound] = field(default_factory=list)  # your own sounds, shared by all speakers
    standard_done: bool = False  # the three standard styles have been turned into ladders (see seed_standard_ladders)

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Settings:
        settings = cls._parse(d)
        settings.merge_speaker_sounds()
        if not settings.standard_done:
            seed_standard_ladders(settings)
        return settings

    def merge_speaker_sounds(self) -> None:
        """Older settings: the sounds of each speaker move into the one shared list."""
        ids = {s.id for s in self.sounds}
        names = {s.name.casefold() for s in self.sounds}
        for speaker in self.speakers:
            moved: dict[str, str] = {}  # this speaker's old sound id -> the id it has in the shared list
            for sound in speaker.sounds:
                same = next(
                    (
                        s
                        for s in self.sounds
                        if s.kind == sound.kind and s.sound == sound.sound and s.name.casefold() == sound.name.casefold()
                    ),
                    None,
                )
                if same is not None:  # the same sound on another speaker is the same sound
                    moved[sound.id] = same.id
                    continue
                keep_id = sound.id
                while keep_id in ids:  # the same id for another sound on another speaker
                    keep_id = new_id()
                name, n = sound.name, 2
                while name.casefold() in names:
                    suffix = f" {n}"
                    name = sound.name[: EXTRA_SOUND_NAME_MAX - len(suffix)] + suffix
                    n += 1
                self.sounds.append(replace(sound, id=keep_id, name=name))
                moved[sound.id] = keep_id
                ids.add(keep_id)
                names.add(name.casefold())
            speaker.sounds = []
            # Ladders that picked one of this speaker's sounds follow it to its new place in the list.
            for ladder in self.ladders:
                for rung in ladder.rungs:
                    choice = rung.speakers.get(speaker.entity_id, "")
                    old = choice[len(SPEAKER_SOUND_PREFIX):] if choice.startswith(SPEAKER_SOUND_PREFIX) else ""
                    if old in moved and moved[old] != old:
                        rung.speakers[speaker.entity_id] = SPEAKER_SOUND_PREFIX + moved[old]

    @classmethod
    def _parse(cls, d: dict[str, Any] | None) -> Settings:
        d = d or {}
        ladders = d.get("ladders")
        boards = d.get("boards")
        sounds = d.get("sounds")
        board_list = [Board.from_dict(x) for x in boards if isinstance(x, dict)] if isinstance(boards, list) else []
        return cls(
            sounds=[ExtraSound.from_dict(x) for x in sounds if isinstance(x, dict)] if isinstance(sounds, list) else [],
            standard_done=bool(d.get("standard_done", False)),
            boards=board_list or [default_board()],
            ladders=[Ladder.from_dict(x) for x in ladders if isinstance(x, dict)] if isinstance(ladders, list) else [],
            check_in_minutes=int(d.get("check_in_minutes", CHECK_IN_DEFAULT) or CHECK_IN_DEFAULT),
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
            pet_kind=str(d.get("pet_kind") or PET_KIND_DEFAULT).strip(),
            accent=str(d.get("accent") or "").strip(),
            pet_name=str(d.get("pet_name") or PET_NAME_DEFAULT).strip()
            or PET_NAME_DEFAULT,
        )


_START_AT_ERROR = Msg("'Starts at nudge' must be {start_at_min} to {start_at_max}.", start_at_min=START_AT_MIN, start_at_max=START_AT_MAX)
_ALARM_SECONDS_ERROR = Msg(
    "An alarm must last {seconds_min} to {seconds_max} seconds.", seconds_min=ALARM_SECONDS_MIN, seconds_max=ALARM_SECONDS_MAX
)


def _validate_speaker(speaker: SpeakerCfg) -> str | None:
    if not speaker.entity_id.startswith("media_player."):
        return "A speaker must be a media player."
    for name, sound in (("cue", speaker.cue), ("alarm", speaker.alarm)):
        if not START_AT_MIN <= sound.start_at <= START_AT_MAX:
            return _START_AT_ERROR
        if sound.kind not in SOUND_KINDS:
            return Msg("Unknown {name} sound type.", name=name)
        if sound.kind == SOUND_BUNDLED and sound.sound not in BUNDLED_SOUNDS:
            return Msg("Unknown {name} sound type.", name=name)
    if not ALARM_SECONDS_MIN <= speaker.alarm.seconds <= ALARM_SECONDS_MAX:
        return _ALARM_SECONDS_ERROR
    if not 0 <= speaker.alarm.repeat_s <= ALARM_REPEAT_MAX:
        return Msg("Alarm repeat must be 0 to {alarm_repeat_max} seconds.", alarm_repeat_max=ALARM_REPEAT_MAX)
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


def validate_sounds(sounds: list[ExtraSound]) -> str | None:
    """Check your own sounds (the shared list): a name, a unique name, a known type and a sound."""
    if len(sounds) > EXTRA_SOUNDS_MAX:
        return Msg("You can have at most {extra_sounds_max} sounds of your own.", extra_sounds_max=EXTRA_SOUNDS_MAX)
    ids: set[str] = set()
    names: set[str] = set()
    for sound in sounds:
        if not sound.name:
            return "Every sound needs a name."
        if len(sound.name) > EXTRA_SOUND_NAME_MAX:
            return Msg("A sound name can have up to {extra_sound_name_max} characters.", extra_sound_name_max=EXTRA_SOUND_NAME_MAX)
        if sound.id in ids or sound.name.casefold() in names:
            return Msg("There are two sounds called '{name}'.", name=sound.name)
        ids.add(sound.id)
        names.add(sound.name.casefold())
        if sound.kind not in SOUND_KINDS:
            return Msg("Unknown type for the sound '{name}'.", name=sound.name)
        if not sound.sound:
            return Msg("Choose the sound for '{name}'.", name=sound.name)
    return None


def validate_speaker_test(speaker: SpeakerCfg, level: str, sounds: list[ExtraSound] | None = None) -> str | None:
    """Check a speaker before testing one level (which need not be switched on)."""
    if find_sound(sounds or [], level) is not None:
        return _validate_speaker(speaker)  # one of your own sounds
    if level not in SPEAKER_LEVELS and level != SPEAKER_SPEECH_CHIME:
        return "Choose which speaker sound to test."
    probe = speaker
    if level in (SPEAKER_CUE, SPEAKER_ALARM) and not (speaker.cue if level == SPEAKER_CUE else speaker.alarm).sound:
        return Msg("Choose the {level} sound for {entity_id} first.", level=level, entity_id=speaker.entity_id)  # saving without one is fine; testing it is not
    if level in (SPEAKER_CUE, SPEAKER_ALARM) and (speaker.cue if level == SPEAKER_CUE else speaker.alarm).kind == SOUND_ALEXA and not speaker_plays_alexa_sounds(speaker):
        return "Another media player can only play files, not Amazon's sounds."
    if level == SPEAKER_CUE:
        probe = replace(speaker, cue=replace(speaker.cue, enabled=True))
    elif level in (SPEAKER_SPEECH, SPEAKER_SPEECH_CHIME):
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
            return Msg("Blink length must be {blink_ms_min} to {blink_ms_max} milliseconds.", blink_ms_min=BLINK_MS_MIN, blink_ms_max=BLINK_MS_MAX)
        if not GAP_MS_MIN <= light.gap_ms <= GAP_MS_MAX:
            return Msg("The pause between blinks must be {gap_ms_min} to {gap_ms_max} milliseconds.", gap_ms_min=GAP_MS_MIN, gap_ms_max=GAP_MS_MAX)
        if not REPEATS_MIN <= light.repeats <= REPEATS_MAX:
            return Msg("A light can blink {repeats_min} to {repeats_max} times.", repeats_min=REPEATS_MIN, repeats_max=REPEATS_MAX)
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
    if not 5 <= settings.check_in_minutes <= 720:
        return "The check-in after \"On it\" must be between 5 minutes and 12 hours."
    if settings.ai.entity_id and not settings.ai.entity_id.startswith("ai_task."):
        return "Choose an AI Task agent, or keep the Home Assistant default."
    if settings.ai.photo_entity_id and not settings.ai.photo_entity_id.startswith("ai_task."):
        return "Choose an AI Task agent for photos, or select “The same agent as above.”"
    if (
        len(settings.ai.questions_prompt) > AI_PROMPT_MAX
        or len(settings.ai.steps_prompt) > AI_PROMPT_MAX
        or len(settings.ai.chat_room_prompt) > AI_PROMPT_MAX
        or len(settings.ai.chat_home_prompt) > AI_PROMPT_MAX
    ):
        return Msg("A prompt can have up to {ai_prompt_max} characters.", ai_prompt_max=AI_PROMPT_MAX)
    if len(settings.pet_name) > PET_NAME_MAX:
        return Msg("Your pet’s name can have up to {pet_name_max} characters.", pet_name_max=PET_NAME_MAX)
    if settings.pet_kind not in PET_KINDS:
        return "Pick a pet from the list."
    if settings.accent and not ACCENT_RE.fullmatch(settings.accent):
        return "Enter a color code like #1A2B3C."
    error = validate_sounds(settings.sounds) or validate_ladders(settings.ladders) or validate_boards(settings.boards)
    if error:
        return error
    if not style_known(settings.default_style, settings.ladders):
        return "Unknown default nudge style."
    return None


def _speaker_choice_known(choice: str) -> bool:
    return choice in SPEAKER_LEVELS or choice == SPEAKER_SPEECH_CHIME or choice.startswith(SPEAKER_SOUND_PREFIX)


def validate_ladders(ladders: list[Ladder]) -> str | None:
    """Check "Nudge it your way": names, the number of nudges, the waits and the device levels."""
    if len(ladders) > LADDER_MAX:
        return Msg("You can have up to {ladder_max} nudge sequences.", ladder_max=LADDER_MAX)
    ids: set[str] = set()
    names: set[str] = set()
    for ladder in ladders:
        if ladder.id in ids:
            return "Two nudge sequences have the same ID."
        ids.add(ladder.id)
        if not ladder.name:
            return "Give each nudge sequence a name."
        if len(ladder.name) > LADDER_NAME_MAX:
            return Msg("A nudge sequence name can have up to {ladder_name_max} characters.", ladder_name_max=LADDER_NAME_MAX)
        if ladder.name.casefold() in names:
            return Msg("Two nudge sequences are named “{name}.” Give them different names.", name=ladder.name)
        names.add(ladder.name.casefold())
        if not 1 <= len(ladder.rungs) <= LADDER_MAX_NUDGES:
            return Msg("'{name}' needs 1 to {ladder_max_nudges} nudges.", name=ladder.name, ladder_max_nudges=LADDER_MAX_NUDGES)
        for number, rung in enumerate(ladder.rungs, start=1):
            if not LADDER_GAP_MIN <= rung.gap <= LADDER_GAP_MAX:
                return Msg("'{name}', nudge {number}: the wait must be {ladder_gap_min} to {ladder_gap_max} minutes.", name=ladder.name, number=number, ladder_gap_min=LADDER_GAP_MIN, ladder_gap_max=LADDER_GAP_MAX)
            if any(level not in LEVEL_VALUES for level in rung.phones.values()):
                return Msg("'{name}', nudge {number}: unknown phone notification level.", name=ladder.name, number=number)
            if any(not _speaker_choice_known(choice) for choice in rung.speakers.values()):
                return Msg("'{name}', nudge {number}: unknown speaker choice.", name=ladder.name, number=number)
            for light in rung.lights.values():
                if light.mode not in (LIGHT_OWN_MODE, *LIGHT_MODE_VALUES):
                    return Msg("'{name}', nudge {number}: unknown light mode.", name=ladder.name, number=number)
                if light.color is not None and (len(light.color) != 3 or any(not 0 <= c <= 255 for c in light.color)):
                    return Msg("'{name}', nudge {number}: a light color needs three values from 0 to 255.", name=ladder.name, number=number)
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


def next_gap(style: str, sent: int, ladders: list[Ladder] | None = None) -> int | None:
    """Minutes until the next nudge after `sent` nudges, or None for no more.

    A style that points at one of your ladders takes the wait from the ladder's next nudge.
    A ladder that has been removed behaves like "one nudge".
    """
    if style.startswith(LADDER_PREFIX):
        ladder = find_ladder(style, ladders or [])
        rung = rung_for(ladder, sent + 1) if ladder else None
        return rung.gap if rung else None
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


def record_nudge(
    step: StepRun, style: str, now: datetime, ladders: list[Ladder] | None = None
) -> None:
    """Remember that a nudge went out and schedule the next one."""
    step.nudge_count += 1
    step.snoozed_until = None
    gap = next_gap(style, step.nudge_count, ladders)
    step.next_nudge_at = fmt_ts(now + timedelta(minutes=gap)) if gap else None


def snooze_step(step: StepRun, minutes: int, now: datetime) -> bool:
    """Delay the next nudge. The step stays active. Returns False if not active."""
    if step.status != STEP_ACTIVE:
        return False
    when = fmt_ts(now + timedelta(minutes=minutes))
    step.next_nudge_at = when
    step.snoozed_until = when
    step.on_it_since = None  # snoozing means: not now
    step.on_it_until = None
    return True


def start_on_it(step: StepRun, minutes: int, now: datetime) -> bool:
    """"On it": the person is doing this step. No nudges until the check-in, `minutes` from now.

    Pressing it again ("Still on it") only moves the check-in; the start time is kept.
    Returns False when the step is not waiting for the person.
    """
    if step.status != STEP_ACTIVE:
        return False
    step.on_it_since = step.on_it_since or fmt_ts(now)
    step.on_it_until = fmt_ts(now + timedelta(minutes=minutes))
    step.next_nudge_at = step.on_it_until
    step.snoozed_until = None
    return True


def stop_on_it(step: StepRun, now: datetime) -> bool:
    """Taken back ("Not on it"): normal nudging again, right away. False when it was not in progress."""
    if step.status != STEP_ACTIVE or not (step.on_it_since or step.on_it_until):
        return False
    step.on_it_since = None
    step.on_it_until = None
    step.next_nudge_at = fmt_ts(now)
    return True


def in_progress(step: StepRun) -> bool:
    """Whether the person said "On it" and the check-in has not come yet."""
    return step.status == STEP_ACTIVE and bool(step.on_it_until)


# --- notification and light payloads -------------------------------------


def action_id(kind: str, run_id: str, step_id: str) -> str:
    """Build the id carried by a notification button."""
    return f"{kind}_{run_id}_{step_id}"


def parse_action(action: str) -> tuple[str, str, str] | None:
    """Split a button id into (kind, run_id, step_id), or None if not ours."""
    for kind in (ACTION_DONE, ACTION_SNOOZE, ACTION_ALL_STEPS, ACTION_ON_IT, ACTION_NOT_ON_IT):
        prefix = f"{kind}_"
        if action.startswith(prefix):
            parts = action[len(prefix) :].split("_")
            if len(parts) == 2 and all(parts):
                return kind, parts[0], parts[1]
    return None


def notification_tag(run_id: str, step_id: str) -> str:
    """One tag per step, so a new nudge replaces the old notification."""
    return f"boopli-{run_id}-{step_id}"


# What a phone shows besides the chore and step: buttons and a few short sentences. These are the English
# texts; phone_texts.py has the other languages, and the notifier passes the ones for the language of
# Home Assistant. A missing text falls back to the English one.
PHONE_TEXTS: dict[str, str] = {
    "done": "Done",
    "snooze": "Snooze {minutes} min",
    "on_it": "On it",
    "not_on_it": "Not on it",
    "still_on_it": "Still on it",
    "start_all_steps": "Start with all steps",
    "answer_questions": "Answer the questions",
    "in_progress": "✅ In progress: {step} (since {since})",
    "still_on": "Still on: {step}?",
    "quick_look_one": "Quick look first: {count} question about what needs doing.",
    "quick_look_other": "Quick look first: {count} questions about what needs doing.",
    "test_title": "Boopli test",
    "test_message": "This is a test of your Boopli notification.",
    "test_speech": "Dishwasher: empty it",
}


def phone_text(texts: dict[str, str] | None, key: str, **values: Any) -> str:
    """One text for a phone, in the language of `texts` (English where it has none)."""
    template = (texts or {}).get(key) or PHONE_TEXTS[key]
    return template.format(**values) if values else template


def phone_payload(
    level: str,
    run_id: str,
    step_id: str,
    title: str,
    message: str,
    snooze_minutes: int,
    image: str = "",
    media_id: str = "local",
    texts: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Build the data for a notify.mobile_app_* call."""
    data: dict[str, Any] = {
        **picture_data(image, media_id),
        "tag": notification_tag(run_id, step_id),
        "actions": [
            {"action": action_id(ACTION_DONE, run_id, step_id), "title": phone_text(texts, "done")},
            {
                "action": action_id(ACTION_SNOOZE, run_id, step_id),
                "title": phone_text(texts, "snooze", minutes=snooze_minutes),
            },
            {"action": action_id(ACTION_ON_IT, run_id, step_id), "title": phone_text(texts, "on_it")},
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


def on_it_payload(
    run_id: str,
    step_id: str,
    chore_name: str,
    step_title: str,
    since: str,
    image: str = "",
    media_id: str = "local",
    texts: dict[str, str] | None = None,
) -> dict[str, Any]:
    """The same notification again, now green and quiet: "In progress".

    Same tag, so the phone replaces the nudge in place. Sticky, so a tap does not
    dismiss it. Android shows the green colour; elsewhere the check mark carries it.
    """
    return {
        "title": chore_name,
        "message": phone_text(texts, "in_progress", step=step_title, since=since),
        "data": {
            **picture_data(image, media_id),  # the picture stays when the nudge is replaced
            "tag": notification_tag(run_id, step_id),
            "sticky": True,
            "color": ON_IT_COLOR,
            "alert_once": True,  # replacing it must not make a sound or buzz again
            "actions": [
                {"action": action_id(ACTION_DONE, run_id, step_id), "title": phone_text(texts, "done")},
                {"action": action_id(ACTION_NOT_ON_IT, run_id, step_id), "title": phone_text(texts, "not_on_it")},
            ],
        },
    }


def check_in_payload(
    run_id: str,
    step_id: str,
    chore_name: str,
    step_title: str,
    image: str = "",
    media_id: str = "local",
    texts: dict[str, str] | None = None,
) -> dict[str, Any]:
    """"Still on it?": replaces the green notification, back to the normal look, with a sound."""
    return {
        "title": chore_name,
        "message": phone_text(texts, "still_on", step=step_title),
        "data": {
            **picture_data(image, media_id),
            "tag": notification_tag(run_id, step_id),
            "actions": [
                {"action": action_id(ACTION_DONE, run_id, step_id), "title": phone_text(texts, "done")},
                {"action": action_id(ACTION_ON_IT, run_id, step_id), "title": phone_text(texts, "still_on_it")},
            ],
        },
    }


PANEL_PATH = "/boopli"  # where Boopli lives inside Home Assistant (the app opens it from a button)


def questions_payload(run_id: str, chore_name: str, count: int, texts: dict[str, str] | None = None) -> dict[str, Any]:
    """The phone notification for a chore that started by itself and has questions to answer.

    "Start with all steps" starts it as it is; "Answer the questions" opens Boopli in
    the Home Assistant app. The chore itself is already running either way.
    """
    return {
        "title": chore_name,
        "message": phone_text(texts, "quick_look_one" if count == 1 else "quick_look_other", count=count),
        "data": {
            "tag": notification_tag(run_id, QUESTIONS_STEP),
            "clickAction": PANEL_PATH,
            "actions": [
                {
                    "action": action_id(ACTION_ALL_STEPS, run_id, QUESTIONS_STEP),
                    "title": phone_text(texts, "start_all_steps"),
                },
                {"action": "URI", "title": phone_text(texts, "answer_questions"), "uri": PANEL_PATH},
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


def light_last_on(attrs: dict[str, Any]) -> dict[str, Any]:
    """Brightness and color of a light that is on, as `light.turn_on` data (to remember them for later)."""
    return restore_plan("on", attrs)[1]


def light_has_color(data: dict[str, Any]) -> bool:
    """Whether remembered light data holds a color (not just a brightness)."""
    return any(key != "brightness" for key in data)


def own_color_steps(state: str, last_on: dict[str, Any] | None) -> list[tuple[str, dict[str, Any]]]:
    """The calls to make once, after the last blink, so a light that was off keeps its own color.

    A light that was off has no color in Home Assistant, but the lamp itself keeps the last one it
    showed (the blink color) and uses it at the next switch-on. So when we know the color it had
    when it was last on, it is switched on with that color for a moment and off again. Nothing
    for a light that was on (it is put back with `restore_plan`) or whose color is not known.
    """
    if state != "on" and last_on:
        return [("turn_on", dict(last_on)), ("turn_off", {})]
    return []


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


def phones_reached(settings: Settings, style: str, number: int) -> list[PhoneCfg]:
    """The phones that have been nudged by now (up to and including nudge `number`).

    Built-in styles: the phones whose "starts at nudge" has been reached. A ladder of your own:
    every phone that is on any of its nudges up to `number`. These are the phones that have a
    notification to turn green ("On it"), to replace ("Still on it?") or that hear about questions.
    """
    ladder = find_ladder(style, settings.ladders)
    if ladder is None:
        return [p for p in settings.phones if reached(p.start_at, number)]
    services: set[str] = set()
    for n in range(1, max(number, 0) + 1):
        rung = rung_for(ladder, n)
        if rung is None:
            break
        services.update(rung.phones)
    out: list[PhoneCfg] = []
    for phone in settings.phones:
        if phone.service in services and all(o.service != phone.service for o in out):
            out.append(phone)  # a phone listed twice is still one phone
    return out


def find_sound(sounds: Iterable[ExtraSound], choice: str) -> ExtraSound | None:
    """The sound of your own list that a "sound:<id>" choice points at."""
    if not choice.startswith(SPEAKER_SOUND_PREFIX):
        return None
    wanted = choice[len(SPEAKER_SOUND_PREFIX):]
    return next((s for s in sounds if s.id == wanted), None)


def speaker_plays_alexa_sounds(speaker: SpeakerCfg) -> bool:
    """Whether this speaker is an Alexa one. Amazon's sounds only play there; a file plays on any speaker."""
    return speaker.speech.route != SPEECH_TTS


def level_plays_alexa_sound(speaker: SpeakerCfg, level: str, sounds: Iterable[ExtraSound] = ()) -> bool:
    """Whether playing this level means playing one of Amazon's sounds (a ding, an alarm or one of your own)."""
    extra = find_sound(sounds, level)
    if extra is not None:
        return extra.kind == SOUND_ALEXA
    if level == SPEAKER_CUE:
        return speaker.cue.kind == SOUND_ALEXA
    if level == SPEAKER_ALARM:
        return speaker.alarm.kind == SOUND_ALEXA
    return False

def sound_fits_speaker(sound: ExtraSound, speaker: SpeakerCfg) -> bool:
    """A file plays on any speaker, one of Amazon's sounds on an Alexa speaker."""
    return sound.kind != SOUND_ALEXA or speaker_plays_alexa_sounds(speaker)


def speaker_choice_ok(speaker: SpeakerCfg, choice: str, sounds: Iterable[ExtraSound] = ()) -> bool:
    """Whether a speaker can do what a ladder asks of it (a level that is switched on, or a sound it can play)."""
    if choice.startswith(SPEAKER_SOUND_PREFIX):
        sound = find_sound(sounds, choice)
        return sound is not None and sound_fits_speaker(sound, speaker)
    # A ding and an alarm are always on offer once they have a sound; speaking needs somewhere to speak.
    # (an Amazon sound cannot play on another media player: that one needs a file)
    for level, tone in ((SPEAKER_CUE, speaker.cue), (SPEAKER_ALARM, speaker.alarm)):
        if choice == level:
            return bool(tone.sound) and (tone.kind != SOUND_ALEXA or speaker_plays_alexa_sounds(speaker))
    if choice == SPEAKER_SPEECH:
        return bool(speaker.speech.target)
    if choice == SPEAKER_SPEECH_CHIME:
        return bool(speaker.speech.target) and speaker.speech.route == SPEECH_ALEXA_MEDIA
    return False


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


def sound_play_data(kind: str, sound: str, base_url: str = "") -> dict[str, str]:
    """`media_player.play_media` data for an Alexa sound, one of Boopli's own sounds or a file.

    A bare file path such as "boopli/ding.mp3" means a file in Home Assistant's
    media folder. A media-source id, a /local path or a URL is used as given.
    One of Boopli's own sounds is a file the speaker fetches from Home Assistant, so it needs
    the address Home Assistant can be reached at (`base_url`, no slash at the end).
    """
    sound = sound.strip()
    if kind == SOUND_ALEXA:
        return {"media_content_id": sound, "media_content_type": "sound"}
    if kind == SOUND_BUNDLED:
        return {"media_content_id": base_url.rstrip("/") + BUNDLED_SOUND_URL.format(sound=sound), "media_content_type": "music"}
    if not (
        sound.startswith(("media-source://", "http://", "https://", "/"))
    ):
        sound = "media-source://media_source/local/" + sound.lstrip("/")
    return {"media_content_id": sound, "media_content_type": "music"}


def speech_call(
    speaker: SpeakerCfg, text: str, announce: bool | None = None
) -> tuple[str, str, dict[str, Any]]:
    """How to speak `text` on a speaker: (domain, service, data).

    `announce` (Alexa Media Player only) picks an announcement, which starts with a chime, or plain
    speech; left out, the speaker's own setting decides.
    """
    cfg = speaker.speech
    if cfg.route == SPEECH_ALEXA_MEDIA:
        service = cfg.target.removeprefix("notify.")
        chime = cfg.announce if announce is None else announce
        return (
            "notify",
            service,
            {"message": text, "data": {"type": "announce" if chime else "tts"}},
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


# --- backup of the setup -----------------------------------------------------------
#
# A backup is one JSON file (saved with the extension .adhd) with up to four parts: the settings, the
# chores, the rooms and notes of "My home", and the pet with its history. What is only there for a
# moment (running chores, away mode, devices that are on) is not part of it, and neither are picture
# files (a step only holds the path of a picture).

BACKUP_FORMAT = "boopli-backup"
BACKUP_VERSION = 1
BACKUP_PARTS = ("settings", "chores", "home", "pet")
BACKUP_CHORES_MAX = 500
BACKUP_HISTORY_MAX = 1000


class BackupError(ValueError):
    """A backup file that cannot be used; the message is meant for the user."""


@dataclass
class Backup:
    """A backup file, read and checked."""

    parts: list[str]  # the parts the file has
    exported_at: str = ""
    boopli_version: str = ""
    settings: Settings | None = None
    chores: list[Chore] | None = None
    home: Home | None = None
    progress: Progress | None = None
    history: list[HistoryEntry] | None = None


def build_backup(
    parts: Iterable[str],
    *,
    settings: Settings,
    chores: Iterable[Chore],
    home: Home,
    progress: Progress,
    history: Iterable[HistoryEntry],
    boopli_version: str,
    exported_at: str,
) -> dict[str, Any]:
    """The backup file as plain data, with the parts that were asked for."""
    asked = set(parts)
    chores = list(chores)
    if "chores" in asked and len(chores) > BACKUP_CHORES_MAX:
        raise BackupError(Msg("There are more than {max_chores} chores, which is more than a backup can hold.", max_chores=BACKUP_CHORES_MAX))
    data: dict[str, Any] = {
        "format": BACKUP_FORMAT,
        "version": BACKUP_VERSION,
        "boopli_version": boopli_version,
        "exported_at": exported_at,
    }
    if "settings" in asked:
        data["settings"] = to_dict(settings)
    if "chores" in asked:
        data["chores"] = [to_dict(c) for c in chores]
    if "home" in asked:
        data["home"] = to_dict(home)
    if "pet" in asked:
        data["pet"] = {"progress": to_dict(progress), "history": [to_dict(h) for h in history]}
    return data


def parse_backup(data: Any, current_ladder_ids: Iterable[str] = ()) -> Backup:
    """Read a backup file and check everything in it the way a normal save would.

    Raises BackupError (with words for the user) when the file cannot be used. Nothing is changed here.
    """
    if not isinstance(data, dict) or data.get("format") != BACKUP_FORMAT:
        raise BackupError("This is not a Boopli backup file.")
    version = data.get("version")
    if not isinstance(version, int) or isinstance(version, bool) or version < 1:
        raise BackupError("This backup file has no readable version.")
    if version > BACKUP_VERSION:
        raise BackupError("This backup was made by a newer Boopli. Update Boopli first, then import it.")
    backup = Backup(
        parts=[],
        exported_at=str(data.get("exported_at") or "")[:40],
        boopli_version=str(data.get("boopli_version") or "")[:40],
    )
    try:
        if "settings" in data:
            if not isinstance(data["settings"], dict):
                raise BackupError("The settings in this file are damaged.")
            backup.settings = Settings.from_dict(data["settings"])
            error = validate_settings(backup.settings)
            if error:
                raise BackupError(Msg("The settings in this file are not valid: {error}", error=as_msg(error)))
            backup.parts.append("settings")
        if "chores" in data:
            raw = data["chores"]
            if not isinstance(raw, list) or any(not isinstance(c, dict) for c in raw):
                raise BackupError("The chores in this file are damaged.")
            if len(raw) > BACKUP_CHORES_MAX:
                raise BackupError(Msg("A backup can have at most {max_chores} chores.", max_chores=BACKUP_CHORES_MAX))
            backup.chores = [Chore.from_dict(c) for c in raw]
            ladders = (
                [lad.id for lad in backup.settings.ladders] if backup.settings else list(current_ladder_ids)
            )
            seen: set[str] = set()
            for chore in backup.chores:
                if chore.id in seen:
                    raise BackupError("Two chores in this file share the same id.")
                seen.add(chore.id)
                error = validate_chore(chore, ladders)
                if error:
                    raise BackupError(Msg("The chore '{name}' is not valid: {error}", name=chore.name, error=as_msg(error)))
            backup.parts.append("chores")
        if "home" in data:
            if not isinstance(data["home"], dict):
                raise BackupError("The rooms in this file are damaged.")
            backup.home = Home.from_dict(data["home"])
            error = validate_home(backup.home)
            if error:
                raise BackupError(Msg("The rooms in this file are not valid: {error}", error=as_msg(error)))
            backup.parts.append("home")
        if "pet" in data:
            pet = data["pet"]
            if not isinstance(pet, dict) or not isinstance(pet.get("progress") or {}, dict):
                raise BackupError("The pet in this file is damaged.")
            raw_history = pet.get("history") or []
            if not isinstance(raw_history, list) or any(not isinstance(h, dict) for h in raw_history):
                raise BackupError("The history in this file is damaged.")
            backup.progress = Progress.from_dict(pet.get("progress"))
            backup.history = [HistoryEntry.from_dict(h) for h in raw_history][-BACKUP_HISTORY_MAX:]
            backup.parts.append("pet")
    except BackupError:
        raise
    except (KeyError, TypeError, ValueError, AttributeError) as err:
        raise BackupError("This backup file is damaged and cannot be read.") from err
    if not backup.parts:
        raise BackupError("This backup file has nothing in it to import.")
    return backup


def settle_imported_chore(chore: Chore, now: datetime, tz: tzinfo) -> None:
    """Make an imported chore ready: its next due time is worked out again from now, except for a parked
    part of a task, which has no schedule and keeps the time it comes back (or waits for the user)."""
    if not chore.parked:
        init_schedule(chore, now, tz)
    chore.created_at = chore.created_at or fmt_ts(now)


def check_backup_selection(
    backup: Backup, chosen: Iterable[str], settings: Settings, chores: Iterable[Chore]
) -> str | None:
    """Whether the chosen parts fit together with what stays: chores need their nudge ladders."""
    wanted = set(chosen)
    if not wanted:
        return "Pick at least one part to import."
    for part in BACKUP_PARTS:
        if part in wanted and part not in backup.parts:
            return Msg("The file has no {part} to import.", part=part)
    ladders = backup.settings.ladders if "settings" in wanted and backup.settings else settings.ladders
    ladder_ids = [lad.id for lad in ladders]
    if "chores" in wanted and backup.chores is not None:
        for chore in backup.chores:
            error = validate_chore(chore, ladder_ids)
            if error:
                return Msg("The chore '{name}' does not fit this setup: {error}", name=chore.name, error=as_msg(error))
    elif "settings" in wanted:
        # New settings, chores that stay: they must not lose a ladder they use.
        kept = set(ladder_ids)
        for ladder in settings.ladders:
            if ladder.id in kept:
                continue
            users = chores_using(ladder.id, chores)
            if users:
                return (
                    Msg("The backup is missing the nudge sequence “{name},” which {users} use. Import the chores too, or choose another nudge style for them first.", name=ladder.name, users=', '.join(users))
                )
    return None


def backup_references(settings: Settings | None, chores: Iterable[Chore] | None) -> tuple[list[str], list[str]]:
    """The entities and the notify services a backup points to (to say which ones this install lacks)."""
    entities: set[str] = set()
    services: set[str] = set()
    if settings is not None:
        entities.update(light.entity_id for light in settings.lights)
        for speaker in settings.speakers:
            entities.add(speaker.entity_id)
            speech = speaker.speech
            if speech.enabled and speech.target:
                # Alexa (media) speaks through a notify service; the other routes use an entity
                (services if speech.route == SPEECH_ALEXA_MEDIA else entities).add(speech.target)
        entities.update(device.entity_id for device in settings.alarm_devices)
        entities.update([settings.presence_entity, settings.ai.entity_id, settings.ai.photo_entity_id])
        for board in settings.boards:
            for tile in board.tiles:
                value = tile.options.get("entity_id")
                if isinstance(value, str):
                    entities.add(value)
        services.update(phone.service for phone in settings.phones)
    for chore in chores or []:
        for step in chore.steps:
            for trigger in [*step.triggers, *step.wait_for]:
                entities.add(trigger.entity_id)
            if step.image.startswith("camera."):
                entities.add(step.image)
    return sorted(e for e in entities if e), sorted(s for s in services if s)
