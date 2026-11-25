---
title: Diensten, gebeurtenissen en sensoren
description: Maak je eigen automatiseringen met Boopli.
---

Je kunt Boopli op drie manieren gebruiken in je eigen automatiseringen, scripts en spraakassistenten. Je kunt diensten aanroepen, naar gebeurtenissen luisteren en sensoren van je huisdier gebruiken.

## Diensten

| Dienst | Wat die doet |
|---|---|
| `boopli.break_down` | Deelt een klus met je AI-agent op in kleine stappen en geeft die terug. AI-hulp moet aanstaan. Velden: `task` en optioneel `kind` (`now` of `recurring`), `answers`, `notes` en `rooms`. Zonder `rooms` leidt Boopli uit de klus af om welke kamers het gaat, net als in het paneel. |
| `boopli.add_task` | Maakt een eenmalige klus aan (eventueel met stappen) en start die. De klus verdwijnt zodra die klaar is. |
| `boopli.start_chore` | Start meteen een klus op basis van de naam of ID. |
| `boopli.complete_step` | Vinkt de stap af die bij een klus op je wacht. |
| `boopli.snooze_step` | Stelt het volgende seintje uit voor de stap die bij een klus op je wacht. |
| `boopli.step_on_it` | Laat Boopli weten dat je werkt aan de stap die op je wacht (“Ik ben bezig”). |
| `boopli.step_not_on_it` | Hervat de seintjes na “Ik ben bezig”. |
| `boopli.delete_chore` | Wist een klus en stopt alles wat ervoor loopt. |
| `boopli.set_away` | Zet de [Afwezigheidsmodus](/Boopli/nl/away-mode/) aan. Optioneel kun je `start` en `until` opgeven, bijvoorbeeld `2026-11-28 08:00`. |
| `boopli.end_away` | Zet de afwezigheidsmodus uit. |

Bij diensten met een veld voor een klus (`chore`) kun je de naam of ID invullen. Hebben twee klussen dezelfde naam? Gebruik dan de ID.

## Gebeurtenissen

Boopli stuurt deze gebeurtenissen via de gebeurtenisbus van Home Assistant. Je kunt er een automatisering mee starten.

| Gebeurtenis | Wanneer |
|---|---|
| `boopli_chore_started` | Een klus is gestart. |
| `boopli_questions_answered` | Je hebt de vragen bij een klus beantwoord voordat die begon. |
| `boopli_step_active` | Een stap is aan de beurt. |
| `boopli_step_on_it` | Je hebt bij een stap **Ik ben bezig** gekozen. |
| `boopli_step_done` | Een stap is klaar. `by` geeft `manual` of `auto` aan. `reason` zegt wat er is gebeurd. |
| `boopli_chore_done` | Alle stappen van een klus zijn klaar. |
| `boopli_nudge_sent` | Boopli heeft je een seintje gegeven. |
| `boopli_xp_gained` | Je hebt XP verdiend. |
| `boopli_away_started` | De afwezigheidsmodus is gestart. |
| `boopli_away_ended` | De afwezigheidsmodus is afgelopen. |

## Sensoren

Boopli voegt een apparaat met de naam **Boopli** toe, met drie sensoren voor je huisdier:

- **XP**: de totale XP van je huisdier.
- **Level**: het level van je huisdier.
- **Stemming**: vrolijk, tevreden, slaperig, verdrietig of in diepe slaap.

Je kunt ze op een dashboard tonen of in automatiseringen gebruiken. Laat bijvoorbeeld een lamp groen worden als je huisdier vrolijk is.
