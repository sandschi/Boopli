# Boopli

An ADHD-friendly chore and task companion for [Home Assistant](https://www.home-assistant.io/).

> **Status: early development (v0.0.1).** Only a "hello" sidebar panel exists so far. Not ready for daily use yet.

Boopli turns chores into small steps, nudges you with the lights, speakers and phone you already have, and rewards progress with a pet. Everything runs inside your own Home Assistant: no account, no cloud, no server, and nothing leaves your home.

## Planned

- Chores built from short steps, including waiting time between steps (for example a dishwasher: load, start, open to dry, empty hours later).
- A nudge engine that only nudges for what is really undone, and checks the real world (sensors, NFC tags, buttons) where you have them.
- Done and Snooze buttons in Home Assistant's phone notifications. No dismiss button.
- Optional light, speaker and loud-alarm nudges, quiet hours, and presence conditions.
- An optional AI task breakdown that uses your own Home Assistant AI agent.
- Services and events so your own automations can build on Boopli.

## Your data

Boopli stores its data in Home Assistant's normal storage, so your regular Home Assistant backups include it.

## Development

The panel is a [Lit](https://lit.dev/) web component in `frontend/`. The built bundle in `custom_components/boopli/frontend/` is committed, so installing needs no Node.

```sh
cd frontend
npm install
npm run build
```

## License

[MIT](LICENSE)
