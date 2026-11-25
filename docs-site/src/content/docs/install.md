---
title: Install Boopli
description: Install Boopli with HACS or by hand, then add it to Home Assistant.
---

Boopli is a custom integration for Home Assistant. You can use its chores and nudges with your existing Home Assistant setup.

## With HACS

1. Open HACS and add `https://github.com/sandschi/Boopli` as a custom repository of type **Integration**. This button does it for you:

   [![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sandschi&repository=Boopli&category=integration)

2. Download Boopli in HACS and restart Home Assistant.

## By hand

Copy the folder `custom_components/boopli` from the repository into the `custom_components` folder of your Home Assistant configuration, then restart Home Assistant.

## Add it to Home Assistant

Go to **Settings, Devices & services, Add integration** and select **Boopli**, or use this button:

[![Open your Home Assistant instance and start setting up Boopli.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=boopli)

Boopli then shows up as a panel in the Home Assistant sidebar, and its setup wizard opens the first time you open it. The panel, setup dialog and service descriptions are available in English (en), German (de), Dutch (nl), French (fr) and Spanish (es). Go on with [Set up Boopli](/Boopli/setup/).
