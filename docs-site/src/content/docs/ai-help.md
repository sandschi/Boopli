---
title: AI help
description: Break a chore into tiny steps with your own Home Assistant AI agent.
---

If you want a second opinion, or have no agent, see also [Ask Claude](/Boopli/ask-claude/).

Boopli can split a big chore, such as "clean my room", into very small steps with **your own Home Assistant AI agent** through Home Assistant’s AI Task integration. AI help is off by default. In Settings, open **AI help**, then select **Advanced** and **Switch AI help on**. Select your AI agent and save. Reopen the card’s **Advanced** window and select **Test the AI agent**. You can also follow **Guide me**.

![The AI help window in Settings](/Boopli/img/ai-help.jpg)

### Two ways in

On Today, write what you want to get done and select **Break it down now** (a one-off chore that disappears when done), or **Break down a recurring chore** (it ends in the schedule wizard). The Chores tab has **New chore with AI**, and inside the chore editor **Suggest steps with AI** fills a chore's steps.

### The AI asks first

A clear chore such as "take out the trash" goes straight to steps. For anything with several parts, the AI asks what it needs to know: what is in the room, how it looks, how much energy you have. Every question has buttons (you can select more than one for lists) and a box for your own words, and there is always an **Anything else I should know?** box and a **Suggest steps now** button. The AI agent asks more about a recurring chore, because it is set up once and reused.

### Tiny, ordered steps

Each step is one concrete action, the first one is the easiest possible start, steps are grouped by area (Table, Chairs, Floor...), and the AI can say that something needs waiting time. A chore can have up to 50 steps. Nothing is created until you have checked and changed the steps and chosen to use them.

### Step sizes and XP

Every step is small, medium or big (S, M, B), worth 10, 15 or 20 XP (steps you write yourself are small). Today shows the group, "Step 3 of 8" with a progress bar, and a celebration when a chore is finished.

### Kept for next time

What the AI learned about a recurring chore is saved with the chore (editable), and the AI uses it when you select **Suggest steps with AI** again.

### Waiting for the AI is never a guess

While the agent works, Boopli shows an animation, the time so far, the longest it will wait (3 minutes) and a bar for the time used, with a calm sentence that says it is slow but not stuck. **Stop waiting** goes back and keeps everything you typed; a late answer is ignored.

### Talk it out in your own AI chat

**In my own chat** (per room) and **Talk through my whole home in my own chat** give you a ready-made prompt to copy into any chat, for example one you can talk to by voice. When you say you are done, the chat answers with plain notes. Paste them back: Boopli strips bullets, markdown and code fences, splits a whole-home answer into rooms by their `## Room` headings, and shows everything for a last look before you save. You choose what to send when you paste into your own chat. This works with AI help switched off.

### Service

`boopli.break_down` (`task`, optional `kind`, `answers`, `notes`, `rooms`) returns the steps, for your own automations and voice assistants. Without `rooms`, the rooms are guessed from the chore, like in the panel. See also [Services, events and sensors](/Boopli/automations/).

### The prompts are yours

In the AI help card’s **Advanced** window, open **Advanced: AI agent for photos and prompts**. You can read, change and reset the two prompts Boopli sends (questions and steps) and the two texts you copy into your own AI chat (one room, whole home). The built-in AI help prompts ask for one JSON object. They stay in English, and Boopli asks the AI agent to reply in Home Assistant’s language.

## Privacy

Boopli sends nothing to an AI service by itself. When you use AI help, Boopli sends the chore text and your answers to the AI agent you chose. Notes saved with a recurring chore can be used again. You can also share selected room notes or photos. If the AI agent runs in the cloud, that provider receives what you share and may keep it. Boopli deletes its own temporary photo files after the request. It leaves device names, Home Assistant history and location out of the request, though anything you type or photograph can contain private details. If the AI agent fails, Boopli shows the reason it gets back.

