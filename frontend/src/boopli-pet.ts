import { LitElement, html, css } from "lit";
import type { Mood } from "./types";

/**
 * The pet's picture. This is a placeholder (emoji), and the ONLY place that
 * draws the pet: later art or animation (SVG, sprite sheet, Lottie) replaces
 * the body of `_art()` and nothing else has to change.
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
    mood: { type: String },
    level: { type: Number },
  };

  declare mood: Mood;
  declare level: number;

  constructor() {
    super();
    this.mood = "content";
    this.level = 1;
  }

  /** Replace this with real art or an animation later. */
  private _art() {
    return html`<span class="bear" aria-hidden="true">🐻</span>
      <span class="badge" aria-hidden="true">${BADGE[this.mood]}</span>`;
  }

  render() {
    return html`<div class="pet ${this.mood}" role="img" aria-label="Your pet is ${this.mood}">
      ${this._art()}
    </div>`;
  }

  static styles = css`
    :host {
      display: inline-block;
    }
    .pet {
      position: relative;
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bear {
      font-size: 54px;
      line-height: 1;
    }
    .badge {
      position: absolute;
      right: -6px;
      top: -4px;
      font-size: 22px;
    }
    .sad .bear {
      filter: grayscale(0.5);
    }
    .hibernating .bear {
      opacity: 0.55;
      filter: grayscale(0.7);
      transform: scale(0.85);
    }
  `;
}

customElements.define("boopli-pet", BoopliPet);
