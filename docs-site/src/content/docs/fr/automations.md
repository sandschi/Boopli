---
title: Actions, événements et capteurs
description: Crée tes propres automatisations avec Boopli.
---

Boopli met trois outils à la disposition de tes automatisations, de tes scripts et de tes assistants vocaux : des actions à appeler, des événements à écouter et des capteurs pour ton animal.

## Actions

| Action | À quoi elle sert |
|---|---|
| `boopli.break_down` | Découpe une tâche en petites étapes avec ton agent IA et renvoie les étapes. L’aide de l’IA doit être activée. Champs : `task`, et en option `kind` (`now` ou `recurring`), `answers`, `notes` et `rooms`. Sans `rooms`, Boopli déduit les pièces à partir de la tâche, comme dans le panneau. |
| `boopli.add_task` | Crée et lance une tâche ponctuelle, avec des étapes si tu en indiques. Elle disparaît une fois terminée. |
| `boopli.start_chore` | Lance une tâche tout de suite à partir de son nom ou de son ID. |
| `boopli.complete_step` | Marque comme terminée l’étape de la tâche qui t’attend. |
| `boopli.snooze_step` | Reporte le prochain rappel de l’étape de la tâche qui t’attend. |
| `boopli.step_on_it` | Indique à Boopli que tu fais l’étape de la tâche qui t’attend (« Je m’y mets »). |
| `boopli.step_not_on_it` | Reprend les rappels après « Je m’y mets ». |
| `boopli.delete_chore` | Supprime la tâche et arrête tout ce qui est en cours pour cette tâche. |
| `boopli.set_away` | Active le [mode absence](/Boopli/fr/away-mode/). Les champs `start` et `until` sont facultatifs, par exemple `2026-11-28 08:00`. |
| `boopli.end_away` | Désactive le mode absence. |

Les actions qui prennent une tâche (`chore`) acceptent son nom ou son ID. Si deux tâches portent le même nom, utilise l’ID.

## Événements

Boopli envoie ces événements sur le bus d’événements de Home Assistant. Tu peux les utiliser pour déclencher une automatisation.

| Événement | Quand |
|---|---|
| `boopli_chore_started` | Une tâche a démarré. |
| `boopli_questions_answered` | Tu as répondu aux questions d’une tâche avant son démarrage. |
| `boopli_step_active` | C’est maintenant à toi de faire une étape. |
| `boopli_step_on_it` | Tu as sélectionné **Je m’y mets** sur une étape. |
| `boopli_step_done` | Une étape est terminée. `by` indique `manual` ou `auto` et `reason` indique ce qui s’est passé. |
| `boopli_chore_done` | Toutes les étapes d’une tâche sont terminées. |
| `boopli_nudge_sent` | Boopli t’a envoyé un rappel. |
| `boopli_blubs_earned` | Tu as gagné des Blubs en terminant une étape. |
| `boopli_xp_gained` | Ton animal a mangé et tu as gagné des XP. |
| `boopli_achievement_unlocked` | Tu as débloqué un succès. L’événement se déclenche une fois par succès et contient son identifiant dans `achievement`. |
| `boopli_away_started` | Le mode absence a démarré. |
| `boopli_away_ended` | Le mode absence a pris fin. |

## Capteurs

Boopli ajoute un appareil nommé **Boopli**, avec trois capteurs pour ton animal :

- **XP** : le total des XP de ton animal.
- **Level** : le niveau de ton animal.
- **Mood** (humeur) : `happy`, `content`, `sleepy`, `sad` ou `hibernating` (joyeux, content, somnolent, triste ou en hibernation).

Tu peux les afficher sur un tableau de bord ou les utiliser dans des automatisations. Par exemple, allume une lampe en vert quand le capteur **Mood** passe à l’état `happy`.
