---
title: Development
description: Build the panel, run the tests, services and events.
---

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

## Services and events

| Service | What it does |
|---|---|
| `boopli.break_down` | Splits a task into small steps with your AI agent and returns them (needs AI help switched on). |
| `boopli.add_task` | Creates a one-off task (optionally with steps) and starts it. It disappears when done. |
| `boopli.start_chore` | Starts a chore now, by name or id. |
| `boopli.complete_step` | Marks the step that is waiting for you in a chore as done. |
| `boopli.snooze_step` | Snoozes the step that is waiting for you in a chore. |
| `boopli.delete_chore` | Deletes a chore and anything in progress. |

Events fired on the Home Assistant bus: `boopli_chore_started`, `boopli_step_active`, `boopli_step_done`, `boopli_chore_done`, `boopli_nudge_sent`, `boopli_step_on_it`, `boopli_xp_gained`.

