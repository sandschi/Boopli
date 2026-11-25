---
title: Tâches et planning
description: Types de tâches, planning et étapes qui attendent, posent des questions ou se terminent automatiquement.
---

## Planifier les tâches

Tu peux choisir parmi trois types de tâches :

- **À la demande**. Tu lances la tâche toi-même.
- **Certains jours, à certaines heures**. Chaque jour de la semaine peut avoir ses propres horaires ou n’en avoir aucun. Les jours ne sont pas regroupés en « jours de semaine » et « week-end ». Tu peux choisir plusieurs heures par jour (jusqu’à six). Par exemple, les médicaments à 08:00 et 20:00, ou le lave-vaisselle du lundi au vendredi à 19:30 et le samedi à 11:00. Dans l’éditeur de tâches, chaque jour a sa ligne, avec une case **Planifié**, ses horaires et un bouton comme **Comme lun.**.
- **Un nombre de jours fixe après avoir terminé**. La tâche revient N jours après la dernière fois où tu l’as terminée, à l’heure que tu choisis.

Si l’heure prévue arrive alors que la tâche est encore en cours, Boopli passe ce tour pour éviter de la lancer une deuxième fois.

**Assistant de planification.** Dans l’éditeur de tâches, **Planifier étape par étape** ouvre un assistant. Tu choisis la fréquence, les jours et les heures pour chaque jour. Tu vois ensuite les cinq prochaines dates d’exécution, calculées par l’intégration elle-même. Le dernier écran montre ce qui a changé. Dans la liste des tâches, celles qui n’ont pas de planning ont un bouton **Planifier**. Il ouvre directement l’assistant et enregistre la tâche à la fin. Si tu lances l’assistant depuis l’éditeur, il remplit seulement le formulaire. La barre habituelle te rappelle d’enregistrer tes modifications.

## Étapes qui attendent ou posent des questions

### Les parties d’une tâche et comment en mettre une de côté

Les étapes sont regroupées par partie (« Bureau », « Canapé », « Sol »). Si la tâche concerne toute une pièce, chaque élément dans les notes de la pièce a sa propre partie. Dans Aujourd’hui, **Faire cette partie plus tard** met de côté les étapes restantes d’une partie et en fait une petite tâche à part (« Nettoyer le salon : bureau »). Choisis **Je lancerai la tâche moi-même**, **Demain, 9 h** ou **Choisir une heure**. Tu ne perds rien et la partie ne prend pas de retard. Elle attend dans **Pour plus tard** (**Commencer maintenant**, **Changer l’heure**, **Supprimer**) et démarre toute seule à l’heure prévue, avec les rappels et les XP habituels. Tu peux mettre de côté une partie entière, sauf la dernière d’une tâche. Pour attendre avant de faire une seule étape, utilise Reporter.

### Attendre que ça arrive

Une étape peut attendre qu’il se passe quelque chose. Le réglage « Attendre que ça arrive… » propose les mêmes déclencheurs que « Se termine automatiquement quand… » (l’état ou la valeur numérique d’une entité, une étiquette NFC, un bouton ou une entité événement). L’étape reste en pause, sans rappel, jusqu’à ce qu’un de ces déclencheurs se produise. C’est alors à toi de jouer. Le nombre de minutes fixe l’attente maximale (0 = aussi longtemps que nécessaire). Par exemple, « Étendre le linge » peut attendre que le lave-linge signale la fin du cycle. Dans l’éditeur de tâches, le champ **Partie de la tâche (facultatif)** te permet de définir toi-même les parties de chaque étape.

### Des questions avant de commencer

Dans Aujourd’hui, si une tâche avec des questions démarre toute seule, les questions apparaissent sous **D’abord, un coup d’œil**.

