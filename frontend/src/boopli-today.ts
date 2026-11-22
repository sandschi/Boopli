import { LitElement, html, css, nothing } from "lit";
import { completeStep, deleteChore, errorMessage, partPark, partTime, startChore, type ParkWhen } from "./api";
import { buildToday } from "./today";
import { describeWhen, fmtTime, sinceLabel } from "./time";
import { sharedStyles } from "./styles";
import "./boopli-pet";
import type { Chore, Hass, Mood, Pet, Run, Snapshot, StepRun } from "./types";

/** The question "when should this part come back?", for a part of a running task or a parked one. */
interface ParkAsk {
  runId?: string; // setting a part of a running task aside
  group?: string;
  choreId?: string; // changing the time of a part that is already parked
  picking: boolean; // the date and time picker is open
  at: string; // "YYYY-MM-DDTHH:MM"
}

/** How far along the part (group) of this step is, and whether it can be set aside. */
function partInfo(run: Run, step: StepRun): { done: number; total: number; canPark: boolean } | null {
  if (!step.group) return null;
  const inPart = run.steps.filter((s) => s.group === step.group);
  const outside = run.steps.some((s) => s.group !== step.group && s.status !== "done");
  return {
    done: inPart.filter((s) => s.status === "done").length,
    total: inPart.length,
    canPark: outside,
  };
}

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
    _quick: { state: true },
    _park: { state: true },
    _removing: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare _busy: boolean;
  declare _error: string;
  declare _toast: string;
  declare _quick: string;
  declare _park: ParkAsk | null;
  declare _removing: string; // the parked part that is asked "really remove?"
  private _lastRunIds: string[] = [];
  private _lastPet?: Pet;
  private _toastTimer?: number;

  constructor() {
    super();
    this.nowMs = Date.now();
    this._busy = false;
    this._error = "";
    this._toast = "";
    this._quick = "";
    this._park = null;
    this._removing = "";
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
    // A task that was running and is now finished: celebrate it by name.
    const runIds = this.snapshot.runs.map((r) => r.id);
    const finished = this._lastRunIds
      .filter((id) => !runIds.includes(id))
      .map((id) => this.snapshot!.history.find((h) => h.kind === "chore_done" && h.run_id === id)?.chore_name)
      .filter((name): name is string => !!name);
    this._lastRunIds = runIds;
    if (!before || pet.total_xp <= before.total_xp) return; // the first look shows nothing
    const parts = [`+${pet.total_xp - before.total_xp} XP`];
    if (finished.length) parts.unshift(`🎉 ${finished[0]} is done!`);
    if (pet.level > before.level) parts.push(`Level ${pet.level}!`);
    if (before.mood === "sad" || before.mood === "hibernating")
      parts.push(`${pet.name} is awake. Welcome back!`);
    this._toast = parts.join("  ·  ");
    window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = ""), 5000);
  }

  private _openBreakdown(kind: "now" | "recurring"): void {
    this.dispatchEvent(
      new CustomEvent("open-breakdown", {
        detail: { kind, task: this._quick.trim() },
        bubbles: true,
        composed: true,
      })
    );
    this._quick = "";
  }

  /** The quick task box: say what you want to get done and let the AI break it down. */
  private _renderQuick() {
    const aiOn = !!this.snapshot?.settings.ai?.enabled;
    return html`
      <section class="card quick">
        <h3>What do you want to get done?</h3>
        ${aiOn
          ? html`
              <textarea
                rows="2"
                placeholder="For example: clean the bathroom"
                .value=${this._quick}
                @input=${(e: Event) => (this._quick = (e.target as HTMLTextAreaElement).value)}
              ></textarea>
              <div class="quick-actions">
                <button class="primary" @click=${() => this._openBreakdown("now")}>✨ Break it down now</button>
                <button @click=${() => this._openBreakdown("recurring")}>🔁 Break down a recurring chore</button>
              </div>
            `
          : html`
              <p class="muted small">
                Boopli can split a big task into tiny steps with your own AI agent. It is switched off until you set it up.
              </p>
              <button
                @click=${() =>
                  this.dispatchEvent(
                    new CustomEvent("open-wizard", { detail: { wizard: "ai" }, bubbles: true, composed: true })
                  )}
              >
                🤖 Set up AI help
              </button>
            `}
      </section>
    `;
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

  // --- setting a part aside for later ---------------------------------------------------------

  /** A sensible default for the picker: tomorrow at 09:00, in the browser's own time. */
  private _defaultPick(): string {
    const d = new Date(this.nowMs + 24 * 3600 * 1000);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T09:00`;
  }

  private _openPark(ask: Omit<ParkAsk, "picking" | "at">): void {
    this._error = "";
    this._park = { ...ask, picking: false, at: this._defaultPick() };
  }

  private async _choose(when: ParkWhen): Promise<void> {
    const ask = this._park;
    if (!this.hass || !ask || this._busy) return;
    if (when === "at" && !ask.picking) {
      this._park = { ...ask, picking: true };
      return;
    }
    this._busy = true;
    this._error = "";
    try {
      if (ask.choreId) await partTime(this.hass, ask.choreId, when, ask.at);
      else await partPark(this.hass, ask.runId ?? "", ask.group ?? "", when, ask.at);
      this._park = null;
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _renderParkAsk() {
    const ask = this._park;
    if (!ask) return nothing;
    return html`<div class="park-ask" role="group" aria-label="When should this part come back?">
      <div class="small">${ask.choreId ? "When should it come back?" : `Set “${ask.group}” aside. When should it come back?`}</div>
      <div class="park-buttons">
        <button ?disabled=${this._busy} @click=${() => this._choose("any")}>When I want</button>
        <button ?disabled=${this._busy} @click=${() => this._choose("tomorrow")}>Tomorrow, 9:00</button>
        <button ?disabled=${this._busy} @click=${() => this._choose("at")}>Pick a time</button>
        <button class="link" @click=${() => (this._park = null)}>Cancel</button>
      </div>
      ${ask.picking
        ? html`<div class="park-pick">
            <input
              type="datetime-local"
              aria-label="Date and time"
              .value=${ask.at}
              @input=${(e: Event) => this._park && (this._park = { ...this._park, at: (e.target as HTMLInputElement).value })}
            />
            <button class="primary" ?disabled=${this._busy || !ask.at} @click=${() => this._choose("at")}>Set it</button>
          </div>`
        : nothing}
      <div class="muted small">Nothing is lost. The steps wait as their own small task under “Set aside for later”.</div>
    </div>`;
  }

  /** Parts that were set aside and are not running now. */
  private _parkedParts(): Chore[] {
    const running = new Set(this.snapshot?.runs.map((r) => r.chore_id) ?? []);
    return (this.snapshot?.chores ?? []).filter((c) => c.parked && !running.has(c.id));
  }

  private async _partAction(fn: () => Promise<unknown>): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await fn();
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _renderParked() {
    const parts = this._parkedParts();
    if (parts.length === 0) return nothing;
    const tz = this.snapshot?.time_zone ?? "UTC";
    return html`<section class="card parked">
      <h3>Set aside for later</h3>
      ${parts.map(
        (c) => html`<div class="part">
          <div class="part-name">${c.name}</div>
          <div class="muted small">
            ${c.steps.length} ${c.steps.length === 1 ? "step" : "steps"} ·
            ${c.next_due ? `comes back ${describeWhen(c.next_due, this.nowMs, tz)}` : "waiting until you start it"}
          </div>
          ${this._park?.choreId === c.id
            ? this._renderParkAsk()
            : html`<div class="part-actions">
                <button class="primary" ?disabled=${this._busy} @click=${() => this._partAction(() => startChore(this.hass!, c.id))}>
                  Start now
                </button>
                <button ?disabled=${this._busy} @click=${() => this._openPark({ choreId: c.id })}>Change time</button>
                ${this._removing === c.id
                  ? html`<span class="small">Remove it?</span>
                      <button
                        ?disabled=${this._busy}
                        @click=${() => this._partAction(async () => { await deleteChore(this.hass!, c.id); this._removing = ""; })}
                      >
                        Yes, remove
                      </button>
                      <button class="link" @click=${() => (this._removing = "")}>Keep</button>`
                  : html`<button class="link" @click=${() => (this._removing = c.id)}>Remove</button>`}
              </div>`}
        </div>`
      )}
    </section>`;
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

    const setup = this.snapshot.setup?.status;
    return html`
      <div class="cols"><div class="col">
      ${setup === "skipped" || setup === "in_progress"
        ? html`<section class="card banner">
            <span>Boopli is not fully set up yet.</span>
            <button
              class="primary"
              @click=${() =>
                this.dispatchEvent(
                  new CustomEvent("open-wizard", { bubbles: true, composed: true })
                )}
            >
              Finish setting up
            </button>
          </section>`
        : nothing}
      ${this._renderPet()}
      ${model.now
        ? html`
            <section class="card now">
              <div class="muted small">
                ${model.now.run.chore_name}
                ${model.now.step.group ? html`<span class="tag">${model.now.step.group}</span>` : nothing}
              </div>
              <h2>${model.now.step.title}</h2>
              ${model.now.total > 1
                ? html`<div class="progress">
                    <div class="bar" role="progressbar" aria-valuenow=${model.now.done} aria-valuemin="0" aria-valuemax=${model.now.total}>
                      <div class="fill" style="width:${(model.now.done / model.now.total) * 100}%"></div>
                    </div>
                    <div class="muted small">Step ${model.now.done + 1} of ${model.now.total}</div>
                  </div>`
                : nothing}
              ${(() => {
                const part = partInfo(model.now!.run, model.now!.step);
                return part && part.total > 1
                  ? html`<div class="muted small">${model.now!.step.group}: step ${Math.min(part.done + 1, part.total)} of ${part.total}</div>`
                  : nothing;
              })()}
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
              ${(() => {
                const part = partInfo(model.now!.run, model.now!.step);
                if (!part?.canPark) return nothing;
                if (this._park && this._park.runId === model.now!.run.id) return this._renderParkAsk();
                return html`<button
                  class="link later-btn"
                  ?disabled=${this._busy}
                  @click=${() => this._openPark({ runId: model.now!.run.id, group: model.now!.step.group })}
                >
                  Do this part later
                </button>`;
              })()}
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
      ${this._renderQuick()}
      </div><div class="col">
      ${this._renderParked()}
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
      </div></div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .small {
        font-size: 14px;
      }
      .quick h3 {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 10px;
      }
      .quick textarea {
        font: inherit;
        width: 100%;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
      }
      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .tag {
        margin-left: 6px;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-color);
      }
      .progress {
        margin: 6px 0 0;
      }
      .progress .bar {
        margin: 4px 0;
      }
      .banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
        padding: 12px 16px;
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
      .cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 24px;
        align-items: start;
      }
      .col {
        min-width: 0;
      }
      .now,
      .empty {
        padding: 24px 20px;
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
      .auto,
      .parked {
        margin-bottom: 24px;
      }
      .parked h3 {
        font-size: 15px;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
      }
      .part {
        padding: 10px 0;
        border-top: 1px solid var(--divider-color);
      }
      .part:first-of-type {
        border-top: 0;
      }
      .part-name {
        font-size: 16px;
      }
      .part-actions,
      .park-buttons,
      .park-pick {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      .park-ask {
        margin-top: 14px;
        padding: 12px 14px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
      }
      .later-btn,
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 8px 4px;
        font-size: 15px;
      }
      .later-btn {
        display: block;
        margin-top: 10px;
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
