---
title: Installer Boopli
description: Installe Boopli avec HACS ou à la main, puis ajoute-le à Home Assistant.
---

Boopli est une intégration personnalisée pour Home Assistant. Tu peux utiliser ses tâches et ses rappels avec ton installation actuelle de Home Assistant.

## Avec HACS

1. Ouvre HACS et ajoute `https://github.com/sandschi/Boopli` comme dépôt personnalisé de type **Intégration**. Ce bouton le fait pour toi :

   [![Ouvre ton instance Home Assistant, puis ce dépôt dans HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=sandschi&repository=Boopli&category=integration)

2. Télécharge Boopli dans HACS, puis redémarre Home Assistant.

## À la main

Copie le dossier `custom_components/boopli` du dépôt dans le dossier `custom_components` de ta configuration Home Assistant, puis redémarre Home Assistant.

## Ajouter Boopli à Home Assistant

Va dans **Paramètres → Appareils et services → Ajouter une intégration** et sélectionne **Boopli**, ou utilise ce bouton :

[![Ouvre ton instance Home Assistant et lance la configuration de Boopli.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=boopli)

Le panneau Boopli apparaît dans la barre latérale de Home Assistant. L’assistant de configuration se lance à la première ouverture. Le panneau, la fenêtre de configuration et les descriptions des services sont disponibles en anglais (en), en allemand (de), en néerlandais (nl), en français (fr) et en espagnol (es). Passe ensuite à [Configurer Boopli](/Boopli/fr/setup/).
