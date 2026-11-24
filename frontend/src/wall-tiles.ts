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
import { t } from "./i18n";

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

export const TILE_DEFS = (): TileDef[] => [
  {
    type: "clock",
    label: t("wall_tiles.clock"),
    icon: "clock-outline",
    blurb: t("wall_tiles.the_time_and_the_date"),
    defaultW: 4,
    defaultH: 2,
    options: [
      { key: "format", label: t("wall_tiles.clock"), kind: "choice", default: "24h", choices: [["24h", t("wall_tiles.hours_24")], ["12h", t("wall_tiles.hours_12")]] },
      { key: "date", label: t("wall_tiles.show_the_date"), kind: "bool", default: true },
    ],
  },
  { type: "pet", label: t("wall_tiles.pet"), icon: "paw", blurb: t("wall_tiles.your_pet_in_its_room"), defaultW: 6, defaultH: 4, options: [] },
  { type: "due_now", label: t("wall_tiles.due_now"), icon: "check-circle-outline", blurb: t("wall_tiles.what_is_due_now_with_done"), defaultW: 6, defaultH: 4, options: [] },
  {
    type: "coming_up",
    label: t("wall_tile_next.coming_up"),
    icon: "calendar-clock",
    blurb: t("wall_tiles.what_comes_next"),
    defaultW: 6,
    defaultH: 3,
    options: [{ key: "count", label: t("wall_tiles.how_many_to_show"), kind: "int", default: 3, min: 1, max: 10 }],
  },
  {
    type: "entity",
    label: t("wall_tiles.entity"),
    icon: "toggle-switch-outline",
    blurb: t("wall_tiles.any_sensor_or_switch_a_tap"),
    defaultW: 2,
    defaultH: 2,
    options: [
      { key: "entity_id", label: t("wall_tiles.entity"), kind: "entity", default: "" },
      { key: "name", label: t("wall_tiles.name_optional"), kind: "text", default: "" },
      { key: "tap", label: t("wall_tiles.a_tap"), kind: "choice", default: "toggle", choices: [["toggle", t("wall_tiles.tap_switches_it")], ["none", t("wall_tiles.tap_does_nothing")]] },
    ],
  },
  {
    type: "weather",
    label: t("wall_tiles.weather"),
    icon: "weather-partly-cloudy",
    blurb: t("wall_tiles.the_weather_now"),
    defaultW: 4,
    defaultH: 2,
    options: [{ key: "entity_id", label: t("wall_tiles.weather"), kind: "entity", default: "", domains: ["weather"] }],
  },
  {
    type: "calendar",
    label: t("wall_tile_calendar.calendar"),
    icon: "calendar-month-outline",
    blurb: t("wall_tiles.the_next_events"),
    defaultW: 6,
    defaultH: 4,
    options: [
      { key: "entity_id", label: t("wall_tile_calendar.calendar"), kind: "entity", default: "", domains: ["calendar"] },
      { key: "count", label: t("wall_tiles.how_many_to_show"), kind: "int", default: 4, min: 1, max: 10 },
    ],
  },
  {
    type: "camera",
    label: t("picture.camera"),
    icon: "camera-outline",
    blurb: t("wall_tiles.a_picture_from_a_camera"),
    defaultW: 6,
    defaultH: 4,
    options: [
      { key: "entity_id", label: t("picture.camera"), kind: "entity", default: "", domains: ["camera"] },
      { key: "refresh_s", label: t("wall_tiles.new_picture_every_seconds"), kind: "int", default: 10, min: 5, max: 300 },
    ],
  },
  {
    type: "note",
    label: t("wall_tiles.note"),
    icon: "note-text-outline",
    blurb: t("wall_tiles.some_words_you_write"),
    defaultW: 4,
    defaultH: 2,
    options: [
      { key: "text", label: t("wall_tiles.text"), kind: "text", default: "", long: true },
      { key: "big", label: t("wall_tiles.big_letters"), kind: "bool", default: false },
    ],
  },
];

/** The smallest size (columns, rows) a new tile of a type is made at. Others can shrink to one cell. */
const TILE_MIN_SIZE: Record<string, [number, number]> = { due_now: [3, 2] };

export function tileDef(type: string): TileDef | undefined {
  return TILE_DEFS().find((d) => d.type === type);
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
  // A tile never gets smaller than it can still be used at: "Due now" keeps its three buttons reachable.
  const [minW, minH] = TILE_MIN_SIZE[type] ?? [1, 1];
  if (columns < minW || rows < minH) return null; // the board is too small for it
  let w = Math.max(minW, Math.min(Math.round(((def?.defaultW ?? 2) * columns) / 16), columns));
  let h = Math.max(minH, Math.min(Math.round(((def?.defaultH ?? 2) * rows) / 9), rows));
  for (;;) {
    const spot = firstFit(others, columns, rows, w, h);
    if (spot) return { id: newLadderId(), type, ...spot, w, h, options };
    if (w <= minW && h <= minH) return null;
    if (w >= h ? w > minW : h <= minH) w -= 1; // shrink the longer side first, so the shape stays about the same
    else h -= 1;
  }
}

/** The tiles a new board starts with. */
export function starterTiles(columns = 16, rows = 9): Tile[] {
  const clock = newTile("clock", [], columns, rows)!;
  const due = newTile("due_now", [clock], columns, rows); // null when the board is too small for it
  return due ? [clock, due] : [clock];
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
