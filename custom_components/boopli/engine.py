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
from dataclasses import asdict, dataclass, field
from datetime import date, datetime, time as dtime, timedelta, timezone, tzinfo
from typing import Any

# --- constants -----------------------------------------------------------

WHERE_HOME = "home"
WHERE_ANYWHERE = "anywhere"
WHERE_VALUES = (WHERE_HOME, WHERE_ANYWHERE)

REPEAT_NONE = "none"  # on demand: the user starts it
REPEAT_DAILY = "daily"
REPEAT_WEEKLY = "weekly"
REPEAT_EVERY_N_DAYS = "every_n_days"  # counted from completion
REPEAT_TYPES = (REPEAT_NONE, REPEAT_DAILY, REPEAT_WEEKLY, REPEAT_EVERY_N_DAYS)

RESOLVE_MANUAL = "manual"  # M4 adds entity/tag resolution

STEP_PENDING = "pending"
STEP_WAITING = "waiting"
STEP_ACTIVE = "active"
STEP_DONE = "done"

RUN_ACTIVE = "active"
RUN_DONE = "done"

MAX_WAIT_MINUTES = 7 * 24 * 60
MAX_STEPS = 30

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
LIGHT_AUTO = "auto"  # flash if the light can, otherwise indicator
LIGHT_FLASH = "flash"
LIGHT_INDICATOR = "indicator"  # on in a color until the step is resolved
LIGHT_MODE_VALUES = (LIGHT_AUTO, LIGHT_FLASH, LIGHT_INDICATOR)

LIGHT_FEATURE_FLASH = 8  # LightEntityFeature.FLASH

# Which channels a nudge may use
CHANNELS_ALL = "all"
CHANNELS_PHONE_ONLY = "phone_only"

ACTION_DONE = "BOOPLI_DONE"
ACTION_SNOOZE = "BOOPLI_SNOOZE"


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


@dataclass
class Step:
    """One step of a chore."""

    id: str
    title: str
    wait_minutes: int = 0  # wait after the previous step is done
    resolve: str = RESOLVE_MANUAL

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Step:
        return cls(
            id=str(d.get("id") or new_id()),
            title=str(d.get("title", "")).strip(),
            wait_minutes=int(d.get("wait_minutes", 0) or 0),
            resolve=str(d.get("resolve", RESOLVE_MANUAL)),
        )


