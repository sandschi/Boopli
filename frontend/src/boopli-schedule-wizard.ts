import { LitElement, html, css, nothing } from "lit";
import { errorMessage, previewSchedule } from "./api";
import "./boopli-schedule-days";
import { sharedStyles } from "./styles";
import { describeRepeat, describeWhen, weekdayNames } from "./time";
import type { Hass, Repeat, RepeatType } from "./types";
import { t, rich } from "./i18n";

type Step = "how" | "days" | "times" | "interval" | "preview" | "done";

const STEPS: Record<RepeatType, Step[]> = {
  none: ["how", "done"],
  schedule: ["how", "days", "times", "preview", "done"],
  every_n_days: ["how", "interval", "preview", "done"],
};

const TITLES = (): Record<Step, string> => ({
  how: t("schedule_wizard.how_often"),
  days: t("schedule_wizard.which_days"),
  times: t("schedule_wizard.what_time_on_each_day"),
  interval: t("schedule_wizard.every_how_many_days"),
  preview: t("schedule_wizard.the_next_runs"),
  done: t("common.all_set"),
});

const HOW = (): { value: RepeatType; label: string; text: string }[] => [
  { value: "none", label: t("common.on_demand"), text: t("schedule_wizard.i_start_it_myself_when_i") },
  {
    value: "schedule",
    label: t("common.on_certain_days_and_times"),
    text: t("schedule_wizard.pick_the_days_each_day_gets"),
  },
  {
    value: "every_n_days",
    label: t("schedule_wizard.every_few_days_after_i_finish"),
    text: t("schedule_wizard.it_comes_back_a_number_of"),
  },
];

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * The schedule wizard for one chore: how often, which days, what time on each
 * day, a look at the next runs, and what changed. It never saves by itself in
 * the editor: it hands the new schedule back with `schedule-apply`. When it was
 * opened from the chore list (`saves`), the editor saves the chore at once.
 */
export class BoopliScheduleWizard extends LitElement {
  static properties = {
    hass: { attribute: false },
    repeat: { attribute: false },
    choreName: { type: String },
    timeZone: { type: String },
    saves: { type: Boolean },
    _draft: { state: true },
    _index: { state: true },
    _preview: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };

  declare hass?: Hass;
  declare repeat: Repeat;
  declare choreName: string;
  declare timeZone: string;
  declare saves: boolean;
  declare _draft?: Repeat;
  declare _index: number;
  declare _preview: string[] | null;
  declare _error: string;
  declare _busy: boolean;
  private _before?: Repeat;

  constructor() {
    super();
    this.choreName = "";
    this.timeZone = "UTC";
    this.saves = false;
    this._index = 0;
    this._preview = null;
    this._error = "";
    this._busy = false;
  }

  protected willUpdate(): void {
    if (!this._draft && this.repeat) {
      this._before = structuredClone(this.repeat);
      this._draft = structuredClone(this.repeat);
    }
  }

  private get _steps(): Step[] {
    return STEPS[this._draft?.type ?? "none"];
  }

  private get _step(): Step {
    return this._steps[Math.min(this._index, this._steps.length - 1)];
  }

  private _patch(patch: Partial<Repeat>): void {
    if (this._draft) this._draft = { ...this._draft, ...patch };
    this._preview = null;
    this._error = "";
  }

  private _toggleDay(day: number): void {
    if (!this._draft) return;
    const days = { ...this._draft.days };
    if ((days[String(day)] ?? []).length > 0) delete days[String(day)];
    else days[String(day)] = ["09:00"];
    this._patch({ days });
  }

  private _activeDays(): number[] {
    return ALL_DAYS.filter((d) => (this._draft?.days[String(d)] ?? []).length > 0);
  }

  private async _next(): Promise<void> {
    if (!this.hass || !this._draft || this._busy) return;
    this._error = "";
    if (this._step === "days" && this._activeDays().length === 0) {
      this._error = t("schedule_wizard.pick_at_least_one_day");
      return;
    }
    const target = this._index + 1;
    if (this._steps[target] === "preview") {
      this._busy = true;
      try {
        this._preview = await previewSchedule(this.hass, this._draft, 5);
      } catch (err) {
        this._error = errorMessage(err);
        return;
      } finally {
        this._busy = false;
      }
    }
    this._index = target;
  }

  private _back(): void {
    this._error = "";
    this._index = Math.max(0, this._index - 1);
  }

  private _apply(): void {
    if (!this._draft) return;
    this.dispatchEvent(new CustomEvent("schedule-apply", { detail: this._draft, bubbles: true, composed: true }));
  }

