# Boopli

An ADHD-friendly chore and task companion for [Home Assistant](https://www.home-assistant.io/).

> **Status: early development (v0.0.11).** You can break a task into tiny steps with your own AI agent, set Boopli up with guided wizards or plain forms, create chores made of steps (with waiting time between steps) on a schedule with a different time per day, see what is due on a Today screen, mark steps done (or let a sensor, NFC tag or button do it), get nudged through lights, speakers, alarm devices and your phone, climbing from a gentle cue to an alarm, and earn XP for a placeholder pet. There is no final pet art or AI task breakdown yet, so it is not ready for daily use.

## Setup, wizards and Settings

**First setup.** The first time you open Boopli, a wizard opens by itself. A rail on the left lists the steps, with one question per screen, a progress bar, a Back button and a safe default everywhere. Every step can be skipped, and **Skip for now** closes the whole wizard. Answers are saved as you go, so closing the tab halfway loses nothing. It asks for: your pet's name, your phone, quiet hours, snooze length and default nudge style, reminder lights, whether you want speaker reminders (a single question: **Set up speakers** or **Skip**), where you are (a person entity, so Boopli knows when you are away), and a few starter chores (Dishwasher, Laundry, Trash, Pills, pre-ticked, added without a schedule so nothing nudges you until you set a time or start one). Nothing is sent to any device until you press a **Test** button.

If you skip or leave it unfinished, Today shows a **Finish setting up** banner that continues where you stopped. Installs that already had chores or settings before the wizard existed count as set up.

**Quiet hours are per day.** Every weekday has its own times, or "no limit". Nothing is grouped into "weekdays" and "weekend", because not everyone has the same weekend. Shortcuts like "Same as Monday" only fill in the times.

**Settings has two views**, switched with a button at the top (Boopli remembers your choice in the browser):

- **Simple (the default).** One card per area (your pet, phone, quiet hours, snooze and style, reminder lights, speakers, alarm devices, where you are) saying in plain words what is set, with a **Set up step by step** button. Each area has its own wizard with a quick path and the optional details (blink length and repeats, when each channel joins in, alarm length). Speakers are set up in small steps: pick a speaker, a ding, a spoken sentence, an alarm sound, when each joins in; alarm devices have their own wizard.
- **Advanced.** All the forms, side by side, for people who prefer them.

Every wizard ends with **All set**, which lists exactly what changed compared with before that wizard (for example "Snooze: 15 to 10 min" or "Mon: 07:00 to 22:00 to 07:30 to 22:00").

**Unsaved changes are always visible.** In Advanced settings and in the chore editor, a bar sticks to the bottom of the screen as soon as you edit anything ("You have unsaved changes", with Save and Discard). The cards you changed are marked, the Settings and Chores tabs show a dot, and leaving with unsaved edits (another tab, a wizard, closing the page) asks **Save / Discard / Stay**.

## Chore schedules

A chore is one of three kinds:

- **On demand.** You start it yourself.
- **On certain days and times.** Every weekday has its own times, or none. Nothing is grouped into "weekdays" and "weekend". A day can have several times (up to six), for example pills at 08:00 and 20:00, or the dishwasher Mon to Fri at 19:30 and Saturday at 11:00. In the chore editor each day is a row with a **Runs** checkbox, its times, and a **Same as the day above** button.
- **Every N days after I finish.** It comes back N days after the last run was finished, at a time you set.

If a chore comes due while its last run is still open, that round is skipped instead of stacking a second run.

**Schedule wizard.** The **Set the schedule step by step** button in the chore editor opens a wizard: how often, which days (tap them), what time on each day, a preview of the next five runs (calculated by the integration itself), and a last screen showing what changed. Chores without a schedule show a **Set a schedule** button in the Chores list, which opens the wizard directly and saves the chore when you finish. Inside the editor the wizard only fills in the form, and the usual unsaved-changes bar tells you to save.

## AI help: break a task into tiny steps

Boopli can split a big task, such as "clean my room", into very small steps with **your own Home Assistant AI agent** (the `ai_task` integration: Google, OpenRouter, a local model such as Ollama, and so on). It is **off until you switch it on** in Settings (the 🤖 AI help card, or its step-by-step wizard), where you also choose the agent and press **Test the agent**.

- **Two ways in.** On Today, write what you want to get done and press **Break it down now** (a one-off task that disappears when done), or **Break down a recurring chore** (it ends in the schedule wizard). The Chores tab has **New chore with AI**, and inside the chore editor **Suggest steps with AI** fills a chore's steps.
- **The AI asks first.** A clear task such as "take out the trash" goes straight to steps. For anything with several parts, the AI asks what it needs to know: what is in the room, how it looks, how much energy you have. Every question has buttons (several can be picked for lists) and a box for your own words, and there is always an **Anything else?** box and **Enough, go on**. There is no limit on rounds, and a recurring chore is asked about in more depth, because it is set up once and reused.
- **Tiny, ordered steps.** Each step is one concrete action, the first one is the easiest possible start, steps are grouped by area (Table, Chairs, Floor...), and the AI can say that something needs waiting time. A chore can have up to 50 steps. Nothing is created until you have checked and changed the steps and pressed a button.
- **Step sizes and XP.** Every step is small, medium or big (S, M, B), worth 10, 15 or 20 XP (steps you write yourself are small). Today shows the group, "Step 3 of 8" with a progress bar, and a celebration when a task is finished.
- **Parts, and setting one aside.** Steps are grouped into parts ("Desk", "Sofa", "Floor"), and a task about a whole room gets one complete part for each thing in the room notes. On Today, **Do this part later** sets a part's open steps aside as a small task of its own ("Clean the living room: Desk"). Choose **When I want**, **Tomorrow, 9:00** or **Pick a time**. Nothing is lost and nothing becomes overdue: the part waits under **Set aside for later** (Start now, Change time, Remove) and starts by itself at its time, with the usual nudges and XP. You can set aside a part, not a single step inside it (a single step has Snooze), and not the last part of a task.
- **Wait until this happens.** A step can wait for something instead of only for minutes: its "Wait until this happens…" takes the same triggers as "Finishes by itself when…" (an entity state or number, an NFC tag, a button or event entity). The step stays quiet, with no nudges, until one of them happens, then it is your turn. The minutes become the longest it waits (0 = as long as it takes). For a washing machine, "Hang the laundry up" can wait for the machine's "cycle finished" event. In the chore editor every step also has an optional **Part of the task** field, so you can set up parts yourself.
- **Questions before it starts.** A chore can ask yes/no questions every time it starts ("Does the table need decluttering?"), because things look different each time. A step linked to a question ("Only if…") is only in the list when you answer **Yes** (green); on **No** (red) it never shows up. Steps that belong to no question are always there, so the table still gets wiped. Press **Start now** and you answer first. A chore that starts by itself (schedule, sensor, NFC) starts with all its steps right away, so triggers and Done work as usual, and your phone gets a notification with **Start with all steps** or **Answer the questions** (which opens Boopli in the app). The first nudge waits for your answers (30 minutes by default, set in Settings); answer later and the steps you did not do yet are tidied. When the AI breaks down a recurring chore it can write these questions itself, and the chore keeps them for next week. Automations get the answers in the `boopli_chore_started` and `boopli_questions_answered` events.
- **Away mode.** The **Away mode** card at the top of Settings (or the `boopli.set_away` service) makes Boopli rest: from now or from a date, until a date or until you turn it off (**Back now**). While it is on, Today shows a big amber **AWAY MODE IS ON** banner and the other tabs a thin one, so you cannot forget it. Also while it is on, scheduled chores do not start, nothing nudges you, and the pet's mood stays as it was. Chores already in progress freeze and carry on when you are back, nudging one after the other (2 minutes apart). Recurring chores that came due while you were away start over from today, with no catch-up. Set-aside parts and one-off tasks start when you are back. A chore with **Keeps going while I'm away** (the Pills template has it on, and the form lists every chore to tick) runs as usual. Steps that finish by themselves still finish. Automations get `boopli_away_started` and `boopli_away_ended`.
- **Kept for next time.** What the AI learned about a recurring chore is saved with the chore (editable), and the AI uses it when you press **Suggest steps** again.
- **My home.** The **My home** tab lists your rooms (filled in from your Home Assistant areas, plus any you add by hand) with notes about each one: where the dishwasher is, which door sticks. Press **Let the AI ask me** and it asks a few short questions, then proposes notes that you check and change before anything is saved. When you break a task down, Boopli guesses the room from the words in the task (a task about the whole flat means every room), shows it as chips you can change, and adds only those rooms' notes to the request. **What will the AI see?** shows the exact text. A switch turns room notes off completely. The notes live only in Boopli's storage.
- **Describe a room from photos.** On a room card, **From photos** takes up to 4 photos (camera or gallery). The panel shrinks them, they go once to your AI agent (one that can read images; you can pick a different agent for photos under Advanced), and the agent writes notes that you check first. Boopli keeps no photo: Home Assistant hands attachments to an agent as files, so each photo is written to a temporary file in the media folder (`boopli_tmp`), which is deleted right after the answer, also when the agent fails, and anything left behind by a crash is cleared when Boopli starts. Later requests carry only the text notes.
- **Photos of how it looks now.** When you break a task down, **Add photos of how it looks now** (optional, up to 4) sends them once to your AI agent, which writes down what is out of place, per thing ("Coffee table: bottles and papers", "Bin: full"). You see that text and can change it; the photos are deleted at once and only the text goes along with the next questions and the steps, so the steps name the real items and skip what already looks fine. The text is not saved afterwards, because it is only true today. Your room notes still say what is in the room and where things belong.
- **Waiting for the AI is never a guess.** While the agent works, Boopli shows an animation, the time so far, the longest it will wait (3 minutes) and a bar for the time used, with a calm sentence that says it is slow but not stuck. **Stop waiting** goes back and keeps everything you typed; a late answer is ignored.
- **Talk it out in your own AI chat.** **In my own chat** (per room) and **Talk through my whole home** give you a ready-made prompt to copy into any chat, for example one you can talk to by voice. When you say you are done, the chat answers with plain notes. Paste them back: Boopli strips bullets, markdown and code fences, splits a whole-home answer into rooms by their `## Room` headings, and shows everything for a last look before you save. Boopli sends nothing here, so it works with AI help switched off.
- **Service.** `boopli.break_down` (`task`, optional `kind`, `answers`, `notes`, `rooms`) returns the steps, for your own automations and voice assistants. Without `rooms`, the rooms are guessed from the task, like in the panel.
- **The prompts are yours.** Under Advanced settings you can read, change and reset the two prompts Boopli sends (questions and steps) and the two texts you copy into your own AI chat (one room, whole home). The built-in ones ask for one JSON object, which works with any model.

**Privacy.** Boopli sends nothing by itself. When you use AI help, the text of the task, your answers, the notes saved for that chore and the notes of the rooms the task is about go to the agent you chose, and nothing else: no device names, history or location. A cloud agent receives that text, and free models may keep or learn from what they get, so do not type private details. A local agent keeps everything at home. Photos of a room are sent only when you pick them for that one request and are never stored. If the agent fails (empty account, model gone, timeout), Boopli shows the agent's own reason.

## Steps that finish by themselves

In the chore editor, every step has an optional **Finishes by itself when…** section. When one of its triggers fires, Boopli marks the step done, stops its nudges (lights, sounds, alarm, phone notification) and moves on. Any one trigger is enough, and the Done button always still works.

- **An entity changes.** Pick any entity and a state (`on`, `open`, `home`…), or a number it must go above or below, and optionally how many minutes it must stay that way. Example: a door sensor opens, or soil moisture goes above 40.
- **An NFC tag is scanned.** Pick a tag from Home Assistant's tag list, or press **Scan now** and hold your phone to the tag.
- **A button is pressed.** Any `event`, `input_button` or `button` entity, optionally only one kind of press (single, double).

By default a trigger has to happen **after the step starts**, so a door that was already open does not finish "open it to dry". Under **Advanced** you can also count "already true when the step starts" (for example "the windows are shut"). In that case the step finishes silently at once, and nothing nudges you for something that is already done.

An unavailable or unknown sensor never counts as done. Steps finished this way show on the Today screen under "Done by itself" with what happened, and `boopli_step_done` events carry `by` (`manual` or `auto`) and `reason`. Triggers that were already true when Home Assistant restarts are checked again, but a press or scan that happened while Home Assistant was down is lost.

## Nudges

When a step becomes your turn, Boopli nudges you through the channels you turn on in the **Settings** tab:

- **Lights.** Per light you choose **Blink** or **Indicator lamp**. Blink: Boopli saves the light's current look, shows your color for as long as you set (in milliseconds), repeats 1 to 5 times with a pause you set, then puts the light back exactly as it was. Indicator lamp: the light stays on in a color until you are done. Boopli does not use a light's built-in flash, because some lights say they support it and ignore it. Press **Test** to see what a light really does. A light in your home can follow a few hundred milliseconds; a cloud-connected light needs about a second or more.
- **Speakers.** Add any media player. Each speaker has three levels you can switch on or off: a small **ding**, a **spoken sentence**, and an **alarm sound** that repeats for a time you set. A speaker plays the highest level that has been reached. Sounds: an Alexa sound by its id (for example `amzn_sfx_scifi_alarm_01`), or a file in your Home Assistant media folder (for example `boopli/ding.mp3`). Speech works through Alexa Media Player, an Alexa Devices notify entity, or a TTS voice on the speaker. Every level has a **Test** button.
- **Alarm devices.** A siren, switch or script that Boopli switches on for a time you set and then off again. It also goes off when you answer the nudge, and when Home Assistant restarts.
- **Levels.** Every channel has a "starts at nudge #" number: lights 1, phones 1, speaker ding 1, speech 2, alarm 4 by default. So a chore climbs from a light and a ding to speech and finally an alarm, as far as its style takes it.
- **Phones.** A notification from the Home Assistant app with **Done** and **Snooze** buttons, at a level you choose: normal, high priority, alarm volume, or max volume (not every phone honours it).
- **Styles, per chore:** quiet (panel only), one nudge, escalating (30, 15, 10, then every 5 minutes, then it stops), or persistent (every 5 minutes until done).
- **Quiet hours,** off by default, with different start and stop times for each weekday. A chore can opt out (for example pills).
- **Presence (optional).** At home, every channel you turned on is used. Away, only your phone is used, and only for chores marked "anywhere". Without a presence source, Boopli assumes you are home.
- **Snooze** delays the next nudge (15 minutes by default). The step stays open. There is no dismiss.

Boopli turns chores into small steps, nudges you with the lights, speakers and phone you already have, and rewards progress with a pet. Everything runs inside your own Home Assistant: no account, no cloud, no server, and nothing leaves your home.

## Planned

- Chores built from short steps, including waiting time between steps (for example a dishwasher: load, start, open to dry, empty hours later).
- Done and Snooze buttons in Home Assistant's phone notifications. No dismiss button.
- Optional light, speaker and loud-alarm nudges, quiet hours, and presence conditions.
- Services and events so your own automations can build on Boopli.

## Later ideas

- **Away / vacation mode:** plan time away so home-only chores pause and home-only nudges (lights, speakers) stay quiet, while "anywhere" chores such as medication keep going through your phone. Possibly mark a trip location too.
- **Richer notifications:** attach a picture to phone notifications, for example the pet looking happy or sad depending on how things are going, together with the Done and Snooze buttons.
- **"Skip this round"** for a chore, as a deliberate action in the panel (never on a notification).
- Custom nudge escalation, presence conditions, a wall-display view, Zigbee button support, and more pets.

## Your data

Boopli stores its data in Home Assistant's normal storage, so your regular Home Assistant backups include it.

## Development

The panel is a [Lit](https://lit.dev/) web component in `frontend/`. The built bundle in `custom_components/boopli/frontend/` is committed, so installing needs no Node.

```sh
cd frontend
npm install
npm run build
```

The chore and run logic lives in `custom_components/boopli/engine.py` and has no Home Assistant imports. Its tests run with plain pytest:

```sh
pip install pytest
pytest tests
```

### Services

| Service | What it does |
|---|---|
| `boopli.break_down` | Splits a task into small steps with your AI agent and returns them (needs AI help switched on). |
| `boopli.add_task` | Creates a one-off task (optionally with steps) and starts it. It disappears when done. |
| `boopli.start_chore` | Starts a chore now, by name or id. |
| `boopli.complete_step` | Marks the step that is waiting for you in a chore as done. |
| `boopli.snooze_step` | Snoozes the step that is waiting for you in a chore. |
| `boopli.delete_chore` | Deletes a chore and anything in progress. |

Events fired on the Home Assistant bus: `boopli_chore_started`, `boopli_step_active`, `boopli_step_done`, `boopli_chore_done`, `boopli_nudge_sent`, `boopli_xp_gained`.

## License

[MIT](LICENSE)
