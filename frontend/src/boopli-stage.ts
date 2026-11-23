import { LitElement, html, css, svg, nothing } from "lit";
import "./boopli-pet";
import { sharedStyles } from "./styles";
import type { PetKind } from "./pets";
import type { Mood } from "./types";
import type { Activity, Moment } from "./boopli-pet";

const INK = "#101010";

/** A water bowl on a mat: white ceramic with a blue paw band. Always there from level 1. */
const WATER_BOWL = svg`<svg viewBox="0 0 72 48" aria-hidden="true">
  <ellipse cx="36" cy="43" rx="33" ry="5" fill="#7B5BD6" stroke=${INK} stroke-width="2.5"/>
  <path d="M9 19 Q9 41 36 41 Q63 41 63 19 Z" fill="#F4F1FF" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M10 27 Q36 35 62 27 L61 32 Q36 40 11 32 Z" fill="#5B8DEF"/>
  <circle cx="36" cy="34" r="2.8" fill="#fff"/>
  <circle cx="31.5" cy="30.6" r="1.5" fill="#fff"/><circle cx="36" cy="29.3" r="1.5" fill="#fff"/><circle cx="40.5" cy="30.6" r="1.5" fill="#fff"/>
  <path d="M14 26 Q14 33 20 37" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
  <ellipse cx="36" cy="19" rx="27" ry="7" fill="#E6E0FF" stroke=${INK} stroke-width="2.5"/>
  <ellipse cx="36" cy="19.5" rx="22" ry="5" fill="#7FD8FF"/>
  <ellipse class="ripple" cx="36" cy="19.5" rx="7" ry="1.8" fill="none" stroke="#fff" stroke-width="1.4"/>
  <path d="M20 18.5 Q26 16.5 32 18" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
</svg>`;

/** A food bowl on a mat: warm ceramic with kibble and a bone biscuit. From level 2. */
const FOOD_BOWL = svg`<svg viewBox="0 0 72 48" aria-hidden="true">
  <ellipse cx="36" cy="43" rx="33" ry="5" fill="#C94F6D" stroke=${INK} stroke-width="2.5"/>
  <path d="M9 19 Q9 41 36 41 Q63 41 63 19 Z" fill="#FFF1E2" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M10 27 Q36 35 62 27 L61 32 Q36 40 11 32 Z" fill="#FF9F5A"/>
  <path d="M30 31.5 a3 3 0 1 1 6 0 a3 3 0 1 1 6 0 q0 4 -6 7 q-6 -3 -6 -7 z" fill="#fff"/>
  <path d="M14 26 Q14 33 20 37" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
  <ellipse cx="36" cy="19" rx="27" ry="7" fill="#FFE3C7" stroke=${INK} stroke-width="2.5"/>
  <ellipse cx="36" cy="18" rx="22" ry="5" fill="#8A5A3A"/>
  <circle cx="22" cy="15.5" r="3" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="29" cy="12.5" r="3" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="44" cy="12.8" r="3" fill="#C98A5A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="50" cy="16" r="3" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
  <circle cx="36" cy="15" r="3" fill="#B6784A" stroke=${INK} stroke-width="1.5"/>
  <g transform="translate(36 8) rotate(-12)">
    <rect x="-9" y="-2.4" width="18" height="4.8" rx="2.4" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/>
    <circle cx="-9" cy="-2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/><circle cx="-9" cy="2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/>
    <circle cx="9" cy="-2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/><circle cx="9" cy="2.8" r="2.8" fill="#F6E3B4" stroke=${INK} stroke-width="1.6"/>
  </g>
</svg>`;

/** The bed, in two layers: the back (the soft arch, the cushion and a pillow) goes behind the pet... */
const BED_BACK = svg`<svg viewBox="0 0 120 64" aria-hidden="true">
  <ellipse cx="60" cy="58" rx="56" ry="5" fill="#000" opacity="0.2"/>
  <path d="M6 42 Q2 6 60 6 Q118 6 114 42 L114 52 Q60 64 6 52 Z" fill="#A98BFF" stroke=${INK} stroke-width="3" stroke-linejoin="round"/>
  <path d="M14 34 Q18 14 60 13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.45"/>
  <path d="M22 17 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 z" fill="#FFE45C" stroke=${INK} stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M60 9 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 z" fill="#FFE45C" stroke=${INK} stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M98 17 l1.6 3.4 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 z" fill="#FFE45C" stroke=${INK} stroke-width="1.2" stroke-linejoin="round"/>
  <ellipse cx="60" cy="42" rx="47" ry="13" fill="#E3D6FF" stroke=${INK} stroke-width="2.5"/>
  <rect x="12" y="26" width="31" height="17" rx="8.5" fill="#FFF1B8" stroke=${INK} stroke-width="2.5"/>
  <path d="M18 34 H37" stroke=${INK} stroke-width="1.5" stroke-dasharray="3 3" stroke-linecap="round" opacity="0.4"/>
</svg>`;

