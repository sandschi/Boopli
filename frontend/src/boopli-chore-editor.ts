import { LitElement, html, css, nothing } from "lit";
import { icon } from "./icon";
import { deleteChore, errorMessage, saveChore } from "./api";
import { hexToRgb, lightHasColor, normalizeStyle, rgbToHex } from "./helpers";
import { describeRepeat } from "./time";
import { sharedStyles } from "./styles";
import "./boopli-triggers";
import "./boopli-picture";
import "./boopli-schedule-days";
import "./boopli-schedule-wizard";
import "./boopli-breakdown";
import type { BreakdownResult } from "./boopli-breakdown";
import type { ChoreDraft, Hass, NudgeStyle, Repeat, RepeatType, Snapshot, StepSize, Trigger } from "./types";
import { t, rich } from "./i18n";

const MAX_QUESTIONS = 8; // the same as in the integration

const STYLE_OPTIONS = (): { value: NudgeStyle; label: string }[] => [
  { value: "quiet", label: t("chore_editor.quiet_only_shown_in_boopli_no") },
];

const WAIT_PRESETS = (): { minutes: number; label: string }[] => [
  { minutes: 0, label: t("chore_editor.no_wait") },
  { minutes: 15, label: t("chore_editor.wait_min", { n: 15 }) },
  { minutes: 30, label: t("chore_editor.wait_min", { n: 30 }) },
  { minutes: 60, label: t("chore_editor.wait_h", { n: 1 }) },
  { minutes: 180, label: t("chore_editor.wait_h", { n: 3 }) },
];

const REPEAT_OPTIONS = (): { value: RepeatType; label: string }[] => [
  { value: "none", label: t("chore_editor.on_demand_i_start_it") },
  { value: "schedule", label: t("common.on_certain_days_and_times") },
  { value: "every_n_days", label: t("chore_editor.every_n_days_after_i_finish") },
];

const ALL_DAYS_AT_NINE: Record<string, string[]> = Object.fromEntries(
  [0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), ["09:00"]])
);

