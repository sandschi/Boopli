import { LitElement, css, html, nothing } from "lit";
import { errorMessage, saveSettings } from "./api";
import "./boopli-wall";
import { entityIds, friendlyName, newLadderId } from "./helpers";
import { TILE_DEFS, TILE_SIZE_LABEL, boardLink, newTile, pickBoard, tileDef, type OptionField } from "./wall-tiles";
import type { Board, Hass, NightMode, Snapshot, Tile, TileSize } from "./types";

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

type View = "wall" | "tablet" | "phone";
const VIEWS: [View, string, string][] = [
  ["wall", "Wall", "The whole screen"],
  ["tablet", "Tablet", "A tablet held upright (768 wide)"],
  ["phone", "Phone", "A phone (375 wide)"],
];
const FRAME: Record<View, { w: string; h: string }> = {
  wall: { w: "100%", h: "100%" },
  tablet: { w: "768px", h: "1024px" },
  phone: { w: "375px", h: "812px" },
};

type Sheet = "" | "tile" | "board" | "add";

/**
 * Edit mode of the wall board, like the pencil on a Home Assistant dashboard. The real board is shown
 * as it will look; a tap on a tile picks it and a sheet at the bottom changes its size, place and
 * settings. Nothing is saved until Save. What each type of tile can be set to comes from wall-tiles.ts.
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
    _sheet: { state: true },
    _view: { state: true },
    _busy: { state: true },
    _error: { state: true },
    _askDiscard: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare boardName: string;
  declare _boards: Board[] | null; // the boards as they are being edited (null until loaded)
  declare _id: string; // the board being edited
  declare _sel: string; // the picked tile
  declare _sheet: Sheet;
  declare _view: View;
  declare _busy: boolean;
  declare _error: string;
  declare _askDiscard: boolean;

  private _base = "";

  constructor() {
    super();
    this.nowMs = Date.now();
    this.boardName = "";
    this._boards = null;
    this._id = "";
    this._sel = "";
    this._sheet = "";
    this._view = "wall";
    this._busy = false;
    this._error = "";
    this._askDiscard = false;
  }

  protected willUpdate(): void {
    if (this._boards || !this.snapshot?.settings) return;
    const boards = structuredClone(this.snapshot.settings.boards ?? []);
    this._base = JSON.stringify(boards);
    this._boards = boards;
    this._id = pickBoard(boards, this.boardName)?.id ?? boards[0]?.id ?? "";
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

  private _pick(e: CustomEvent<string>): void {
    this._sel = e.detail;
    this._sheet = "tile";
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
      columns: 4,
      night: "dim",
      tiles: [newTile("clock"), newTile("due_now")],
    };
    this._boards = [...this._boards, board];
    this._id = board.id;
    this._sel = "";
    this._sheet = "board";
  }

  private _deleteBoard(): void {
    const cur = this._cur;
    if (!cur || !this._boards || this._boards.length < 2) return;
    this._boards = this._boards.filter((b) => b.id !== cur.id);
    this._id = this._boards[0].id;
    this._sel = "";
    this._sheet = "";
  }

  private _addTile(type: string): void {
    const cur = this._cur;
    if (!cur) return;
    if (cur.tiles.length >= MAX_TILES) {
      this._error = `A board can have ${MAX_TILES} tiles at most.`;
      return;
    }
    const tile = newTile(type);
    this._edit((b) => b.tiles.push(tile));
    this._sel = tile.id;
    this._sheet = "tile"; // straight to its settings
  }

  private _move(by: -1 | 1): void {
    this._editTile((_t, b, i) => {
      const to = i + by;
      if (to < 0 || to >= b.tiles.length) return;
      [b.tiles[i], b.tiles[to]] = [b.tiles[to], b.tiles[i]];
    });
  }

  private _remove(): void {
    this._edit((b) => (b.tiles = b.tiles.filter((t) => t.id !== this._sel)));
    this._sel = "";
    this._sheet = "";
  }

  private _setOption(key: string, value: string | number | boolean): void {
    this._editTile((t) => (t.options[key] = value));
  }

  // --- leave ---------------------------------------------------------------------------

  private _exit(name: string): void {
    this.dispatchEvent(new CustomEvent("wall-edit-exit", { detail: name, bubbles: true, composed: true }));
  }

  private _cancel(): void {
    if (this._dirty && !this._askDiscard) {
      this._askDiscard = true;
      return;
    }
    this._exit(this._cur?.name ?? this.boardName);
  }

  private async _save(): Promise<void> {
    const settings = this.snapshot?.settings;
    if (!this.hass || !settings || !this._boards || this._busy) return;
    this._busy = true;
    this._error = "";
    this._askDiscard = false;
    try {
      await saveSettings(this.hass, { ...settings, boards: structuredClone(this._boards) });
      this._exit(this._cur?.name ?? "");
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  // --- the pieces ---------------------------------------------------------------------

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
        return html`<div class="field"><label for=${id}>${f.label}</label>
          <input id=${id} type="number" min=${f.min ?? 0} max=${f.max ?? 999} .value=${String(value)}
            @change=${(e: Event) => {
              const input = e.target as HTMLInputElement;
              const n = Math.round(Number(input.value));
              const kept = input.value.trim() === "" || Number.isNaN(n) ? Number(value) : Math.min(f.max ?? 999, Math.max(f.min ?? 0, n));
              input.value = String(kept);
              this._setOption(f.key, kept);
            }} /></div>`;
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

  private _renderTileSheet(cur: Board) {
    const tile = this._tile;
    if (!tile) return html`<p class="muted">Tap a tile on the board to change it.</p>`;
    const def = tileDef(tile.type);
    const index = cur.tiles.findIndex((t) => t.id === tile.id);
    return html`
      <div class="shead">
        <b>${def?.emoji ?? "◻️"} ${def?.label ?? tile.type}</b>
        <span class="spacer"></span>
        <button class="chip" aria-label="Close" @click=${() => { this._sheet = ""; this._sel = ""; }}>Done</button>
      </div>
      <div class="srow">
        <div class="field">
          <label for="tsize">Size</label>
          <select id="tsize" @change=${(e: Event) => this._editTile((t) => (t.size = (e.target as HTMLSelectElement).value as TileSize))}>
            ${(Object.keys(TILE_SIZE_LABEL) as TileSize[]).map((s) => html`<option value=${s} ?selected=${tile.size === s}>${TILE_SIZE_LABEL[s]}</option>`)}
          </select>
        </div>
        <button ?disabled=${index === 0} @click=${() => this._move(-1)}>← Earlier</button>
        <button ?disabled=${index === cur.tiles.length - 1} @click=${() => this._move(1)}>Later →</button>
        <button class="danger" @click=${() => this._remove()}>Remove</button>
      </div>
      ${def?.options.length ? html`<div class="opts">${def.options.map((f) => this._renderField(tile, f))}</div>` : html`<p class="muted small">This tile has nothing more to set.</p>`}
    `;
  }

  private _renderBoardSheet(cur: Board) {
    return html`
      <div class="shead">
        <b>🖥️ This board</b>
        <span class="spacer"></span>
        <button class="chip" @click=${() => (this._sheet = "")}>Done</button>
      </div>
      <div class="srow">
        <div class="field grow">
          <label for="bname">Name</label>
          <input id="bname" maxlength=${NAME_MAX} .value=${cur.name} @change=${(e: Event) => this._edit((b) => (b.name = (e.target as HTMLInputElement).value.trim()))} />
        </div>
        <div class="field">
          <label for="bcols">Columns</label>
          <input id="bcols" type="number" min="2" max="8" .value=${String(cur.columns)}
            @change=${(e: Event) => {
              const input = e.target as HTMLInputElement;
              const n = Math.round(Number(input.value));
              const kept = input.value.trim() === "" || Number.isNaN(n) ? cur.columns : Math.min(8, Math.max(2, n));
              input.value = String(kept);
              this._edit((b) => (b.columns = kept));
            }} />
        </div>
        <div class="field">
          <label for="bnight">At night</label>
          <select id="bnight" @change=${(e: Event) => this._edit((b) => (b.night = (e.target as HTMLSelectElement).value as NightMode))}>
            ${NIGHT_CHOICES.map(([v, l]) => html`<option value=${v} ?selected=${cur.night === v}>${l}</option>`)}
          </select>
        </div>
      </div>
      <p class="muted small">Night is when quiet hours are on and it is outside the hours of nudging. A tap wakes the board for 30 seconds.</p>
      <p class="small">Link for the tablet's start page: <code>${boardLink(cur)}</code> (after you save)</p>
      <div class="srow">
        <button ?disabled=${(this._boards?.length ?? 0) >= MAX_BOARDS} @click=${() => this._newBoard()}>+ New board</button>
        <button class="danger" ?disabled=${(this._boards?.length ?? 0) < 2} @click=${() => this._deleteBoard()}>Delete this board</button>
      </div>
    `;
  }

  private _renderAddSheet() {
    return html`
      <div class="shead">
        <b>＋ Add a tile</b>
        <span class="spacer"></span>
        <button class="chip" @click=${() => (this._sheet = "")}>Cancel</button>
      </div>
      <div class="adds" role="group" aria-label="Add a tile">
        ${TILE_DEFS.map((d) => html`<button class="addtile" @click=${() => this._addTile(d.type)}><span class="emoji">${d.emoji}</span><b>${d.label}</b><span class="muted small">${d.blurb}</span></button>`)}
      </div>
    `;
  }

  render() {
    const cur = this._cur;
    if (!this._boards || !cur) return html`<div class="load">Loading…</div>`;
    const frame = FRAME[this._view];
    return html`
      <div class="edit">
        <div class="bar" role="toolbar" aria-label="Edit the wall board">
          <label class="pick">
            <span class="muted small">Board</span>
            <select aria-label="Board" @change=${(e: Event) => { this._id = (e.target as HTMLSelectElement).value; this._sel = ""; this._sheet = ""; }}>
              ${this._boards.map((b) => html`<option value=${b.id} ?selected=${b.id === cur.id}>${b.name || "(no name)"}</option>`)}
            </select>
          </label>
          <button class=${this._sheet === "board" ? "on" : ""} @click=${() => (this._sheet = this._sheet === "board" ? "" : "board")}>⚙ Board</button>
          <button class=${this._sheet === "add" ? "on" : ""} @click=${() => (this._sheet = this._sheet === "add" ? "" : "add")}>＋ Add tile</button>
          <div class="views" role="group" aria-label="Show it as">
            ${VIEWS.map(([v, label, tip]) => html`<button class=${this._view === v ? "on" : ""} title=${tip} aria-pressed=${this._view === v} @click=${() => (this._view = v)}>${label}</button>`)}
          </div>
          <span class="spacer"></span>
          ${this._askDiscard
            ? html`<span class="small">Throw away your changes?</span>
                <button class="danger" @click=${() => this._exit(cur.name)}>Yes, discard</button>
                <button @click=${() => (this._askDiscard = false)}>Keep editing</button>`
            : html`<button ?disabled=${this._busy} @click=${() => this._cancel()}>Cancel</button>
                <button class="primary" ?disabled=${this._busy || !this._dirty} @click=${() => this._save()}>${this._busy ? "Saving…" : "Save"}</button>`}
        </div>
        ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
        <div class="stage">
          <div class="frame ${this._view}" style="width:${frame.w};height:${frame.h}">
            <boopli-wall
              preview
              pickable
              .board=${cur}
              .selectedId=${this._sel}
              .hass=${this.hass}
              .snapshot=${this.snapshot}
              .nowMs=${this.nowMs}
              @tile-pick=${(e: Event) => this._pick(e as CustomEvent<string>)}
            ></boopli-wall>
          </div>
        </div>
        ${this._sheet
          ? html`<section class="sheet" aria-label="Settings">
              ${this._sheet === "tile" ? this._renderTileSheet(cur) : this._sheet === "board" ? this._renderBoardSheet(cur) : this._renderAddSheet()}
            </section>`
          : cur.tiles.length === 0
            ? html`<section class="sheet"><p class="muted">This board is empty. Press <b>＋ Add tile</b>.</p></section>`
            : html`<div class="hint muted small">Tap a tile to change it.</div>`}
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
      font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
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
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 18%, transparent);
    }
    button.primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
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
      overflow: auto;
      padding: 12px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .frame {
      flex: none;
      max-width: none;
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      overflow: hidden;
    }
    .frame.wall {
      flex: 1;
    }
    .frame.tablet,
    .frame.phone {
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    }
    .sheet {
      flex: none;
      max-height: 45vh;
      overflow: auto;
      padding: 10px 14px 14px;
      border-top: 1px solid var(--divider-color);
      background: var(--card-background-color, var(--primary-background-color));
    }
    .hint {
      flex: none;
      text-align: center;
      padding: 6px;
    }
    .shead,
    .srow {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 8px;
      margin-bottom: 8px;
    }
    .shead {
      align-items: center;
    }
    .grow {
      flex: 1 1 180px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 6px;
    }
    .field label,
    label.inline {
      font-size: 13px;
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
      grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
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
      font-size: 13px;
    }
    .error {
      color: var(--error-color, #db4437);
      padding: 6px 12px;
    }
    code {
      word-break: break-all;
    }
  `;
}
customElements.define("boopli-wall-edit", BoopliWallEdit);
