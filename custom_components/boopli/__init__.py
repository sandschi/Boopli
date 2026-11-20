"""Boopli: an ADHD-friendly chore and task companion for Home Assistant."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

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

_LOGGER = logging.getLogger(__name__)

FRONTEND_DIR = Path(__file__).parent / "frontend"
MANIFEST = Path(__file__).parent / "manifest.json"


def _read_version() -> str:
    """Read the integration version, used to bust the browser cache."""
    return json.loads(MANIFEST.read_text(encoding="utf-8")).get("version", "0")


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Boopli: serve the panel bundle and add the sidebar entry."""
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
    _LOGGER.debug("Boopli panel registered at /%s", PANEL_URL_PATH)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the sidebar entry when the integration is unloaded."""
    frontend.async_remove_panel(hass, PANEL_URL_PATH)
    return True
