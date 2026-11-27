---
title: Aufgaben und Zeitpläne
description: Aufgabenarten, Zeitpläne und Schritte, die warten, Fragen stellen oder sich von selbst erledigen.
---

## Zeitpläne für Aufgaben

Für eine Aufgabe gibt es drei Möglichkeiten:

- **Bei Bedarf**. Du startest die Aufgabe selbst.
- **An bestimmten Tagen und zu bestimmten Zeiten**. Für jeden Wochentag kannst du eigene Zeiten festlegen oder ihn freilassen. Die Tage werden einzeln eingestellt. Pro Tag sind bis zu sechs Zeiten möglich. Zum Beispiel kannst du Tabletten für 08:00 und 20:00 einplanen oder den Geschirrspüler von Montag bis Freitag um 19:30 und am Samstag um 11:00. Beim Bearbeiten einer Aufgabe hat jeder Tag eine Zeile mit dem Kästchen **Geplant**, den Zeiten und einer Schaltfläche wie **Wie Mo**.
- **Nach dem Erledigen (Abstand in Tagen)**. Die Aufgabe kommt N Tage nach dem letzten Abschluss wieder, zu einer Uhrzeit deiner Wahl.

Wenn eine Aufgabe fällig wird, während der letzte Durchlauf noch offen ist, überspringt Boopli den neuen Termin. So stapeln sich keine Durchläufe.

**Zeitplan-Assistent.** Mit **Zeitplan Schritt für Schritt** öffnest du beim Bearbeiten der Aufgabe einen Assistenten. Er fragt, wie oft und an welchen Tagen die Aufgabe dran ist und zu welcher Uhrzeit an jedem Tag. Danach siehst du die nächsten fünf Termine, die Boopli selbst berechnet. Zum Schluss siehst du, was sich geändert hat. Bei Aufgaben ohne Zeitplan steht in der Aufgabenliste **Zeitplan festlegen**. Das öffnet den Assistenten direkt und speichert die Aufgabe, wenn du fertig bist. Wenn du den Assistenten beim Bearbeiten einer Aufgabe öffnest, füllt er nur das Formular aus. Die Leiste für ungespeicherte Änderungen erinnert dich ans Speichern.

## Schritte, die warten oder Fragen stellen

### Teile einer Aufgabe für später zur Seite legen

Schritte gehören zu Teilen wie „Schreibtisch“, „Sofa“ oder „Boden“. Geht es in einer Aufgabe um einen ganzen Raum, bekommt jedes Ding in den Raumnotizen einen eigenen, vollständigen Teil. Mit **<Gruppe> später machen** (etwa **Schreibtisch später machen**) legst du unter „Heute“ die offenen Schritte eines Teils als kleine eigene Aufgabe zur Seite, etwa „Wohnzimmer putzen: Schreibtisch“. Wähle **Ich starte es selbst**, **Morgen um 9:00** oder **Zeit wählen**. Alles bleibt erhalten und nichts wird überfällig. Der Teil wartet unter **Für später** (**Jetzt starten**, **Zeit ändern**, **Löschen**). Zur gewählten Zeit startet er von selbst, mit den gewohnten Stupsen und XP. Du kannst einen ganzen Teil zur Seite legen, solange es noch einen anderen Teil in der Aufgabe gibt. Für einzelne Schritte gibt es „Verschieben“.

### Warten, bis etwas passiert

Ein Schritt kann auf ein Ereignis warten und muss sich dabei nicht nach einer festen Zeit richten. „Warten, bis das passiert…“ bietet dieselben Auslöser wie „Erledigt sich von selbst, wenn…“: den Zustand oder Messwert einer Entität, einen NFC-Tag, eine Taste oder eine Ereignisentität. Solange keiner der Auslöser eintritt, bleibt der Schritt still. Dann bist du dran. Die eingestellten Minuten geben an, wie lange der Schritt höchstens wartet (0 = so lange, wie es dauert). „Wäsche aufhängen“ kann zum Beispiel darauf warten, dass die Waschmaschine das Ende des Waschgangs meldet. Beim Bearbeiten einer Aufgabe hat jeder Schritt außerdem das Feld **Zu welchem Bereich / welcher Phase gehört dieser Schritt? (optional)**. So kannst du selbst Teile festlegen.

### Fragen vor dem Start

Wenn eine Aufgabe mit Fragen von selbst startet, stehen die Fragen unter „Heute“ bei **Erst kurz schauen**.

