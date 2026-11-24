---
title: Troubleshooting
description: What to check when something does not work.
---

## Nothing nudges me

- Check **Quiet hours** in Settings. Every weekday has its own times.
- Check **Away mode**. While it is on, nothing nudges you.
- Press **Test** next to the light, speaker, alarm device or phone in Settings. A test that works shows the channel is fine, and the problem is in the nudge style or ladder.
- A chore with the style **Quiet** only shows in Boopli.
- If you set up your phone, check that the Home Assistant app on it allows notifications.

## A light does something strange

Boopli does not use a light's built-in flash, because some lights say they support it and ignore it. It blinks the light itself and then puts it back exactly as it was. Cloud-connected lights need about a second or more between changes, so use a longer blink length for them.

## The AI agent gives no answer or a strange one

- Press **Test the agent** on the AI help card. Boopli shows the agent's own reason when it fails: an empty account, a model that is gone, a timeout.
- Waiting for the agent takes at most 3 minutes. **Stop waiting** keeps everything you typed.
- For photos you need an agent that can read images. Under **Advanced** on the AI help card you can choose a different agent for photos.
- Free models sometimes answer in a strange shape. Boopli rescues broken steps where it can, and **Try again** asks once more.

## Ask Claude does not work

| Boopli says | What to do |
|---|---|
| Claude refused the token. | Make a new token for the routine on claude.ai, paste it in Boopli and try again. |
| Claude does not know that routine. | Check the fire address. It must end in `/fire`. |
| Claude says you asked too often. | Wait a while. Claude allows 30 runs per hour for one routine. |
| Claude did not accept the request. | Check that the routine is switched on. |
| Claude is having trouble right now. | Try again in a few minutes. |
| Boopli could not reach Claude. | Check the internet connection of Home Assistant. |
| Claude did not send an answer within 2 minutes. | Usually the routine could not reach Home Assistant. See below. |
| Home Assistant has no web address that Claude can reach. | Set the external URL in Home Assistant, or fill in the address under **Advanced** in Ask Claude. |
| You have used all your asks this hour. | Boopli stops at 20 asks per hour on purpose. Wait. |

**The routine runs but no answer arrives.** The routine's environment must allow your Home Assistant address (network access **Limited**, with that host allowed). The address must work from the internet, not only at home. Open the run on claude.ai to see what the routine did.

**The test works but photos fail.** The routine fetches photos from a link on your Home Assistant address, so that address must also be allowed in the environment.

## My settings did not save

Changes in Settings are drafts until you press **Save**. A bar at the bottom lists the cards with unsaved changes. Leaving the page with unsaved edits asks **Save / Discard / Stay**.

## Something else

Look at **Settings, System, Logs** in Home Assistant and search for `boopli`. If it is a bug, open an issue at [github.com/sandschi/Boopli/issues](https://github.com/sandschi/Boopli/issues) and say which version of Boopli and Home Assistant you use, and what the log says.
