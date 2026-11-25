---
title: Seintjes
description: Hoe seintjes via lampen, luidsprekers, alarmapparaten en telefoons van een zacht signaal tot een alarm opbouwen.
---

Als een stap aan de beurt is, geeft Boopli je seintjes via de kanalen die je aanzet op het tabblad **Instellingen**:

### Lampen

Kies per lamp **Knipperen** of **Statuslampje (aan tot je klaar bent)**. Bij Knipperen onthoudt Boopli hoe de lamp nu staat en toont die je kleur zo lang als je hebt ingesteld (in milliseconden). Boopli herhaalt dat 1 tot 5 keer, met een pauze die je zelf instelt. Daarna zet Boopli de lamp precies terug zoals die stond. Bij Statuslampje blijft de lamp in een kleur aan tot je klaar bent. Boopli gebruikt de ingebouwde knipperfunctie van de lamp niet. Sommige lampen geven aan dat ze die functie ondersteunen, maar doen er niets mee. Kies **Testen** om te zien wat de lamp doet. Een lokaal verbonden lamp kan reageren binnen een paar honderd milliseconden. Een lamp die via de cloud werkt, heeft ongeveer een seconde of meer nodig.

### Luidsprekers

Voeg een mediaspeler naar keuze toe. Per luidspreker kun je drie niveaus aan- of uitzetten: een kort geluidje, een voorgelezen zin en een alarmgeluid dat zich herhaalt zolang je instelt. Een luidspreker speelt het hoogste niveau af dat is bereikt. Voor het geluid kun je een Alexa-geluid via de ID gebruiken (bijvoorbeeld `amzn_sfx_scifi_alarm_01`) of een bestand in je Home Assistant-mediamap (bijvoorbeeld `boopli/ding.mp3`). Voorlezen werkt via Alexa Media Player, een meldingsentiteit van Alexa Devices of een voorleesstem op de luidspreker. Kies **Ping testen**, **Voorlezen testen** of **Alarm testen** om de geluiden te proberen.

### Alarmapparaten

Boopli kan een sirene, schakelaar of script aanzetten en na de ingestelde tijd weer uitzetten. Het alarm gaat ook uit als je op het seintje reageert of als Home Assistant opnieuw opstart.

### Niveaus

Elk kanaal heeft standaardtijden voor seintjes. Bij een luidspreker bepaalt **Vanaf seintje** bijvoorbeeld vanaf welk seintje het geluid meedoet. Onder **Reeksen seintjes** kies je welke apparaten bij elk seintje meedoen.

### Telefoons

Je krijgt een melding van de Home Assistant-app met de knoppen **Klaar** en **Uitstellen**. Je kiest hoe opvallend de melding is: **Gewone melding**, **Melding met hoge prioriteit**, **Alarmvolume** of **Maximaal alarmvolume (alleen op telefoons die dit ondersteunen)**.

### Soorten seintjes per taak

**Geen seintjes** (alleen zichtbaar in het paneel), **Eén seintje**, **Steeds duidelijker** (30, 15, 10 en daarna elke 5 minuten tot de reeks stopt) of **Blijft terugkomen** (elke 5 minuten tot je klaar bent).

### Reeksen seintjes

Open **Reeksen seintjes** in Instellingen om een eigen reeks te maken. Een reeks bestaat uit maximaal 12 seintjes. Per seintje stel je in hoelang Boopli wacht en welke telefoon (en hoe luid), lamp, luidspreker en welk alarmapparaat meedoen. Zo kun je de lampen bij seintje 2 weglaten of eerst alleen je telefoon laten meedoen. Voor een lamp kies je **Knipperen** of **Statuslampje (blijft aan tot je reageert)**. Je kunt de eigen kleur van de lamp gebruiken of een kleur kiezen voor dat seintje. Een luidspreker speelt één geluid per seintje af. Dat kan een kort geluidje zijn, een opgeslagen geluid uit **Eigen geluiden**, een voorgelezen zin, **Voorlezen met geluidje** (een Alexa-aankondiging) of het alarm. Bij het instellen vraagt Boopli of je een reeks wilt maken, bewerken of wissen.

### Een kleur per taak

Geef een taak bij het bewerken een eigen lampkleur, bijvoorbeeld rood voor pillen en blauw voor de was. Zo herken je aan een statuslampje welke taak aan de beurt is. De kleur van de taak gaat voor. Daarna komt de kleur die je voor het seintje hebt gekozen en dan de eigen kleur van de lamp. Je ziet alleen een kleurkiezer bij lampen die kleuren kunnen tonen. Elke lamp kan knipperen, omdat Boopli de lamp zelf aan en uit zet. Een reeks kan na het laatste seintje stoppen of het laatste seintje herhalen. Kies een reeks als type seintjes voor een taak of als standaard voor nieuwe taken. De reeks bepaalt wanneer je seintjes voor die taak krijgt. Wil je een reeks wissen? Kies eerst een ander type seintjes voor de taken die de reeks gebruiken. Pas ook de standaard aan als die naar de reeks verwijst.

### Stille uren

Stille uren staan standaard uit. Je kunt per dag van de week een begin- en eindtijd kiezen. Voor een taak kun je een uitzondering maken, bijvoorbeeld voor pillen.

### Aanwezigheid (optioneel)

Als je thuis bent, gebruikt Boopli alle kanalen die je hebt aangezet. Ben je weg, dan gebruikt Boopli alleen je telefoon, en alleen voor taken met **Overal (bijvoorbeeld je pillen nemen)**. Als je niet hebt ingesteld hoe Boopli ziet waar je bent, gaat Boopli ervan uit dat je thuis bent.

### Uitstellen

Hiermee stel je het volgende seintje uit (standaard 15 minuten). De stap blijft open. Je kunt een seintje niet wegklikken.


### Standaardreeksen en eigen geluiden

De drie ingebouwde reeksen **Eén seintje**, **Steeds duidelijker** en **Blijft terugkomen** werken net als reeksen die je zelf maakt. Je kunt ze aanpassen. Wissen kan alleen bij je eigen reeksen. Eigen geluiden zijn bestanden of Alexa-geluiden die je een naam geeft. Ze staan in één lijst waar elke luidspreker uit kan kiezen.