Eine Aufgabe kann bei jedem Start Ja-Nein-Fragen stellen, etwa „Muss der Tisch freigeräumt werden?“. Die Lage kann sich jedes Mal ändern. Ein Schritt, der über das Feld **Nur wenn:** an eine Frage geknüpft ist, erscheint nur bei **Ja** (grün). Bei **Nein** (rot) bleibt er ganz weg. Schritte ohne Frage stehen immer in der Liste. Der Tisch wird also auf jeden Fall gewischt. Wenn du **Jetzt starten** wählst, beantwortest du zuerst die Fragen. Startet eine Aufgabe von selbst (durch einen Zeitplan, Sensor oder NFC-Tag), beginnen alle Schritte sofort. Auslöser und „Fertig“ funktionieren wie gewohnt. Auf deinem Handy kannst du in der Benachrichtigung **Mit allen Schritten starten** oder **Fragen beantworten** wählen. Mit **Fragen beantworten** öffnet sich Boopli in der App. Der erste Stups wartet auf deine Antworten. In den Einstellungen kannst du die Wartezeit ändern. Die Voreinstellung ist 30 Minuten. Wenn du später antwortest, passt Boopli die noch offenen Schritte an. Teilt die KI eine wiederkehrende Aufgabe auf, kann sie diese Fragen selbst schreiben. Die Aufgabe behält sie für nächste Woche. Automatisierungen erhalten die Antworten in den Ereignissen `boopli_chore_started` und `boopli_questions_answered`.

## Schritte, die sich von selbst erledigen

Beim Bearbeiten einer Aufgabe hat jeder Schritt den optionalen Abschnitt **Erledigt sich von selbst, wenn…**. Sobald einer der Auslöser eintritt, markiert Boopli den Schritt als erledigt, beendet seine Stupse (Lampen, Töne, Alarm, Handy-Benachrichtigung) und macht weiter. Ein Auslöser genügt. Die Schaltfläche „Fertig“ funktioniert weiterhin.

- **Eine Entität ändert sich**. Wähle eine beliebige Entität und einen Zustand (`on`, `open`, `home`…) oder einen Wert, den sie über- oder unterschreiten muss. Du kannst auch angeben, wie viele Minuten die Bedingung erfüllt bleiben muss. Zum Beispiel meldet ein Türsensor, dass die Tür offen ist, oder die Bodenfeuchte steigt über 40.
- **Ein NFC-Tag wird gescannt**. Wähle einen Tag aus der Liste in Home Assistant. Oder wähle **Jetzt scannen** und halte dein Handy an den Tag.
- **Eine Taste wird gedrückt**. Wähle eine beliebige Entität vom Typ `event`, `input_button` oder `button`. Du kannst auch festlegen, dass nur eine bestimmte Art zählt, etwa einfaches oder doppeltes Drücken.

Standardmäßig muss ein Auslöser **nach dem Start des Schritts** eintreten. Eine Tür, die schon offen steht, erledigt also den Schritt „Zum Trocknen öffnen“ nicht. Unter der Bedingung kannst du **Zählt auch, wenn die Bedingung beim Start des Schritts schon erfüllt ist** wählen. So zählen zum Beispiel Fenster, die schon geschlossen sind. Wenn du keine Dauer für die Bedingung eingestellt hast, erledigt sich der Schritt sofort und ohne Stups.

Ein Sensor, der nicht verfügbar ist oder dessen Zustand unbekannt ist, kann keinen Schritt abschließen. So erledigte Schritte stehen unter „Heute“ bei „Von selbst erledigt“. Dort steht auch, was passiert ist. Die Ereignisse `boopli_step_done` enthalten `by` (`manual` oder `auto`) und `reason`. Auslöser, deren Bedingung beim Neustart von Home Assistant schon erfüllt war, werden noch einmal geprüft. Tastendrücke und Scans gehen verloren, wenn Home Assistant dabei aus war.

### „Bin dran“, während du arbeitest

Wähle unter „Heute“, auf dem Wallboard oder in der Handy-Benachrichtigung **Bin dran**, um die Stupse während der Arbeit zu pausieren. Die Benachrichtigung auf dem Handy wird grün und still. Nach der eingestellten Wartezeit (standardmäßig 30 Minuten) kann Boopli auf deinem Handy mit **Fertig** und **Bin noch dran** nachfragen. Um die Stupse wieder einzuschalten, wähle unter „Heute“, auf dem Wallboard oder in der Handy-Benachrichtigung **Stupse fortsetzen**. Für deine eigenen Automatisierungen gibt es die Aktionen `boopli.step_on_it` und `boopli.step_not_on_it` sowie das Ereignis `boopli_step_on_it`.

### Ein Bild zum Stups

Ein Schritt kann in der Handy-Benachrichtigung ein Bild zeigen, zum Beispiel von der Tablettendose oder der Anzeige der Waschmaschine. Öffne beim Bearbeiten des Schritts **Bild für die Benachrichtigung…**. Wähle **Kamera** für ein aktuelles Bild oder **Bilddatei** für eine Datei im Medienordner von Home Assistant, zum Beispiel `boopli/pills.jpg`. Das Bild bleibt sichtbar, wenn du **Bin dran** wählst und wenn Boopli nachfragt. Dafür muss dein Handy Home Assistant erreichen können. Das Bild ist optional. Ohne Bild schickt der Schritt dieselbe Benachrichtigung wie bisher. Für den Zugriff auf den Medienordner musst du angemeldet sein. Der Ordner `www` ist öffentlich.
