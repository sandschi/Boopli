---
title: Chores and schedules
description: Chore kinds, schedules, steps that wait, ask questions or finish by themselves.
---

## Chore schedules

A chore is one of three kinds:

- **On demand.** You start it yourself.
- **On certain days and times.** Every weekday has its own times, or none. Nothing is grouped into "weekdays" and "weekend". A day can have several times (up to six), for example pills at 08:00 and 20:00, or the dishwasher Mon to Fri at 19:30 and Saturday at 11:00. In the chore editor each day is a row with a **Runs** checkbox, its times, and a **Same as the day above** button.
- **Every N days after I finish.** It comes back N days after the last run was finished, at a time you set.

If a chore comes due while its last run is still open, that round is skipped instead of stacking a second run.

**Schedule wizard.** The **Set the schedule step by step** button in the chore editor opens a wizard: how often, which days (tap them), what time on each day, a preview of the next five runs (calculated by the integration itself), and a last screen showing what changed. Chores without a schedule show a **Set a schedule** button in the Chores list, which opens the wizard directly and saves the chore when you finish. Inside the editor the wizard only fills in the form, and the usual unsaved-changes bar tells you to save.

## Steps that wait or ask

### Parts, and setting one aside

Steps are grouped into parts ("Desk", "Sofa", "Floor"), and a task about a whole room gets one complete part for each thing in the room notes. On Today, **Do this part later** sets a part's open steps aside as a small task of its own ("Clean the living room: Desk"). Choose **When I want**, **Tomorrow, 9:00** or **Pick a time**. Nothing is lost and nothing becomes overdue: the part waits under **Set aside for later** (Start now, Change time, Remove) and starts by itself at its time, with the usual nudges and XP. You can set aside a part, not a single step inside it (a single step has Snooze), and not the last part of a task.

### Wait until this happens

A step can wait for something instead of only for minutes: its "Wait until this happens…" takes the same triggers as "Finishes by itself when…" (an entity state or number, an NFC tag, a button or event entity). The step stays quiet, with no nudges, until one of them happens, then it is your turn. The minutes become the longest it waits (0 = as long as it takes). For a washing machine, "Hang the laundry up" can wait for the machine's "cycle finished" event. In the chore editor every step also has an optional **Part of the task** field, so you can set up parts yourself.

### Questions before it starts

A chore can ask yes/no questions every time it starts ("Does the table need decluttering?"), because things look different each time. A step linked to a question ("Only if…") is only in the list when you answer **Yes** (green); on **No** (red) it never shows up. Steps that belong to no question are always there, so the table still gets wiped. Press **Start now** and you answer first. A chore that starts by itself (schedule, sensor, NFC) starts with all its steps right away, so triggers and Done work as usual, and your phone gets a notification with **Start with all steps** or **Answer the questions** (which opens Boopli in the app). The first nudge waits for your answers (30 minutes by default, set in Settings); answer later and the steps you did not do yet are tidied. When the AI breaks down a recurring chore it can write these questions itself, and the chore keeps them for next week. Automations get the answers in the `boopli_chore_started` and `boopli_questions_answered` events.

## Steps that finish by themselves

In the chore editor, every step has an optional **Finishes by itself when…** section. When one of its triggers fires, Boopli marks the step done, stops its nudges (lights, sounds, alarm, phone notification) and moves on. Any one trigger is enough, and the Done button always still works.

- **An entity changes.** Pick any entity and a state (`on`, `open`, `home`…), or a number it must go above or below, and optionally how many minutes it must stay that way. Example: a door sensor opens, or soil moisture goes above 40.
- **An NFC tag is scanned.** Pick a tag from Home Assistant's tag list, or press **Scan now** and hold your phone to the tag.
- **A button is pressed.** Any `event`, `input_button` or `button` entity, optionally only one kind of press (single, double).

By default a trigger has to happen **after the step starts**, so a door that was already open does not finish "open it to dry". Under **Advanced** you can also count "already true when the step starts" (for example "the windows are shut"). In that case the step finishes silently at once, and nothing nudges you for something that is already done.

An unavailable or unknown sensor never counts as done. Steps finished this way show on the Today screen under "Done by itself" with what happened, and `boopli_step_done` events carry `by` (`manual` or `auto`) and `reason`. Triggers that were already true when Home Assistant restarts are checked again, but a press or scan that happened while Home Assistant was down is lost.

### "On it" while you work

Every nudge has an **On it** button (also on Today). The nudge turns green and quiet, stays where it is, and Boopli stops nagging while you work. After the check-in time (Settings, 30 minutes by default) it asks once, "Still on it?", with **Done** and **Still on it**. **Not on it** takes it back. The services `boopli.step_on_it` and `boopli.step_not_on_it` and the event `boopli_step_on_it` are there for your own automations.

### A picture with the nudge

A step can have a picture on the phone notification (for example the pill box or the washer display). In the step editor, open **📷 Picture** and pick a **camera** (the phone shows a fresh snapshot) or a **picture file** in Home Assistant's media folder, for example `boopli/pills.jpg`. The picture stays when you press **On it** and in the check-in. It needs the phone to reach Home Assistant, and it is optional: a step without one sends the same notification as before. The media folder needs a login to read, unlike the public `www` folder.

