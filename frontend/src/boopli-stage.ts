import { LitElement, html, css, svg, nothing } from "lit";
import "./boopli-pet";
import { sharedStyles } from "./styles";
import type { PetKind } from "./pets";
import type { Mood } from "./types";

const INK = "#101010";

/** A water bowl: always there from level 1. */
const WATER_BOWL = svg`<svg viewBox="0 0 60 40" aria-hidden="true">
  <path d="M5 14 H55 Q55 36 30 36 Q5 36 5 14 Z" fill="#5B8DEF" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
  <ellipse cx="30" cy="14" rx="25" ry="6" fill="#8ADFFF" stroke=${INK} stroke-width="2.5"/>
  <path d="M18 14 Q24 11 30 14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
</svg>`;

/** A food bowl: from level 2. */
const FOOD_BOWL = svg`<svg viewBox="0 0 60 40" aria-hidden="true">
  <path d="M5 14 H55 Q55 36 30 36 Q5 36 5 14 Z" fill="#FF9F5A" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
  <ellipse cx="30" cy="14" rx="25" ry="6" fill="#8A5A3A" stroke=${INK} stroke-width="2.5"/>
  <circle cx="20" cy="11" r="3.2" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="30" cy="9" r="3.2" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="40" cy="11" r="3.2" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="26" cy="14" r="3" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="35" cy="14" r="3" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
</svg>`;

/** A bed: from level 3. */
const BED = svg`<svg viewBox="0 0 100 50" aria-hidden="true">
  <ellipse cx="50" cy="33" rx="46" ry="15" fill="#9B6CF0" stroke=${INK} stroke-width="3"/>
  <ellipse cx="50" cy="28" rx="34" ry="9" fill="#CDB0FF" stroke=${INK} stroke-width="2.5"/>
  <path d="M30 27 Q50 20 70 27" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
</svg>`;

/** A little suitcase: it stands next to the pet while away mode is on. */
const SUITCASE = svg`<svg viewBox="0 0 50 50" aria-hidden="true">
  <path d="M17 17 V11 Q17 7 21 7 H29 Q33 7 33 11 V17" fill="none" stroke=${INK} stroke-width="3" stroke-linecap="round"/>
  <rect x="5" y="16" width="40" height="30" rx="6" fill="#FF8A3D" stroke=${INK} stroke-width="3"/>
  <path d="M17 16 V46 M33 16 V46" stroke=${INK} stroke-width="2.5" opacity="0.55"/>
  <rect x="22" y="28" width="6" height="5" rx="1.5" fill="#FFD166" stroke=${INK} stroke-width="2"/>
</svg>`;

/**
 * The scene the pet lives in: a calm room with a floor. What stands in it grows with the level
 * (water bowl at 1, food bowl at 2, a bed at 3), and a suitcase appears while away mode is on.
 * The pet itself is `boopli-pet`; this card only arranges the scene around it.
 */
export class BoopliStage extends LitElement {
  static properties = {
    kind: { type: String },
    mood: { type: String },
    level: { type: Number },
    away: { type: Boolean },
  };

  declare kind: PetKind;
  declare mood: Mood;
  declare level: number;
  declare away: boolean;

  constructor() {
    super();
    this.kind = "slime";
    this.mood = "content";
    this.level = 1;
    this.away = false;
  }

  render() {
    return html`<div class="scene" role="group" aria-label="Your pet's room">
      <div class="floor"></div>
      ${this.level >= 3 ? html`<div class="prop bed">${BED}</div>` : nothing}
      <div class="prop water">${WATER_BOWL}</div>
      ${this.level >= 2 ? html`<div class="prop food">${FOOD_BOWL}</div>` : nothing}
      <div class="actor">
        <boopli-pet .kind=${this.kind} .mood=${this.mood} .level=${this.level} .away=${this.away}></boopli-pet>
      </div>
      ${this.away ? html`<div class="prop suitcase">${SUITCASE}</div>` : nothing}
    </div>`;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .scene {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 6; /* a third lower than 16:9 */
        container-type: size;
        border-radius: 14px;
        overflow: hidden;
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 10%, var(--secondary-background-color, #2a2a2a));
      }
      .floor {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 24%;
        background: color-mix(in srgb, var(--primary-text-color, #888) 14%, var(--secondary-background-color, #2a2a2a));
        border-top: 2px solid color-mix(in srgb, var(--primary-text-color, #888) 22%, transparent);
      }
      .prop {
        position: absolute;
        pointer-events: none;
      }
      .prop svg {
        display: block;
        width: 100%;
        height: auto;
      }
      /* Everything in the room is sized by the room's height, so the card can be as low as you want. */
      .water {
        left: 9%;
        bottom: 6cqh;
        width: 34cqh;
      }
      .food {
        left: calc(9% + 38cqh);
        bottom: 5cqh;
        width: 34cqh;
      }
      .bed {
        right: 5%;
        bottom: 6cqh;
        width: 64cqh;
      }
      .suitcase {
        left: calc(50% + 30cqh);
        bottom: 4cqh;
        width: 26cqh;
      }
      .actor {
        position: absolute;
        left: 50%;
        bottom: 4cqh;
        height: 86cqh;
        aspect-ratio: 1;
        transform: translateX(-50%);
      }
      /* A phone is narrower, so the room is a little taller there (still a third lower than before). */
      @media (max-width: 760px) {
        .scene {
          aspect-ratio: 2 / 1;
        }
        .actor {
          height: 72cqh;
        }
        .water {
          left: 3%;
          width: 26cqh;
        }
        .food {
          left: calc(3% + 30cqh);
          width: 26cqh;
        }
        .bed {
          right: 3%;
          width: 50cqh;
        }
        .suitcase {
          left: calc(50% + 24cqh);
          width: 20cqh;
        }
      }
    `,
  ];
}

customElements.define("boopli-stage", BoopliStage);
