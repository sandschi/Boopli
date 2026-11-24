import { LitElement, html, css } from "lit";
import "./boopli-stage";
import type { Activity, Moment } from "./boopli-pet";
import { MOODS, petInfo } from "./pets";
import { sharedStyles } from "./styles";
import type { Mood } from "./types";

const MOMENTS: { value: Exclude<Moment, "">; label: string }[] = [
  { value: "levelup", label: "Level up" },
  { value: "wake", label: "Waking up" },
  { value: "tap", label: "Tap" },
  { value: "done", label: "Step done" },
];

const ACTIVITIES: { value: Activity; label: string }[] = [
  { value: "", label: "Nothing" },
  { value: "housework", label: "Housework" },
  { value: "typing", label: "Typing" },
];

/**
 * A button that opens a window where you can look at your pet: its room, all its moods, the
 * things it does, the moments it reacts with, and the room at every level. Nothing here changes
 * any setting; it is only for looking. Esc, Close and a click outside close it.
 */
export class BoopliPetPreview extends LitElement {
  static properties = {
    kind: { type: String },
    _mood: { state: true },
    _activity: { state: true },
    _level: { state: true },
    _away: { state: true },
    _moment: { state: true },
    _seq: { state: true },
    _text: { state: true },
  };

  declare kind: string;
  declare _mood: Mood;
  declare _activity: Activity;
  declare _level: number;
  declare _away: boolean;
  declare _moment: Moment;
  declare _seq: number;
  declare _text: string;

  constructor() {
    super();
    this.kind = "slime";
    this._mood = "content";
    this._activity = "";
    this._level = 4;
    this._away = false;
    this._moment = "";
    this._seq = 0;
    this._text = "";
  }

  private _dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector("dialog");
  }

  private _open(): void {
    this._dialog()?.showModal();
  }

  private _close(): void {
    this._dialog()?.close();
  }

  private _play(moment: Exclude<Moment, "">): void {
    this._moment = moment;
    this._text = moment === "levelup" ? `Level ${Math.min(this._level + 1, 99)}!` : moment === "done" ? "+10 XP" : "";
    this._seq += 1;
  }

  private _chip(label: string, on: boolean, click: () => void) {
    return html`<button type="button" class="chip ${on ? "on" : ""}" aria-pressed=${on} @click=${click}>${label}</button>`;
  }

  render() {
    const info = petInfo(this.kind);
    return html`
      <button type="button" class="open" @click=${() => this._open()}>▶ Preview your pet</button>
      <dialog
        aria-label="Preview of your pet"
        @click=${(e: MouseEvent) => {
          if (e.target === e.currentTarget) this._close(); // a click on the dark area around the window
        }}
      >
        <div class="win">
          <div class="head">
            <h3>${info.label}: preview</h3>
            <button type="button" class="close" aria-label="Close" @click=${() => this._close()}>✕</button>
          </div>
          <boopli-stage
            .kind=${this.kind}
            .mood=${this._mood}
            .level=${this._level}
            .away=${this._away}
            .activity=${this._activity}
            .moment=${this._moment}
            .momentSeq=${this._seq}
            .momentText=${this._text}
          ></boopli-stage>
          ${info.art ? "" : html`<p class="muted small">${info.label} has no animated art yet, so it shows its emoji.</p>`}

          <div class="group">
            <div class="label">Mood</div>
            <div class="chips">${MOODS.map((m) => this._chip(m, this._mood === m, () => (this._mood = m)))}</div>
          </div>
          <div class="group">
            <div class="label">Busy with</div>
            <div class="chips">
              ${ACTIVITIES.map((a) => this._chip(a.label, this._activity === a.value, () => (this._activity = a.value)))}
            </div>
          </div>
          <div class="group">
            <div class="label">Moments (they play once)</div>
            <div class="chips">
              ${MOMENTS.map((m) => html`<button type="button" class="chip" @click=${() => this._play(m.value)}>${m.label}</button>`)}
            </div>
          </div>
          <div class="group row">
            <label class="inline">
              Level ${this._level}
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                .value=${String(this._level)}
                aria-label="Level"
                @input=${(e: Event) => (this._level = Number((e.target as HTMLInputElement).value))}
              />
            </label>
            <label class="inline">
              <input type="checkbox" .checked=${this._away} @change=${(e: Event) => (this._away = (e.target as HTMLInputElement).checked)} />
              Away mode (suitcase)
            </label>
          </div>
          <p class="muted small">The room grows with the level: a water bowl at 1, a food bowl at 2, a bed at 3. Sleepy or hibernating, the pet sleeps in the bed.</p>
          <div class="actions"><button type="button" class="primary" @click=${() => this._close()}>Close</button></div>
        </div>
      </dialog>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .open {
        margin-top: 10px;
      }
      dialog {
        padding: 0;
        border: 1px solid var(--divider-color, #444);
        border-radius: 16px;
        width: min(94vw, 780px);
        max-height: 92vh;
        overflow: auto;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #fff);
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.6);
      }
      .win {
        padding: 16px 18px 18px;
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      h3 {
        margin: 0;
        font-size: 20px;
      }
      .close {
        border: 0;
        background: transparent;
        color: inherit;
        font-size: 22px;
        min-width: 40px;
        min-height: 40px;
        cursor: pointer;
      }
      .group {
        margin-top: 14px;
      }
      .label {
        font-weight: 500;
        margin-bottom: 6px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 22px;
      }
      label.inline {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin: 0;
      }
      label.inline input[type="checkbox"] {
        width: auto;
        min-height: 0;
      }
      label.inline input[type="range"] {
        width: 160px;
        min-height: 0;
      }
      .actions {
        margin-top: 14px;
      }
      .small {
        font-size: 16px;
      }
      /* A phone: the window fills the screen. */
      @media (max-width: 760px) {
        dialog {
          width: 100vw;
          max-width: 100vw;
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
          border: 0;
        }
      }
    `,
  ];
}

customElements.define("boopli-pet-preview", BoopliPetPreview);
