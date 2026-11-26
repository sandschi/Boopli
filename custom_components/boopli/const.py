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

# Access levels (chosen by an administrator; administrators always may everything)
ACCESS_USE = 1  # use Boopli: see it, work through chores and steps
ACCESS_NOTES = 2  # ... and edit the rooms and their notes
ACCESS_ALL = 3  # ... and everything except the administrator's own things
ACCESS_ADMIN = 4  # only administrators (backup, Ask Claude token, choosing the level)
ACCESS_DEFAULT = ACCESS_USE