/** ...and the front (the soft lip at the bottom and the blanket) in front of it, so the pet is IN the bed. */
const BED_FRONT = svg`<svg viewBox="0 0 120 64" aria-hidden="true">
  <g class="blanket">
    <path d="M18 38 Q24 33 30 38 Q36 33 42 38 Q48 33 54 38 Q60 33 66 38 Q72 33 78 38 Q84 33 90 38 Q96 33 102 38 L104 52 Q60 62 16 52 Z" fill="#FF9EC0" stroke=${INK} stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M22 44 Q60 52 98 44" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
    <path d="M28 49 Q60 57 92 49" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
  </g>
  <path d="M8 44 Q60 60 112 44 Q118 56 104 60 Q60 68 16 60 Q2 56 8 44 Z" fill="#8B5CF6" stroke=${INK} stroke-width="3" stroke-linejoin="round"/>
  <path d="M16 52 Q60 62 104 52" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
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
 * A sleepy or hibernating pet sleeps in the bed, with the blanket pulled over it.
 * The pet itself is `boopli-pet`; this card only arranges the scene around it.
 */
export class BoopliStage extends LitElement {
  static properties = {
    kind: { type: String },
    mood: { type: String },
    level: { type: Number },
    away: { type: Boolean },
    activity: { type: String },
    moment: { type: String },
    momentSeq: { type: Number },
    momentText: { type: String },
  };

  declare kind: PetKind;
  declare mood: Mood;
  declare level: number;
  declare away: boolean;
  declare activity: Activity;
  declare moment: Moment;
  declare momentSeq: number;
  declare momentText: string;

  constructor() {
    super();
    this.kind = "slime";
    this.mood = "content";
    this.level = 1;
    this.away = false;
    this.activity = "";
    this.moment = "";
    this.momentSeq = 0;
    this.momentText = "";
  }

  // The bowl's ripple belongs to the stage, outside the pet, so the stage pauses it itself while the page is hidden.
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

  render() {
    const hasBed = this.level >= 3;
    // While you are away the pet always hibernates, whatever its mood was.
    const mood: Mood = this.away ? "hibernating" : this.mood;
    // While you are away it is not busy either (Today never sends an activity then): the same here, so the preview matches.
    const activity: Activity = this.away ? "" : this.activity;
    // Asleep in the bed, unless it is busy with something.
    const sleeping = hasBed && !activity && (mood === "sleepy" || mood === "hibernating");
    const deep = sleeping && mood === "hibernating";
    return html`<div class="scene ${sleeping ? "sleeping" : ""} ${deep ? "deep" : ""}" role="group" aria-label="Your pet's room">
      <div class="floor"></div>
      <div class="prop water">${WATER_BOWL}</div>
      ${this.level >= 2 ? html`<div class="prop food">${FOOD_BOWL}</div>` : nothing}
      ${hasBed ? html`<div class="prop bed">${BED_BACK}</div>` : nothing}
      <div class="actor">
        <boopli-pet
          .kind=${this.kind}
          .mood=${mood}
          .level=${this.level}
          .away=${this.away}
          .activity=${activity}
          .moment=${this.moment}
          .momentSeq=${this.momentSeq}
          .momentText=${this.momentText}
        ></boopli-pet>
      </div>
      ${hasBed ? html`<div class="prop bed front">${BED_FRONT}</div>` : nothing}
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
        aspect-ratio: 16 / 5; /* low, so Today fits on one screen */
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
        overflow: visible;
      }
      /* Everything in the room is sized by the room's height, so the card can be as low as you want. */
      .water {
        left: 7%;
        bottom: 3cqh;
        width: 36cqh;
      }
      .food {
        left: calc(7% + 40cqh);
        bottom: 3cqh;
        width: 36cqh;
      }
      .bed {
        right: 3%;
        bottom: 3cqh;
        width: 80cqh;
      }
      .suitcase {
        left: calc(50% + 24cqh);
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
        transform-origin: 50% 100%;
        transition: left 0.9s ease, bottom 0.9s ease, transform 0.9s ease;
      }
      /* Asleep: the pet is in the bed, a little smaller, with the blanket over part of it. */
      .sleeping .actor {
        left: calc(100% - 3% - 40cqh);
        bottom: 7cqh;
        transform: translateX(-50%) scale(0.82);
      }
      .blanket {
        transform-box: view-box;
        transform-origin: 60px 50px;
        transition: transform 0.9s ease;
        /* Awake: the blanket lies folded at the end of the bed. */
        transform: translate(34px, 2px) scale(0.5, 0.6);
      }
      .sleeping .blanket {
        transform: translate(0, 4px) scale(0.95, 0.85);
      }
      .deep .blanket {
        transform: translate(0, -1px) scale(0.95, 1);
      }
      /* The water in the bowl ripples. */
      .ripple {
        transform-box: fill-box;
        transform-origin: 50% 50%;
        animation: ripple 3.4s ease-out infinite;
      }
      :host([paused]) .ripple {
        animation-play-state: paused;
      }
      @keyframes ripple {
        0% {
          transform: scale(0.3);
          opacity: 0.9;
        }
        100% {
          transform: scale(2.4);
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ripple {
          animation: none;
          opacity: 0.6;
        }
        .actor,
        .blanket {
          transition: none;
        }
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
          width: 30cqh;
        }
        .food {
          left: calc(3% + 33cqh);
          width: 30cqh;
        }
        .bed {
          right: 3%;
          width: 62cqh;
        }
        .sleeping .actor {
          left: calc(100% - 3% - 31cqh);
        }
        .suitcase {
          left: calc(50% + 22cqh);
          width: 20cqh;
        }
      }
    `,
  ];
}

customElements.define("boopli-stage", BoopliStage);
