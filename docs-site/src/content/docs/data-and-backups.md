---
title: Your data and backups
description: Where Boopli keeps its data and how to back it up.
---

Boopli stores its data in Home Assistant's normal storage, so your regular Home Assistant backups include it.

## Backup

The **Backup** card (Extras) saves your setup to one file ending in .adhd (plain JSON inside) and loads one back, for example on a new install. You pick what goes in: settings, chores, rooms and notes, and your pet with its history (all four by default). Import shows what is in the file, what it would change and which devices this install does not have, and only replaces the parts you tick, after you confirm; it checks the file the way a normal save does and changes nothing if anything is wrong. Running chores, away mode and picture files are not part of a backup, and the file holds the names of your devices and your notes, so keep it private. Only admins can export or import.