@dataclass
class Repeat:
    """When a chore comes due on its own."""

    type: str = REPEAT_NONE
    time: str = "09:00"  # local time, HH:MM
    weekdays: list[int] = field(default_factory=list)  # 0 = Monday
    every_n_days: int = 1

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Repeat:
        d = d or {}
        return cls(
            type=str(d.get("type", REPEAT_NONE)),
            time=str(d.get("time", "09:00")),
            weekdays=sorted({int(x) for x in d.get("weekdays", [])}),
            every_n_days=int(d.get("every_n_days", 1) or 1),
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

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Chore:
        return cls(
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

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> StepRun:
        return cls(
            step_id=str(d["step_id"]),
            title=str(d.get("title", "")),
            wait_minutes=int(d.get("wait_minutes", 0) or 0),
            status=str(d.get("status", STEP_PENDING)),
            active_at=d.get("active_at"),
            done_at=d.get("done_at"),
            nudge_count=int(d.get("nudge_count", 0) or 0),
            next_nudge_at=d.get("next_nudge_at"),
            snoozed_until=d.get("snoozed_until"),
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

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> Run:
        return cls(
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

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> HistoryEntry:
        return cls(
            ts=str(d["ts"]),
            kind=str(d["kind"]),
            chore_id=str(d["chore_id"]),
            chore_name=str(d.get("chore_name", "")),
            run_id=str(d.get("run_id", "")),
            step_title=d.get("step_title"),
        )


@dataclass
class Event:
    """Something the manager should announce (fire on the HA event bus)."""

    name: str
    data: dict[str, Any]


def to_dict(obj: Any) -> dict[str, Any]:
    """Serialize any engine dataclass to plain JSON-safe data."""
    return asdict(obj)


# --- validation ----------------------------------------------------------


def validate_chore(chore: Chore) -> str | None:
    """Return an error message, or None when the chore is valid."""
    if not chore.name:
        return "A chore needs a name."
    if not chore.steps:
        return "A chore needs at least one step."
    if len(chore.steps) > MAX_STEPS:
        return f"A chore can have at most {MAX_STEPS} steps."
    for step in chore.steps:
        if not step.title:
            return "Every step needs a title."
        if not 0 <= step.wait_minutes <= MAX_WAIT_MINUTES:
            return "A wait must be between 0 minutes and 7 days."
    if chore.where not in WHERE_VALUES:
        return "Where must be 'home' or 'anywhere'."
    if chore.nudge_style not in STYLE_VALUES:
        return "Unknown nudge style."
    rep = chore.repeat
    if rep.type not in REPEAT_TYPES:
        return "Unknown repeat type."
    if rep.type != REPEAT_NONE:
        try:
            _parse_hhmm(rep.time)
        except (ValueError, IndexError):
            return "The time must look like 09:30."
    if rep.type == REPEAT_WEEKLY:
        if not rep.weekdays:
            return "Pick at least one weekday."
        if any(d < 0 or d > 6 for d in rep.weekdays):
            return "Weekdays must be 0 (Monday) to 6 (Sunday)."
    if rep.type == REPEAT_EVERY_N_DAYS and not 1 <= rep.every_n_days <= 365:
        return "Repeat every N days needs N between 1 and 365."
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
    t = _parse_hhmm(repeat.time)

    if repeat.type == REPEAT_DAILY:
        candidate = _at(local.date(), t, tz)
        if candidate <= local:
            candidate = _at(local.date() + timedelta(days=1), t, tz)
        return candidate.astimezone(timezone.utc)

    if repeat.type == REPEAT_WEEKLY:
        if not repeat.weekdays:
            return None
        for offset in range(0, 8):
            day = local.date() + timedelta(days=offset)
            if day.weekday() in repeat.weekdays:
                candidate = _at(day, t, tz)
                if candidate > local:
                    return candidate.astimezone(timezone.utc)
        return None

    if repeat.type == REPEAT_EVERY_N_DAYS:
        day = local.date() + timedelta(days=max(1, repeat.every_n_days))
        return _at(day, t, tz).astimezone(timezone.utc)

    return None


def first_due(repeat: Repeat, now: datetime, tz: tzinfo) -> datetime | None:
    """Return the first due moment for a new or changed chore."""
    if repeat.type == REPEAT_EVERY_N_DAYS:
        # Start at the next occurrence of the time, like a daily chore.
        return compute_next_due(Repeat(type=REPEAT_DAILY, time=repeat.time), now, tz)
    return compute_next_due(repeat, now, tz)


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
    """Schedule a step after `base`. Return True when it is active right now."""
    step.active_at = fmt_ts(base + timedelta(minutes=step.wait_minutes))
    if step.wait_minutes <= 0:
        _became_active(step)
        return True
    step.status = STEP_WAITING
    return False


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


def start_run(chore: Chore, now: datetime) -> tuple[Run, list[Event]]:
    """Start a new run of a chore. Its first step is scheduled from `now`."""
    run = Run(
        id=new_id(),
        chore_id=chore.id,
        chore_name=chore.name,
        where=chore.where,
        started_at=fmt_ts(now),
        steps=[
            StepRun(step_id=s.id, title=s.title, wait_minutes=s.wait_minutes)
            for s in chore.steps
        ],
    )
    events = [
        Event(
            EVENT_CHORE_STARTED,
            {
                "chore_id": run.chore_id,
                "chore_name": run.chore_name,
                "run_id": run.id,
                "where": run.where,
                "time": fmt_ts(now),
            },
        )
    ]
    if run.steps and _activate(run.steps[0], now):
        events.append(_step_event(EVENT_STEP_ACTIVE, run, run.steps[0], now))
    return run, events


def complete_step(run: Run, step_id: str, now: datetime) -> list[Event]:
    """Mark the active step done and advance. Idempotent: no-op if not active."""
    if run.status != RUN_ACTIVE:
        return []
    step = next((s for s in run.steps if s.step_id == step_id), None)
    if step is None or step.status != STEP_ACTIVE:
        return []

    step.status = STEP_DONE
    step.done_at = fmt_ts(now)
    events = [_step_event(EVENT_STEP_DONE, run, step, now)]

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

    Daily and weekly chores keep their fixed schedule. "Every N days" and
    on-demand chores have no next due date until the run finishes.
    """
    if chore.repeat.type in (REPEAT_DAILY, REPEAT_WEEKLY):
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
    mode: str = LIGHT_AUTO
    color: list[int] = field(default_factory=lambda: [255, 90, 0])

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> LightCfg:
        color = d.get("color") or [255, 90, 0]
        return cls(
            entity_id=str(d.get("entity_id", "")).strip(),
            mode=str(d.get("mode", LIGHT_AUTO)),
            color=[int(c) for c in color][:3],
        )


@dataclass
class PhoneCfg:
    """A phone (a notify.mobile_app_* service) that receives nudges."""

    service: str  # without the "notify." prefix
    level: str = LEVEL_NORMAL

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> PhoneCfg:
        return cls(
            service=str(d.get("service", "")).strip(),
            level=str(d.get("level", LEVEL_NORMAL)),
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


@dataclass
class Settings:
    """Boopli's global settings."""

    lights: list[LightCfg] = field(default_factory=list)
    phones: list[PhoneCfg] = field(default_factory=list)
    quiet_hours: QuietHours = field(default_factory=QuietHours)
    presence_entity: str = ""  # optional person entity
    snooze_minutes: int = 15
    default_style: str = STYLE_ONE

    @classmethod
    def from_dict(cls, d: dict[str, Any] | None) -> Settings:
        d = d or {}
        return cls(
            lights=[LightCfg.from_dict(x) for x in d.get("lights", [])],
            phones=[PhoneCfg.from_dict(x) for x in d.get("phones", [])],
            quiet_hours=QuietHours.from_dict(d.get("quiet_hours")),
            presence_entity=str(d.get("presence_entity", "")).strip(),
            snooze_minutes=int(d.get("snooze_minutes", 15) or 15),
            default_style=str(d.get("default_style", STYLE_ONE)),
        )


def validate_settings(settings: Settings) -> str | None:
    """Return an error message, or None when the settings are valid."""
    for light in settings.lights:
        if not light.entity_id.startswith("light."):
            return "A light must be a light entity."
        if light.mode not in LIGHT_MODE_VALUES:
            return "Unknown light mode."
        if len(light.color) != 3 or any(not 0 <= c <= 255 for c in light.color):
            return "A light color needs three values from 0 to 255."
    for phone in settings.phones:
        if not phone.service or "." in phone.service:
            return "A phone must be a notify service name."
        if phone.level not in LEVEL_VALUES:
            return "Unknown phone notification level."
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
    for kind in (ACTION_DONE, ACTION_SNOOZE):
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


def _color_data(color_modes: list[str], color: list[int]) -> dict[str, Any]:
    if any(m in color_modes for m in ("rgb", "rgbw", "rgbww", "xy")):
        return {"rgb_color": list(color)}
    if "hs" in color_modes:
        hue, sat, _ = colorsys.rgb_to_hsv(*(c / 255 for c in color))
        return {"hs_color": [round(hue * 360, 1), round(sat * 100, 1)]}
    return {}


def light_plan(
    mode: str, supported_features: int, color_modes: list[str], color: list[int]
) -> dict[str, Any]:
    """Decide how to nudge a light and with which `light.turn_on` data.

    Flashing needs the light to support it. A light that cannot flash is used
    as an indicator: switched on in a color until the step is resolved.
    """
    can_flash = bool(supported_features & LIGHT_FEATURE_FLASH)
    effective = mode
    if mode == LIGHT_AUTO:
        effective = LIGHT_FLASH if can_flash else LIGHT_INDICATOR
    if effective == LIGHT_FLASH and not can_flash:
        effective = LIGHT_INDICATOR
    if effective == LIGHT_FLASH:
        return {"mode": LIGHT_FLASH, "data": {"flash": "short"}}
    data: dict[str, Any] = _color_data(color_modes, color)
    if color_modes and set(color_modes) != {"onoff"}:
        data["brightness"] = 255
    return {"mode": LIGHT_INDICATOR, "data": data}
