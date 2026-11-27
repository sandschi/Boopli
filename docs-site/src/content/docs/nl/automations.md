---
title: Acties, gebeurtenissen en sensoren
description: Maak je eigen automatiseringen met Boopli.
---

Je kunt Boopli op drie manieren gebruiken in je eigen automatiseringen, scripts en spraakassistenten. Je kunt acties aanroepen, naar gebeurtenissen luisteren en sensoren van je huisdier gebruiken.

## Acties

| Actie | Wat die doet |
|---|---|
| `boopli.break_down` | Deelt een taak met je AI-agent op in kleine stappen en geeft die terug. AI-hulp moet aanstaan. Velden: `task` en optioneel `kind` (`now` of `recurring`), `answers`, `notes` en `rooms`. Zonder `rooms` leidt Boopli uit de taak af om welke kamers het gaat, net als in het paneel. |
| `boopli.add_task` | Maakt een eenmalige taak aan (eventueel met stappen) en start die. De taak verdwijnt zodra die klaar is. |
| `boopli.start_chore` | Start meteen een taak op basis van de naam of ID. |
| `boopli.complete_step` | Vinkt de stap af die bij een taak op je wacht. |
| `boopli.snooze_step` | Stelt het volgende seintje uit voor de stap die bij een taak op je wacht. |
| `boopli.step_on_it` | Laat Boopli weten dat je werkt aan de stap die op je wacht (“Ik ben bezig”). |
| `boopli.step_not_on_it` | Hervat de seintjes na “Ik ben bezig”. |
| `boopli.delete_chore` | Wist een taak en stopt alles wat ervoor loopt. |
| `boopli.set_away` | Zet de [Afwezigheidsmodus](/Boopli/nl/away-mode/) aan. Optioneel kun je `start` en `until` opgeven, bijvoorbeeld `2026-11-28 08:00`. |
| `boopli.end_away` | Zet de afwezigheidsmodus uit. |

Bij acties met een veld voor een taak (`chore`) kun je de naam of ID invullen. Hebben twee taken dezelfde naam? Gebruik dan de ID.

## Gebeurtenissen

Boopli stuurt deze gebeurtenissen via de gebeurtenisbus van Home Assistant. Je kunt er een automatisering mee starten.

| Gebeurtenis | Wanneer |
|---|---|
| `boopli_chore_started` | Een taak is gestart. |
| `boopli_questions_answered` | Je hebt de vragen bij een taak beantwoord voordat die begon. |
| `boopli_step_active` | Een stap is aan de beurt. |
| `boopli_step_on_it` | Je hebt bij een stap **Ik ben bezig** gekozen. |
| `boopli_step_done` | Een stap is klaar. `by` geeft `manual` of `auto` aan. `reason` zegt wat er is gebeurd. |
| `boopli_chore_done` | Alle stappen van een taak zijn klaar. |
| `boopli_nudge_sent` | Boopli heeft je een seintje gegeven. |
| `boopli_blubs_earned` | Je hebt een stap afgerond en daarmee Blubs verdiend. |
| `boopli_xp_gained` | Je huisdier heeft eten gekregen en je hebt XP verdiend. |
| `boopli_away_started` | De afwezigheidsmodus is gestart. |
| `boopli_away_ended` | De afwezigheidsmodus is afgelopen. |

## Sensoren

Boopli voegt een apparaat met de naam **Boopli** toe, met drie sensoren voor je huisdier:

- **XP**: de totale XP van je huisdier.
- **Level**: het level van je huisdier.
- **Mood** (stemming): `happy`, `content`, `sleepy`, `sad` of `hibernating` (vrolijk, tevreden, slaperig, verdrietig of in diepe slaap).

Je kunt ze op een dashboard tonen of in automatiseringen gebruiken. Laat bijvoorbeeld een lamp groen worden als de waarde van **Mood** `happy` is.
