import { html, svg, type TemplateResult } from "lit";
import { t } from "./i18n";
import type { FoodSize } from "./types";

/**
 * The pictures of the shop items, and what a colour or a pattern looks like in the room.
 * An item is one id: its price and rules live in the integration (engine.SHOP_ITEMS), its picture and
 * name here. A new item is one more picture below and one more name (`shop.item_<id>`) in the language files.
 */

const INK = "#101010";

/** A water bowl on a mat: white ceramic with a blue paw band. */
export const WATER_BOWL = svg`<svg viewBox="0 0 72 48" aria-hidden="true">
  <ellipse cx="36" cy="43" rx="33" ry="5" fill="#7B5BD6" stroke=${INK} stroke-width="2.5"/>
  <path d="M9 19 Q9 41 36 41 Q63 41 63 19 Z" fill="#F4F1FF" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M10 27 Q36 35 62 27 L61 32 Q36 40 11 32 Z" fill="#5B8DEF"/>
  <circle cx="36" cy="34" r="2.8" fill="#fff"/>
  <circle cx="31.5" cy="30.6" r="1.5" fill="#fff"/><circle cx="36" cy="29.3" r="1.5" fill="#fff"/><circle cx="40.5" cy="30.6" r="1.5" fill="#fff"/>
  <path d="M14 26 Q14 33 20 37" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
  <ellipse cx="36" cy="19" rx="27" ry="7" fill="#E6E0FF" stroke=${INK} stroke-width="2.5"/>
  <ellipse cx="36" cy="19.5" rx="22" ry="5" fill="#7FD8FF"/>
  <ellipse class="ripple" cx="36" cy="19.5" rx="7" ry="1.8" fill="none" stroke="#fff" stroke-width="1.4"/>
  <path d="M20 18.5 Q26 16.5 32 18" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
</svg>`;

/** A food bowl on a mat: warm ceramic with kibble and a bone biscuit. */
export const FOOD_BOWL = svg`<svg viewBox="0 0 72 48" aria-hidden="true">
  <ellipse cx="36" cy="43" rx="33" ry="5" fill="#C94F6D" stroke=${INK} stroke-width="2.5"/>
  <path d="M9 19 Q9 41 36 41 Q63 41 63 19 Z" fill="#FFF1E2" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M10 27 Q36 35 62 27 L61 32 Q36 40 11 32 Z" fill="#FF9F5A"/>
  <path d="M30 31.5 a3 3 0 1 1 6 0 a3 3 0 1 1 6 0 q0 4 -6 7 q-6 -3 -6 -7 z" fill="#fff"/>
  <path d="M14 26 Q14 33 20 37" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
  <ellipse cx="36" cy="19" rx="27" ry="7" fill="#FFE3C7" stroke=${INK} stroke-width="2.5"/>
  <ellipse cx="36" cy="18" rx="22" ry="5" fill="#8A5A3A"/>
  <circle cx="22" cy="15.5" r="3" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="29" cy="12.5" r="3" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="44" cy="12.8" r="3" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="50" cy="16" r="3" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="36" cy="15" r="3" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
  <g transform="translate(36 8) rotate(-12)">
    <rect x="-9" y="-2.4" width="18" height="4.8" rx="2.4" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/>
    <circle cx="-9" cy="-2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/><circle cx="-9" cy="2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/>
    <circle cx="9" cy="-2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/><circle cx="9" cy="2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/>
  </g>
</svg>`;

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
