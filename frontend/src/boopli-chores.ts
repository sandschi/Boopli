import { LitElement, html, css, nothing } from "lit";
import { errorMessage, startChore } from "./api";
import "./boopli-chore-editor";
import "./boopli-questions";
import { blankDraft, TEMPLATES } from "./templates";
import { describeRepeat, describeWhen } from "./time";
import { sharedStyles } from "./styles";
import { icon } from "./icon";
import type { Chore, ChoreDraft, Hass, Snapshot } from "./types";
import { t } from "./i18n";

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
    _asking: { state: true },
    _busy: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  /** A chore the panel wants opened right away (from the AI breakdown), optionally in the schedule wizard. */
  declare openRequest: { id: number; draft: ChoreDraft; schedule: boolean } | null;
  declare _editing: ChoreDraft | null;
  declare _openSchedule: boolean;
  declare _error: string;
  declare _asking: Chore | null; // the chore whose questions are being answered before it starts
  declare _busy: boolean;

  constructor() {
    super();
    this.nowMs = Date.now();
    this.openRequest = null;
    this._editing = null;
    this._openSchedule = false;
    this._error = "";
    this._asking = null;
    this._busy = false;
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
      keeps_going: chore.keeps_going ?? false,
      light_color: chore.light_color ?? undefined,
      notes: chore.notes ?? "",
      questions: (chore.questions ?? []).map((q) => ({ ...q })),
      steps: chore.steps.map((s) => ({
        id: s.id,
        title: s.title,
        wait_minutes: s.wait_minutes,
        triggers: (s.triggers ?? []).map((t) => ({ ...t })),
        wait_for: (s.wait_for ?? []).map((t) => ({ ...t })),
        size: s.size ?? "small",
        group: s.group ?? "",
        only_if: s.only_if ?? "",
        image: s.image ?? "",
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

  private async _start(chore: Chore, answers?: Record<string, boolean>): Promise<void> {
    if (!this.hass) return;
    this._error = "";
    // A chore with questions asks them first, so the list only has what needs doing.
    if (!answers && (chore.questions ?? []).length > 0) {
      this._asking = chore;
      return;
    }
    this._busy = true;
    try {
      await startChore(this.hass, chore.id, answers);
      this._asking = null;
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  render() {
    if (!this.snapshot) return html`<p class="muted">${t("common.loading")}</p>`;

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

    if (this._asking) {
      const chore = this._asking;
      return html`<section class="card">
        <h2>${chore.name}</h2>
        <p class="muted">${t("chores.a_quick_look_first_so_the")}</p>
        <boopli-questions
          .questions=${chore.questions ?? []}
          .busy=${this._busy}
          label=${t("chores.start")}
          @answered=${(e: CustomEvent<{ answers: Record<string, boolean> }>) => this._start(chore, e.detail.answers)}
          @cancel=${() => (this._asking = null)}
        ></boopli-questions>
        ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      </section>`;
    }

    const tz = this.snapshot.time_zone;
    const running = new Set(this.snapshot.runs.map((r) => r.chore_id));
    const chores = [...this.snapshot.chores].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return html`
      <div class="toolbar">
        <button class="primary" @click=${() => (this._editing = blankDraft())}>
          ${icon("plus")} ${t("chores.new_chore")}
        </button>
        <button
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent("open-breakdown", { detail: { kind: "recurring" }, bubbles: true, composed: true })
            )}
        >
          ${icon("auto-fix")} ${t("chores.new_chore_with_ai")}
        </button>
      </div>

      <div class="templates">
        <span class="muted small">${t("chores.start_from_a_template")}</span>
        ${TEMPLATES().map(
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
            ${t("chores.no_chores_yet_pick_a_template")}
          </p>`
        : html`<div class="chore-list">${chores.map(
            (c) => html`
              <section class="chore">
                <div class="chore-main">
                  <div class="name">${c.name}</div>
                  <div class="muted small">
                    ${describeRepeat(c.repeat)} · ${c.where === "home" ? t("chore_editor.home_only") : t("chores.anywhere")}
                    · ${c.steps.length} ${c.steps.length === 1 ? "step" : "steps"}
                  </div>
                  <div class=${running.has(c.id) ? "status live" : "muted small status"}>
                    ${running.has(c.id)
                      ? html`${icon("progress-clock")} ${t("chores.in_progress")}`
                      : c.enabled && c.next_due
                        ? `Next: ${describeWhen(c.next_due, this.nowMs, tz)}`
                        : c.repeat.type === "none"
                          ? ""
                          : t("chores.not_scheduled")}
                  </div>
                </div>
                <div class="chore-actions">
                  ${running.has(c.id)
                    ? nothing
                    : html`<button class="textlink" @click=${() => this._start(c)}>${t("common.start_now")}</button>`}
                  ${c.repeat.type === "none"
                    ? html`<button class="textlink quiet" @click=${() => this._edit(c, true)}>${t("chores.set_a_schedule")}</button>`
                    : nothing}
                  <button class="textlink quiet" @click=${() => this._edit(c)}>${t("chores.edit")}</button>
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
        font-size: 16px;
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
      /* No boxes: a thin line on top (it turns to the accent colour on hover), the name, what it is, and quiet links. */
      .chore-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
        gap: 18px 32px;
        align-items: start;
      }
      .chore {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 10px;
        border-top: 2px solid var(--divider-color);
        transition: border-color 0.15s;
      }
      .chore:hover,
      .chore:focus-within {
        border-top-color: var(--boopli-accent, var(--primary-color));
      }
      .name {
        font-size: 20px;
        font-weight: 500;
        margin-bottom: 2px;
      }
      .status.live {
        font-size: 17px;
        color: var(--boopli-accent, var(--primary-color));
      }
      .chore-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        margin-top: 2px;
      }
      .chore-actions button {
        font-size: 17px;
        padding: 4px 2px;
      }
      .chore-actions button.quiet {
        color: var(--secondary-text-color);
      }
    `,
  ];
}

customElements.define("boopli-chores", BoopliChores);
