---
title: Translating Boopli
description: How to add a language to the panel, and how to keep new texts translatable.
---

Every text the panel shows comes from one English file. A language is one more file with the same keys. Nothing else has to change: Boopli picks the file that matches the language of the person's Home Assistant, and falls back to English for any text that is missing.

## Add a language

1. Copy `frontend/src/i18n/en.json` to `frontend/src/i18n/<code>.json`, for example `de.json` for German or `pt-br.json` for Brazilian Portuguese.
2. Translate the values. Leave the keys alone.
3. Build the panel (`npm run build` in `frontend`) and open Boopli with `?lang=de` at the end of the address, for example `/boopli?lang=de`. This shows the language without changing Home Assistant's own language.
4. Run `npm run i18n:check`. It tells you about a `{place}` that you changed or left out.

You can translate in several rounds. A key that is missing in your file shows the English text, so a half-finished language still works.

## What a text can contain

- **Places like `{name}`.** They are filled in by the panel. Keep them as they are, and move them where your language needs them: `"Notes for {room}"` can become `"{room}: Notizen"`.
- **Words that depend on a number.** A text such as `steps_count` comes as several lines, `steps_count_one` and `steps_count_other`. Your language may need more forms (`_zero`, `_two`, `_few`, `_many`). The form is chosen with the plural rules of your language, so write only the forms your language has.
- **A little markup.** Some texts contain `<b>…</b>`, `<code>…</code>`, `<i>`, `<em>`, `<strong>` or `<br>`. Keep these tags around the same words. Any other tag is shown as plain text.
- **The `errors` group.** These are the messages Boopli's Home Assistant side sends when something is not allowed ("A chore needs a name."). Their English text is generated from the integration: do not edit it in `en.json`. If you change or add a message in Python, run `python scripts/sync_error_messages.py`.

## What is not translated

- The texts you type yourself (chore names, steps, notes, room names).
- The prompts that Boopli sends to your AI agent. They stay in English. When Home Assistant's language is not English, Boopli adds one line that asks the agent to write the questions, the answers to pick from, the step titles and the notes in that language.
- The names of your devices and entities.
- Error texts that come from the AI agent or from Home Assistant itself. Every error that Boopli writes is translated, including the reason inside it ("Step 'x': ...").
- The small texts of Home Assistant's own pages (the setup dialog, the service descriptions): these are in `custom_components/boopli/translations/en.json`. Add `de.json` next to it in the same way.

## Writing new texts

Never type a text for the panel directly into the code. Add it to `en.json` and write `t("some.key")`:

```ts
html`<button>${t("settings.save")}</button>`
t("today.step_of", { n: 3, total: 8 })      // "Step {n} of {total}"
t("common.steps_count", { count: steps })    // "{count} step" / "{count} steps"
rich("backup.importing_replaces")            // a text with <b> in it
```

`npm run i18n:check` finds texts that were typed directly into the code and keys that are missing, and it runs in the build. Texts that must stay as they are (a keyboard key, a name) go in `frontend/scripts/i18n-allow.txt`.

Two test languages are built in. **Fancy English** (pick it in Settings → Language, or open `?lang=fancy`) writes every text with accents, like `Šàvé`. `?lang=pseudo` does the same inside brackets, like `[Šàvé]`. Any English you still see in either did not go through `t()`.

## Choosing a language

Boopli follows the language of Home Assistant. In Settings → Language a person can pick another one for their own browser; `?lang=xx` in the address wins over both. The list shows every language file that exists, in its own name.
