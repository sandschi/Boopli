import { LitElement, css, nothing } from "lit";
import { html as shtml, unsafeStatic } from "lit/static-html.js";
import { html } from "lit";
import { buildToday } from "./today";
import { isNight } from "./wall-night";
import { pickBoard } from "./wall-tiles";
import "./wall-tiles";
import type { Board, Hass, Snapshot } from "./types";

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
    _awakeUntil: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare boardName: string;
  declare board?: Board; // a board to show as it is being edited (the preview)
  declare preview: boolean;
  declare _awakeUntil: number;

  private _lock?: { release(): Promise<void> };
  private _awakeTimer?: number;

  constructor() {
    super();
    this.nowMs = Date.now();
    this.boardName = "";
    this.preview = false;
    this._awakeUntil = 0;
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
      const wl = (navigator as Navigator & { wakeLock?: { request(t: "screen"): Promise<{ release(): Promise<void> }> } }).wakeLock;
      if (wl && !this._lock) this._lock = await wl.request("screen");
      this._lock && (this._lock as unknown as EventTarget).addEventListener?.("release", () => (this._lock = undefined));
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
    if (!this.snapshot || !board) return html`<div class="note">${this.snapshot ? "No board yet." : "Loading…"}</div>`;
    const tz = this.snapshot.time_zone;
    const dueNow = !this.preview && !!buildToday(this.snapshot, this.nowMs).now;
    const night =
      !this.preview &&
      board.night !== "off" &&
      isNight(this.snapshot.settings?.quiet_hours, this.nowMs || Date.now(), tz) &&
      !dueNow &&
      Date.now() >= this._awakeUntil;
    const down = !this.preview && this.hass?.connected === false;
    return html`<div class="wall ${night ? `night-${board.night}` : ""}" style="--cols:${board.columns}" @pointerdown=${this._wake}>
      <div class="grid">
        ${board.tiles.map(
          (t) =>
            shtml`<${unsafeStatic(`wall-tile-${t.type.replace(/_/g, "-")}`)}
              class="size-${t.size}"
              .hass=${this.hass}
              .snapshot=${this.snapshot}
              .nowMs=${this.nowMs}
              .options=${t.options}
              .size=${t.size}
              .preview=${this.preview}
            ></${unsafeStatic(`wall-tile-${t.type.replace(/_/g, "-")}`)}>`
        )}
      </div>
      ${night && board.night === "black" ? html`<div class="black">${this._time(tz)}</div>` : nothing}
      ${down ? html`<div class="down" role="status">Reconnecting to Home Assistant…</div>` : nothing}
      ${this.preview
        ? nothing
        : html`<div class="controls">
            <button type="button" aria-label="Full screen" @click=${this._fullscreen}>⛶</button>
            <button type="button" aria-label="Back to Boopli" @click=${() => this.dispatchEvent(new CustomEvent("wall-exit", { bubbles: true, composed: true }))}>✕</button>
          </div>`}
    </div>`;
  }

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
      color: var(--primary-text-color);
    }
    * {
      box-sizing: border-box;
    }
    .wall {
      position: relative;
      padding: 12px;
      background: var(--primary-background-color);
      min-height: 100%;
    }
    :host(:not([preview])) .wall {
      position: fixed;
      inset: 0;
      z-index: 99999;
      overflow: auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
      grid-auto-rows: minmax(150px, 1fr);
      grid-auto-flow: dense;
      gap: 12px;
      min-height: 100%;
      transition: filter 0.6s;
    }
    :host(:not([preview])) .grid {
      min-height: calc(100vh - 24px);
    }
    /* A tile never makes its row taller: the rows share the screen, and a tile's content has to fit. */
    .grid > * {
      contain: size;
      min-height: 0;
    }
    .size-wide {
      grid-column: span 2;
    }
    .size-tall {
      grid-row: span 2;
    }
    .size-big {
      grid-column: span 2;
      grid-row: span 2;
    }
    @media (max-width: 600px) {
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
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
