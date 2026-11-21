import { LitElement, html, css, nothing } from "lit";
import { completeStep, errorMessage } from "./api";
import { buildToday } from "./today";
import { fmtTime, sinceLabel } from "./time";
import { sharedStyles } from "./styles";
import "./boopli-pet";
import type { Hass, Mood, Pet, Snapshot } from "./types";

/** One friendly line per mood. Rewards only: nothing here ever scolds. */
function moodLine(pet: Pet): string {
  const lines: Record<Mood, string> = {
    happy: "Nice, you got things done today.",
    content: "Ready when you are.",
    sleepy: `${pet.name} is a bit sleepy.`,
    sad: `${pet.name} misses you. One step is enough.`,
    hibernating: `${pet.name} is curled up, resting until you are back. One step wakes it.`,
  };
  return lines[pet.mood];
}

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
    _toast: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare _busy: boolean;
  declare _error: string;
  declare _toast: string;
  private _lastPet?: Pet;
  private _toastTimer?: number;

  constructor() {
    super();
    this.nowMs = Date.now();
    this._busy = false;
    this._error = "";
    this._toast = "";
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearTimeout(this._toastTimer);
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    if (!changed.has("snapshot") || !this.snapshot?.pet) return;
    const pet = this.snapshot.pet;
    const before = this._lastPet;
    this._lastPet = pet;
    if (!before || pet.total_xp <= before.total_xp) return; // the first look shows nothing
    const parts = [`+${pet.total_xp - before.total_xp} XP`];
    if (pet.level > before.level) parts.push(`Level ${pet.level}!`);
    if (before.mood === "sad" || before.mood === "hibernating")
      parts.push(`${pet.name} is awake. Welcome back!`);
    this._toast = parts.join("  ·  ");
    window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = ""), 5000);
  }

  private _renderPet() {
    const pet = this.snapshot?.pet;
    if (!pet) return nothing;
    const pct = pet.xp_for_level > 0 ? Math.round((pet.xp_in_level / pet.xp_for_level) * 100) : 0;
    return html`
      <section class="card pet-card">
        <boopli-pet .mood=${pet.mood} .level=${pet.level}></boopli-pet>
        <div class="pet-info">
          <div class="pet-name">${pet.name} <span class="muted">· Level ${pet.level}</span></div>
          <div class="bar" role="progressbar" aria-valuenow=${pct} aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width:${pct}%"></div>
          </div>
          <div class="muted small">${pet.xp_in_level} / ${pet.xp_for_level} XP to the next level</div>
          <div class="small">${moodLine(pet)}</div>
        </div>
      </section>
      ${this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : nothing}
    `;
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

  /** Steps that finished by themselves in the last day, so nothing happens silently. */
  private _renderAuto() {
    const snapshot = this.snapshot;
    if (!snapshot) return nothing;
    const since = this.nowMs - 24 * 3600 * 1000;
    const items = snapshot.history
      .filter((h) => h.kind === "step_done" && h.by === "auto" && Date.parse(h.ts) >= since)
      .slice(-3)
      .reverse();
    if (items.length === 0) return nothing;
    return html`
      <section class="auto dim">
        <h3>Done by itself</h3>
        ${items.map(
          (h) => html`<div class="row">
            <span>✓ ${h.chore_name}: ${h.step_title}</span>
            <span class="hint">${h.reason ? `${h.reason}, ` : ""}${fmtTime(h.ts, snapshot.time_zone)}</span>
          </div>`
        )}
      </section>
    `;
  }

  render() {
    if (!this.snapshot) return html`<p class="muted">Loading…</p>`;
    const tz = this.snapshot.time_zone;
    const model = buildToday(this.snapshot, this.nowMs);
    const hasChores = this.snapshot.chores.length > 0;

    return html`
      ${this._renderPet()}
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
      ${this._renderAuto()}
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
      .pet-card {
        display: flex;
        gap: 14px;
        align-items: center;
        margin-bottom: 16px;
        padding: 12px 16px;
      }
      .pet-info {
        flex: 1;
        min-width: 0;
      }
      .pet-name {
        font-size: 17px;
        font-weight: 500;
      }
      .bar {
        height: 8px;
        border-radius: 999px;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        overflow: hidden;
        margin: 6px 0 4px;
      }
      .fill {
        height: 100%;
        background: var(--primary-color);
        border-radius: 999px;
        transition: width 0.4s ease;
      }
      .toast {
        position: fixed;
        left: 50%;
        bottom: 28px;
        transform: translateX(-50%);
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        padding: 10px 18px;
        border-radius: 999px;
        font-weight: 500;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        z-index: 10;
        max-width: 90vw;
        text-align: center;
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
      .later,
      .auto {
        margin-top: 28px;
      }
      .auto h3 {
        font-size: 15px;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
      }
      .auto .row {
        padding-left: 0;
      }
      .auto .hint {
        white-space: normal;
        text-align: right;
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
