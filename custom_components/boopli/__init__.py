"""Boopli: an ADHD-friendly chore and task companion for Home Assistant."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
)
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import (
    DATA_STATIC_REGISTERED,
    DOMAIN,
    PANEL_BUNDLE,
    PANEL_ELEMENT,
    PANEL_ICON,
    PANEL_TITLE,
    PANEL_URL_PATH,
    STATIC_URL,
)
from .engine import WHERE_HOME, WHERE_VALUES
from .manager import BoopliError, BoopliManager
from .websocket_api import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.empty_config_schema(DOMAIN)
PLATFORMS = ["sensor"]

FRONTEND_DIR = Path(__file__).parent / "frontend"
MANIFEST = Path(__file__).parent / "manifest.json"

SERVICE_ADD_TASK = "add_task"
SERVICE_BREAK_DOWN = "break_down"
SERVICE_START_CHORE = "start_chore"
SERVICE_COMPLETE_STEP = "complete_step"
SERVICE_SNOOZE_STEP = "snooze_step"
SERVICE_STEP_ON_IT = "step_on_it"
SERVICE_STEP_NOT_ON_IT = "step_not_on_it"
SERVICE_DELETE_CHORE = "delete_chore"
SERVICE_SET_AWAY = "set_away"
SERVICE_END_AWAY = "end_away"

SET_AWAY_SCHEMA = vol.Schema(
    {
        # Local date and time like "2026-11-28 10:00" or "2026-11-28T10:00"; empty = now / until switched off.
        vol.Optional("start", default=""): cv.string,
        vol.Optional("until", default=""): cv.string,
    }
)

ADD_TASK_SCHEMA = vol.Schema(
    {
        vol.Required("title"): cv.string,
        vol.Optional("steps"): vol.All(cv.ensure_list, [cv.string]),
        vol.Optional("where", default=WHERE_HOME): vol.In(WHERE_VALUES),
    }
)
CHORE_SCHEMA = vol.Schema({vol.Required("chore"): cv.string})
BREAK_DOWN_SCHEMA = vol.Schema(
    {
        vol.Required("task"): cv.string,
        vol.Optional("kind", default="now"): vol.In(("now", "recurring")),
        vol.Optional("answers"): vol.All(cv.ensure_list, [dict]),
        vol.Optional("notes", default=""): cv.string,
        vol.Optional("rooms"): vol.All(cv.ensure_list, [cv.string]),
    }
)


def _read_version() -> str:
    """Read the integration version, used to bust the browser cache."""
    return json.loads(MANIFEST.read_text(encoding="utf-8")).get("version", "0")


def _manager(hass: HomeAssistant) -> BoopliManager:
    manager: BoopliManager | None = hass.data.get(DOMAIN)
    if manager is None:
        raise ServiceValidationError("Boopli is not set up.")
    return manager


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the websocket commands and services (once per Home Assistant run)."""
    async_register_websocket_commands(hass)

    async def add_task(call: ServiceCall) -> None:
        try:
            _manager(hass).add_task(
                call.data["title"], call.data.get("steps"), call.data["where"]
            )
        except BoopliError as err:
            raise ServiceValidationError(str(err)) from err

    async def start_chore(call: ServiceCall) -> None:
        try:
            _manager(hass).start_chore(call.data["chore"])
        except BoopliError as err:
            raise ServiceValidationError(str(err)) from err

    async def complete_step(call: ServiceCall) -> None:
        try:
            _manager(hass).complete_active_step_for(call.data["chore"])
        except BoopliError as err:
            raise ServiceValidationError(str(err)) from err

    async def snooze_step(call: ServiceCall) -> None:
        try:
            _manager(hass).snooze_chore(call.data["chore"])
        except BoopliError as err:
            raise ServiceValidationError(str(err)) from err

    async def step_on_it(call: ServiceCall) -> None:
        try:
            _manager(hass).on_it_chore(call.data["chore"])
        except BoopliError as err:
            raise ServiceValidationError(str(err)) from err

    async def step_not_on_it(call: ServiceCall) -> None:
        try:
            _manager(hass).not_on_it_chore(call.data["chore"])
        except BoopliError as err:
            raise ServiceValidationError(str(err)) from err

    async def delete_chore(call: ServiceCall) -> None:
        try:
            _manager(hass).delete_chore(call.data["chore"])
        except BoopliError as err:
            raise ServiceValidationError(str(err)) from err

    async def set_away(call: ServiceCall) -> None:
        try:
            _manager(hass).set_away(
                call.data["start"].strip().replace(" ", "T"),
                call.data["until"].strip().replace(" ", "T"),
            )
        except BoopliError as err:
            raise ServiceValidationError(str(err)) from err

    async def end_away(call: ServiceCall) -> None:
        _manager(hass).end_away()

    async def break_down(call: ServiceCall) -> ServiceResponse:
        """Split a task into small steps with the user's AI agent and return them."""
        try:
            return await _manager(hass).async_ai_steps(
                call.data["task"],
                call.data["kind"],
                call.data.get("answers"),
                call.data.get("notes", ""),
                call.data.get("rooms"),
            )
        except BoopliError as err:
            raise ServiceValidationError(str(err)) from err

    hass.services.async_register(DOMAIN, SERVICE_ADD_TASK, add_task, ADD_TASK_SCHEMA)
    hass.services.async_register(
        DOMAIN,
        SERVICE_BREAK_DOWN,
        break_down,
        BREAK_DOWN_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_START_CHORE, start_chore, CHORE_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_COMPLETE_STEP, complete_step, CHORE_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SNOOZE_STEP, snooze_step, CHORE_SCHEMA
    )
    hass.services.async_register(DOMAIN, SERVICE_STEP_ON_IT, step_on_it, CHORE_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_STEP_NOT_ON_IT, step_not_on_it, CHORE_SCHEMA)
    hass.services.async_register(
        DOMAIN, SERVICE_DELETE_CHORE, delete_chore, CHORE_SCHEMA
    )
    hass.services.async_register(DOMAIN, SERVICE_SET_AWAY, set_away, SET_AWAY_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_END_AWAY, end_away)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Boopli: load the data, serve the panel and add the sidebar entry."""
    manager = BoopliManager(hass)
    await manager.async_load()
    hass.data[DOMAIN] = manager

    try:
        if not hass.data.get(DATA_STATIC_REGISTERED):
            await hass.http.async_register_static_paths(
                [StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), cache_headers=False)]
            )
            hass.data[DATA_STATIC_REGISTERED] = True

        version = await hass.async_add_executor_job(_read_version)
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name=PANEL_ELEMENT,
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            module_url=f"{STATIC_URL}/{PANEL_BUNDLE}?v={version}",
            embed_iframe=False,
            require_admin=False,
        )
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    except Exception:
        # Setup failed half way: do not leave a running manager behind, or the retry
        # would start a second one and every nudge would come twice.
        hass.data.pop(DOMAIN, None)
        manager.async_shutdown()
        frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
        raise
    _LOGGER.debug("Boopli set up; panel registered at /%s", PANEL_URL_PATH)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Stop the timer, remove the sensors and the sidebar entry."""
    await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    manager: BoopliManager | None = hass.data.pop(DOMAIN, None)
    if manager:
        manager.async_shutdown()
    frontend.async_remove_panel(hass, PANEL_URL_PATH)
    return True
