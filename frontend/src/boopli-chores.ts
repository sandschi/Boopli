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
    openRequest: { attribute: false },
    _editing: { state: true },
    _openSchedule: { state: true },
    _error: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  /** A chore the panel wants opened right away (from the AI breakdown), optionally in the schedule wizard. */
  declare openRequest: { id: number; draft: ChoreDraft; schedule: boolean } | null;
  declare _editing: ChoreDraft | null;
  declare _openSchedule: boolean;
  declare _error: string;

  constructor() {
    super();
    this.nowMs = Date.now();
    this.openRequest = null;
    this._editing = null;
    this._openSchedule = false;
    this._error = "";
  }

  protected willUpdate(): void {
    if (this.openRequest && !this._editing) {
      const request = this.openRequest;
      this._openSchedule = request.schedule;
      this._editing = request.draft;
      // Tell the panel it was taken, so it is not opened a second time.
      this.dispatchEvent(new CustomEvent("request-handled", { bubbles: true, composed: true }));
    }
  }

  /** Open the editor for a chore, or straight into its schedule wizard. */
  private _edit(chore: Chore, schedule = false): void {
    this._openSchedule = schedule;
    this._editing = {
      id: chore.id,
      name: chore.name,
      where: chore.where,
      enabled: chore.enabled,
      one_off: chore.one_off,
      repeat: {
        ...chore.repeat,
        days: Object.fromEntries(Object.entries(chore.repeat.days ?? {}).map(([d, t]) => [d, [...t]])),
      },
      nudge_style: chore.nudge_style,
      ignore_quiet_hours: chore.ignore_quiet_hours,
      notes: chore.notes ?? "",
      steps: chore.steps.map((s) => ({
        id: s.id,
        title: s.title,
        wait_minutes: s.wait_minutes,
        triggers: (s.triggers ?? []).map((t) => ({ ...t })),
        size: s.size ?? "small",
        group: s.group ?? "",
      })),
    };
  }

  /** Save the chore being edited (the panel asks this when leaving with edits). */
  async save(): Promise<boolean> {
    const editor = this.renderRoot.querySelector("boopli-chore-editor") as
      | { save?: () => Promise<boolean> }
      | null;
    return (await editor?.save?.()) ?? false;
  }

  /** Close the editor without saving. */
  discard(): void {
    this._editing = null;
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
        .defaultStyle=${this.snapshot.settings.default_style}
        .timeZone=${this.snapshot.time_zone}
        .snapshot=${this.snapshot}
        .startSchedule=${this._openSchedule}
        @editor-close=${() => {
          this._editing = null;
          this._openSchedule = false;
          // The editor is gone, so tell the panel nothing is unsaved any more.
          this.dispatchEvent(
            new CustomEvent("dirty-change", {
              detail: { source: "chore", dirty: false },
              bubbles: true,
              composed: true,
            })
          );
        }}
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
        <button
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent("open-breakdown", { detail: { kind: "recurring" }, bubbles: true, composed: true })
            )}
        >
          ✨ New chore with AI
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
        : html`<div class="chore-list">${chores.map(
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
                  ${c.repeat.type === "none"
                    ? html`<button @click=${() => this._edit(c, true)}>Set a schedule</button>`
                    : nothing}
                  <button @click=${() => this._edit(c)}>Edit</button>
                </div>
              </section>
            `
          )}</div>`}
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
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .templates {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-bottom: 18px;
      }
      .empty {
        padding: 24px 0;
      }
      .chore-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 12px;
        align-items: start;
      }
      .chore {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }
      .name {
        font-size: 17px;
        font-weight: 500;
        margin-bottom: 2px;
      }
      .chore-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        flex-shrink: 0;
      }
    `,
  ];
}

customElements.define("boopli-chores", BoopliChores);
