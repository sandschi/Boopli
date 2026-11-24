"""Ask Claude: the optional extra that sends a question to the user's own Claude routine.

Boopli fires the routine (a web call with the user's token), the routine thinks, and it
POSTs its answer back to a Home Assistant webhook together with a one-time request id.
This module holds the parts that do not need Home Assistant: the fire call, the hourly
fire counter, the waiting list of requests and the plain error messages.
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlparse

import aiohttp

_LOGGER = logging.getLogger(__name__)

# The routine API is a research preview: the beta header is part of the contract.
FIRE_URL_PREFIX = "https://api.anthropic.com/v1/claude_code/routines/"
FIRE_URL_SUFFIX = "/fire"
BETA_HEADER = "experimental-cc-routine-2026-04-01"
API_VERSION = "2023-06-01"

WAIT_SECONDS = 120  # the longest Boopli waits for the routine's answer
FIRE_TIMEOUT = 20  # the longest the fire call itself may take
MAX_FIRES_PER_HOUR = 20  # Claude allows 30 per routine; Boopli stops earlier
MAX_ANSWER_BYTES = 200_000
MAX_TEXT = 60_000  # what goes into one fire
TOKEN_MIN, TOKEN_MAX = 20, 400


class RoutineError(Exception):
    """A problem with the routine; the message is plain words for the user."""


def clean_fire_url(value: str) -> str:
    """The fire address as stored, or "" when it is empty. Raises for a wrong one."""
    url = (value or "").strip()
    if not url:
        return ""
    if not url.startswith(FIRE_URL_PREFIX) or not url.endswith(FIRE_URL_SUFFIX):
        raise RoutineError(
            "That is not a routine fire address. It looks like "
            f"{FIRE_URL_PREFIX}trig_…{FIRE_URL_SUFFIX}"
        )
    middle = url[len(FIRE_URL_PREFIX) : -len(FIRE_URL_SUFFIX)]
    if not middle or "/" in middle or " " in middle or "?" in middle:
        raise RoutineError("That fire address looks wrong. Copy it again from the routine.")
    return url


def clean_token(value: str) -> str:
    """The token without spaces; raises when it cannot be one."""
    token = (value or "").strip()
    if not token:
        return ""
    if not TOKEN_MIN <= len(token) <= TOKEN_MAX or any(c.isspace() for c in token):
        raise RoutineError("That does not look like a routine token. Copy it again.")
    if not token.isascii():
        raise RoutineError("That does not look like a routine token. Copy it again.")
    return token


def clean_ha_url(value: str) -> str:
    """The Home Assistant address the routine posts back to ("" = Home Assistant's own)."""
    url = (value or "").strip().rstrip("/")
    if not url:
        return ""
    problem = RoutineError("The Home Assistant address must start with https:// (or http://).")
    if not url.startswith(("https://", "http://")) or any(c.isspace() for c in url):
        raise problem
    try:
        parts = urlparse(url)
        parts.port  # noqa: B018 - raises ValueError for a bad port
    except ValueError as err:
        raise problem from err
    if not parts.hostname or parts.query or parts.fragment or "?" in url or "#" in url:
        raise problem
    return url


@dataclass
class FireCounter:
    """Counts fires in the last hour so Boopli stays under Claude's limit."""

    limit: int = MAX_FIRES_PER_HOUR
    times: list[float] = field(default_factory=list)

    def _prune(self, now: float) -> None:
        self.times = [t for t in self.times if now - t < 3600]

    def used(self, now: float | None = None) -> int:
        self._prune(time.monotonic() if now is None else now)
        return len(self.times)

    def left(self, now: float | None = None) -> int:
        return max(0, self.limit - self.used(now))

    def take(self, now: float | None = None) -> None:
        """Count one fire; raises when the hour is full."""
        now = time.monotonic() if now is None else now
        self._prune(now)
        if len(self.times) >= self.limit:
            wait = max(1, int((self.times[0] + 3600 - now) // 60) + 1)
            raise RoutineError(
                f"Boopli already asked Claude {self.limit} times this hour. "
                f"Try again in about {wait} minutes."
            )
        self.times.append(now)


class Waiting:
    """Requests that have been fired and wait for the routine's answer (each answers once)."""

    def __init__(self) -> None:
        self._futures: dict[str, asyncio.Future[Any]] = {}

    def new(self) -> tuple[str, asyncio.Future[Any]]:
        request_id = uuid.uuid4().hex
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self._futures[request_id] = future
        return request_id, future

    def drop(self, request_id: str) -> None:
        self._futures.pop(request_id, None)

    def answer(self, request_id: str, data: Any) -> bool:
        """Hand an answer to whoever waits for it. False when nobody does (or it came twice)."""
        future = self._futures.pop(str(request_id), None)
        if future is None or future.done():
            return False
        future.set_result(data)
        return True

    def __len__(self) -> int:
        return len(self._futures)


def fire_text(instructions: str, request_id: str, answer_url: str, photo_urls: list[str]) -> str:
    """What the routine is told: the task, the pictures to look at, and where to put the answer.

    When the text is too long, the task is shortened: the pictures and the answer address
    always stay whole. Raises when those alone do not fit (nothing has been fired yet).
    """
    tail: list[str] = []
    if photo_urls:
        listing = "\n".join(f"- {u}" for u in photo_urls)
        tail.append(
            "Pictures to look at (download and view each one BEFORE you write the answer; "
            f"the links stop working after a few minutes):\n{listing}"
        )
    tail.append(
        "Then, as your very last action, send the answer back with ONE web request and stop:\n"
        f"POST {answer_url}\n"
        "Content-Type: application/json\n"
        f'Body: {{"request_id": "{request_id}", "answer": <your answer>}}\n'
        "The answer must be the same JSON the task above asks for. Do not do anything else."
    )
    tail_text = "\n\n".join(tail)
    room = MAX_TEXT - len(tail_text) - 2
    if room < 200:
        raise RoutineError("That request is too big for Claude. Use fewer or smaller photos.")
    task = instructions.strip()
    if len(task) > room:
        task = task[: room - 2].rstrip() + " …"
    return f"{task}\n\n{tail_text}"


def _explain(status: int) -> str:
    if status in (401, 403):
        return (
            "Claude refused the token. Make a new token for the routine, "
            "paste it in Boopli and try again."
        )
    if status == 404:
        return "Claude does not know that routine. Check the fire address."
    if status == 429:
        return "Claude says you asked too often. Wait a while and try again."
    if status in (400, 422):
        return "Claude did not accept the request. Check that the routine is switched on."
    if status >= 500:
        return "Claude is having trouble right now. Try again in a few minutes."
    return f"Claude answered with an error ({status})."


async def fire(
    session: aiohttp.ClientSession, fire_url: str, token: str, text: str
) -> dict[str, Any]:
    """Start the routine. Returns what Claude sent back (a session link, mostly)."""
    headers = {
        "Authorization": f"Bearer {token}",
        "anthropic-beta": BETA_HEADER,
        "anthropic-version": API_VERSION,
        "Content-Type": "application/json",
    }
    try:
        async with asyncio.timeout(FIRE_TIMEOUT):
            async with session.post(fire_url, headers=headers, json={"text": text}) as resp:
                if resp.status >= 300:
                    raise RoutineError(_explain(resp.status))
                try:
                    body = await resp.json(content_type=None)
                except (aiohttp.ContentTypeError, ValueError):
                    body = {}
    except TimeoutError as err:
        raise RoutineError("Claude did not answer the start request. Try again.") from err
    except aiohttp.ClientError as err:
        raise RoutineError("Boopli could not reach Claude. Check the internet connection.") from err
    return body if isinstance(body, dict) else {}


async def wait_for_answer(future: asyncio.Future[Any], seconds: float | None = None) -> Any:
    seconds = WAIT_SECONDS if seconds is None else seconds
    try:
        async with asyncio.timeout(seconds):
            return await asyncio.shield(future)
    except TimeoutError as err:
        minutes = max(1, round(seconds / 60))
        raise RoutineError(
            f"Claude did not send an answer within {minutes} minutes. Try again."
        ) from err
