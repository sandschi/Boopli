---
title: Nudges
description: Lights, speakers, alarm devices and phones, and how they climb from a gentle cue to an alarm.
---

When a step becomes your turn, Boopli nudges you through the channels you turn on in the **Settings** tab:

### Lights

Per light you choose **Blink** or **Indicator lamp**. Blink: Boopli saves the light's current look, shows your color for as long as you set (in milliseconds), repeats 1 to 5 times with a pause you set, then puts the light back exactly as it was. Indicator lamp: the light stays on in a color until you are done. Boopli does not use a light's built-in flash, because some lights say they support it and ignore it. Press **Test** to see what a light really does. A light in your home can follow a few hundred milliseconds; a cloud-connected light needs about a second or more.

### Speakers

Add any media player. Each speaker has three levels you can switch on or off: a small **ding**, a **spoken sentence**, and an **alarm sound** that repeats for a time you set. A speaker plays the highest level that has been reached. Sounds: an Alexa sound by its id (for example `amzn_sfx_scifi_alarm_01`), or a file in your Home Assistant media folder (for example `boopli/ding.mp3`). Speech works through Alexa Media Player, an Alexa Devices notify entity, or a TTS voice on the speaker. Every level has a **Test** button.

### Alarm devices

A siren, switch or script that Boopli switches on for a time you set and then off again. It also goes off when you answer the nudge, and when Home Assistant restarts.

### Levels

Every channel has a "starts at nudge #" number: lights 1, phones 1, speaker ding 1, speech 2, alarm 4 by default. So a chore climbs from a light and a ding to speech and finally an alarm, as far as its style takes it.

### Phones

A notification from the Home Assistant app with **Done** and **Snooze** buttons, at a level you choose: normal, high priority, alarm volume, or max volume (not every phone honours it).

### Styles, per chore

quiet (panel only), one nudge, escalating (30, 15, 10, then every 5 minutes, then it stops), or persistent (every 5 minutes until done).

### Nudge it your way

Build ladders of your own in Settings. A ladder is a list of nudges (up to 12). For each nudge you choose how long Boopli waits for it, and exactly which phone (and how loud), light, speaker and alarm device acts. So you can leave the lights out of nudge 2, or send only the phone at first. A light can **blink** or be a **status light** that stays on until you answer, in the light's own color or one you pick for that nudge. A speaker plays one thing per nudge, picked from a list: a ding, any of the **extra sounds** you add to that speaker (as many as you like, each with a name), speech, **speech with chime** (an Alexa announcement, which starts with a chime) or the alarm. The guide asks whether you want to create, edit or delete a ladder.

### A color per chore

In the chore editor you can give a chore its own light color (pills red, laundry blue), so a status light means something. The chore's color wins, then a color picked for a nudge of a ladder, then the light's own. A light only shows a color picker when it can show colors; every light can blink, because Boopli blinks the light itself. After the last nudge the ladder stops or repeats the last one. A chore picks a ladder like any other style, and you can make a ladder the style for new chores. A ladder replaces the "starts at nudge #" numbers for the chores that use it, and a ladder that chores use cannot be deleted.

### Quiet hours

off by default, with different start and stop times for each weekday. A chore can opt out (for example pills).

### Presence (optional)

At home, every channel you turned on is used. Away, only your phone is used, and only for chores marked "anywhere". Without a presence source, Boopli assumes you are home.

### Snooze

delays the next nudge (15 minutes by default). The step stays open. There is no dismiss.

