"""The Boopli manager: storage, timers and the operations the API exposes.

It owns all chores, active runs and the completion history. The pure logic
lives in `engine.py`; this module connects it to Home Assistant (storage,
timers, events).
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import datetime, timedelta, tzinfo
from typing import Any

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_utc_time
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import engine
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
STORAGE_KEY = DOMAIN
SAVE_DELAY = 1  # seconds
HISTORY_MAX = 1000
HISTORY_IN_SNAPSHOT = 200


class BoopliError(Exception):
    """A problem the caller can fix (bad input, unknown chore)."""


class BoopliManager:
    """Holds Boopli's data and keeps its timers running."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.chores: dict[str, engine.Chore] = {}
        self.runs: dict[str, engine.Run] = {}  # active runs only
        self.history: list[engine.HistoryEntry] = []
        self._listeners: list[Callable[[], None]] = []
        self._unsub_timer: CALLBACK_TYPE | None = None

    # --- lifecycle -------------------------------------------------------

    @property
    def tz(self) -> tzinfo:
        return dt_util.get_default_time_zone()

    async def async_load(self) -> None:
        """Load stored data, catch up on anything that came due, and start timers."""
        data = await self._store.async_load() or {}
        self.chores = {
            c["id"]: engine.Chore.from_dict(c) for c in data.get("chores", [])
        }
        self.runs = {
            r["id"]: engine.Run.from_dict(r)
            for r in data.get("runs", [])
            if r.get("status", engine.RUN_ACTIVE) == engine.RUN_ACTIVE
        }
        self.history = [
            engine.HistoryEntry.from_dict(h) for h in data.get("history", [])
        ]
        self._tick()

    @callback
    def async_shutdown(self) -> None:
        """Stop the timer (data is saved by Home Assistant on stop)."""
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None
        self._listeners.clear()

    # --- persistence and listeners --------------------------------------

    def _data_to_save(self) -> dict[str, Any]:
        return {
            "chores": [engine.to_dict(c) for c in self.chores.values()],
            "runs": [engine.to_dict(r) for r in self.runs.values()],
            "history": [engine.to_dict(h) for h in self.history],
        }

    def _save(self) -> None:
        self._store.async_delay_save(self._data_to_save, SAVE_DELAY)

    @callback
    def async_add_listener(self, listener: Callable[[], None]) -> CALLBACK_TYPE:
        """Call `listener` whenever the data changes. Returns an unsubscribe."""
        self._listeners.append(listener)

        @callback
        def remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return remove

    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener()

    def snapshot(self) -> dict[str, Any]:
        """Everything the panel needs to draw itself."""
        now = dt_util.utcnow()
        return {
            "now": engine.fmt_ts(now),
            "time_zone": str(self.tz),
            "chores": [engine.to_dict(c) for c in self.chores.values()],
            "runs": [engine.to_dict(r) for r in self.runs.values()],
            "history": [
                engine.to_dict(h) for h in self.history[-HISTORY_IN_SNAPSHOT:]
            ],
        }

    # --- events and history ---------------------------------------------

    def _announce(self, events: list[engine.Event]) -> None:
        for event in events:
            self.hass.bus.async_fire(f"{DOMAIN}_{event.name}", event.data)
            if event.name in (engine.EVENT_STEP_DONE, engine.EVENT_CHORE_DONE):
                self.history.append(
                    engine.HistoryEntry(
                        ts=event.data["time"],
                        kind=event.name,
                        chore_id=event.data["chore_id"],
                        chore_name=event.data["chore_name"],
                        run_id=event.data["run_id"],
                        step_title=event.data.get("step_title"),
                    )
                )
        if len(self.history) > HISTORY_MAX:
            self.history = self.history[-HISTORY_MAX:]

    # --- the clock -------------------------------------------------------

    def _active_run_for(self, chore_id: str) -> engine.Run | None:
        return next((r for r in self.runs.values() if r.chore_id == chore_id), None)

    def _tick(self) -> None:
        """Wake waiting steps, start chores that came due, and set the next timer."""
        now = dt_util.utcnow()
        events: list[engine.Event] = []

        for run in list(self.runs.values()):
            events += engine.wake_steps(run, now)

        for chore in list(self.chores.values()):
            action = engine.due_action(
                chore, self._active_run_for(chore.id) is not None, now
            )
            if action == "start":
                run, started = engine.start_run(chore, now)
                self.runs[run.id] = run
                events += started
            if action in ("start", "skip"):
                engine.advance_after_due(chore, now, self.tz)

        self._announce(events)
        self._reschedule(now)
        self._save()
        self._notify()

    def _reschedule(self, now: datetime) -> None:
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None
        wake = engine.next_wakeup(
            list(self.chores.values()), list(self.runs.values()), now
        )
        if wake is None:
            return
        if wake <= now:  # safety net: never spin
            wake = now + timedelta(seconds=1)
        self._unsub_timer = async_track_point_in_utc_time(
            self.hass, self._handle_timer, wake
        )

    @callback
    def _handle_timer(self, _now: datetime) -> None:
        self._unsub_timer = None
        self._tick()

    # --- lookups ---------------------------------------------------------

    def find_chore(self, ref: str) -> engine.Chore:
        """Find a chore by id or (case-insensitive) name."""
        ref = (ref or "").strip()
        if ref in self.chores:
            return self.chores[ref]
        matches = [c for c in self.chores.values() if c.name.lower() == ref.lower()]
        if not matches:
            raise BoopliError(f"No chore called '{ref}'.")
        if len(matches) > 1:
            raise BoopliError(f"More than one chore is called '{ref}'. Use its id.")
        return matches[0]

    # --- operations ------------------------------------------------------

    def save_chore(self, data: dict[str, Any]) -> engine.Chore:
        """Create or update a chore."""
        chore = engine.Chore.from_dict(data)
        error = engine.validate_chore(chore)
        if error:
            raise BoopliError(error)

        existing = self.chores.get(chore.id) if data.get("id") else None
        now = dt_util.utcnow()
        if existing is None:
            chore.id = chore.id if data.get("id") else engine.new_id()
            chore.created_at = engine.fmt_ts(now)
            engine.init_schedule(chore, now, self.tz)
        else:
            chore.created_at = existing.created_at
            chore.next_due = existing.next_due
            repeat_changed = engine.to_dict(existing.repeat) != engine.to_dict(
                chore.repeat
            )
            if repeat_changed or (chore.enabled and not existing.enabled):
                engine.init_schedule(chore, now, self.tz)
            # A run in progress keeps its own snapshot of the steps.
        self.chores[chore.id] = chore
        self._tick()
        return chore

    def delete_chore(self, chore_id: str) -> None:
        """Delete a chore and any run in progress."""
        chore = self.find_chore(chore_id)
        for run in [r for r in self.runs.values() if r.chore_id == chore.id]:
            del self.runs[run.id]
        del self.chores[chore.id]
        self._tick()

    def start_chore(self, ref: str) -> engine.Run:
        """Start a chore now (for on-demand chores). Idempotent while running."""
        chore = self.find_chore(ref)
        existing = self._active_run_for(chore.id)
        if existing:
            return existing
        now = dt_util.utcnow()
        run, events = engine.start_run(chore, now)
        self.runs[run.id] = run
        self._announce(events)
        self._reschedule(now)
        self._save()
        self._notify()
        return run

    def complete_step(self, run_id: str, step_id: str) -> None:
        """Mark a step done (the user pressed Done)."""
        run = self.runs.get(run_id)
        if run is None:
            return  # already finished: completing twice is harmless
        self._complete(run, step_id)

    def complete_active_step_for(self, ref: str) -> None:
        """Mark the currently active step of a chore done (used by services)."""
        chore = self.find_chore(ref)
        run = self._active_run_for(chore.id)
        if run is None:
            raise BoopliError(f"'{chore.name}' has nothing in progress.")
        step = next((s for s in run.steps if s.status == engine.STEP_ACTIVE), None)
        if step is None:
            raise BoopliError(f"'{chore.name}' has no step waiting for you right now.")
        self._complete(run, step.step_id)

    def _complete(self, run: engine.Run, step_id: str) -> None:
        now = dt_util.utcnow()
        events = engine.complete_step(run, step_id, now)
        if run.status == engine.RUN_DONE:
            del self.runs[run.id]
            chore = self.chores.get(run.chore_id)
            if chore and engine.on_run_finished(chore, now, self.tz):
                del self.chores[chore.id]
        self._announce(events)
        self._reschedule(now)
        self._save()
        self._notify()

    def add_task(
        self, title: str, steps: list[str] | None = None, where: str = engine.WHERE_HOME
    ) -> engine.Run:
        """Create a one-off task and start it right away."""
        titles = [s.strip() for s in (steps or []) if s and s.strip()] or [title]
        chore = engine.Chore(
            id=engine.new_id(),
            name=title.strip(),
            steps=[engine.Step(id=engine.new_id(), title=t) for t in titles],
            where=where,
            one_off=True,
            created_at=engine.fmt_ts(dt_util.utcnow()),
        )
        error = engine.validate_chore(chore)
        if error:
            raise BoopliError(error)
        self.chores[chore.id] = chore
        return self.start_chore(chore.id)
