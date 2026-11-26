"""The Boopli manager: storage, timers and the operations the API exposes.

It owns all chores, active runs, settings and the completion history. The
pure logic lives in `engine.py`; this module connects it to Home Assistant
(storage, timers, events) and drives the nudger.
"""

from __future__ import annotations

import asyncio
import base64
import binascii
import json
import logging
import os
import time
import uuid
from collections.abc import Callable
from dataclasses import asdict
from datetime import datetime, time as dtime, timedelta, tzinfo
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from aiohttp import web

from homeassistant.components import webhook
from homeassistant.components.http.auth import async_sign_path
from homeassistant.core import CALLBACK_TYPE, Event as HAEvent, HomeAssistant, callback
from homeassistant.exceptions import (
    HomeAssistantError,
    ServiceNotFound,
    ServiceValidationError,
)
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.network import NoURLAvailableError, get_url
from homeassistant.helpers.event import (
    async_call_later,
    async_track_point_in_utc_time,
    async_track_state_change_event,
)
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.util.file import write_utf8_file_atomic

from . import breakdown, engine, routine
from .const import DOMAIN
from .errors import BoopliError, Msg
from .nudger import BoopliNudger

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
STORAGE_KEY = DOMAIN
# The Claude routine's token and webhook id live under their own key, apart from the settings,
# so they are never part of the panel's data, a backup, an export or a "what changed" summary.
SECRET_STORAGE_KEY = f"{DOMAIN}_claude"
SAVE_DELAY = 1  # seconds
HISTORY_MAX = 1000
HISTORY_IN_SNAPSHOT = 200
AI_TIMEOUT = 180  # the longest Boopli waits for the AI agent, in seconds (free models can be slow)
AI_PHOTO_TIMEOUT = 180  # reading photos: the same limit
ALARM_RETRY_SECONDS = (30, 120, 600, 3600)  # tries to switch off an alarm device that was left on
MAX_PHOTOS = 4  # per room, one time
PHOTO_MAX_BYTES = 2_500_000  # each, after the panel shrank it
VIA_AGENT = "agent"  # the user's Home Assistant AI agent (the normal way)
VIA_CLAUDE = "claude"  # the optional Claude routine ("Ask Claude")
PHOTO_LINK_SECONDS = 600  # how long the signed picture links Claude gets work
PHOTO_DIR = "boopli_tmp"  # inside the media folder; emptied right after every request
_PHOTO_KINDS = (  # (magic bytes, extension, mime type)
    (b"\xff\xd8\xff", ".jpg", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", ".png", "image/png"),
)


def _delete_files(paths: list[Path], folder: Path | None = None) -> None:
    """Remove temporary photo files (and the folder when it is empty). Never raises."""
    for path in paths:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            _LOGGER.warning("Could not delete the temporary photo %s", path)
    if folder is not None:
        try:
            folder.rmdir()  # only works when empty, which is what we want
        except OSError:
            pass


class BoopliManager:
    """Holds Boopli's data and keeps its timers running."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.chores: dict[str, engine.Chore] = {}
        self.runs: dict[str, engine.Run] = {}  # active runs only
        self.history: list[engine.HistoryEntry] = []
        self.settings = engine.Settings()
        self.progress = engine.Progress()
        self.away = engine.Away()
        self.setup = engine.Setup()
        self.home = engine.Home()
        self.indicator_on: list[str] = []  # lights Boopli switched on as indicators
        self.alarm_on: list[str] = []  # alarm devices Boopli switched on right now
        self.nudger = BoopliNudger(hass, self)
        self._listeners: list[Callable[[], None]] = []
        self._unsub_timer: CALLBACK_TYPE | None = None
        self._unsub_presence: CALLBACK_TYPE | None = None
        # Steps that finish by themselves (see engine "triggers")
        self._watches: dict[tuple[str, str, int], engine.TriggerWatch] = {}
        self._trigger_entities: frozenset[str] = frozenset()
        self._unsub_trigger_states: CALLBACK_TYPE | None = None
        self._unsub_tags: CALLBACK_TYPE | None = None
        self._alarm_stuck: list[str] = []  # alarm devices that may still be on from before a restart
        self._unsub_alarm_retry: CALLBACK_TYPE | None = None
        # Ask Claude (the optional routine): secret storage, fire counter, waiting requests
        self._secret_store: Store[dict[str, Any]] = Store(
            hass, STORAGE_VERSION, SECRET_STORAGE_KEY, private=True
        )
        self._claude_secrets_ok = True  # False when the secret file could not be read
        self._claude_token = ""
        self._claude_webhook_id = ""
        self._claude_fires = routine.FireCounter()
        self._claude_waiting = routine.Waiting()

    # --- lifecycle -------------------------------------------------------

    @property
    def tz(self) -> tzinfo:
        return dt_util.get_default_time_zone()

    async def async_load(self) -> None:
        """Load stored data, catch up on anything that came due, and start timers."""
        data = await self._store.async_load() or {}
        await self._async_clear_photo_leftovers()
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
        self.setup = (
            engine.Setup.from_dict(data["setup"])
            if "setup" in data
            else engine.initial_setup(data)
        )
        self.home = engine.Home.from_dict(data.get("home"))
        self.sync_areas()
        self.progress = engine.Progress.from_dict(data.get("progress"))
        self.away = engine.Away.from_dict(data.get("away"))
        if not self.progress.started_at:
            self.progress.started_at = engine.fmt_ts(dt_util.utcnow())  # the pet appears
        self.indicator_on = [str(x) for x in data.get("indicator_on", [])]
        # An alarm device still on from before a restart must not stay on.
        # They stay on this list until the "off" call really went out, also across restarts.
        self._alarm_stuck = [str(x) for x in data.get("alarm_on", [])]
        self.alarm_on = []
        # Data saved before nudging existed: an open step has never been nudged.
        for run in self.runs.values():
            for step in run.steps:
                if (
                    step.status == engine.STEP_ACTIVE
                    and step.nudge_count == 0
                    and step.next_nudge_at is None
                ):
                    step.next_nudge_at = step.active_at
        await self._async_load_claude_secrets()
        self.nudger.async_start()
        if self._alarm_stuck:
            self.hass.async_create_task(self._async_release_stuck_alarms(0))
        self._watch_presence()
        self._unsub_tags = self.hass.bus.async_listen("tag_scanned", self._tag_scanned)
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
        if self._unsub_trigger_states:
            self._unsub_trigger_states()
            self._unsub_trigger_states = None
        if self._unsub_tags:
            self._unsub_tags()
            self._unsub_tags = None
        if self._unsub_alarm_retry:
            self._unsub_alarm_retry()
            self._unsub_alarm_retry = None
        self.nudger.async_stop()
        if self._claude_webhook_id:
            webhook.async_unregister(self.hass, self._claude_webhook_id)
        self._listeners.clear()

    # --- persistence and listeners --------------------------------------

    def _data_to_save(self) -> dict[str, Any]:
        return {
            "chores": [engine.to_dict(c) for c in self.chores.values()],
            "runs": [engine.to_dict(r) for r in self.runs.values()],
            "history": [engine.to_dict(h) for h in self.history],
            "settings": engine.to_dict(self.settings),
            "progress": engine.to_dict(self.progress),
            "away": engine.to_dict(self.away),
            "setup": engine.to_dict(self.setup),
            "home": engine.to_dict(self.home),
            "indicator_on": self.indicator_on,
            "alarm_on": self.alarm_on + [x for x in self._alarm_stuck if x not in self.alarm_on],
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

    def pet(self) -> dict[str, Any]:
        """The pet as the panel and the sensors show it."""
        level, into, needed = engine.level_for(self.progress.total_xp)
        has_chores = any(c.enabled for c in self.chores.values())
        now = dt_util.utcnow()
        away = engine.away_in_effect(self.away, now)
        # While away the days do not count: the mood stays as it was when you left.
        progress = engine.shifted_progress(self.progress, self.away.began_at, now) if away else self.progress
        return {
            "away": away,
            "name": self.settings.pet_name,
            "mood": engine.mood_for(progress, now, self.tz, has_chores),
            "level": level,
            "total_xp": self.progress.total_xp,
            "xp_in_level": into,
            "xp_for_level": needed,
            "last_activity": self.progress.last_activity,
        }

    def snapshot(self) -> dict[str, Any]:
        """Everything the panel needs to draw itself."""
        now = dt_util.utcnow()
        return {
            "now": engine.fmt_ts(now),
            "time_zone": str(self.tz),
            "ai_timeout": AI_TIMEOUT,  # so the panel can show how long it will wait
            "claude": self.claude_status(),  # never the token itself, only whether one is set
            "is_home": self.is_home(),
            "pet": self.pet(),
            "away": engine.to_dict(self.away),
            "away_now": engine.away_in_effect(self.away, now),
            "setup": engine.to_dict(self.setup),
            "home": engine.to_dict(self.home),
            "settings": engine.to_dict(self.settings),
            "chores": [engine.to_dict(c) for c in self.chores.values()],
            "runs": [engine.to_dict(r) for r in self.runs.values()],
            "history": [
                engine.to_dict(h) for h in self.history[-HISTORY_IN_SNAPSHOT:]
            ],
        }

    # --- away mode -------------------------------------------------------

    def _paused_run(self, run: engine.Run, now: datetime) -> bool:
        """Whether away mode has this run frozen (chores that keep going are not)."""
        if not engine.away_in_effect(self.away, now):
            return False
        chore = self.chores.get(run.chore_id)
        return not (chore and chore.keeps_going)

    def _away_changes(self, now: datetime, wakeups: list[datetime]) -> list[engine.Event]:
        """Notice that away mode began or ended, and set the timers for its dates."""
        events: list[engine.Event] = []
        change = engine.advance_away(self.away, now)
        if change == "started":
            events.append(
                engine.Event(
                    engine.EVENT_AWAY_STARTED,
                    {"time": engine.fmt_ts(now), "until": self.away.until},
                )
            )
            self._silence_paused(now)
        elif change == "ended":
            events += self._end_away(now)
        if self.away.active:
            for moment in (self.away.start, self.away.until):
                if moment and engine.parse_ts(moment) > now:
                    wakeups.append(engine.parse_ts(moment))
        return events

    def _silence_paused(self, now: datetime) -> None:
        """Away mode began: stop alarms and clear notifications of steps that are now frozen."""
        for run in self.runs.values():
            if not self._paused_run(run, now):
                continue
            for step in run.steps:
                if step.status == engine.STEP_ACTIVE and step.nudge_count > 0:
                    self.hass.async_create_task(
                        self.nudger.async_silence(f"{run.id}:{step.step_id}")
                    )
                    self.hass.async_create_task(
                        self.nudger.async_clear_step(run.id, step.step_id)
                    )

    def _end_away(self, now: datetime) -> list[engine.Event]:
        """Away mode is over (the end came, or you pressed Back now)."""
        began = self.away.began_at
        frozen = [
            r
            for r in self.runs.values()
            if not (self.chores.get(r.chore_id) and self.chores[r.chore_id].keeps_going)
        ]
        engine.return_from_away(
            self.away, self.progress, frozen, list(self.chores.values()), now, self.tz
        )
        self.away = engine.Away()
        if not began:
            return []
        return [engine.Event(engine.EVENT_AWAY_ENDED, {"time": engine.fmt_ts(now), "since": began})]

    def set_away(
        self, start: str = "", until: str = "", keep_going: dict[str, bool] | None = None
    ) -> None:
        """Switch away mode on (or change it): from `start` (empty = now) until `until` (empty = until switched off).

        `keep_going` sets, for the chores named, whether they keep running while away.
        """
        now = dt_util.utcnow()
        try:
            away = engine.set_away(start, until, now, self.tz)
        except ValueError as err:
            raise BoopliError(err) from err
        for chore_id, flag in (keep_going or {}).items():
            chore = self.chores.get(chore_id)
            if chore is not None:
                chore.keeps_going = bool(flag)
        events: list[engine.Event] = []
        if engine.away_in_effect(self.away, now):
            if engine.away_in_effect(away, now):
                away.began_at = self.away.began_at  # changing it while away: the freeze carries on
            else:
                # Moved to a later start: you are back for now, the new period begins by itself.
                events += self._end_away(now)
        self.away = away
        self._announce(events)
        self._tick()

    def end_away(self) -> None:
        """Back now, or cancel away mode that has not begun yet."""
        events: list[engine.Event] = []
        if self.away.active:
            events += self._end_away(dt_util.utcnow())
        self._announce(events)
        self._tick()

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
                        by=event.data.get("by"),
                        reason=event.data.get("reason") or None,
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
        # The pet's mood changes with the date: look again just after midnight.
        local = now.astimezone(self.tz)
        wakeups.append(
            datetime.combine(
                local.date() + timedelta(days=1), dtime(0, 0, 5), tzinfo=self.tz
            )
        )

        events += self._away_changes(now, wakeups)
        away = engine.away_in_effect(self.away, now)

        for run in list(self.runs.values()):
            events += engine.wake_steps(run, now)

        for chore in list(self.chores.values()):
            if away and not chore.keeps_going:
                continue  # resting: nothing starts, nothing is skipped; coming back sorts it out
            action = engine.due_action(
                chore, self._active_run_for(chore.id) is not None, now
            )
            if action == "start":
                try:
                    run, started = engine.start_run(
                        chore, now, None, self.settings.question_wait_minutes
                    )
                except ValueError:  # cannot happen without answers; never lose the schedule over it
                    action = "skip"
                else:
                    self.runs[run.id] = run
                    events += started
                    self._ask_questions(run)
            if action in ("start", "skip"):
                engine.advance_after_due(chore, now, self.tz)

        # Steps that finish by themselves go first, so nothing nudges for a step
        # whose world already says it is done.
        events += self._auto_finish(now, wakeups)
        events += self._nudge_due_steps(now, wakeups)
        self._sync_indicators()
        self._watch_triggers()

        self._announce(events)
        self._reschedule(now, wakeups)
        self._save()
        self._notify()

    # --- steps that finish by themselves ----------------------------------

    def _friendly(self, entity_id: str) -> str:
        state = self.hass.states.get(entity_id)
        return str(state.attributes.get("friendly_name") or entity_id) if state else entity_id

    def _tag_name(self, tag_id: str) -> str:
        for state in self.hass.states.async_all("tag"):
            if state.attributes.get("tag_id") == tag_id:
                return str(state.attributes.get("friendly_name") or tag_id)
        return tag_id

    def _watched(self) -> list[tuple[engine.Run, engine.StepRun, list[engine.Trigger], int, str]]:
        """Steps whose triggers Boopli looks at: (run, step, triggers, watch offset, action).

        An active step with "finishes by itself" triggers is finished when one is met.
        A waiting step with "wait until" triggers is released (its turn begins) instead.
        Their watches are kept apart by the offset.
        """
        result: list[tuple[engine.Run, engine.StepRun, list[engine.Trigger], int, str]] = []
        for run in self.runs.values():
            for step in run.steps:
                if step.status == engine.STEP_ACTIVE and step.triggers:
                    result.append((run, step, step.triggers, 0, "finish"))
                elif step.status == engine.STEP_WAITING and step.wait_for:
                    result.append((run, step, step.wait_for, 100, "release"))
        return result

    def _apply_trigger(
        self, run: engine.Run, step_id: str, action: str, now: datetime, reason: str
    ) -> list[engine.Event]:
        """Finish an active step, or release a waiting one, because its trigger was met."""
        if action == "release":
            return engine.release_step(run, step_id, now)
        return self._finish_step(run, step_id, now, engine.BY_AUTO, reason)

    def _finish_step(
        self,
        run: engine.Run,
        step_id: str,
        now: datetime,
        by: str = engine.BY_MANUAL,
        reason: str = "",
    ) -> list[engine.Event]:
        """Finish a step and clean up after it. The caller announces and ticks."""
        step = next((s for s in run.steps if s.step_id == step_id), None)
        was_nudged = step is not None and step.nudge_count > 0
        events = engine.complete_step(run, step_id, now, by, reason)
        if not events:
            return []  # nothing changed (already done, or not the active step)
        if was_nudged:
            self.hass.async_create_task(self.nudger.async_clear_step(run.id, step_id))
        events += self._award(run, step, now)
        if run.status == engine.RUN_DONE:
            del self.runs[run.id]
            chore = self.chores.get(run.chore_id)
            if chore and engine.on_run_finished(chore, now, self.tz):
                del self.chores[chore.id]
        return events

    def found_egg(self) -> int:
        """The Easter egg was found. The first time it gives a small gift of XP; returns the XP."""
        now = dt_util.utcnow()
        award = engine.award_egg(self.progress, now, self.tz)
        if award.xp <= 0:
            return 0
        self._announce(
            [
                engine.Event(
                    engine.EVENT_XP_GAINED,
                    {
                        "chore_id": "",
                        "chore_name": "Easter egg",
                        "run_id": "",
                        "step_title": None,
                        "xp": award.xp,
                        "total_xp": award.total_xp,
                        "level": award.level,
                        "level_up": award.level_up,
                        "woke_up": False,
                        "mood": award.mood,
                        "time": engine.fmt_ts(now),
                    },
                )
            ]
        )
        self._save()
        self._notify()
        return award.xp

    def _award(
        self, run: engine.Run, step: engine.StepRun | None, now: datetime
    ) -> list[engine.Event]:
        """Give XP for a step that was just finished (by hand or by itself)."""
        award = engine.award_step(
            self.progress,
            run.chore_id,
            run.id,
            now,
            self.tz,
            step.active_at if step else None,
            run.status == engine.RUN_DONE,
            step.size if step else engine.SIZE_SMALL,
        )
        if award.xp <= 0 and not award.woke_up:
            return []
        return [
            engine.Event(
                engine.EVENT_XP_GAINED,
                {
                    "chore_id": run.chore_id,
                    "chore_name": run.chore_name,
                    "run_id": run.id,
                    "step_title": step.title if step else None,
                    "xp": award.xp,
                    "total_xp": award.total_xp,
                    "level": award.level,
                    "level_up": award.level_up,
                    "woke_up": award.woke_up,
                    "mood": award.mood,
                    "time": engine.fmt_ts(now),
                },
            )
        ]

    def _auto_finish(
        self, now: datetime, wakeups: list[datetime]
    ) -> list[engine.Event]:
        """Finish active steps and release waiting steps whose state triggers are met (also chains)."""
        events: list[engine.Event] = []
        for _ in range(engine.MAX_STEPS * 2):  # a chain of steps may all be done already
            watched = self._watched()
            alive = {(run.id, step.step_id) for run, step, _t, _o, _a in watched}
            for key in [k for k in self._watches if k[:2] not in alive]:
                del self._watches[key]
            hit: tuple[engine.Run, str, str, str] | None = None
            for run, step, triggers, offset, action in watched:
                reason = self._check_state_triggers(run, step, triggers, offset, now, wakeups)
                if reason is not None:
                    hit = (run, step.step_id, action, reason)
                    break
            if hit is None:
                break
            events += self._apply_trigger(hit[0], hit[1], hit[2], now, hit[3])
        return events

    def _check_state_triggers(
        self,
        run: engine.Run,
        step: engine.StepRun,
        triggers: list[engine.Trigger],
        offset: int,
        now: datetime,
        wakeups: list[datetime],
    ) -> str | None:
        """Look at the state triggers of one watched step. Return what happened, if anything."""
        found: str | None = None
        for index, trigger in enumerate(triggers):
            if trigger.kind != engine.TRIGGER_STATE:
                continue
            state = self.hass.states.get(trigger.entity_id)
            matched = engine.state_matches(trigger, state.state if state else None)
            watch = self._watches.setdefault(
                (run.id, step.step_id, index + offset), engine.TriggerWatch()
            )
            met = engine.advance_watch(
                trigger,
                watch,
                matched,
                now,
                state.last_changed if state else None,
            )
            if met and found is None:
                found = engine.trigger_reason(
                    trigger, self._friendly(trigger.entity_id), state.state if state else None
                )
            due = engine.watch_due(trigger, watch)
            if due is not None:
                wakeups.append(due)
        return found

    def _watch_triggers(self) -> None:
        """Listen to the entities of the steps that are waiting to finish by themselves."""
        wanted = frozenset(
            t.entity_id
            for _run, _step, triggers, _offset, _action in self._watched()
            for t in triggers
            if t.kind in (engine.TRIGGER_STATE, engine.TRIGGER_BUTTON) and t.entity_id
        )
        if wanted == self._trigger_entities:
            return
        if self._unsub_trigger_states:
            self._unsub_trigger_states()
            self._unsub_trigger_states = None
        self._trigger_entities = wanted
        if wanted:
            self._unsub_trigger_states = async_track_state_change_event(
                self.hass, list(wanted), self._trigger_entity_changed
            )

    @callback
    def _trigger_entity_changed(self, event: HAEvent) -> None:
        entity_id = event.data.get("entity_id", "")
        old = event.data.get("old_state")
        new = event.data.get("new_state")
        now = dt_util.utcnow()
        events: list[engine.Event] = []
        need_tick = False
        for run, step, triggers, offset, action in self._watched():
            for index, trigger in enumerate(triggers):
                if trigger.entity_id != entity_id:
                    continue
                if trigger.kind == engine.TRIGGER_BUTTON:
                    if engine.button_pressed(
                        trigger,
                        old.state if old else None,
                        new.state if new else None,
                        new.attributes.get("event_type") if new else None,
                    ):
                        events += self._apply_trigger(
                            run,
                            step.step_id,
                            action,
                            now,
                            engine.trigger_reason(trigger, self._friendly(entity_id)),
                        )
                        break
                elif trigger.kind == engine.TRIGGER_STATE:
                    # Only look again when the answer to "does it match?" changed:
                    # a sensor that reports every few seconds must not wake us each time.
                    watch = self._watches.get((run.id, step.step_id, index + offset))
                    was = watch is not None and (watch.since is not None or watch.blocked)
                    is_now = engine.state_matches(trigger, new.state if new else None)
                    if watch is None or was != is_now:
                        need_tick = True
        if events:
            self._announce(events)
        if events or need_tick:
            self._tick()

    @callback
    def _tag_scanned(self, event: HAEvent) -> None:
        tag_id = str(event.data.get("tag_id", ""))
        if not tag_id:
            return
        now = dt_util.utcnow()
        events: list[engine.Event] = []
        for run, step, triggers, _offset, action in self._watched():
            for trigger in triggers:
                if engine.tag_matches(trigger, tag_id):
                    events += self._apply_trigger(
                        run,
                        step.step_id,
                        action,
                        now,
                        engine.trigger_reason(trigger, self._tag_name(tag_id)),
                    )
                    break
        if events:
            self._announce(events)
            self._tick()

    def style_for(self, run: engine.Run) -> str:
        """The nudge style of the chore a run belongs to (the default when the chore is gone)."""
        chore = self.chores.get(run.chore_id)
        style = chore.nudge_style if chore else self.settings.default_style
        return engine.normalize_style(style, self.settings.ladders)

    def _nudge_due_steps(
        self, now: datetime, wakeups: list[datetime]
    ) -> list[engine.Event]:
        """Send the nudges that are due and collect when to look again."""
        events: list[engine.Event] = []
        home = self.is_home()
        for run in self.runs.values():
            chore = self.chores.get(run.chore_id)
            style = engine.normalize_style(
                chore.nudge_style if chore else self.settings.default_style, self.settings.ladders
            )
            ignore_quiet = chore.ignore_quiet_hours if chore else False
            if self._paused_run(run, now):
                continue  # away: frozen, nothing nudges until you are back
            if engine.nudges_held(run, now):
                # Waiting for the answers to the questions; look again when that wait is over.
                wakeups.append(engine.parse_ts(run.asking_until or ""))
                continue
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
                    check_in = engine.in_progress(step)  # the "still on it?" after "On it"
                    step.on_it_until = None  # asked now: back to the normal look
                    ladder = engine.find_ladder(style, self.settings.ladders)
                    rung = engine.rung_for(ladder, number) if ladder else None
                    if ladder and rung is None and ladder.rungs and not check_in:
                        rung = ladder.rungs[-1]  # a snooze after the last nudge: same as that nudge, nothing else
                    if ladder and check_in:
                        # The check-in is not a nudge of the ladder: the next nudge stays available.
                        number = max(step.nudge_count, 1)
                        gap = engine.next_gap(style, step.nudge_count, self.settings.ladders)
                        step.next_nudge_at = engine.fmt_ts(now + timedelta(minutes=gap)) if gap else None
                    else:
                        engine.record_nudge(step, style, now, self.settings.ladders)
                    if step.next_nudge_at:
                        wakeups.append(engine.parse_ts(step.next_nudge_at))
                    if check_in:
                        self.hass.async_create_task(
                            self.nudger.async_send_check_in(
                                run.id,
                                run.chore_name,
                                step.step_id,
                                step.title,
                                number,
                                step.image,
                            )
                        )
                    else:
                        self.hass.async_create_task(
                            self.nudger.async_send(
                                run.id,
                                run.chore_name,
                                step.step_id,
                                step.title,
                                decision.channels,
                                number,
                                step.image,
                                rung,
                                chore.light_color if chore else None,
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
                                "check_in": check_in,
                                "channels": engine.CHANNELS_PHONE_ONLY if check_in else decision.channels,
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
        now = dt_util.utcnow()
        waiting = any(
            step.status == engine.STEP_ACTIVE
            and step.nudge_count > 0
            and not engine.in_progress(step)  # "On it": nothing is nagging any more
            for run in self.runs.values()
            if not self._paused_run(run, now)
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

    def mark_alarm_on(self, entity_id: str) -> None:
        """Remember that Boopli switched this alarm device on (restart safety)."""
        if entity_id not in self.alarm_on:
            self.alarm_on.append(entity_id)
            self._store.async_delay_save(self._data_to_save, 0)

    def unmark_alarm_on(self, entity_id: str) -> None:
        if entity_id in self.alarm_on:
            self.alarm_on.remove(entity_id)
            self._save()

    def keep_alarm_marked(self, entity_id: str) -> None:
        """The "off" call for this device did not go out: keep it listed and try again later."""
        if entity_id in self.alarm_on:
            self.alarm_on.remove(entity_id)
        if entity_id not in self._alarm_stuck:
            self._alarm_stuck.append(entity_id)
        self._store.async_delay_save(self._data_to_save, 0)
        self._schedule_alarm_retry(0)

    def _schedule_alarm_retry(self, attempt: int) -> None:
        if self._unsub_alarm_retry or attempt >= len(ALARM_RETRY_SECONDS):
            return

        @callback
        def _again(_now: datetime) -> None:
            self._unsub_alarm_retry = None
            self.hass.async_create_task(self._async_release_stuck_alarms(attempt + 1))

        self._unsub_alarm_retry = async_call_later(self.hass, ALARM_RETRY_SECONDS[attempt], _again)

    async def _async_release_stuck_alarms(self, attempt: int) -> None:
        """Switch off alarm devices that may have been left on; retry the ones that fail."""
        if not self._alarm_stuck:
            return
        self._alarm_stuck = await self.nudger.async_turn_off_alarm_devices(list(self._alarm_stuck))
        self._store.async_delay_save(self._data_to_save, 0)
        if self._alarm_stuck:
            self._schedule_alarm_retry(attempt)

    def _reschedule(self, now: datetime, extra: list[datetime]) -> None:
        if self._unsub_timer:
            self._unsub_timer()
            self._unsub_timer = None
        away = engine.away_in_effect(self.away, now)
        # While away, chores that rest are not watched: their due times are sorted out on return.
        chores = [c for c in self.chores.values() if c.keeps_going or not away]
        wake = engine.next_wakeup(chores, list(self.runs.values()), now, extra)
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
            raise BoopliError("No chore called '{ref}'.", ref=ref)
        if len(matches) > 1:
            raise BoopliError("More than one chore is called '{ref}'. Use its id.", ref=ref)
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
        if (gone := engine.deleted_standard_ladder(self.settings, settings)) is not None:
            raise BoopliError("You can edit the built-in nudge sequence “{gone}.” Keep it in your list.", gone=gone)
        error = engine.validate_settings(settings)
        if error:
            raise BoopliError(error)
        try:
            settings.ai.claude_fire_url = routine.clean_fire_url(settings.ai.claude_fire_url)
            settings.ai.claude_ha_url = routine.clean_ha_url(settings.ai.claude_ha_url)
        except routine.RoutineError as err:
            raise BoopliError(err) from err
        # A ladder that chores use cannot be deleted: say which chores, and leave everything as it was.
        kept = {ladder.id for ladder in settings.ladders}
        for ladder in self.settings.ladders:
            if ladder.id in kept:
                continue
            users = engine.chores_using(ladder.id, self.chores.values())
            if users:
                raise BoopliError(
                    "These chores use the nudge sequence “{name}”: {users}. Choose another nudge style for them first.", name=ladder.name, users=', '.join(users)
                )
        # Devices added now act in the standard ladders the way they used to (their "starts at nudge").
        engine.sync_phone_levels_to_standard_ladders(self.settings, settings)
        engine.add_new_devices_to_standard_ladders(self.settings, settings)
        settings.default_style = engine.normalize_style(settings.default_style, settings.ladders)
        self.settings = settings
        self._watch_presence()
        self._tick()

    def preview_schedule(self, data: dict[str, Any], count: int = 5) -> list[str]:
        """The next moments a repeat rule would come due (for the schedule wizard)."""
        repeat = engine.Repeat.from_dict(data)
        error = engine.validate_repeat(repeat)
        if error:
            raise BoopliError(error)
        moments = engine.preview_schedule(repeat, dt_util.utcnow(), self.tz, count)
        return [engine.fmt_ts(m) for m in moments]

    def save_setup(self, data: dict[str, Any]) -> None:
        """Remember how far the setup wizard got."""
        setup = engine.Setup.from_dict(data)
        if data.get("status") not in engine.SETUP_STATUSES:
            raise BoopliError("Unknown setup status.")
        error = engine.validate_setup(setup)
        if error:
            raise BoopliError(error)
        self.setup = setup
        self._save()
        self._notify()

    def save_chore(self, data: dict[str, Any]) -> engine.Chore:
        """Create or update a chore."""
        chore = engine.Chore.from_dict(data)
        existing = self.chores.get(chore.id) if data.get("id") else None
        if "nudge_style" not in data:
            chore.nudge_style = (
                existing.nudge_style if existing else self.settings.default_style
            )
        error = engine.validate_chore(chore, [lad.id for lad in self.settings.ladders])
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

    def skip_round(self, chore_id: str) -> None:
        """Skip this round of a chore (a deliberate button in the panel, never on a notification).

        A run in progress is dropped without XP; with no run, the coming round is skipped.
        """
        chore = self.find_chore(chore_id)
        run = self._active_run_for(chore.id)
        try:
            engine.skip_round(chore, run is not None, dt_util.utcnow(), self.tz)
        except ValueError as err:
            raise BoopliError("'{name}' has no round to skip.", name=chore.name) from err
        if run is not None:
            self._clear_notifications_for(run)
            del self.runs[run.id]
        self._tick()

    def start_chore(self, ref: str, answers: dict[str, bool] | None = None) -> engine.Run:
        """Start a chore now (for on-demand chores). Idempotent while running.

        The panel asks the chore's questions first and passes the `answers`. Started
        without answers (a service call), a chore with questions starts with all steps
        and asks them afterwards, like a chore that starts by itself.
        """
        chore = self.find_chore(ref)
        existing = self._active_run_for(chore.id)
        if existing:
            return existing
        now = dt_util.utcnow()
        try:
            run, events = engine.start_run(
                chore, now, answers, self.settings.question_wait_minutes
            )
        except ValueError as err:
            raise BoopliError(err) from err
        self.runs[run.id] = run
        self._announce(events)
        self._ask_questions(run)
        self._tick()
        return run

    def _ask_questions(self, run: engine.Run) -> None:
        """A run started with its questions still open: tell the phones so you can answer them."""
        if not run.questions_open:
            return
        self.hass.async_create_task(self.nudger.async_send_questions(run))

    def answer_questions(self, run_id: str, answers: dict[str, bool]) -> None:
        """Answer the questions of a run (or start it with all steps: answer nothing)."""
        run = self.runs.get(run_id)
        if run is None:
            return  # already over: answering twice is harmless
        events = engine.answer_questions(run, answers, dt_util.utcnow())
        if not events:
            return
        self.hass.async_create_task(self.nudger.async_clear_step(run.id, engine.QUESTIONS_STEP))
        if run.status == engine.RUN_DONE:
            del self.runs[run.id]
            chore = self.chores.get(run.chore_id)
            if chore and engine.on_run_finished(chore, dt_util.utcnow(), self.tz):
                del self.chores[chore.id]
        self._announce(events)
        self._tick()

    def park_part(self, run_id: str, group: str, when: str, at: str = "") -> engine.Chore:
        """Set a part of a running task aside as a small task of its own, to do later.

        Nothing is deleted: the part's open steps move into a new task that starts
        by itself at the chosen time, or waits until the user starts it.
        """
        run = self.runs.get(run_id)
        if run is None:
            raise BoopliError("That chore is no longer in progress.")
        now = dt_util.utcnow()
        try:
            due = engine.park_time(when, at, now, self.tz)
            steps, events = engine.park_part(run, group, now)
        except ValueError as err:
            raise BoopliError(err) from err
        chore = engine.parked_chore(run, self.chores.get(run.chore_id), group.strip(), steps, due, now)
        self.chores[chore.id] = chore
        self._announce(events)
        self._tick()
        return chore

    def set_parked_time(self, chore_id: str, when: str, at: str = "") -> None:
        """Change when a parked part comes back (or make it wait for the user again)."""
        chore = self.chores.get(chore_id)
        if chore is None or not chore.parked or self._active_run_for(chore.id):
            raise BoopliError("That part is not waiting any more.")
        try:
            chore.next_due = engine.park_time(when, at, dt_util.utcnow(), self.tz)
        except ValueError as err:
            raise BoopliError(err) from err
        self._tick()

    def park_part(self, run_id: str, group: str, when: str, at: str = "") -> engine.Chore:
        """Set a part of a running task aside as a small task of its own, to do later.

        Nothing is deleted: the part's open steps move into a new task that starts
        by itself at the chosen time, or waits until the user starts it.
        """
        run = self.runs.get(run_id)
        if run is None:
            raise BoopliError("That chore is no longer in progress.")
        now = dt_util.utcnow()
        try:
            due = engine.park_time(when, at, now, self.tz)
            steps, events = engine.park_part(run, group, now)
        except ValueError as err:
            raise BoopliError(err) from err
        chore = engine.parked_chore(run, self.chores.get(run.chore_id), group.strip(), steps, due, now)
        self.chores[chore.id] = chore
        self._announce(events)
        self._tick()
        return chore

    def set_parked_time(self, chore_id: str, when: str, at: str = "") -> None:
        """Change when a parked part comes back (or make it wait for the user again)."""
        chore = self.chores.get(chore_id)
        if chore is None or not chore.parked or self._active_run_for(chore.id):
            raise BoopliError("That part is not waiting any more.")
        try:
            chore.next_due = engine.park_time(when, at, dt_util.utcnow(), self.tz)
        except ValueError as err:
            raise BoopliError(err) from err
        self._tick()

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
            raise BoopliError("'{name}' has nothing in progress.", name=chore.name)
        step = next((s for s in run.steps if s.status == engine.STEP_ACTIVE), None)
        if step is None:
            raise BoopliError("'{name}' has no step waiting for you right now.", name=chore.name)
        self._complete(run, step.step_id)

    def _complete(self, run: engine.Run, step_id: str) -> None:
        events = self._finish_step(run, step_id, dt_util.utcnow())
        if not events:
            return
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

    def _find_step(self, run_id: str, step_id: str) -> tuple[engine.Run, engine.StepRun] | None:
        run = self.runs.get(run_id)
        if run is None:
            return None
        step = next((s for s in run.steps if s.step_id == step_id), None)
        return (run, step) if step else None

    def on_it(self, run_id: str, step_id: str) -> None:
        """"On it" / "Still on it": the person is doing this step. Quiet until the check-in."""
        found = self._find_step(run_id, step_id)
        if found is None:
            return
        run, step = found
        now = dt_util.utcnow()
        if not engine.start_on_it(step, self.settings.check_in_minutes, now):
            return
        self.hass.async_create_task(self.nudger.async_show_on_it(run, step))
        self._announce(
            [
                engine.Event(
                    engine.EVENT_STEP_ON_IT,
                    {
                        "chore_id": run.chore_id,
                        "chore_name": run.chore_name,
                        "run_id": run.id,
                        "step_id": step.step_id,
                        "step_title": step.title,
                        "check_in": step.on_it_until,
                        "time": engine.fmt_ts(now),
                    },
                )
            ]
        )
        self._tick()

    def not_on_it(self, run_id: str, step_id: str) -> None:
        """Taken back: normal nudging again, right away."""
        found = self._find_step(run_id, step_id)
        if found is None:
            return
        run, step = found
        if engine.stop_on_it(step, dt_util.utcnow()):
            # The green notification goes; the nudge that follows at once replaces it with a normal one.
            self.hass.async_create_task(self.nudger.async_clear_step(run.id, step_id))
            self._tick()

    def _active_step_of(self, ref: str) -> tuple[engine.Run, engine.StepRun]:
        chore = self.find_chore(ref)
        run = self._active_run_for(chore.id)
        step = (
            next((s for s in run.steps if s.status == engine.STEP_ACTIVE), None) if run else None
        )
        if run is None or step is None:
            raise BoopliError("'{name}' has no step waiting for you right now.", name=chore.name)
        return run, step

    def on_it_chore(self, ref: str) -> None:
        """"On it" for the active step of a chore (used by services)."""
        run, step = self._active_step_of(ref)
        self.on_it(run.id, step.step_id)

    def not_on_it_chore(self, ref: str) -> None:
        run, step = self._active_step_of(ref)
        self.not_on_it(run.id, step.step_id)

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
            raise BoopliError("'{name}' has no step waiting for you right now.", name=chore.name)
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
        error = engine.validate_chore(chore, [lad.id for lad in self.settings.ladders])
        if error:
            raise BoopliError(error)
        self.chores[chore.id] = chore
        return self.start_chore(chore.id)

    # --- AI help: splitting a task into small steps -----------------------------

    def _with_language(self, instructions: str) -> str:
        """The prompts are written in English. For another language, the agent is asked to write what the person reads in it."""
        language = self.hass.config.language
        if not isinstance(language, str) or language.lower().split("-")[0] in ("", "en"):
            return instructions
        return (
            f"{instructions}\n\n"
            "Write everything the person will read (questions, the answers to pick from, step titles, notes) "
            f'in the language with the code "{language}". Keep the JSON keys and the other fixed words exactly as asked.'
        )

    async def _run_agent(
        self,
        name: str,
        instructions: str,
        attachments: list[dict[str, str]] | None = None,
        entity_id: str = "",
        timeout: int = AI_TIMEOUT,
    ) -> Any:
        """Ask the user's own AI agent (Home Assistant's AI Task) and return its data."""
        instructions = self._with_language(instructions)
        ai = self.settings.ai
        if not ai.enabled:
            raise BoopliError("AI help is switched off. Turn it on in Settings first.")
        # No forced structure: the prompts ask for JSON as plain text, which every
        # model handles (a forced single-field structure made a real model answer "...").
        call: dict[str, Any] = {"task_name": name, "instructions": instructions}
        if attachments:
            call["attachments"] = attachments
        if entity_id or ai.entity_id:
            call["entity_id"] = entity_id or ai.entity_id
        try:
            async with asyncio.timeout(timeout):
                response = await self.hass.services.async_call(
                    "ai_task",
                    "generate_data",
                    call,
                    blocking=True,
                    return_response=True,
                )
        except TimeoutError as err:
            raise BoopliError(
                "The AI agent took too long (over {timeout} seconds). Try again.", timeout=timeout
            ) from err
        except ServiceNotFound as err:
            raise BoopliError(
                "Home Assistant has no AI Task yet. Set up an AI agent first."
            ) from err
        except ServiceValidationError as err:
            if getattr(err, "translation_key", "") == "attachments_not_supported":
                raise BoopliError(
                    "This AI agent can’t analyze photos. Choose one that can in Settings → AI help → Advanced, or continue without photos."
                ) from err
            raise BoopliError("The AI agent answered with an error: {error}", error=err) from err
        except HomeAssistantError as err:
            # The agent's own reason is the useful part ("credits depleted", "model gone").
            raise BoopliError("The AI agent answered with an error: {error}", error=err) from err
        return (response or {}).get("data")

    # --- Ask Claude: the optional extra through the user's own Claude routine ------------

    async def _async_load_claude_secrets(self) -> None:
        """Load the token and webhook id, make the webhook id if there is none, open the webhook."""
        try:
            secrets = await self._secret_store.async_load() or {}
        except Exception as err:  # noqa: BLE001 - the optional extra must never stop the core
            # Keep the unreadable file as it is (it may be from a newer version) and run
            # without Ask Claude.
            _LOGGER.error("Could not read the Ask Claude secrets, Ask Claude stays off: %s", err)
            self._claude_secrets_ok = False
            return
        self._claude_token = str(secrets.get("token") or "")
        self._claude_webhook_id = str(secrets.get("webhook_id") or "")
        if not self._claude_webhook_id:
            self._claude_webhook_id = webhook.async_generate_id()
            try:
                await self._async_save_claude_secrets()
            except Exception as err:  # noqa: BLE001
                _LOGGER.error("Could not save the Ask Claude secrets, Ask Claude stays off: %s", err)
                self._claude_secrets_ok = False
                self._claude_webhook_id = ""
                return
        webhook.async_register(
            self.hass,
            DOMAIN,
            "Boopli: answer from Claude",
            self._claude_webhook_id,
            self._handle_claude_webhook,
            local_only=False,  # the routine runs in Claude's cloud
            allowed_methods=["POST"],
        )

    async def _async_save_claude_secrets(self, token: str | None = None) -> None:
        """Write the secret file. Raises when the write fails.

        Home Assistant's own Store.async_save logs a failed write and carries on, so it cannot
        tell us the token did not reach the disk. The file is written here instead, in the
        same format, so the Store still reads it back.
        """
        envelope = {
            "version": STORAGE_VERSION,
            "minor_version": 1,
            "key": SECRET_STORAGE_KEY,
            "data": {
                "token": self._claude_token if token is None else token,
                "webhook_id": self._claude_webhook_id,
            },
        }
        await self.hass.async_add_executor_job(self._write_secret_file, json.dumps(envelope))

    def _write_secret_file(self, text: str) -> None:
        os.makedirs(os.path.dirname(self._secret_store.path), exist_ok=True)
        write_utf8_file_atomic(self._secret_store.path, text, private=True)

    def _claude_callback_host(self) -> str:
        """The host name Claude reaches Home Assistant at (what its network settings must allow)."""
        try:
            return urlparse(self._claude_base_url()).hostname or ""
        except (BoopliError, ValueError):
            return ""

    def claude_status(self) -> dict[str, Any]:
        """What the panel may know: whether a token is set and how many asks are left this hour."""
        return {
            "token_set": bool(self._claude_token),
            "callback_host": self._claude_callback_host(),
            "fires_left": self._claude_fires.left(),
            "fires_per_hour": self._claude_fires.limit,
            "wait_seconds": routine.WAIT_SECONDS,
        }

    async def async_set_claude_token(self, token: str) -> None:
        """Store the routine's token (an empty one removes it)."""
        try:
            new = routine.clean_token(token)
        except routine.RoutineError as err:
            raise BoopliError(err) from err
        if not self._claude_secrets_ok:
            raise BoopliError(
                "Boopli could not read its saved Ask Claude settings, so it will not overwrite them. "
                "Check the Home Assistant log."
            )
        # The new token only becomes active once it is saved: a failed save changes nothing.
        try:
            await self._async_save_claude_secrets(new)
        except Exception as err:  # noqa: BLE001 - any storage problem must leave the old token alone
            _LOGGER.error("Could not save the Claude token: %s", err)
            raise BoopliError("Boopli could not save the token. The old one is still in use.") from err
        self._claude_token = new
        self._notify()

    def _claude_base_url(self) -> str:
        """The web address Claude reaches Home Assistant at (no slash at the end)."""
        base = self.settings.ai.claude_ha_url
        if base:
            try:
                # Also checks values that came in from a stored or imported file.
                return routine.clean_ha_url(base)
            except routine.RoutineError as err:
                raise BoopliError(err) from err
        try:
            return get_url(self.hass, allow_internal=False, prefer_external=True).rstrip("/")
        except NoURLAvailableError as err:
            raise BoopliError(
                "Home Assistant has no web address that Claude can reach. "
                "Fill in the Home Assistant address under Ask Claude, or set the "
                "external URL in Home Assistant."
            ) from err

    def _claude_answer_url(self) -> str:
        return f"{self._claude_base_url()}/api/webhook/{self._claude_webhook_id}"

    def _signed_photo_urls(self, dir_id: str, names: list[str]) -> list[str]:
        """Links Claude can fetch the photos from. Each stops working after a few minutes."""
        base = self._claude_base_url()
        return [
            base
            + async_sign_path(
                self.hass,
                f"/media/{dir_id}/{PHOTO_DIR}/{name}",
                timedelta(seconds=PHOTO_LINK_SECONDS),
            )
            for name in names
        ]

    async def _handle_claude_webhook(
        self, hass: HomeAssistant, webhook_id: str, request: web.Request
    ) -> web.Response:
        """The routine posts {request_id, answer} here. Each request id is accepted once."""
        limit = routine.MAX_ANSWER_BYTES
        if request.content_length and request.content_length > limit:
            return web.Response(status=413)
        # A chunked body has no declared size: read at most one byte over the limit.
        raw = await request.content.read(limit + 1)
        if len(raw) > limit:
            return web.Response(status=413)
        try:
            body = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return web.Response(status=400, text="Send JSON.")
        if not isinstance(body, dict) or "answer" not in body:
            return web.Response(status=400, text="Send {request_id, answer}.")
        if not self._claude_waiting.answer(str(body.get("request_id") or ""), body["answer"]):
            return web.Response(status=404, text="Nobody is waiting for that answer.")
        return web.Response(status=200, text="ok")

    async def async_ask_claude(
        self, instructions: str, photo_urls: list[str] | None = None
    ) -> Any:
        """Fire the routine with the task, wait for its answer, return the answer's data."""
        instructions = self._with_language(instructions)
        ai = self.settings.ai
        if not ai.claude_enabled:
            raise BoopliError("Ask Claude is switched off. Turn it on in Settings first.")
        if not ai.claude_fire_url or not self._claude_token:
            raise BoopliError(
                "Ask Claude is not set up yet. Add the routine trigger URL and token in Settings."
            )
        try:
            # The token only ever goes to a real routine address, also when the setting came
            # from an imported backup file instead of the normal save.
            fire_url = routine.clean_fire_url(ai.claude_fire_url)
        except routine.RoutineError as err:
            raise BoopliError(err) from err
        answer_url = self._claude_answer_url()
        request_id, future = self._claude_waiting.new()
        try:
            # Everything that can be refused comes before a fire is counted or sent.
            text = routine.fire_text(instructions, request_id, answer_url, photo_urls or [])
            self._claude_fires.take()
            self._notify()  # the panel shows how many asks are left this hour
            await routine.fire(async_get_clientsession(self.hass), fire_url, self._claude_token, text)
            return await routine.wait_for_answer(future)
        except routine.RoutineError as err:
            raise BoopliError(err) from err
        finally:
            self._claude_waiting.drop(request_id)

    async def async_test_claude(self) -> dict[str, Any]:
        """Ask the routine for a tiny answer and say how long the round trip took."""
        started = time.monotonic()
        data = await self.async_ask_claude(
            'This is a connection test from Boopli. Answer with {"ok": true} and nothing else.'
        )
        if not data:
            raise BoopliError("Claude answered, but the answer was empty.")
        return {"seconds": round(time.monotonic() - started, 1)}

    async def _run(
        self,
        via: str,
        name: str,
        instructions: str,
        attachments: list[dict[str, str]] | None = None,
        entity_id: str = "",
        timeout: int = AI_TIMEOUT,
    ) -> Any:
        """Ask the user's AI agent, or (via "claude") the Claude routine; return the answer's data."""
        if via == VIA_CLAUDE:
            return await self.async_ask_claude(instructions)
        return await self._run_agent(name, instructions, attachments, entity_id, timeout)

    @staticmethod
    def _check_via(via: str) -> str:
        if via not in (VIA_AGENT, VIA_CLAUDE):
            raise BoopliError("Choose your AI agent or Claude.")
        return via

    @staticmethod
    def _check_kind(kind: str) -> str:
        if kind not in breakdown.KINDS:
            raise BoopliError("The kind must be 'now' or 'recurring'.")
        return kind

    # --- My home: rooms and their notes ---------------------------------------------

    def sync_areas(self) -> bool:
        """Add a room for every Home Assistant area that has none yet."""
        registry = ar.async_get(self.hass)
        areas = [(a.id, a.name) for a in registry.async_list_areas()]
        changed = engine.merge_areas(self.home, areas)
        if changed:
            self._save()
        return changed

    def save_home(self, data: dict[str, Any]) -> None:
        """Replace the rooms and the on/off switch."""
        home = engine.Home.from_dict(data)
        error = engine.validate_home(home)
        if error:
            raise BoopliError(error)
        self.home = home
        self.sync_areas()
        self._save()
        self._notify()

    # --- backup of the setup -----------------------------------------------------------

    def export_backup(self, parts: list[str], boopli_version: str) -> dict[str, Any]:
        """The backup file (as plain data) with the parts that were asked for."""
        wanted = [p for p in engine.BACKUP_PARTS if p in parts]
        if not wanted:
            raise BoopliError("Pick at least one part to back up.")
        try:
            return engine.build_backup(
                wanted,
                settings=self.settings,
                chores=self.chores.values(),
                home=self.home,
                progress=self.progress,
                history=self.history,
                boopli_version=boopli_version,
                exported_at=engine.fmt_ts(dt_util.utcnow()),
            )
        except engine.BackupError as err:
            raise BoopliError(err) from err

    def _parse_backup(self, data: Any) -> engine.Backup:
        """Read a backup file and check what is in it. Changes nothing."""
        try:
            return engine.parse_backup(data, [lad.id for lad in self.settings.ladders])
        except engine.BackupError as err:
            raise BoopliError(err) from err

    def _read_backup(self, data: Any, parts: list[str]) -> engine.Backup:
        """Read a backup file, and check that the parts picked fit together. Changes nothing."""
        backup = self._parse_backup(data)
        error = engine.check_backup_selection(backup, parts, self.settings, self.chores.values())
        if error:
            raise BoopliError(error)
        return backup

    def preview_backup(self, data: Any, parts: list[str]) -> dict[str, Any]:
        """What importing would do: what is in the file, what this install lacks, what would end.

        No parts picked means "show me what is in the file": all of them are looked at. A pick that does not
        fit together is not an error here, it is reported (`selection_error`) so the window can keep the list.
        """
        backup = self._parse_backup(data)
        chosen = parts or backup.parts
        selection_error = engine.check_backup_selection(backup, chosen, self.settings, self.chores.values())
        entities, services = engine.backup_references(
            backup.settings if "settings" in chosen else None,
            backup.chores if "chores" in chosen else None,
        )
        missing_entities = [e for e in entities if self.hass.states.get(e) is None]
        missing_services = [s for s in services if not self.hass.services.has_service("notify", s)]
        runs_ended = 0
        if "chores" in chosen and backup.chores is not None:
            kept = {c.id for c in backup.chores}
            runs_ended = sum(1 for r in self.runs.values() if r.chore_id not in kept)
        level = engine.level_for(backup.progress.total_xp)[0] if backup.progress else 0
        return {
            "parts": backup.parts,
            "exported_at": backup.exported_at,
            "boopli_version": backup.boopli_version,
            "counts": {
                "chores": len(backup.chores or []),
                "rooms": len(backup.home.rooms) if backup.home else 0,
                "boards": len(backup.settings.boards) if backup.settings else 0,
                "history": len(backup.history or []),
                "level": level,
            },
            "missing_entities": missing_entities[:20],
            "missing_entities_total": len(missing_entities),
            "missing_services": missing_services[:20],
            "runs_ended": runs_ended,
            "selection_error": selection_error or "",
            # the settings as an import would apply them (missing keys filled in), for the list of changes
            "settings": engine.to_dict(backup.settings) if backup.settings else None,
        }

    def import_backup(self, data: Any, parts: list[str]) -> dict[str, Any]:
        """Replace the parts picked with what the backup file holds. All or nothing."""
        if not parts:
            raise BoopliError("Pick at least one part to import.")
        backup = self._read_backup(data, parts)
        chosen = parts
        now = dt_util.utcnow()
        runs_ended = 0
        if "settings" in chosen and backup.settings is not None:
            self.settings = backup.settings
            if self.setup.status != engine.SETUP_DONE:
                self.setup = engine.Setup(status=engine.SETUP_DONE)  # no first-run guide for someone who just moved in
        if "chores" in chosen and backup.chores is not None:
            new: dict[str, engine.Chore] = {}
            for chore in backup.chores:
                engine.settle_imported_chore(chore, now, self.tz)
                new[chore.id] = chore
            # A run that was going on for a chore that is not in the backup ends with it.
            for run in [r for r in self.runs.values() if r.chore_id not in new]:
                self._clear_notifications_for(run)
                del self.runs[run.id]
                runs_ended += 1
            self.chores = new
        if "home" in chosen and backup.home is not None:
            self.home = backup.home
            self.sync_areas()
        if "pet" in chosen and backup.progress is not None:
            self.progress = backup.progress
            if not self.progress.started_at:
                self.progress.started_at = engine.fmt_ts(now)
            self.history = backup.history or []
        self._watch_presence()
        self._tick()
        self._store.async_delay_save(self._data_to_save, 0)
        return {
            "imported": [p for p in engine.BACKUP_PARTS if p in chosen],
            "chores": len(self.chores),
            "runs_ended": runs_ended,
        }

    def _rooms_for(self, task: str, rooms: list[str] | None) -> list[engine.Room]:
        """The rooms whose notes go with a request. None = guess from the task text.

        Entries may be room ids or names (a service call has no ids at hand).
        """
        usable = [r for r in self.home.rooms if not r.hidden]
        if rooms is None:
            wanted = set(breakdown.guess_rooms(task, [(r.id, r.name) for r in usable]))
            return [r for r in usable if r.id in wanted]
        wanted_names = {" ".join(str(x).lower().split()) for x in rooms}
        return [r for r in usable if r.id in rooms or r.name.lower() in wanted_names]

    def rooms_text(self, task: str, rooms: list[str] | None) -> tuple[str, bool]:
        """The notes block that is added to a request, and whether a note was shortened."""
        if not self.home.enabled:
            return "", False
        chosen = self._rooms_for(task, rooms)
        return breakdown.rooms_text([(r.name, r.notes) for r in chosen])

    def guess_rooms(self, task: str) -> list[str]:
        return [r.id for r in self._rooms_for(task, None)]

    def ai_preview(
        self,
        task: str,
        kind: str,
        answers: Any,
        notes: str,
        rooms: list[str] | None,
        scene: str = "",
    ) -> dict[str, Any]:
        """Exactly what the first request to the AI would contain."""
        text, shortened = self.rooms_text(task, rooms)
        instructions = breakdown.questions_instructions(
            breakdown.clean_text(task, breakdown.TITLE_MAX) or "(your task)",
            self._check_kind(kind),
            answers,
            notes,
            self.settings.ai.questions_prompt,
            text,
            scene,
        )
        return {
            "instructions": self._with_language(instructions),
            "rooms_text": text,
            "shortened": shortened,
            "enabled": self.home.enabled,
        }

    @staticmethod
    def _room_name(room: str) -> str:
        name = breakdown.clean_text(room, engine.ROOM_NAME_MAX)
        if not name:
            raise BoopliError("Give the room a name first.")
        return name

    async def async_room_questions(
        self, room: str, notes: str, answers: Any = None, via: str = VIA_AGENT
    ) -> dict[str, Any]:
        """Ask the agent what it still wants to know about a room (by name, so a new room works)."""
        via = self._check_via(via)
        instructions = breakdown.room_instructions(
            breakdown.ROOM_QUESTIONS_PROMPT, self._room_name(room), answers, notes
        )
        for attempt in (1, 2):
            data = await self._run(via, "Boopli: room questions", instructions)
            try:
                enough, questions = breakdown.parse_questions(data)
            except breakdown.BreakdownError as err:
                if attempt == 2:
                    raise BoopliError(err) from err
                continue
            return {"enough": enough, "questions": [asdict(q) for q in questions]}
        raise BoopliError("The AI agent did not answer.")  # not reached

    async def async_room_notes(
        self, room: str, notes: str, answers: Any = None, via: str = VIA_AGENT
    ) -> dict[str, Any]:
        """Ask the agent to write the room's notes. Nothing is saved here."""
        via = self._check_via(via)
        instructions = breakdown.room_instructions(
            breakdown.ROOM_NOTES_PROMPT, self._room_name(room), answers, notes
        )
        for attempt in (1, 2):
            data = await self._run(via, "Boopli: room notes", instructions)
            try:
                return {"notes": breakdown.parse_room_notes(data)}
            except breakdown.BreakdownError as err:
                if attempt == 2:
                    raise BoopliError(err) from err
        raise BoopliError("The AI agent did not answer.")  # not reached

    # --- My home: describing a room from photos (one time, never kept) ---------------

    async def _async_clear_photo_leftovers(self) -> None:
        """Delete photo files a crash may have left behind (they are never needed again)."""
        dirs = getattr(self.hass.config, "media_dirs", None) or {}
        folders = [Path(base) / PHOTO_DIR for base in dirs.values()]

        def clear() -> None:
            for folder in folders:
                if folder.is_dir():
                    _delete_files(list(folder.iterdir()), folder)

        try:
            await self.hass.async_add_executor_job(clear)
        except OSError:
            _LOGGER.debug("Could not look for leftover photos")

    @staticmethod
    def decode_photos(photos: Any) -> list[tuple[bytes, str, str]]:
        """Check the photos the panel sent (base64) and return (bytes, extension, mime type)."""
        if not isinstance(photos, list) or not photos:
            raise BoopliError("Pick at least one photo.")
        if len(photos) > MAX_PHOTOS:
            raise BoopliError("Use at most {max_photos} photos.", max_photos=MAX_PHOTOS)
        result: list[tuple[bytes, str, str]] = []
        for item in photos:
            text = str(item or "")
            if text.startswith("data:") and "," in text:
                text = text.split(",", 1)[1]
            try:
                data = base64.b64decode(text, validate=False)
            except (binascii.Error, ValueError) as err:
                raise BoopliError("One of the photos could not be read.") from err
            if len(data) > PHOTO_MAX_BYTES:
                raise BoopliError("One of the photos is too big. Try a smaller one.")
            for magic, ext, mime in _PHOTO_KINDS:
                if data.startswith(magic):
                    result.append((data, ext, mime))
                    break
            else:
                raise BoopliError("Only JPEG or PNG photos work.")
        return result

    def media_id(self) -> str:
        """The id of the media folder pictures are read from ("local" unless it is named otherwise)."""
        dirs = dict(getattr(self.hass.config, "media_dirs", None) or {})
        return "local" if not dirs or "local" in dirs else next(iter(dirs))

    def _media_dir(self) -> tuple[str, str]:
        """(id, folder) of the media folder photos are handed over in."""
        dirs = dict(getattr(self.hass.config, "media_dirs", None) or {})
        if not dirs:
            raise BoopliError(
                "Set up a Home Assistant media folder so Boopli can prepare the photos."
            )
        key = "local" if "local" in dirs else next(iter(dirs))
        return key, dirs[key]

    @staticmethod
    def _plan_photos(
        folder: Path, photos: list[tuple[bytes, str, str]]
    ) -> list[tuple[Path, bytes, str]]:
        """Choose every file name before anything is written, so cleanup always knows them all."""
        batch = uuid.uuid4().hex[:12]
        return [
            (folder / f"{batch}_{index}{ext}", data, mime)
            for index, (data, ext, mime) in enumerate(photos, 1)
        ]

    @staticmethod
    def _write_photos(
        folder: Path, planned: list[tuple[Path, bytes, str]]
    ) -> list[tuple[Path, str]]:
        folder.mkdir(parents=True, exist_ok=True)
        try:
            for path, data, _mime in planned:
                path.write_bytes(data)
        except OSError:
            _delete_files([p for p, _, _ in planned])  # also the one that failed halfway
            raise
        return [(path, mime) for path, _data, mime in planned]

    async def async_room_photos(
        self, room: str, notes: str, photos: Any, via: str = VIA_AGENT
    ) -> dict[str, Any]:
        """Ask the agent to describe a room from photos. The photos are never kept.

        They are written to a temporary file in the media folder only because Home
        Assistant hands attachments over by file; every file is deleted right after
        the answer, also when the agent fails. Nothing is saved here.
        """
        name = self._room_name(room)
        instructions = breakdown.room_instructions(
            breakdown.ROOM_PHOTOS_PROMPT, name, None, notes
        )
        text = await self._ask_with_photos(
            "Boopli: room photos", instructions, photos, breakdown.parse_room_notes, via
        )
        return {"notes": text}

    async def async_scene_from_photos(
        self, task: str, photos: Any, rooms: list[str] | None = None, via: str = VIA_AGENT
    ) -> dict[str, Any]:
        """Describe what a place looks like right now from photos, for one task.

        Same one-time route as room photos: the photos are never kept. The answer
        is text that the user can edit and that goes along with the next requests.
        """
        task = breakdown.clean_text(task, breakdown.TITLE_MAX)
        if not task:
            raise BoopliError("Write what you want to get done first.")
        instructions = breakdown.scene_instructions(task, self.rooms_text(task, rooms)[0])
        text = await self._ask_with_photos(
            "Boopli: what it looks like today",
            instructions,
            photos,
            breakdown.parse_room_notes,
            via,
        )
        return {"scene": text[: breakdown.SCENE_MAX]}

    async def _ask_with_photos(
        self,
        name: str,
        instructions: str,
        photos: Any,
        parse: Callable[[Any], str],
        via: str = VIA_AGENT,
    ) -> str:
        """Hand photos to the agent (or Claude) through temporary files, read the answer, delete the files.

        The agent gets the files as media-folder attachments. Claude gets short-lived signed
        links to the same files and fetches them itself. Every file is deleted right after
        the answer, also when the helper fails. Nothing is saved.
        """
        via = self._check_via(via)
        decoded = self.decode_photos(photos)
        if via == VIA_CLAUDE:
            self._claude_base_url()  # fail early, before any file is written, when Claude cannot reach us
        dir_id, base = self._media_dir()
        folder = Path(base) / PHOTO_DIR
        planned = self._plan_photos(folder, decoded)
        job = self.hass.async_add_executor_job(self._write_photos, folder, planned)
        try:
            # Shielded: if the person leaves while the files are being written, the write
            # still finishes in its thread, and the cleanup below runs after it.
            written = await asyncio.shield(job)
        except asyncio.CancelledError:
            job.add_done_callback(
                lambda _f: self.hass.async_add_executor_job(
                    _delete_files, [p for p, _, _ in planned], folder
                )
            )
            raise
        except OSError as err:
            raise BoopliError("Boopli couldn’t prepare the photos: {error}", error=err) from err
        attachments = [
            {
                "media_content_id": f"media-source://media_source/{dir_id}/{PHOTO_DIR}/{path.name}",
                "media_content_type": mime,
            }
            for path, mime in written
        ]
        agent = self.settings.ai.photo_entity_id
        try:
            for attempt in (1, 2):
                if via == VIA_CLAUDE:
                    # New links for every try, so a slow first try cannot run them out.
                    data = await self.async_ask_claude(
                        instructions, self._signed_photo_urls(dir_id, [p.name for p, _ in written])
                    )
                else:
                    data = await self._run_agent(
                        name,
                        instructions,
                        attachments=attachments,
                        entity_id=agent,
                        timeout=AI_PHOTO_TIMEOUT,
                    )
                try:
                    return parse(data)
                except breakdown.BreakdownError as err:
                    if attempt == 2:
                        raise BoopliError(err) from err
            raise BoopliError("The AI agent did not answer.")  # not reached
        finally:
            await self.hass.async_add_executor_job(
                _delete_files, [p for p, _ in written], folder
            )

    # --- My home: talking it out in the person's own AI chat -------------------------

    def room_chat_prompt(self, room: str, notes: str, include_notes: bool) -> str:
        return breakdown.room_chat_prompt(
            room, notes, include_notes, self.settings.ai.chat_room_prompt
        )

    def home_chat_prompt(
        self, include_notes: bool, rooms: list[tuple[str, str]] | None = None
    ) -> str:
        if rooms is None:
            rooms = [(r.name, r.notes) for r in self.home.rooms if not r.hidden]
        return breakdown.home_chat_prompt(rooms, include_notes, self.settings.ai.chat_home_prompt)

    @staticmethod
    def paste_room(text: str) -> dict[str, Any]:
        try:
            return {"notes": breakdown.parse_pasted_notes(text)}
        except breakdown.BreakdownError as err:
            raise BoopliError(err) from err

    def paste_home(
        self, text: str, rooms: list[tuple[str, str]] | None = None
    ) -> dict[str, Any]:
        """Split pasted notes into rooms. Nothing is saved; the panel shows them for review."""
        known = (
            rooms
            if rooms is not None
            else [(r.id, r.name) for r in self.home.rooms if not r.hidden]
        )
        try:
            sections = breakdown.parse_pasted_home(text, known)
        except breakdown.BreakdownError as err:
            raise BoopliError(err) from err
        return {"rooms": sections}

    async def async_ai_questions(
        self,
        task: str,
        kind: str,
        answers: Any = None,
        notes: str = "",
        rooms: list[str] | None = None,
        scene: str = "",
        via: str = VIA_AGENT,
    ) -> dict[str, Any]:
        """Ask the agent what it still needs to know before splitting the task."""
        via = self._check_via(via)
        task = breakdown.clean_text(task, breakdown.TITLE_MAX)
        if not task:
            raise BoopliError("Write what you want to get done first.")
        instructions = breakdown.questions_instructions(
            task,
            self._check_kind(kind),
            answers,
            notes,
            self.settings.ai.questions_prompt,
            self.rooms_text(task, rooms)[0],
            scene,
        )
        for attempt in (1, 2):  # an unreadable answer gets one more try
            data = await self._run(via, "Boopli: questions", instructions)
            try:
                enough, questions = breakdown.parse_questions(data)
            except breakdown.BreakdownError as err:
                if attempt == 2:
                    raise BoopliError(err) from err
                continue
            return {"enough": enough, "questions": [asdict(q) for q in questions]}
        raise BoopliError("The AI agent did not answer.")  # not reached

    async def async_ai_steps(
        self,
        task: str,
        kind: str,
        answers: Any = None,
        notes: str = "",
        rooms: list[str] | None = None,
        scene: str = "",
        via: str = VIA_AGENT,
    ) -> dict[str, Any]:
        """Ask the agent to split the task into small steps."""
        via = self._check_via(via)
        task = breakdown.clean_text(task, breakdown.TITLE_MAX)
        if not task:
            raise BoopliError("Write what you want to get done first.")
        instructions = breakdown.steps_instructions(
            task,
            self._check_kind(kind),
            answers,
            notes,
            self.settings.ai.steps_prompt,
            self.rooms_text(task, rooms)[0],
            scene,
        )
        for attempt in (1, 2):  # an unreadable answer gets one more try
            data = await self._run(via, "Boopli: steps", instructions)
            try:
                steps, summary, questions = breakdown.parse_steps_and_questions(
                    data, engine.MAX_STEPS
                )
            except breakdown.BreakdownError as err:
                if attempt == 2:
                    raise BoopliError(err) from err
                continue
            if kind != breakdown.KIND_RECURRING:
                # A one-off task has no use for questions: it is already written for today.
                questions = []
                for step in steps:
                    step.only_if = ""
            return {
                "steps": [asdict(s) for s in steps],
                "summary": summary,
                "questions": [asdict(q) for q in questions],
            }
        raise BoopliError("The AI agent did not answer.")  # not reached

    def add_task_steps(
        self,
        title: str,
        steps: list[dict[str, Any]],
        notes: str = "",
        where: str = engine.WHERE_HOME,
    ) -> engine.Run:
        """Create a one-off task from reviewed steps (with sizes and groups) and start it."""
        chore = engine.Chore(
            id=engine.new_id(),
            name=title.strip(),
            steps=[engine.Step.from_dict(s) for s in steps],
            where=where,
            one_off=True,
            created_at=engine.fmt_ts(dt_util.utcnow()),
            nudge_style=self.settings.default_style,
            notes=notes.strip()[: engine.NOTES_MAX],
        )
        error = engine.validate_chore(chore, [lad.id for lad in self.settings.ladders])
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
                raise BoopliError("Choose a phone and a notification level first.")
            return await self.nudger.async_test_phone(phone)
        if kind == "speaker":
            speaker = engine.SpeakerCfg.from_dict(data.get("speaker") or {})
            level = str(data.get("level", ""))
            # The test brings the sounds as they are on screen (maybe not saved yet), else the saved ones.
            raw = data.get("sounds")
            sounds = (
                [engine.ExtraSound.from_dict(x) for x in raw if isinstance(x, dict)]
                if isinstance(raw, list)
                else self.settings.sounds
            )
            error = engine.validate_speaker_test(speaker, level, sounds)
            if error:
                raise BoopliError(error)
            return await self.nudger.async_test_speaker(speaker, level, sounds)
        if kind == "alarm_device":
            device = engine.AlarmDeviceCfg.from_dict(data.get("alarm_device") or {})
            if device.entity_id.split(".")[0] not in engine.ALARM_DEVICE_DOMAINS:
                raise BoopliError("Pick a siren, switch or script first.")
            return await self.nudger.async_test_alarm_device(device)
        raise BoopliError("Unknown test.")
