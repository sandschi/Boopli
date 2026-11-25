---
title: Dépannage
description: Quoi vérifier quand quelque chose ne marche pas.
---

## Je ne reçois aucun rappel

- Vérifie les **Heures calmes** dans les Paramètres. Chaque jour de la semaine a ses propres horaires.
- Vérifie le **Mode absence**. Quand il est actif, seules les tâches qui continuent pendant ton absence peuvent t’envoyer des rappels.
- Dans les Paramètres, sélectionne **Tester** à côté de la lampe, de l’enceinte, de l’appareil d’alarme ou du téléphone. Si le test fonctionne, l’appareil répond. Le problème vient du style ou de la série de rappels.
- Une tâche qui utilise le style **Sans rappel** s’affiche uniquement dans Boopli.
- Si tu as configuré ton téléphone, vérifie que l’application Home Assistant est autorisée à t’envoyer des notifications.

## Une lampe réagit bizarrement

Boopli n’utilise pas le clignotement intégré à la lampe. Certaines lampes déclarent le prendre en charge et l’ignorent. Boopli fait donc clignoter la lampe lui-même, puis la remet exactement comme elle était. Les lampes reliées au cloud ont besoin d’environ une seconde ou plus entre deux changements. Choisis une durée de clignotement plus longue pour ces lampes.

## L’agent IA ne répond pas ou donne une réponse étrange

- Ouvre **Avancé** sur la carte **Aide de l’IA** et sélectionne **Tester l’agent IA**. En cas d’échec, Boopli affiche la raison donnée par l’agent. Par exemple, le compte n’a plus de crédit, le modèle n’est plus disponible ou le délai est dépassé.
- Boopli attend au maximum 3 minutes. **Arrêter d’attendre** garde tout ce que tu as saisi.
- Pour les photos, il te faut un agent qui peut lire des images. Sur la carte **Aide de l’IA**, ouvre **Avancé**, puis **Avancé : agent IA pour les photos et consignes** pour sélectionner un autre **Agent IA pour les photos**.
- Les modèles gratuits répondent parfois dans un format inhabituel. Boopli récupère les étapes mal formées quand il le peut. **Réessayer** envoie une nouvelle demande.

## Demander à Claude ne marche pas

| Ce que dit Boopli | Quoi faire |
|---|---|
| Claude a refusé le jeton. Crée un nouveau jeton pour la routine, colle-le dans Boopli et réessaie. | Crée le nouveau jeton sur claude.ai. |
| Claude n’a pas trouvé la routine. Vérifie l’URL de lancement de la routine. | Vérifie que l’URL se termine par `/fire`. |
| Claude limite les demandes pour le moment. Réessaie dans un instant. | Attends avant d’envoyer une autre demande. |
| Claude a refusé la demande. Vérifie que la routine est activée. | Ouvre la routine sur claude.ai pour vérifier. |
| Claude a un souci en ce moment. Réessaie dans quelques minutes. | Attends avant d’envoyer une autre demande. |
| Boopli n’a pas pu joindre Claude. Vérifie la connexion Internet. | Vérifie la connexion Internet de Home Assistant. |
| Boopli a arrêté d’attendre la réponse de Claude. Temps d’attente maximal (en minutes) : 2. Réessaie. | Vérifie que la routine peut joindre Home Assistant. Voir ci-dessous. |
| Claude n’a pas d’adresse web pour accéder à Home Assistant. Renseigne l’adresse de Home Assistant dans « Demander à Claude » ou définis l’URL externe dans Home Assistant. | Définis l’URL externe dans Home Assistant ou utilise **Avancé : adresse web de Home Assistant** dans Demander à Claude. |
| Boopli a atteint sa limite de 20 demandes à Claude par heure. Tu peux réessayer dans environ 5 minutes. | Attends le nombre de minutes indiqué. |

**La routine tourne, mais aucune réponse n’arrive.** L’environnement de la routine doit autoriser ton adresse Home Assistant. Règle l’accès réseau sur **Limité** (« Limited ») et autorise cet hôte. L’adresse doit être accessible depuis Internet, même hors de chez toi. Ouvre l’exécution de la routine sur claude.ai pour voir ce qu’elle a fait.

**Le test marche, mais pas les photos.** La routine récupère les photos à partir d’un lien sur ton adresse Home Assistant. Cette adresse doit donc aussi être autorisée dans l’environnement.

## Mes paramètres ne sont pas enregistrés

Les modifications dans les Paramètres restent en brouillon jusqu’à ce que tu sélectionnes **Enregistrer**. La barre en bas indique quelles cartes ont des modifications non enregistrées. Si tu quittes la page avec des modifications non enregistrées, tu peux choisir **Enregistrer**, **Abandonner** ou **Rester**.

## Autre chose

Dans Home Assistant, va dans **Paramètres → Système → Journaux** et cherche `boopli`. Si c’est un bug, ouvre un ticket sur [github.com/sandschi/Boopli/issues](https://github.com/sandschi/Boopli/issues). Indique les versions de Boopli et de Home Assistant que tu utilises, ainsi que le message dans les journaux.
