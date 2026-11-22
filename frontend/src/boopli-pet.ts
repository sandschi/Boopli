import { LitElement, html, css } from "lit";
import { slimeCss, slimeSvg } from "./pet-slime";
import { petInfo, type PetKind } from "./pets";
import type { Mood } from "./types";

/**
 * The pet's picture, and the ONLY place that draws it. A pet with its own animated art (the
 * slime so far) is drawn in code; the others show their emoji until their art is ready.
 * It fills the box it is put in, so the same pet works small (a picker) and big (the stage).
 *
 * Animations stop while the page is hidden, and for people who asked their system for less motion.
 */
const BADGE: Record<Mood, string> = {
  happy: "✨",
  content: "",
  sleepy: "💤",
  sad: "💧",
  hibernating: "🌙💤",
};

export class BoopliPet extends LitElement {
  static properties = {
    kind: { type: String },
    mood: { type: String },
    level: { type: Number },
    away: { type: Boolean },
    still: { type: Boolean, reflect: true },
  };

  declare kind: PetKind;
  declare mood: Mood;
  declare level: number;
  declare away: boolean; // away mode is on: the stage shows a suitcase; here only the emoji pets get a badge
  declare still: boolean; // draw it without moving (small previews)

  constructor() {
    super();
    this.kind = "slime";
    this.mood = "content";
    this.level = 1;
    this.away = false;
    this.still = false;
  }

  private _onVisibility = (): void => {
    this.toggleAttribute("paused", document.hidden);
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this._onVisibility);
    this._onVisibility();
  }

  disconnectedCallback(): void {
    document.removeEventListener("visibilitychange", this._onVisibility);
    super.disconnectedCallback();
  }

  private _art() {
    const info = petInfo(this.kind);
    if (info.art && info.kind === "slime") return slimeSvg(this.mood);
    return html`<span class="emoji" aria-hidden="true">${info.emoji}</span>
      <span class="badge" aria-hidden="true">${this.away ? "🧳" : BADGE[this.mood]}</span>`;
  }

  /** A secret: tap the pet 7 times quickly and the Easter egg plays. Nothing in the panel points to it. */
  private _taps: number[] = [];

  private _tap(): void {
    const now = Date.now();
    this._taps = [...this._taps.filter((t) => now - t < 4000), now];
    if (this._taps.length >= 7) {
      this._taps = [];
      this.dispatchEvent(new CustomEvent("egg-found", { bubbles: true, composed: true }));
    }
  }

  render() {
    return html`<div
      class="pet ${this.mood}"
      role="img"
      aria-label="Your pet is ${this.mood}"
      @click=${() => this._tap()}
    >
      ${this._art()}
    </div>`;
  }

  static styles = [
    slimeCss,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .pet {
        position: relative;
        width: 100%;
        height: 100%;
        container-type: size;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .emoji {
        font-size: 62cqh;
        line-height: 1;
      }
      .badge {
        position: absolute;
        right: 8%;
        top: 4%;
        font-size: 24cqh;
      }
      .sad .emoji {
        filter: grayscale(0.5);
      }
      .hibernating .emoji {
        opacity: 0.55;
        filter: grayscale(0.7);
        transform: scale(0.85);
      }
      /* Nothing moves while the page is hidden, in a still preview, or when the system asks for less motion. */
      :host([paused]) *,
      :host([still]) * {
        animation-play-state: paused !important;
      }
      @media (prefers-reduced-motion: reduce) {
        * {
          animation: none !important;
        }
        .z,
        .spark {
          opacity: 1 !important;
        }
        .tear {
          opacity: 1 !important;
        }
      }
    `,
  ];
}

customElements.define("boopli-pet", BoopliPet);
