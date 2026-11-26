"""Sends nudges (lights, phone) and reacts to notification button taps.

The decisions about *when* to nudge live in `engine.py` and the manager. This
module only talks to Home Assistant: it calls light and notify services and
listens for the companion app's notification-action events.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import TYPE_CHECKING, Any

from dataclasses import replace

from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback

from homeassistant.util import dt as dt_util

from . import engine
from .phone_texts import phone_texts_for

if TYPE_CHECKING:
    from .manager import BoopliManager

_LOGGER = logging.getLogger(__name__)

NOTIFICATION_ACTION_EVENT = "mobile_app_notification_action"
INDICATOR_TEST_SECONDS = 5
ALARM_TEST_SECONDS = 3


class BoopliNudger:
    """Sends nudges through the channels the user turned on."""

    def __init__(self, hass: HomeAssistant, manager: BoopliManager) -> None:
        self.hass = hass
        self.manager = manager
        self._unsub_actions: CALLBACK_TYPE | None = None
        self._blinks: dict[str, asyncio.Task[None]] = {}
        self._blink_owner: dict[str, str] = {}  # light entity -> step key that started its blink
        # Alarms that are sounding: target entity -> (step key, task)
        self._alarms: dict[str, tuple[str, asyncio.Task[None]]] = {}
        # One-shot speaker alarms (repeat 0): their task ends right after the single play, so
        # remember speaker -> (step key, monotonic time until which the sound may still be playing).
        self._one_shots: dict[str, tuple[str, float]] = {}

    def _texts(self) -> dict[str, str]:
        """The buttons and sentences phones and speakers get, in the language of Home Assistant."""
        return phone_texts_for(self.hass.config.language)

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
        for _key, task in self._alarms.values():
            task.cancel()  # each alarm stops its speaker or switches its device off
        self._alarms.clear()
        self._one_shots.clear()

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
        elif kind == engine.ACTION_ALL_STEPS:
            self.manager.answer_questions(run_id, {})  # no answers: start with all steps
        elif kind == engine.ACTION_ON_IT:
            self.manager.on_it(run_id, step_id)
        elif kind == engine.ACTION_NOT_ON_IT:
            self.manager.not_on_it(run_id, step_id)

    # --- sending ---------------------------------------------------------

    async def async_send(
        self,
        run_id: str,
        chore_name: str,
        step_id: str,
        step_title: str,
        channels: str,
        number: int = 1,
        image: str = "",
        rung: engine.Rung | None = None,
        light_color: list[int] | None = None,
    ) -> None:
        """Send nudge number `number` on every channel that has reached it.

        `image` (optional) is the picture the phones show with it. With a `rung` (a nudge of one
        of the user's own ladders) exactly the devices on that rung act, at the levels it names.
        """
        settings = self.manager.settings
        key = f"{run_id}:{step_id}"
        if rung is not None:
            await self._send_rung(rung, run_id, chore_name, step_id, step_title, channels, image, key, light_color)
            return
        if channels == engine.CHANNELS_ALL:
            for light in settings.lights:
                if engine.reached(light.start_at, number):
                    # The chore may have a color of its own (so a status light can mean something).
                    await self._nudge_light(replace(light, color=light_color) if light_color else light, key)
            for speaker in settings.speakers:
                level = engine.speaker_level(speaker, number)
                if level:
                    await self._play_speaker(speaker, level, chore_name, step_title, key)
            for device in settings.alarm_devices:
                if engine.reached(device.start_at, number):
                    self._start_device_alarm(device, key)
        for phone in settings.phones:
            if not engine.reached(phone.start_at, number):
                continue
            payload = engine.phone_payload(
                phone.level,
                run_id,
                step_id,
                chore_name,
                step_title,
                settings.snooze_minutes,
                image,
                self.manager.media_id(),
                self._texts(),
            )
            await self._notify(phone.service, payload)

    async def _send_rung(
        self,
        rung: engine.Rung,
        run_id: str,
        chore_name: str,
        step_id: str,
        step_title: str,
        channels: str,
        image: str,
        key: str,
        light_color: list[int] | None = None,
    ) -> None:
        """One nudge of a ladder of the user's own: only the devices ticked on this rung act.

        A device that is not set up (any more) is skipped. Away from home only the phones act.
        """
        settings = self.manager.settings
        if channels == engine.CHANNELS_ALL:
            for light in settings.lights:
                use = rung.lights.get(light.entity_id)
                if use is None:
                    continue
                # Mode: this nudge's choice. Color: the chore's if it has one (it says what the chore means),
                # else this nudge's, else the light's own.
                await self._nudge_light(
                    replace(light, mode=use.mode or light.mode, color=light_color or use.color or light.color), key
                )
            for speaker in settings.speakers:
                choice = rung.speakers.get(speaker.entity_id)
                if choice and engine.speaker_choice_ok(speaker, choice, settings.sounds):
                    # "Speaks" is plain speech; "Speaks with chime" is an announcement.
                    announce = {engine.SPEAKER_SPEECH: False, engine.SPEAKER_SPEECH_CHIME: True}.get(choice)
                    await self._play_speaker(speaker, choice, chore_name, step_title, key, announce)
            for device in settings.alarm_devices:
                if device.entity_id in rung.alarms:
                    self._start_device_alarm(device, key)
        known = {phone.service for phone in settings.phones}
        for service, level in rung.phones.items():
            if service not in known:
                continue
            payload = engine.phone_payload(
                level,
                run_id,
                step_id,
                chore_name,
                step_title,
                settings.snooze_minutes,
                image,
                self.manager.media_id(),
                self._texts(),
            )
            await self._notify(service, payload)

    async def async_show_on_it(self, run: engine.Run, step: engine.StepRun) -> None:
        """"On it": stop the alarms, blinks and speakers of this step, and turn the phone
        notification green in place (same tag), so the person sees it was noticed."""
        await self.async_silence(f"{run.id}:{step.step_id}")
        if not step.on_it_since:
            return
        since = engine.parse_ts(step.on_it_since).astimezone(self.manager.tz).strftime("%H:%M")
        payload = engine.on_it_payload(
            run.id, step.step_id, run.chore_name, step.title, since, step.image, self.manager.media_id(), self._texts()
        )
        if step.nudge_count > 0:
            manager = self.manager
            for phone in engine.phones_reached(manager.settings, manager.style_for(run), step.nudge_count):
                await self._notify(phone.service, payload)

    async def async_send_check_in(
        self,
        run_id: str,
        chore_name: str,
        step_id: str,
        step_title: str,
        number: int = 1,
        image: str = "",
    ) -> None:
        """"Still on it?": a normal looking notification on the phones, nothing else.

        It replaces the green one, so it makes a sound once. No lights, speakers or alarms.
        It goes to the phones that have reached nudge `number`, the same ones that were
        shown the green notification, so every phone that has one gets it replaced.
        """
        payload = engine.check_in_payload(
            run_id, step_id, chore_name, step_title, image, self.manager.media_id(), self._texts()
        )
        manager = self.manager
        run = manager.runs.get(run_id)
        style = manager.style_for(run) if run else manager.settings.default_style
        for phone in engine.phones_reached(manager.settings, style, number):
            await self._notify(phone.service, payload)

    async def async_send_questions(self, run: engine.Run) -> None:
        """Tell the phones that a chore started and has questions to answer.

        Quiet hours are respected (the card on Today is still there). Only phones that
        reach nudge 1 get it, and only when you could be nudged right now.
        """
        manager = self.manager
        chore = manager.chores.get(run.chore_id)
        now = dt_util.utcnow()
        if engine.channels_for(run.where, manager.is_home()) is None:
            return
        if not (chore and chore.ignore_quiet_hours):
            if engine.quiet_ends(now, manager.settings.quiet_hours, manager.tz) is not None:
                return
        payload = engine.questions_payload(run.id, run.chore_name, len(run.questions), self._texts())
        for phone in engine.phones_reached(manager.settings, manager.style_for(run), 1):
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

    async def _nudge_light(self, light: engine.LightCfg, key: str = "") -> str | None:
        """Blink a light, or switch it on as an indicator. Returns the mode used."""
        state = self._light_info(light)
        if state is None:
            return None
        if light.mode == engine.LIGHT_BLINK:
            return self._start_blink(light, state, key)
        data = self._indicator_data(light, state)
        _LOGGER.debug("Boopli: light %s as indicator with %s", light.entity_id, data)
        try:
            await self._light_call("turn_on", light.entity_id, data)
        except Exception:  # noqa: BLE001
            _LOGGER.exception("Boopli: could not nudge %s", light.entity_id)
            return None
        self.manager.mark_indicator_on(light.entity_id)
        return engine.LIGHT_INDICATOR

    def _start_blink(self, light: engine.LightCfg, state: Any, key: str = "") -> str | None:
        """Start a blink in the background. Returns None if one is running.

        `key` is the step the blink belongs to, so answering that step can stop it.
        """
        running = self._blinks.get(light.entity_id)
        if running is not None and not running.done():
            _LOGGER.debug("Boopli: %s is already blinking", light.entity_id)
            return None
        self._blink_owner[light.entity_id] = key
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

    # --- speakers and alarm devices --------------------------------------

    async def _call(self, domain: str, service: str, data: dict[str, Any]) -> bool:
        """Call a service without ever raising. Returns whether it was sent."""
        if not self.hass.services.has_service(domain, service):
            _LOGGER.warning("Boopli: %s.%s does not exist", domain, service)
            return False
        _LOGGER.debug("Boopli: %s.%s %s", domain, service, data)
        try:
            await self.hass.services.async_call(domain, service, data, blocking=False)
        except Exception:  # noqa: BLE001 - a broken speaker must not break Boopli
            _LOGGER.exception("Boopli: %s.%s failed", domain, service)
            return False
        return True

    def _speaker_available(self, entity_id: str) -> bool:
        state = self.hass.states.get(entity_id)
        if state is None or state.state == "unavailable":
            _LOGGER.debug("Boopli: %s is unavailable, skipping", entity_id)
            return False
        return True

    def _alexa_sound_blocked(
        self, speaker: engine.SpeakerCfg, level: str, sounds: list[engine.ExtraSound]
    ) -> bool:
        """Whether this would play one of Amazon's sounds on a speaker that cannot.

        Only Alexa Media Player plays them (media_content_type "sound"). The official Alexa Devices
        integration treats play_media as a music search and answers "sound is not available as a music provider".
        """
        if not engine.level_plays_alexa_sound(speaker, level, sounds):
            return False
        from homeassistant.helpers import entity_registry as er

        entry = er.async_get(self.hass).async_get(speaker.entity_id)
        return entry is not None and entry.platform == "alexa_devices"
    def _do_not_disturb(self, entity_id: str) -> bool:
        """Whether the Alexa speaker has Do not disturb on (or it cannot be told, which counts as on).

        The speaker's Do not disturb switch is found through the speaker's serial number, which both Alexa
        integrations use in the switch's unique ID. A speaker with no such switch is treated as not disturbed.
        """
        from homeassistant.helpers import entity_registry as er

        registry = er.async_get(self.hass)
        speaker = registry.async_get(entity_id)
        if speaker is None or not speaker.unique_id:
            return False
        serial = speaker.unique_id.removesuffix("-media")  # Alexa Devices adds "-media"
        switches = (
            registry.async_get_entity_id("switch", "alexa_media", f"{serial}_do not disturb"),
            registry.async_get_entity_id("switch", "alexa_devices", f"{serial}-dnd"),
        )
        for switch_id in switches:
            if switch_id is None:
                continue
            state = self.hass.states.get(switch_id)
            if state is None or state.state in ("on", "unavailable", "unknown"):
                return True
            # a switch that reads "off" is a clear answer; the other integration's switch is the same setting
            return False
        return False

    async def _play_speaker(
        self,
        speaker: engine.SpeakerCfg,
        level: str,
        chore_name: str,
        step_title: str,
        key: str,
        announce: bool | None = None,
        sounds: list[engine.ExtraSound] | None = None,
    ) -> bool:
        """Play one level on a speaker (or one of your own sounds). Returns whether something was sent.

        `announce` is for speech: None follows the speaker's own setting. `sounds` is your list of sounds
        (the saved one unless a test brings its own).
        """
        if not self._speaker_available(speaker.entity_id):
            return False
        if self._alexa_sound_blocked(speaker, level, self.manager.settings.sounds if sounds is None else sounds):
            _LOGGER.warning("Boopli: %s is an Alexa Devices speaker and cannot play Amazon sounds, skipping", speaker.entity_id)
            return False
        extra = engine.find_sound(self.manager.settings.sounds if sounds is None else sounds, level)
        if extra is None and level.startswith(engine.SPEAKER_SOUND_PREFIX):
            return False  # one of your own sounds that is not there any more: not the alarm
        if extra is not None:
            return await self._call(
                "media_player",
                "play_media",
                {"entity_id": speaker.entity_id, **engine.sound_play_data(extra.kind, extra.sound)},
            )
        if level == engine.SPEAKER_CUE:
            return await self._call(
                "media_player",
                "play_media",
                {
                    "entity_id": speaker.entity_id,
                    **engine.sound_play_data(speaker.cue.kind, speaker.cue.sound),
                },
            )
        if level in (engine.SPEAKER_SPEECH, engine.SPEAKER_SPEECH_CHIME):
            text = engine.speech_text(
                self.manager.settings.speech_template, chore_name, step_title
            )
            if (
                speaker.speech.route == engine.SPEECH_ALEXA_MEDIA
                and (speaker.speech.announce if announce is None else announce)
                and self._do_not_disturb(speaker.entity_id)
            ):
                # Alexa swallows announcements while Do not disturb is on; plain speech still comes through.
                announce = False
            domain, service, data = engine.speech_call(speaker, text, announce)
            return await self._call(domain, service, data)
        return self._start_speaker_alarm(speaker, key)

    def _start_speaker_alarm(self, speaker: engine.SpeakerCfg, key: str) -> bool:
        """Repeat the alarm sound on a speaker for its duration, in the background."""
        started = self._start_alarm_task(
            speaker.entity_id, key, self._speaker_alarm(speaker)
        )
        if started:
            # This alarm owns the speaker now: an older step's one-shot must not stop it.
            self._one_shots.pop(speaker.entity_id, None)
            if speaker.alarm.repeat_s <= 0:
                # Plays once and the task is over at once: remember it so Done, Snooze and On it can still stop it.
                self._one_shots[speaker.entity_id] = (
                    key,
                    time.monotonic() + speaker.alarm.seconds,
                )
        return started

    def _start_device_alarm(self, device: engine.AlarmDeviceCfg, key: str) -> bool:
        """Switch an alarm device on for its duration, then off."""
        return self._start_alarm_task(
            device.entity_id, key, self._device_alarm(device.entity_id, device.seconds)
        )

    def _start_alarm_task(self, target: str, key: str, coro: Any) -> bool:
        running = self._alarms.get(target)
        if running is not None and not running[1].done():
            coro.close()
            _LOGGER.debug("Boopli: %s is already sounding", target)
            return False
        self._alarms[target] = (key, self.hass.async_create_task(coro))
        return True

    async def _speaker_alarm(self, speaker: engine.SpeakerCfg) -> None:
        alarm = speaker.alarm
        data = {
            "entity_id": speaker.entity_id,
            **engine.sound_play_data(alarm.kind, alarm.sound),
        }
        try:
            for i in range(engine.alarm_plays(alarm.seconds, alarm.repeat_s)):
                if i:
                    await asyncio.sleep(alarm.repeat_s)
                await self._call("media_player", "play_media", data)
        except asyncio.CancelledError:
            await self._call("media_player", "media_stop", {"entity_id": speaker.entity_id})
            raise
        # Let the last play finish; the sound ends by itself.

    async def _device_alarm(self, entity_id: str, seconds: int) -> None:
        self.manager.mark_alarm_on(entity_id)
        try:
            await self._call(*engine.device_alarm_call(entity_id, True))
            await asyncio.sleep(seconds)
        finally:
            if await self._call(*engine.device_alarm_call(entity_id, False)):
                self.manager.unmark_alarm_on(entity_id)
            else:
                self.manager.keep_alarm_marked(entity_id)  # try again later

    async def async_silence(self, key: str) -> None:
        """Stop the alarms of a step that was answered (Done or Snooze)."""
        for target, (alarm_key, task) in list(self._alarms.items()):
            if alarm_key == key and not task.done():
                task.cancel()
        now = time.monotonic()
        for entity_id, (one_shot_key, until) in list(self._one_shots.items()):
            if until <= now:
                del self._one_shots[entity_id]  # long over; never stop what plays there now
            elif one_shot_key == key:
                del self._one_shots[entity_id]
                await self._call("media_player", "media_stop", {"entity_id": entity_id})
        for entity_id, blink in list(self._blinks.items()):
            # A blink of this step stops, and the light goes back as it was; others carry on.
            if self._blink_owner.get(entity_id) == key and not blink.done():
                blink.cancel()

    async def async_turn_off_alarm_devices(self, entity_ids: list[str]) -> list[str]:
        """Switch off devices that were left on (for example by a restart).

        Returns the ones whose "off" call could not be sent, so they can be tried again.
        """
        failed: list[str] = []
        for entity_id in entity_ids:
            if not await self._call(*engine.device_alarm_call(entity_id, False)):
                failed.append(entity_id)
        return failed

    # --- clearing --------------------------------------------------------

    async def async_clear_step(self, run_id: str, step_id: str) -> None:
        """Remove the phone notification and stop the alarms of a resolved step."""
        await self.async_silence(f"{run_id}:{step_id}")
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
            return {"ok": False, "note": engine.Msg("That light is not available right now.")}
        if light.mode == engine.LIGHT_BLINK:
            if self._start_blink(light, state) is None:
                return {"ok": True, "mode": light.mode, "note": engine.Msg("It is still blinking.")}
            return {
                "ok": True,
                "mode": light.mode,
                "note": engine.Msg(
                    "Blinking {repeats}x, about {seconds} seconds. The light goes back to how it was afterwards.",
                    repeats=light.repeats,
                    seconds=f"{light.blink_seconds():.1f}",
                ),
            }
        if state.state == "on":
            return {
                "ok": True,
                "mode": light.mode,
                "note": engine.Msg(
                    "An indicator lamp switches on in a color until you are done. "
                    "This light is on already, so turn it off and test again to see it."
                ),
            }
        await self._light_call("turn_on", light.entity_id, self._indicator_data(light, state))
        self.hass.async_create_task(self._indicator_test_off(light.entity_id))
        return {
            "ok": True,
            "mode": light.mode,
            "note": engine.Msg(
                "An indicator lamp stays on in a color until you are done. "
                "For this test it switches on for {seconds} seconds.",
                seconds=INDICATOR_TEST_SECONDS,
            ),
        }

    async def _indicator_test_off(self, entity_id: str) -> None:
        await asyncio.sleep(INDICATOR_TEST_SECONDS)
        await self.async_turn_off_indicators([entity_id])

    async def async_test_speaker(
        self, speaker: engine.SpeakerCfg, level: str, sounds: list[engine.ExtraSound] | None = None
    ) -> dict[str, Any]:
        """Play one level of a speaker (or one of your own sounds) once so the user hears it."""
        sounds = self.manager.settings.sounds if sounds is None else sounds
        extra = engine.find_sound(sounds, level)
        if extra is None and level not in engine.SPEAKER_LEVELS and level != engine.SPEAKER_SPEECH_CHIME:
            return {"ok": False, "note": engine.Msg("Choose which speaker sound to test.")}
        if not self._speaker_available(speaker.entity_id):
            return {"ok": False, "note": engine.Msg("That speaker is not available right now.")}
        if self._alexa_sound_blocked(speaker, level, sounds):
            return {"ok": False, "note": engine.Msg("Alexa Devices cannot play Amazon sounds. Use a speaker from Alexa Media Player.")}
        if level == engine.SPEAKER_ALARM:
            # One play only, so a test never rings for long.
            ok = await self._call(
                "media_player",
                "play_media",
                {
                    "entity_id": speaker.entity_id,
                    **engine.sound_play_data(speaker.alarm.kind, speaker.alarm.sound),
                },
            )
            note = engine.Msg("Playing the alarm sound once.")
        else:
            announce = True if level == engine.SPEAKER_SPEECH_CHIME else None
            texts = self._texts()
            ok = await self._play_speaker(
                speaker,
                level,
                engine.phone_text(texts, "test_title"),
                engine.phone_text(texts, "test_speech"),
                "test",
                announce,
                sounds,
            )
            playing = extra is not None or level == engine.SPEAKER_CUE
            note = engine.Msg("Playing the sound.") if playing else engine.Msg("Speaking.")
        return {"ok": ok, "note": note if ok else engine.Msg("Boopli could not send that.")}

    async def async_test_alarm_device(
        self, device: engine.AlarmDeviceCfg
    ) -> dict[str, Any]:
        """Switch an alarm device on for a few seconds."""
        state = self.hass.states.get(device.entity_id)
        if state is None or state.state == "unavailable":
            return {"ok": False, "note": engine.Msg("That device is not available right now.")}
        short = engine.AlarmDeviceCfg(device.entity_id, ALARM_TEST_SECONDS, device.start_at)
        started = self._start_device_alarm(short, "test")
        return {
            "ok": started,
            "note": engine.Msg("On for {seconds} seconds, then off.", seconds=ALARM_TEST_SECONDS)
            if started
            else engine.Msg("It is already on."),
        }

    async def async_test_phone(self, phone: engine.PhoneCfg) -> dict[str, Any]:
        """Send a test notification to a phone."""
        texts = self._texts()
        payload = engine.phone_payload(
            phone.level,
            "test",
            "test",
            engine.phone_text(texts, "test_title"),
            engine.phone_text(texts, "test_message"),
            self.manager.settings.snooze_minutes,
            texts=texts,
        )
        ok = await self._notify(phone.service, payload)
        return {
            "ok": ok,
            "note": engine.Msg("Sent.") if ok else engine.Msg("That phone service was not found."),
        }
