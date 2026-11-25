---
title: Problemen oplossen
description: Wat je kunt controleren als iets niet werkt.
---

## Ik krijg geen seintjes

- Controleer **Stille uren** in Instellingen. Elke dag van de week heeft eigen tijden.
- Controleer de **Afwezigheidsmodus**. Zolang die aanstaat, krijg je alleen seintjes voor taken die mogen doorgaan.
- Kies in Instellingen **Testen** naast de lamp, de luidspreker, het alarmapparaat of je telefoon. Werkt de test? Dan werkt het kanaal en zit het probleem in het type seintjes of de reeks.
- Een taak met **Geen seintjes** verschijnt alleen in Boopli.
- Heb je je telefoon ingesteld? Controleer of de Home Assistant-app op je telefoon meldingen mag sturen.

## Een lamp doet iets vreemds

Boopli gebruikt de ingebouwde knipperfunctie van de lamp niet. Sommige lampen geven aan dat ze die functie ondersteunen, maar doen er niets mee. Boopli laat de lamp zelf knipperen en zet die daarna precies terug zoals die stond. Lampen die via de cloud werken, hebben ongeveer een seconde of meer nodig tussen wijzigingen. Kies voor die lampen een langere knipperduur.

## De AI-agent geeft geen of een vreemd antwoord

- Open **Geavanceerd** op de kaart **AI-hulp** en kies **AI-agent testen**. Lukt het niet, dan toont Boopli de reden van de agent. Het tegoed kan bijvoorbeeld op zijn, het model bestaat mogelijk niet meer of de wachttijd is verstreken.
- Boopli wacht maximaal 3 minuten op de agent. Met **Stop met wachten** blijft alles bewaard wat je hebt ingevuld.
- Voor foto’s heb je een agent nodig die afbeeldingen kan lezen. Open **Geavanceerd** op de kaart **AI-hulp**. Onder **Geavanceerd: AI-agent voor foto’s en prompts** kun je een andere **AI-agent voor foto’s** kiezen.
- Gratis modellen antwoorden soms in een vreemd formaat. Boopli herstelt de stappen waar dat kan. Met **Opnieuw proberen** vraag je het nog een keer.

## Vraag Claude werkt niet

| Boopli zegt | Wat je kunt doen |
|---|---|
| Claude heeft het token geweigerd. Maak een nieuw token voor de routine, plak het in Boopli en probeer het opnieuw. | Maak een nieuw token op claude.ai. |
| Claude kon de routine niet vinden. Controleer de start-URL van de routine. | Controleer of de URL eindigt op `/fire`. |
| Claude beperkt tijdelijk het aantal verzoeken. Probeer het over een tijdje opnieuw. | Wacht even voordat je een nieuw verzoek stuurt. |
| Claude heeft het verzoek geweigerd. Kijk of de routine aanstaat. | Open de routine op claude.ai om dit te controleren. |
| Bij Claude gaat er iets mis. Probeer het over een paar minuten opnieuw. | Wacht even voordat je een nieuw verzoek stuurt. |
| Boopli kon Claude niet bereiken. Controleer je internetverbinding. | Controleer de internetverbinding van Home Assistant. |
| Boopli wacht niet langer op antwoord van Claude. Maximale wachttijd: 2 minuten. Probeer het opnieuw. | Controleer of de routine Home Assistant kan bereiken. Zie hieronder. |
| Er is nog geen adres ingesteld waarop Claude Home Assistant kan bereiken. Vul het adres in bij “Vraag Claude” of stel de externe URL in Home Assistant in. | Stel de externe URL in Home Assistant in of gebruik **Webadres van Home Assistant (geavanceerd)** onder Vraag Claude. |
| Boopli heeft de limiet van 20 verzoeken aan Claude per uur bereikt. Je kunt het over ongeveer 5 minuten opnieuw proberen. | Wacht het aantal minuten dat Boopli aangeeft. |

**De routine draait, maar er komt geen antwoord.** De omgeving van de routine moet je Home Assistant-adres toelaten. Zet de netwerktoegang op **Beperkt** en geef toegang tot die host. Het adres moet vanaf internet bereikbaar zijn, ook buiten je thuisnetwerk. Open de uitvoering op claude.ai om te zien wat de routine heeft gedaan.

**De test lukt, maar foto’s werken niet.** De routine haalt foto’s op via een link op je Home Assistant-adres. Dat adres moet dus ook in de omgeving toegestaan zijn.

## Mijn instellingen zijn niet opgeslagen

Wijzigingen in Instellingen blijven concepten totdat je **Opslaan** kiest. In de balk onderaan zie je bij welke kaarten je wijzigingen hebt. Verlaat je de pagina met niet-opgeslagen wijzigingen? Dan krijg je de keuzes **Opslaan**, **Niet opslaan** en **Blijven**.

## Iets anders

Ga in Home Assistant naar **Instellingen, Systeem, Logboeken** en zoek naar `boopli`. Heb je een fout gevonden? Open dan een melding op [github.com/sandschi/Boopli/issues](https://github.com/sandschi/Boopli/issues). Vermeld welke versies van Boopli en Home Assistant je gebruikt en wat er in het logboek staat.
