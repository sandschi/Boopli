import { html, svg, type TemplateResult } from "lit";
import { t } from "./i18n";
import type { FoodSize } from "./types";

/**
 * The pictures of the shop items, and what a colour or a pattern looks like in the room.
 * An item is one id: its price and rules live in the integration (engine.SHOP_ITEMS), its picture and
 * name here. A new item is one more picture below and one more name (`shop.item_<id>`) in the language files.
 */

const INK = "#101010";

/** A water bowl: sky-blue ceramic with a white paw band, a soft shine, and water that ripples. */
export const WATER_BOWL = svg`<svg viewBox="0 0 72 48" aria-hidden="true">
  <ellipse cx="36" cy="43.5" rx="31" ry="4" fill="#000" opacity="0.2"/>
  <path d="M7 19 Q8 43 36 43 Q64 43 65 19 Z" fill="#4FB0F2" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M10 27 Q36 36 62 27 L60.5 33 Q36 41.5 11.5 33 Z" fill="#fff"/>
  <circle cx="36" cy="35" r="2.6" fill="#4FB0F2"/>
  <circle cx="31.8" cy="31.8" r="1.4" fill="#4FB0F2"/><circle cx="36" cy="30.6" r="1.4" fill="#4FB0F2"/><circle cx="40.2" cy="31.8" r="1.4" fill="#4FB0F2"/>
  <path d="M12 24 Q12.5 34 19 39" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>
  <ellipse cx="36" cy="19" rx="29" ry="8" fill="#D8F1FF" stroke=${INK} stroke-width="2.5"/>
  <ellipse cx="36" cy="19.6" rx="23.5" ry="5.6" fill="#2F9BE8"/>
  <ellipse class="ripple" cx="36" cy="19.6" rx="7" ry="1.9" fill="none" stroke="#fff" stroke-width="1.4"/>
  <path d="M19 18.6 Q25 16.4 31 18" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>
</svg>`;

/**
 * A food bowl: warm terracotta with a cream paw band. The bowl is EMPTY by itself; the kibble (class "kibble")
 * is only there while the pet is being fed, and in the shop picture. The room's CSS shows and hides it.
 */
export const FOOD_BOWL = svg`<svg viewBox="0 0 72 48" aria-hidden="true">
  <ellipse cx="36" cy="43.5" rx="31" ry="4" fill="#000" opacity="0.2"/>
  <path d="M7 19 Q8 43 36 43 Q64 43 65 19 Z" fill="#F08A4B" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M10 27 Q36 36 62 27 L60.5 33 Q36 41.5 11.5 33 Z" fill="#FFF1E2"/>
  <circle cx="36" cy="35" r="2.6" fill="#F08A4B"/>
  <circle cx="31.8" cy="31.8" r="1.4" fill="#F08A4B"/><circle cx="36" cy="30.6" r="1.4" fill="#F08A4B"/><circle cx="40.2" cy="31.8" r="1.4" fill="#F08A4B"/>
  <path d="M12 24 Q12.5 34 19 39" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity="0.7"/>
  <ellipse cx="36" cy="19" rx="29" ry="8" fill="#FFE3C7" stroke=${INK} stroke-width="2.5"/>
  <ellipse cx="36" cy="19.6" rx="23.5" ry="5.6" fill="#7A4A2A"/>
  <g class="kibble">
    <circle style="--i:6" cx="23" cy="17" r="3.2" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
    <circle style="--i:4" cx="30" cy="13.5" r="3.2" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
    <circle style="--i:1" cx="43" cy="13.8" r="3.2" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
    <circle style="--i:0" cx="50" cy="17.2" r="3.2" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
    <circle style="--i:3" cx="36" cy="16" r="3.2" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
    <circle style="--i:5" cx="29" cy="20" r="3.2" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
    <circle style="--i:2" cx="43" cy="20.4" r="3.2" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
  </g>
</svg>`;

/** One of the little bowls beside the inventory button: full = a meal is still possible today, empty = eaten. */
export const mealBowl = (full: boolean) => svg`<svg viewBox="0 0 28 20" aria-hidden="true" class="meal ${full ? "full" : "empty"}">
  <path d="M3 8 Q4 18 14 18 Q24 18 25 8 Z" fill=${full ? "#F08A4B" : "none"} stroke=${full ? INK : "currentColor"} stroke-width="2" stroke-linejoin="round" opacity=${full ? 1 : 0.55}/>
  <ellipse cx="14" cy="8" rx="11" ry="3.4" fill=${full ? "#7A4A2A" : "none"} stroke=${full ? INK : "currentColor"} stroke-width="2" opacity=${full ? 1 : 0.55}/>
  ${full
    ? svg`<circle cx="10.5" cy="6.4" r="2.2" fill="#C98A5A" stroke=${INK} stroke-width="1.2"/><circle cx="16" cy="5.6" r="2.2" fill="#B6784A" stroke=${INK} stroke-width="1.2"/><circle cx="19.5" cy="7.4" r="2" fill="#C98A5A" stroke=${INK} stroke-width="1.2"/>`
    : ""}
</svg>`;

