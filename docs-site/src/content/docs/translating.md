---
title: Translating Boopli
description: How to add a language to the panel, and how to keep new texts translatable.
---

The panel’s source texts are in `frontend/src/i18n/en.json`. Each additional language has a file with the same keys. Boopli loads these files automatically and falls back to English for missing text.

- English (`en.json`)
- German (`de.json`)
- Dutch (`nl.json`)
- French (`fr.json`)
- Spanish (`es.json`)

## Add a language

1. Copy `frontend/src/i18n/en.json` to `frontend/src/i18n/<code>.json`, for example `pt-br.json` for Brazilian Portuguese. German, Dutch, French and Spanish are already there as examples.
2. Translate the values. Leave the keys alone.
3. Build the panel (`npm run build` in `frontend`) and open Boopli with your language code in the address, for example `/boopli?lang=pt-br`. This shows the language without changing Home Assistant's own language.
4. Run `npm run i18n:check`. It tells you about a `{place}` that you changed or left out.

You can translate in several rounds. A key that is missing in your file shows the English text, so a half-finished language still works.

## What a text can contain

- **Places like `{name}`.** They are filled in by the panel. Keep them as they are, and move them where your language needs them: `"Notes for {name}"` can become `"{name}: Notizen"`.
- **Words that depend on a number.** A text such as `steps_count` comes as several lines, `steps_count_one` and `steps_count_other`. Your language may need more forms (`_zero`, `_two`, `_few`, `_many`). The panel uses your language’s plural rules, then falls back to `_other` when a form is missing. Write only the forms that need different wording. `_one` and `_other` are enough for the five languages above.
- **Places that hold a link, like `{library}`.** Keep these outside of any tag: write `see the {library}`, not `see the <b>{library}</b>`. The link is put in as it is.
- **A little markup.** Some texts contain `<b>…</b>`, `<code>…</code>`, `<i>`, `<em>`, `<strong>` or `<br>`. Keep these tags around the same words. Any other tag is shown as plain text.
- **The `errors` group.** These are the messages Boopli's Home Assistant side sends when something is not allowed ("A chore needs a name."). Their English text is generated from the integration: do not edit it in `en.json`. If you change or add a message in Python, run `python scripts/sync_error_messages.py`.

## What is not translated

- The texts you type yourself (chore names, steps, notes, room names).
- The prompts that Boopli sends to your AI agent. They stay in English. When Home Assistant's language is not English, Boopli adds one line that asks the agent to write the questions, the answers to pick from, the step titles and the notes in that language.
- The names of your devices and entities.
- Error texts that come from the AI agent or from Home Assistant itself. Every error that Boopli writes is translated, including the reason inside it ("Step 'x': ...").
## Home Assistant integration texts

The setup dialog and action descriptions are translated into the same five languages in `custom_components/boopli/translations/<code>.json`. For a new language, copy `en.json` from that folder to `<code>.json` and translate the values there too.

## Writing new texts

Never type a text for the panel directly into the code. Add it to `en.json` and write `t("some.key")`:

```ts
html`<button>${t("common.save")}</button>`
t("today.step_of", { value: 3, total: 8 })      // "Step {value} of {total}"
t("common.steps_count", { count: steps })    // "{count} step" / "{count} steps"
rich("backup.importing_replaces")            // a text with <b> in it
```

`npm run i18n:check` finds texts that were typed directly into the code and keys that are missing, and it runs in the build. Texts that must stay as they are (a keyboard key, a name) go in `frontend/scripts/i18n-allow.txt`.

Two test languages are built in. **Fancy English** (pick it in Settings → Language, or open `?lang=fancy`) writes every text with accents, like `Šàvé`. `?lang=pseudo` does the same inside brackets, like `[Šàvé]`. Any English you still see in either did not go through `t()`.

## Choosing a language

The panel follows Home Assistant’s language. Select another language for this browser in **Settings → Language**. The `?lang=xx` option in the address takes priority. The list shows every language file that exists, in its own name.
