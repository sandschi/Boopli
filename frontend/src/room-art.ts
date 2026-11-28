import { svg } from "lit";

/**
 * Pictures of the smaller room things: the starter items of the modular shop (an attachment and an item of
 * one pet kind). Like the other pictures they are code; the room (shop-art.ts, ROOM_ITEMS) says where they go.
 */

const INK = "#101010";

/** A gem: it sits on a bowl. The picture is square and the room sizes it by the bowl. */
export const GEM = svg`<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 3 L20 9 L12 21 L4 9 Z" fill="#5CE1E6" stroke=${INK} stroke-width="2" stroke-linejoin="round"/>
  <path d="M4 9 H20 M9 9 L12 3 L15 9 M9 9 L12 21 M15 9 L12 21" fill="none" stroke="#fff" stroke-width="1.2" stroke-linejoin="round" opacity="0.75"/>
  <path d="M7.4 7 L9.6 5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>
</svg>`;

/** A bone to chew on, for the dog. */
export const BONE = svg`<svg viewBox="0 0 56 32" aria-hidden="true">
  <ellipse cx="28" cy="28" rx="22" ry="3" fill="#000" opacity="0.2"/>
  <g stroke=${INK} stroke-width="2.5" fill="#FFF1D6">
    <circle cx="9" cy="14" r="5.5"/><circle cx="9" cy="23" r="5.5"/>
    <circle cx="47" cy="14" r="5.5"/><circle cx="47" cy="23" r="5.5"/>
  </g>
  <rect x="10" y="12" width="36" height="12" rx="5" fill="#FFF1D6" stroke=${INK} stroke-width="2.5"/>
  <rect x="6" y="14.5" width="8" height="7" fill="#FFF1D6"/>
  <rect x="42" y="14.5" width="8" height="7" fill="#FFF1D6"/>
  <path d="M16 16 H36" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
</svg>`;