/** The Blub: a round coin with the slime on it. */
export const BLUB_COIN = svg`<svg viewBox="0 0 32 32" aria-hidden="true" class="coin-art">
  <circle cx="16" cy="16" r="14" fill="#FFC83D" stroke=${INK} stroke-width="2"/>
  <circle cx="16" cy="16" r="10.6" fill="none" stroke="#FFE59A" stroke-width="1.6"/>
  <path d="M16 6.8 C17.4 9.6 22.6 11.4 22.6 17.6 C22.6 21.6 19.8 24 16 24 C12.2 24 9.4 21.6 9.4 17.6 C9.4 11.4 14.6 9.6 16 6.8 Z" fill="#6BE04B" stroke=${INK} stroke-width="1.6" stroke-linejoin="round"/>
  <circle cx="13.2" cy="17.6" r="1.3" fill=${INK}/><circle cx="18.8" cy="17.6" r="1.3" fill=${INK}/>
  <path d="M14 20.6 Q16 22.2 18 20.6" fill="none" stroke=${INK} stroke-width="1.2" stroke-linecap="round"/>
  <path d="M12.6 12.8 Q13.4 11.2 14.8 10.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/>
</svg>`;

/** The Blub coin, sized by the text around it. */
export const coin = () => html`<span class="coin" aria-hidden="true">${BLUB_COIN}</span>`;

/** The bed, in two layers: the back (the soft arch, the cushion and a pillow) goes behind the pet... */
export const BED_BACK = svg`<svg viewBox="0 0 120 64" aria-hidden="true">
  <ellipse cx="60" cy="58" rx="56" ry="5" fill="#000" opacity="0.2"/>
  <path d="M6 42 Q2 6 60 6 Q118 6 114 42 L114 52 Q60 64 6 52 Z" fill="#A98BFF" stroke=${INK} stroke-width="3" stroke-linejoin="round"/>
  <path d="M14 34 Q18 14 60 13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
  <path d="M22 17 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 z" fill="#FFE45C" stroke=${INK} stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M60 9 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 z" fill="#FFE45C" stroke=${INK} stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M98 17 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 z" fill="#FFE45C" stroke=${INK} stroke-width="1.2" stroke-linejoin="round"/>
  <ellipse cx="60" cy="42" rx="47" ry="13" fill="#E3D6FF" stroke=${INK} stroke-width="2.5"/>
  <rect x="12" y="26" width="31" height="17" rx="8.5" fill="#FFF1B8" stroke=${INK} stroke-width="2.5"/>
  <path d="M18 34 H37" stroke=${INK} stroke-width="1.5" stroke-dasharray="3 3" stroke-linecap="round" opacity="0.4"/>
</svg>`;

/** ...and the front (the soft lip at the bottom and the blanket) in front of it, so the pet is IN the bed. */
export const BED_FRONT = svg`<svg viewBox="0 0 120 64" aria-hidden="true">
  <g class="blanket">
    <path d="M18 38 Q24 33 30 38 Q36 33 42 38 Q48 33 54 38 Q60 33 66 38 Q72 33 78 38 Q84 33 90 38 Q96 33 102 38 L104 52 Q60 62 16 52 Z" fill="#FF9EC0" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M22 44 Q60 52 98 44" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
    <path d="M28 49 Q60 57 92 49" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
  </g>
  <path d="M8 44 Q60 60 112 44 Q118 56 104 60 Q60 68 16 60 Q2 56 8 44 Z" fill="#8B5CF6" stroke=${INK} stroke-width="3" stroke-linejoin="round"/>
  <path d="M16 52 Q60 62 104 52" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
</svg>`;

/** Food: a few kibbles, a heap, a full bowl's worth. */
const KIBBLE = (cx: number, cy: number, fill: string) =>
  svg`<circle cx=${cx} cy=${cy} r="5.5" fill=${fill} stroke=${INK} stroke-width="2"/>`;

const FOOD_SMALL = svg`<svg viewBox="0 0 48 48" aria-hidden="true">
  <ellipse cx="24" cy="40" rx="18" ry="4" fill="#000" opacity="0.18"/>
  ${KIBBLE(18, 33, "#C98A5A")}${KIBBLE(29, 34, "#B6784A")}${KIBBLE(24, 26, "#C98A5A")}
</svg>`;

