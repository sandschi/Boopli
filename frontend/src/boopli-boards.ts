import { LitElement, css, html, nothing } from "lit";
import "./boopli-wall";
import { entityIds, friendlyName, newLadderId } from "./helpers";
import { sharedStyles } from "./styles";
import { TILE_DEFS, TILE_SIZE_LABEL, newTile, tileDef, type OptionField } from "./wall-tiles";
import type { Board, Hass, NightMode, Settings, Snapshot, Tile, TileSize } from "./types";

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

/**
 * The wall boards: a grid of tiles for a screen on the wall. Pick a board (or make another), set its
 * columns and what it does at night, and add, move and set up its tiles. The preview shows the result.
 * What each type of tile can be set to comes from the list in wall-tiles.ts.
 */
export class BoopliBoards extends LitElement {
  static properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    snapshot: { attribute: false },
    _board: { state: true },
    _note: { state: true },
  };

  declare hass?: Hass;
  declare settings?: Settings;
  declare snapshot?: Snapshot;
  declare _board: string; // the id of the board being edited
  declare _note: string;

  constructor() {
    super();
    this._board = "";
    this._note = "";
  }

  private get _boards(): Board[] {
    return this.settings?.boards ?? [];
  }

  private get _current(): Board | undefined {
    return this._boards.find((b) => b.id === this._board) ?? this._boards[0];
  }

  private _patch(boards: Board[]): void {
    this._note = "";
    this.dispatchEvent(new CustomEvent("settings-patch", { detail: { boards }, bubbles: true, composed: true }));
  }

  /** Change the board being edited. */
  private _edit(change: (b: Board) => void): void {
    const cur = this._current;
    if (!cur) return;
    const boards = structuredClone(this._boards);
    const b = boards.find((x) => x.id === cur.id);
    if (b) change(b);
    this._patch(boards);
  }

  private _uniqueName(base: string): string {
    const names = new Set(this._boards.map((b) => b.name.toLowerCase()));
    if (!names.has(base.toLowerCase())) return base;
    let n = 2;
    while (names.has(`${base} ${n}`.toLowerCase())) n += 1;
    return `${base} ${n}`;
  }

  private _add(): void {
    if (this._boards.length >= MAX_BOARDS) return;
    const board: Board = {
      id: newLadderId(),
      name: this._uniqueName("My board"),
      columns: 4,
      night: "dim",
      tiles: [newTile("clock"), newTile("due_now")],
    };
    this._board = board.id;
    this._patch([...this._boards, board]);
  }

  private _delete(): void {
    const cur = this._current;
    if (!cur || this._boards.length < 2) return;
    this._board = "";
    this._patch(this._boards.filter((b) => b.id !== cur.id));
  }

  private _addTile(type: string): void {
    if ((this._current?.tiles.length ?? 0) >= MAX_TILES) {
      this._note = `A board can have ${MAX_TILES} tiles at most.`;
      return;
    }
    this._edit((b) => b.tiles.push(newTile(type)));
  }

  private _moveTile(index: number, by: -1 | 1): void {
    this._edit((b) => {
      const to = index + by;
      if (to < 0 || to >= b.tiles.length) return;
      [b.tiles[index], b.tiles[to]] = [b.tiles[to], b.tiles[index]];
    });
  }

  private _setOption(index: number, key: string, value: string | number | boolean): void {
    this._edit((b) => (b.tiles[index].options[key] = value));
  }

  // --- the pieces ---------------------------------------------------------

  private _renderField(tile: Tile, index: number, f: OptionField) {
    const value = tile.options[f.key] ?? f.default;
    const id = `f-${tile.id}-${f.key}`;
    switch (f.kind) {
      case "bool":
        return html`<label class="inline"><input type="checkbox" .checked=${value === true} @change=${(e: Event) => this._setOption(index, f.key, (e.target as HTMLInputElement).checked)} /> ${f.label}</label>`;
      case "choice":
        return html`<div class="field"><label for=${id}>${f.label}</label>
          <select id=${id} @change=${(e: Event) => this._setOption(index, f.key, (e.target as HTMLSelectElement).value)}>
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
              this._setOption(index, f.key, kept);
            }} /></div>`;
      case "entity": {
        const ids = entityIds(this.hass, f.domains ?? ANY_DOMAINS);
        const list = `dl-${tile.id}-${f.key}`;
        return html`<div class="field"><label for=${id}>${f.label}</label>
          <input id=${id} list=${list} placeholder="Start typing a name…" .value=${String(value)}
            @change=${(e: Event) => this._setOption(index, f.key, (e.target as HTMLInputElement).value.trim())} />
          <datalist id=${list}>${ids.map((e) => html`<option value=${e}>${friendlyName(this.hass, e)}</option>`)}</datalist>
          ${value && !this.hass?.states[String(value)] ? html`<div class="error small">${value} was not found.</div>` : nothing}</div>`;
      }
      default:
        return html`<div class="field"><label for=${id}>${f.label}</label>
          ${f.long
            ? html`<textarea id=${id} rows="3" maxlength="300" .value=${String(value)} @change=${(e: Event) => this._setOption(index, f.key, (e.target as HTMLTextAreaElement).value)}></textarea>`
            : html`<input id=${id} maxlength=${NAME_MAX} .value=${String(value)} @change=${(e: Event) => this._setOption(index, f.key, (e.target as HTMLInputElement).value)} />`}</div>`;
    }
  }

  private _renderTile(board: Board, tile: Tile, index: number) {
    const def = tileDef(tile.type);
    return html`<div class="tile">
      <div class="thead">
        <b>${def?.emoji ?? "◻️"} ${def?.label ?? tile.type}</b>
        <span class="spacer"></span>
        <select aria-label="Size of ${def?.label ?? tile.type}" @change=${(e: Event) => this._edit((b) => (b.tiles[index].size = (e.target as HTMLSelectElement).value as TileSize))}>
          ${(Object.keys(TILE_SIZE_LABEL) as TileSize[]).map((s) => html`<option value=${s} ?selected=${tile.size === s}>${TILE_SIZE_LABEL[s]}</option>`)}
        </select>
        <button class="chip" aria-label="Move up" ?disabled=${index === 0} @click=${() => this._moveTile(index, -1)}>↑</button>
        <button class="chip" aria-label="Move down" ?disabled=${index === board.tiles.length - 1} @click=${() => this._moveTile(index, 1)}>↓</button>
        <button class="chip danger" aria-label="Remove ${def?.label ?? tile.type}" @click=${() => this._edit((b) => b.tiles.splice(index, 1))}>✕</button>
      </div>
      ${def?.options.length ? html`<div class="opts">${def.options.map((f) => this._renderField(tile, index, f))}</div>` : nothing}
    </div>`;
  }

  render() {
    const cur = this._current;
    if (!this.settings || !cur) return html`<p class="muted">Loading…</p>`;
    return html`
      <p class="muted">
        A board is a grid of tiles for a screen on the wall. Open it from the 🖥 Wall view button, or put its link
        on the tablet's start page. Save to see changes on the wall.
      </p>
      <div class="row">
        <div class="field grow">
          <label for="boardpick">Board</label>
          <select id="boardpick" @change=${(e: Event) => (this._board = (e.target as HTMLSelectElement).value)}>
            ${this._boards.map((b) => html`<option value=${b.id} ?selected=${b.id === cur.id}>${b.name || "(no name)"}</option>`)}
          </select>
        </div>
        <button ?disabled=${this._boards.length >= MAX_BOARDS} @click=${() => this._add()}>+ New board</button>
        <button class="danger" ?disabled=${this._boards.length < 2} @click=${() => this._delete()}>Delete this board</button>
      </div>
      <div class="row">
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
      <p class="muted small">Night is when Boopli's quiet hours are on and it is outside the hours of nudging. A tap wakes the board for 30 seconds.</p>
      <div class="preview" aria-label="Preview of the board">
        <boopli-wall preview .board=${cur} .hass=${this.hass} .snapshot=${this.snapshot} .nowMs=${Date.now()}></boopli-wall>
      </div>
      <h3>Tiles</h3>
      ${cur.tiles.length ? cur.tiles.map((t, i) => this._renderTile(cur, t, i)) : html`<p class="muted">No tiles yet. Add one below.</p>`}
      <div class="adds" role="group" aria-label="Add a tile">
        ${TILE_DEFS.map((d) => html`<button class="chip" title=${d.blurb} @click=${() => this._addTile(d.type)}>＋ ${d.emoji} ${d.label}</button>`)}
      </div>
      ${this._note ? html`<div class="error" role="alert">${this._note}</div>` : nothing}
      <p>
        <button @click=${() => this.dispatchEvent(new CustomEvent("open-wall", { detail: cur.name, bubbles: true, composed: true }))}>
          🖥 Open this board
        </button>
      </p>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: flex-end;
        margin-bottom: 8px;
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
      .preview {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        overflow: hidden;
        max-height: 360px;
        overflow-y: auto;
        margin-bottom: 10px;
      }
      h3 {
        margin: 12px 0 6px;
        font-size: 16px;
      }
      .tile {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 10px;
        margin-bottom: 8px;
      }
      .thead {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }
      .spacer {
        flex: 1;
      }
      .opts {
        margin-top: 8px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
        gap: 4px 12px;
      }
      .adds {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 8px 0;
      }
      .small {
        font-size: 13px;
      }
      .error {
        color: var(--error-color, #db4437);
      }
    `,
  ];
}
customElements.define("boopli-boards", BoopliBoards);
