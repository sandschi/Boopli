---
title: Your data and backups
description: Where Boopli keeps its data and how to back it up.
---

Boopli stores its data in Home Assistant's normal storage, so your regular Home Assistant backups include it.

## Backup

The **Backup** card (Extras) saves your setup to one file ending in .adhd (plain JSON inside) and loads one back, for example on a new install. Select what to include: **Settings**, **Chores**, **Rooms and notes**, and **Pet and history**. All four are selected by default. **Import** shows what is in the file, what would change and which devices this install is missing. It replaces the parts you select after you confirm. If you import chores, Boopli stops chores in progress that are missing from the backup. Boopli checks the file before making changes. A backup excludes chores in progress, Away mode and image files. Keep the file private. It can include device names and room notes. Only admins can export or import.

If you use [AI help](/Boopli/ai-help/) or [Ask Claude](/Boopli/ask-claude/), your chosen AI service receives the chore, your answers and any room notes or photos you share. A cloud provider may keep that data. Boopli deletes its own temporary photo files after the request.