const FOOD_MEDIUM = svg`<svg viewBox="0 0 48 48" aria-hidden="true">
  <ellipse cx="24" cy="41" rx="20" ry="4" fill="#000" opacity="0.18"/>
  ${KIBBLE(13, 35, "#B6784A")}${KIBBLE(24, 36, "#C98A5A")}${KIBBLE(35, 35, "#B6784A")}
  ${KIBBLE(18, 26, "#C98A5A")}${KIBBLE(30, 26, "#B6784A")}${KIBBLE(24, 17, "#C98A5A")}
</svg>`;

const FOOD_BIG = svg`<svg viewBox="0 0 48 48" aria-hidden="true">
  <ellipse cx="24" cy="43" rx="22" ry="4" fill="#000" opacity="0.18"/>
  <path d="M8 22 Q24 10 40 22 L43 42 H5 Z" fill="#FFB86B" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M10 28 Q24 20 38 28" fill="none" stroke="#fff" stroke-width="2" opacity="0.6"/>
  <g transform="translate(24 34) rotate(-12)">
    <rect x="-9" y="-2.4" width="18" height="4.8" rx="2.4" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/>
    <circle cx="-9" cy="-2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/><circle cx="-9" cy="2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/>
    <circle cx="9" cy="-2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/><circle cx="9" cy="2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/>
  </g>
</svg>`;

/** An extra meal a day: a plate with the number of the meal on it. */
const meal = (n: number) => svg`<svg viewBox="0 0 48 48" aria-hidden="true">
  <ellipse cx="24" cy="26" rx="21" ry="15" fill="#F4F1FF" stroke=${INK} stroke-width="2.5"/>
  <ellipse cx="24" cy="26" rx="14" ry="9.5" fill="#E6E0FF" stroke=${INK} stroke-width="1.5"/>
  <text x="24" y="31" text-anchor="middle" font-size="14" font-weight="700" fill=${INK} font-family="sans-serif">${n}</text>
</svg>`;

/** A colour or a pattern as a round swatch. */
const swatch = (css: string) => html`<span class="swatch" style="background:${css}"></span>`;

/** What a colour or a pattern looks like as the wall or the floor. "" = the room's own look. */
export const ROOM_PAINT: Record<string, string> = {
  color_sky: "#9fd3f5",
  pattern_dots: "radial-gradient(circle, rgba(255,255,255,0.85) 22%, transparent 24%) 0 0 / 18px 18px, #c7b3f0",
  pattern_stripes: "repeating-linear-gradient(90deg, rgba(255,255,255,0.55) 0 8px, transparent 8px 16px), #f5a3b8",
  pattern_stars: "radial-gradient(circle, rgba(255,235,120,0.95) 14%, transparent 16%) 0 0 / 22px 22px, #5b6bc0",
  pattern_waves: "radial-gradient(circle at 50% 100%, transparent 58%, rgba(255,255,255,0.6) 60% 66%, transparent 68%) 0 0 / 24px 14px, #4fb3bf",
  pattern_checks: "conic-gradient(rgba(255,255,255,0.5) 25%, transparent 0 50%, rgba(255,255,255,0.5) 0 75%, transparent 0) 0 0 / 24px 24px, #f0b27a",
  // the colours of the achievement tiers (steps series)
  color_grey: "#aeb4bc",
  color_green: "#7fcf8a",
  color_blue: "#6aa8f0",
  color_purple: "#b07fe0",
  color_gold: "linear-gradient(135deg, #f7d56a, #d9a62e 55%, #f3cf5e)",
};

/** The CSS background of a wall or floor with this item on it ("" when it has none). */
export function roomPaint(id: string | undefined): string {
  return (id && ROOM_PAINT[id]) || "";
}

/** The picture of an item, for the shop and the inventory. */
export function itemArt(id: string): TemplateResult {
  switch (id) {
    case "water_bowl":
      return html`${WATER_BOWL}`;
    case "food_bowl":
      return html`${FOOD_BOWL}`;
    case "bed":
      return html`${BED_BACK}`;
    case "food_small":
      return html`${FOOD_SMALL}`;
    case "food_medium":
      return html`${FOOD_MEDIUM}`;
    case "food_big":
      return html`${FOOD_BIG}`;
    case "meal_4":
      return html`${meal(4)}`;
    case "meal_5":
      return html`${meal(5)}`;
    default:
      return swatch(ROOM_PAINT[id] ?? "var(--divider-color, #888)");
  }
}

/** The picture of a food size. */
export function foodArt(size: FoodSize): TemplateResult {
  return itemArt(`food_${size}`);
}

/** The name of an item, in the person's language. */
export function itemName(id: string): string {
  return t(`shop.item_${id}`);
}
