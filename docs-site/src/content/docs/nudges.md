---
title: Nudges
description: Lights, speakers, alarm devices and phones, and how they climb from a gentle cue to an alarm.
---

When a step becomes your turn, Boopli nudges you through the channels you turn on in the **Settings** tab:

### Lights

Per light you choose **Blink** or **Indicator lamp (on until done)**. Blink: Boopli saves the light's current look, shows your color for as long as you set (in milliseconds), repeats 1 to 5 times with a pause you set, then puts the light back exactly as it was. If the light was off, Boopli turns it off again after the blink. If Boopli knows the light's last color, it restores it first. Indicator lamp: the light stays on in a color until you are done. Boopli does not use a light's built-in flash, because some lights say they support it and ignore it. Select **Test** to see what a light really does. A light in your home can follow a few hundred milliseconds; a cloud-connected light needs about a second or more.

### Speakers

Add any media player. Each speaker has three levels you can switch on or off: a small ding, a spoken sentence, and an alarm sound that repeats for a time you set. A speaker plays the highest level that has been reached. Choose an Alexa sound from the **Sound** list or use a file in your Home Assistant media folder (for example `boopli/ding.mp3`). Speech works through Alexa Media Player, an Alexa Devices notify entity, or a TTS voice on the speaker. Use **Test ding**, **Test talk** or **Test alarm** to try the sounds.

### Alarm devices

A siren, switch or script that Boopli switches on for a time you set and then off again. It also goes off when you answer the nudge, and when Home Assistant restarts.

### Levels

The channel settings have timing defaults for nudges. For example, **Start at nudge** under a speaker sets when its sound joins in. Use **Nudge sequences** to select the devices that act on each nudge.

### Phones

A notification from the Home Assistant app with **Done** and **Snooze** buttons, at a level you choose: **Normal notification**, **High-priority notification**, **Alarm volume** or **Maximum alarm volume (supported phones only)**.

### Styles, per chore

**No nudges** (panel only), **One nudge**, **Escalating** (30, 15, 10, then every 5 minutes before it stops), or **Persistent** (every 5 minutes until done).

### Nudge sequences

Open **Nudge sequences** in Settings to build your own. A nudge sequence is a list of nudges (up to 12). For each nudge you choose how long Boopli waits for it, and exactly which phone (and how loud), light, speaker and alarm device acts. So you can leave the lights out of nudge 2, or send only the phone at first. A light can use **Blink** or **Status light (stays on until you answer)**, in the light's own color or one you pick for that nudge. A speaker plays one thing per nudge, such as a ding, a saved sound from **Your own sounds**, speech, **Speaks with chime** (an Alexa announcement) or the alarm. The guide asks whether you want to create, edit or delete a nudge sequence.

### A color per chore

In the chore editor you can give a chore its own light color (pills red, laundry blue), so a status light means something. The chore's color wins, then a color set for that nudge, then the light's own. A light only shows a color picker when it can show colors; every light can blink, because Boopli blinks the light itself. A sequence can stop after the last nudge or repeat it. Select a sequence as a chore’s nudge style or as the default for new chores. It sets the timing for that chore’s nudges. To delete a sequence, first change the style of any chores that use it and change the default if it uses that sequence.

### Quiet hours

off by default, with different start and stop times for each weekday. A chore can opt out (for example pills).

### Presence (optional)

At home, every channel you turned on is used. Away, only your phone is used, and only for chores marked **Anywhere (for example pills)**. Without a presence source, Boopli assumes you are home.

### Snooze

delays the next nudge (15 minutes by default). The step stays open. There is no dismiss.


### Standard styles and your own sounds

The three built-in styles, **One nudge**, **Escalating** and **Persistent**, are nudge sequences like the ones you make yourself. You can change them, but not delete them. Your own sounds (files or Alexa sounds you give a name) are one shared list that every speaker can pick from.
