import { LitElement, html, css, nothing } from "lit";
import { errorMessage } from "./api";
import { sharedStyles } from "./styles";
import type { Hass, Trigger, TriggerKind } from "./types";

interface TagInfo {
  tag_id: string;
  name?: string;
}

/** Quick answers for "which state?", by kind of entity. */
const STATE_CHOICES: Record<string, string[]> = {
  binary_sensor: ["on", "off"],
  switch: ["on", "off"],
  input_boolean: ["on", "off"],
  light: ["on", "off"],
  cover: ["open", "closed"],
  lock: ["locked", "unlocked"],
  person: ["home", "not_home"],
  device_tracker: ["home", "not_home"],
};

const BUTTON_DOMAINS = ["event", "input_button", "button"];

type Condition = "state" | "above" | "below" | "between";

function conditionOf(t: Trigger): Condition {
  if (t.state) return "state";
  if (t.above !== null && t.below !== null) return "between";
  if (t.below !== null) return "below";
  if (t.above !== null) return "above";
  return "state";
}

export function blankTrigger(kind: TriggerKind): Trigger {
  return {
    kind,
    entity_id: "",
    mode: "happens",
    state: "",
    above: null,
    below: null,
    for_minutes: 0,
    tag_id: "",
    press: "",
  };
}

/**
 * "Finishes by itself when…" for one step: entity states, NFC tags and buttons.
 * Any one of them is enough. Emits `triggers-change` with the new list.
 */
export class BoopliTriggers extends LitElement {
  static properties = {
    hass: { attribute: false },
    triggers: { attribute: false },
    _tags: { state: true },
    _scanning: { state: true },
    _note: { state: true },
  };

  declare hass?: Hass;
  declare triggers: Trigger[];
  declare _tags: TagInfo[];
  declare _scanning: number;
  declare _note: string;
  private _stopScan?: () => void;

  constructor() {
    super();
    this.triggers = [];
    this._tags = [];
    this._scanning = -1;
    this._note = "";
  }

  connectedCallback(): void {
    super.connectedCallback();
    void this._loadTags();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._cancelScan();
  }

  private async _loadTags(): Promise<void> {
    if (!this.hass) return;
    try {
      const tags = await this.hass.callWS<TagInfo[]>({ type: "tag/list" });
      this._tags = Array.isArray(tags) ? tags : [];
    } catch {
      this._tags = []; // no tag integration: the id can still be typed
    }
  }

  private _emit(triggers: Trigger[]): void {
    this.dispatchEvent(
      new CustomEvent("triggers-change", { detail: triggers, bubbles: true, composed: true })
    );
  }

