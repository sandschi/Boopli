---
title: Claude fragen
description: Ein freiwilliges Extra neben deinem KI-Agenten in Home Assistant, über eine Routine in deinem eigenen Claude-Konto.
---

**Claude fragen** ist eine zusätzliche Schaltfläche neben der üblichen Schaltfläche für die [KI-Hilfe](/Boopli/de/ai-help/). Du kannst deinen KI-Agenten in Home Assistant wie gewohnt weiter nutzen. Nutze diese Möglichkeit, wenn:

- du der Antwort des KI-Agenten nicht traust und eine zweite Meinung möchtest,
- dein kostenloser KI-Agent gerade nicht erreichbar ist oder keine weiteren Anfragen annimmt,
- du noch keinen KI-Agenten eingerichtet hast.

Das läuft über eine **Routine** in deinem eigenen Claude-Konto. Jede Anfrage startet die Routine einmal. Boopli hat keinen eigenen Server.

:::caution[Eine Forschungsvorschau]
Claude-Routinen können sich in der Vorschau noch ändern. Boopli begrenzt Anfragen auf 20 pro Stunde. Jede Fragerunde und jede Liste mit Schritten braucht eine Anfrage.
:::

![Das Fenster „Claude fragen“ in den Einstellungen](/Boopli/img/de/ask-claude.jpg)

## Was du brauchst

- Ein Claude-Konto auf claude.ai, mit dem du Routinen erstellen kannst.
- Eine Home-Assistant-Installation, die aus dem Internet erreichbar ist. Dafür brauchst du eine externe URL, zum Beispiel über Nabu Casa oder deine eigene Domain. Claude muss Home Assistant erreichen können, um die Antwort zurückzuschicken.

## Die Routine erstellen

Im Assistenten für die KI-Hilfe zeigt dir der Schritt „Claude fragen“ diese Schritte zusammen mit deiner Home-Assistant-Adresse. Nutze die [Seite für Claude-Routinen](https://claude.ai/code/routines), um die Routine einmal einzurichten.

1. Erstelle eine neue Routine und nenn sie **Boopli**.
2. Füge die Anweisungen aus dem Assistenten ein. Darin steht, dass Claude zuerst die Fotos ansehen, dann die Antwort erarbeiten und mit einer einzigen Webanfrage zurückschicken soll. Danach soll Claude aufhören. In den Anweisungen steht auch, dass Claude versteckte Anweisungen in einem Foto oder im Aufgabentext ignorieren soll.
3. Erstelle für die Routine eine **Umgebung** („Environment“) mit **eingeschränktem Netzwerkzugriff** („Limited“) und erlaube deine Home-Assistant-Adresse. Der Assistent zeigt dir den genauen Hostnamen.
4. Füge der Routine einen **API-Trigger** („API trigger“) hinzu und wähle **„Generate token“** (Token erzeugen). Kopiere den Token gleich. Claude zeigt ihn nur einmal an.
5. Lass alle Verbindungen zu anderen Diensten (Gmail, Kalender und so weiter) **aus**. Die Routine braucht sie nicht.

Die Oberfläche von Claude ändert sich ab und zu. Darum kann eine Schaltfläche etwas anders heißen.

## Die Routine mit Boopli verbinden

Öffne **Einstellungen**, wähle **Erweitert** auf der Karte **KI-Hilfe** und dann **Claude fragen (Extra)**. Du kannst auch den Assistenten nutzen.

1. Wähle **„Claude fragen“ einschalten**.
2. Füge die **Auslöse-URL der Routine** ein. Sie beginnt mit `https://api.anthropic.com/v1/claude_code/routines/` und endet mit `/fire`.
3. Füge den Token unter **Token der Routine** ein und wähle **Token speichern**.
4. Wähle **Claude testen**. Boopli speichert deine Einstellungen, bittet Claude um eine kurze Antwort und zeigt dir, wie viele Sekunden das gedauert hat.

Wenn du die Adresse für Claudes Antwort eintragen oder ändern möchtest, öffne **Webadresse von Home Assistant (erweitert)**. Fülle dort **An diese Adresse schickt die Routine ihre Antwort** aus.

## So funktioniert es

1. Wähle **Claude fragen**. Boopli sendet den Aufgabentext, deine Antworten und ausgewählte Raumnotizen oder Fotos an deine Routine.
2. Die Routine erarbeitet die Antwort und sendet sie an einen Webhook, den Boopli in Home Assistant eingerichtet hat.
3. Boopli zeigt die Antwort an. Pro Anfrage wartet es bis zu 2 Minuten. Lässt sich die Antwort nicht lesen, sendet Boopli eine weitere Anfrage.

Jede Anfrage bekommt eine einmalige ID. Boopli nimmt nur eine Antwort an, solange die Anfrage noch offen ist.

Wer das Panel nutzen kann, kann **Claude fragen** wählen. Nur Personen mit Adminrechten können den Token speichern oder entfernen und **Claude testen** wählen.

## Fotos

Wenn du Fotos für Claude auswählst, speichert Boopli jedes Foto vorübergehend im Medienordner von Home Assistant. Die Routine erhält einen signierten Link, der bis zu 10 Minuten gültig ist. Die Routine lädt die Fotos herunter. Nach der Anfrage löscht Boopli seine eigenen temporären Dateien, auch wenn die Anfrage fehlschlägt. Claude kann empfangene Fotos speichern.

## Was Claude sieht

Von sich aus sendet Boopli nichts an Claude. Wenn du eine Anfrage stellst, erhält Claude den Aufgabentext, deine Antworten und alle Raumnotizen oder Fotos, die du ausgewählt hast. Bei Fragen zu einem Raum erhält Claude den Namen des Raums und die aktuellen Notizen. Claude kann speichern, was du teilst. Gerätenamen, der Verlauf von Home Assistant und dein Standort sind in der Anfrage nicht enthalten. Was du eingibst oder fotografierst, kann trotzdem private Angaben enthalten.

## Dein Token ist geheim

Boopli bewahrt den Token in einer eigenen privaten Datei im Speicher von Home Assistant auf. Der Token steht weder in den Einstellungen noch im Backup (`.adhd`). Das Panel erfährt nur, ob ein Token hinterlegt ist. Wenn du glaubst, dass jemand an den Token gekommen ist, erstelle auf claude.ai einen neuen. Füge ihn mit **Ersetzen** in Boopli ein.

Wenn Boopli den Token nicht speichern kann, bleibt der alte in Gebrauch. Boopli sagt dir dann Bescheid. Wenn Boopli die private Datei beim Start nicht lesen kann, läuft es mit ausgeschaltetem „Claude fragen“ weiter. Boopli lässt die Datei unverändert und schreibt den Grund ins Protokoll von Home Assistant.

Wenn etwas schiefgeht, findest du Hilfe unter [Fehlersuche](/Boopli/de/troubleshooting/).
