---
title: Taken en planning
description: Soorten taken, planningen en stappen die wachten, vragen stellen of vanzelf klaar zijn.
---

## Taken plannen

Je kunt een taak op drie manieren plannen:

- **Wanneer je wilt.** Je start de taak zelf.
- **Op bepaalde dagen en tijden.** Elke dag van de week kan eigen tijden hebben of leeg blijven. Er is geen aparte groep voor werkdagen en het weekend. Je kunt tot zes tijden per dag kiezen. Denk aan pillen om 08:00 en 20:00, of de vaatwasser van maandag tot vrijdag om 19:30 en op zaterdag om 11:00. Bij het bewerken van een taak heeft elke dag een eigen rij met het selectievakje **Gepland**, de tijden en een knop zoals **Zelfde als ma**.
- **Een aantal dagen nadat ik klaar ben.** De taak komt N dagen nadat je de vorige keer klaar was terug, op een tijd die je zelf kiest.

Is een taak opnieuw aan de beurt terwijl die van de vorige keer nog openstaat? Dan slaat Boopli deze ronde over. Zo lopen er geen twee tegelijk.

**Planning stap voor stap.** Kies bij het bewerken van een taak **Planning stap voor stap instellen**. Je kiest hoe vaak de taak terugkomt, op welke dagen en hoe laat per dag. Je ziet de volgende vijf geplande momenten. De integratie berekent die zelf. Op het laatste scherm zie je wat er is veranderd. Bij taken zonder planning staat in de lijst Taken de knop **Planning instellen**. Daarmee begin je meteen en wordt de taak opgeslagen zodra je klaar bent. Open je de begeleide planning vanuit het bewerkscherm? Dan vult Boopli alleen het formulier in. De balk voor niet-opgeslagen wijzigingen laat je weten dat je nog moet opslaan.

## Stappen die wachten of iets vragen

### Delen van een taak opzijzetten

Stappen staan bij elkaar in delen, zoals “Bureau”, “Bank” en “Vloer”. Bij een taak voor een hele kamer krijgt elk onderdeel uit je kamernotities een eigen deel. Kies op Vandaag **<groep> later doen** (bijvoorbeeld **Bureau later doen**) om de open stappen van een deel als aparte kleine taak opzij te zetten, bijvoorbeeld “Woonkamer schoonmaken: bureau”. Kies **Ik start de taak zelf**, **Morgen om 9:00** of **Kies een tijd**. Je raakt geen stappen kwijt en niets raakt achterstallig. Het deel wacht onder **Voor later** met de knoppen **Nu starten**, **Tijd aanpassen** en **Wissen**. Op de gekozen tijd start het vanzelf, met de gebruikelijke seintjes en XP. Je kunt een heel deel opzijzetten. Voor een losse stap kies je Uitstellen. Het laatste deel van een taak kun je niet opzijzetten.

### Wachten tot er iets gebeurt

Een stap kan wachten tot er iets gebeurt. Bij “Wacht tot dit gebeurt…” kun je dezelfde voorwaarden kiezen als bij “Vanzelf klaar als…”. Denk aan de status of waarde van een entiteit, een NFC-tag, een knop of een gebeurtenisentiteit. Zolang geen van de voorwaarden klopt, blijft de stap stil en krijg je geen seintjes. Daarna ben jij aan de beurt. Het aantal minuten bepaalt hoelang de stap maximaal wacht (0 = zolang als nodig). Zo kan “Was ophangen” wachten op de gebeurtenis “programma klaar” van de wasmachine. Bij elke stap in het bewerkscherm staat ook het optionele veld **Bij welk gebied / welke fase hoort deze stap? (optioneel)**. Zo kun je zelf delen maken.

### Vragen voordat je begint

Een taak die vanzelf is gestart en vragen heeft, toont die op Vandaag onder **Eerst even kijken**.

