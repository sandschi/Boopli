import type { Repeat } from "./types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_NAMES = WEEKDAYS;

/** "14:05" in the given time zone. */
export function fmtTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/** "2026-11-21", the calendar day in the given time zone. */
export function dayKey(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** "today 19:00", "tomorrow 09:00" or "Sat 28 Nov, 09:00". */
export function describeWhen(iso: string, nowMs: number, tz: string): string {
  const at = new Date(iso);
  const diff = dayNumber(dayKey(at, tz)) - dayNumber(dayKey(new Date(nowMs), tz));
  const time = fmtTime(iso, tz);
  if (diff === 0) return `today ${time}`;
  if (diff === 1) return `tomorrow ${time}`;
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(at);
  return `${date}, ${time}`;
}

/** Whether an ISO moment falls on the same calendar day as `nowMs`. */
export function isToday(iso: string, nowMs: number, tz: string): boolean {
  return dayKey(new Date(iso), tz) === dayKey(new Date(nowMs), tz);
}

/** "5 min", "2h", "2h 15m" for a length of time in minutes. */
export function fmtMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 1) return "less than a minute";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`;
}

/** "in 2h 15m" until a future moment. */
export function untilLabel(iso: string, nowMs: number): string {
  const minutes = (new Date(iso).getTime() - nowMs) / 60_000;
  if (minutes <= 0.5) return "any moment now";
  return `in ${fmtMinutes(minutes)}`;
}

/** "since 14:10" for something that has been waiting for the user. */
export function sinceLabel(iso: string, tz: string): string {
  return `since ${fmtTime(iso, tz)}`;
}

/** A short sentence for a repeat rule. */
export function describeRepeat(repeat: Repeat): string {
  switch (repeat.type) {
    case "none":
      return "On demand";
    case "daily":
      return `Every day at ${repeat.time}`;
    case "weekly": {
      const days = [...repeat.weekdays]
        .sort((a, b) => a - b)
        .map((d) => WEEKDAYS[d])
        .join(", ");
      return `Every ${days} at ${repeat.time}`;
    }
    case "every_n_days":
      return repeat.every_n_days === 1
        ? `Every day after you finish, at ${repeat.time}`
        : `${repeat.every_n_days} days after you finish, at ${repeat.time}`;
  }
}
