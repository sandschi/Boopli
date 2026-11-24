import { LitElement, html, css, nothing } from "lit";
import "./boopli-egg";
import "./boopli-pet";
import { petInfo } from "./pets";

const EGG_AFTER_SECONDS = 30; // the Easter egg shows up once a wait has lasted this long

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * "The AI is working": an animation so it is clear nothing is stuck, the time
 * so far, how long Boopli will wait at most, and a way to stop waiting.
 * The bar shows the waiting time used up, so it is honest, not a made-up percentage.
 * Emits `stop-waiting` when the person gives up.
 *
 * Easter egg: once a wait has gone past 30 seconds, the spinning cat plays once
 * (see boopli-egg).
 */
export class BoopliWait extends LitElement {
  static properties = {
    label: { type: String },
    pet: { type: String },
    max: { type: Number },
    stoppable: { type: Boolean },
    _elapsed: { state: true },
    _egg: { state: true },
  };

  declare label: string;
  declare pet: string; // the pet's kind: "slime" types on a laptop while you wait; empty = just the dots
  declare max: number; // seconds Boopli waits at most
  declare stoppable: boolean;
  declare _elapsed: number;
  declare _egg: boolean; // the Easter egg is playing
  private _timer?: number;
  private _since = 0;
  private _eggShown = false; // one run per wait

  constructor() {
    super();
    this.label = "Thinking…";
    this.pet = "";
    this.max = 180;
    this.stoppable = true;
    this._elapsed = 0;
    this._egg = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._since = Date.now();
    this._elapsed = 0;
    this._timer = window.setInterval(() => {
      this._elapsed = (Date.now() - this._since) / 1000;
      if (!this._eggShown && this._elapsed >= EGG_AFTER_SECONDS) {
        this._eggShown = true;
        this._egg = true;
      }
    }, 500);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
  }

  /** A calm sentence for how it is going, so a long wait never feels like a freeze. */
  private _hint(): string {
    const s = this._elapsed;
    if (s < 20) return "This usually takes under a minute.";
    if (s < 60) return "Still working. Free models can be slow.";
    if (s < this.max * 0.85) return "Still working. This one is slow, but it is not stuck.";
    return "Nearly at the limit. If there is no answer, you can try again.";
  }

  render() {
    const used = Math.min(1, this._elapsed / Math.max(1, this.max));
    return html`<div class="wait" role="status" aria-live="polite">
      ${this._egg ? html`<boopli-egg @egg-done=${() => (this._egg = false)}></boopli-egg>` : nothing}
      <div class="head">
        ${this.pet && petInfo(this.pet).art
          ? html`<span class="typist"><boopli-pet kind=${this.pet} activity="typing"></boopli-pet></span>`
          : html`<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`}
        <span class="label">${this.label}</span>
      </div>
      <div
        class="bar"
        role="progressbar"
        aria-label="Waiting time used"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${Math.round(this._elapsed)}
      >
        <div class="fill" style="width:${used * 100}%"></div>
      </div>
      <div class="time">
        <span>${mmss(this._elapsed)} so far</span>
        <span>gives up after ${mmss(this.max)}</span>
      </div>
      <div class="hint">${this._hint()}</div>
      ${this.stoppable
        ? html`<button type="button" class="link" @click=${() => this.dispatchEvent(new CustomEvent("stop-waiting", { bubbles: true, composed: true }))}>
            Stop waiting
          </button>`
        : nothing}
    </div>`;
  }

  static styles = css`
    :host {
      display: block;
    }
    .wait {
      max-width: 560px;
      padding: 18px 4px;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 20px;
      color: var(--primary-text-color);
    }
    .dots {
      display: inline-flex;
      gap: 6px;
    }
    .typist {
      display: block;
      flex: none;
      width: 92px;
      height: 92px;
      margin: -6px 0 -10px;
    }
    .dots i {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--boopli-accent, var(--primary-color));
      animation: bounce 1s infinite ease-in-out;
    }
    .dots i:nth-child(2) {
      animation-delay: 0.15s;
    }
    .dots i:nth-child(3) {
      animation-delay: 0.3s;
    }
    @keyframes bounce {
      0%,
      80%,
      100% {
        opacity: 0.25;
        transform: scale(0.8);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }
    .bar {
      height: 8px;
      margin: 14px 0 6px;
      border-radius: 999px;
      background: var(--secondary-background-color);
      border: 1px solid var(--divider-color);
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 999px;
      background: var(--boopli-accent, var(--primary-color));
      transition: width 0.5s linear;
    }
    .time {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 15px;
      color: var(--secondary-text-color);
    }
    .hint {
      margin-top: 10px;
      font-size: 16px;
      color: var(--secondary-text-color);
    }
    .link {
      margin-top: 8px;
      border: 0;
      background: none;
      color: var(--secondary-text-color);
      text-decoration: underline;
      font: inherit;
      font-size: 16px;
      padding: 8px 0;
      cursor: pointer;
    }
    @media (prefers-reduced-motion: reduce) {
      .dots i {
        animation: none;
        opacity: 0.8;
      }
    }
  `;
}

customElements.define("boopli-wait", BoopliWait);
