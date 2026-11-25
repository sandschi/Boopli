---
title: Stupse
description: Wie Lampen, Lautsprecher, Alarmgeräte und Handys dich anstupsen, vom leisen Signal bis zum Alarm.
---

Wenn ein Schritt dran ist, stupst Boopli dich über die Geräte an, die du unter **Einstellungen** einschaltest.

### Lampen

Für jede Lampe wählst du **Blinken** oder **Statuslicht (an, bis du fertig bist)**. Beim Blinken merkt sich Boopli den aktuellen Zustand der Lampe. Sie leuchtet für die eingestellte Dauer in deiner Farbe (in Millisekunden). Das wiederholt sich 1 bis 5 Mal mit der Pause, die du einstellst. Danach stellt Boopli den ursprünglichen Zustand wieder her. Als Statuslicht leuchtet die Lampe in einer Farbe, bis du fertig bist. Boopli schaltet das Blinken selbst, weil manche Lampen ihre eingebaute Blinkfunktion melden und den Befehl dafür trotzdem ignorieren. Wähle **Testen**, um zu sehen, wie deine Lampe reagiert. Eine lokal verbundene Lampe kann schon nach ein paar Hundert Millisekunden reagieren. Eine Lampe mit Cloud-Anbindung braucht etwa eine Sekunde oder länger.

### Lautsprecher

Du kannst jeden Mediaplayer hinzufügen. Jeder Lautsprecher hat drei Stufen, die du einzeln ein- oder ausschalten kannst. Es gibt einen kurzen Ton, einen vorgelesenen Satz und einen Alarmton, der sich für die eingestellte Dauer wiederholt. Der Lautsprecher spielt die höchste Stufe, die erreicht ist. Als Ton kannst du einen Alexa-Ton über seine ID angeben, etwa `amzn_sfx_scifi_alarm_01`, oder eine Datei im Medienordner von Home Assistant, etwa `boopli/ding.mp3`. Vorlesen geht über Alexa Media Player, eine Benachrichtigungsentität von Alexa Devices oder eine Vorlesestimme auf dem Lautsprecher. Mit **Ding testen**, **Vorlesen testen** und **Alarm testen** kannst du die Töne ausprobieren.

### Alarmgeräte

Boopli kann eine Sirene, einen Schalter oder ein Skript für eine eingestellte Dauer einschalten und danach wieder ausschalten. Das Gerät geht auch aus, wenn du auf den Stups antwortest oder Home Assistant neu startet.

### Stufen

Die Geräteeinstellungen geben vor, wann die Stupse kommen. Bei einem Lautsprecher legst du zum Beispiel mit **Ab Stups** fest, wann sein Ton dazukommt. Unter **Stups-Ketten** wählst du, welche Geräte bei welchem Stups mitmachen.

### Handys

Die Home-Assistant-App schickt eine Benachrichtigung mit **Fertig** und **Verschieben**. Du legst die Stufe fest: **Normale Benachrichtigung**, **Benachrichtigung mit hoher Priorität**, **Alarmlautstärke** oder **Maximale Alarmlautstärke (nur auf unterstützten Handys)**.

### Stups-Stil pro Aufgabe

**Keine Stupse** (nur im Panel), **Ein Stups**, **Immer deutlicher** (30, 15, 10, danach alle 5 Minuten, bis die Stupse aufhören) oder **Wiederholt** (alle 5 Minuten, bis du fertig bist).

### Stups-Ketten

Öffne **Stups-Ketten** in den Einstellungen, um eine eigene Kette zu erstellen. Eine Kette besteht aus bis zu 12 Stupsen. Für jeden Stups wählst du, wie lange Boopli darauf wartet und genau welches Handy (und wie laut), welche Lampe, welcher Lautsprecher und welches Alarmgerät mitmachen. So kannst du etwa beim zweiten Stups die Lampen weglassen oder zuerst nur das Handy nutzen. Für eine Lampe kannst du **Blinken** oder **Statuslicht (leuchtet, bis du antwortest)** wählen. Sie leuchtet in ihrer eigenen Farbe oder in der Farbe, die du für diesen Stups auswählst. Ein Lautsprecher spielt pro Stups genau eins ab: einen kurzen Ton, einen gespeicherten Ton aus **Eigene Töne**, einen vorgelesenen Satz, **Ansage mit Signalton** (eine Alexa-Ansage) oder den Alarm. Der Assistent fragt, ob du eine Kette erstellen, bearbeiten oder löschen möchtest.

### Eine Farbe pro Aufgabe

Beim Bearbeiten einer Aufgabe kannst du ihr eine eigene Lichtfarbe geben, etwa Rot für Tabletten und Blau für Wäsche. So erkennst du am Statuslicht, was dran ist. Die Farbe der Aufgabe hat Vorrang, danach kommt die Farbe des Stupses und dann die eigene Farbe der Lampe. Du kannst nur bei Lampen mit Farbunterstützung eine Farbe wählen. Blinken kann jede Lampe, weil Boopli das Blinken selbst steuert. Eine Kette kann nach dem letzten Stups aufhören oder den letzten Stups wiederholen. Wähle eine Kette als Stups-Stil einer Aufgabe oder als Standard für neue Aufgaben. Die Kette legt fest, wann die Stupse für die Aufgabe kommen. Wenn du eine Kette löschen willst, ändere zuerst den Stups-Stil der Aufgaben, die sie nutzen. Ändere auch den Standard, falls er diese Kette nutzt.

### Ruhezeiten

Ruhezeiten sind standardmäßig aus. Du kannst für jeden Wochentag einen eigenen Anfang und ein eigenes Ende festlegen. Für einzelne Aufgaben sind Ausnahmen möglich, zum Beispiel für Tabletten.

### Anwesenheit (optional)

Zu Hause nutzt Boopli alle Geräte, die du eingeschaltet hast. Unterwegs nutzt Boopli nur dein Handy und schickt dir nur Stupse für Aufgaben mit **Überall (zum Beispiel Tabletten)**. Ohne Angabe zur Anwesenheit geht Boopli davon aus, dass du zu Hause bist.

### Verschieben

Das verschiebt den nächsten Stups (standardmäßig um 15 Minuten). Der Schritt bleibt offen. Eine Schaltfläche zum Wegklicken gibt es nicht.


### Standardstile und eigene Töne

Die drei eingebauten Stile **Ein Stups**, **Immer deutlicher** und **Wiederholt** sind genauso Ketten wie die, die du selbst erstellst. Du kannst sie ändern. Löschen kannst du sie nicht. Deine eigenen Töne, also Dateien oder Alexa-Töne, denen du einen Namen gibst, stehen in einer gemeinsamen Liste. Jeder Lautsprecher kann daraus einen Ton nutzen.
