# Boopli

An ADHD-friendly chore and task companion for [Home Assistant](https://www.home-assistant.io/).

> **Status: early development (v0.0.2).** You can create chores made of steps (with waiting time between steps), see what is due on a Today screen, and mark steps done. There are no nudges, XP or pet yet, so it is not ready for daily use.

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
| `boopli.delete_chore` | Deletes a chore and anything in progress. |

Events fired on the Home Assistant bus: `boopli_chore_started`, `boopli_step_active`, `boopli_step_done`, `boopli_chore_done`.

## License

[MIT](LICENSE)
