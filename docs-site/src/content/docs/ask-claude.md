---
title: Ask Claude
description: An optional extra next to your Home Assistant AI agent, through a routine in your own Claude account.
---

**Ask Claude** is an extra button next to the normal one in [AI help](/Boopli/ai-help/). It does not replace your Home Assistant AI agent. Use it when:

- you do not trust the agent's answer and want a second opinion,
- your free agent is down or rate limited,
- you have no agent set up at all.

It works through a **routine** in your own Claude account. Every ask runs that routine once. Nothing goes through a Boopli server, because there is none.

:::caution[A research preview]
Claude calls routines a research preview. They can change or stop working, and Boopli cannot promise otherwise. Claude allows 30 runs per hour for one routine. Boopli counts the asks itself and stops at 20 per hour, so you never hit Claude's limit by accident.
:::

![The Ask Claude window in Settings](/Boopli/img/ask-claude.jpg)

## What you need

- A Claude account on claude.ai that can make routines.
- Home Assistant reachable from the internet (an external URL, for example through Nabu Casa or your own domain). Claude sends the answer back to Home Assistant, so it must be able to reach it.

## Make the routine

The Ask Claude step of the AI help guide shows these steps next to your own Home Assistant address. In short, do this once on claude.ai, under Routines:

1. Make a new routine and name it **Boopli**.
2. Paste the instructions the guide gives you. They tell Claude to look at any pictures first, work out the answer, send it back with one web request, and then stop. They also tell it to ignore instructions hidden in a picture or in the task text.
3. Make an **environment** for the routine with network access set to **Limited**, and allow your Home Assistant address. The guide shows the exact host name.
4. Add an **API trigger** to the routine and press **Generate token**. Copy the token now. Claude shows it only once.
5. Leave every connector (Gmail, calendar and so on) switched **off**. The routine does not need them.

Claude's screens change now and then, so a button may have a slightly different name.

## Connect it to Boopli

Open **Settings**, then the **AI help** card, then **Ask Claude (extra)**, or use the guide.

1. Switch Ask Claude on.
2. Paste the routine's **fire address**. It starts with `https://api.anthropic.com/v1/claude_code/routines/` and ends in `/fire`.
3. Paste the routine's **token** and press **Save token**.
4. Press **Test Claude**. Boopli saves your settings, asks Claude for a tiny answer, and tells you how many seconds it took.

If Home Assistant has no external URL, or it is not the address the routine should answer to, open **Advanced: Home Assistant's web address** and type it there.

## How it works

1. You press **Ask Claude**. Boopli sends the task text, your answers and, if you chose any, the photos to your routine.
2. The routine works out the answer and posts it back to a webhook that Boopli made in Home Assistant.
3. Boopli shows the answer. It waits at most 2 minutes. If the answer cannot be read, Boopli asks once more, which uses another run.

Every ask carries its own one-time request number, so an answer is accepted once and only for an ask that is waiting.

Anyone can press Ask Claude. Only an admin can save or remove the token and press **Test Claude**.

## Photos

When you pick photos for Claude (a room, or how it looks now), Boopli puts each one in a temporary file in Home Assistant's media folder and gives the routine a **signed link** that works for 10 minutes. The routine downloads the photos, and Boopli deletes the files right after the answer, also when something fails.

## What Claude sees

The same as the Home Assistant agent: the task text, your answers, the notes of the rooms a task is about if you use room notes, and the photos you chose. Never device names, history or location.

## Your token is a secret

Boopli keeps the token in its own private file in Home Assistant's storage. It is not in the settings, not in a backup (`.adhd`) and the panel only ever learns that a token is set. If you think it leaked, make a new token on claude.ai and paste it in Boopli with **Replace**.

If Boopli cannot save the token, the old one stays in use and Boopli says so. If the secret file cannot be read at startup, Boopli keeps running with Ask Claude off, leaves the file alone, and writes the reason to the Home Assistant log.

See [Troubleshooting](/Boopli/troubleshooting/) if something goes wrong.
