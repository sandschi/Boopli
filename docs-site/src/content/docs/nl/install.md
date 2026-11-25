---
title: Boopli installeren
description: Installeer Boopli met HACS of met de hand en voeg de integratie daarna toe aan Home Assistant.
---

Boopli is een aangepaste integratie voor Home Assistant. Je kunt klussen en seintjes gebruiken met je bestaande Home Assistant-installatie.

## Met HACS

1. Open HACS en voeg `https://github.com/sandschi/Boopli` toe als aangepaste repository van het type **Integration**. Deze knop doet dat voor je:

   [![Open je Home Assistant-installatie en open deze repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sandschi&repository=Boopli&category=integration)

2. Download Boopli in HACS en start Home Assistant opnieuw op.

## Met de hand

Kopieer de map `custom_components/boopli` uit de repository naar de map `custom_components` van je Home Assistant-configuratie. Start daarna Home Assistant opnieuw op.

## Voeg Boopli toe aan Home Assistant

Ga naar **Instellingen, Apparaten en diensten, Integratie toevoegen** en kies **Boopli**, of gebruik deze knop:

[![Open je Home Assistant-installatie en begin met het instellen van Boopli.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=boopli)

Boopli verschijnt daarna als paneel in de zijbalk van Home Assistant. Als je het voor het eerst opent, helpt Boopli je stap voor stap op weg. Het paneel, het instelvenster en de dienstbeschrijvingen zijn beschikbaar in het Engels (en), Duits (de), Nederlands (nl), Frans (fr) en Spaans (es). Ga verder met [Boopli instellen](/Boopli/nl/setup/).
