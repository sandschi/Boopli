---
title: Wallboard
description: Een weergave voor een tablet of scherm aan de muur. Ook lees je hoe je zelf een tegel maakt.
---

Het Wallboard is een weergave voor een tablet of scherm aan de muur. Open het met de knop 🖥 **Wallboard** of zet de link (`/boopli?wall`, of `/boopli?wall=desk` voor een Wallboard met de naam “desk”) op de startpagina van je tablet. Een Wallboard is een raster met **tegels**. Kies het potlood ✎ op het Wallboard of **Wallboard bewerken** in Instellingen om het meteen aan te passen, net als bij een Home Assistant-dashboard. Kies een tegel om de grootte, positie en instellingen te wijzigen. Je kunt tegels toevoegen en al vóór het opslaan bekijken hoe ze eruitzien op een wandscherm, tablet of telefoon.

Je kunt tegels kiezen voor de klok, je huisdier in de eigen kamer, wat nu aan de beurt is en wat eraan komt. Er zijn ook tegels voor een Home Assistant-entiteit naar keuze, het weer, komende agenda-afspraken, een camerabeeld en een notitie. Op de tegel **Nu aan de beurt** staan **Klaar**, **Ik ben bezig** en **Uitstellen**. Nadat je **Ik ben bezig** kiest, zie je **Seintjes hervatten**.

Bij een entiteitstegel hangt de actie af van de entiteit. Kies de tegel om een schakelaar om te zetten, een script uit te voeren, een scène te activeren of op een knop te drukken. Het Wallboard bestaat uit vierkante vakjes, standaard 16 bij 9, in de vorm van een scherm. Het raster schaalt mee met je scherm, zodat het er overal hetzelfde uitziet en je nooit hoeft te scrollen. Sleep een tegel om die te verplaatsen. Tegels die in de weg staan, schuiven opzij. Sleep aan de hoek om het formaat te wijzigen. Kies in de Wallboard-instellingen **Fijner raster (vakjes half zo breed en hoog)** voor kleinere stapjes. Je kunt meerdere Wallboards gebruiken, bijvoorbeeld één voor de muur en één voor je bureau. Terwijl de afwezigheidsmodus aanstaat, zie je bovenaan de balk **Afwezigheidsmodus actief**. Als de modus uitstaat, neemt de balk geen ruimte in. Het Wallboard houdt je scherm aan als de browser dat toestaat. Buiten de tijden voor seintjes kun je het scherm laten dimmen, zwart laten worden met een kleine klok of aan laten staan. Raak het scherm aan om het 30 seconden te wekken. Als iets aan de beurt is, blijft het scherm aan. Elke tegel staat in een eigen klein bestand. Zo kun je makkelijk zelf een tegel toevoegen (zie hieronder).

![Een Wallboard met de huidige stap, het huisdier, de klok en wat eraan komt](/Boopli/img/nl/wall.jpg)

## Een eigen tegel maken

Een tegel is een klein element in `frontend/src`. Kopieer `wall-tile-note.ts`, de kleinste tegel. Geef weer wat je nodig hebt uit `this.hass`, `this.snapshot` en `this.options`. Geef het element de naam `wall-tile-<type>` (vervang lage streepjes in het type door koppeltekens). Importeer de tegel en voeg die toe aan de lijst in `wall-tiles.ts`, met de naam, de grootte en de opties die bij de Wallboard-instellingen moeten staan. Zet dezelfde opties in `TILE_OPTIONS` in `engine.py`, zodat de integratie ze kan controleren. Voer `npm run build` uit in `frontend`.
