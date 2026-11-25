---
title: AI-hulp
description: Deel een klus op in kleine stapjes met je eigen AI-agent in Home Assistant.
---

Wil je een tweede mening of heb je geen AI-agent? Kijk dan ook bij [Vraag Claude](/Boopli/nl/ask-claude/).

Boopli kan een grote klus zoals “mijn kamer opruimen” opdelen in kleine stapjes met **je eigen AI-agent in Home Assistant**. Dat gaat via de integratie AI Task van Home Assistant. AI-hulp staat standaard uit. Open in Instellingen de kaart **AI-hulp**. Kies **Geavanceerd** en dan **AI-hulp aanzetten**. Kies je AI-agent en sla op. Open het venster **Geavanceerd** van de kaart opnieuw en kies **AI-agent testen**. Je kunt ook **Stap voor stap** volgen.

![Het venster AI-hulp in Instellingen](/Boopli/img/nl/ai-help.jpg)

### Op twee plekken beginnen

Schrijf op Vandaag wat je wilt doen. Kies **Nu opdelen** voor een eenmalige klus die verdwijnt zodra die klaar is, of **Een terugkerende taak opdelen** om aan het eind stap voor stap een planning in te stellen. Op het tabblad Taken staat **Nieuwe taak met AI**. Als je een klus bewerkt, vult **Vraag AI om stapjes** de stappen van die klus in.

### De AI stelt eerst vragen

Bij een duidelijke klus zoals “het vuilnis buitenzetten” krijg je meteen stappen. Bij een klus met meerdere delen vraagt de AI wat die moet weten. Wat staat er in de kamer? Hoe ziet het eruit? Hoeveel energie heb je? Bij elke vraag staan knoppen en een veld om in je eigen woorden te antwoorden. Bij lijsten kun je meer dan één antwoord kiezen. Er is altijd een veld **Moet ik nog iets weten?** en een knop **Nu stappen voorstellen**. Bij een terugkerende klus stelt de AI-agent meer vragen. Je stelt die klus één keer in en gebruikt die daarna opnieuw.

### Kleine stapjes in een logische volgorde

Elke stap is één concrete handeling. De eerste is zo makkelijk mogelijk. De stappen staan bij elkaar per plek, bijvoorbeeld tafel, stoelen of vloer. De AI kan aangeven dat je ergens op moet wachten. Een klus kan maximaal 50 stappen hebben. Boopli maakt de klus pas aan als je de stappen hebt bekeken, aangepast en gekozen hebt om ze te gebruiken.

### Grootte van stappen en XP

Elke stap is klein, middelgroot of groot (S, M, B) en levert 10, 15 of 20 XP op. Stappen die je zelf schrijft zijn klein. Op Vandaag zie je de groep en bijvoorbeeld “Stap 3 van 8”, met een voortgangsbalk. Als een klus klaar is, zie je een feestelijke animatie.

### Bewaren voor de volgende keer

Boopli bewaart wat de AI over een terugkerende klus heeft geleerd bij die klus. Je kunt die informatie aanpassen. De AI gebruikt die opnieuw als je weer **Vraag AI om stapjes** kiest.

### Je ziet hoelang je al wacht op de AI

Terwijl de agent bezig is, toont Boopli een animatie, de verstreken tijd, de maximale wachttijd (3 minuten) en een balk die met de wachttijd meeloopt. Een korte zin laat je weten dat het wat langer duurt en het antwoord nog kan komen. Met **Stop met wachten** ga je terug en blijft alles wat je hebt ingevuld bewaard. Boopli laat een antwoord dat daarna komt buiten beschouwing.

### Praten in je eigen AI-chat

Kies bij een kamer **In mijn eigen chat**, of kies **Mijn hele huis bespreken in mijn eigen chat**. Je krijgt een kant-en-klare instructie om naar een chat naar keuze te kopiëren. Bijvoorbeeld een chat waar je tegen kunt praten. Zeg dat je klaar bent en de chat geeft je eenvoudige notities terug. Plak die in Boopli. Boopli haalt opsommingstekens, Markdown-opmaak en markeringen voor codeblokken weg. Notities over het hele huis worden per kamer gesplitst aan de hand van de koppen `## Room`. Je ziet alles nog een keer voordat je opslaat. Je bepaalt zelf wat je in je eigen chat plakt. Dit werkt ook als AI-hulp uitstaat.

### Dienst

`boopli.break_down` (`task`, optioneel `kind`, `answers`, `notes`, `rooms`) geeft de stappen terug voor je eigen automatiseringen en spraakassistenten. Zonder `rooms` leidt Boopli uit de klus af om welke kamers het gaat, net als in het paneel. Zie ook [Diensten, gebeurtenissen en sensoren](/Boopli/nl/automations/).

### Je kunt de prompts zelf aanpassen

Open op de kaart AI-hulp het venster **Geavanceerd** en kies **Geavanceerd: AI-agent voor foto’s en prompts**. Je kunt de twee prompts lezen, aanpassen en herstellen die Boopli verstuurt voor vragen en stappen. Dat kan ook voor de twee teksten voor je eigen AI-chat, voor één kamer of voor je hele huis. De ingebouwde prompts voor AI-hulp vragen om één JSON-object. Ze blijven in het Engels. Boopli vraagt de AI-agent om te antwoorden in de taal van Home Assistant.

## Privacy

Boopli stuurt uit zichzelf niets naar een AI-dienst. Gebruik je AI-hulp, dan stuurt Boopli je klus en je antwoorden naar de AI-agent die je hebt gekozen. Notities bij een terugkerende klus kunnen later opnieuw worden gebruikt. Je kunt ook zelf kamernotities of foto’s kiezen om te delen. Draait de AI-agent in de cloud, dan krijgt de aanbieder wat je deelt en kan die het bewaren. Boopli wist zijn eigen tijdelijke fotobestanden na het verzoek. Boopli stuurt geen apparaatnamen, Home Assistant-geschiedenis of locatie mee. De tekst die je invult en de foto’s die je maakt kunnen wel persoonlijke gegevens bevatten. Werkt de AI-agent niet, dan laat Boopli de reden zien die de agent terugstuurt.