Une tâche peut te poser des questions auxquelles tu réponds par oui ou non à chaque lancement (« Est-ce qu’il faut ranger ce qui traîne sur la table ? »). La situation peut changer d’une fois à l’autre. Une étape liée à une question (champ **Seulement si :**) s’affiche uniquement si tu réponds **Oui** (vert). Si tu réponds **Non** (rouge), elle ne s’affiche pas. Les étapes sans question sont toujours là. Par exemple, il reste à essuyer la table. Si tu sélectionnes **Commencer maintenant**, tu réponds d’abord. Si une tâche démarre toute seule (planning, capteur, NFC), toutes ses étapes sont disponibles tout de suite. Les déclencheurs et le bouton Terminé fonctionnent comme d’habitude. Ton téléphone reçoit une notification avec **Commencer avec toutes les étapes** ou **Répondre aux questions** (qui ouvre Boopli dans l’application). Le premier rappel attend tes réponses (30 minutes par défaut, réglables dans les Paramètres). Si tu réponds plus tard, Boopli ajuste les étapes qu’il te reste à faire. Quand l’IA découpe une tâche récurrente, elle peut écrire ces questions elle-même. La tâche les garde pour la semaine suivante. Les automatisations reçoivent les réponses dans les événements `boopli_chore_started` et `boopli_questions_answered`.

## Étapes qui se terminent automatiquement

Dans l’éditeur de tâches, chaque étape a une section facultative **Se termine automatiquement quand…**. Quand l’un des déclencheurs se produit, Boopli marque l’étape comme terminée. Il arrête ses rappels (lampes, sons, alarme, notification sur le téléphone) et passe à la suite. Un seul déclencheur suffit et le bouton Terminé reste utilisable.

- **Une entité change**. Choisis une entité et un état (`on`, `open`, `home`…), ou une valeur à dépasser ou en dessous de laquelle descendre. Tu peux aussi préciser combien de minutes la condition doit rester vraie. Par exemple, un capteur de porte passe à l’état ouvert ou l’humidité du sol dépasse 40.
- **Une étiquette NFC est scannée**. Choisis une étiquette dans la liste de Home Assistant ou sélectionne **Scanner maintenant**, puis approche ton téléphone de l’étiquette.
- **Un bouton est actionné**. Choisis une entité `event`, `input_button` ou `button`. Tu peux aussi choisir un seul type d’appui (simple ou double).

Par défaut, un déclencheur doit se produire **après le début de l’étape**. Par exemple, une porte déjà ouverte ne termine pas l’étape « ouvrir la porte pour laisser sécher ». Sous **Avancé**, tu peux aussi sélectionner **Compter la condition si elle est déjà remplie au début de l’étape** (par exemple « les fenêtres sont fermées »). L’étape se termine alors tout de suite, sans rappel pour ce que tu as déjà fait.

Un capteur indisponible ou dont l’état est inconnu ne termine jamais une étape. Les étapes terminées automatiquement s’affichent dans Aujourd’hui sous « Fait automatiquement », avec ce qui s’est passé. Les événements `boopli_step_done` contiennent `by` (`manual` ou `auto`) et `reason`. Quand Home Assistant redémarre, Boopli vérifie de nouveau les conditions déjà remplies. Il ne récupère pas les appuis ni les scans qui ont eu lieu pendant l’arrêt.

### « Je m’y mets » pendant que tu avances

Sélectionne **Je m’y mets** dans Aujourd’hui, sur le Wallboard ou dans la notification sur ton téléphone pour mettre les rappels en pause pendant que tu avances. La notification devient verte et silencieuse. Une fois le délai écoulé (30 minutes par défaut), Boopli peut te demander où tu en es sur ton téléphone. La notification propose **Terminé** et **J’y travaille encore**. Pour relancer les rappels, sélectionne **Reprendre les rappels** dans Aujourd’hui ou sur le Wallboard, ou **Je ne m’y mets pas** dans la notification. Les services `boopli.step_on_it` et `boopli.step_not_on_it`, ainsi que l’événement `boopli_step_on_it`, sont disponibles pour tes automatisations.

### Une image avec le rappel

La notification d’une étape sur ton téléphone peut afficher une image, par exemple celle du pilulier ou de l’écran de la machine à laver. Dans l’éditeur d’étapes, ouvre **Image de la notification…** et sélectionne **Une caméra** (le téléphone affiche une image prise à l’instant) ou **Un fichier image** dans le dossier multimédia de Home Assistant, par exemple `boopli/pills.jpg`. L’image reste quand tu sélectionnes **Je m’y mets** et s’affiche dans la notification qui te demande où tu en es. Pour l’afficher, ton téléphone doit pouvoir joindre Home Assistant. L’image est facultative. Sans elle, la notification reste la même qu’avant. Il faut se connecter pour lire le dossier multimédia. Le dossier `www` est public.
