import { LitElement, css, nothing, unsafeCSS } from "lit";
import { BOOPLI_FONT } from "./fonts";
import { icon } from "./icon";
import { html as shtml, unsafeStatic } from "lit/static-html.js";
import { html } from "lit";
import { awayWhen } from "./boopli-away";
import { buildToday } from "./today";
import { isNight } from "./wall-night";
import { settle } from "./wall-layout";
import { pickBoard, tileDef } from "./wall-tiles";
import "./wall-tiles";
import type { Board, Hass, Snapshot, Tile } from "./types";
import { t } from "./i18n";

const AWAKE_MS = 30_000; // how long a tap keeps a dimmed board awake

/**
 * The wall board: a grid of tiles for a screen on the wall. It covers the whole screen (unless it is
 * a `preview` inside the board settings), keeps the screen awake, and at night (outside the hours
 * of nudging) dims or blacks out. A tap wakes it for a little while, and so does something being due.
 */
export class BoopliWall extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    nowMs: { type: Number },
    boardName: { type: String },
    board: { attribute: false },
    preview: { type: Boolean, reflect: true },
    pickable: { type: Boolean }, // in the editor: a tap on a tile picks it instead of using it
    selectedId: { type: String },
    _awakeUntil: { state: true },
    _live: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare boardName: string;
  declare board?: Board; // a board to show as it is being edited (the preview)
  declare preview: boolean;
  declare pickable: boolean;
  declare selectedId: string;
  declare _awakeUntil: number;
  declare _live: Tile[] | null; // the tiles as they are while one is being dragged or resized

  private _drag?: { id: string; bid: string; pid: number; mode: "move" | "resize"; gx: number; gy: number; x0: number; y0: number; moved: boolean };

  private _lock?: { release(): Promise<void> };
  private _awakeTimer?: number;

  constructor() {
    super();
    this.nowMs = Date.now();
    this.boardName = "";
    this.preview = false;
    this.pickable = false;
    this.selectedId = "";
    this._awakeUntil = 0;
    this._live = null;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.preview) return;
    void this._keepAwake();
    document.addEventListener("visibilitychange", this._onVisible);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this._onVisible);
    window.clearTimeout(this._awakeTimer);
    void this._lock?.release().catch(() => undefined);
    this._lock = undefined;
  }

  private _onVisible = (): void => {
    if (document.visibilityState === "visible") void this._keepAwake();
  };

  /** Ask the browser not to turn the screen off. Not every browser can; then the tablet's own setting rules. */
  private async _keepAwake(): Promise<void> {
    try {
      const wl = (navigator as Navigator & { wakeLock?: { request(tl: "screen"): Promise<{ release(): Promise<void> }> } }).wakeLock;
      if (!wl || this._lock) return;
      const sentinel = await wl.request("screen");
      if (!this.isConnected || this._lock) {
        // the wall was left while the request was on its way (or another one won): do not keep the screen on for nothing
        void sentinel.release().catch(() => undefined);
        return;
      }
      this._lock = sentinel;
      (sentinel as unknown as EventTarget).addEventListener?.("release", () => {
        if (this._lock === sentinel) this._lock = undefined;
      });
    } catch {
      /* the screen may still stay on by the device's own settings */
    }
  }

  private _wake = (): void => {
    this._awakeUntil = Date.now() + AWAKE_MS;
    window.clearTimeout(this._awakeTimer);
    this._awakeTimer = window.setTimeout(() => this.requestUpdate(), AWAKE_MS + 100);
  };

  private _board(): Board | undefined {
    return this.board ?? pickBoard(this.snapshot?.settings?.boards, this.boardName);
  }

  render() {
    const board = this._board();
    if (!this.snapshot || !board) {
      return html`<div class="note">${this.snapshot ? t("wall.no_board_yet_make_one_in") : t("common.loading")}</div>
        ${this.preview ? nothing : html`<div class="controls"><button type="button" aria-label=${t("wall.back_to_boopli")} @click=${() => this.dispatchEvent(new CustomEvent("wall-exit", { bubbles: true, composed: true }))}>✕</button></div>`}`;
    }
    const tz = this.snapshot.time_zone;
    const dueNow = !this.preview && !!buildToday(this.snapshot, this.nowMs).now;
    const night =
      !this.preview &&
      board.night !== "off" &&
      isNight(this.snapshot.settings?.quiet_hours, this.nowMs || Date.now(), tz) &&
      !dueNow &&
      Date.now() >= this._awakeUntil;
    const down = !this.preview && this.hass?.connected === false;
    const away = !this.preview && this.snapshot.away_now ? this.snapshot.away : null; // only while it is on, not while it is only planned
    return html`<div class="wall ${night ? `night-${board.night}` : ""}" @pointerdown=${this._wake}>
      ${away
        ? html`<div class="away" role="status">${icon("bag-suitcase")} <b>${t("wall.away_mode_is_on")}</b> <span>${awayWhen(away, this.nowMs, tz, true)}</span></div>`
        : nothing}
      <div class="stage">
      <div class="grid" style="--cols:${board.columns};--rows:${board.rows}" @pointerdown=${this._down} @pointermove=${this._move} @pointerup=${this._up} @pointercancel=${this._cancel}>
        ${this.pickable ? this._ghosts(board) : nothing}
        ${(this._live ?? board.tiles).filter((tl) => !!tileDef(tl.type)).map(
          (tl) =>
            html`<div
              class="cell ${this.selectedId === tl.id ? "selected" : ""} ${this._drag?.id === tl.id ? "dragging" : ""}"
              style="--x:${tl.x};--y:${tl.y};--w:${tl.w};--h:${tl.h}"
            >${shtml`<${unsafeStatic(`wall-tile-${tl.type.replace(/_/g, "-")}`)}
              .hass=${this.hass}
              .snapshot=${this.snapshot}
              .nowMs=${this.nowMs}
              .options=${tl.options}
              .preview=${this.preview}
            ></${unsafeStatic(`wall-tile-${tl.type.replace(/_/g, "-")}`)}>`}${this.pickable
              ? html`<button type="button" class="shield" data-id=${tl.id} aria-label=${t("wall.edit_this_tile", { replace: tl.type.replace(/_/g, " ") })} @click=${(e: MouseEvent) => e.detail === 0 && this._pick(tl.id)}></button>
                  <span class="handle" data-id=${tl.id} data-resize title=${t("wall.drag_to_resize")}></span>
                  <button type="button" class="del" aria-label=${t("wall.remove_this_tile")} title=${t("wall.remove_this_tile")} @click=${() => this.dispatchEvent(new CustomEvent("tile-remove", { detail: tl.id, bubbles: true, composed: true }))}>✕</button>`
              : nothing}</div>`
        )}
      </div>
      </div>
      ${night && board.night === "black" ? html`<div class="black">${this._time(tz)}</div>` : nothing}
      ${down ? html`<div class="down" role="status">${t("wall.reconnecting_to_home_assistant")}</div>` : nothing}
      ${this.preview
        ? nothing
        : html`<div class="controls">
            <button type="button" aria-label=${t("wall.edit_this_board")} title=${t("wall.edit_this_board")} @click=${() => this.dispatchEvent(new CustomEvent("wall-edit", { bubbles: true, composed: true }))}>${icon("pencil")}</button>
            <button type="button" aria-label=${t("wall.full_screen")} @click=${this._fullscreen}>${icon("fullscreen")}</button>
            <button type="button" aria-label=${t("wall.back_to_boopli")} @click=${() => this.dispatchEvent(new CustomEvent("wall-exit", { bubbles: true, composed: true }))}>✕</button>
          </div>`}
    </div>`;
  }

  // --- the grid in the editor: a visible grid, dragging and resizing ----------------------------------

  /** Faint empty cells behind the tiles, so you can see where things snap. */
  private _ghosts(board: Board) {
    const cells = [];
    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.columns; x++) {
        cells.push(html`<div class="ghost" style="grid-column:${x + 1};grid-row:${y + 1}"></div>`);
      }
    }
    return cells;
  }

  private _pick(id: string): void {
    this.dispatchEvent(new CustomEvent("tile-pick", { detail: id, bubbles: true, composed: true }));
  }

  private _cellAt(clientX: number, clientY: number): { cx: number; cy: number; cols: number; rows: number } | null {
    const grid = this.renderRoot.querySelector(".grid") as HTMLElement | null;
    const board = this._board();
    if (!grid || !board) return null;
    const cs = getComputedStyle(grid);
    const cols = cs.gridTemplateColumns.split(" ").map(parseFloat);
    const rows = cs.gridTemplateRows.split(" ").map(parseFloat);
    const gapX = parseFloat(cs.columnGap) || 0;
    const gapY = parseFloat(cs.rowGap) || 0;
    const r = grid.getBoundingClientRect();
    const scale = grid.offsetWidth ? r.width / grid.offsetWidth : 1; // the editor shows the board scaled down
    const find = (offset: number, tracks: number[], gap: number): number => {
      let start = 0;
      for (let i = 0; i < tracks.length; i++) {
        if (offset < start + tracks[i] + gap / 2) return i;
        start += tracks[i] + gap;
      }
      return tracks.length - 1;
    };
    return { cx: find((clientX - r.left) / scale, cols, gapX), cy: find((clientY - r.top) / scale, rows, gapY), cols: board.columns, rows: board.rows };
  }

  private _down = (e: PointerEvent): void => {
    if (!this.pickable || e.button > 0 || this._drag) return; // a second finger does not start or replace a drag
    const el = e.target as HTMLElement;
    const id = el.dataset?.id;
    const board = this._board();
    if (!id || !board) return;
    const tile = board.tiles.find((tl) => tl.id === id);
    const at = this._cellAt(e.clientX, e.clientY);
    if (!tile || !at) return;
    this._drag = { id, bid: board.id, pid: e.pointerId, mode: el.hasAttribute("data-resize") ? "resize" : "move", gx: at.cx - tile.x, gy: at.cy - tile.y, x0: e.clientX, y0: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  private _move = (e: PointerEvent): void => {
    const d = this._drag;
    const board = this._board();
    if (!d || !board || e.pointerId !== d.pid) return;
    if (board.id !== d.bid) {
      // the board was switched while the pointer is held: drop the drag, it must not land on the other board
      this._drag = undefined;
      this._live = null;
      return;
    }
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return; // still a tap
    d.moved = true;
    const at = this._cellAt(e.clientX, e.clientY);
    const orig = board.tiles.find((tl) => tl.id === d.id);
    if (!at || !orig) return;
    const moved: Tile =
      d.mode === "move"
        ? { ...orig, x: Math.max(0, Math.min(at.cx - d.gx, at.cols - orig.w)), y: Math.max(0, Math.min(at.cy - d.gy, at.rows - orig.h)) }
        : { ...orig, w: Math.max(1, Math.min(at.cx - orig.x + 1, at.cols - orig.x)), h: Math.max(1, Math.min(at.cy - orig.y + 1, at.rows - orig.y)) };
    const next = settle(board.tiles.map((tl) => (tl.id === d.id ? moved : tl)), board.rows, d.id);
    if (next) this._live = next; // null: it would not fit on the board, keep what was shown
  };

  private _up = (e: PointerEvent): void => {
    const d = this._drag;
    if (!d || e.pointerId !== d.pid) return; // only the finger that started the drag ends it
    this._drag = undefined;
    if (!d.moved) {
      this._pick(d.id);
      return;
    }
    const tiles = this._live;
    this._live = null;
    if (tiles && this._board()?.id === d.bid) this.dispatchEvent(new CustomEvent("tiles-change", { detail: tiles, bubbles: true, composed: true }));
  };

  private _cancel = (e: PointerEvent): void => {
    if (this._drag && e.pointerId !== this._drag.pid) return;
    this._drag = undefined;
    this._live = null;
  };

  private _time(tz: string): string {
    return new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(this.nowMs || Date.now()));
  }

  private _fullscreen = (): void => {
    const doc = document.documentElement;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void doc.requestFullscreen?.().catch(() => undefined);
  };

  static styles = css`
    :host {
      display: block;
      font-family: ${unsafeCSS(BOOPLI_FONT)};
      color: var(--primary-text-color);
    }
    * {
      box-sizing: border-box;
    }
    .wall {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 12px;
      background: var(--primary-background-color);
    }
    :host([preview]) {
      height: 100%;
    }
    :host(:not([preview])) .wall {
      position: fixed;
      inset: 0;
      z-index: 99999;
    }
    .away {
      flex: none;
      margin-bottom: 12px;
      padding: 6px 16px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--warning-color, #ffa600) 25%, var(--card-background-color, transparent));
      border: 1px solid var(--warning-color, #ffa600);
      font-size: 16px;
    }
    .away span {
      color: var(--secondary-text-color);
      margin-left: 8px;
    }
    /* The board is a fixed grid of square cells (columns by rows). It is as big as fits the screen, with
       nothing to scroll, so it looks the same on every display. */
    .stage {
      flex: 1;
      min-height: 0;
      container: stage / size;
      display: grid;
      place-items: center;
    }
    .grid {
      --gw: min(100cqw, calc(100cqh * var(--cols) / var(--rows)));
      width: var(--gw);
      aspect-ratio: var(--cols) / var(--rows);
      display: grid;
      grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
      grid-template-rows: repeat(var(--rows), minmax(0, 1fr));
      gap: calc(var(--gw) / var(--cols) / 10);
      transition: filter 0.6s;
    }
    .cell {
      position: relative;
      contain: size;
      min-height: 0;
      grid-column: calc(var(--x) + 1) / span var(--w);
      grid-row: calc(var(--y) + 1) / span var(--h);
    }
    .ghost {
      border: 1px dashed color-mix(in srgb, var(--divider-color) 70%, transparent);
      border-radius: 10%;
      min-height: 0;
    }
    .cell.dragging {
      z-index: 3;
      opacity: 0.9;
    }
    .handle {
      position: absolute;
      right: 4px;
      bottom: 4px;
      z-index: 2;
      width: 26px;
      height: 26px;
      border-radius: 8px;
      background: var(--boopli-accent, var(--primary-color));
      opacity: 0.8;
      cursor: nwse-resize;
      touch-action: none;
      clip-path: polygon(100% 0, 100% 100%, 0 100%);
    }
    .del {
      position: absolute;
      right: 6px;
      top: 6px;
      z-index: 2;
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: 50%;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color, #222);
      color: var(--error-color, #db4437);
      font-size: 14px;
      cursor: pointer;
    }
    .cell > :first-child {
      height: 100%;
    }
    .shield {
      position: absolute;
      inset: 0;
      z-index: 1;
      width: 100%;
      border: 2px dashed var(--boopli-accent, var(--primary-color));
      border-radius: 18px;
      background: transparent;
      cursor: pointer;
      opacity: 0.55;
      padding: 0;
      touch-action: none;
    }
    .shield:hover,
    .shield:focus-visible {
      opacity: 1;
      background: color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 12%, transparent);
    }
    .selected .shield {
      opacity: 1;
      border-style: solid;
      border-width: 4px;
      background: color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 15%, transparent);
    }
    .night-dim .grid {
      filter: brightness(0.3);
    }
    .night-black .grid {
      visibility: hidden;
    }
    .black {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: #000;
      color: #444;
      font-size: 14vmin;
      font-weight: 200;
    }
    .controls {
      position: fixed;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 6px;
      opacity: 0.35;
      z-index: 2;
    }
    .controls:hover,
    .controls:focus-within {
      opacity: 1;
    }
    .controls button {
      font: inherit;
      font-size: 20px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color, #222);
      color: var(--primary-text-color);
      cursor: pointer;
    }
    .down {
      position: fixed;
      left: 50%;
      bottom: 12px;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 999px;
      background: var(--warning-color, #ffa600);
      color: #000;
      z-index: 3;
    }
    .note {
      padding: 24px;
      color: var(--secondary-text-color);
    }
  `;
}
customElements.define("boopli-wall", BoopliWall);
