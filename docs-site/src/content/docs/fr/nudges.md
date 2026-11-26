---
title: Rappels
description: Des rappels qui passent d’un signal discret à une alarme, sur tes lampes, tes enceintes, tes appareils d’alarme et tes téléphones.
---

Quand une étape t’attend, Boopli t’envoie un rappel sur les appareils que tu as activés dans l’onglet **Paramètres**.

### Lampes

Pour chaque lampe, choisis **Clignoter** ou **Voyant (allumé jusqu’à ce que tu aies terminé)**. En mode clignotant, Boopli mémorise l’état de la lampe. Il affiche ta couleur pendant la durée choisie (en millisecondes), répète le clignotement 1 à 5 fois avec la pause de ton choix, puis remet la lampe exactement comme elle était. Si la lampe était éteinte, Boopli l’éteint après le clignotement. Si Boopli connaît sa dernière couleur, il la remet d’abord. En mode voyant, la lampe reste allumée dans une couleur jusqu’à ce que tu aies terminé. Boopli n’utilise pas le clignotement intégré à la lampe. Certaines lampes déclarent le prendre en charge et l’ignorent. Sélectionne **Tester** pour voir comment ta lampe réagit. Une lampe reliée à ton réseau local peut réagir en quelques centaines de millisecondes. Une lampe reliée au cloud a besoin d’environ une seconde ou plus.

### Enceintes

Ajoute n’importe quel lecteur multimédia. Chaque enceinte a trois niveaux que tu peux activer ou désactiver : un son bref, une phrase lue à voix haute et un son d’alarme qui se répète pendant la durée choisie. L’enceinte joue le niveau le plus élevé atteint. Choisis un son Alexa dans la liste **Son** ou utilise un fichier du dossier multimédia de Home Assistant (par exemple `boopli/ding.mp3`). Les annonces vocales passent par Alexa Media Player, une entité de notification d’Alexa Devices ou une voix de synthèse sur l’enceinte. Utilise **Tester le son bref**, **Tester la lecture** ou **Tester l’alarme** pour essayer les sons.

### Appareils d’alarme

Boopli active une sirène, un interrupteur ou un script pendant la durée choisie, puis le désactive. Il le désactive aussi quand tu réponds au rappel et quand Home Assistant redémarre.

### Niveaux

Chaque type d’appareil a ses propres délais de rappel par défaut. Par exemple, **À partir du rappel**, dans les réglages d’une enceinte, indique à quel rappel son son s’ajoute. Utilise **Séries de rappels** pour sélectionner les appareils qui réagissent à chaque rappel.

### Téléphones

L’application Home Assistant envoie une notification avec les boutons **Terminé** et **Reporter**. Tu choisis le niveau : **Notification normale**, **Notification à priorité élevée**, **Volume de l’alarme** ou **Volume maximal de l’alarme (téléphones compatibles uniquement)**.

### Un style par tâche

**Sans rappel** (affichage dans le panneau uniquement), **Un rappel**, **Rappels progressifs** (30, 15, 10, puis toutes les 5 minutes, jusqu’à la fin de la série) ou **Rappels répétés** (toutes les 5 minutes jusqu’à ce que tu aies terminé).

### Séries de rappels

Ouvre **Séries de rappels** dans les Paramètres pour créer les tiennes. Une série peut contenir jusqu’à 12 rappels. Pour chaque rappel, tu choisis combien de temps Boopli attend et quels appareils réagissent : téléphone (et son volume), lampe, enceinte et appareil d’alarme. Tu peux par exemple laisser les lampes de côté au rappel 2 ou commencer avec ton téléphone seul. Une lampe propose **Clignoter** ou **Voyant d’état (reste allumé jusqu’à ce que tu réagisses)**, dans sa propre couleur ou dans celle que tu choisis pour ce rappel. Une enceinte joue un seul son par rappel. Par exemple, un son bref, un son enregistré dans **Tes propres sons**, une phrase lue à voix haute, une **Annonce avec son bref** (une annonce Alexa) ou l’alarme. Le guide te demande si tu veux créer, modifier ou supprimer une série de rappels.

### Une couleur par tâche

Dans l’éditeur de tâches, tu peux donner une couleur de lampe à chaque tâche (rouge pour les médicaments, bleu pour la lessive). Tu reconnais ainsi la tâche au voyant. Boopli utilise d’abord la couleur de la tâche, sinon celle choisie pour ce rappel, sinon celle de la lampe. Le choix de couleur s’affiche seulement pour les lampes qui peuvent changer de couleur. Toutes les lampes peuvent clignoter, car Boopli les fait clignoter lui-même. Une série peut s’arrêter après le dernier rappel ou le répéter. Choisis une série comme style de rappel d’une tâche ou comme style par défaut des nouvelles tâches. Elle fixe les délais de rappel pour cette tâche. Avant de supprimer une série, change le style des tâches qui l’utilisent. Change aussi le style par défaut s’il utilise cette série.

### Heures calmes

Elles sont désactivées par défaut. Tu peux choisir des heures de début et de fin différentes pour chaque jour de la semaine. Tu peux faire une exception pour une tâche, comme les médicaments.

### Présence (facultatif)

Chez toi, Boopli utilise tous les appareils que tu as activés. Quand tu es ailleurs, Boopli utilise seulement ton téléphone, et uniquement pour les tâches marquées **Partout (par exemple prendre mes médicaments)**. Si tu ne choisis pas de source de présence, Boopli suppose que tu es chez toi.

### Reporter

Cette action décale le prochain rappel (de 15 minutes par défaut). L’étape reste à faire. Il n’y a pas de bouton pour ignorer le rappel.


### Styles intégrés et sons personnalisés

Les trois styles intégrés, **Un rappel**, **Rappels progressifs** et **Rappels répétés**, sont des séries de rappels comme celles que tu crées. Tu peux les modifier. Elles restent disponibles et ne peuvent pas être supprimées. Tes propres sons (des fichiers ou des sons Alexa auxquels tu donnes un nom) sont dans une liste commune à toutes les enceintes.
