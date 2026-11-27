import { t } from "./i18n";

void t; // (the names below use it once the base achievements exist)

/**
 * The names of the achievements, by id (the integration only knows the ids and what they need).
 * The base achievements come with the base content; until then this list is empty and nothing is shown.
 * An id that has no name here is never announced.
 */
const NAMES: Record<string, () => string> = {};

export function achievementName(id: string): string {
  return NAMES[id]?.() ?? "";
}
