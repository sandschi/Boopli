---
title: Boopli installieren
description: Installiere Boopli mit HACS oder von Hand und füge es zu Home Assistant hinzu.
---

Boopli ist eine benutzerdefinierte Integration für Home Assistant. Du kannst die Aufgaben und Stupse mit deiner vorhandenen Home-Assistant-Einrichtung nutzen.

## Mit HACS

1. Öffne HACS und füge `https://github.com/sandschi/Boopli` als benutzerdefiniertes Repository vom Typ **Integration** hinzu. Diese Schaltfläche erledigt das für dich:

   [![Öffne deine Home-Assistant-Instanz und rufe dieses Repository in HACS auf.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sandschi&repository=Boopli&category=integration)

2. Lade Boopli in HACS herunter und starte Home Assistant neu.

## Von Hand

Kopiere den Ordner `custom_components/boopli` aus dem Repository in den Ordner `custom_components` deiner Home-Assistant-Konfiguration. Starte danach Home Assistant neu.

## Zu Home Assistant hinzufügen

Gehe zu **Einstellungen → Geräte & Dienste → Integration hinzufügen** und wähle **Boopli** aus. Du kannst auch diese Schaltfläche nutzen:

[![Öffne deine Home-Assistant-Instanz und beginne mit der Einrichtung von Boopli.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=boopli)

Boopli erscheint danach als Panel in der Seitenleiste von Home Assistant. Beim ersten Öffnen startet der Assistent zur Einrichtung. Das Panel, der Einrichtungsdialog und die Aktionsbeschreibungen sind auf Englisch (en), Deutsch (de), Niederländisch (nl), Französisch (fr) und Spanisch (es) verfügbar. Weiter geht’s mit [Boopli einrichten](/Boopli/de/setup/).
