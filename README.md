# Boopli

An ADHD-friendly chore and task companion for [Home Assistant](https://www.home-assistant.io/).

> **Status: early development (v0.0.4).** You can create chores made of steps (with waiting time between steps), see what is due on a Today screen, mark steps done, and get nudged through lights and your phone with Done and Snooze buttons. There is no XP, pet, speaker or alarm channel, or setup wizard yet, so it is not ready for daily use.

## Nudges

When a step becomes your turn, Boopli nudges you through the channels you turn on in the **Settings** tab:

- **Lights.** Per light you choose **Blink** or **Indicator lamp**. Blink: Boopli saves the light's current look, shows your color for as long as you set (in milliseconds), repeats 1 to 5 times with a pause you set, then puts the light back exactly as it was. Indicator lamp: the light stays on in a color until you are done. Boopli does not use a light's built-in flash, because some lights say they support it and ignore it. Press **Test** to see what a light really does. A light in your home can follow a few hundred milliseconds; a cloud-connected light needs about a second or more.
- **Phones.** A notification from the Home Assistant app with **Done** and **Snooze** buttons, at a level you choose: normal, high priority, alarm volume, or max volume (not every phone honours it).
- **Styles, per chore:** quiet (panel only), one nudge, escalating (30, 15, 10, then every 5 minutes, then it stops), or persistent (every 5 minutes until done).
- **Quiet hours,** off by default, with different start and stop times for each weekday. A chore can opt out (for example pills).
- **Presence (optional).** At home, every channel you turned on is used. Away, only your phone is used, and only for chores marked "anywhere". Without a presence source, Boopli assumes you are home.
- **Snooze** delays the next nudge (15 minutes by default). The step stays open. There is no dismiss.

Boopli turns chores into small steps, nudges you with the lights, speakers and phone you already have, and rewards progress with a pet. Everything runs inside your own Home Assistant: no account, no cloud, no server, and nothing leaves your home.

## Planned

- Chores built from short steps, including waiting time between steps (for example a dishwasher: load, start, open to dry, empty hours later).
- A nudge engine that only nudges for what is really undone, and checks the real world (sensors, NFC tags, buttons) where you have them.
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

Events fired on the Home Assistant bus: `boopli_chore_started`, `boopli_step_active`, `boopli_step_done`, `boopli_chore_done`, `boopli_nudge_sent`.

## License

[MIT](LICENSE)
