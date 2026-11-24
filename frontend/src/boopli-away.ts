import { LitElement, html, css, nothing } from "lit";
import { awayEnd, awaySet, errorMessage } from "./api";
import { sharedStyles } from "./styles";
import { icon } from "./icon";
import { dayKey, describeWhen } from "./time";
import type { Away, Hass, Snapshot } from "./types";
import { t } from "./i18n";

/**
 * A date and time for a date picker ("YYYY-MM-DDTHH:MM"), `days` from today at `hour`:00.
 * "Today" and the time are in Home Assistant's time zone, the one the server reads the
 * picked value in, not the zone of whatever browser or phone is looking.
 */
function localPick(days: number, hour: number, tz: string): string {
  const [y, m, d] = dayKey(new Date(), tz).split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  return `${day}T${String(hour).padStart(2, "0")}:00`;
}

/** The same kind of value for a moment in time, written in the given time zone. */
function pickValue(iso: string, tz: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
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
    _expanded: { state: true },
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
  declare _expanded: boolean; // the card is open (it starts as one thin row)
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
    this._expanded = false;
    this._later = false;
    this._start = localPick(1, 8, "UTC");
    this._open = false;
    this._until = localPick(7, 18, "UTC");
    this._keep = {};
    this._busy = false;
    this._error = "";
  }

  protected willUpdate(): void {
    if (!this._seeded && this.snapshot) {
      this._seeded = true;
      this._start = localPick(1, 8, this.snapshot.time_zone);
      this._until = localPick(7, 18, this.snapshot.time_zone);
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
    const tz = this.snapshot?.time_zone ?? "UTC";
    this._later = !!away.start && new Date(away.start).getTime() > Date.now();
    if (away.start) this._start = pickValue(away.start, tz);
    this._open = !away.until;
    if (away.until) this._until = pickValue(away.until, tz);
    this._seedKeep();
    this._error = "";
    this._changing = true;
    this._expanded = true;
  }

  private _toggle(): void {
    const open = this._expanded || this._changing;
    this._changing = false;
    this._expanded = !open;
    this._error = "";
  }

  private async _submit(): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await awaySet(this.hass, this._later ? this._start : "", this._open ? "" : this._until, this._keep);
      this._changing = false;
      this._expanded = false; // done: back to the thin row, which now says it is on
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
      this._expanded = false;
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
      <p class="muted small">
        ${t("away.boopli_rests_nothing_starts_and_nothing")}
      </p>

      <div class="field">
        <div class="label">${t("away.from")}</div>
        <div class="chips">
          <button type="button" class="chip ${this._later ? "" : "on"}" @click=${() => (this._later = false)}>${t("away.now")}</button>
          <button type="button" class="chip ${this._later ? "on" : ""}" @click=${() => (this._later = true)}>${t("away.a_date")}</button>
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
              aria-label=${t("away.away_until")}
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
          ? html`<button type="button" class="link" @click=${() => (this._changing = false)}>${t("common.cancel")}</button>`
          : nothing}
      </div>
    `;
  }

  render() {
    const away = this.snapshot?.away;
    const tz = this.snapshot?.time_zone ?? "UTC";
    const onNow = !!this.snapshot?.away_now;
    const open = this._expanded || this._changing;
    const status = away?.active
      ? `${onNow ? "On" : "Planned"}: ${awayWhen(away, this.nowMs, tz, onNow)}`
      : "Off";
    return html`
      <div class="head-row">
        <button type="button" class="head" aria-expanded=${open} @click=${() => this._toggle()}>
          <span class="title">${icon("bag-suitcase")} ${t("away.away_mode")}</span>
          <span class="status ${away?.active ? "on" : ""}">${status}</span>
          <span class="chev" aria-hidden="true">${open ? "▾" : "▸"}</span>
        </button>
        ${away?.active && !open
          ? html`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._back()}>
              ${onNow ? "Back now" : "Cancel it"}
            </button>`
          : nothing}
      </div>
      ${!open && this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      ${open
        ? html`<div class="body">${away?.active && !this._changing ? this._renderOn(away) : this._renderForm(away)}</div>`
        : nothing}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .head-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .head {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .title {
        font-size: 20px;
        font-weight: 500;
        white-space: nowrap;
      }
      .status {
        flex: 1;
        min-width: 0;
        font-size: 16px;
        color: var(--secondary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .status.on {
        color: var(--warning-color, #ffa600);
        font-weight: 600;
      }
      .chev {
        color: var(--secondary-text-color);
      }
      .body {
        margin-top: 8px;
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
        font-size: 16px;
      }
    `,
  ];
}

customElements.define("boopli-away", BoopliAway);
