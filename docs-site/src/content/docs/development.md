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

## Adding shop items

A shop item is data: one row in `SHOP_ITEMS` in `engine.py` (price, kind, level or achievement it needs), its picture and where it goes in `frontend/src/shop-art.ts`, and its name in the language files (`shop.item_<id>`). Nothing else is touched.

| What | The picture and where it goes |
|---|---|
| A wall or floor colour or pattern | one entry in `ROOM_PAINT` |
| Something that stands in the room | one row in `ROOM_ITEMS`: its picture and a spot (`SPOTS`) |
| Something that sits on another item (a gem on a bowl) | a row in `ROOM_ITEMS` with `attach` and the item it sits on |
| Something for one kind of pet only | `species` on its row |
| A pet's fur colour or a scarf | one entry in `PET_FUR` or `PET_NECK` |

To look at every item at a glance, run the check page. It is for development only and is not part of the panel:

```sh
cd frontend
npm run check
```

It opens http://localhost:5173/dev/items.html with each room item, every colour and pattern, and every pet with its fur and scarf.

## Texts and translations

The panel's texts are in `frontend/src/i18n/en.json` and are used with `t("key")`. Do not type a text directly into the code: `npm run i18n:check` (also part of `npm run build`) fails when it finds one. See [Translating Boopli](/Boopli/translating/).
