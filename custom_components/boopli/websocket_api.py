"""Websocket commands used by the Boopli panel."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from .manager import BoopliError, BoopliManager


def _manager(hass: HomeAssistant) -> BoopliManager | None:
    return hass.data.get(DOMAIN)


def async_register_websocket_commands(hass: HomeAssistant) -> None:
    """Register all Boopli websocket commands (once)."""
    websocket_api.async_register_command(hass, ws_state)
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_chore_save)
    websocket_api.async_register_command(hass, ws_chore_delete)
    websocket_api.async_register_command(hass, ws_chore_start)
    websocket_api.async_register_command(hass, ws_step_complete)


def _not_loaded(connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_error(msg["id"], "not_loaded", "Boopli is not set up.")


@websocket_api.websocket_command({vol.Required("type"): "boopli/state"})
@callback
def ws_state(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return a snapshot of everything the panel shows."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    connection.send_result(msg["id"], manager.snapshot())


@websocket_api.websocket_command({vol.Required("type"): "boopli/subscribe"})
@callback
def ws_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Push a fresh snapshot to the panel whenever anything changes."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return

    @callback
    def forward() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], manager.snapshot())
        )

    connection.subscriptions[msg["id"]] = manager.async_add_listener(forward)
    connection.send_result(msg["id"])
    forward()


@websocket_api.websocket_command(
    {vol.Required("type"): "boopli/chore_save", vol.Required("chore"): dict}
)
@callback
def ws_chore_save(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Create or update a chore."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        chore = manager.save_chore(msg["chore"])
    except BoopliError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"id": chore.id})


@websocket_api.websocket_command(
    {vol.Required("type"): "boopli/chore_delete", vol.Required("chore_id"): str}
)
@callback
def ws_chore_delete(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Delete a chore (and any run in progress)."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        manager.delete_chore(msg["chore_id"])
    except BoopliError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command(
    {vol.Required("type"): "boopli/chore_start", vol.Required("chore_id"): str}
)
@callback
def ws_chore_start(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Start a chore now."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    try:
        run = manager.start_chore(msg["chore_id"])
    except BoopliError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], {"run_id": run.id})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "boopli/step_complete",
        vol.Required("run_id"): str,
        vol.Required("step_id"): str,
    }
)
@callback
def ws_step_complete(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The user pressed Done on a step."""
    manager = _manager(hass)
    if manager is None:
        _not_loaded(connection, msg)
        return
    manager.complete_step(msg["run_id"], msg["step_id"])
    connection.send_result(msg["id"])
