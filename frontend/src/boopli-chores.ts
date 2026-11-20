import { LitElement, html, css, nothing } from "lit";
import { errorMessage, startChore } from "./api";
import "./boopli-chore-editor";
import { blankDraft, TEMPLATES } from "./templates";
import { describeRepeat, describeWhen } from "./time";
import { sharedStyles } from "./styles";
import type { Chore, ChoreDraft, Hass, Snapshot } from "./types";

/** The Chores screen: the list, starter templates, and the editor. */
export class BoopliChores extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    nowMs: { type: Number },
    _editing: { state: true },
    _error: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare _editing: ChoreDraft | null;
  declare _error: string;

  constructor() {
    super();
    this.nowMs = Date.now();
    this._editing = null;
    this._error = "";
  }

  private _edit(chore: Chore): void {
    this._editing = {
      id: chore.id,
      name: chore.name,
      where: chore.where,
      enabled: chore.enabled,
      one_off: chore.one_off,
      repeat: { ...chore.repeat, weekdays: [...chore.repeat.weekdays] },
      steps: chore.steps.map((s) => ({
        id: s.id,
        title: s.title,
        wait_minutes: s.wait_minutes,
      })),
    };
  }

  private async _start(chore: Chore): Promise<void> {
    if (!this.hass) return;
    this._error = "";
    try {
      await startChore(this.hass, chore.id);
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  render() {
    if (!this.snapshot) return html`<p class="muted">Loading…</p>`;

    if (this._editing) {
      return html`<boopli-chore-editor
        .hass=${this.hass}
        .draft=${this._editing}
        @editor-close=${() => (this._editing = null)}
      ></boopli-chore-editor>`;
    }

    const tz = this.snapshot.time_zone;
    const running = new Set(this.snapshot.runs.map((r) => r.chore_id));
    const chores = [...this.snapshot.chores].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return html`
      <div class="toolbar">
        <button class="primary" @click=${() => (this._editing = blankDraft())}>
          + New chore
        </button>
      </div>

      <div class="templates">
        <span class="muted small">Start from a template:</span>
        ${TEMPLATES.map(
          (t) => html`<button
            class="chip"
            @click=${() => (this._editing = structuredClone(t.draft))}
          >
            ${t.label}
          </button>`
        )}
      </div>

      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      ${chores.length === 0
        ? html`<p class="muted empty">
            No chores yet. Pick a template above or create your own.
          </p>`
        : chores.map(
            (c) => html`
              <section class="card chore">
                <div class="chore-main">
                  <div class="name">${c.name}</div>
                  <div class="muted small">
                    ${describeRepeat(c.repeat)} · ${c.where === "home" ? "Home only" : "Anywhere"}
                    · ${c.steps.length} ${c.steps.length === 1 ? "step" : "steps"}
                  </div>
                  <div class="muted small">
                    ${running.has(c.id)
                      ? "In progress"
                      : c.enabled && c.next_due
                        ? `Next: ${describeWhen(c.next_due, this.nowMs, tz)}`
                        : c.repeat.type === "none"
                          ? ""
                          : "Not scheduled"}
                  </div>
                </div>
                <div class="chore-actions">
                  ${running.has(c.id)
                    ? nothing
                    : html`<button @click=${() => this._start(c)}>Start now</button>`}
                  <button @click=${() => this._edit(c)}>Edit</button>
                </div>
              </section>
            `
          )}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .small {
        font-size: 13px;
      }
      .toolbar {
        margin-bottom: 12px;
      }
      .templates {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-bottom: 18px;
      }
      .empty {
        text-align: center;
        padding: 24px 0;
      }
      .chore {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 10px;
      }
      .name {
        font-size: 17px;
        font-weight: 500;
        margin-bottom: 2px;
      }
      .chore-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
    `,
  ];
}

customElements.define("boopli-chores", BoopliChores);
