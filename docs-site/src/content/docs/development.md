---
title: Development
description: Build the panel, run the tests, actions and events.
---

The panel is a [Lit](https://lit.dev/) web component in `frontend/`. The built bundle in `custom_components/boopli/frontend/` is committed, so installing needs no Node.

```sh
cd frontend
npm install
npm run build
```

The chore and run logic lives in `custom_components/boopli/engine.py` and has no Home Assistant imports. Its tests run with plain pytest:

```sh
pip install pytest
pytest tests
```


## Texts and translations

The panel's texts are in `frontend/src/i18n/en.json` and are used with `t("key")`. Do not type a text directly into the code: `npm run i18n:check` (also part of `npm run build`) fails when it finds one. See [Translating Boopli](/Boopli/translating/).
