---
title: Deine Daten und Backups
description: Wo Boopli seine Daten speichert und wie du sie sicherst.
---

Boopli speichert seine Daten im normalen Speicher von Home Assistant. Deine regelmäßigen Home-Assistant-Backups enthalten deshalb auch die Daten von Boopli.

## Backup

Die Karte **Backup** unter „Extras“ speichert deine Einrichtung in einer einzigen Datei mit der Endung .adhd. Darin steht einfaches JSON. Du kannst die Datei auch wieder laden, zum Beispiel nach einer Neuinstallation. Wähle aus, was ins Backup soll: **Einstellungen**, **Aufgaben**, **Räume und Notizen** und **Haustier und Verlauf**. Alle vier sind vorausgewählt. **Importieren** zeigt dir, was in der Datei steht, was sich ändern würde und welche Geräte in dieser Installation fehlen. Nach deiner Bestätigung ersetzt Boopli die ausgewählten Teile. Wenn du Aufgaben importierst, stoppt Boopli laufende Aufgaben, die im Backup fehlen. Boopli prüft die Datei, bevor sich etwas ändert. Laufende Aufgaben, der Abwesenheitsmodus und Bilddateien sind vom Backup ausgeschlossen. Bewahre die Datei privat auf. Sie kann Gerätenamen und Raumnotizen enthalten. Nur Personen mit Adminrechten können Daten exportieren oder importieren.

Wenn du die [KI-Hilfe](/Boopli/de/ai-help/) oder [Claude fragen](/Boopli/de/ask-claude/) nutzt, erhält der gewählte KI-Dienst deine Aufgabe, deine Antworten und alle Raumnotizen oder Fotos, die du teilst. Ein Cloud-Anbieter kann diese Daten speichern. Boopli löscht nach der Anfrage seine eigenen temporären Fotodateien.
