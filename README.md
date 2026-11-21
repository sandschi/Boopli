# Boopli

An ADHD-friendly chore and task companion for [Home Assistant](https://www.home-assistant.io/).

> **Status: early development (v0.0.7).** You can create chores made of steps (with waiting time between steps), see what is due on a Today screen, mark steps done (or let a sensor, NFC tag or button do it), get nudged through lights, speakers, alarm devices and your phone, climbing from a gentle cue to an alarm, and earn XP for a placeholder pet. There is no setup wizard or final pet art yet, so it is not ready for daily use.

## XP and the pet

Finishing steps earns XP, and XP levels up your pet. It is rewards only: XP and levels never go down, and the pet never dies.

- **XP:** 10 for every step you finish (by hand or by itself), +20 for the step that finishes the chore, +5 if you answered within 10 minutes of the step becoming your turn. Snoozing costs nothing. Per chore and day, only the first 3 runs earn XP, so a chore cannot be farmed.
- **Levels:** level 2 at 100 XP, level 3 at 250, level 4 at 450, then further and further apart.
- **Mood** follows how long since you finished a step: happy (today), content (yesterday), sleepy (2 days), sad (3 to 6 days), hibernating like a bear (7 days or more). One finished step wakes it up and it keeps all its XP. With no enabled chores the pet stays content.
- The pet card is on the **Today** screen, with a "+10 XP" note when you finish a step. Name your pet in **Settings**. The picture is a placeholder emoji for now, drawn in one place so real art or animation can replace it later.
- **Sensors** for dashboards and automations: `sensor.boopli_xp`, `sensor.boopli_level` and `sensor.boopli_mood` (happy, content, sleepy, sad, hibernating), with the pet's name as an attribute. The `boopli_xp_gained` event fires when you earn XP or wake the pet.

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
- An optional AI task breakdown that uses your own Home Assistant AI agent.
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
| `boopli.add_task` | Creates a one-off task (optionally with steps) and starts it. It disappears when done. |
| `boopli.start_chore` | Starts a chore now, by name or id. |
| `boopli.complete_step` | Marks the step that is waiting for you in a chore as done. |
| `boopli.snooze_step` | Snoozes the step that is waiting for you in a chore. |
| `boopli.delete_chore` | Deletes a chore and anything in progress. |

Events fired on the Home Assistant bus: `boopli_chore_started`, `boopli_step_active`, `boopli_step_done`, `boopli_chore_done`, `boopli_nudge_sent`, `boopli_xp_gained`.

## License

[MIT](LICENSE)
