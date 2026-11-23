import { css, html, nothing } from "lit";
import { completeStep, errorMessage, notOnIt, onIt, snoozeStep } from "./api";
import { buildToday } from "./today";
import { WallTile, wallTileStyles } from "./wall-tile";

/** What is due now, big, with Done, On it and Snooze. */
export class WallTileDue extends WallTile {
  static properties = { ...WallTile.properties, _busy: { state: true }, _error: { state: true } };
  declare _busy: boolean;
  declare _error: string;

  constructor() {
    super();
    this._busy = false;
    this._error = "";
  }

  private async _act(fn: () => Promise<unknown>): Promise<void> {
    if (this.preview || !this.hass || this._busy) return;
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

  render() {
    if (!this.snapshot) return html`<div class="center muted normal">Loading…</div>`;
    const item = buildToday(this.snapshot, this.nowMs).now;
    if (!item) {
      return html`<div class="center"><div><div class="big">All clear</div><div class="normal muted">Nothing is due right now.</div></div></div>`;
    }
    const { run, step } = item;
    const working = !!step.on_it_until;
    return html`<div class="due">
      <div class="label">${run.chore_name}</div>
      <div class="big title">${step.title}</div>
      ${item.total > 1 ? html`<div class="small muted">Step ${item.done + 1} of ${item.total}</div>` : nothing}
      <div class="actions">
        <button class="primary" ?disabled=${this._busy} @click=${() => this._act(() => completeStep(this.hass!, run.id, step.step_id))}>
          Done
        </button>
        <button ?disabled=${this._busy} @click=${() => this._act(() => (working ? notOnIt : onIt)(this.hass!, run.id, step.step_id))}>
          ${working ? "Not yet" : "On it"}
        </button>
        <button ?disabled=${this._busy} @click=${() => this._act(() => snoozeStep(this.hass!, run.id, step.step_id))}>
          Snooze
        </button>
      </div>
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
    </div>`;
  }

  static styles = [
    wallTileStyles,
    css`
      .due {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .title {
        flex: 1;
        overflow: hidden;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .actions button {
        flex: 1 1 90px;
      }
      /* a small tile: smaller buttons, so all three stay in reach */
      @container (max-width: 300px) {
        .actions {
          gap: 6px;
        }
        .actions button {
          flex: 1 1 60px;
          min-height: 38px;
          padding: 4px 8px;
          font-size: 14px;
        }
      }
      @container (max-height: 200px) {
        .actions button {
          min-height: 34px;
          padding: 2px 8px;
          font-size: 14px;
        }
        .title {
          font-size: 16px;
        }
      }
    `,
  ];
}
customElements.define("wall-tile-due-now", WallTileDue);
