import { LitElement, html, css, nothing } from "lit";
import { awayEnd, awaySet, errorMessage } from "./api";
import { sharedStyles } from "./styles";
import { describeWhen } from "./time";
import type { Away, Hass, Snapshot } from "./types";

/** A local date and time for a date picker ("YYYY-MM-DDTHH:MM"), `days` from today at `hour`:00. */
function localPick(days: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return pickValue(d);
}

function pickValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** One line for banners: "until Sun 29 Nov, 18:00", "from Sat 28 Nov, 08:00 until …" or "until you turn it off". */
export function awayWhen(away: Away, nowMs: number, tz: string, onNow: boolean): string {
  const until = away.until ? `until ${describeWhen(away.until, nowMs, tz)}` : "until you turn it off";
  if (onNow || !away.start) return until;
  return `from ${describeWhen(away.start, nowMs, tz)} ${until}`;
}

/**
 * Away mode, in Settings: while it is off, the form to switch it on; while it is on, what is
 * set, with Back now and Change. While it is on nothing starts and nothing nudges you, except
 * the chores that keep going (pills, feeding a cat).
 */
export class BoopliAway extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    nowMs: { type: Number },
    _changing: { state: true },
    _later: { state: true },
    _start: { state: true },
    _open: { state: true },
    _until: { state: true },
    _keep: { state: true },
    _busy: { state: true },
    _error: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare _changing: boolean; // away mode is on and its form is open to change it
  declare _later: boolean; // it begins at a date, not now
  declare _start: string;
  declare _open: boolean; // true = no end date, until you switch it off
  declare _until: string;
  declare _keep: Record<string, boolean>; // chore id -> keeps going while away
  declare _busy: boolean;
  declare _error: string;
  private _seeded = false;

  constructor() {
    super();
    this.nowMs = Date.now();
    this._changing = false;
    this._later = false;
    this._start = localPick(1, 8);
    this._open = false;
    this._until = localPick(7, 18);
    this._keep = {};
    this._busy = false;
    this._error = "";
  }

  protected willUpdate(): void {
    if (!this._seeded && this.snapshot) {
      this._seeded = true;
      this._seedKeep();
    }
  }

  private _seedKeep(): void {
    this._keep = Object.fromEntries(this._chores().map((c) => [c.id, c.keeps_going ?? false]));
  }

  /** The chores that can keep going: not the small set-aside parts. */
  private _chores() {
    return (this.snapshot?.chores ?? []).filter((c) => !c.parked).sort((a, b) => a.name.localeCompare(b.name));
  }

  private _change(away: Away): void {
    this._later = !!away.start && new Date(away.start).getTime() > Date.now();
    if (away.start) this._start = pickValue(new Date(away.start));
    this._open = !away.until;
    if (away.until) this._until = pickValue(new Date(away.until));
    this._seedKeep();
    this._error = "";
    this._changing = true;
  }

  private async _submit(): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await awaySet(this.hass, this._later ? this._start : "", this._open ? "" : this._until, this._keep);
      this._changing = false;
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private async _back(): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await awayEnd(this.hass);
      this._changing = false;
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _renderOn(away: Away) {
    const onNow = !!this.snapshot?.away_now;
    const tz = this.snapshot?.time_zone ?? "UTC";
    return html`
      <h2>🧳 Away mode is ${onNow ? "on" : "planned"}</h2>
      <p>${awayWhen(away, this.nowMs, tz, onNow)}</p>
      <p class="muted small">
        ${onNow
          ? "Nothing starts and nothing nudges you, except the chores that keep going."
          : "Boopli carries on as usual until then."}
      </p>
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      <div class="actions">
        <button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._back()}>
          ${onNow ? "Back now" : "Cancel it"}
        </button>
        <button type="button" ?disabled=${this._busy} @click=${() => this._change(away)}>Change</button>
      </div>
    `;
  }

  private _renderForm(away: Away | undefined) {
    const chores = this._chores();
    return html`
      <h2>🧳 ${away?.active ? "Change away mode" : "Away mode"}</h2>
      <p class="muted small">
        Boopli rests: nothing starts and nothing nudges you, except the chores you tick below. Your pet stays just as
        it is, and when you are back it carries on from there.
      </p>

      <div class="field">
        <div class="label">From</div>
        <div class="chips">
          <button type="button" class="chip ${this._later ? "" : "on"}" @click=${() => (this._later = false)}>Now</button>
          <button type="button" class="chip ${this._later ? "on" : ""}" @click=${() => (this._later = true)}>A date…</button>
        </div>
        ${this._later
          ? html`<input
              type="datetime-local"
              aria-label="Away from"
              .value=${this._start}
              @input=${(e: Event) => (this._start = (e.target as HTMLInputElement).value)}
            />`
          : nothing}
      </div>

      <div class="field">
        <div class="label">Until</div>
        <div class="chips">
          <button type="button" class="chip ${this._open ? "" : "on"}" @click=${() => (this._open = false)}>A date…</button>
          <button type="button" class="chip ${this._open ? "on" : ""}" @click=${() => (this._open = true)}>
            Until I turn it off
          </button>
        </div>
        ${this._open
          ? nothing
          : html`<input
              type="datetime-local"
              aria-label="Away until"
              .value=${this._until}
              @input=${(e: Event) => (this._until = (e.target as HTMLInputElement).value)}
            />`}
      </div>

      ${chores.length
        ? html`<div class="field">
            <div class="label">These keep going while I'm away</div>
            <div class="muted small">Tick what you still want to be nudged about, like pills.</div>
            <div class="keep">
              ${chores.map(
                (c) => html`<label class="inline">
                  <input
                    type="checkbox"
                    .checked=${this._keep[c.id] ?? false}
                    @change=${(e: Event) => (this._keep = { ...this._keep, [c.id]: (e.target as HTMLInputElement).checked })}
                  />
                  ${c.name}
                </label>`
              )}
            </div>
          </div>`
        : nothing}

      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      <div class="actions">
        <button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._submit()}>
          ${away?.active ? "Save away mode" : "Start away mode"}
        </button>
        ${away?.active
          ? html`<button type="button" class="link" @click=${() => (this._changing = false)}>Cancel</button>`
          : nothing}
      </div>
    `;
  }

  render() {
    const away = this.snapshot?.away;
    if (away?.active && !this._changing) return this._renderOn(away);
    return this._renderForm(away);
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      h2 {
        margin-top: 0;
      }
      .field {
        margin: 14px 0;
      }
      .label {
        font-weight: 500;
        margin-bottom: 6px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }
      input[type="datetime-local"] {
        max-width: 100%;
      }
      .keep {
        display: grid;
        gap: 8px;
        margin-top: 8px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-top: 16px;
      }
      .small {
        font-size: 14px;
      }
    `,
  ];
}

customElements.define("boopli-away", BoopliAway);
