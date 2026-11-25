---
title: Troubleshooting
description: What to check when something does not work.
---

## Nothing nudges me

- Check **Quiet hours** in Settings. Every weekday has its own times.
- Check **Away mode**. While it is on, only chores set to keep going can nudge you.
- Select **Test** next to the light, speaker, alarm device or phone in Settings. A test that works shows the channel is fine, and the problem is in the nudge style or nudge sequence.
- A chore with the style **No nudges** only shows in Boopli.
- If you set up your phone, check that the Home Assistant app on it allows notifications.

## A light does something strange

Boopli does not use a light's built-in flash, because some lights say they support it and ignore it. It blinks the light itself and then puts it back exactly as it was. Cloud-connected lights need about a second or more between changes, so use a longer blink length for them.

## The AI agent gives no answer or a strange one

- Open **Advanced** on the **AI help** card and select **Test the AI agent**. Boopli shows the agent's own reason when it fails: an empty account, a model that is gone, a timeout.
- Waiting for the agent takes at most 3 minutes. **Stop waiting** keeps everything you typed.
- For photos you need an agent that can read images. In the **AI help** card’s **Advanced** window, open **Advanced: AI agent for photos and prompts** to select a different **AI agent for photos**.
- Free models sometimes answer in a strange shape. Boopli rescues broken steps where it can, and **Try again** asks once more.

## Ask Claude does not work

| Boopli says | What to do |
|---|---|
| Claude refused the token. Make a new token for the routine, paste it in Boopli and try again. | Make the new token on claude.ai. |
| Claude couldn’t find the routine. Check the routine trigger URL. | Check that the URL ends in `/fire`. |
| Claude has limited requests for now. Try again in a little while. | Wait before sending another request. |
| Claude did not accept the request. Check that the routine is switched on. | Open the routine on claude.ai to check. |
| Claude is having trouble right now. Try again in a few minutes. | Wait before sending another request. |
| Boopli could not reach Claude. Check the internet connection. | Check the internet connection of Home Assistant. |
| Boopli stopped waiting for Claude’s reply. Wait limit (minutes): 2. Try again. | Check whether the routine can reach Home Assistant. See below. |
| Home Assistant has no web address that Claude can reach. Fill in the Home Assistant address under Ask Claude, or set the external URL in Home Assistant. | Set the external URL in Home Assistant, or use **Advanced: Home Assistant's web address** in Ask Claude. |
| Boopli reached its Claude limit of 20 requests per hour. Time until you can retry (minutes): about 5. | Wait for the number of minutes shown. |

**The routine runs but no answer arrives.** The routine's environment must allow your Home Assistant address (network access **Limited**, with that host allowed). The address must work from the internet, not only at home. Open the run on claude.ai to see what the routine did.

**The test works but photos fail.** The routine fetches photos from a link on your Home Assistant address, so that address must also be allowed in the environment.

## My settings did not save

Changes in Settings are drafts until you select **Save**. A bar at the bottom lists the cards with unsaved changes. Leaving the page with unsaved edits offers **Save**, **Discard** and **Stay**.

## Something else

Look at **Settings, System, Logs** in Home Assistant and search for `boopli`. If it is a bug, open an issue at [github.com/sandschi/Boopli/issues](https://github.com/sandschi/Boopli/issues) and say which version of Boopli and Home Assistant you use, and what the log says.
