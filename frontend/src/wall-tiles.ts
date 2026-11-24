import "./wall-tile-clock";
import "./wall-tile-pet";
import "./wall-tile-due";
import "./wall-tile-next";
import "./wall-tile-entity";
import "./wall-tile-weather";
import "./wall-tile-calendar";
import "./wall-tile-camera";
import "./wall-tile-note";
import { newLadderId } from "./helpers";
import { firstFit } from "./wall-layout";
import type { Board, Tile, TileOptions } from "./types";

/**
 * The list of tiles. A tile of type `due_now` is the element `wall-tile-due-now` (underscores become dashes).
 * To add a tile of your own: write its element (copy wall-tile-note.ts), import it
 * above, and add one entry here. The board settings build their forms from `options`, and the backend
 * checks the same options (TILE_OPTIONS in engine.py), so add them there too.
 */

export interface OptionField {
  key: string;
  label: string;
  kind: "choice" | "int" | "bool" | "text" | "entity";
  default: string | number | boolean;
  choices?: [string, string][];
  min?: number;
  max?: number;
  domains?: string[]; // for an entity: which kinds. none = any
  long?: boolean; // for text: a bigger box
}

export interface TileDef {
  type: string;
  label: string;
  icon: string; // a Material Design icon name
  blurb: string;
  defaultW: number; // the size a new tile starts with on a 16 x 9 grid (it grows with a finer grid)
  defaultH: number;
  options: OptionField[];
}

export const TILE_DEFS: TileDef[] = [
  {
    type: "clock",
    label: "Clock",
    icon: "clock-outline",
    blurb: "The time and the date.",
    defaultW: 4,
    defaultH: 2,
    options: [
      { key: "format", label: "Clock", kind: "choice", default: "24h", choices: [["24h", "24 hours"], ["12h", "12 hours (AM/PM)"]] },
      { key: "date", label: "Show the date", kind: "bool", default: true },
    ],
  },
  { type: "pet", label: "Pet", icon: "paw", blurb: "Your pet in its room.", defaultW: 6, defaultH: 4, options: [] },
  { type: "due_now", label: "Due now", icon: "check-circle-outline", blurb: "What is due now, with Done, On it and Snooze.", defaultW: 6, defaultH: 4, options: [] },
  {
    type: "coming_up",
    label: "Coming up",
    icon: "calendar-clock",
    blurb: "What comes next.",
    defaultW: 6,
    defaultH: 3,
    options: [{ key: "count", label: "How many to show", kind: "int", default: 3, min: 1, max: 10 }],
  },
  {
    type: "entity",
    label: "Entity",
    icon: "toggle-switch-outline",
    blurb: "Any sensor or switch. A tap switches it.",
    defaultW: 2,
    defaultH: 2,
    options: [
      { key: "entity_id", label: "Entity", kind: "entity", default: "" },
      { key: "name", label: "Name (optional)", kind: "text", default: "" },
      { key: "tap", label: "A tap", kind: "choice", default: "toggle", choices: [["toggle", "switches it"], ["none", "does nothing"]] },
    ],
  },
  {
    type: "weather",
    label: "Weather",
    icon: "weather-partly-cloudy",
    blurb: "The weather now.",
    defaultW: 4,
    defaultH: 2,
    options: [{ key: "entity_id", label: "Weather", kind: "entity", default: "", domains: ["weather"] }],
  },
  {
    type: "calendar",
    label: "Calendar",
    icon: "calendar-month-outline",
    blurb: "The next events.",
    defaultW: 6,
    defaultH: 4,
    options: [
      { key: "entity_id", label: "Calendar", kind: "entity", default: "", domains: ["calendar"] },
      { key: "count", label: "How many to show", kind: "int", default: 4, min: 1, max: 10 },
    ],
  },
  {
    type: "camera",
    label: "Camera",
    icon: "camera-outline",
    blurb: "A picture from a camera.",
    defaultW: 6,
    defaultH: 4,
    options: [
      { key: "entity_id", label: "Camera", kind: "entity", default: "", domains: ["camera"] },
      { key: "refresh_s", label: "New picture every (seconds)", kind: "int", default: 10, min: 5, max: 300 },
    ],
  },
  {
    type: "note",
    label: "Note",
    icon: "note-text-outline",
    blurb: "Some words you write.",
    defaultW: 4,
    defaultH: 2,
    options: [
      { key: "text", label: "Text", kind: "text", default: "", long: true },
      { key: "big", label: "Big letters", kind: "bool", default: false },
    ],
  },
];

/** The smallest size (columns, rows) a new tile of a type is made at. Others can shrink to one cell. */
const TILE_MIN_SIZE: Record<string, [number, number]> = { due_now: [3, 2] };

export function tileDef(type: string): TileDef | undefined {
  return TILE_DEFS.find((d) => d.type === type);
}

/**
 * A new tile of a type, with its default options, at the first free spot. It starts at its default size;
 * when that does not fit anywhere it is made smaller, a step at a time (down to one cell), until it does.
 * Null: not even one cell is free.
 */
export function newTile(type: string, others: Tile[] = [], columns = 16, rows = 9): Tile | null {
  const def = tileDef(type);
  const options: TileOptions = {};
  for (const f of def?.options ?? []) options[f.key] = f.default;
  let w = Math.max(1, Math.min(Math.round(((def?.defaultW ?? 2) * columns) / 16), columns));
  let h = Math.max(1, Math.min(Math.round(((def?.defaultH ?? 2) * rows) / 9), rows));
  for (;;) {
    const spot = firstFit(others, columns, rows, w, h);
    if (spot) return { id: newLadderId(), type, ...spot, w, h, options };
    // A tile never gets smaller than it can still be used at: "Due now" keeps its three buttons reachable.
    const [minW, minH] = TILE_MIN_SIZE[type] ?? [1, 1];
    if (w <= minW && h <= minH) return null;
    if (w >= h ? w > minW : h <= minH) w -= 1; // shrink the longer side first, so the shape stays about the same
    else h -= 1;
  }
}

/** The tiles a new board starts with. */
export function starterTiles(columns = 16, rows = 9): Tile[] {
  const clock = newTile("clock", [], columns, rows)!;
  return [clock, newTile("due_now", [clock], columns, rows)!];
}

/** The board a screen shows: the one named (or with that id), else the first. */
export function pickBoard(boards: Board[] | undefined, wanted: string): Board | undefined {
  const list = boards ?? [];
  const w = wanted.trim().toLowerCase();
  return (w && list.find((b) => b.name.toLowerCase() === w || b.id === wanted)) || list[0];
}

/** The link that opens a board on a screen. */
export function boardLink(board: Board): string {
  return `${location.origin}${location.pathname}?wall=${encodeURIComponent(board.name)}`;
}
