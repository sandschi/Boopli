"""Error messages that can be shown in the person's own language.

A message is an English text with `{name}` places. The panel gets the template and the
values, and shows its own translation of it (`errors.<code>` in its language file). The
English text is also what the logs and the Home Assistant services show.
"""

from __future__ import annotations

from typing import Any

from .engine import Msg, message_key

__all__ = ["BoopliError", "Msg", "message_key"]


class BoopliError(Exception):
    """A problem the caller can fix (bad input, unknown chore).

    BoopliError("No chore called {ref}.", ref=ref): str(err) is the English text, err.code is the
    key of the translation and err.params the values to put in.
    """

    template: str
    params: dict[str, Any]

    def __init__(self, message: Any = "", **params: Any) -> None:
        if isinstance(message, Exception) and message.args and hasattr(message.args[0], "template"):
            message = message.args[0]  # for example a BackupError that was raised with a Msg
        template = getattr(message, "template", None)
        if template is not None:  # another BoopliError or a Msg: keep its template and values
            params = {**getattr(message, "params", {}), **params}
        else:
            template = str(message)
        text = template.format(**params) if params else template
        super().__init__(text)
        self.template = template
        self.params = params

    @property
    def code(self) -> str:
        return message_key(self.template)

    def __str__(self) -> str:
        return self.args[0] if self.args else ""
