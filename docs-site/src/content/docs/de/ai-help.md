---
title: KI-Hilfe
description: Teile eine Aufgabe mit deinem eigenen KI-Agenten in Home Assistant in winzige Schritte.
---

Wenn du eine zweite Meinung möchtest oder keinen KI-Agenten hast, schau auch bei [Claude fragen](/Boopli/de/ask-claude/) vorbei.

Boopli kann eine große Aufgabe wie „Mein Zimmer aufräumen“ in sehr kleine Schritte teilen. Dafür nutzt es **deinen eigenen KI-Agenten in Home Assistant** über die Integration AI Task. Die KI-Hilfe ist standardmäßig aus. Öffne in den Einstellungen die Karte **KI-Hilfe**. Wähle **Erweitert** und dann **KI-Hilfe einschalten**. Wähle deinen KI-Agenten und speichere. Öffne auf der Karte erneut **Erweitert** und wähle **KI-Agenten testen**. Du kannst auch dem Assistenten unter **Schritt für Schritt** folgen.

![Das Fenster für die KI-Hilfe in den Einstellungen](/Boopli/img/de/ai-help.jpg)

### Zwei Wege zur KI-Hilfe

Schreib unter „Heute“, was du erledigen möchtest. Wähle **Jetzt aufteilen** für eine einmalige Aufgabe, die nach dem Erledigen verschwindet. Mit **Eine wiederkehrende Aufgabe aufteilen** landest du am Ende beim Zeitplan-Assistenten. Unter „Aufgaben“ findest du **Neue Aufgabe mit KI**. Beim Bearbeiten einer Aufgabe füllt **KI um Schritte bitten** die Schritte aus.

### Die KI fragt zuerst

Bei einer klaren Aufgabe wie „Müll rausbringen“ kommen direkt die Schritte. Besteht die Aufgabe aus mehreren Teilen, fragt die KI, was sie wissen muss. Zum Beispiel, was im Raum steht, wie es dort aussieht und wie viel Energie du hast. Zu jeder Frage gibt es Schaltflächen und ein Feld für eine eigene Antwort. Bei Listen kannst du mehrere Antworten auswählen. Das Feld **Sollte ich noch etwas wissen?** und die Schaltfläche **Jetzt Schritte vorschlagen** sind immer da. Bei einer wiederkehrenden Aufgabe fragt der KI-Agent mehr, weil du sie einmal einrichtest und mehrfach nutzt.

### Kleine Schritte in sinnvoller Reihenfolge

Jeder Schritt ist eine konkrete Handlung. Der erste Schritt macht den Einstieg so leicht wie möglich. Die Schritte sind nach Bereichen geordnet, etwa Tisch, Stühle und Boden. Die KI kann auch eine Wartezeit vorschlagen. Eine Aufgabe kann bis zu 50 Schritte haben. Boopli legt erst etwas an, wenn du die Schritte geprüft, angepasst und zur Übernahme ausgewählt hast.

### Schrittgrößen und XP

Jeder Schritt ist klein, mittel oder groß (K, M, G) und bringt 10, 15 oder 20 XP. Schritte, die du selbst schreibst, sind klein. Unter „Heute“ siehst du den Teil der Aufgabe, „Schritt 3 von 8“ und einen Fortschrittsbalken. Wenn du eine Aufgabe erledigst, gibt es eine kleine Feier.

### Fürs nächste Mal gespeichert

Was die KI über eine wiederkehrende Aufgabe erfahren hat, bleibt bei der Aufgabe gespeichert. Du kannst es bearbeiten. Wenn du wieder **KI um Schritte bitten** wählst, nutzt die KI diese Angaben.

### Du siehst, wie lange die KI noch Zeit hat

Während der KI-Agent arbeitet, zeigt Boopli eine Animation, die verstrichene Zeit, die maximale Wartezeit von 3 Minuten und einen Balken für die bereits verstrichene Zeit. Ein ruhiger Hinweis sagt dir, dass es gerade länger dauert und die Anfrage noch läuft. Mit **Warten abbrechen** gehst du zurück. Alles, was du eingegeben hast, bleibt erhalten. Spätere Antworten werden ignoriert.

### Im eigenen KI-Chat darüber sprechen

Mit **Im eigenen Chat** (für einen Raum) oder **Mein ganzes Zuhause im eigenen Chat besprechen** bekommst du eine fertige Anweisung. Kopiere sie in einen Chat deiner Wahl, zum Beispiel einen, mit dem du sprechen kannst. Wenn du sagst, dass du fertig bist, antwortet der Chat mit einfachen Notizen. Füge sie wieder in Boopli ein. Boopli entfernt Aufzählungszeichen und Markdown-Markierungen, auch die für Codeblöcke. Eine Antwort zum ganzen Zuhause teilt Boopli anhand der Überschriften `## Room` in Räume auf. Vor dem Speichern kannst du alles noch einmal ansehen. Du entscheidest, was du beim Einfügen in deinen eigenen Chat teilst. Das funktioniert auch bei ausgeschalteter KI-Hilfe.

### Dienst

`boopli.break_down` (`task`, optional `kind`, `answers`, `notes`, `rooms`) liefert die Schritte für deine Automatisierungen und Sprachassistenten zurück. Ohne `rooms` leitet Boopli die Räume aus der Aufgabe ab, wie im Panel. Siehe auch [Dienste, Ereignisse und Sensoren](/Boopli/de/automations/).

### Du kannst die Anweisungen ändern

Öffne auf der Karte „KI-Hilfe“ das Fenster **Erweitert** und dann **Erweitert: KI-Agent für Fotos und KI-Anweisungen**. Dort kannst du die beiden Anweisungen für Fragen und Schritte lesen, ändern und zurücksetzen. Das gilt auch für die beiden Texte, die du in deinen eigenen KI-Chat kopierst (für einen Raum oder das ganze Zuhause). Die eingebauten Anweisungen der KI-Hilfe verlangen ein einzelnes JSON-Objekt. Die Anweisungen bleiben auf Englisch. Boopli bittet den KI-Agenten, in der Sprache von Home Assistant zu antworten.

## Datenschutz

Von sich aus sendet Boopli nichts an einen KI-Dienst. Wenn du die KI-Hilfe nutzt, schickt Boopli den Aufgabentext und deine Antworten an den gewählten KI-Agenten. Notizen, die bei einer wiederkehrenden Aufgabe gespeichert sind, können erneut genutzt werden. Du kannst auch ausgewählte Raumnotizen oder Fotos teilen. Wenn der KI-Agent in der Cloud läuft, erhält der Anbieter deine geteilten Angaben und kann sie speichern. Boopli löscht nach der Anfrage seine eigenen temporären Fotodateien. Gerätenamen, der Verlauf von Home Assistant und dein Standort sind in der Anfrage nicht enthalten. Was du eingibst oder fotografierst, kann trotzdem private Angaben enthalten. Wenn der KI-Agent die Anfrage nicht bearbeiten kann, zeigt Boopli den gemeldeten Grund an.
