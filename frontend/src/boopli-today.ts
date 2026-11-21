import { LitElement, html, css, nothing } from "lit";
import { completeStep, errorMessage } from "./api";
import { buildToday } from "./today";
import { fmtTime, sinceLabel } from "./time";
import { sharedStyles } from "./styles";
import type { Hass, Snapshot } from "./types";

/**
 * The Today screen.
 *
 * Top: the one step it is your turn for, big, with Done.
 * Below, dimmed and calm: everything else still to do today.
 */
export class BoopliToday extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    nowMs: { type: Number },
    _busy: { state: true },
    _error: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare _busy: boolean;
  declare _error: string;

  constructor() {
    super();
    this.nowMs = Date.now();
    this._busy = false;
    this._error = "";
  }

  private async _done(runId: string, stepId: string): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await completeStep(this.hass, runId, stepId);
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  render() {
    if (!this.snapshot) return html`<p class="muted">Loading…</p>`;
    const tz = this.snapshot.time_zone;
    const model = buildToday(this.snapshot, this.nowMs);
    const hasChores = this.snapshot.chores.length > 0;

    return html`
      ${model.now
        ? html`
            <section class="card now">
              <div class="muted small">${model.now.run.chore_name}</div>
              <h2>${model.now.step.title}</h2>
              ${model.now.step.active_at
                ? html`<div class="muted small">
                    ${sinceLabel(model.now.step.active_at, tz)}
                  </div>`
                : nothing}
              ${model.now.step.snoozed_until &&
              Date.parse(model.now.step.snoozed_until) > this.nowMs
                ? html`<div class="muted small">
                    Snoozed until ${fmtTime(model.now.step.snoozed_until, tz)}
                  </div>`
                : nothing}
              <button
                class="primary done"
                ?disabled=${this._busy}
                @click=${() =>
                  this._done(model.now!.run.id, model.now!.step.step_id)}
              >
                Done
              </button>
              ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
            </section>
          `
        : html`
            <section class="card empty">
              <h2>Nothing needs you right now</h2>
              <p class="muted">
                ${hasChores
                  ? "Enjoy the quiet. What is coming up shows below."
                  : "Add your first chore in the Chores tab."}
              </p>
            </section>
          `}
      ${model.groups.length > 0 || model.dueToday.length > 0
        ? html`
            <section class="later dim">
              <h3>Still to do today</h3>
              ${model.groups.map(
                (g) => html`
                  <div class="group">
                    <div class="group-name">${g.run.chore_name}</div>
                    ${g.steps.map(
                      (s) => html`
                        <div class="row">
                          <span>${s.title}</span>
                          <span class="hint">${s.hint}</span>
                        </div>
                      `
                    )}
                  </div>
                `
              )}
              ${model.dueToday.map(
                (d) => html`
                  <div class="group">
                    <div class="row">
                      <span class="group-name">${d.chore.name}</span>
                      <span class="hint">at ${fmtTime(d.at, tz)}</span>
                    </div>
                  </div>
                `
              )}
            </section>
          `
        : nothing}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .small {
        font-size: 14px;
      }
      .now,
      .empty {
        text-align: center;
        padding: 28px 16px;
      }
      .now h2 {
        font-size: 28px;
        margin: 8px 0;
      }
      .done {
        margin-top: 20px;
        min-width: 180px;
        min-height: 56px;
        font-size: 20px;
        border-radius: 14px;
      }
      .later {
        margin-top: 28px;
      }
      .later h3 {
        font-size: 15px;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
      }
      .group {
        padding: 8px 0;
        border-top: 1px solid var(--divider-color);
      }
      .group-name {
        font-size: 15px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 14px;
        padding: 2px 0 2px 12px;
      }
      .group > .row:only-child {
        padding-left: 0;
      }
      .hint {
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
    `,
  ];
}

customElements.define("boopli-today", BoopliToday);
