---
title: Configurer Boopli
description: L’assistant de configuration, les guides, les Paramètres et les modifications non enregistrées.
---

## Première configuration

À la première ouverture de Boopli, un assistant se lance tout seul. Il affiche la liste des étapes à gauche, une question par écran, une barre de progression et un bouton **Retour**. Chaque choix a une valeur par défaut que tu peux garder. Tu peux passer chaque étape. **Passer pour l’instant** ferme l’assistant. Tes réponses sont enregistrées au fur et à mesure. Tu peux donc fermer l’onglet en cours de route sans rien perdre. L’assistant te demande le nom de ton animal, ton téléphone, tes heures calmes, la durée du report et le style de rappel par défaut, les lampes de rappel et si tu veux des rappels sur les enceintes. Pour les enceintes, il n’y a qu’une question. Sélectionne **Configurer les enceintes** ou **Passer**. L’assistant te demande aussi où tu es (une entité de type personne permet à Boopli de savoir quand tu n’es pas chez toi). Enfin, il te propose quelques tâches pour démarrer : Lave-vaisselle, Lessive, Poubelle, Médicaments. Elles sont sélectionnées par défaut et ajoutées sans planning. Tu ne reçois donc aucun rappel avant de choisir une heure ou de lancer une tâche. Sélectionne **Tester** pour essayer un rappel sur un appareil. Boopli n’envoie rien tout seul à un service d’IA. Si tu utilises [Aide de l’IA](/Boopli/fr/ai-help/) ou [Demander à Claude](/Boopli/fr/ask-claude/), le service d’IA choisi reçoit ta tâche, tes réponses et les notes sur les pièces ou les photos que tu partages. Un fournisseur dans le cloud peut conserver ces données.

Si tu passes l’assistant ou si tu le quittes avant la fin, un bandeau **Terminer la configuration** s’affiche dans Aujourd’hui. Il te ramène là où tu en étais. Si ton installation contenait déjà des tâches ou des paramètres avant l’arrivée de l’assistant, elle est considérée comme configurée.

Le panneau est disponible en anglais (en), en allemand (de), en néerlandais (nl), en français (fr) et en espagnol (es). Il utilise la langue de Home Assistant. Pour choisir une autre langue dans ce navigateur, va dans **Paramètres → Langue**. Sélectionne **Comme dans Home Assistant** pour revenir au réglage par défaut. L’option `?lang=xx` dans l’adresse est prioritaire.

## Des heures calmes pour chaque jour

Chaque jour de la semaine a ses propres horaires, ou **Sans limite**. Les jours ne sont pas regroupés en « jours de semaine » et « week-end », car tout le monde n’a pas le même week-end. Sélectionne **Comme lun.** pour copier les horaires du lundi sur le jour suivant.

![La page Paramètres, avec des cartes pour les appareils, les délais et les options en plus. Chacune propose Pas à pas et Avancé.](/Boopli/img/fr/settings.jpg)

## Guides et paramètres avancés

Chaque carte des Paramètres résume les réglages en place. Sélectionne **Pas à pas** pour suivre un guide ou **Avancé** pour ouvrir les réglages de la carte. Le guide des enceintes t’aide à choisir l’enceinte, le son bref, la phrase lue à voix haute, le son d’alarme et les délais. Les appareils d’alarme ont leur propre guide.

Chaque assistant se termine par **Tout est prêt**. Cet écran indique ce qui a changé, par exemple « Durée du report : 15 → 10 min ».

## Les modifications non enregistrées restent visibles

Dans les Paramètres et l’éditeur de tâches, une barre apparaît en bas de l’écran dès que tu modifies quelque chose. Dans les Paramètres, elle liste les cartes dont les modifications restent à enregistrer. Sélectionne un nom pour faire défiler la page jusqu’à la carte et la mettre en évidence. Les cartes modifiées portent une étiquette orange « Non enregistré ». Un point s’affiche dans les onglets Paramètres et Tâches. Si tu changes d’onglet, ouvres un assistant ou fermes la page avec des modifications non enregistrées, tu peux choisir **Enregistrer**, **Abandonner** ou **Rester**.

## Tous les paramètres sur une seule page

Les cartes sont réparties en trois groupes. **Appareils** contient **Téléphone**, **Lampes de rappel**, **Enceintes** et **Appareils d’alarme**. **Délais** contient **Heures calmes**, **Report et délais**, **Séries de rappels** et **Où tu es**. **Options en plus** contient **Ton animal et la couleur d’accent**, **Wallboard**, **Aide de l’IA**, **Sauvegarde** et **Langue**. La plupart des cartes ont deux boutons : **Pas à pas** pour suivre un guide et **Avancé** pour ouvrir la fenêtre de la carte. Sur la carte **Wallboard**, **Modifier le Wallboard** ouvre le Wallboard en mode modification. Dans la fenêtre Avancé, **Enregistrer et fermer** enregistre tes changements et ferme la fenêtre. **Abandonner et fermer** annule les changements faits dans cette fenêtre. **Garder pour plus tard** ferme la fenêtre et conserve tes changements en brouillon.



## Recommencer la configuration

En bas des Paramètres, **Refaire la configuration initiale** relance l’assistant de première configuration. Chaque assistant se termine par la liste des changements pour que tu voies exactement ce que tu as fait.
