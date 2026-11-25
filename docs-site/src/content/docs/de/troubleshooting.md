---
title: Fehlersuche
description: Was du prüfen kannst, wenn etwas nicht funktioniert.
---

## Boopli stupst mich nicht an

- Prüfe die **Ruhezeiten** in den Einstellungen. Für jeden Wochentag kannst du eigene Zeiten festlegen.
- Prüfe den **Abwesenheitsmodus**. Solange er aktiv ist, bekommst du nur Stupse für Aufgaben, die weiterlaufen sollen.
- Wähle in den Einstellungen **Testen** neben der Lampe, dem Lautsprecher, dem Alarmgerät oder dem Handy. Wenn der Test klappt, funktioniert der Weg über dieses Gerät. Prüfe dann den Stups-Stil oder die Stups-Kette.
- Eine Aufgabe mit dem Stil **Keine Stupse** erscheint nur in Boopli.
- Wenn du dein Handy eingerichtet hast, prüfe, ob die Home-Assistant-App darauf Benachrichtigungen senden darf.

## Eine Lampe verhält sich seltsam

Boopli nutzt die eingebaute Blinkfunktion einer Lampe nicht. Manche Lampen melden, dass sie die Funktion unterstützen, und ignorieren den Befehl trotzdem. Boopli lässt die Lampe selbst blinken und stellt ihren Zustand danach genau wieder her. Lampen mit Cloud-Anbindung brauchen zwischen Änderungen etwa eine Sekunde oder länger. Stelle für sie eine längere Blinkdauer ein.

## Der KI-Agent antwortet gar nicht oder seltsam

- Öffne auf der Karte **KI-Hilfe** das Fenster **Erweitert** und wähle **KI-Agenten testen**. Wenn der Test fehlschlägt, zeigt Boopli den Grund an, den der KI-Agent meldet. Zum Beispiel ist das Guthaben aufgebraucht, ein Modell ist nicht mehr verfügbar oder die Wartezeit ist abgelaufen.
- Boopli wartet höchstens 3 Minuten auf den KI-Agenten. Mit **Warten abbrechen** bleibt alles erhalten, was du eingegeben hast.
- Für Fotos brauchst du einen KI-Agenten, der Bilder auswerten kann. Öffne auf der Karte **KI-Hilfe** das Fenster **Erweitert**. Unter **Erweitert: KI-Agent für Fotos und KI-Anweisungen** kannst du einen anderen **KI-Agent für Fotos** wählen.
- Kostenlose Modelle antworten manchmal in einem unerwarteten Format. Boopli rettet fehlerhafte Schritte, soweit es geht. Mit **Erneut versuchen** fragst du noch einmal nach.

## „Claude fragen“ funktioniert nicht

| Das sagt Boopli | Was du tun kannst |
|---|---|
| Claude hat den Token abgelehnt. Erstelle einen neuen Token für die Routine, füge ihn in Boopli ein und versuch’s noch mal. | Erstelle den neuen Token auf claude.ai. |
| Claude konnte die Routine nicht finden. Prüfe die Auslöse-URL der Routine. | Prüfe, ob die URL auf `/fire` endet. |
| Claude hat die Zahl der Anfragen vorübergehend begrenzt. Versuch’s in einer Weile noch mal. | Warte, bevor du eine weitere Anfrage schickst. |
| Claude hat die Anfrage abgelehnt. Schau nach, ob die Routine eingeschaltet ist. | Öffne die Routine auf claude.ai und prüfe, ob sie eingeschaltet ist. |
| Bei Claude hakt es gerade. Versuch’s in ein paar Minuten noch mal. | Warte, bevor du eine weitere Anfrage schickst. |
| Boopli hat Claude nicht erreicht. Prüfe die Internetverbindung. | Prüfe die Internetverbindung von Home Assistant. |
| Boopli hat aufgehört, auf Claudes Antwort zu warten. Die maximale Wartezeit beträgt 2 Minuten. Versuch’s noch mal. | Prüfe, ob die Routine Home Assistant erreichen kann. Siehe unten. |
| Claude kann Home Assistant unter keiner Webadresse erreichen. Trag unter „Claude fragen“ die Adresse von Home Assistant ein oder leg die externe URL in Home Assistant fest. | Lege die externe URL in Home Assistant fest oder nutze **Webadresse von Home Assistant (erweitert)** unter „Claude fragen“. |
| Boopli hat das Limit von 20 Claude-Anfragen pro Stunde erreicht. Versuch’s in etwa 5 Minuten noch mal. | Warte die angezeigte Zahl von Minuten. |

**Die Routine läuft, aber es kommt keine Antwort an.** Die Umgebung der Routine muss deine Home-Assistant-Adresse erlauben. Wähle **eingeschränkten Netzwerkzugriff** („Limited“) und erlaube den Hostnamen. Die Adresse muss aus dem Internet erreichbar sein, auch von außerhalb deines Zuhauses. Öffne den Durchlauf auf claude.ai, um zu sehen, was die Routine getan hat.

**Der Test klappt, aber Fotos kommen nicht an.** Die Routine ruft Fotos über einen Link zu deiner Home-Assistant-Adresse ab. Deshalb muss die Adresse auch in der Umgebung erlaubt sein.

## Meine Einstellungen wurden nicht gespeichert

Änderungen in den Einstellungen bleiben Entwürfe, bis du **Speichern** wählst. Unten zeigt eine Leiste die Karten mit ungespeicherten Änderungen. Wenn du die Seite mit ungespeicherten Änderungen verlässt, kannst du **Speichern**, **Verwerfen** oder **Hierbleiben** wählen.

## Etwas anderes

Öffne in Home Assistant **Einstellungen → System → Protokolle** und suche nach `boopli`. Wenn es ein Fehler ist, melde ihn unter [github.com/sandschi/Boopli/issues](https://github.com/sandschi/Boopli/issues). Gib die Versionen von Boopli und Home Assistant an und schreib dazu, was im Protokoll steht.
