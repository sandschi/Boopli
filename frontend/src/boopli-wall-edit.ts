import { LitElement, css, html, nothing, unsafeCSS } from "lit";
import { BOOPLI_FONT } from "./fonts";
import { errorMessage, saveSettings } from "./api";
import "./boopli-wall";
import { entityIds, friendlyName, newLadderId } from "./helpers";
import { COLUMNS_MAX, COLUMNS_MIN, ROWS_MAX, ROWS_MIN, bottom, right, scaleTiles, settle } from "./wall-layout";
import { TILE_DEFS, boardLink, newTile, pickBoard, starterTiles, tileDef, type OptionField } from "./wall-tiles";
import { icon } from "./icon";
import type { Board, Hass, NightMode, Snapshot, Tile } from "./types";

const MAX_BOARDS = 10;
const MAX_TILES = 30;
const NAME_MAX = 40;

/** Any sort of entity a tile may show (a sensor, a switch, ...). */
const ANY_DOMAINS = [
  "sensor", "binary_sensor", "light", "switch", "input_boolean", "fan", "cover", "lock", "climate",
  "script", "scene", "button", "input_button", "automation", "person", "media_player",
];

const NIGHT_CHOICES: [NightMode, string][] = [
  ["dim", "Dim the screen"],
  ["black", "Black, with a small clock"],
  ["off", "Keep as it is"],
];

type View = "window" | "wide" | "tall";
const VIEWS: [View, string, string][] = [
  ["window", "This window", "Show the board in the shape of this window"],
  ["wide", "16:9", "A TV or a tablet lying down"],
  ["tall", "Upright", "A tablet hung upright (9:16)"],
];
/** The size of the screen each view stands for. The board is drawn at that size and then scaled down to fit, so it looks exactly as it will. */
const SCREEN: Record<Exclude<View, "window">, [number, number]> = {
  wide: [1280, 720],
  tall: [720, 1280],
};

type Modal = "" | "tile" | "board" | "add";

/**
 * Edit mode of the wall board, like the pencil on a Home Assistant dashboard. The real board is shown
 * as it will look (the same grid of square cells, scaled to fit); drag a tile to move it, drag its corner
 * to resize it, tap it to change its settings in a window. Nothing is saved until Save. What each type
 * of tile can be set to comes from wall-tiles.ts.
 */
