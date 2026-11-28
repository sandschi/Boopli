import type { Repeat } from "./types";
import { currentLanguage, t } from "./i18n";

/** The short day names, Monday first, in the language of the panel. */
export function weekdayNames(): string[] {
  const fmt = new Intl.DateTimeFormat(dateLocale(), { weekday: "short", timeZone: "UTC" });
  return [0, 1, 2, 3, 4, 5, 6].map((i) => fmt.format(new Date(Date.UTC(2024, 0, 1 + i)))); // 1 January 2024 was a Monday
}

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

/** English keeps the day-month order it always had; other languages use their own. */
export function dateLocale(): string {
  const language = currentLanguage();
  // English keeps day-month order; the two test languages are English with accents
  return language === "en" || language === "fancy" || language === "pseudo" ? "en-GB" : language;
}

/** "today 19:00", "tomorrow 09:00" or "Sat 28 Nov, 09:00". */
export function describeWhen(iso: string, nowMs: number, tz: string): string {
  const at = new Date(iso);
  const diff = dayNumber(dayKey(at, tz)) - dayNumber(dayKey(new Date(nowMs), tz));
  const time = fmtTime(iso, tz);
  if (diff === 0) return t("time.today", { time });
  if (diff === 1) return t("time.tomorrow", { time });
  const date = new Intl.DateTimeFormat(dateLocale(), {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(at);
  return `${date}, ${time}`;
}

/** Whether an ISO moment falls on the same calendar day as `nowMs`. */
export function isToday(iso: string, nowMs: number, tz: string): boolean {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return false; // an unreadable time (a damaged backup) must not break the page
  return dayKey(when, tz) === dayKey(new Date(nowMs), tz);
}

/** "5 min", "2h", "2h 15m" for a length of time in minutes. */
export function fmtMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 1) return t("time.less_than_a_minute");
  if (m < 60) return t("wizard.min", { m });
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? t("time.hours_short", { h }) : t("time.hours_minutes_short", { h, m: rest });
}

/** "in 2h 15m" until a future moment. */
export function untilLabel(iso: string, nowMs: number): string {
  const minutes = (new Date(iso).getTime() - nowMs) / 60_000;
  if (minutes <= 0.5) return t("time.any_moment_now");
  return t("time.in_duration", { duration: fmtMinutes(minutes) });
}

/** "since 14:10" for something that has been waiting for the user. */
export function sinceLabel(iso: string, tz: string): string {
  return t("time.since", { time: fmtTime(iso, tz) });
}

/** "08:00" or "08:00 and 20:00" for the times of one day. */
function joinTimes(times: string[]): string {
  return times.length === 1 ? times[0] : times.length === 2 ? t("time.and_2", { value: times[0], value2: times[1] }) : t("time.and", { join: times.slice(0, -1).join(", "), value: times[times.length - 1] });
}

/**
 * A schedule in plain words, for example "Mon to Fri 19:30, Sat 11:00".
 * Days next to each other with the same times are written together only to keep
 * it short; each day is stored on its own.
 */
export function describeSchedule(days: Record<string, string[]>): string {
  const parts: string[] = [];
  let i = 0;
  while (i < 7) {
    const times = days[String(i)] ?? [];
    if (times.length === 0) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < 7 && (days[String(j + 1)] ?? []).join() === times.join()) j++;
    const dayNames = weekdayNames();
    const name = i === j ? dayNames[i] : j === i + 1 ? t("time.and_2", { value: dayNames[i], value2: dayNames[j] }) : t("helpers.day_range", { from: dayNames[i], to: dayNames[j] });
    parts.push(`${name} ${joinTimes(times)}`);
    i = j + 1;
  }
  return parts.length ? parts.join(", ") : t("time.no_days_yet");
}

/** A short sentence for a repeat rule. */
export function describeRepeat(repeat: Repeat): string {
  switch (repeat.type) {
    case "none":
      return t("common.on_demand");
    case "schedule":
      return describeSchedule(repeat.days);
    case "every_n_days":
      return repeat.every_n_days === 1
        ? t("time.every_day_after_you_finish_at", { time: repeat.time })
        : t("time.days_after_you_finish_at", { every_n_days: repeat.every_n_days, time: repeat.time });
  }
}
