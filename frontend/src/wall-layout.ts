import type { Tile } from "./types";

/** The same limits as in engine.py. */
export const COLUMNS_MIN = 2;
export const COLUMNS_MAX = 32;
export const ROWS_MIN = 2;
export const ROWS_MAX = 18;

type Box = Pick<Tile, "x" | "y" | "w" | "h">;

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** The first row below every tile. */
export function bottom(tiles: Box[]): number {
  return tiles.reduce((m, t) => Math.max(m, t.y + t.h), 0);
}

/** The first column right of every tile. */
export function right(tiles: Box[]): number {
  return tiles.reduce((m, t) => Math.max(m, t.x + t.w), 0);
}

/**
 * Make the tiles fit without sitting on each other. The tile `movedId` (the one being dragged or
 * resized) stays where it is; any tile in its way is pushed down, below what it ran into, one after
 * the other from the top. Returns null when something would be pushed off the bottom of the board
 * (`rows`). The order of the list is kept.
 */
export function settle(tiles: Tile[], rows: number, movedId = ""): Tile[] | null {
  const out = tiles.map((t) => ({ ...t, options: t.options }));
  const fixed: Tile[] = [];
  const moved = out.find((t) => t.id === movedId);
  if (moved) fixed.push(moved);
  const rest = out.filter((t) => t !== moved).sort((a, b) => a.y - b.y || a.x - b.x);
  for (const t of rest) {
    for (;;) {
      const hit = fixed.filter((f) => overlaps(f, t));
      if (!hit.length) break;
      t.y = Math.max(...hit.map((f) => f.y + f.h));
    }
    if (t.y + t.h > rows) return null;
    fixed.push(t);
  }
  return out;
}

/** The first free spot for a tile of this size, reading left to right, top to bottom. Null: no room. */
export function firstFit(tiles: Tile[], columns: number, rows: number, w: number, h: number): { x: number; y: number } | null {
  w = Math.min(w, columns);
  for (let y = 0; y + h <= rows; y++) {
    for (let x = 0; x + w <= columns; x++) {
      if (!tiles.some((t) => overlaps({ x, y, w, h }, t))) return { x, y };
    }
  }
  return null;
}

/** Every cell twice as small (factor 2) or twice as big (factor 0.5), keeping the look. Null: it does not work out evenly. */
export function scaleTiles(tiles: Tile[], factor: 2 | 0.5): Tile[] | null {
  if (factor === 2) return tiles.map((t) => ({ ...t, x: t.x * 2, y: t.y * 2, w: t.w * 2, h: t.h * 2 }));
  if (tiles.some((t) => t.x % 2 || t.y % 2 || t.w % 2 || t.h % 2)) return null;
  return tiles.map((t) => ({ ...t, x: t.x / 2, y: t.y / 2, w: t.w / 2, h: t.h / 2 }));
}