  private _cancel(): void {
    this.dispatchEvent(new CustomEvent("schedule-cancel", { bubbles: true, composed: true }));
  }

  // --- screens -----------------------------------------------------------------

  private _renderHow(d: Repeat) {
    return html`
      <p>${this.choreName ? rich("schedule_wizard.how_often_should_named", { chore: this.choreName }) : t("schedule_wizard.how_often_should_this_chore")}</p>
      ${HOW().map(
        (o) => html`<label class="inline option">
          <input
            type="radio"
            name="how"
            .checked=${d.type === o.value}
            @change=${() => this._patch({ type: o.value })}
          />
          <span><b>${o.label}</b><br /><span class="muted small">${o.text}</span></span>
        </label>`
      )}
    `;
  }

  private _renderDays(d: Repeat) {
    const active = this._activeDays();
    return html`
      <p>${t("schedule_wizard.tap_the_days_it_should_come")}</p>
      <div class="chips">
        ${ALL_DAYS.map(
          (day) => html`<button
            type="button"
            class="chip big ${active.includes(day) ? "on" : ""}"
            aria-pressed=${active.includes(day)}
            @click=${() => this._toggleDay(day)}
          >
            ${weekdayNames()[day]}
          </button>`
        )}
      </div>
      <div class="chips quick">
        <button
          type="button"
          class="chip"
          @click=${() =>
            this._patch({
              days: Object.fromEntries(
                ALL_DAYS.map((x) => [String(x), d.days[String(x)]?.length ? d.days[String(x)] : ["09:00"]])
              ),
            })}
        >
          ${t("schedule_wizard.every_day")}
        </button>
        <button type="button" class="chip" @click=${() => this._patch({ days: {} })}>${t("schedule_wizard.clear")}</button>
      </div>
    `;
  }

  private _renderTimes(d: Repeat) {
    return html`
      <p>
        ${t("schedule_wizard.what_time_on_each_day_a")}
      </p>
      <boopli-schedule-days
        .onlyActive=${true}
        .days=${d.days}
        @days-change=${(e: CustomEvent<Record<string, string[]>>) => this._patch({ days: e.detail })}
      ></boopli-schedule-days>
    `;
  }

  private _renderInterval(d: Repeat) {
    return html`
      <p>${t("schedule_wizard.it_comes_back_this_many_days")}</p>
      <div class="chips">
        ${[2, 3, 7, 14, 30, 90].map(
          (n) => html`<button type="button" class="chip ${d.every_n_days === n ? "on" : ""}" @click=${() => this._patch({ every_n_days: n })}>${t("schedule_wizard.days", { n })}</button>`
        )}
        <input
          class="short"
          type="number"
          min="1"
          max="365"
          aria-label=${t("chore_editor.number_of_days")}
          .value=${String(d.every_n_days)}
          @input=${(e: Event) => this._patch({ every_n_days: Number((e.target as HTMLInputElement).value) || 1 })}
        />
      </div>
      <div class="field">
        <label for="time">${t("schedule_wizard.at_what_time_of_day")}</label>
        <input
          id="time"
          type="time"
          .value=${d.time}
          @input=${(e: Event) => this._patch({ time: (e.target as HTMLInputElement).value })}
        />
      </div>
    `;
  }

  private _renderPreview(d: Repeat) {
    const times = this._preview ?? [];
    const now = Date.now();
    return html`
      <p>
        ${d.type === "every_n_days"
          ? t("schedule_wizard.the_first_time_and_then_every")
          : t("schedule_wizard.this_is_when_it_comes_up")}
      </p>
      ${times.length === 0
        ? html`<p class="muted">${t("schedule_wizard.nothing_is_scheduled")}</p>`
        : html`<ul>${times.map((t) => html`<li>${describeWhen(t, now, this.timeZone)}</li>`)}</ul>`}
      ${d.type === "every_n_days"
        ? html`<p class="muted small">${t("schedule_wizard.after_that_days_after_you_finish", { every_n_days: d.every_n_days, time: d.time })}</p>`
        : nothing}
    `;
  }

  private _renderDone(d: Repeat) {
    const before = this._before ? describeRepeat(this._before) : "";
    const after = describeRepeat(d);
    const same = JSON.stringify(this._before) === JSON.stringify(d);
    return html`
      <p>${this.choreName ? rich("schedule_wizard.what_changed_for_named", { chore: this.choreName }) : rich("schedule_wizard.what_changed_for_this_chore")}</p>
      ${same
        ? html`<p class="muted">${t("schedule_wizard.nothing_changed", { after })}</p>`
        : html`<ul><li>${t("schedule_wizard.schedule", { before, after })}</li></ul>`}
      <p class="muted small">
        ${this.saves
          ? t("schedule_wizard.saving_applies_it_to_the_chore")
          : t("schedule_wizard.using_it_fills_in_the_chores")}
      </p>
    `;
  }