Een taak kan bij elke start ja-neevragen stellen, bijvoorbeeld “Moet je de tafel opruimen?” Het kan immers elke keer anders zijn. Koppel je een stap aan een vraag via **Alleen als:**, dan verschijnt die stap in de lijst als je **Ja** (groen) antwoordt. Bij **Nee** (rood) verschijnt de stap niet. Stappen zonder vraag staan er altijd, dus de tafel wordt nog steeds afgenomen. Kies je **Nu starten**, dan beantwoord je eerst de vragen. Start een taak vanzelf via een planning, sensor of NFC? Dan begint de taak meteen met alle stappen. Voorwaarden en de knop Klaar werken zoals altijd. Op je telefoon krijg je een melding met **Starten met alle stappen** of **Vragen beantwoorden**. Met de tweede keuze open je Boopli in de app. Het eerste seintje wacht op je antwoorden (standaard 30 minuten, aan te passen in Instellingen). Antwoord je later, dan past Boopli de stappen aan die je nog niet hebt gedaan. De AI kan zulke vragen zelf bedenken als je een terugkerende taak laat opdelen. De taak bewaart ze voor volgende week. Automatiseringen krijgen de antwoorden via de gebeurtenissen `boopli_chore_started` en `boopli_questions_answered`.

## Stappen die vanzelf klaar zijn

Bij elke stap in het bewerkscherm kun je **Vanzelf klaar als…** instellen. Zodra een van de voorwaarden klopt, vinkt Boopli de stap af, stopt de seintjes (lampen, geluiden, alarm, telefoonmelding) en gaat verder. Eén voorwaarde is genoeg. De knop Klaar blijft altijd werken.

- **Een entiteit verandert.** Kies een entiteit en een status (`on`, `open`, `home`…), of een getal waar de waarde boven of onder moet komen. Je kunt ook instellen hoeveel minuten dat zo moet blijven. Bijvoorbeeld: een deursensor meldt een open deur, of het bodemvocht stijgt boven 40.
- **Iemand scant een NFC-tag.** Kies een tag uit de lijst van Home Assistant of kies **Nu scannen** en houd je telefoon tegen de tag.
- **Iemand drukt op een knop.** Kies een entiteit van het type `event`, `input_button` of `button`. Je kunt ook kiezen hoe iemand op de knop drukt, bijvoorbeeld één of twee keer.

Standaard moet er **na het begin van de stap** iets gebeuren. Een deur die al openstaat rondt de stap “Zet de deur open om te drogen” dus niet af. Kies onder de voorwaarde **Laat de voorwaarde meetellen als die bij de start van de stap al klopt**. Zo tellen bijvoorbeeld ramen die al dicht zijn mee. Als je geen tijd hebt ingesteld waarin de voorwaarde moet blijven kloppen, is de stap meteen klaar en krijg je geen seintje.

Een sensor die niet beschikbaar is of waarvan de status onbekend is, telt nooit mee. Stappen die zo zijn afgerond, staan op Vandaag onder “Vanzelf klaar”, met wat er is gebeurd. De gebeurtenis `boopli_step_done` bevat `by` (`manual` of `auto`) en `reason`. Als Home Assistant opnieuw opstart, controleert Boopli voorwaarden die al klopten opnieuw. Een druk op een knop of een scan terwijl Home Assistant uit stond, gaat verloren.

### “Ik ben bezig” terwijl je aan de slag bent

Kies **Ik ben bezig** op Vandaag, op het Wallboard of in de telefoonmelding om seintjes te pauzeren terwijl je bezig bent. De telefoonmelding wordt groen en stil. Na de ingestelde wachttijd (standaard 30 minuten) kan Boopli op je telefoon vragen of je nog bezig bent, met de knoppen **Klaar** en **Nog bezig**. Wil je weer seintjes krijgen? Kies **Seintjes hervatten** op Vandaag, op het Wallboard of in de telefoonmelding. Voor je eigen automatiseringen zijn er de acties `boopli.step_on_it` en `boopli.step_not_on_it` en de gebeurtenis `boopli_step_on_it`.

### Een afbeelding bij het seintje

Een telefoonmelding kan een afbeelding bij de stap tonen, bijvoorbeeld van het pillendoosje of het scherm van de wasmachine. Open bij het bewerken van de stap **Afbeelding bij de melding…**. Kies **Camera** om op je telefoon een nieuwe opname van die camera te zien. Kies **Afbeeldingsbestand** voor een bestand in de mediamap van Home Assistant, bijvoorbeeld `boopli/pills.jpg`. De afbeelding blijft zichtbaar als je **Ik ben bezig** kiest en als Boopli vraagt of je nog bezig bent. Je telefoon moet Home Assistant kunnen bereiken. De afbeelding is optioneel. Een stap zonder afbeelding stuurt dezelfde melding als voorheen. Voor de mediamap moet je inloggen. De map `www` is openbaar.
