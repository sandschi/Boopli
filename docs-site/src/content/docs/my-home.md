---
title: My home and photos
description: Room notes, describing a room from photos, and photos of how it looks now.
---

![The My home tab with a notes box for each room](/Boopli/img/my-home.jpg)

### My home

The **My home** tab lists your rooms (filled in from your Home Assistant areas, plus any you add by hand) with notes about each one: where the dishwasher is, which door sticks. Press **Let the AI ask me** and it asks a few short questions, then proposes notes that you check and change before anything is saved. When you break a task down, Boopli guesses the room from the words in the task (a task about the whole flat means every room), shows it as chips you can change, and adds only those rooms' notes to the request. **What will the AI see?** shows the exact text. A switch turns room notes off completely. The notes live only in Boopli's storage.

### Describe a room from photos

On a room card, **From photos** takes up to 4 photos (camera or gallery). The panel shrinks them, they go once to your AI agent (one that can read images; you can pick a different agent for photos under Advanced), and the agent writes notes that you check first. Boopli keeps no photo: Home Assistant hands attachments to an agent as files, so each photo is written to a temporary file in the media folder (`boopli_tmp`), which is deleted right after the answer, also when the agent fails, and anything left behind by a crash is cleared when Boopli starts. Later requests carry only the text notes.

### Photos of how it looks now

When you break a task down, **Add photos of how it looks now** (optional, up to 4) sends them once to your AI agent, which writes down what is out of place, per thing ("Coffee table: bottles and papers", "Bin: full"). You see that text and can change it; the photos are deleted at once and only the text goes along with the next questions and the steps, so the steps name the real items and skip what already looks fine. The text is not saved afterwards, because it is only true today. Your room notes still say what is in the room and where things belong.



### Rooms from Home Assistant, and your own

Boopli fills the list with your Home Assistant **areas**. Add a place that is not an area (a balcony, a cellar) with **Add a room or place**. An area room has **Hide**, which removes it from the list and keeps it gone. **Show again** brings it back. A room you added by hand has **Delete** instead.
