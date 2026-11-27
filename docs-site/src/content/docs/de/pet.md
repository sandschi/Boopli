---
title: Dein Haustier
description: Wähle dein Haustier und lerne sein Zimmer und seine Stimmungen kennen.
---

Wähle in den Einstellungen ein Haustier aus. Bei der ersten Einrichtung wirst du auch danach gefragt. Zur Wahl stehen Schleim, Bär, Katze, Hund und Fuchs. Dein Haustier wohnt in einem kleinen Zimmer oben unter „Heute“. Es ist fröhlich, zufrieden, müde, traurig oder im Tiefschlaf. Das siehst du am Gesicht und an den Bewegungen. Im Zimmer siehst du, was du im Shop gekauft hast, etwa einen Wassernapf, einen Futternapf und ein Bett. Auch Farben und Muster für Wand und Boden siehst du dort. Im Abwesenheitsmodus steht ein kleiner Koffer daneben. Wenn dein Haustier müde oder im Tiefschlaf ist, schläft es zugedeckt im Bett. Während du mit **Bin dran** an einem Schritt arbeitest, hilft dein Haustier im Haushalt. Es wischt den Boden, wäscht eine Socke und bringt den Müll raus. Während die KI deine Schritte schreibt, tippt es am Laptop. Dein Haustier reagiert auch, wenn du einen Schritt abschließt, ein neues Level erreichst, es weckst oder mit ihm interagierst. Mit **▶ Haustier-Vorschau** in den Einstellungen öffnest du ein Fenster. Dort kannst du jede Stimmung, Tätigkeit und Reaktion ausprobieren und das Zimmer ansehen. Alle fünf Haustiere sind im Code gezeichnet und animiert. Du brauchst dafür nichts herunterzuladen. Die Animationen pausieren, wenn die Seite gerade nicht sichtbar ist. Sie richten sich nach der Einstellung „Bewegung reduzieren“ deines Systems.

## Stimmungen

Die Stimmung hängt davon ab, wie lange dein letzter erledigter Schritt her ist:

| Stimmung | Wann |
|---|---|
| Fröhlich | Du hast heute einen Schritt erledigt. |
| Zufrieden | Der letzte Schritt war gestern oder du hast noch keine Aufgaben. |
| Müde | Seit 2 Tagen ist kein Schritt erledigt. |
| Traurig | Seit 3 bis 6 Tagen. |
| Im Tiefschlaf | Seit 7 Tagen oder länger. |

Solange der [Abwesenheitsmodus](/Boopli/de/away-mode/) aktiv ist, bleibt die Stimmung gleich. In Home Assistant findest du dafür die [Sensoren **Mood** (Stimmung), **Level** und **XP**](/Boopli/de/automations/).

## Blubs, Füttern und Level

Für erledigte Schritte bekommst du **Blubs**. Das ist die Währung für dein Haustier. Ein kleiner Schritt bringt 10 Blubs, ein mittlerer 15 und ein großer 20. Für den letzten Schritt einer Aufgabe gibt es 20 Blubs extra. Erledigst du einen Schritt innerhalb von 10 Minuten, nachdem er an der Reihe ist, gibt es 5 Blubs extra. Pro Aufgabe bekommst du höchstens für 3 Durchgänge am Tag Blubs. Danach bringen weitere Durchgänge keine Blubs mehr. Die Blubs gehören dem ganzen Haushalt. Sie bleiben da, bis du sie ausgibst.

XP und neue Level gibt es nur durchs **Füttern**. Kauf Futter im Shop und füttere dein Haustier aus dem Inventar:

| Futter | Kostet | Bringt |
|---|---|---|
| Kleiner Snack | 10 Blubs | 5 XP |
| Mittlere Mahlzeit | 25 Blubs | 15 XP |
| Großes Festessen | 50 Blubs | 30 XP |

Dein Haustier frisst bis zu 3 Mahlzeiten am Tag. Danach ist es satt. Es nimmt kein weiteres Futter an und es gibt keine weiteren XP. Das Futter bleibt bis morgen im Inventar. Unter „Heute“ siehst du, wie viele Mahlzeiten dein Haustier gefressen hat. Dir wird nichts weggenommen und dein Haustier drängt dich nie zum Füttern. Schon ein paar Schritte reichen für eine Mahlzeit. So erreichst du das erste Level schnell. Nach Level 10 dauert der Aufstieg länger. Ab Level 20 brauchst du für jedes weitere Level gleich viele XP. Es gibt kein Höchstlevel. Bei Level 10 zeigt dir eine kurze Nachricht, dass du die erste Quest geschafft hast.

Wenn Blubs für deinen Haushalt neu sind oder du schon vorher ein Haustier hattest, startet dein Haushalt einmalig mit 30 Blubs.

## Der Shop

Wähle das Feld **Blubs** oben links im Zimmer deines Haustiers, um den Shop zu öffnen. Dort gibt es Futter, Dinge fürs Zimmer, Farben und Muster für Wand und Boden und Extras. Futter kannst du immer wieder kaufen. Gekaufte Dinge verschwinden aus dem Shop und warten im Inventar. Bei Dingen, die du noch nicht kaufen kannst, steht der Grund dabei. Manche gibt es zum Beispiel erst ab Level 3 oder mit einem bestimmten Erfolg. Das Feld wird grün, wenn etwas Neues verfügbar ist und du genug Blubs dafür hast. Das ist der einzige Hinweis. Es blinkt nichts. Wähle im Shop einen Artikel aus, um zu sehen, was er bewirkt, und drück dann unten auf **Kaufen**. Mit der Schaltfläche oben kommst du zum Inventar.

- **Wassernapf** (Level 1), **Futternapf** (Level 2) und **Bett** (Level 3) erscheinen direkt nach dem Kauf im Zimmer.
- **Eine Farbe und ein Muster** kannst du für die Wand oder den Boden auswählen.
- **Eine vierte Mahlzeit am Tag** (ab Level 5) und **eine fünfte Mahlzeit am Tag** (ab Level 10) erhöhen die Zahl der Mahlzeiten, bis dein Haustier satt ist. Das gilt dauerhaft und ohne Zeitlimit.

## Das Inventar

Öffne das Inventar über die Schaltfläche neben dem Blubs-Feld. Dort fütterst du dein Haustier mit deinem Futter und wählst aus, wie Wand und Boden aussehen. Du kannst eine Farbe oder ein Muster auswählen oder alles schlicht lassen. Das kannst du jederzeit ändern. Dabei bekommst du keine Blubs zurück. Wähle Futter, eine Farbe oder ein Muster aus und drück dann unten auf **Füttern** oder **Anwenden**. Im Inventar siehst du auch, welche Dinge im Zimmer stehen. Mit der Schaltfläche oben kommst du zum Shop.

## Akzentfarbe

Die Karte **Dein Haustier und die Akzentfarbe** in den Einstellungen legt auch die Farbe für Booplis Schaltflächen, Balken und Hervorhebungen fest. Standardmäßig ist es die Farbe deines Haustiers. Wenn du lieber eine andere Farbe möchtest, wähle ein Farbfeld aus oder gib deine eigene Farbe ein. Die Karte zeigt die eingestellte Farbe. Mit **Speichern und schließen** übernimmst du sie überall.
