import type { QuietHours } from "./types";

/** "9:30" or "09:30" as minutes since midnight (NaN when it is not a time). */
function minutes(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(time).trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : Number.NaN;
}

/**
 * Whether it is night for the wall board: the quiet hours (when Boopli does not nudge) are on and
 * now is outside the hours of nudging. A day with no limit, or quiet hours that are off, is never night.
 */
export function isNight(quiet: QuietHours | undefined, nowMs: number, tz: string): boolean {
  if (!quiet?.enabled) return false;
  const at = new Date(nowMs);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(at)
    .reduce<Record<string, string>>((o, p) => ((o[p.type] = p.value), o), {});
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday);
  const hours = quiet.days?.[String(day)];
  if (!hours) return false;
  const now = Number(parts.hour) * 60 + Number(parts.minute);
  const start = minutes(hours.start);
  const stop = minutes(hours.stop);
  if (Number.isNaN(start) || Number.isNaN(stop)) return false; // a time that cannot be read: do not black the screen out
  return now < start || now >= stop;
}
