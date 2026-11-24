import { LitElement, html, css, nothing } from "lit";
import { sharedStyles } from "./styles";
import { WEEKDAY_NAMES } from "./time";
import { t } from "./i18n";

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const MAX_TIMES = 6;

/** A sensible time to add after the ones a day already has. */
function nextTime(times: string[]): string {
  if (times.length === 0) return "09:00";
  const [h, m] = times[times.length - 1].split(":").map(Number);
  return `${String(Math.min(23, (h || 0) + 4)).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
}

/**
 * One row per weekday with its own times. A day can have several times (pills
 * twice a day), or none. Days are never grouped: Monday to Sunday each stand
 * on their own. Emits `days-change` with the new `days`.
 *
 * With `onlyActive` just the days that have times are shown (the wizard picks
 * the days in an earlier step).
 */
export class BoopliScheduleDays extends LitElement {
  static properties = {
    days: { attribute: false },
    onlyActive: { type: Boolean },
  };

  declare days: Record<string, string[]>;
  declare onlyActive: boolean;

  constructor() {
    super();
    this.days = {};
    this.onlyActive = false;
  }

  private _emit(days: Record<string, string[]>): void {
    // A day without times is simply not in the schedule.
    const cleaned = Object.fromEntries(Object.entries(days).filter(([, tm]) => tm.length > 0));
    this.dispatchEvent(new CustomEvent("days-change", { detail: cleaned, bubbles: true, composed: true }));
  }

  private _times(day: number): string[] {
    return this.days[String(day)] ?? [];
  }

  private _setDay(day: number, times: string[]): void {
    this._emit({ ...this.days, [String(day)]: times });
  }

  private _setTime(day: number, index: number, value: string): void {
    if (!value) return;
    this._setDay(day, this._times(day).map((tm, i) => (i === index ? value : tm)));
  }

  private _shownDays(): number[] {
    return this.onlyActive ? DAYS.filter((d) => this._times(d).length > 0) : DAYS;
  }

  render() {
    const shown = this._shownDays();
    return html`
      <div class="rows">
        ${shown.map((day, position) => {
          const times = this._times(day);
          const above = position > 0 ? shown[position - 1] : null;
          const on = times.length > 0;
          return html`<div class="row ${on ? "" : "off"}">
            <span class="dayname">${WEEKDAY_NAMES[day]}</span>
            ${this.onlyActive
              ? nothing
              : html`<label class="inline small">
                  <input
                    type="checkbox"
                    .checked=${on}
                    @change=${(e: Event) =>
                      this._setDay(day, (e.target as HTMLInputElement).checked ? [nextTime([])] : [])}
                  />
                  Runs
                </label>`}
            ${on
              ? html`<div class="times">
                  ${times.map(
                    (tm, i) => html`<span class="time">
                      <input
                        type="time"
                        aria-label="${WEEKDAY_NAMES[day]} time ${i + 1}"
                        .value=${tm}
                        @change=${(e: Event) => this._setTime(day, i, (e.target as HTMLInputElement).value)}
                      />
                      ${times.length > 1
                        ? html`<button
                            type="button"
                            class="x"
                            aria-label=${t("schedule_days.remove_this_time")}
                            @click=${() => this._setDay(day, times.filter((_, k) => k !== i))}
                          >
                            ✕
                          </button>`
                        : nothing}
                    </span>`
                  )}
                  ${times.length < MAX_TIMES
                    ? html`<button type="button" class="chip" @click=${() => this._setDay(day, [...times, nextTime(times)])}>${t("schedule_days.time")}</button>`
                    : nothing}
                </div>`
              : html`<span class="muted small">${t("schedule_days.no_run_this_day")}</span>`}
            ${above !== null
              ? html`<button
                  type="button"
                  class="chip same"
                  @click=${() => this._setDay(day, [...this._times(above)])}
                >
                  Same as ${WEEKDAY_NAMES[above]}
                </button>`
              : nothing}
          </div>`;
        })}
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .rows {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
      }
      .row.off {
        opacity: 0.75;
      }
      .dayname {
        width: 40px;
        font-weight: 500;
      }
      .times {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .time {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .time input {
        width: 130px;
      }
      .x {
        padding: 2px 8px;
        min-height: 32px;
      }
      .small {
        font-size: 15px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .same {
        margin-left: auto;
      }
    `,
  ];
}

customElements.define("boopli-schedule-days", BoopliScheduleDays);
