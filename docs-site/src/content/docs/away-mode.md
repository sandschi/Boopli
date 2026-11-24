---
title: Away mode
description: Make Boopli rest while you are away.
---

The **Away mode** card at the top of Settings (or the `boopli.set_away` service) makes Boopli rest: from now or from a date, until a date or until you turn it off (**Back now**). While it is on, Today shows a big amber **AWAY MODE IS ON** banner and the other tabs a thin one, so you cannot forget it. Also while it is on, scheduled chores do not start, nothing nudges you, and the pet's mood stays as it was. Chores already in progress freeze and carry on when you are back, nudging one after the other (2 minutes apart). Recurring chores that came due while you were away start over from today, with no catch-up. Set-aside parts and one-off tasks start when you are back. A chore with **Keeps going while I'm away** (the Pills template has it on, and the form lists every chore to tick) runs as usual. Steps that finish by themselves still finish. Automations get `boopli_away_started` and `boopli_away_ended`.
