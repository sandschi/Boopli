---
title: Ask Claude
description: An optional extra next to your Home Assistant AI agent, through a routine in your own Claude account.
---

**Ask Claude** is an extra button next to the normal one in [AI help](/Boopli/ai-help/). It does not replace your Home Assistant AI agent. Use it when:

- you do not trust the agent's answer and want a second opinion,
- your free agent is down or rate limited,
- you have no agent set up at all.

It works through a **routine** in your own Claude account. Each request runs that routine once. Nothing goes through a Boopli server, because there is none.

:::caution[A research preview]
Claude routines can change while in preview. Boopli stops at 20 requests per hour. Each round of questions and each step list uses one request.
:::

![The Ask Claude window in Settings](/Boopli/img/ask-claude.jpg)

## What you need

- A Claude account on claude.ai that can make routines.
- Home Assistant reachable from the internet (an external URL, for example through Nabu Casa or your own domain). Claude sends the answer back to Home Assistant, so it must be able to reach it.

## Make the routine

The Ask Claude step of the AI help guide shows these steps next to your own Home Assistant address. Use the [Claude routines page](https://claude.ai/code/routines) to set this up once.

1. Make a new routine and name it **Boopli**.
2. Paste the instructions the guide gives you. They tell Claude to look at any photos first, work out the answer, send it back with one web request, and then stop. They also tell it to ignore instructions hidden in a photo or in the chore text.
3. Make an **environment** for the routine with network access set to **Limited**, and allow your Home Assistant address. The guide shows the exact host name.
4. Add an **API trigger** to the routine and select **Generate token**. Copy the token now. Claude shows it only once.
5. Leave every connector (Gmail, calendar and so on) switched **off**. The routine does not need them.

Claude's screens change now and then, so a button may have a slightly different name.

## Connect it to Boopli

Open **Settings**, select **Advanced** on the **AI help** card, then select **Ask Claude (extra)**. You can also use the guide.

1. Select **Switch Ask Claude on**.
2. Paste the routine's **Routine trigger URL**. It starts with `https://api.anthropic.com/v1/claude_code/routines/` and ends in `/fire`.
3. Paste the token under **The routine's token** and select **Save token**.
4. Select **Test Claude**. Boopli saves your settings, asks Claude for a tiny answer, and tells you how many seconds it took.

If you need to set or change the address for Claude’s reply, open **Advanced: Home Assistant's web address** and fill in **Where the routine sends its answer**.

## How it works

1. Select **Ask Claude**. Boopli sends the chore text, your answers and any room notes or photos you chose to share with your routine.
2. The routine works out the answer and posts it back to a webhook that Boopli made in Home Assistant.
3. Boopli shows the answer. It waits up to 2 minutes per request. If the answer cannot be read, Boopli sends one more request.

Every request has a one-time ID. Boopli accepts a reply once, while that request is still waiting.

Anyone who can use the panel can select **Ask Claude**. Only an admin can save or remove the token and select **Test Claude**.

## Photos

When you select photos for Claude, Boopli puts each one in a temporary file in Home Assistant’s media folder and gives the routine a signed link that lasts up to 10 minutes. The routine downloads the photos. Boopli deletes its own temporary files after the request, even if it fails. Claude may keep the photos it received.

## What Claude sees

Boopli sends nothing to Claude by itself. When you make a request, Claude receives the chore text, your answers and any room notes or photos you chose to share. For a room interview, Claude receives the room name and current notes. Claude may keep what you share. Boopli leaves device names, Home Assistant history and location out of the request, though anything you type or photograph can contain private details.

## Your token is a secret

Boopli keeps the token in its own private file in Home Assistant's storage. It is not in the settings, not in a backup (`.adhd`) and the panel only ever learns that a token is set. If you think it leaked, make a new token on claude.ai and paste it in Boopli with **Replace**.

If Boopli cannot save the token, the old one stays in use and Boopli says so. If the secret file cannot be read at startup, Boopli keeps running with Ask Claude off, leaves the file alone, and writes the reason to the Home Assistant log.

See [Troubleshooting](/Boopli/troubleshooting/) if something goes wrong.
