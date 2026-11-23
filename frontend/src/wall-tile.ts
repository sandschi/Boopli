import { LitElement, css, unsafeCSS } from "lit";
import { BOOPLI_FONT } from "./fonts";
import type { Hass, Snapshot, TileOptions } from "./types";

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
    preview: { type: Boolean },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare options: TileOptions;
  declare preview: boolean;

  constructor() {
    super();
    this.nowMs = Date.now();
    this.options = {};
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

/** The look every tile shares: no box, a thin line on top, text that grows with the tile. Same language as Today. */
export const wallTileStyles = css`
  :host {
    display: block;
    container-type: size; /* the text grows with the width and shrinks with the height of the tile */
    height: 100%;
    min-height: 0;
    overflow: hidden;
    color: var(--primary-text-color);
    background: none;
    border: 0;
    border-top: 3px solid var(--divider-color);
    border-radius: 0;
    padding: 12px 8px 0;
    font-family: ${unsafeCSS(BOOPLI_FONT)};
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
  /* The chunky button, like Done on Today: a thick darker edge that sinks when pressed. */
  button.primary {
    background: var(--boopli-accent, var(--primary-color));
    border: 0;
    border-bottom: 6px solid var(--boopli-accent-deep, #2a6e8a);
    border-radius: 16px;
    color: var(--boopli-accent-ink, var(--text-primary-color, #fff));
    font-weight: 600;
    transition: transform 0.08s, border-bottom-width 0.08s;
  }
  button.primary:active:not(:disabled) {
    transform: translateY(4px);
    border-bottom-width: 2px;
  }
  button:disabled {
    opacity: 0.5;
  }
  .error {
    color: var(--error-color, #db4437);
    font-size: clamp(12px, 3.2cqw, 18px);
  }
`;
