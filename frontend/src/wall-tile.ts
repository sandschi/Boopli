import { LitElement, css } from "lit";
import type { Hass, Snapshot, TileOptions, TileSize } from "./types";

/**
 * What every tile of the wall board has in common. A tile is one small element that draws one thing
 * (the clock, the pet, ...). It is given the live `hass`, the Boopli `snapshot`, the time `nowMs`
 * and its own `options`, and it draws nothing else. `preview` means it is shown in the editor: it
 * must not do anything when touched.
 *
 * To make a tile of your own: copy a small one (wall-tile-note.ts), register it in wall-tiles.ts.
 */
export class WallTile extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    nowMs: { type: Number },
    options: { attribute: false },
    size: { type: String },
    preview: { type: Boolean },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare options: TileOptions;
  declare size: TileSize;
  declare preview: boolean;

  constructor() {
    super();
    this.nowMs = Date.now();
    this.options = {};
    this.size = "small";
    this.preview = false;
  }

  /** An option as text, a number or a yes/no (the saved value, else the fallback). */
  protected text(key: string, fallback = ""): string {
    const v = this.options[key];
    return typeof v === "string" ? v : fallback;
  }
  protected num(key: string, fallback: number): number {
    const v = this.options[key];
    return typeof v === "number" ? v : fallback;
  }
  protected flag(key: string, fallback = false): boolean {
    const v = this.options[key];
    return typeof v === "boolean" ? v : fallback;
  }
}

/** The look every tile shares: a soft card, text that grows with the tile. */
export const wallTileStyles = css`
  :host {
    display: block;
    container-type: size; /* the text grows with the width and shrinks with the height of the tile */
    height: 100%;
    min-height: 0;
    overflow: hidden;
    color: var(--primary-text-color);
    background: var(--card-background-color, var(--primary-background-color));
    border: 1px solid var(--divider-color);
    border-radius: 18px;
    padding: 12px 14px;
    font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
  }
  :host([hidden]) {
    display: none;
  }
  * {
    box-sizing: border-box;
  }
  .label {
    color: var(--secondary-text-color);
    font-size: clamp(12px, 3.2cqw, 18px);
    margin-bottom: 4px;
  }
  .huge {
    font-size: clamp(24px, min(18cqw, 38cqh), 120px);
    font-weight: 300;
    line-height: 1.05;
  }
  .big {
    font-size: clamp(18px, min(8cqw, 16cqh), 56px);
    line-height: 1.15;
  }
  .normal {
    font-size: clamp(14px, min(4.4cqw, 9cqh), 26px);
    line-height: 1.3;
  }
  .small {
    font-size: clamp(12px, 3.2cqw, 18px);
  }
  .muted {
    color: var(--secondary-text-color);
  }
  .center {
    display: grid;
    place-items: center;
    height: 100%;
    text-align: center;
  }
  button {
    font: inherit;
    cursor: pointer;
    color: var(--primary-text-color);
    background: transparent;
    border: 1px solid var(--divider-color);
    border-radius: 14px;
    padding: 10px 16px;
    min-height: 52px;
    font-size: clamp(15px, 4.2cqw, 24px);
  }
  button.primary {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-primary-color, #fff);
    font-weight: 500;
  }
  button:disabled {
    opacity: 0.5;
  }
  .error {
    color: var(--error-color, #db4437);
    font-size: clamp(12px, 3.2cqw, 18px);
  }
`;
