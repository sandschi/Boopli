import type { QuietHours } from "./types";

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
  const now = `${parts.hour}:${parts.minute}`;
  return now < hours.start || now >= hours.stop;
}
