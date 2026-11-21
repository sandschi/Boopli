"""Boopli's pet as sensors: XP, level and mood.

They are real entities, so they work on dashboards and in automations
("the pet is sad: flash the hallway light").
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import engine
from .const import DOMAIN
from .manager import BoopliManager


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Add the three pet sensors."""
    manager: BoopliManager = hass.data[DOMAIN]
    async_add_entities(
        [BoopliXpSensor(manager, entry), BoopliLevelSensor(manager, entry), BoopliMoodSensor(manager, entry)]
    )


class _BoopliSensor(SensorEntity):
    """Base: reads the pet from the manager and updates whenever Boopli changes."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _key = ""

    def __init__(self, manager: BoopliManager, entry: ConfigEntry) -> None:
        self._manager = manager
        self._attr_unique_id = f"{entry.entry_id}_{self._key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name="Boopli",
            manufacturer="Boopli",
        )

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self._manager.async_add_listener(self._changed))

    @callback
    def _changed(self) -> None:
        self.async_write_ha_state()

    @property
    def _pet(self) -> dict[str, Any]:
        return self._manager.pet()

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"pet_name": self._pet["name"]}


class BoopliXpSensor(_BoopliSensor):
    _key = "xp"
    _attr_name = "XP"
    _attr_icon = "mdi:star-four-points"
    _attr_native_unit_of_measurement = "XP"
    _attr_state_class = SensorStateClass.TOTAL_INCREASING

    @property
    def native_value(self) -> int:
        return self._pet["total_xp"]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        pet = self._pet
        return {
            "pet_name": pet["name"],
            "xp_in_level": pet["xp_in_level"],
            "xp_for_level": pet["xp_for_level"],
        }


class BoopliLevelSensor(_BoopliSensor):
    _key = "level"
    _attr_name = "Level"
    _attr_icon = "mdi:arrow-up-bold-circle"

    @property
    def native_value(self) -> int:
        return self._pet["level"]


class BoopliMoodSensor(_BoopliSensor):
    _key = "mood"
    _attr_name = "Mood"
    _attr_icon = "mdi:paw"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(engine.MOOD_VALUES)

    @property
    def native_value(self) -> str:
        return self._pet["mood"]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        pet = self._pet
        return {"pet_name": pet["name"], "last_activity": pet["last_activity"]}