/** Create or edit a chore: name, repeat, where, and its steps with waits. */
export class BoopliChoreEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    draft: { attribute: false },
    defaultStyle: { attribute: false },
    timeZone: { type: String },
    snapshot: { attribute: false },
    startSchedule: { type: Boolean },
    _error: { state: true },
    _busy: { state: true },
    _confirmDelete: { state: true },
    _sched: { state: true },
    _suggest: { state: true },
  };

  declare hass?: Hass;
  declare draft: ChoreDraft;
  declare defaultStyle: NudgeStyle;
  declare timeZone: string;
  declare snapshot?: Snapshot;
  /** Open straight in the schedule wizard (the "Set a schedule" button of the list). */
  declare startSchedule: boolean;
  declare _error: string;
  declare _busy: boolean;
  declare _confirmDelete: boolean;
  /** off: the form. inline: the wizard changes this draft. direct: it saves the chore itself. */
  declare _sched: "off" | "inline" | "direct";
  /** The AI "Suggest steps" screen is open. */
  declare _suggest: boolean;

  private _base?: string; // the draft as it was when the editor opened
  private _lastDirty = false;

  constructor() {
    super();
    this.defaultStyle = "one";
    this.timeZone = "UTC";
    this.startSchedule = false;
    this._error = "";
    this._busy = false;
    this._confirmDelete = false;
    this._sched = "off";
    this._suggest = false;
  }

  protected willUpdate(): void {
    if (this._base === undefined && this.draft) {
      this._base = JSON.stringify(this.draft);
      if (this.startSchedule) this._sched = "direct";
    }
  }

  /** The schedule wizard is done: use its schedule (and save at once when it was opened from the list). */
  private async _applySchedule(repeat: Repeat): Promise<void> {
    this._update({ repeat });
    if (this._sched === "direct") {
      this._sched = "off";
      await this.updateComplete;
      if (!(await this._save())) return; // the error shows in the form
    } else {
      this._sched = "off";
    }
  }

  private _cancelSchedule(): void {
    if (this._sched === "direct") this._close();
    else this._sched = "off";
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
    this._update({ steps: [...this.draft.steps, { title: "", wait_minutes: 0, size: "small", group: "" }] });
  }

  /** The AI steps are ready: put them in this chore (replacing or adding to what is there). */
  private _applySuggestion(result: BreakdownResult): void {
    const append = result.action === "append";
    const have = append ? this.draft.questions ?? [] : [];
    // New questions get fresh ids when adding to a chore, so they cannot mix with the ones it has.
    const taken = new Set(have.map((q) => q.id));
    const rename = new Map<string, string>();
    for (const q of result.questions ?? []) rename.set(q.id, taken.has(q.id) ? `${q.id}-${Math.random().toString(36).slice(2, 6)}` : q.id);
    const fresh = result.steps.map((s) => ({
      title: s.title,
      wait_minutes: s.wait_minutes,
      size: s.size,
      group: s.group,
      only_if: s.only_if ? rename.get(s.only_if) ?? "" : "",
    }));
    const questions = [...have, ...(result.questions ?? []).map((q) => ({ ...q, id: rename.get(q.id) ?? q.id }))].slice(0, MAX_QUESTIONS);
    const existing = this.draft.steps.filter((s) => s.title.trim() !== "");
    const steps = append ? [...existing, ...fresh] : fresh;
    this._update({ steps: steps.slice(0, 50), notes: result.notes, questions });
    this._suggest = false;
  }

  // --- questions asked when the chore starts -------------------------------------

  private _addQuestion(): void {
    const questions = [...(this.draft.questions ?? [])];
    if (questions.length >= MAX_QUESTIONS) return;
    questions.push({ id: `q${Math.random().toString(36).slice(2, 8)}`, text: "" });
    this._update({ questions });
  }

  private _setQuestion(id: string, text: string): void {
    this._update({ questions: (this.draft.questions ?? []).map((q) => (q.id === id ? { ...q, text } : q)) });
  }

  /** Taking a question away keeps its steps: they become steps that are always there. */
  private _removeQuestion(id: string): void {
    this._update({
      questions: (this.draft.questions ?? []).filter((q) => q.id !== id),
      steps: this.draft.steps.map((s) => (s.only_if === id ? { ...s, only_if: "" } : s)),
    });
  }

  private _openSuggest(): void {
    if (!this.draft.name.trim()) {
      this._error = t("chore_editor.give_the_chore_a_name_first");
      return;
    }
    this._error = "";
    this._suggest = true;
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent("editor-close", { bubbles: true, composed: true }));
  }

  private async _save(): Promise<boolean> {
    if (!this.hass || this._busy) return false;
    this._busy = true;
    this._error = "";
    try {
      // A question with no words is dropped, and the steps that pointed to it are always there.
      const questions = (this.draft.questions ?? [])
        .map((q) => ({ ...q, text: q.text.trim() }))
        .filter((q) => q.text);
      const known = new Set(questions.map((q) => q.id));
      await saveChore(this.hass, {
        ...this.draft,
        nudge_style: this.draft.nudge_style ?? this.defaultStyle,
        ignore_quiet_hours: this.draft.ignore_quiet_hours ?? false,
        keeps_going: this.draft.keeps_going ?? false,
        name: this.draft.name.trim(),
        questions,
        steps: this.draft.steps.map((s) => ({
          ...s,
          title: s.title.trim(),
          only_if: s.only_if && known.has(s.only_if) ? s.only_if : "",
          image: (s.image ?? "").trim(),
        })),
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
        <label for="repeat">${t("chore_editor.repeats")}</label>
        <select
          id="repeat"
          .value=${r.type}
          @change=${(e: Event) => {
            const type = (e.target as HTMLSelectElement).value as RepeatType;
            // A new schedule starts on every day at 09:00, to be changed day by day.
            const days = type === "schedule" && Object.keys(r.days).length === 0 ? ALL_DAYS_AT_NINE : r.days;
            this._updateRepeat({ type, days });
          }}
        >
          ${REPEAT_OPTIONS().map(
            (o) => html`<option value=${o.value} ?selected=${o.value === r.type}>${o.label}</option>`
          )}
        </select>
      </div>
      ${r.type === "schedule"
        ? html`<div class="field">
            <label>${t("chore_editor.each_day_has_its_own_times")}</label>
            <boopli-schedule-days
              .days=${r.days}
              @days-change=${(e: CustomEvent<Record<string, string[]>>) => this._updateRepeat({ days: e.detail })}
            ></boopli-schedule-days>
            <div class="muted small summary">${describeRepeat(r)}</div>
          </div>`
        : nothing}
      ${r.type === "every_n_days"
        ? html`<div class="field">
              <label for="n">${t("chore_editor.number_of_days")}</label>
              <input
                id="n"
                type="number"
                min="1"
                max="365"
                .value=${String(r.every_n_days)}
                @input=${(e: Event) =>
                  this._updateRepeat({ every_n_days: Number((e.target as HTMLInputElement).value) || 1 })}
              />
            </div>
            <div class="field">
              <label for="time">${t("chore_editor.at")}</label>
              <input
                id="time"
                type="time"
                .value=${r.time}
                @input=${(e: Event) => this._updateRepeat({ time: (e.target as HTMLInputElement).value })}
              />
            </div>`
        : nothing}
      <div class="field">
        <button type="button" @click=${() => (this._sched = "inline")}>${t("chore_editor.set_the_schedule_step_by_step")}</button>
      </div>
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
            aria-label=${t("chore_editor.step_title", { n: index + 1 })}
            placeholder=${t("chore_editor.what_to_do")}
            .value=${step.title}
            @input=${(e: Event) =>
              this._updateStep(index, { title: (e.target as HTMLInputElement).value })}
          />
          <span class="sizes" role="group" aria-label=${t("chore_editor.size_of_step", { n: index + 1 })}>
            ${(["small", "medium", "big"] as StepSize[]).map(
              (z) => html`<button
                type="button"
                class="chip size ${(step.size ?? "small") === z ? "on" : ""}"
                title="${z === "small" ? t("chore_editor.small_10_xp") : z === "medium" ? t("chore_editor.medium_15_xp") : t("chore_editor.big_20_xp")}"
                aria-pressed=${(step.size ?? "small") === z}
                @click=${() => this._updateStep(index, { size: z })}
              >
                ${z === "small" ? "S" : z === "medium" ? "M" : "B"}
              </button>`
            )}
          </span>
          <button type="button" aria-label=${t("ladders.move_up")} ?disabled=${index === 0} @click=${() => this._moveStep(index, -1)}>↑</button>
          <button type="button" aria-label=${t("ladders.move_down")} ?disabled=${index === last} @click=${() => this._moveStep(index, 1)}>↓</button>
          <button type="button" aria-label=${t("chore_editor.remove_step")} ?disabled=${last === 0} @click=${() => this._removeStep(index)}>✕</button>
        </div>
        <div class="part">
          <label class="muted small" for="part-${index}">${t("chore_editor.part_of_the_task_optional")}</label>
          <input
            id="part-${index}"
            class="part-input"
            list="parts-list"
            maxlength="40"
            placeholder=${t("chore_editor.for_example_desk")}
            .value=${step.group ?? ""}
            @input=${(e: Event) => this._updateStep(index, { group: (e.target as HTMLInputElement).value })}
          />
        </div>
        ${(this.draft.questions ?? []).length
          ? html`<div class="part">
              <label class="muted small" for="only-if-${index}">${t("chore_editor.only_if")}</label>
              <select
                id="only-if-${index}"
                class="part-input"
                @change=${(e: Event) => this._updateStep(index, { only_if: (e.target as HTMLSelectElement).value })}
              >
                <option value="" ?selected=${!step.only_if}>${t("common.always_there")}</option>
                ${(this.draft.questions ?? []).map(
                  (q) => html`<option value=${q.id} ?selected=${step.only_if === q.id}>${t("chore_editor.yes", { value: q.text || t("chore_editor.question_without_words") })}</option>`
                )}
              </select>
            </div>`
          : nothing}
        <div class="wait">
          <span class="muted small">
            ${(step.wait_for ?? []).length > 0 ? t("chore_editor.longest_it_waits_0_as_long") : t("chore_editor.wait_before_this_step")}
          </span>
          <div class="chips">
            ${WAIT_PRESETS().map(
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
                aria-label=${t("chore_editor.custom_wait_in_minutes")}
                type="number"
                min="0"
                max="10080"
                .value=${String(step.wait_minutes)}
                @input=${(e: Event) =>
                  this._updateStep(index, {
                    wait_minutes: Math.max(0, Number((e.target as HTMLInputElement).value) || 0),
                  })}
              />
              <span class="muted small">${t("chore_editor.min")}</span>
            </span>
          </div>
        </div>
        <details class="auto" ?open=${(step.wait_for ?? []).length > 0}>
          <summary>
            ${t("chore_editor.wait_until_this_happens")}
            ${(step.wait_for ?? []).length > 0
              ? html`<span class="muted small">${t("chore_editor.n_set", { n: (step.wait_for ?? []).length })}</span>`
              : nothing}
          </summary>
          <p class="muted small">
            ${t("chore_editor.the_step_stays_quiet_with_no")}
          </p>
          <boopli-triggers
            .hass=${this.hass}
            .triggers=${step.wait_for ?? []}
            @triggers-change=${(e: CustomEvent<Trigger[]>) =>
              this._updateStep(index, { wait_for: e.detail })}
          ></boopli-triggers>
        </details>
        <details class="auto" ?open=${!!step.image}>
          <summary>
            ${icon("camera-outline")} ${t("chore_editor.picture")}
            ${step.image ? html`<span class="muted small">${t("chore_editor.set")}</span>` : nothing}
          </summary>
          <boopli-picture
            .hass=${this.hass}
            .value=${step.image ?? ""}
            @picture-change=${(e: CustomEvent<string>) => this._updateStep(index, { image: e.detail })}
          ></boopli-picture>
        </details>
        <details class="auto" ?open=${(step.triggers ?? []).length > 0}>
          <summary>
            ${t("chore_editor.finishes_by_itself_when")}
            ${(step.triggers ?? []).length > 0
              ? html`<span class="muted small">${t("chore_editor.n_set", { n: (step.triggers ?? []).length })}</span>`
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
    if (this._suggest) {
      return html`<boopli-breakdown
        mode="editor"
        .hass=${this.hass}
        .snapshot=${this.snapshot}
        .kind=${d.repeat.type === "none" ? "now" : "recurring"}
        .task=${d.name}
        .notes=${d.notes ?? ""}
        .hasSteps=${d.steps.some((s) => s.title.trim() !== "")}
        @breakdown-result=${(e: CustomEvent<BreakdownResult>) => this._applySuggestion(e.detail)}
        @breakdown-cancel=${() => (this._suggest = false)}
      ></boopli-breakdown>`;
    }
    if (this._sched !== "off") {
      return html`<boopli-schedule-wizard
        .hass=${this.hass}
        .repeat=${d.repeat}
        .choreName=${d.name}
        .timeZone=${this.timeZone}
        .saves=${this._sched === "direct"}
        @schedule-apply=${(e: CustomEvent<Repeat>) => this._applySchedule(e.detail)}
        @schedule-cancel=${() => this._cancelSchedule()}
      ></boopli-schedule-wizard>`;
    }
    return html`
      <section class="card ${this._isDirty() ? "changed" : ""}">
        <h2>
          ${d.id ? t("chore_editor.edit_chore") : t("chores.new_chore")}
          ${this._isDirty() ? html`<span class="unsaved-badge">${t("settings.unsaved")}</span>` : nothing}
        </h2>

        <div class="editor-grid">
        <div class="col-a">
        <div class="field">
          <label for="name">${t("common.name")}</label>
          <input
            id="name"
            placeholder=${t("chore_editor.for_example_dishwasher")}
            .value=${d.name}
            @input=${(e: Event) => this._update({ name: (e.target as HTMLInputElement).value })}
          />
        </div>

        <div class="field">
          <label for="where">${t("chore_editor.where_does_it_make_sense")}</label>
          <select
            id="where"
            .value=${d.where}
            @change=${(e: Event) =>
              this._update({ where: (e.target as HTMLSelectElement).value as ChoreDraft["where"] })}
          >
            <option value="home" ?selected=${d.where === "home"}>${t("chore_editor.home_only")}</option>
            <option value="anywhere" ?selected=${d.where === "anywhere"}>${t("chore_editor.anywhere_for_example_pills")}</option>
          </select>
        </div>

        ${this._renderRepeat()}

        <div class="field">
          <label for="style">${t("chore_editor.how_should_boopli_nudge_you")}</label>
          <select
            id="style"
            .value=${normalizeStyle(d.nudge_style ?? this.defaultStyle, this.snapshot?.settings?.ladders)}
            @change=${(e: Event) =>
              this._update({ nudge_style: (e.target as HTMLSelectElement).value as NudgeStyle })}
          >
            ${[
              ...STYLE_OPTIONS(),
              ...(this.snapshot?.settings?.ladders ?? []).map((l) => ({
                value: `ladder:${l.id}` as NudgeStyle,
                label: l.id.startsWith("standard_") ? l.name : t("chore_editor.my_own_ladder", { name: l.name }),
              })),
            ].map(
              (o) => html`<option
                value=${o.value}
                ?selected=${o.value === normalizeStyle(d.nudge_style ?? this.defaultStyle, this.snapshot?.settings?.ladders)}
              >
                ${o.label}
              </option>`
            )}
            ${(d.nudge_style ?? this.defaultStyle).startsWith("ladder:") &&
            !(this.snapshot?.settings?.ladders ?? []).some((l) => `ladder:${l.id}` === (d.nudge_style ?? this.defaultStyle))
              ? html`<option value=${d.nudge_style ?? this.defaultStyle} selected>${t("chore_editor.a_ladder_that_is_gone")}</option>`
              : nothing}
          </select>
        </div>
        ${(this.snapshot?.settings?.lights ?? []).some((l) => lightHasColor(this.hass, l.entity_id))
          ? html`<div class="field">
          <label for="lightcolor">${t("chore_editor.light_color_for_this_chore_optional")}</label>
          <div class="colorrow">
            <input
              id="lightcolor"
              type="color"
              class="swatch"
              .value=${d.light_color ? rgbToHex(d.light_color) : rgbToHex(this.snapshot?.settings?.lights?.[0]?.color ?? [255, 90, 0])}
              @input=${(e: Event) => this._update({ light_color: hexToRgb((e.target as HTMLInputElement).value) })}
            />
            <button type="button" class="chip" ?disabled=${!d.light_color} @click=${() => this._update({ light_color: undefined })}>
              ${t("chore_editor.use_the_lights_own_color")}
            </button>
          </div>
          <div class="muted small">
            ${t("chore_editor.a_status_light_can_mean_something")}
          </div>
        </div>`
          : nothing}
        <div class="field check">
          <label class="inline">
            <input
              type="checkbox"
              .checked=${d.ignore_quiet_hours ?? false}
              @change=${(e: Event) =>
                this._update({ ignore_quiet_hours: (e.target as HTMLInputElement).checked })}
            />
            ${t("chore_editor.nudge_even_in_quiet_hours_for")}
          </label>
        </div>
        <div class="field check">
          <label class="inline">
            <input
              type="checkbox"
              .checked=${d.keeps_going ?? false}
              @change=${(e: Event) => this._update({ keeps_going: (e.target as HTMLInputElement).checked })}
            />
            ${t("chore_editor.keeps_going_while_im_away_for")}
          </label>
        </div>

        </div>
        <div class="col-b">
        <details class="auto questions" ?open=${(d.questions ?? []).length > 0}>
          <summary>
            ${t("chore_editor.questions_before_starting")}
            ${(d.questions ?? []).length > 0
              ? html`<span class="muted small">(${(d.questions ?? []).length})</span>`
              : nothing}
          </summary>
          <p class="muted small">
            ${t("chore_editor.asked_every_time_you_start_this")}
          </p>
          ${(d.questions ?? []).map(
            (q) => html`<div class="question">
              <input
                aria-label=${t("chore_editor.question")}
                maxlength="120"
                placeholder=${t("chore_editor.does_the_table_need_decluttering")}
                .value=${q.text}
                @input=${(e: Event) => this._setQuestion(q.id, (e.target as HTMLInputElement).value)}
              />
              <button type="button" aria-label=${t("chore_editor.remove_this_question")} @click=${() => this._removeQuestion(q.id)}>✕</button>
            </div>`
          )}
          <button type="button" ?disabled=${(d.questions ?? []).length >= MAX_QUESTIONS} @click=${() => this._addQuestion()}>
            ${t("chore_editor.add_a_question")}
          </button>
        </details>
        <h3 class="steps-title">${t("common.steps")}</h3>
        <datalist id="parts-list">
          ${[...new Set(d.steps.map((s) => (s.group ?? "").trim()).filter(Boolean))].map(
            (g) => html`<option value=${g}></option>`
          )}
        </datalist>
        ${d.steps.map((_, i) => this._renderStep(i))}
        <div class="step-buttons">
          <button type="button" @click=${() => this._addStep()}>${t("breakdown.add_a_step")}</button>
          <button type="button" @click=${() => this._openSuggest()}>${icon("auto-fix")} ${t("chore_editor.suggest_steps_with_ai")}</button>
        </div>
        </div>
        </div>

        ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

        <div class="actions">
          <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>${t("common.save")}</button>
          <button ?disabled=${this._busy} @click=${() => this._close()}>${t("common.cancel")}</button>
          ${d.id
            ? this._confirmDelete
              ? html`<span class="muted small">${t("chore_editor.delete_it_and_anything_in_progress")}</span>
                  <button class="danger" ?disabled=${this._busy} @click=${() => this._delete()}>${t("chore_editor.yes_delete")}</button>
                  <button @click=${() => (this._confirmDelete = false)}>${t("chore_editor.no")}</button>`
              : html`<button class="danger" @click=${() => (this._confirmDelete = true)}>${t("chore_editor.delete")}</button>`
            : nothing}
        </div>
      </section>
      ${this._isDirty()
        ? html`<div class="savebar" role="status">
            <span>${rich("chore_editor.you_have_unsaved_changes")}</span>
            <span class="spacer"></span>
            <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>${t("common.save")}</button>
            <button ?disabled=${this._busy} @click=${() => this._close()}>${t("common.discard")}</button>
          </div>`
        : nothing}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .colorrow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .colorrow .swatch {
        width: 56px;
        min-height: 36px;
        padding: 2px;
        flex: 0 0 auto;
      }
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
      .summary {
        margin-top: 8px;
      }
      .tag {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 14px;
        background: var(--secondary-background-color);
        color: var(--boopli-accent, var(--primary-color));
        white-space: nowrap;
      }
      .sizes {
        display: inline-flex;
        gap: 4px;
      }
      button.size {
        min-width: 32px;
        min-height: 32px;
        padding: 0;
        font-weight: 600;
      }
      .step-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
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
        font-size: 14px;
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
        font-size: 16px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .small {
        font-size: 15px;
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
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }
      .step-head > input {
        flex: 1 1 160px;
        min-width: 120px;
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
      .question {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
      }
      .question input {
        flex: 1;
        min-width: 0;
      }
      details.questions {
        margin-bottom: 8px;
      }
      .part {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
      }
      .part-input {
        max-width: 220px;
      }
      .wait .chips {
        margin-top: 6px;
      }
      details.auto {
        margin-top: 12px;
      }
      details.auto summary {
        cursor: pointer;
        font-size: 16px;
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