  private _renderStep(d: Repeat) {
    switch (this._step) {
      case "how":
        return this._renderHow(d);
      case "days":
        return this._renderDays(d);
      case "times":
        return this._renderTimes(d);
      case "interval":
        return this._renderInterval(d);
      case "preview":
        return this._renderPreview(d);
      default:
        return this._renderDone(d);
    }
  }

  render() {
    const d = this._draft;
    if (!d) return nothing;
    const steps = this._steps;
    const step = this._step;
    const last = step === "done";
    return html`
      <div class="shell">
        <nav class="rail" aria-label=${t("common.steps")}>
          <div class="rail-title">${this.choreName ? t("schedule_wizard.schedule_named", { chore: this.choreName }) : t("schedule_wizard.schedule")}</div>
          ${steps.map(
            (id, i) => html`<div class="rail-item ${i === this._index ? "current" : ""} ${i < this._index ? "past" : ""}">
              <span class="mark">${i < this._index ? "✓" : i + 1}</span>
              <span>${TITLES()[id]}</span>
            </div>`
          )}
        </nav>
        <section class="card main">
          <div class="top">
            <span class="muted small">${t("schedule_wizard.step_of", { value: this._index + 1, count: steps.length })}</span>
            <button type="button" class="link" @click=${() => this._cancel()}>${t("common.close")}</button>
          </div>
          <div class="bar"><div class="fill" style="width:${((this._index + 1) / steps.length) * 100}%"></div></div>
          <h2>${TITLES()[step]}</h2>
          ${this._renderStep(d)}
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
          <div class="actions">
            ${this._index > 0
              ? html`<button type="button" ?disabled=${this._busy} @click=${() => this._back()}>${t("common.back")}</button>`
              : nothing}
            <span class="spacer"></span>
            ${last
              ? html`<button type="button" class="primary" @click=${() => this._apply()}>
                  ${this.saves ? t("schedule_wizard.save_schedule") : t("schedule_wizard.use_this_schedule")}
                </button>`
              : html`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._next()}>${t("common.next")}</button>`}
          </div>
        </section>
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .shell {
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        gap: 24px;
        align-items: start;
      }
      .rail {
        position: sticky;
        top: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .rail-title {
        font-size: 15px;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0 0 8px 8px;
      }
      .rail-item {
        display: flex;
        align-items: center;
        gap: 10px;
        border-radius: 10px;
        padding: 8px 10px;
        color: var(--secondary-text-color);
      }
      .rail-item.current {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        font-weight: 500;
      }
      .rail-item.past {
        color: var(--primary-text-color);
      }
      .mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
        border-radius: 50%;
        border: 1px solid var(--divider-color);
        font-size: 14px;
      }
      .past .mark {
        background: var(--boopli-accent, var(--primary-color));
        border-color: var(--boopli-accent, var(--primary-color));
        color: var(--text-primary-color, #fff);
      }
      .main {
        padding: 24px;
        min-width: 0;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 4px 6px;
      }
      .bar {
        height: 6px;
        border-radius: 999px;
        background: var(--secondary-background-color);
        overflow: hidden;
        margin-bottom: 18px;
      }
      .fill {
        height: 100%;
        background: var(--boopli-accent, var(--primary-color));
        transition: width 0.3s ease;
      }
      h2 {
        font-size: 22px;
        margin-bottom: 10px;
      }
      p {
        margin: 10px 0;
        line-height: 1.5;
        max-width: 760px;
      }
      .small {
        font-size: 15px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 17px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      label.option {
        padding: 12px 14px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        margin: 8px 0;
        max-width: 760px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .chips.quick {
        margin-top: 14px;
      }
      button.chip.big {
        min-width: 64px;
        min-height: 48px;
        font-size: 18px;
      }
      input.short {
        width: 90px;
      }
      .field {
        margin: 16px 0;
        max-width: 260px;
      }
      ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      li {
        margin: 6px 0;
      }
      .actions {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 24px;
      }
      .actions button {
        min-width: 84px;
        min-height: 46px;
      }
      .spacer {
        flex: 1;
      }
      @media (max-width: 860px) {
        .shell {
          grid-template-columns: minmax(0, 1fr);
        }
        .rail {
          display: none;
        }
      }
    `,
  ];
}

customElements.define("boopli-schedule-wizard", BoopliScheduleWizard);
