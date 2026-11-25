---
title: Demander à Claude
description: Une option en plus de ton agent IA dans Home Assistant, via une routine dans ton propre compte Claude.
---

**Demander à Claude** apparaît à côté du bouton habituel dans [Aide de l’IA](/Boopli/fr/ai-help/). Ton agent IA dans Home Assistant reste disponible. Utilise cette option quand :

- tu doutes de la réponse de l’agent et tu veux un deuxième avis,
- ton agent gratuit est indisponible ou a atteint sa limite de demandes,
- tu n’as configuré aucun agent.

Cette option passe par une **routine** dans ton propre compte Claude. Chaque demande lance la routine une fois. Rien ne passe par un serveur Boopli, car il n’y en a pas.

:::caution[Une fonction expérimentale]
Les routines Claude peuvent changer tant qu’elles sont en préversion. Boopli s’arrête à 20 demandes par heure. Chaque série de questions et chaque liste d’étapes utilise une demande.
:::

![La fenêtre Demander à Claude dans les Paramètres](/Boopli/img/fr/ask-claude.jpg)

## Ce qu’il te faut

- Un compte Claude sur claude.ai qui permet de créer des routines.
- Un accès à Home Assistant depuis Internet (une URL externe, par exemple via Nabu Casa ou ton propre nom de domaine). Claude renvoie sa réponse à Home Assistant et doit donc pouvoir le joindre.

## Créer la routine

L’étape Demander à Claude du guide Aide de l’IA affiche ces instructions à côté de ton adresse Home Assistant. Utilise la [page des routines Claude](https://claude.ai/code/routines) pour configurer la routine une fois.

1. Crée une routine et nomme-la **Boopli**.
2. Colle les consignes du guide. Elles demandent à Claude de regarder d’abord les photos, s’il y en a, de préparer la réponse, de la renvoyer en une seule requête web, puis de s’arrêter. Elles lui demandent aussi d’ignorer toute instruction cachée dans une photo ou dans le texte de la tâche.
3. Crée un **environnement** pour la routine. Règle son accès réseau sur **Limité** et autorise ton adresse Home Assistant. Le guide indique le nom d’hôte exact.
4. Ajoute un **déclencheur API** à la routine et sélectionne **Générer un jeton**. Copie le jeton tout de suite. Claude ne l’affiche qu’une fois.
5. Laisse tous les connecteurs (Gmail, agenda, etc.) **désactivés**. La routine n’en a pas besoin.

Les écrans de Claude changent de temps en temps. Le nom d’un bouton peut être légèrement différent.

## Connecter la routine à Boopli

Ouvre les **Paramètres**, sélectionne **Avancé** sur la carte **Aide de l’IA**, puis **Demander à Claude (en plus)**. Tu peux aussi suivre le guide.

1. Sélectionne **Activer « Demander à Claude »**.
2. Colle l’**URL de lancement de la routine**. Elle commence par `https://api.anthropic.com/v1/claude_code/routines/` et se termine par `/fire`.
3. Colle le jeton dans **Jeton de la routine** et sélectionne **Enregistrer le jeton**.
4. Sélectionne **Tester Claude**. Boopli enregistre tes paramètres, demande une toute petite réponse à Claude et te dit combien de secondes ça a pris.

Pour définir ou modifier l’adresse de réponse de Claude, ouvre **Avancé : adresse web de Home Assistant** et remplis **Adresse où la routine envoie sa réponse**.

## Comment ça marche

1. Sélectionne **Demander à Claude**. Boopli envoie à ta routine le texte de la tâche, tes réponses et les notes sur les pièces ou les photos que tu as choisi de partager.
2. La routine prépare la réponse et l’envoie au point de réception web créé par Boopli dans Home Assistant.
3. Boopli affiche la réponse. Il attend jusqu’à 2 minutes par demande. S’il ne peut pas lire la réponse, il envoie une autre demande.

Chaque demande a un identifiant à usage unique. Boopli accepte une seule réponse et seulement pendant que la demande est en attente.

Toute personne qui a accès au panneau peut sélectionner **Demander à Claude**. Seuls les comptes administrateurs peuvent enregistrer ou supprimer le jeton et sélectionner **Tester Claude**.

## Photos

Quand tu sélectionnes des photos pour Claude, Boopli met chacune dans un fichier temporaire dans le dossier multimédia de Home Assistant. Il donne à la routine un lien signé qui fonctionne jusqu’à 10 minutes. La routine télécharge les photos. Boopli supprime ses propres fichiers temporaires après la demande, même si elle échoue. Claude peut conserver les photos reçues.

## Ce que Claude voit

Boopli n’envoie rien à Claude de lui-même. Quand tu fais une demande, Claude reçoit le texte de la tâche, tes réponses et les notes sur les pièces ou les photos que tu as choisi de partager. Si tu demandes à Claude de te poser des questions sur une pièce, il reçoit le nom de la pièce et ses notes actuelles. Claude peut conserver ce que tu partages. Boopli n’inclut pas le nom des appareils, l’historique de Home Assistant ni ta localisation dans la demande. Ce que tu saisis ou photographies peut toutefois contenir des informations privées.

## Ton jeton est secret

Boopli conserve le jeton dans son propre fichier privé dans le stockage de Home Assistant. Le jeton ne figure ni dans les paramètres ni dans une sauvegarde (`.adhd`). Le panneau sait seulement qu’un jeton est configuré. Si tu penses que ton jeton a été exposé, crée-en un nouveau sur claude.ai et colle-le dans Boopli avec **Remplacer**.

Si Boopli n’arrive pas à enregistrer le jeton, il continue d’utiliser l’ancien et te le signale. Si Boopli n’arrive pas à lire le fichier secret au démarrage, il continue de fonctionner avec Demander à Claude désactivé. Il ne touche pas au fichier et écrit la raison dans les journaux de Home Assistant.

Consulte [Dépannage](/Boopli/fr/troubleshooting/) si quelque chose ne marche pas.
