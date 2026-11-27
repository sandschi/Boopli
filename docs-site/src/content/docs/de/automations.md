---
title: Aktionen, Ereignisse und Sensoren
description: Erstelle eigene Automatisierungen mit Boopli.
---

Deine Automatisierungen, Skripte und Sprachassistenten können drei Dinge von Boopli nutzen. Es gibt Aktionen zum Aufrufen, Ereignisse zum Abhören und Sensoren für dein Haustier.

## Aktionen

| Aktion | Was sie tut |
|---|---|
| `boopli.break_down` | Teilt eine Aufgabe mit deinem KI-Agenten in kleine Schritte und gibt sie zurück. Dazu muss die KI-Hilfe eingeschaltet sein. Felder: `task` sowie optional `kind` (`now` oder `recurring`), `answers`, `notes` und `rooms`. Ohne `rooms` leitet Boopli die Räume aus der Aufgabe ab, wie im Panel. |
| `boopli.add_task` | Erstellt eine einmalige Aufgabe (auf Wunsch mit Schritten) und startet sie. Sie verschwindet, wenn sie erledigt ist. |
| `boopli.start_chore` | Startet eine Aufgabe sofort anhand ihres Namens oder ihrer ID. |
| `boopli.complete_step` | Markiert den Schritt als erledigt, der bei einer Aufgabe auf dich wartet. |
| `boopli.snooze_step` | Verschiebt den nächsten Stups für den Schritt, der bei einer Aufgabe auf dich wartet. |
| `boopli.step_on_it` | Sagt Boopli, dass du am wartenden Schritt einer Aufgabe arbeitest („Bin dran“). |
| `boopli.step_not_on_it` | Setzt die Stupse nach „Bin dran“ fort. |
| `boopli.delete_chore` | Löscht eine Aufgabe und alles, was dafür gerade läuft. |
| `boopli.set_away` | Schaltet den [Abwesenheitsmodus](/Boopli/de/away-mode/) ein. Optional mit `start` und `until`, zum Beispiel `2026-11-28 08:00`. |
| `boopli.end_away` | Schaltet den Abwesenheitsmodus aus. |

Aktionen, die eine Aufgabe (`chore`) erwarten, akzeptieren ihren Namen oder ihre ID. Wenn zwei Aufgaben denselben Namen haben, nutze die ID.

## Ereignisse

Diese Ereignisse laufen über den Ereignisbus von Home Assistant. Sie können eine Automatisierung auslösen.

| Ereignis | Wann |
|---|---|
| `boopli_chore_started` | Eine Aufgabe wurde gestartet. |
| `boopli_questions_answered` | Du hast die Fragen zu einer Aufgabe vor dem Start beantwortet. |
| `boopli_step_active` | Ein Schritt ist jetzt dran. |
| `boopli_step_on_it` | Du hast für einen Schritt **Bin dran** gewählt. |
| `boopli_step_done` | Ein Schritt ist erledigt. In `by` steht `manual` oder `auto`. In `reason` steht, was passiert ist. |
| `boopli_chore_done` | Alle Schritte einer Aufgabe sind erledigt. |
| `boopli_nudge_sent` | Boopli hat dich angestupst. |
| `boopli_blubs_earned` | Du hast einen Schritt erledigt und dafür Blubs bekommen. |
| `boopli_xp_gained` | Du hast dein Haustier gefüttert und dafür XP bekommen. |
| `boopli_achievement_unlocked` | Du hast einen Erfolg freigeschaltet. Das Ereignis wird pro Erfolg einmal ausgelöst und enthält seine ID in `achievement`. |
| `boopli_away_started` | Der Abwesenheitsmodus wurde gestartet. |
| `boopli_away_ended` | Der Abwesenheitsmodus wurde beendet. |

## Sensoren

Boopli fügt ein Gerät namens **Boopli** mit drei Sensoren für dein Haustier hinzu:

- **XP** gibt die Gesamtzahl der XP deines Haustiers an.
- **Level** zeigt das Level deines Haustiers.
- **Mood** (Stimmung) hat einen dieser Werte: `happy`, `content`, `sleepy`, `sad` oder `hibernating` (fröhlich, zufrieden, müde, traurig oder im Tiefschlaf).

Du kannst die Sensoren in einem Dashboard anzeigen oder in Automatisierungen nutzen. Lass zum Beispiel eine Lampe grün leuchten, wenn der Sensor **Mood** den Wert `happy` hat.
