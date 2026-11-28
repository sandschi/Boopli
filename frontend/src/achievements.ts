import { t } from "./i18n";

/**
 * Achievements in the panel. The integration only knows ids and what they need (engine.py: SERIES and
 * SINGLE_ACHIEVEMENTS); this file is how they look and read.
 *
 * A tiered id is "<series>_<tier>" ("steps_rare"); a one-off has an id of its own ("egg").
 * A new top tier (platinum, diamond) later: one more word in TIERS, its colour in TIER_COLOR and its two texts
 * (`news.badge_<tier>`, `news.joke_<tier>`) here and in the language files, plus a target per series in the engine.
 */

/** From the easiest up (the order of the engine's TIERS). Named like the rarities players know. */
export const TIERS = ["common", "uncommon", "rare", "epic", "legendary"] as const;
export type Tier = (typeof TIERS)[number];

/** What each tier looks like: grey, green, blue, purple, gold. */
export const TIER_COLOR: Record<Tier, string> = {
  common: "#aeb4bc",
  uncommon: "#7fcf8a",
  rare: "#6aa8f0",
  epic: "#b07fe0",
  legendary: "linear-gradient(135deg, #f7d56a, #d9a62e 55%, #f3cf5e)",
};

/** The same colours as brushed metal: light edge, deep middle, a second glint. Used for the medals and the trophy. */
export const TIER_METAL: Record<Tier, string> = {
  common: "linear-gradient(140deg, #fbfcfd 0%, #c3c9d0 24%, #7f8790 52%, #dfe3e7 74%, #9aa1a9 100%)",
  uncommon: "linear-gradient(140deg, #e4fbe8 0%, #8fdc9b 24%, #3f9b56 52%, #b4efbe 74%, #55b46b 100%)",
  rare: "linear-gradient(140deg, #e3efff 0%, #84b6f6 24%, #3a73c4 52%, #a9cdfa 74%, #4f8be0 100%)",
  epic: "linear-gradient(140deg, #f1e4ff 0%, #bc92ea 24%, #7a45b8 52%, #d2b3f4 74%, #9560d0 100%)",
  legendary: "linear-gradient(140deg, #fff6c2 0%, #f6cf55 22%, #b2801a 50%, #f9e286 72%, #c89322 100%)",
};

export const SERIES =["steps", "chores", "meals", "streak", "level"] as const;
export type Series = (typeof SERIES)[number];
export const SINGLES = ["egg", "first_chore", "setup"] as const;

/** The symbol in the middle of a medal (Material Design Icons that Home Assistant ships), one for each series and one-off. */
const ICONS: Record<string, string> = {
  steps: "shoe-print",
  chores: "broom",
  meals: "food-drumstick",
  streak: "fire",
  level: "arrow-up-bold-circle",
  egg: "cat",
  first_chore: "clipboard-plus",
  setup: "rocket-launch",
};

export interface Badge {
  id: string;
  /** "" for a one-off */
  series: Series | "";
  tier: Tier | "";
}

const has = (list: readonly string[], x: string): boolean => list.includes(x);

/** What an id stands for, or null for an id this panel does not know (it is never announced). */
export function parseAchievement(id: string): Badge | null {
  if (has(SINGLES, id)) return { id, series: "", tier: "" };
  const cut = id.lastIndexOf("_");
  if (cut < 1) return null;
  const series = id.slice(0, cut);
  const tier = id.slice(cut + 1);
  if (!has(SERIES, series) || !has(TIERS, tier)) return null;
  return { id, series: series as Series, tier: tier as Tier };
}

/** The symbol for a series id ("steps") or a one-off id ("egg"); a star for anything this panel does not know. */
export function achievementIcon(seriesOrId: string): string {
  return ICONS[seriesOrId] ?? "star";
}

/** "You earned the legendary gold badge for Steps!" (a whole sentence per tier, so every language can agree its words). */
export function badgeSentence(b: Badge): string {
  if (!b.tier) return t(`news.single_${b.id}`);
  return t(`news.badge_${b.tier}`, { series: t(`news.series_${b.series}`) });
}

/** The funny line that goes with it. */
export function badgeJoke(b: Badge): string {
  return b.tier ? t(`news.joke_${b.tier}`) : t(`news.joke_${b.id}`);
}