  private _patch(index: number, patch: Partial<Trigger>): void {
    this._emit(this.triggers.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  private _add(kind: TriggerKind): void {
    this._emit([...this.triggers, blankTrigger(kind)]);
  }

  private _remove(index: number): void {
    this._cancelScan();
    this._emit(this.triggers.filter((_, i) => i !== index));
  }

  private _entityIds(domains?: string[]): string[] {
    return Object.keys(this.hass?.states ?? {})
      .filter((id) => !domains || domains.includes(id.split(".")[0]))
      .sort();
  }

  private _friendly(entityId: string): string {
    const name = this.hass?.states[entityId]?.attributes?.friendly_name;
    return typeof name === "string" && name ? name : entityId;
  }

  private _numberOrNull(value: string): number | null {
    if (value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private _setCondition(index: number, cond: Condition): void {
    const t = this.triggers[index];
    if (cond === "state") this._patch(index, { state: t.state || "on", above: null, below: null });
    if (cond === "above") this._patch(index, { state: "", above: t.above ?? 0, below: null });
    if (cond === "below") this._patch(index, { state: "", above: null, below: t.below ?? 0 });
    if (cond === "between")
      this._patch(index, { state: "", above: t.above ?? 0, below: t.below ?? 100 });
  }

  // --- tag scanning ---------------------------------------------------------

  private _cancelScan(): void {
    this._stopScan?.();
    this._stopScan = undefined;
    this._scanning = -1;
  }

  private async _scan(index: number): Promise<void> {
    if (!this.hass) return;
    this._cancelScan();
    this._note = "";
    this._scanning = index;
    try {
      const unsubscribe = await this.hass.connection.subscribeEvents<{
        data?: { tag_id?: string };
      }>((event) => {
        const id = event.data?.tag_id;
        if (!id) return;
        this._patch(index, { tag_id: id });
        this._cancelScan();
        void this._loadTags();
      }, "tag_scanned");
      if (this._scanning === index) this._stopScan = unsubscribe;
      else unsubscribe();
    } catch (err) {
      this._scanning = -1;
      this._note = `Scanning did not start (${errorMessage(err)}). Pick the tag from the list instead.`;
    }
  }

  // --- rendering ------------------------------------------------------------

  private _renderState(t: Trigger, index: number) {
    const domain = t.entity_id.split(".")[0];
    const current = this.hass?.states[t.entity_id];
    const choices = STATE_CHOICES[domain] ?? [];
    const cond = conditionOf(t);
    return html`
      <div class="field">
        <label>Which entity?</label>
        <input
          list="states-list"
          placeholder="Start typing a name, for example door"
          .value=${t.entity_id}
          @change=${(e: Event) =>
            this._patch(index, { entity_id: (e.target as HTMLInputElement).value.trim() })}
        />
        ${t.entity_id
          ? current
            ? html`<div class="muted small">
                ${this._friendly(t.entity_id)}: now <b>${current.state}</b>
              </div>`
            : html`<div class="warn small">Not found right now. Check the name.</div>`
          : nothing}
      </div>
      <div class="field">
        <label>It finishes the step when it…</label>
        <select
          .value=${cond}
          @change=${(e: Event) =>
            this._setCondition(index, (e.target as HTMLSelectElement).value as Condition)}
        >
          <option value="state" ?selected=${cond === "state"}>is in this state</option>
          <option value="above" ?selected=${cond === "above"}>goes above a number</option>
          <option value="below" ?selected=${cond === "below"}>goes below a number</option>
          <option value="between" ?selected=${cond === "between"}>is between two numbers</option>
        </select>
      </div>
      ${cond === "state"
        ? html`<div class="field">
            <label>State</label>
            <input
              placeholder="for example on, off, open"
              .value=${t.state}
              @input=${(e: Event) => this._patch(index, { state: (e.target as HTMLInputElement).value })}
            />
            <div class="chips">
              ${choices.map(
                (c) => html`<button
                  type="button"
                  class="chip ${t.state === c ? "on" : ""}"
                  @click=${() => this._patch(index, { state: c })}
                >
                  ${c}
                </button>`
              )}
              ${current && !choices.includes(current.state)
                ? html`<button
                    type="button"
                    class="chip"
                    @click=${() => this._patch(index, { state: current.state })}
                  >
                    now: ${current.state}
                  </button>`
                : nothing}
            </div>
          </div>`
        : html`<div class="row2">
            ${cond === "above" || cond === "between"
              ? html`<div>
                  <label>Above</label>
                  <input
                    type="number"
                    step="any"
                    .value=${t.above === null ? "" : String(t.above)}
                    @input=${(e: Event) =>
                      this._patch(index, { above: this._numberOrNull((e.target as HTMLInputElement).value) })}
                  />
                </div>`
              : nothing}
            ${cond === "below" || cond === "between"
              ? html`<div>
                  <label>Below</label>
                  <input
                    type="number"
                    step="any"
                    .value=${t.below === null ? "" : String(t.below)}
                    @input=${(e: Event) =>
                      this._patch(index, { below: this._numberOrNull((e.target as HTMLInputElement).value) })}
                  />
                </div>`
              : nothing}
          </div>`}
      <div class="field">
        <label>…and stays that way for (minutes, 0 = right away)</label>
        <input
          type="number"
          min="0"
          max="1440"
          .value=${String(t.for_minutes)}
          @input=${(e: Event) =>
            this._patch(index, {
              for_minutes: Math.max(0, Number((e.target as HTMLInputElement).value) || 0),
            })}
        />
      </div>
      <details class="advanced">
        <summary>Advanced</summary>
        <label class="inline">
          <input
            type="checkbox"
            .checked=${t.mode === "is"}
            @change=${(e: Event) =>
              this._patch(index, { mode: (e.target as HTMLInputElement).checked ? "is" : "happens" })}
          />
          Also count it if it is already true when the step starts
        </label>
        <div class="muted small">
          Off (the usual): it has to happen after the step starts, so a door that was already open
          does not finish "open it to dry". On: good for "windows are shut" or "plant is fine".
        </div>
      </details>
    `;
  }

  private _renderTag(t: Trigger, index: number) {
    const known = this._tags.find((tag) => tag.tag_id === t.tag_id);
    return html`
      <div class="field">
        <label>Which NFC tag?</label>
        <div class="scan">
          <select
            @change=${(e: Event) => this._patch(index, { tag_id: (e.target as HTMLSelectElement).value })}
          >
            <option value="" .selected=${!t.tag_id}>Pick a tag…</option>
            ${this._tags.map(
              (tag) => html`<option value=${tag.tag_id} .selected=${tag.tag_id === t.tag_id}>
                ${tag.name || tag.tag_id}
              </option>`
            )}
            ${t.tag_id && !known
              ? html`<option value=${t.tag_id} .selected=${true}>${t.tag_id}</option>`
              : nothing}
          </select>
          ${this._scanning === index
            ? html`<button type="button" @click=${() => this._cancelScan()}>Cancel</button>`
            : html`<button type="button" @click=${() => this._scan(index)}>Scan now</button>`}
        </div>
        ${this._scanning === index
          ? html`<div class="muted small">Hold your phone to the tag now…</div>`
          : nothing}
      </div>
    `;
  }

  private _renderButton(t: Trigger, index: number) {
    const current = this.hass?.states[t.entity_id];
    const types = current?.attributes?.event_types;
    return html`
      <div class="field">
        <label>Which button?</label>
        <input
          list="buttons-list"
          placeholder="Start typing a name, for example button"
          .value=${t.entity_id}
          @change=${(e: Event) =>
            this._patch(index, { entity_id: (e.target as HTMLInputElement).value.trim() })}
        />
        ${t.entity_id && !current
          ? html`<div class="warn small">Not found right now. Check the name.</div>`
          : nothing}
      </div>
      <div class="field">
        <label>Only this kind of press (empty = any press)</label>
        <input
          placeholder="for example single or double"
          .value=${t.press}
          @input=${(e: Event) => this._patch(index, { press: (e.target as HTMLInputElement).value })}
        />
        ${Array.isArray(types) && types.length
          ? html`<div class="chips">
              ${types.map(
                (p) => html`<button
                  type="button"
                  class="chip ${t.press === p ? "on" : ""}"
                  @click=${() => this._patch(index, { press: p })}
                >
                  ${String(p)}
                </button>`
              )}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _title(t: Trigger): string {
    if (t.kind === "tag") return "An NFC tag is scanned";
    if (t.kind === "button") return "A button is pressed";
    return "An entity changes";
  }

  render() {
    return html`
      <datalist id="states-list">
        ${this._entityIds().map((id) => html`<option value=${id}>${this._friendly(id)}</option>`)}
      </datalist>
      <datalist id="buttons-list">
        ${this._entityIds(BUTTON_DOMAINS).map(
          (id) => html`<option value=${id}>${this._friendly(id)}</option>`
        )}
      </datalist>
      ${this.triggers.length === 0
        ? html`<div class="muted small">
            Nothing yet: only you finish this step (with Done). Add one below to let it finish by
            itself.
          </div>`
        : this.triggers.map(
            (t, i) => html`
              ${i > 0 ? html`<div class="or muted small">or</div>` : nothing}
              <div class="trigger">
                <div class="trigger-head">
                  <b>${this._title(t)}</b>
                  <button type="button" aria-label="Remove" @click=${() => this._remove(i)}>✕</button>
                </div>
                ${t.kind === "tag"
                  ? this._renderTag(t, i)
                  : t.kind === "button"
                    ? this._renderButton(t, i)
                    : this._renderState(t, i)}
              </div>
            `
          )}
      ${this._note ? html`<div class="warn small">${this._note}</div>` : nothing}
      <div class="chips add">
        <button type="button" @click=${() => this._add("state")}>+ An entity changes</button>
        <button type="button" @click=${() => this._add("tag")}>+ NFC tag</button>
        <button type="button" @click=${() => this._add("button")}>+ Button</button>
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .small {
        font-size: 13px;
      }
      .warn {
        color: var(--warning-color, #b26a00);
      }
      .trigger {
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px;
        margin: 8px 0;
      }
      .trigger-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .trigger-head button {
        padding: 2px 10px;
        min-height: 32px;
      }
      .or {
        text-align: center;
      }
      .field {
        margin: 10px 0;
      }
      .row2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin: 10px 0;
      }
      .scan {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 6px;
      }
      .chips.add {
        margin-top: 10px;
      }
      .advanced summary {
        cursor: pointer;
        color: var(--secondary-text-color);
        font-size: 13px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--primary-text-color);
        margin: 8px 0 4px;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
    `,
  ];
}

customElements.define("boopli-triggers", BoopliTriggers);
