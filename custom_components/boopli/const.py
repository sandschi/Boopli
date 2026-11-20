"""Constants for the Boopli integration."""

DOMAIN = "boopli"

# Sidebar panel
PANEL_URL_PATH = "boopli"
PANEL_ELEMENT = "boopli-panel"
PANEL_TITLE = "Boopli"
PANEL_ICON = "mdi:sprout"

# Static files (the built panel bundle) are served under this URL prefix.
STATIC_URL = "/boopli_static"
PANEL_BUNDLE = "boopli-panel.js"

# Set once the static path has been registered; it cannot be unregistered.
DATA_STATIC_REGISTERED = f"{DOMAIN}_static_registered"
