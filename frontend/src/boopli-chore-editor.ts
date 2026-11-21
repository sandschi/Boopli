import { LitElement, html, css, nothing } from "lit";
import { deleteChore, errorMessage, saveChore } from "./api";
import { WEEKDAY_NAMES } from "./time";
import { sharedStyles } from "./styles";
import "./boopli-triggers";
import type { ChoreDraft, Hass, NudgeStyle, RepeatType, Trigger } from "./types";

const STYLE_OPTIONS: { value: NudgeStyle; label: string }[] = [
  { value: "quiet", label: "Quiet: only shown in Boopli, no nudges" },
  { value: "one", label: "One nudge" },
  { value: "escalating", label: "Escalating: gets more frequent, then stops" },
  { value: "persistent", label: "Persistent: every 5 minutes until done" },
];

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
    defaultStyle: { attribute: false },
    _error: { state: true },
    _busy: { state: true },
    _confirmDelete: { state: true },
  };

  declare hass?: Hass;
  declare draft: ChoreDraft;
  declare defaultStyle: NudgeStyle;
  declare _error: string;
  declare _busy: boolean;
  declare _confirmDelete: boolean;

  private _base?: string; // the draft as it was when the editor opened
  private _lastDirty = false;

  constructor() {
    super();
    this.defaultStyle = "one";
    this._error = "";
    this._busy = false;
    this._confirmDelete = false;
  }

  protected willUpdate(): void {
    if (this._base === undefined && this.draft) this._base = JSON.stringify(this.draft);
  }

  protected updated(): void {
    const dirty = this._isDirty();
    if (dirty !== this._lastDirty) {
      this._lastDirty = dirty;
      this.dispatchEvent(
        new CustomEvent("dirty-change", {
          detail: { source: "chore", dirty },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private _isDirty(): boolean {
    return this._base !== undefined && !!this.draft && JSON.stringify(this.draft) !== this._base;
  }

  /** Save the chore and close. Used by Save and by the panel's "Save" on leaving. */
  async save(): Promise<boolean> {
    return this._save();
  }

  /** Close without saving. */
  discard(): void {
    this._close();
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

  private async _save(): Promise<boolean> {
    if (!this.hass || this._busy) return false;
    this._busy = true;
    this._error = "";
    try {
      await saveChore(this.hass, {
        ...this.draft,
        nudge_style: this.draft.nudge_style ?? this.defaultStyle,
        ignore_quiet_hours: this.draft.ignore_quiet_hours ?? false,
        name: this.draft.name.trim(),
        steps: this.draft.steps.map((s) => ({ ...s, title: s.title.trim() })),
      });
      this._close();
      return true;
    } catch (err) {
      this._error = errorMessage(err);
      return false;
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
        <details class="auto" ?open=${(step.triggers ?? []).length > 0}>
          <summary>
            Finishes by itself when…
            ${(step.triggers ?? []).length > 0
              ? html`<span class="muted small">(${(step.triggers ?? []).length} set)</span>`
              : nothing}
          </summary>
          <boopli-triggers
            .hass=${this.hass}
            .triggers=${step.triggers ?? []}
            @triggers-change=${(e: CustomEvent<Trigger[]>) =>
              this._updateStep(index, { triggers: e.detail })}
          ></boopli-triggers>
        </details>
      </div>
    `;
  }

  render() {
    const d = this.draft;
    if (!d) return nothing;
    return html`
      <section class="card ${this._isDirty() ? "changed" : ""}">
        <h2>
          ${d.id ? "Edit chore" : "New chore"}
          ${this._isDirty() ? html`<span class="unsaved-badge">Unsaved</span>` : nothing}
        </h2>

        <div class="editor-grid">
        <div class="col-a">
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

        <div class="field">
          <label for="style">How should Boopli nudge you?</label>
          <select
            id="style"
            .value=${d.nudge_style ?? this.defaultStyle}
            @change=${(e: Event) =>
              this._update({ nudge_style: (e.target as HTMLSelectElement).value as NudgeStyle })}
          >
            ${STYLE_OPTIONS.map(
              (o) => html`<option
                value=${o.value}
                ?selected=${o.value === (d.nudge_style ?? this.defaultStyle)}
              >
                ${o.label}
              </option>`
            )}
          </select>
        </div>
        <div class="field check">
          <label class="inline">
            <input
              type="checkbox"
              .checked=${d.ignore_quiet_hours ?? false}
              @change=${(e: Event) =>
                this._update({ ignore_quiet_hours: (e.target as HTMLInputElement).checked })}
            />
            Nudge even in quiet hours (for example pills)
          </label>
        </div>

        </div>
        <div class="col-b">
        <h3 class="steps-title">Steps</h3>
        ${d.steps.map((_, i) => this._renderStep(i))}
        <button type="button" @click=${() => this._addStep()}>+ Add a step</button>
        </div>
        </div>

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
      ${this._isDirty()
        ? html`<div class="savebar" role="status">
            <span><b>●</b> You have unsaved changes</span>
            <span class="spacer"></span>
            <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
            <button ?disabled=${this._busy} @click=${() => this._close()}>Discard</button>
          </div>`
        : nothing}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .editor-grid {
        display: grid;
        grid-template-columns: minmax(280px, 400px) minmax(0, 1fr);
        gap: 8px 32px;
        align-items: start;
      }
      @media (max-width: 900px) {
        .editor-grid {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      .steps-title {
        margin-top: 14px;
      }
      section.card.changed {
        border-color: var(--warning-color, #ffa600);
        box-shadow: inset 4px 0 0 var(--warning-color, #ffa600);
      }
      .unsaved-badge {
        display: inline-block;
        margin-left: 8px;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        color: #000;
        background: var(--warning-color, #ffa600);
        vertical-align: middle;
      }
      .savebar {
        position: sticky;
        bottom: 12px;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
        padding: 12px 16px;
        border-radius: 14px;
        border: 2px solid var(--warning-color, #ffa600);
        background: var(--card-background-color, var(--primary-background-color));
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
      }
      .savebar b {
        color: var(--warning-color, #ffa600);
      }
      .spacer {
        flex: 1;
      }
      .field {
        margin: 14px 0;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
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
      details.auto {
        margin-top: 12px;
      }
      details.auto summary {
        cursor: pointer;
        font-size: 14px;
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
