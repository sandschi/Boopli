---
title: AI help
description: Break a task into tiny steps with your own Home Assistant AI agent.
---

If you want a second opinion, or have no agent, see also [Ask Claude](/Boopli/ask-claude/).

Boopli can split a big task, such as "clean my room", into very small steps with **your own Home Assistant AI agent** (the `ai_task` integration: Google, OpenRouter, a local model such as Ollama, and so on). It is **off until you switch it on** in Settings (the 🤖 AI help card, or its step-by-step wizard), where you also choose the agent and press **Test the agent**.

### Two ways in

On Today, write what you want to get done and press **Break it down now** (a one-off task that disappears when done), or **Break down a recurring chore** (it ends in the schedule wizard). The Chores tab has **New chore with AI**, and inside the chore editor **Suggest steps with AI** fills a chore's steps.

### The AI asks first

A clear task such as "take out the trash" goes straight to steps. For anything with several parts, the AI asks what it needs to know: what is in the room, how it looks, how much energy you have. Every question has buttons (several can be picked for lists) and a box for your own words, and there is always an **Anything else?** box and **Enough, go on**. There is no limit on rounds, and a recurring chore is asked about in more depth, because it is set up once and reused.

### Tiny, ordered steps

Each step is one concrete action, the first one is the easiest possible start, steps are grouped by area (Table, Chairs, Floor...), and the AI can say that something needs waiting time. A chore can have up to 50 steps. Nothing is created until you have checked and changed the steps and pressed a button.

### Step sizes and XP

Every step is small, medium or big (S, M, B), worth 10, 15 or 20 XP (steps you write yourself are small). Today shows the group, "Step 3 of 8" with a progress bar, and a celebration when a task is finished.

### Kept for next time

What the AI learned about a recurring chore is saved with the chore (editable), and the AI uses it when you press **Suggest steps** again.

### Waiting for the AI is never a guess

While the agent works, Boopli shows an animation, the time so far, the longest it will wait (3 minutes) and a bar for the time used, with a calm sentence that says it is slow but not stuck. **Stop waiting** goes back and keeps everything you typed; a late answer is ignored.

### Talk it out in your own AI chat

**In my own chat** (per room) and **Talk through my whole home** give you a ready-made prompt to copy into any chat, for example one you can talk to by voice. When you say you are done, the chat answers with plain notes. Paste them back: Boopli strips bullets, markdown and code fences, splits a whole-home answer into rooms by their `## Room` headings, and shows everything for a last look before you save. Boopli sends nothing here, so it works with AI help switched off.

### Service

`boopli.break_down` (`task`, optional `kind`, `answers`, `notes`, `rooms`) returns the steps, for your own automations and voice assistants. Without `rooms`, the rooms are guessed from the task, like in the panel. See also [Services, events and sensors](/Boopli/automations/).

### The prompts are yours

Under **Advanced** on the AI help card you can read, change and reset the two prompts Boopli sends (questions and steps) and the two texts you copy into your own AI chat (one room, whole home). The built-in ones ask for one JSON object, which works with any model.

## Privacy

Boopli sends nothing by itself. When you use AI help, the text of the task, your answers, the notes saved for that chore and the notes of the rooms the task is about go to the agent you chose, and nothing else: no device names, history or location. A cloud agent receives that text, and free models may keep or learn from what they get, so do not type private details. A local agent keeps everything at home. Photos of a room are sent only when you pick them for that one request and are never stored. If the agent fails (empty account, model gone, timeout), Boopli shows the agent's own reason.

