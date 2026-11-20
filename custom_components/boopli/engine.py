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

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> StepRun:
        return cls(
            step_id=str(d["step_id"]),
            title=str(d.get("title", "")),
            wait_minutes=int(d.get("wait_minutes", 0) or 0),
            status=str(d.get("status", STEP_PENDING)),
            active_at=d.get("active_at"),
            done_at=d.get("done_at"),
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


def _activate(step: StepRun, base: datetime) -> bool:
    """Schedule a step after `base`. Return True when it is active right now."""
    step.active_at = fmt_ts(base + timedelta(minutes=step.wait_minutes))
    if step.wait_minutes <= 0:
        step.status = STEP_ACTIVE
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
            step.status = STEP_ACTIVE
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
    chores: list[Chore], runs: list[Run], now: datetime
) -> datetime | None:
    """Return the earliest future moment something needs attention."""
    moments: list[datetime] = []
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
