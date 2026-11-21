"""The Boopli manager: storage, timers and the operations the API exposes.

It owns all chores, active runs, settings and the completion history. The
pure logic lives in `engine.py`; this module connects it to Home Assistant
(storage, timers, events) and drives the nudger.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import datetime, timedelta, tzinfo
from typing import Any

from homeassistant.core import CALLBACK_TYPE, Event as HAEvent, HomeAssistant, callback
from homeassistant.helpers.event import (
    async_track_point_in_utc_time,
    async_track_state_change_event,
)
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import engine
from .const import DOMAIN
from .nudger import BoopliNudger

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
        self.settings = engine.Settings()
        self.indicator_on: list[str] = []  # lights Boopli switched on as indicators
        self.nudger = BoopliNudger(hass, self)
        self._listeners: list[Callable[[], None]] = []
        self._unsub_timer: CALLBACK_TYPE | None = None
        self._unsub_presence: CALLBACK_TYPE | None = None

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
        self.settings = engine.Settings.from_dict(data.get("settings"))
        self.indicator_on = [str(x) for x in data.get("indicator_on", [])]
        # Data saved before nudging existed: an open step has never been nudged.
        for run in self.runs.values():
            for step in run.steps:
                if (
                    step.status == engine.STEP_ACTIVE
                    and step.nudge_count == 0
                    and step.next_nudge_at is None
                ):
                    step.next_nudge_at = step.active_at
        self.nudger.async_start()
        self._watch_presence()
        self._tick()

    @callback
    def async_shutdown(self) -> None:
        """Stop timers and listeners (data is saved by Home Assistant on stop)."""
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None
        if self._unsub_presence:
            self._unsub_presence()
            self._unsub_presence = None
        self.nudger.async_stop()
        self._listeners.clear()

    # --- persistence and listeners --------------------------------------

    def _data_to_save(self) -> dict[str, Any]:
        return {
            "chores": [engine.to_dict(c) for c in self.chores.values()],
            "runs": [engine.to_dict(r) for r in self.runs.values()],
            "history": [engine.to_dict(h) for h in self.history],
            "settings": engine.to_dict(self.settings),
            "indicator_on": self.indicator_on,
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
            "is_home": self.is_home(),
            "settings": engine.to_dict(self.settings),
            "chores": [engine.to_dict(c) for c in self.chores.values()],
            "runs": [engine.to_dict(r) for r in self.runs.values()],
            "history": [
                engine.to_dict(h) for h in self.history[-HISTORY_IN_SNAPSHOT:]
            ],
        }

    # --- presence --------------------------------------------------------

    def is_home(self) -> bool:
        """Whether the user is home. Without a presence source, assume home."""
        entity_id = self.settings.presence_entity
        if not entity_id:
            return True
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unavailable", "unknown"):
            return True  # do not silently lose nudges when the source is broken
        return state.state == "home"

    def _watch_presence(self) -> None:
        if self._unsub_presence:
            self._unsub_presence()
            self._unsub_presence = None
        entity_id = self.settings.presence_entity
        if entity_id:
            self._unsub_presence = async_track_state_change_event(
                self.hass, [entity_id], self._presence_changed
            )

    @callback
    def _presence_changed(self, _event: HAEvent) -> None:
        self._tick()  # may release nudges that waited for you to be home

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
        """Wake steps, start due chores, send due nudges, and set the next timer."""
        now = dt_util.utcnow()
        events: list[engine.Event] = []
        wakeups: list[datetime] = []

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

        events += self._nudge_due_steps(now, wakeups)
        self._sync_indicators()

        self._announce(events)
        self._reschedule(now, wakeups)
        self._save()
        self._notify()

    def _nudge_due_steps(
        self, now: datetime, wakeups: list[datetime]
    ) -> list[engine.Event]:
        """Send the nudges that are due and collect when to look again."""
        events: list[engine.Event] = []
        home = self.is_home()
        for run in self.runs.values():
            chore = self.chores.get(run.chore_id)
            style = chore.nudge_style if chore else self.settings.default_style
            ignore_quiet = chore.ignore_quiet_hours if chore else False
            for step in run.steps:
                if step.status != engine.STEP_ACTIVE:
                    continue
                decision = engine.decide_nudge(
                    step,
                    run.where,
                    style,
                    ignore_quiet,
                    self.settings.quiet_hours,
                    home,
                    now,
                    self.tz,
                )
                if decision.action == "send":
                    number = step.nudge_count + 1
                    engine.record_nudge(step, style, now)
                    if step.next_nudge_at:
                        wakeups.append(engine.parse_ts(step.next_nudge_at))
                    self.hass.async_create_task(
                        self.nudger.async_send(
                            run.id,
                            run.chore_name,
                            step.step_id,
                            step.title,
                            decision.channels,
                        )
                    )
                    events.append(
                        engine.Event(
                            engine.EVENT_NUDGE_SENT,
                            {
                                "chore_id": run.chore_id,
                                "chore_name": run.chore_name,
                                "run_id": run.id,
                                "step_id": step.step_id,
                                "step_title": step.title,
                                "nudge": number,
                                "channels": decision.channels,
                                "time": engine.fmt_ts(now),
                            },
                        )
                    )
                elif decision.wake_at is not None:
                    wakeups.append(decision.wake_at)
        return events

    def _sync_indicators(self) -> None:
        """Switch indicator lights off once no nudged step is waiting any more."""
        if not self.indicator_on:
            return
        waiting = any(
            step.status == engine.STEP_ACTIVE and step.nudge_count > 0
            for run in self.runs.values()
            for step in run.steps
        )
        if waiting:
            return
        lights, self.indicator_on = self.indicator_on, []
        self.hass.async_create_task(self.nudger.async_turn_off_indicators(lights))

    def mark_indicator_on(self, entity_id: str) -> None:
        """Remember that Boopli switched this light on as an indicator."""
        if entity_id not in self.indicator_on:
            self.indicator_on.append(entity_id)
            self._save()

    def _reschedule(self, now: datetime, extra: list[datetime]) -> None:
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None
        wake = engine.next_wakeup(
            list(self.chores.values()), list(self.runs.values()), now, extra
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

    def _clear_notifications_for(self, run: engine.Run) -> None:
        """Remove phone notifications of a run's steps that were nudged."""
        for step in run.steps:
            if step.nudge_count > 0:
                self.hass.async_create_task(
                    self.nudger.async_clear_step(run.id, step.step_id)
                )

    # --- operations ------------------------------------------------------

    def save_settings(self, data: dict[str, Any]) -> None:
        """Replace the settings."""
        settings = engine.Settings.from_dict(data)
        error = engine.validate_settings(settings)
        if error:
            raise BoopliError(error)
        self.settings = settings
        self._watch_presence()
        self._tick()

    def save_chore(self, data: dict[str, Any]) -> engine.Chore:
        """Create or update a chore."""
        chore = engine.Chore.from_dict(data)
        existing = self.chores.get(chore.id) if data.get("id") else None
        if "nudge_style" not in data:
            chore.nudge_style = (
                existing.nudge_style if existing else self.settings.default_style
            )
        error = engine.validate_chore(chore)
        if error:
            raise BoopliError(error)

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
            self._clear_notifications_for(run)
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
        self._tick()
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
        step = next((s for s in run.steps if s.step_id == step_id), None)
        was_nudged = step is not None and step.nudge_count > 0
        events = engine.complete_step(run, step_id, now)
        if not events:
            return  # nothing changed (already done, or not the active step)
        if was_nudged:
            self.hass.async_create_task(self.nudger.async_clear_step(run.id, step_id))
        if run.status == engine.RUN_DONE:
            del self.runs[run.id]
            chore = self.chores.get(run.chore_id)
            if chore and engine.on_run_finished(chore, now, self.tz):
                del self.chores[chore.id]
        self._announce(events)
        self._tick()

    def snooze(self, run_id: str, step_id: str) -> None:
        """Delay the next nudge of a step (the user pressed Snooze)."""
        run = self.runs.get(run_id)
        if run is None:
            return
        step = next((s for s in run.steps if s.step_id == step_id), None)
        if step is None:
            return
        if engine.snooze_step(step, self.settings.snooze_minutes, dt_util.utcnow()):
            if step.nudge_count > 0:
                self.hass.async_create_task(
                    self.nudger.async_clear_step(run.id, step_id)
                )
            self._tick()

    def snooze_chore(self, ref: str) -> None:
        """Snooze the active step of a chore (used by services)."""
        chore = self.find_chore(ref)
        run = self._active_run_for(chore.id)
        step = (
            next((s for s in run.steps if s.status == engine.STEP_ACTIVE), None)
            if run
            else None
        )
        if run is None or step is None:
            raise BoopliError(f"'{chore.name}' has no step waiting for you right now.")
        self.snooze(run.id, step.step_id)

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
            nudge_style=self.settings.default_style,
        )
        error = engine.validate_chore(chore)
        if error:
            raise BoopliError(error)
        self.chores[chore.id] = chore
        return self.start_chore(chore.id)

    async def async_test_channel(self, data: dict[str, Any]) -> dict[str, Any]:
        """Run a test from the Settings screen (kind: light or phone)."""
        kind = data.get("kind")
        if kind == "light":
            light = engine.LightCfg.from_dict(data.get("light") or {})
            if not light.entity_id.startswith("light."):
                raise BoopliError("Pick a light first.")
            return await self.nudger.async_test_light(light)
        if kind == "phone":
            phone = engine.PhoneCfg.from_dict(data.get("phone") or {})
            if not phone.service or phone.level not in engine.LEVEL_VALUES:
                raise BoopliError("Pick a phone and a level first.")
            return await self.nudger.async_test_phone(phone)
        raise BoopliError("Unknown test.")
