import { LitElement, html, css, svg, nothing } from "lit";
import "./boopli-pet";
import { sharedStyles } from "./styles";
import type { PetKind } from "./pets";
import type { Mood } from "./types";
import type { Activity, Moment } from "./boopli-pet";
import { ROOM_ITEMS, SPOTS, coin, mealBowl, roomPaint, type RoomItem, type Spot } from "./shop-art";
import { icon } from "./icon";
import { t } from "./i18n";

const INK = "#101010";

type StageFeed = "" | "fill" | "walk" | "eat" | "back";

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
    hungry: { type: Boolean },
    activity: { type: String },
    moment: { type: String },
    momentSeq: { type: Number },
    momentText: { type: String },
    owned: { attribute: false },
    placed: { attribute: false },
    controls: { type: Boolean },
    blubs: { type: Number },
    canBuy: { type: Boolean },
    mealsEaten: { type: Number },
    mealsMax: { type: Number },
    feedSeq: { type: Number },
    _feed: { state: true },
  };

  declare kind: PetKind;
  declare mood: Mood;
  declare level: number;
  declare away: boolean;
  declare hungry: boolean; // nothing eaten yet today (the pet shows it)
  declare activity: Activity;
  declare moment: Moment;
  declare momentSeq: number;
  declare momentText: string;
  declare owned: string[]; // the ids of what the household bought
  declare placed: { wall?: string; floor?: string };
  declare controls: boolean; // show the Blubs field and the inventory button
  declare blubs: number;
  declare canBuy: boolean; // something new can be bought right now: the Blubs field turns green
  declare mealsEaten: number; // meals the pet ate today
  declare mealsMax: number; // meals it eats before it is full
  declare feedSeq: number; // counts the meals just given, so each one plays the eating scene
  declare _feed: "" | "fill" | "walk" | "eat" | "back"; // the part of the eating scene that is playing
  private _feedTimers: number[] = [];

  constructor() {
    super();
    this.kind = "slime";
    this.mood = "content";
    this.level = 1;
    this.away = false;
    this.hungry = false;
    this.activity = "";
    this.moment = "";
    this.momentSeq = 0;
    this.momentText = "";
    this.owned = [];
    this.placed = {};
    this.controls = false;
    this.blubs = 0;
    this.canBuy = false;
    this.mealsEaten = 0;
    this.mealsMax = 3;
    this.feedSeq = 0;
    this._feed = "";
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
        ${coin()}<span class="n">${this.blubs}</span>
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
      <span
        class="meals"
        role="img"
        aria-label=${t("stage.meals_left_today", { left: Math.max(0, this.mealsMax - this.mealsEaten), max: this.mealsMax })}
        title=${t("stage.meals_left_today", { left: Math.max(0, this.mealsMax - this.mealsEaten), max: this.mealsMax })}
      >
        ${Array.from({ length: this.mealsMax }, (_v, i) => mealBowl(i >= this.mealsEaten))}
      </span>
    </div>`;
  }

  // The eating scene: the bowl fills, the pet walks over, eats while the kibble goes down, and walks back.
  private _clearFeed(): void {
    for (const id of this._feedTimers) window.clearTimeout(id);
    this._feedTimers = [];
  }

  private _playFeed(): void {
    this._clearFeed();
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const steps: [number, StageFeed][] = calm
      ? [[0, "fill"], [1400, ""]] // no walking about: the bowl fills and empties
      : [[0, "fill"], [700, "walk"], [1700, "eat"], [4300, "back"], [5300, ""]];
    for (const [ms, phase] of steps) {
      this._feedTimers.push(window.setTimeout(() => (this._feed = phase), ms));
    }
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has("feedSeq") && this.feedSeq > 0 && this._items().some((item) => item.role === "food")) this._playFeed();
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
    this._clearFeed();
    this._feed = ""; // not stuck half-way through the scene when it is shown again
    document.removeEventListener("visibilitychange", this._onVisibility);
    super.disconnectedCallback();
  }

  /** What stands in the room: the owned room items (in drawing order) that fit this pet. */
  private _items(): RoomItem[] {
    const mine = ROOM_ITEMS.filter((item) => this.owned.includes(item.id) && (!item.species || item.species === this.kind));
    // An attachment is only there together with the item it sits on.
    return mine.filter((item) => !item.attach || mine.some((other) => other.id === item.attach?.to));
  }

  /** What is drawn on the item `id`: the attachments that sit on it. */
  private _attachments(items: RoomItem[], id: string) {
    return items
      .filter((item) => item.attach?.to === id)
      .map(
        (item) =>
          html`<span class="attach" style="left:${item.attach?.x}%;top:${item.attach?.y}%;width:${item.attach?.w}%">${item.art}</span>`,
      );
  }

  /** The inline style that puts an item in its spot (the CSS reads these variables, the phone ones on a phone). */
  private _spotStyle(spot: Spot): string {
    const vars: [string, string | undefined][] = [
      ["l", spot.l],
      ["r", spot.r],
      ["t", spot.t],
      ["b", spot.b],
      ["w", spot.w],
      ["pl", spot.pl],
      ["pr", spot.pr],
      ["pw", spot.pw],
    ];
    return vars
      .filter(([, v]) => v)
      .map(([k, v]) => `--${k}:${v}`)
      .join(";");
  }

  render() {
    const items = this._items();
    const bed = items.find((item) => item.role === "bed");
    const food = items.find((item) => item.role === "food");
    const hasBed = !!bed;
    // Where the pet lies down and where it stands to eat: set by the items that have those roles.
    const bedSpot = bed?.spot ? SPOTS[bed.spot] : undefined;
    const foodSpot = food?.spot ? SPOTS[food.spot] : undefined;
    const standing = items.filter((item) => item.spot);
    const roleVars = [
      bedSpot?.sleep && `--sleep:${bedSpot.sleep}`,
      bedSpot?.psleep && `--psleep:${bedSpot.psleep}`,
      foodSpot?.stand && `--stand:${foodSpot.stand}`,
      foodSpot?.pstand && `--pstand:${foodSpot.pstand}`,
    ];
    const wall = roomPaint(this.placed.wall);
    const floor = roomPaint(this.placed.floor);
    // While you are away the pet always hibernates, whatever its mood was.
    const mood: Mood = this.away ? "hibernating" : this.mood;
    // While you are away it is not busy either (Today never sends an activity then): the same here, so the preview matches.
    const activity: Activity = this.away ? "" : this.activity;
    // Asleep in the bed, unless it is busy with something.
    const sleeping = hasBed && !activity && (mood === "sleepy" || mood === "hibernating");
    const deep = sleeping && mood === "hibernating";
    const feed = this._feed ? `feed-${this._feed}` : "";
    // Asleep or busy: the pet does not walk to the bowl (the bowl still fills and empties).
    const stays = sleeping || !!activity;
    return html`<div
      class="scene ${sleeping ? "sleeping" : ""} ${deep ? "deep" : ""} ${feed} ${stays ? "stays" : ""}"
      style=${[wall && `background:${wall}`, ...roleVars].filter(Boolean).join(";")}
      role="group"
      aria-label=${t("stage.your_pets_room")}
    >
      <div class="floor" style=${floor ? `background:${floor}` : ""}></div>
      ${this._renderControls()}
      ${standing.map(
        (item) =>
          html`<div class="prop item role-${item.role ?? "none"}" style=${this._spotStyle(SPOTS[item.spot!])}>${item.art}${this._attachments(items, item.id)}</div>`,
      )}
      <div class="actor">
        <boopli-pet
          .kind=${this.kind}
          .mood=${mood}
          .level=${this.level}
          .away=${this.away}
          .hungry=${this.hungry}
          .activity=${activity}
          .moment=${this.moment}
          .momentSeq=${this.momentSeq}
          .momentText=${this.momentText}
        ></boopli-pet>
      </div>
      ${standing.map((item) =>
        item.front
          ? html`<div class="prop item front role-${item.role ?? "none"}" style=${this._spotStyle(SPOTS[item.spot!])}>${item.front}</div>`
          : nothing,
      )}
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
        /* Colourful on purpose: the room is the pet's world, not part of the dashboard, whatever theme Home Assistant has. */
        border: 2px solid color-mix(in srgb, #e9b949 70%, transparent);
        background: color-mix(in srgb, #e9b949 16%, var(--card-background-color, #1c1c1c) 92%);
        color: var(--primary-text-color, #fff);
        font-size: 17px;
        font-weight: 700;
        cursor: pointer;
      }
      .controls button:hover {
        background: color-mix(in srgb, #e9b949 28%, var(--card-background-color, #1c1c1c) 92%);
      }
      .controls button.inv {
        border-color: color-mix(in srgb, #a98bff 70%, transparent);
        background: color-mix(in srgb, #a98bff 18%, var(--card-background-color, #1c1c1c) 92%);
        color: #b9a2ff;
      }
      .controls button.inv:hover {
        background: color-mix(in srgb, #a98bff 30%, var(--card-background-color, #1c1c1c) 92%);
      }
      .controls button.buyable {
        background: #2e7d32;
        border-color: #2e7d32;
        color: #fff;
      }
      .coin {
        display: inline-flex;
        width: 1.3em;
        height: 1.3em;
      }
      .coin svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      /* The meals still possible today: a little bowl for each, full = can still eat, empty = eaten. */
      .meals {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        height: 34px;
        padding: 0 8px;
        border-radius: 999px;
        border: 2px solid color-mix(in srgb, #e9b949 70%, transparent);
        background: color-mix(in srgb, #e9b949 16%, var(--card-background-color, #1c1c1c) 92%);
        color: var(--secondary-text-color, #aaa);
      }
      .meals svg {
        display: block;
        width: 24px;
        height: 17px;
        overflow: visible;
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
      /* An attachment sits on its item: its box is in percent of the item's picture. */
      .attach {
        position: absolute;
      }
      /* A room item stands where its spot says (see SPOTS in shop-art.ts). */
      .item {
        left: var(--l, auto);
        right: var(--r, auto);
        top: var(--t, auto);
        bottom: var(--b, auto);
        width: var(--w);
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
        left: var(--sleep, 50%);
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
      /* Feeding: the bowl is empty by itself; the kibble comes when the pet is fed and goes down while it eats. */
      .role-food .kibble {
        opacity: 0;
        transform-box: fill-box;
        transform-origin: 50% 100%;
      }
      .feed-fill .role-food .kibble,
      .feed-walk .role-food .kibble {
        opacity: 1;
        animation: kibble-in 0.45s ease-out;
      }
      .feed-eat .role-food .kibble {
        opacity: 1;
      }
      /* Eaten piece by piece, from the pet's side first. */
      .feed-eat .role-food .kibble circle {
        transform-box: fill-box;
        transform-origin: 50% 50%;
        animation: bite 0.35s ease-in both;
        animation-delay: calc(0.25s + var(--i, 0) * 0.3s);
      }
      .feed-walk:not(.stays) .actor,
      .feed-eat:not(.stays) .actor {
        left: var(--stand, 50%);
      }
      .feed-eat:not(.stays) .actor {
        animation: chomp 0.6s ease-in-out infinite;
      }
      @keyframes kibble-in {
        from {
          opacity: 0;
          transform: scaleY(0.2);
        }
        to {
          opacity: 1;
          transform: scaleY(1);
        }
      }
      @keyframes bite {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.2);
        }
      }
      @keyframes chomp {
        0%,
        100% {
          transform: translateX(-50%) rotate(-4deg);
        }
        50% {
          transform: translateX(-50%) translateY(2cqh) rotate(-11deg) scaleY(0.95);
        }
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
        .feed-eat .actor,
        .feed-eat .role-food .kibble circle,
        .feed-eat .role-food .kibble,
        .feed-fill .role-food .kibble,
        .feed-walk .role-food .kibble {
          animation: none;
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
        .item {
          left: var(--pl, var(--l, auto));
          right: var(--pr, var(--r, auto));
          width: var(--pw, var(--w));
        }
        .sleeping .actor {
          left: var(--psleep, var(--sleep, 50%));
        }
        .feed-walk:not(.stays) .actor,
        .feed-eat:not(.stays) .actor {
          left: var(--pstand, var(--stand, 50%));
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
