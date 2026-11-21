"""Sends nudges (lights, phone) and reacts to notification button taps.

The decisions about *when* to nudge live in `engine.py` and the manager. This
module only talks to Home Assistant: it calls light and notify services and
listens for the companion app's notification-action events.
"""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback

from . import engine

if TYPE_CHECKING:
    from .manager import BoopliManager

_LOGGER = logging.getLogger(__name__)

NOTIFICATION_ACTION_EVENT = "mobile_app_notification_action"
INDICATOR_TEST_SECONDS = 5


class BoopliNudger:
    """Sends nudges through the channels the user turned on."""

    def __init__(self, hass: HomeAssistant, manager: BoopliManager) -> None:
        self.hass = hass
        self.manager = manager
        self._unsub_actions: CALLBACK_TYPE | None = None

    # --- lifecycle -------------------------------------------------------

    @callback
    def async_start(self) -> None:
        """Start listening for Done and Snooze taps on notifications."""
        self._unsub_actions = self.hass.bus.async_listen(
            NOTIFICATION_ACTION_EVENT, self._on_action
        )

    @callback
    def async_stop(self) -> None:
        if self._unsub_actions:
            self._unsub_actions()
            self._unsub_actions = None

    @callback
    def _on_action(self, event: Event) -> None:
        """A notification button was tapped (event from the companion app)."""
        action = event.data.get("action")
        if not isinstance(action, str):
            return
        parsed = engine.parse_action(action)
        if parsed is None:
            return  # not one of ours
        kind, run_id, step_id = parsed
        if kind == engine.ACTION_DONE:
            self.manager.complete_step(run_id, step_id)
        elif kind == engine.ACTION_SNOOZE:
            self.manager.snooze(run_id, step_id)

    # --- sending ---------------------------------------------------------

    async def async_send(
        self,
        run_id: str,
        chore_name: str,
        step_id: str,
        step_title: str,
        channels: str,
    ) -> None:
        """Send one nudge on every enabled channel. Never raises."""
        settings = self.manager.settings
        if channels == engine.CHANNELS_ALL:
            for light in settings.lights:
                await self._nudge_light(light)
        for phone in settings.phones:
            payload = engine.phone_payload(
                phone.level,
                run_id,
                step_id,
                chore_name,
                step_title,
                settings.snooze_minutes,
            )
            await self._notify(phone.service, payload)

    async def _notify(self, service: str, payload: dict[str, Any]) -> bool:
        if not self.hass.services.has_service("notify", service):
            _LOGGER.warning("Boopli: notify.%s does not exist", service)
            return False
        _LOGGER.debug("Boopli: notify.%s %s", service, payload)
        try:
            await self.hass.services.async_call(
                "notify", service, payload, blocking=False
            )
        except Exception:  # noqa: BLE001 - a broken phone must not break Boopli
            _LOGGER.exception("Boopli: could not send to notify.%s", service)
            return False
        return True

    def _plan_light(self, light: engine.LightCfg) -> dict[str, Any] | None:
        state = self.hass.states.get(light.entity_id)
        if state is None or state.state == "unavailable":
            _LOGGER.debug("Boopli: %s is unavailable, skipping", light.entity_id)
            return None
        attrs = state.attributes
        return engine.light_plan(
            light.mode,
            int(attrs.get("supported_features") or 0),
            list(attrs.get("supported_color_modes") or []),
            light.color,
        )

    async def _nudge_light(self, light: engine.LightCfg) -> str | None:
        """Flash a light, or switch it on as an indicator. Returns the mode used."""
        plan = self._plan_light(light)
        if plan is None:
            return None
        _LOGGER.debug(
            "Boopli: light %s as %s with %s", light.entity_id, plan["mode"], plan["data"]
        )
        try:
            await self.hass.services.async_call(
                "light",
                "turn_on",
                {"entity_id": light.entity_id, **plan["data"]},
                blocking=False,
            )
        except Exception:  # noqa: BLE001
            _LOGGER.exception("Boopli: could not nudge %s", light.entity_id)
            return None
        if plan["mode"] == engine.LIGHT_INDICATOR:
            self.manager.mark_indicator_on(light.entity_id)
        return plan["mode"]

    # --- clearing --------------------------------------------------------

    async def async_clear_step(self, run_id: str, step_id: str) -> None:
        """Remove the phone notification of a step that is resolved."""
        tag = engine.notification_tag(run_id, step_id)
        for phone in self.manager.settings.phones:
            await self._notify(
                phone.service,
                {"message": "clear_notification", "data": {"tag": tag}},
            )

    async def async_turn_off_indicators(self, entity_ids: list[str]) -> None:
        """Switch indicator lights off once nothing is waiting any more."""
        for entity_id in entity_ids:
            try:
                await self.hass.services.async_call(
                    "light", "turn_off", {"entity_id": entity_id}, blocking=False
                )
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Boopli: could not switch off %s", entity_id)

    # --- tests from the Settings screen ---------------------------------

    async def async_test_light(self, light: engine.LightCfg) -> dict[str, Any]:
        """Try a light so the user sees what a nudge looks like."""
        plan = self._plan_light(light)
        if plan is None:
            return {"ok": False, "note": "That light is not available right now."}
        if plan["mode"] == engine.LIGHT_FLASH:
            await self._nudge_light(light)
            return {"ok": True, "mode": plan["mode"], "note": "The light should flash."}

        state = self.hass.states.get(light.entity_id)
        if state is not None and state.state == "on":
            return {
                "ok": True,
                "mode": plan["mode"],
                "note": "This light cannot flash, so it is used as an indicator lamp "
                "(on in a color until you are done). It is on already, so turn it off "
                "and test again to see it.",
            }
        await self.hass.services.async_call(
            "light",
            "turn_on",
            {"entity_id": light.entity_id, **plan["data"]},
            blocking=False,
        )
        self.hass.async_create_task(self._indicator_test_off(light.entity_id))
        return {
            "ok": True,
            "mode": plan["mode"],
            "note": f"This light cannot flash, so it is used as an indicator lamp. "
            f"It switches on for {INDICATOR_TEST_SECONDS} seconds.",
        }

    async def _indicator_test_off(self, entity_id: str) -> None:
        await asyncio.sleep(INDICATOR_TEST_SECONDS)
        await self.async_turn_off_indicators([entity_id])

    async def async_test_phone(self, phone: engine.PhoneCfg) -> dict[str, Any]:
        """Send a test notification to a phone."""
        payload = engine.phone_payload(
            phone.level,
            "test",
            "test",
            "Boopli test",
            "This is a test of your Boopli notification.",
            self.manager.settings.snooze_minutes,
        )
        ok = await self._notify(phone.service, payload)
        return {
            "ok": ok,
            "note": "Sent." if ok else "That phone service was not found.",
        }