export class BoopliWallEdit extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    nowMs: { type: Number },
    boardName: { type: String },
    _boards: { state: true },
    _id: { state: true },
    _sel: { state: true },
    _modal: { state: true },
    _view: { state: true },
    _busy: { state: true },
    _error: { state: true },
    _askDiscard: { state: true },
    _stage: { state: true },
    _win: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare boardName: string;
  declare _boards: Board[] | null; // the boards as they are being edited (null until loaded)
  declare _id: string; // the board being edited
  declare _sel: string; // the picked tile
  declare _modal: Modal;
  declare _view: View;
  declare _busy: boolean;
  declare _error: string;
  declare _askDiscard: boolean;
  declare _stage: [number, number]; // the room the board has, in pixels
  declare _win: [number, number]; // the size of this window: what the real wall screen is

  private _base = "";
  private _ro?: ResizeObserver;

  constructor() {
    super();
    this.nowMs = Date.now();
    this.boardName = "";
    this._boards = null;
    this._id = "";
    this._sel = "";
    this._modal = "";
    this._view = "window";
    this._busy = false;
    this._error = "";
    this._askDiscard = false;
    this._stage = [0, 0];
    this._win = [window.innerWidth, window.innerHeight];
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("resize", this._onResize);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._onResize);
    this._ro?.disconnect();
    this._ro = undefined;
  }

  private _onResize = (): void => {
    this._win = [window.innerWidth, window.innerHeight];
  };

  protected willUpdate(): void {
    if (!this.snapshot?.settings) return;
    const latest = this.snapshot.settings.boards ?? [];
    if (this._boards && (this._dirty || JSON.stringify(latest) === this._base)) return;
    // The first load, or the boards changed on the server before anything was edited here (a board that
    // was only just saved reaches the panel a moment later): start from the latest.
    const boards = structuredClone(latest);
    const keep = this._boards ? this._id : "";
    this._base = JSON.stringify(boards);
    this._boards = boards;
    this._id = (keep && boards.find((b) => b.id === keep)?.id) || pickBoard(boards, this.boardName)?.id || boards[0]?.id || "";
  }

  /**
   * The boards to save: the latest ones from the server, with only what was changed in this editing
   * session applied (boards changed, added or deleted here). A board changed somewhere else in the
   * meantime is kept as it is.
   */
  private _merged(latest: Board[]): Board[] {
    const draft = this._boards ?? [];
    const was = new Map((JSON.parse(this._base) as Board[]).map((b) => [b.id, b]));
    const base = new Map([...was].map(([id, b]) => [id, JSON.stringify(b)]));
    const mine = new Map(draft.map((b) => [b.id, b]));
    const out: Board[] = [];
    for (const b of latest) {
      const my = mine.get(b.id);
      if (!base.has(b.id)) out.push(b); // made elsewhere meanwhile
      else if (!my) continue; // deleted here
      else if (JSON.stringify(my) === base.get(b.id)) out.push(b); // not changed here
      else {
        // changed here: take what was changed here, and keep what was changed elsewhere in the other parts
        const was0 = was.get(b.id)!;
        const merged: Board = { ...b };
        for (const key of ["name", "columns", "rows", "night", "tiles"] as const) {
          if (JSON.stringify(my[key]) !== JSON.stringify(was0[key])) (merged as unknown as Record<string, unknown>)[key] = my[key];
        }
        out.push(merged);
      }
    }
    for (const b of draft) if (!latest.some((l) => l.id === b.id) && !base.has(b.id)) out.push(b); // added here
    return structuredClone(out);
  }

  protected updated(): void {
    if (!this._ro) this._watchStage(); // the stage is there once the boards are loaded
    // the windows are native modal dialogs: they keep the keyboard inside, make the board behind inert,
    // close on Escape and give the focus back to the button that opened them
    const dialog = this.renderRoot.querySelector("dialog.modal") as HTMLDialogElement | null;
    if (dialog) {
      if (this._modal && !dialog.open) dialog.showModal();
      else if (!this._modal && dialog.open) dialog.close();
    }
  }

  private _watchStage(): void {
    const stage = this.renderRoot.querySelector(".stage") as HTMLElement | null;
    if (!stage) return;
    this._ro = new ResizeObserver(() => {
      const w = Math.max(0, stage.clientWidth - 24);
      const h = Math.max(0, stage.clientHeight - 24);
      if (w !== this._stage[0] || h !== this._stage[1]) this._stage = [w, h];
    });
    this._ro.observe(stage);
  }

  private get _cur(): Board | undefined {
    return this._boards?.find((b) => b.id === this._id) ?? this._boards?.[0];
  }

  private get _dirty(): boolean {
    return !!this._boards && JSON.stringify(this._boards) !== this._base;
  }

  private get _tile(): Tile | undefined {
    return this._cur?.tiles.find((t) => t.id === this._sel);
  }

  /** The size of the screen the board is shown for. */
  private _screen(): [number, number] {
    return this._view === "window" ? this._win : SCREEN[this._view];
  }

  /** Change the board being edited. */
  private _edit(change: (b: Board) => void): void {
    const cur = this._cur;
    if (!cur || !this._boards) return;
    const boards = structuredClone(this._boards);
    const b = boards.find((x) => x.id === cur.id);
    if (b) change(b);
    this._boards = boards;
    this._error = "";
  }

  private _editTile(change: (t: Tile, b: Board, index: number) => void): void {
    this._edit((b) => {
      const index = b.tiles.findIndex((t) => t.id === this._sel);
      if (index >= 0) change(b.tiles[index], b, index);
    });
  }

  // --- the board ---------------------------------------------------------------------

  /** A tap on a tile: tiles with settings open them in a window, the others are just picked. */
  private _pick(e: CustomEvent<string>): void {
    this._sel = e.detail;
    const type = this._cur?.tiles.find((t) => t.id === e.detail)?.type ?? "";
    this._modal = tileDef(type)?.options.length ? "tile" : "";
  }

  private _uniqueName(base: string): string {
    const names = new Set((this._boards ?? []).map((b) => b.name.toLowerCase()));
    if (!names.has(base.toLowerCase())) return base;
    let n = 2;
    while (names.has(`${base} ${n}`.toLowerCase())) n += 1;
    return `${base} ${n}`;
  }

  private _newBoard(): void {
    if (!this._boards || this._boards.length >= MAX_BOARDS) return;
    const board: Board = {
      id: newLadderId(),
      name: this._uniqueName("My board"),
      columns: 16,
      rows: 9,
      night: "dim",
      tiles: starterTiles(16, 9),
    };
    this._boards = [...this._boards, board];
    this._id = board.id;
    this._sel = "";
  }

  private _deleteBoard(): void {
    const cur = this._cur;
    if (!cur || !this._boards || this._boards.length < 2) return;
    this._boards = this._boards.filter((b) => b.id !== cur.id);
    this._id = this._boards[0].id;
    this._sel = "";
    this._modal = "";
  }

  private _addTile(type: string): void {
    const cur = this._cur;
    if (!cur) return;
    if (cur.tiles.length >= MAX_TILES) {
      this._error = `A board can have ${MAX_TILES} tiles at most.`;
      this._modal = "";
      return;
    }
    const tile = newTile(type, cur.tiles, cur.columns, cur.rows);
    if (!tile) {
      this._error = "Every cell of this board is taken. Make the grid bigger or remove a tile.";
      this._modal = "";
      return;
    }
    this._edit((b) => b.tiles.push(tile));
    this._sel = tile.id;
    this._modal = tileDef(type)?.options.length ? "tile" : ""; // straight to its settings
  }

  private _remove(id = this._sel): void {
    this._edit((b) => (b.tiles = b.tiles.filter((t) => t.id !== id)));
    if (id === this._sel) this._sel = "";
    this._modal = "";
  }

  private _setOption(key: string, value: string | number | boolean): void {
    this._editTile((t) => (t.options[key] = value));
  }

  /** Set the width or height of the picked tile; the tiles in the way are pushed down. Returns what it is now. */
  private _resize(w: number, h: number): void {
    const cur = this._cur;
    const tile = this._tile;
    if (!cur || !tile) return;
    const next = settle(
      cur.tiles.map((t) => (t.id === tile.id ? { ...t, w: Math.max(1, Math.min(w, cur.columns - t.x)), h: Math.max(1, Math.min(h, cur.rows - t.y)) } : t)),
      cur.rows,
      tile.id
    );
    if (!next) {
      this._error = "There is no room for that.";
      return;
    }
    this._edit((b) => (b.tiles = next));
  }

  // --- the grid of the board ----------------------------------------------------------

  /** Set how many cells wide and tall the board is. Refused while a tile reaches further. Returns what is set. */
  private _setGrid(columns: number, rows: number): { columns: number; rows: number } {
    const cur = this._cur;
    if (!cur) return { columns, rows };
    const c = Math.max(COLUMNS_MIN, Math.min(COLUMNS_MAX, columns));
    const r = Math.max(ROWS_MIN, Math.min(ROWS_MAX, rows));
    const needC = right(cur.tiles);
    const needR = bottom(cur.tiles);
    if (c < needC || r < needR) {
      this._error = `Some tiles reach to column ${needC} and row ${needR}. Move or shrink them first.`;
      return { columns: cur.columns, rows: cur.rows };
    }
    this._edit((b) => {
      b.columns = c;
      b.rows = r;
    });
    return { columns: c, rows: r };
  }

  /** Cells twice as small (finer) or twice as big (coarser), keeping the look of the board. */
  private _scaleGrid(finer: boolean): void {
    const cur = this._cur;
    if (!cur) return;
    const f = finer ? 2 : 0.5;
    const columns = cur.columns * f;
    const rows = cur.rows * f;
    const tiles = scaleTiles(cur.tiles, f);
    if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < COLUMNS_MIN || rows < ROWS_MIN || columns > COLUMNS_MAX || rows > ROWS_MAX) {
      this._error = finer ? `${COLUMNS_MAX} by ${ROWS_MAX} is the finest grid.` : "This grid cannot be made coarser evenly.";
      return;
    }
    if (!tiles) {
      this._error = "Some tiles do not line up with a coarser grid. Move or resize them first.";
      return;
    }
    this._edit((b) => {
      b.columns = columns;
      b.rows = rows;
      b.tiles = tiles;
    });
  }

  /** Rows that make the cells square on the screen shown (for the columns the board has). */
  private _matchScreen(): void {
    const cur = this._cur;
    if (!cur) return;
    const [sw, sh] = this._screen();
    this._setGrid(cur.columns, Math.round((cur.columns * sh) / sw));
  }

  // --- leave ---------------------------------------------------------------------------

  private _exit(name: string): void {
    this.dispatchEvent(new CustomEvent("wall-edit-exit", { detail: name, bubbles: true, composed: true }));
  }

  /** The name the board being edited has on the server (not a new name typed here, nor a board that was only made here). */
  private _savedName(): string {
    const saved = JSON.parse(this._base) as Board[];
    return (saved.find((b) => b.id === this._id) ?? saved[0])?.name ?? this.boardName;
  }

  private _cancel(): void {
    if (this._dirty && !this._askDiscard) {
      this._askDiscard = true;
      return;
    }
    this._exit(this._savedName());
  }

  private async _save(): Promise<void> {
    const settings = this.snapshot?.settings;
    if (!this.hass || !settings || !this._boards || this._busy) return;
    this._busy = true;
    this._error = "";
    this._askDiscard = false;
    try {
      await saveSettings(this.hass, { ...settings, boards: this._merged(settings.boards ?? []) });
      this._exit(this._cur?.name ?? "");
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  // --- the pieces ---------------------------------------------------------------------

  /** A number field; `set` returns the value that was really set, which is shown. */
  private _numField(id: string, label: string, value: number, min: number, max: number, set: (n: number) => number | void) {
    return html`<div class="field">
      <label for=${id}>${label}</label>
      <input id=${id} type="number" min=${min} max=${max} .value=${String(value)} @change=${(e: Event) => {
        const input = e.target as HTMLInputElement;
        const n = Math.round(Number(input.value));
        const kept = input.value.trim() === "" || Number.isNaN(n) ? value : Math.min(max, Math.max(min, n));
        const applied = set(kept);
        input.value = String(applied ?? kept);
      }} />
    </div>`;
  }

  private _renderField(tile: Tile, f: OptionField) {
    const value = tile.options[f.key] ?? f.default;
    const id = `f-${tile.id}-${f.key}`;
    switch (f.kind) {
      case "bool":
        return html`<label class="inline"><input type="checkbox" .checked=${value === true} @change=${(e: Event) => this._setOption(f.key, (e.target as HTMLInputElement).checked)} /> ${f.label}</label>`;
      case "choice":
        return html`<div class="field"><label for=${id}>${f.label}</label>
          <select id=${id} @change=${(e: Event) => this._setOption(f.key, (e.target as HTMLSelectElement).value)}>
            ${(f.choices ?? []).map(([v, l]) => html`<option value=${v} ?selected=${value === v}>${l}</option>`)}
          </select></div>`;
      case "int":
        return this._numField(id, f.label, Number(value), f.min ?? 0, f.max ?? 999, (n) => {
          this._setOption(f.key, n);
        });
      case "entity": {
        const ids = entityIds(this.hass, f.domains ?? ANY_DOMAINS);
        const list = `dl-${tile.id}-${f.key}`;
        return html`<div class="field"><label for=${id}>${f.label}</label>
          <input id=${id} list=${list} placeholder="Start typing a name…" .value=${String(value)}
            @change=${(e: Event) => this._setOption(f.key, (e.target as HTMLInputElement).value.trim())} />
          <datalist id=${list}>${ids.map((e) => html`<option value=${e}>${friendlyName(this.hass, e)}</option>`)}</datalist>
          ${value && !this.hass?.states[String(value)] ? html`<div class="error small">${value} was not found.</div>` : nothing}</div>`;
      }
      default:
        return html`<div class="field"><label for=${id}>${f.label}</label>
          ${f.long
            ? html`<textarea id=${id} rows="3" maxlength="300" .value=${String(value)} @change=${(e: Event) => this._setOption(f.key, (e.target as HTMLTextAreaElement).value)}></textarea>`
            : html`<input id=${id} maxlength=${NAME_MAX} .value=${String(value)} @change=${(e: Event) => this._setOption(f.key, (e.target as HTMLInputElement).value)} />`}</div>`;
    }
  }

  private _renderTileModal(cur: Board) {
    const tile = this._tile;
    if (!tile) return nothing;
    const def = tileDef(tile.type);
    return html`
      <div class="mhead"><h2>${icon(def?.icon ?? "shape-outline")} ${def?.label ?? tile.type}</h2></div>
      ${def?.options.length ? html`<div class="opts">${def.options.map((f) => this._renderField(tile, f))}</div>` : nothing}
      <div class="srow">
        ${this._numField("tw", "Cells wide", tile.w, 1, cur.columns - tile.x, (n) => {
          this._resize(n, tile.h);
          return this._tile?.w; // what it is now (the old width when there was no room)
        })}
        ${this._numField("th", "Cells tall", tile.h, 1, cur.rows - tile.y, (n) => {
          this._resize(tile.w, n);
          return this._tile?.h;
        })}
      </div>
      <div class="mfoot">
        <button class="danger" @click=${() => this._remove()}>Remove this tile</button>
        <span class="spacer"></span>
        <button class="primary" @click=${() => (this._modal = "")}>Done</button>
      </div>
    `;
  }

  private _renderBoardModal(cur: Board) {
    return html`
      <div class="mhead"><h2>${icon("monitor-dashboard")} This board</h2></div>
      <div class="field">
        <label for="bname">Name</label>
        <input id="bname" maxlength=${NAME_MAX} .value=${cur.name} @change=${(e: Event) => this._edit((b) => (b.name = (e.target as HTMLInputElement).value.trim()))} />
      </div>
      <div class="srow">
        ${this._numField("bcols", "Columns", cur.columns, COLUMNS_MIN, COLUMNS_MAX, (n) => this._setGrid(n, cur.rows).columns)}
        ${this._numField("brows", "Rows", cur.rows, ROWS_MIN, ROWS_MAX, (n) => this._setGrid(cur.columns, n).rows)}
        <button title="Choose the rows that make the cells square on the screen shown" @click=${() => this._matchScreen()}>Match this screen</button>
      </div>
      <div class="srow">
        <button @click=${() => this._scaleGrid(true)}>Finer grid (cells half as big)</button>
        <button @click=${() => this._scaleGrid(false)}>Coarser grid (cells twice as big)</button>
      </div>
      <p class="muted small">The board is a grid of square cells, scaled to fit the screen. 16 by 9 fits a TV or a tablet lying down.</p>
      <div class="field">
        <label for="bnight">At night</label>
        <select id="bnight" @change=${(e: Event) => this._edit((b) => (b.night = (e.target as HTMLSelectElement).value as NightMode))}>
          ${NIGHT_CHOICES.map(([v, l]) => html`<option value=${v} ?selected=${cur.night === v}>${l}</option>`)}
        </select>
      </div>
      <p class="muted small">Night is when quiet hours are on and it is outside the hours of nudging. A tap wakes the board for 30 seconds. While away mode is on, a slim bar shows at the top of the wall. It is not shown here.</p>
      <p class="small">Link for the tablet's start page: <code>${boardLink(cur)}</code> (after you save)</p>
      <div class="mfoot">
        <button ?disabled=${(this._boards?.length ?? 0) >= MAX_BOARDS} @click=${() => this._newBoard()}>+ New board</button>
        <button class="danger" ?disabled=${(this._boards?.length ?? 0) < 2} @click=${() => this._deleteBoard()}>Delete this board</button>
        <span class="spacer"></span>
        <button class="primary" @click=${() => (this._modal = "")}>Done</button>
      </div>
    `;
  }

  private _renderAddModal() {
    return html`
      <div class="mhead"><h2>＋ Add a tile</h2></div>
      <div class="adds" role="group" aria-label="Add a tile">
        ${TILE_DEFS.map((d) => html`<button class="addtile" @click=${() => this._addTile(d.type)}><span class="emoji">${icon(d.icon)}</span><b>${d.label}</b><span class="muted small">${d.blurb}</span></button>`)}
      </div>
      <div class="mfoot"><span class="spacer"></span><button @click=${() => (this._modal = "")}>Cancel</button></div>
    `;
  }

  render() {
    const cur = this._cur;
    if (!this._boards || !cur) return html`<div class="load">Loading…</div>`;
    const [sw, sh] = this._screen();
    const scale = this._stage[0] > 0 && this._stage[1] > 0 ? Math.min(1, this._stage[0] / sw, this._stage[1] / sh) : 1;
    return html`
      <div class="edit">
        <div class="bar" role="toolbar" aria-label="Edit the wall board" ?inert=${this._busy}>
          <label class="pick">
            <span class="muted small">Board</span>
            <select aria-label="Board" @change=${(e: Event) => { this._id = (e.target as HTMLSelectElement).value; this._sel = ""; this._modal = ""; }}>
              ${this._boards.map((b) => html`<option value=${b.id} ?selected=${b.id === cur.id}>${b.name || "(no name)"}</option>`)}
            </select>
          </label>
          <button @click=${() => (this._modal = "board")}>${icon("cog-outline")} Board</button>
          <button @click=${() => (this._modal = "add")}>＋ Add tile</button>
          <div class="views" role="group" aria-label="Show it as">
            ${VIEWS.map(([v, label, tip]) => html`<button class=${this._view === v ? "on" : ""} title=${tip} aria-pressed=${this._view === v} @click=${() => (this._view = v)}>${label}</button>`)}
          </div>
          <span class="hint muted small">Drag to move · drag the corner to resize · tap to change · ✕ to remove</span>
          <span class="spacer"></span>
          ${this._askDiscard
            ? html`<span class="small">Throw away your changes?</span>
                <button class="danger" @click=${() => this._exit(this._savedName())}>Yes, discard</button>
                <button @click=${() => (this._askDiscard = false)}>Keep editing</button>`
            : html`<button ?disabled=${this._busy} @click=${() => this._cancel()}>Cancel</button>
                <button class="primary" ?disabled=${this._busy || !this._dirty} @click=${() => this._save()}>${this._busy ? "Saving…" : "Save"}</button>`}
        </div>
        <div class="stage" ?inert=${this._busy}>
          <div class="slot" style="width:${sw * scale}px;height:${sh * scale}px">
            <div class="frame" style="width:${sw}px;height:${sh}px;transform:scale(${scale})">
              <boopli-wall
                preview
                pickable
                .board=${cur}
                .selectedId=${this._sel}
                .hass=${this.hass}
                .snapshot=${this.snapshot}
                .nowMs=${this.nowMs}
                @tile-pick=${(e: Event) => this._pick(e as CustomEvent<string>)}
                @tile-remove=${(e: Event) => this._remove((e as CustomEvent<string>).detail)}
                @tiles-change=${(e: Event) => this._edit((b) => (b.tiles = (e as CustomEvent<Tile[]>).detail))}
              ></boopli-wall>
            </div>
          </div>
        </div>
        ${this._error && !this._modal ? html`<div class="toast" role="alert">${this._error} <button @click=${() => (this._error = "")}>OK</button></div>` : nothing}
        <dialog
          class="modal"
          aria-label="Edit the board"
          ?inert=${this._busy}
          @close=${() => {
            if (this._modal) this._modal = ""; // closed with Escape
          }}
          @click=${(e: Event) => e.target === e.currentTarget && (this._modal = "")}
        >
          <div class="box">
            ${this._modal === "tile" ? this._renderTileModal(cur) : this._modal === "board" ? this._renderBoardModal(cur) : this._modal === "add" ? this._renderAddModal() : nothing}
            ${this._error && this._modal ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
          </div>
        </dialog>
      </div>
    `;
  }

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: block;
      color: var(--primary-text-color);
      background: var(--primary-background-color);
      font-family: ${unsafeCSS(BOOPLI_FONT)};
    }
    * {
      box-sizing: border-box;
    }
    .load {
      padding: 24px;
    }
    .edit {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .bar {
      flex: none;
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--divider-color);
      background: var(--card-background-color, var(--primary-background-color));
    }
    .pick {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .views {
      display: flex;
      gap: 0;
    }
    .views button {
      border-radius: 0;
      margin-left: -1px;
    }
    .views button:first-child {
      border-radius: 8px 0 0 8px;
      margin-left: 0;
    }
    .views button:last-child {
      border-radius: 0 8px 8px 0;
    }
    .hint {
      align-self: center;
    }
    @media (max-width: 1100px) {
      .hint {
        display: none;
      }
    }
    .spacer {
      flex: 1;
    }
    button {
      font: inherit;
      min-height: 40px;
      padding: 6px 14px;
      color: var(--primary-text-color);
      background: transparent;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      cursor: pointer;
    }
    button.on {
      border-color: var(--boopli-accent, var(--primary-color));
      background: color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 18%, transparent);
    }
    button.primary {
      background: var(--boopli-accent, var(--primary-color));
      border-color: var(--boopli-accent, var(--primary-color));
      color: var(--text-primary-color, #fff);
    }
    button.danger {
      color: var(--error-color, #db4437);
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .stage {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      padding: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .slot {
      flex: none;
      position: relative;
      outline: 1px solid var(--divider-color);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    }
    .frame {
      position: absolute;
      left: 0;
      top: 0;
      transform-origin: 0 0;
      overflow: hidden;
    }
    dialog.modal {
      width: min(600px, calc(100vw - 24px));
      max-height: 90vh;
      padding: 0;
      overflow: auto;
      border-radius: 16px;
      background: var(--card-background-color, var(--primary-background-color));
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
    }
    dialog.modal::backdrop {
      background: rgba(0, 0, 0, 0.55);
    }
    .box {
      padding: 16px 18px;
    }
    .mhead h2 {
      margin: 0 0 10px;
      font-size: 22px;
    }
    .mfoot,
    .srow {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 8px;
      margin: 10px 0 0;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 6px;
    }
    .field label,
    label.inline {
      font-size: 15px;
      color: var(--secondary-text-color);
    }
    label.inline {
      display: flex;
      gap: 8px;
      align-items: center;
      margin: 6px 0;
    }
    input:not([type="checkbox"]),
    select,
    textarea {
      font: inherit;
      padding: 8px 10px;
      min-height: 40px;
      color: var(--primary-text-color);
      background: var(--card-background-color, transparent);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      max-width: 100%;
    }
    .opts {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
      gap: 4px 12px;
    }
    .adds {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
      gap: 8px;
    }
    .addtile {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      text-align: left;
      padding: 10px 12px;
    }
    .addtile .emoji {
      font-size: 22px;
    }
    .muted {
      color: var(--secondary-text-color);
    }
    .small {
      font-size: 15px;
    }
    .error {
      color: var(--error-color, #db4437);
    }
    /* A notice that floats over everything, so the board does not move when it appears. */
    .toast {
      position: fixed;
      left: 50%;
      bottom: 16px;
      transform: translateX(-50%);
      z-index: 7;
      max-width: min(640px, calc(100vw - 24px));
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 8px 8px 16px;
      border-radius: 12px;
      background: var(--error-color, #db4437);
      color: #fff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
    .toast button {
      color: #fff;
      border-color: #fff;
      min-height: 34px;
    }
    code {
      word-break: break-all;
    }
  `;
}
customElements.define("boopli-wall-edit", BoopliWallEdit);
