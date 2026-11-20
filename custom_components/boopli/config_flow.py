"""Config flow for Boopli.

Setup is a single click. The real onboarding wizard lives inside the panel.
"""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN


class BoopliConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the Boopli config flow."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Confirm setup, then create the single Boopli entry."""
        if user_input is not None:
            return self.async_create_entry(title="Boopli", data={})
        return self.async_show_form(step_id="user")
