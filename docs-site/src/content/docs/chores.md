---
title: Chores and schedules
description: Chore kinds, schedules, steps that wait, ask questions or finish by themselves.
---

## Chore schedules

A chore is one of three kinds:

- **On demand.** You start it yourself.
- **On certain days and times.** Every weekday has its own times, or none. Nothing is grouped into "weekdays" and "weekend". A day can have several times (up to six), for example pills at 08:00 and 20:00, or the dishwasher Mon to Fri at 19:30 and Saturday at 11:00. In the chore editor each day is a row with a **Scheduled** checkbox, its times, and a button such as **Same as Monday**.
- **A set number of days after I finish.** It comes back N days after the last run was finished, at a time you set.

If a chore comes due while its last run is still open, that round is skipped instead of stacking a second run.

**Schedule wizard.** The **Set the schedule step by step** button in the chore editor opens a wizard: how often, which days to select, what time on each day, a preview of the next five runs (calculated by the integration itself), and a last screen showing what changed. Chores without a schedule show a **Set a schedule** button in the Chores list, which opens the wizard directly and saves the chore when you finish. Inside the editor the wizard only fills in the form, and the usual unsaved-changes bar tells you to save.

## Steps that wait or ask

### Parts, and setting one aside

Steps are grouped into parts ("Desk", "Sofa", "Floor"), and a chore about a whole room gets one complete part for each thing in the room notes. On Today, **Do <group> later** (for example **Do Desk later**) sets a part's open steps aside as a small chore of its own ("Clean the living room: Desk"). Choose **I’ll start it myself**, **Tomorrow, 9:00** or **Pick a time**. Nothing is lost and nothing becomes overdue: the part waits under **Set aside for later** (**Start now**, **Change time**, **Delete**) and starts by itself at its time, with the usual nudges and Blubs. You can set aside a part, not a single step inside it (a single step has Snooze), and not the last part of a chore.

### Wait until this happens

A step can wait for something instead of only for minutes: its "Wait until this happens…" takes the same triggers as "Finishes by itself when…" (an entity state or number, an NFC tag, a button or event entity). The step stays quiet, with no nudges, until one of them happens, then it is your turn. The minutes become the longest it waits (0 = as long as it takes). For a washing machine, "Hang the laundry up" can wait for the machine's "cycle finished" event. In the chore editor every step also has an optional **Which area / phase does this step belong to? (optional)** field, so you can set up parts yourself.

### Questions before it starts

On Today, a chore that started by itself and has questions shows them under **Quick look first**.

A chore can ask yes/no questions every time it starts ("Does the table need decluttering?"), because things look different each time. A step linked to a question (the **Only if:** field) is only in the list when you answer **Yes** (green); on **No** (red) it never shows up. Steps that belong to no question are always there, so the table still gets wiped. Select **Start now** and you answer first. A chore that starts by itself (schedule, sensor, NFC) starts with all its steps right away, so triggers and Done work as usual, and your phone gets a notification with **Start with all steps** or **Answer the questions** (which opens Boopli in the app). The first nudge waits for your answers (30 minutes by default, set in Settings); answer later and the steps you did not do yet are tidied. When the AI breaks down a recurring chore it can write these questions itself, and the chore keeps them for next week. Automations get the answers in the `boopli_chore_started` and `boopli_questions_answered` events.

## Steps that finish by themselves

In the chore editor, every step has an optional **Finishes by itself when…** section. When one of its triggers fires, Boopli marks the step done, stops its nudges (lights, sounds, alarm, phone notification) and moves on. Any one trigger is enough, and the Done button always still works.

- **An entity changes.** Pick any entity and a state (`on`, `open`, `home`…), or a number it must go above or below, and optionally how many minutes it must stay that way. Example: a door sensor opens, or soil moisture goes above 40.
- **An NFC tag is scanned.** Pick a tag from Home Assistant's tag list, or select **Scan now** and hold your phone to the tag.
- **A button is pressed.** Any `event`, `input_button` or `button` entity, optionally only one kind of press (single, double).

By default a trigger has to happen **after the step starts**, so a door that was already open does not finish "open it to dry". Below the condition, select **Count the condition if it’s already met when the step starts** to include cases like windows that are already shut. If you haven’t set a time for the condition to stay true, the step finishes right away without a nudge.

An unavailable or unknown sensor never counts as done. Steps finished this way show on the Today screen under "Done by itself" with what happened, and `boopli_step_done` events carry `by` (`manual` or `auto`) and `reason`. Triggers that were already true when Home Assistant restarts are checked again, but a press or scan that happened while Home Assistant was down is lost.

### "On it" while you work

Select **On it** on Today, on the wall board or in the phone notification to pause nudges while you work. The phone notification turns green and quiet. After the check-in time (30 minutes by default), Boopli can send a phone check-in with **Done** and **Still on it**. To start nudges again, select **Resume nudges** on Today or the wall board, or **Not on it** in the phone notification. The actions `boopli.step_on_it` and `boopli.step_not_on_it` and the event `boopli_step_on_it` are there for your own automations.

### An image with the nudge

A step can have an image in the phone notification (for example the pill box or the washer display). In the step editor, open **Notification image…** and select **A camera** (the phone shows a fresh snapshot) or **An image file** in Home Assistant's media folder, for example `boopli/pills.jpg`. The image stays when you select **On it** and in the check-in. It needs the phone to reach Home Assistant, and it is optional: a step without one sends the same notification as before. The media folder needs a login to read, unlike the public `www` folder.

