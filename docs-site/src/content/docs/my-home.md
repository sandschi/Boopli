---
title: My home and photos
description: Room notes, describing a room from photos, and photos of how it looks now.
---

![The My home tab with a notes box for each room](/Boopli/img/my-home.jpg)

### My home

The **My home** tab lists your rooms (filled in from your Home Assistant areas, plus any you add by hand) with notes about each one: where the dishwasher is, which door sticks. Select **Let the AI ask me** and it asks a few short questions, then proposes notes that you check and change before anything is saved. When you break a chore down, Boopli guesses the rooms from the chore text and shows you a selection you can change. If **Send room notes with my chores** is on, the AI service you choose receives the selected rooms’ notes. Select **What will the AI see?** to preview the text. When you ask the AI service to describe a room, it receives that room’s name and current notes.

### Describe a room from photos

On a room card, select **From photos** to take or choose up to 4 photos. Boopli sends the photos, room name and current notes to the AI service you choose. Review the notes it writes before saving. To use a different AI agent for photos, open the **AI help** card’s **Advanced** window. Under **Advanced: AI agent for photos and prompts**, select an **AI agent for photos** that can analyze them. A cloud provider may keep the data it receives. Boopli deletes its own temporary files in the media folder (`boopli_tmp`) after the request, even if it fails, and clears leftovers when it starts. Saved notes can be used in later requests.

### Photos of how it looks now

When you break a chore down, select **Add photos of how it looks now (optional)** to share up to 4 photos. The AI service you choose receives them with the chore and any selected room notes. It writes down what is out of place, for example “Coffee table: bottles and papers.” Boopli deletes its own temporary photo files after the request. A cloud provider may keep what it received. You can edit the description before Boopli sends it with the next questions or steps. Boopli leaves the description out of the saved chore.



### Rooms from Home Assistant, and your own

Boopli fills the list with your Home Assistant **areas**. Use **Add a room** for any other room, such as a balcony or cellar. An area room has **Hide**, which removes it from the list and keeps it gone. **Show again** brings it back. A room you added by hand has **Delete** instead.
