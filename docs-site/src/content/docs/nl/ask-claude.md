---
title: Vraag Claude
description: Een extra optie naast je AI-agent in Home Assistant, via een routine in je eigen Claude-account.
---

**Vraag Claude** is een extra knop naast de gewone knop voor [AI-hulp](/Boopli/nl/ai-help/). Je AI-agent in Home Assistant blijft beschikbaar. Gebruik deze optie als:

- je het antwoord van de agent niet vertrouwt en een tweede mening wilt,
- je gratis agent niet beschikbaar is of tijdelijk geen verzoeken meer aanneemt,
- je geen agent hebt ingesteld.

Het werkt via een **routine** in je eigen Claude-account. Elk verzoek voert die routine één keer uit. Boopli heeft geen eigen server waar je gegevens doorheen gaan.

:::caution[Een functie in de testfase]
Routines van Claude kunnen nog veranderen. Boopli stopt bij 20 verzoeken per uur. Elke vragenronde en elke lijst met stappen telt als één verzoek.
:::

![Het venster Vraag Claude in Instellingen](/Boopli/img/ask-claude.jpg)

## Wat je nodig hebt

- Een Claude-account op claude.ai waarmee je routines kunt maken.
- Een Home Assistant-installatie die bereikbaar is vanaf internet via een externe URL, bijvoorbeeld via Nabu Casa of je eigen domein. Claude moet Home Assistant kunnen bereiken om het antwoord terug te sturen.

## De routine maken

Bij de stap Vraag Claude in de begeleide instelling voor AI-hulp zie je de volgende stappen naast je eigen Home Assistant-adres. Stel de routine één keer in op de [pagina met Claude-routines](https://claude.ai/code/routines).

1. Maak een nieuwe routine en noem die **Boopli**.
2. Plak de instructies uit de begeleide instelling. Die vragen Claude om eerst eventuele foto’s te bekijken, het antwoord uit te werken, het met één webverzoek terug te sturen en dan te stoppen. Claude krijgt ook de instructie om opdrachten te negeren die in een foto of de tekst van de klus verstopt zitten.
3. Maak een **omgeving** voor de routine. Zet de netwerktoegang op **Beperkt** en geef toegang tot je Home Assistant-adres. De begeleide instelling toont de exacte hostnaam.
4. Voeg een **API-trigger** toe aan de routine en kies **Token aanmaken**. Kopieer het token meteen. Claude laat het maar één keer zien.
5. Laat alle koppelingen, zoals die met Gmail of je agenda, **uit**. De routine heeft ze niet nodig.

De schermen van Claude veranderen af en toe. Een knop kan dus net iets anders heten.

## De routine aan Boopli koppelen

Open **Instellingen**. Kies **Geavanceerd** op de kaart **AI-hulp** en kies daarna **Vraag Claude (extra)**. Je kunt dit ook stap voor stap instellen.

1. Kies **“Vraag Claude” aanzetten**.
2. Plak de **Start-URL van de routine**. Die begint met `https://api.anthropic.com/v1/claude_code/routines/` en eindigt op `/fire`.
3. Plak het token onder **Token van de routine** en kies **Token opslaan**.
4. Kies **Claude testen**. Boopli slaat je instellingen op, vraagt Claude om een kort antwoord en laat zien hoeveel seconden dat duurde.

Wil je instellen of aanpassen waar Claude het antwoord naartoe stuurt? Open **Webadres van Home Assistant (geavanceerd)** en vul **Adres waar de routine het antwoord naartoe stuurt** in.

## Hoe het werkt

1. Kies **Vraag Claude**. Boopli stuurt de tekst van je klus, je antwoorden en de kamernotities of foto’s die je wilt delen naar je routine.
2. De routine werkt het antwoord uit en stuurt het terug via een webhook die Boopli in Home Assistant heeft aangemaakt.
3. Boopli toont het antwoord. Per verzoek wacht Boopli maximaal 2 minuten. Als Boopli het antwoord niet kan lezen, stuurt Boopli nog één verzoek.

Elk verzoek krijgt een unieke ID voor eenmalig gebruik. Boopli accepteert één antwoord zolang dat verzoek nog openstaat.

Iedereen die het paneel kan gebruiken, kan **Vraag Claude** kiezen. Alleen een beheerder kan het token opslaan of verwijderen en **Claude testen** kiezen.

## Foto’s

Als je foto’s voor Claude kiest, slaat Boopli elke foto tijdelijk op in de mediamap van Home Assistant. De routine krijgt een ondertekende link die maximaal 10 minuten geldig is. De routine downloadt de foto’s. Boopli wist zijn eigen tijdelijke bestanden na het verzoek, ook als het mislukt. Claude kan de ontvangen foto’s bewaren.

## Wat Claude te zien krijgt

Boopli stuurt uit zichzelf niets naar Claude. Als je een verzoek doet, krijgt Claude de tekst van je klus, je antwoorden en eventuele kamernotities of foto’s die je wilt delen. Bij vragen over een kamer krijgt Claude de naam en de huidige notities van die kamer. Claude kan bewaren wat je deelt. Boopli stuurt geen apparaatnamen, Home Assistant-geschiedenis of locatie mee. De tekst die je invult en de foto’s die je maakt kunnen wel persoonlijke gegevens bevatten.

## Houd je token geheim

Boopli bewaart het token in een afgeschermd bestand in de opslag van Home Assistant. Het token staat niet in de instellingen of in een back-up (`.adhd`). Het paneel krijgt alleen te zien of er een token is ingesteld. Denk je dat het token is uitgelekt? Maak een nieuw token op claude.ai en plak het in Boopli via **Vervangen**.

Kan Boopli het token niet opslaan, dan blijft het oude token in gebruik en krijg je daar een melding van. Kan Boopli het afgeschermde bestand bij het opstarten niet lezen? Dan blijft Boopli draaien met Vraag Claude uitgeschakeld. Boopli laat het bestand met rust en schrijft de reden in het logboek van Home Assistant.

Kijk bij [Problemen oplossen](/Boopli/nl/troubleshooting/) als er iets misgaat.
