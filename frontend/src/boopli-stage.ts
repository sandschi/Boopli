import { LitElement, html, css, svg, nothing } from "lit";
import "./boopli-pet";
import { sharedStyles } from "./styles";
import type { PetKind } from "./pets";
import type { Mood } from "./types";
import type { Activity, Moment } from "./boopli-pet";
import { BED_BACK, BED_FRONT, FOOD_BOWL, WATER_BOWL, roomPaint } from "./shop-art";
import { icon } from "./icon";
import { t } from "./i18n";

const INK = "#101010";

/** A little suitcase: it stands next to the pet while away mode is on. */
const SUITCASE = svg`<svg viewBox="0 0 50 50" aria-hidden="true">
  <path d="M17 17 V11 Q17 7 21 7 H29 Q33 7 33 11 V17" fill="none" stroke=${INK} stroke-width="3" stroke-linecap="round"/>
  <rect x="5" y="16" width="40" height="30" rx="6" fill="#FF8A3D" stroke=${INK} stroke-width="3"/>
  <path d="M17 16 V46 M33 16 V46" stroke=${INK} stroke-width="2.5" opacity="0.55"/>
  <rect x="22" y="28" width="6" height="5" rx="1.5" fill="#FFD166" stroke=${INK} stroke-width="2"/>
</svg>`;

/**
 * The scene the pet lives in: a calm room with a floor. What stands in it is what the household bought
 * in the shop (water bowl, food bowl, bed), the wall and the floor wear the colour or pattern put on them,
 * and a suitcase appears while away mode is on. A sleepy or hibernating pet sleeps in the bed (when it
 * has one), with the blanket pulled over it. The pet itself is `boopli-pet`; this card only arranges the scene.
 *
 * With `controls` (Today) the top left has the Blubs field (opens the shop) and the inventory button.
 * Without them the room is only a picture (the wall board, the preview).
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
    owned: { attribute: false },
    placed: { attribute: false },
    controls: { type: Boolean },
    blubs: { type: Number },
    canBuy: { type: Boolean },
  };

  declare kind: PetKind;
  declare mood: Mood;
  declare level: number;
  declare away: boolean;
  declare activity: Activity;
  declare moment: Moment;
  declare momentSeq: number;
  declare momentText: string;
  declare owned: string[]; // the ids of what the household bought
  declare placed: { wall?: string; floor?: string };
  declare controls: boolean; // show the Blubs field and the inventory button
  declare blubs: number;
  declare canBuy: boolean; // something new can be bought right now: the Blubs field turns green

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
    this.owned = [];
    this.placed = {};
    this.controls = false;
    this.blubs = 0;
    this.canBuy = false;
  }

  private _open(what: "open-shop" | "open-inventory"): void {
    this.dispatchEvent(new CustomEvent(what, { bubbles: true, composed: true }));
  }

  private _renderControls() {
    if (!this.controls) return nothing;
    return html`<div class="controls">
      <button
        type="button"
        class="blubs ${this.canBuy ? "buyable" : ""}"
        aria-label=${t("stage.blubs_open_the_shop", { count: this.blubs })}
        title=${t("stage.open_the_shop")}
        @click=${() => this._open("open-shop")}
      >
        ${icon("water")}<span class="n">${this.blubs}</span>
      </button>
      <button
        type="button"
        class="inv"
        aria-label=${t("stage.open_the_inventory")}
        title=${t("stage.open_the_inventory")}
        @click=${() => this._open("open-inventory")}
      >
        ${icon("bag-personal-outline")}
      </button>
    </div>`;
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
    const has = (id: string): boolean => this.owned.includes(id);
    const hasBed = has("bed");
    const wall = roomPaint(this.placed.wall);
    const floor = roomPaint(this.placed.floor);
    // While you are away the pet always hibernates, whatever its mood was.
    const mood: Mood = this.away ? "hibernating" : this.mood;
    // While you are away it is not busy either (Today never sends an activity then): the same here, so the preview matches.
    const activity: Activity = this.away ? "" : this.activity;
    // Asleep in the bed, unless it is busy with something.
    const sleeping = hasBed && !activity && (mood === "sleepy" || mood === "hibernating");
    const deep = sleeping && mood === "hibernating";
    return html`<div
      class="scene ${sleeping ? "sleeping" : ""} ${deep ? "deep" : ""}"
      style=${wall ? `background:${wall}` : ""}
      role="group"
      aria-label=${t("stage.your_pets_room")}
    >
      <div class="floor" style=${floor ? `background:${floor}` : ""}></div>
      ${this._renderControls()}
      ${has("water_bowl") ? html`<div class="prop water">${WATER_BOWL}</div>` : nothing}
      ${has("food_bowl") ? html`<div class="prop food">${FOOD_BOWL}</div>` : nothing}
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
        background: color-mix(in srgb, var(--boopli-accent, var(--primary-color, #03a9f4)) 10%, var(--secondary-background-color, #2a2a2a));
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
      /* Top left: the Blubs field (opens the shop) and the inventory button. Calm: a quiet frame; only a colour change says "something new". */
      .controls {
        position: absolute;
        top: 8px;
        left: 8px;
        z-index: 3;
        display: flex;
        gap: 6px;
      }
      .controls button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 34px;
        min-width: 34px;
        padding: 2px 10px;
        border-radius: 999px;
        border: 2px solid color-mix(in srgb, var(--primary-text-color, #888) 35%, transparent);
        background: color-mix(in srgb, var(--card-background-color, #1c1c1c) 85%, transparent);
        color: var(--primary-text-color, #fff);
        font-size: 17px;
        font-weight: 600;
        cursor: pointer;
      }
      .controls button.buyable {
        background: #2e7d32;
        border-color: #2e7d32;
        color: #fff;
      }
      .controls button:focus-visible {
        outline: 3px solid var(--boopli-accent, var(--primary-color, #03a9f4));
        outline-offset: 2px;
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
