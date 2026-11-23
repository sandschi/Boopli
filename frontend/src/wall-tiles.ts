import "./wall-tile-clock";
import "./wall-tile-pet";
import "./wall-tile-due";
import "./wall-tile-next";
import "./wall-tile-away";
import "./wall-tile-entity";
import "./wall-tile-weather";
import "./wall-tile-calendar";
import "./wall-tile-camera";
import "./wall-tile-note";
import { newLadderId } from "./helpers";
import type { Board, Tile, TileOptions, TileSize } from "./types";

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
  emoji: string;
  blurb: string;
  defaultSize: TileSize;
  options: OptionField[];
}

export const TILE_SIZE_LABEL: Record<TileSize, string> = {
  small: "Small",
  wide: "Wide",
  tall: "Tall",
  big: "Big",
};

export const TILE_DEFS: TileDef[] = [
  {
    type: "clock",
    label: "Clock",
    emoji: "🕒",
    blurb: "The time and the date.",
    defaultSize: "wide",
    options: [
      { key: "format", label: "Clock", kind: "choice", default: "24h", choices: [["24h", "24 hours"], ["12h", "12 hours (AM/PM)"]] },
      { key: "date", label: "Show the date", kind: "bool", default: true },
    ],
  },
  { type: "pet", label: "Pet", emoji: "🐾", blurb: "Your pet in its room.", defaultSize: "big", options: [] },
  { type: "due_now", label: "Due now", emoji: "✅", blurb: "What is due now, with Done, On it and Snooze.", defaultSize: "big", options: [] },
  {
    type: "coming_up",
    label: "Coming up",
    emoji: "📅",
    blurb: "What comes next.",
    defaultSize: "wide",
    options: [{ key: "count", label: "How many to show", kind: "int", default: 3, min: 1, max: 10 }],
  },
  { type: "away", label: "Away banner", emoji: "🧳", blurb: "Only there while away mode is on.", defaultSize: "wide", options: [] },
  {
    type: "entity",
    label: "Entity",
    emoji: "🔘",
    blurb: "Any sensor or switch. A tap switches it.",
    defaultSize: "small",
    options: [
      { key: "entity_id", label: "Entity", kind: "entity", default: "" },
      { key: "name", label: "Name (optional)", kind: "text", default: "" },
      { key: "tap", label: "A tap", kind: "choice", default: "toggle", choices: [["toggle", "switches it"], ["none", "does nothing"]] },
    ],
  },
  {
    type: "weather",
    label: "Weather",
    emoji: "⛅",
    blurb: "The weather now.",
    defaultSize: "wide",
    options: [{ key: "entity_id", label: "Weather", kind: "entity", default: "", domains: ["weather"] }],
  },
  {
    type: "calendar",
    label: "Calendar",
    emoji: "🗓️",
    blurb: "The next events.",
    defaultSize: "wide",
    options: [
      { key: "entity_id", label: "Calendar", kind: "entity", default: "", domains: ["calendar"] },
      { key: "count", label: "How many to show", kind: "int", default: 4, min: 1, max: 10 },
    ],
  },
  {
    type: "camera",
    label: "Camera",
    emoji: "📷",
    blurb: "A picture from a camera.",
    defaultSize: "wide",
    options: [
      { key: "entity_id", label: "Camera", kind: "entity", default: "", domains: ["camera"] },
      { key: "refresh_s", label: "New picture every (seconds)", kind: "int", default: 10, min: 5, max: 300 },
    ],
  },
  {
    type: "note",
    label: "Note",
    emoji: "📝",
    blurb: "Some words you write.",
    defaultSize: "small",
    options: [
      { key: "text", label: "Text", kind: "text", default: "", long: true },
      { key: "big", label: "Big letters", kind: "bool", default: false },
    ],
  },
];

export function tileDef(type: string): TileDef | undefined {
  return TILE_DEFS.find((d) => d.type === type);
}

/** A new tile of a type, with its default size and options. */
export function newTile(type: string): Tile {
  const def = tileDef(type);
  const options: TileOptions = {};
  for (const f of def?.options ?? []) options[f.key] = f.default;
  return { id: newLadderId(), type, size: def?.defaultSize ?? "small", options };
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
