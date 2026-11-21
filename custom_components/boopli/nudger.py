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
        self._blinks: dict[str, asyncio.Task[None]] = {}

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
        for task in self._blinks.values():
            task.cancel()  # each blink puts its light back before it stops
        self._blinks.clear()

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

    def _light_info(self, light: engine.LightCfg) -> Any:
        """The light's state, or None when it cannot be used right now."""
        state = self.hass.states.get(light.entity_id)
        if state is None or state.state == "unavailable":
            _LOGGER.debug("Boopli: %s is unavailable, skipping", light.entity_id)
            return None
        return state

    async def _light_call(
        self, service: str, entity_id: str, data: dict[str, Any]
    ) -> None:
        await self.hass.services.async_call(
            "light", service, {"entity_id": entity_id, **data}, blocking=False
        )

    def _indicator_data(self, light: engine.LightCfg, state: Any) -> dict[str, Any]:
        return engine.light_plan(
            light.mode,
            list(state.attributes.get("supported_color_modes") or []),
            light.color,
        )["data"]

    async def _nudge_light(self, light: engine.LightCfg) -> str | None:
        """Blink a light, or switch it on as an indicator. Returns the mode used."""
        state = self._light_info(light)
        if state is None:
            return None
        if light.mode == engine.LIGHT_BLINK:
            return self._start_blink(light, state)
        data = self._indicator_data(light, state)
        _LOGGER.debug("Boopli: light %s as indicator with %s", light.entity_id, data)
        try:
            await self._light_call("turn_on", light.entity_id, data)
        except Exception:  # noqa: BLE001
            _LOGGER.exception("Boopli: could not nudge %s", light.entity_id)
            return None
        self.manager.mark_indicator_on(light.entity_id)
        return engine.LIGHT_INDICATOR

    def _start_blink(self, light: engine.LightCfg, state: Any) -> str | None:
        """Start a blink in the background. Returns None if one is running."""
        running = self._blinks.get(light.entity_id)
        if running is not None and not running.done():
            _LOGGER.debug("Boopli: %s is already blinking", light.entity_id)
            return None
        self._blinks[light.entity_id] = self.hass.async_create_task(
            self._blink(light, state)
        )
        return engine.LIGHT_BLINK

    async def _blink(self, light: engine.LightCfg, state: Any) -> None:
        """Blink, then put the light back exactly as it was. Never raises."""
        attrs = dict(state.attributes)
        restore = engine.restore_plan(state.state, attrs)
        alert = engine.blink_alert(
            list(attrs.get("supported_color_modes") or []),
            light.color,
            state.state == "on",
        )
        _LOGGER.debug(
            "Boopli: blink %s x%d (%d ms, pause %d ms) alert=%s restore=%s",
            light.entity_id,
            light.repeats,
            light.blink_ms,
            light.gap_ms,
            alert,
            restore,
        )
        try:
            for i in range(light.repeats):
                if i:
                    await asyncio.sleep(light.gap_ms / 1000)
                await self._light_call(alert[0], light.entity_id, alert[1])
                await asyncio.sleep(light.blink_ms / 1000)
                await self._light_call(restore[0], light.entity_id, restore[1])
        except asyncio.CancelledError:
            await self._light_call(restore[0], light.entity_id, restore[1])
            raise
        except Exception:  # noqa: BLE001 - a broken light must not break Boopli
            _LOGGER.exception("Boopli: blink of %s failed", light.entity_id)
            try:
                await self._light_call(restore[0], light.entity_id, restore[1])
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Boopli: could not restore %s", light.entity_id)

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
        """Try a light with the settings on screen so the user sees the nudge."""
        state = self._light_info(light)
        if state is None:
            return {"ok": False, "note": "That light is not available right now."}
        if light.mode == engine.LIGHT_BLINK:
            if self._start_blink(light, state) is None:
                return {"ok": True, "mode": light.mode, "note": "It is still blinking."}
            return {
                "ok": True,
                "mode": light.mode,
                "note": f"Blinking {light.repeats}x, about {light.blink_seconds():.1f} "
                "seconds. The light goes back to how it was afterwards.",
            }
        if state.state == "on":
            return {
                "ok": True,
                "mode": light.mode,
                "note": "An indicator lamp switches on in a color until you are done. "
                "This light is on already, so turn it off and test again to see it.",
            }
        await self._light_call("turn_on", light.entity_id, self._indicator_data(light, state))
        self.hass.async_create_task(self._indicator_test_off(light.entity_id))
        return {
            "ok": True,
            "mode": light.mode,
            "note": "An indicator lamp stays on in a color until you are done. "
            f"For this test it switches on for {INDICATOR_TEST_SECONDS} seconds.",
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
