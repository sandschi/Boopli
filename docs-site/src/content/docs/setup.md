---
title: Set up Boopli
description: The setup wizard, the guides, Settings and how unsaved changes work.
---

## First setup

The first time you open Boopli, a wizard opens by itself. A rail on the left lists the steps, with one question per screen, a progress bar, a **Back** button and a safe default everywhere. Every step can be skipped, and **Skip for now** closes the whole wizard. Answers are saved as you go, so closing the tab halfway loses nothing. It asks for: your pet's name, your phone, quiet hours, snooze length and default nudge style, reminder lights, whether you want speaker reminders (a single question: **Set up speakers** or **Skip**), where you are (a person entity, so Boopli knows when you are away), and a few starter chores (Dishwasher, Laundry, Trash, Pills, selected by default, added without a schedule so nothing nudges you until you set a time or start one). Select **Test** to try a nudge on a device. Boopli sends nothing to an AI service by itself. If you use [AI help](/Boopli/ai-help/) or [Ask Claude](/Boopli/ask-claude/), the chosen AI service receives your chore and answers, plus any room notes or photos you share. A cloud provider may keep that data.

If you skip or leave it unfinished, Today shows a **Finish setting up** banner that continues where you stopped. Installs that already had chores or settings before the wizard existed count as set up.

The panel is available in English (en), German (de), Dutch (nl), French (fr) and Spanish (es). The panel follows Home Assistant’s language. Select another language for this browser in **Settings → Language**, or select **Same as Home Assistant** to return to the default. The `?lang=xx` option in the address takes priority.

## Quiet hours are per day

Every weekday has its own times, or **No limit**. Nothing is grouped into "weekdays" and "weekend", because not everyone has the same weekend. Select **Same as Monday** to copy Monday’s times to the next day.

![The Settings page: cards for devices, timing and extras, each with Guide me and Advanced](/Boopli/img/settings.jpg)

## Guides and Advanced settings

Each Settings card summarizes what is set. Use **Guide me** for a step-by-step guide or **Advanced** to open that card’s settings. The speaker guide walks you through the speaker, ding, speech, alarm sound and timing. Alarm devices have their own guide.

Every wizard ends with **All set**, which shows what changed, for example “Snooze: 15 → 10 min.”

## Unsaved changes are always visible

On the Settings page and in the chore editor, a bar sticks to the bottom of the screen as soon as you edit anything. On Settings it lists which cards have unsaved changes: select a name and the page scrolls to that card and lights it up. The changed cards carry an orange "Unsaved" tag, the Settings and Chores tabs show a dot, and leaving with unsaved edits (another tab, a wizard, closing the page) offers **Save**, **Discard** and **Stay**. In the chore editor, **Save** keeps the editor open. **Save and close** saves your changes and closes the editor.

## Settings are one calm page

Cards are in three groups. **Devices** has **Phone**, **Lights for nudges**, **Speakers** and **Alarm devices**. **Timing** has **Quiet hours**, **Snooze and timing**, **Nudge sequences** and **Where you are**. **Extras** has **Your pet and accent color**, **Wall board**, **AI help**, **Backup** and **Language**. Most cards have two buttons, **Guide me** (a step-by-step guide) and **Advanced** (a window for that card). On the **Wall board** card, **Edit on the wall** opens the wall board in edit mode. The Advanced window has **Save and close**, **Discard and close** (throws away what you changed in that window) and **Keep for later** (closes it and keeps your changes as an unsaved draft).



## Start again

At the bottom of Settings, **Run the first setup again** opens the first-run wizard once more. Every wizard ends with the list of what changed, so you can see exactly what you did.
