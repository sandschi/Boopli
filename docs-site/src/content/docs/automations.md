---
title: Services, events and sensors
description: Build your own automations on top of Boopli.
---

Boopli gives your own automations, scripts and voice assistants three things to work with: services you can call, events you can listen to, and sensors for your pet.

## Services

| Service | What it does |
|---|---|
| `boopli.break_down` | Splits a task into small steps with your AI agent and returns them (needs AI help switched on). Fields: `task`, and optionally `kind` (`now` or `recurring`), `answers`, `notes` and `rooms`. Without `rooms`, the rooms are guessed from the task, like in the panel. |
| `boopli.add_task` | Creates a one-off task (optionally with steps) and starts it. It disappears when done. |
| `boopli.start_chore` | Starts a chore now, by name or id. |
| `boopli.complete_step` | Marks the step that is waiting for you in a chore as done. |
| `boopli.snooze_step` | Snoozes the step that is waiting for you in a chore. |
| `boopli.step_on_it` | Tells Boopli you are working on the waiting step of a chore ("On it"). |
| `boopli.step_not_on_it` | Takes "On it" back. |
| `boopli.delete_chore` | Deletes a chore and anything in progress. |
| `boopli.set_away` | Turns [Away mode](/Boopli/away-mode/) on. Optional `start` and `until`, for example `2026-11-28 08:00`. |
| `boopli.end_away` | Turns Away mode off. |

Services that take a chore (`chore`) accept its name or its id. If two chores have the same name, use the id.

## Events

These fire on the Home Assistant event bus, so an automation can trigger on them.

| Event | When |
|---|---|
| `boopli_chore_started` | A chore started. |
| `boopli_questions_answered` | You answered the questions of a chore before it started. |
| `boopli_step_active` | A step became your turn. |
| `boopli_step_on_it` | You pressed **On it** on a step. |
| `boopli_step_done` | A step is done. `by` says `manual` or `auto`, and `reason` says what happened. |
| `boopli_chore_done` | All steps of a chore are done. |
| `boopli_nudge_sent` | Boopli nudged you. |
| `boopli_xp_gained` | You earned XP. |
| `boopli_away_started` | Away mode started. |
| `boopli_away_ended` | Away mode ended. |

## Sensors

Boopli adds a device called **Boopli** with three sensors for your pet:

- **XP**: the XP your pet has, in total.
- **Level**: the pet's level.
- **Mood**: happy, content, sleepy, sad or hibernating.

You can show them on a dashboard or use them in automations, for example to turn a light green when the pet is happy.
