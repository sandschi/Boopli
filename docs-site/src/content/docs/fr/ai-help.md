---
title: Aide de l’IA
description: Découpe une tâche en toutes petites étapes avec ton propre agent IA dans Home Assistant.
---

Si tu veux un deuxième avis ou si tu n’as pas d’agent, vois aussi [Demander à Claude](/Boopli/fr/ask-claude/).

Boopli peut découper une grosse tâche comme « nettoyer ma chambre » en toutes petites étapes avec **ton propre agent IA dans Home Assistant**. Il passe par l’intégration Tâche IA de Home Assistant. L’aide de l’IA est désactivée par défaut. Dans les Paramètres, ouvre **Aide de l’IA**, puis sélectionne **Avancé** et **Activer l’aide de l’IA**. Sélectionne ton agent IA et enregistre. Rouvre la fenêtre **Avancé** de la carte et sélectionne **Tester l’agent IA**. Tu peux aussi suivre **Pas à pas**.

![La fenêtre Aide de l’IA dans les Paramètres](/Boopli/img/fr/ai-help.jpg)

### Deux façons de commencer

Dans Aujourd’hui, écris ce que tu veux faire, puis sélectionne **Découper maintenant** pour une tâche ponctuelle qui disparaît une fois terminée, ou **Découper une tâche récurrente** pour finir dans l’assistant de planification. Dans l’onglet Tâches, tu peux choisir **Nouvelle tâche avec l’IA**. Dans l’éditeur de tâches, **Demander des étapes à l’IA** remplit la liste des étapes d’une tâche.

### L’IA commence par te poser des questions

Pour une tâche claire comme « sortir la poubelle », l’IA passe directement aux étapes. Pour une tâche en plusieurs parties, elle te demande ce qu’elle a besoin de savoir. Qu’y a-t-il dans la pièce ? À quoi ressemble-t-elle ? Combien d’énergie as-tu ? Chaque question propose des boutons (tu peux en sélectionner plusieurs pour les listes) et un champ pour répondre avec tes mots. Tu as toujours un champ **Autre chose que je devrais savoir ?** et un bouton **Proposer les étapes maintenant**. L’agent IA pose plus de questions pour une tâche récurrente, car tu la configures une fois et tu la réutilises.

### De toutes petites étapes, dans l’ordre

Chaque étape correspond à une action concrète. La première te permet de démarrer le plus facilement possible. Les étapes sont regroupées par endroit (table, chaises, sol…). L’IA peut signaler qu’il faut prévoir un temps d’attente. Une tâche peut contenir jusqu’à 50 étapes. Rien n’est créé avant que tu aies vérifié les étapes, apporté tes changements et choisi de les utiliser.

### Taille des étapes et XP

Une étape peut être petite, moyenne ou grande (S, M, L). Elle rapporte 10, 15 ou 20 XP. Les étapes que tu écris toi-même sont petites. Aujourd’hui affiche la partie, une barre de progression et un compteur comme « Étape 3 sur 8 ». Une petite animation fête la fin de la tâche.

### Gardé pour la prochaine fois

Ce que l’IA a appris sur une tâche récurrente est enregistré avec la tâche. Tu peux le modifier. L’IA s’en sert la prochaine fois que tu sélectionnes **Demander des étapes à l’IA**.

### Tu sais combien de temps tu attends

Pendant que l’agent travaille, Boopli affiche une animation, le temps écoulé, le délai maximal (3 minutes) et une barre pour visualiser le temps déjà passé. Un petit message te dit que ça prend du temps et que l’agent travaille toujours. **Arrêter d’attendre** te ramène en arrière et garde tout ce que tu as saisi. Une réponse arrivée trop tard est ignorée.

### En parler dans ton propre chat IA

**Dans mon propre chat IA** (pour une pièce) et **Parler de tout mon logement dans mon propre chat IA** te donnent une consigne prête à copier dans le chat IA de ton choix, par exemple un chat où tu peux parler à voix haute. Quand tu dis que tu as fini, le chat te répond avec des notes en texte simple. Colle-les dans Boopli. Boopli retire les puces, la mise en forme Markdown et les délimiteurs de blocs de code. Si la réponse concerne tout ton logement, il la découpe par pièce à partir des titres `## Room`. Il te montre le tout pour que tu puisses le relire avant d’enregistrer. Tu choisis quoi envoyer quand tu colles la consigne dans ton chat. Cette méthode fonctionne même si l’aide de l’IA est désactivée.

### Action

`boopli.break_down` (`task`, et `kind`, `answers`, `notes` et `rooms` facultatifs) renvoie les étapes pour tes automatisations et tes assistants vocaux. Sans `rooms`, Boopli déduit les pièces à partir de la tâche, comme dans le panneau. Voir aussi [Actions, événements et capteurs](/Boopli/fr/automations/).

### Tu peux modifier les consignes

Sur la carte Aide de l’IA, ouvre la fenêtre **Avancé**, puis **Avancé : agent IA pour les photos et consignes**. Tu peux lire, modifier et réinitialiser les deux consignes que Boopli envoie (questions et étapes) et les deux textes à copier dans ton propre chat IA (une pièce ou tout le logement). Les consignes intégrées à l’aide de l’IA demandent un seul objet JSON. Elles restent en anglais. Boopli demande à l’agent IA de répondre dans la langue de Home Assistant.

## Confidentialité

Boopli n’envoie rien tout seul à un service d’IA. Quand tu utilises l’aide de l’IA, Boopli envoie le texte de la tâche et tes réponses à l’agent IA que tu as choisi. Les notes enregistrées avec une tâche récurrente peuvent resservir. Tu peux aussi partager les notes des pièces de ton choix ou des photos. Si ton agent IA fonctionne dans le cloud, son fournisseur reçoit ce que tu partages et peut le conserver. Boopli supprime ses propres fichiers photo temporaires après la demande. Il n’inclut pas le nom de tes appareils, l’historique de Home Assistant ni ta localisation dans la demande. Ce que tu saisis ou photographies peut toutefois contenir des informations privées. Si l’agent IA échoue, Boopli affiche la raison qu’il reçoit.
