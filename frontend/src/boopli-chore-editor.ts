import { LitElement, html, css, nothing } from "lit";
import { deleteChore, errorMessage, saveChore } from "./api";
import { WEEKDAY_NAMES } from "./time";
import { sharedStyles } from "./styles";
import type { ChoreDraft, Hass, RepeatType } from "./types";

const WAIT_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 0, label: "No wait" },
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 180, label: "3 h" },
];

const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: "none", label: "On demand (I start it)" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "On certain weekdays" },
  { value: "every_n_days", label: "Every N days after I finish" },
];

/** Create or edit a chore: name, repeat, where, and its steps with waits. */
export class BoopliChoreEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    draft: { attribute: false },
    _error: { state: true },
    _busy: { state: true },
    _confirmDelete: { state: true },
  };

  declare hass?: Hass;
  declare draft: ChoreDraft;
  declare _error: string;
  declare _busy: boolean;
  declare _confirmDelete: boolean;

  constructor() {
    super();
    this._error = "";
    this._busy = false;
    this._confirmDelete = false;
  }

  private _update(patch: Partial<ChoreDraft>): void {
    this.draft = { ...this.draft, ...patch };
  }

  private _updateRepeat(patch: Partial<ChoreDraft["repeat"]>): void {
    this._update({ repeat: { ...this.draft.repeat, ...patch } });
  }

  private _updateStep(
    index: number,
    patch: Partial<ChoreDraft["steps"][number]>
  ): void {
    const steps = this.draft.steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
    this._update({ steps });
  }

  private _moveStep(index: number, by: -1 | 1): void {
    const target = index + by;
    if (target < 0 || target >= this.draft.steps.length) return;
    const steps = [...this.draft.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    this._update({ steps });
  }

  private _removeStep(index: number): void {
    if (this.draft.steps.length <= 1) return;
    this._update({ steps: this.draft.steps.filter((_, i) => i !== index) });
  }

  private _addStep(): void {
    this._update({ steps: [...this.draft.steps, { title: "", wait_minutes: 0 }] });
  }

  private _toggleWeekday(day: number): void {
    const set = new Set(this.draft.repeat.weekdays);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    this._updateRepeat({ weekdays: [...set].sort((a, b) => a - b) });
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent("editor-close", { bubbles: true, composed: true }));
  }

  private async _save(): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await saveChore(this.hass, {
        ...this.draft,
        name: this.draft.name.trim(),
        steps: this.draft.steps.map((s) => ({ ...s, title: s.title.trim() })),
      });
      this._close();
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private async _delete(): Promise<void> {
    if (!this.hass || !this.draft.id || this._busy) return;
    this._busy = true;
    try {
      await deleteChore(this.hass, this.draft.id);
      this._close();
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _renderRepeat() {
    const r = this.draft.repeat;
    return html`
      <div class="field">
        <label for="repeat">Repeats</label>
        <select
          id="repeat"
          .value=${r.type}
          @change=${(e: Event) =>
            this._updateRepeat({ type: (e.target as HTMLSelectElement).value as RepeatType })}
        >
          ${REPEAT_OPTIONS.map(
            (o) => html`<option value=${o.value} ?selected=${o.value === r.type}>${o.label}</option>`
          )}
        </select>
      </div>
      ${r.type === "weekly"
        ? html`<div class="field">
            <label>On these days</label>
            <div class="chips">
              ${WEEKDAY_NAMES.map(
                (name, day) => html`<button
                  type="button"
                  class="chip ${r.weekdays.includes(day) ? "on" : ""}"
                  @click=${() => this._toggleWeekday(day)}
                >
                  ${name}
                </button>`
              )}
            </div>
          </div>`
        : nothing}
      ${r.type === "every_n_days"
        ? html`<div class="field">
            <label for="n">Number of days</label>
            <input
              id="n"
              type="number"
              min="1"
              max="365"
              .value=${String(r.every_n_days)}
              @input=${(e: Event) =>
                this._updateRepeat({
                  every_n_days: Number((e.target as HTMLInputElement).value) || 1,
                })}
            />
          </div>`
        : nothing}
      ${r.type !== "none"
        ? html`<div class="field">
            <label for="time">At</label>
            <input
              id="time"
              type="time"
              .value=${r.time}
              @input=${(e: Event) => this._updateRepeat({ time: (e.target as HTMLInputElement).value })}
            />
          </div>`
        : nothing}
    `;
  }

  private _renderStep(index: number) {
    const step = this.draft.steps[index];
    const last = this.draft.steps.length - 1;
    return html`
      <div class="step">
        <div class="step-head">
          <span class="num">${index + 1}</span>
          <input
            aria-label="Step ${index + 1} title"
            placeholder="What to do"
            .value=${step.title}
            @input=${(e: Event) =>
              this._updateStep(index, { title: (e.target as HTMLInputElement).value })}
          />
          <button type="button" aria-label="Move up" ?disabled=${index === 0} @click=${() => this._moveStep(index, -1)}>↑</button>
          <button type="button" aria-label="Move down" ?disabled=${index === last} @click=${() => this._moveStep(index, 1)}>↓</button>
          <button type="button" aria-label="Remove step" ?disabled=${last === 0} @click=${() => this._removeStep(index)}>✕</button>
        </div>
        <div class="wait">
          <span class="muted small">Wait before this step:</span>
          <div class="chips">
            ${WAIT_PRESETS.map(
              (p) => html`<button
                type="button"
                class="chip ${step.wait_minutes === p.minutes ? "on" : ""}"
                @click=${() => this._updateStep(index, { wait_minutes: p.minutes })}
              >
                ${p.label}
              </button>`
            )}
            <span class="custom">
              <input
                aria-label="Custom wait in minutes"
                type="number"
                min="0"
                max="10080"
                .value=${String(step.wait_minutes)}
                @input=${(e: Event) =>
                  this._updateStep(index, {
                    wait_minutes: Math.max(0, Number((e.target as HTMLInputElement).value) || 0),
                  })}
              />
              <span class="muted small">min</span>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const d = this.draft;
    if (!d) return nothing;
    return html`
      <section class="card">
        <h2>${d.id ? "Edit chore" : "New chore"}</h2>

        <div class="field">
          <label for="name">Name</label>
          <input
            id="name"
            placeholder="For example: Dishwasher"
            .value=${d.name}
            @input=${(e: Event) => this._update({ name: (e.target as HTMLInputElement).value })}
          />
        </div>

        <div class="field">
          <label for="where">Where does it make sense?</label>
          <select
            id="where"
            .value=${d.where}
            @change=${(e: Event) =>
              this._update({ where: (e.target as HTMLSelectElement).value as ChoreDraft["where"] })}
          >
            <option value="home" ?selected=${d.where === "home"}>Home only</option>
            <option value="anywhere" ?selected=${d.where === "anywhere"}>Anywhere (for example pills)</option>
          </select>
        </div>

        ${this._renderRepeat()}

        <h3 class="steps-title">Steps</h3>
        ${d.steps.map((_, i) => this._renderStep(i))}
        <button type="button" @click=${() => this._addStep()}>+ Add a step</button>

        ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

        <div class="actions">
          <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
          <button ?disabled=${this._busy} @click=${() => this._close()}>Cancel</button>
          ${d.id
            ? this._confirmDelete
              ? html`<span class="muted small">Delete it, and anything in progress?</span>
                  <button class="danger" ?disabled=${this._busy} @click=${() => this._delete()}>Yes, delete</button>
                  <button @click=${() => (this._confirmDelete = false)}>No</button>`
              : html`<button class="danger" @click=${() => (this._confirmDelete = true)}>Delete</button>`
            : nothing}
        </div>
      </section>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .field {
        margin: 14px 0;
      }
      .small {
        font-size: 13px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .steps-title {
        margin: 24px 0 8px;
      }
      .step {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 10px;
        margin-bottom: 10px;
      }
      .step-head {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .step-head button {
        padding: 4px 10px;
        min-width: 38px;
      }
      .num {
        min-width: 22px;
        text-align: center;
        color: var(--secondary-text-color);
      }
      .wait {
        margin-top: 10px;
      }
      .wait .chips {
        margin-top: 6px;
      }
      .custom {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .custom input {
        width: 84px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-top: 20px;
      }
    `,
  ];
}

customElements.define("boopli-chore-editor", BoopliChoreEditor);
