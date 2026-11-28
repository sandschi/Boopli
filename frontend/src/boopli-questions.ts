import { LitElement, html, css } from "lit";
import { sharedStyles } from "./styles";
import type { ChoreQuestion } from "./types";
import { t } from "./i18n";

/**
 * The yes/no questions of a chore, answered with two big buttons each:
 * green Yes (a tick), red No (a cross), Yes already chosen so you can tap straight through.
 *
 * Events: `answered` with `{ answers }` (question id -> yes) when you press the main button,
 * `all-steps` when you pick the other choice, and `cancel` when you back out.
 */
export class BoopliQuestions extends LitElement {
  static properties = {
    questions: { attribute: false },
    label: { type: String },
    allLabel: { type: String },
    busy: { type: Boolean },
    cancelable: { type: Boolean },
    soft: { type: Boolean, reflect: true },
    _answers: { state: true },
  };

  declare soft: boolean; // the soft, dark look of the Today cards (the plain look is for the other screens)

  declare cancelable: boolean; // show a Cancel button (not when the chore is already running)

  declare questions: ChoreQuestion[];
  declare label: string; // the main button, for example "Start"
  declare allLabel: string; // an optional second choice that skips the questions, for example "Start with all steps"
  declare busy: boolean;
  declare _answers: Record<string, boolean>;

  constructor() {
    super();
    this.questions = [];
    this.label = t("chores.start");
    this.allLabel = "";
    this.busy = false;
    this.cancelable = true;
    this.soft = false;
    this._answers = {};
  }

  private _yes(id: string): boolean {
    return this._answers[id] ?? true;
  }

  private _set(id: string, yes: boolean): void {
    this._answers = { ...this._answers, [id]: yes };
  }

  private _emit(name: string, detail: unknown = {}): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private _submit(): void {
    const answers: Record<string, boolean> = {};
    for (const q of this.questions) answers[q.id] = this._yes(q.id);
    this._emit("answered", { answers });
  }

  render() {
    return html`
      <div class="list">
        ${this.questions.map(
          (q) => html`<div class="q" role="group" aria-label=${q.text}>
            <div class="text">${q.text}</div>
            <div class="yn">
              <button
                type="button"
                class="yes ${this._yes(q.id) ? "on" : ""}"
                aria-pressed=${this._yes(q.id)}
                @click=${() => this._set(q.id, true)}
              >
                <span aria-hidden="true">✓</span> ${t("common.yes")}
              </button>
              <button
                type="button"
                class="no ${this._yes(q.id) ? "" : "on"}"
                aria-pressed=${!this._yes(q.id)}
                @click=${() => this._set(q.id, false)}
              >
                <span aria-hidden="true">✕</span> ${t("common.no")}
              </button>
            </div>
          </div>`
        )}
      </div>
      <div class="actions">
        <button type="button" class="primary" ?disabled=${this.busy} @click=${() => this._submit()}>${this.label}</button>
        ${this.allLabel
          ? html`<button type="button" ?disabled=${this.busy} @click=${() => this._emit("all-steps")}>${this.allLabel}</button>`
          : ""}
        ${this.cancelable ? html`<button type="button" class="link" @click=${() => this._emit("cancel")}>${t("common.cancel")}</button>` : ""}
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .list {
        display: grid;
        gap: 12px;
      }
      .q {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 12px;
      }
      .text {
        flex: 1 1 200px;
        min-width: 0;
        font-size: 18px;
      }
      .yn {
        display: flex;
        gap: 8px;
      }
      .yn button {
        min-width: 84px;
        font-weight: 500;
        background: transparent;
      }
      .yes {
        color: var(--success-color, #2e9e5b);
        border-color: var(--success-color, #2e9e5b);
      }
      .no {
        color: var(--error-color, #d93f3f);
        border-color: var(--error-color, #d93f3f);
      }
      .yes.on {
        background: var(--success-color, #2e9e5b);
        border-color: var(--success-color, #2e9e5b);
        color: #fff;
      }
      .no.on {
        background: var(--error-color, #d93f3f);
        border-color: var(--error-color, #d93f3f);
        color: #fff;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-top: 14px;
      }

      /* The soft look: dark buttons in the same style as the other Today buttons; only the chosen answer lights up. */
      :host([soft]) .yn button,
      :host([soft]) .actions button:not(.link) {
        min-height: 40px;
        border-radius: 12px;
        border: 1px solid color-mix(in srgb, var(--primary-text-color) 16%, transparent);
        background: linear-gradient(180deg, color-mix(in srgb, var(--primary-text-color) 9%, var(--card-background-color, #1c1c1c)), color-mix(in srgb, var(--primary-text-color) 3%, var(--card-background-color, #1c1c1c)));
        color: var(--secondary-text-color);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 6px rgba(0, 0, 0, 0.2);
      }
      :host([soft]) .yes.on,
      :host([soft]) .actions button.primary {
        background: linear-gradient(180deg, color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 100%, #fff 12%), color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 74%, #000));
        border-color: color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 55%, transparent);
        color: var(--boopli-accent-ink, #fff);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 3px 10px rgba(0, 0, 0, 0.3);
      }
      :host([soft]) .no.on {
        background: linear-gradient(180deg, color-mix(in srgb, var(--error-color, #d93f3f) 100%, #fff 8%), color-mix(in srgb, var(--error-color, #d93f3f) 68%, #000));
        border-color: color-mix(in srgb, var(--error-color, #d93f3f) 55%, transparent);
        color: #fff;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 3px 10px rgba(0, 0, 0, 0.3);
      }
    `,
  ];
}

customElements.define("boopli-questions", BoopliQuestions);
