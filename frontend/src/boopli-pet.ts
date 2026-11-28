import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { bearCss, bearSvg } from "./pet-bear";
import { catCss, catSvg } from "./pet-cat";
import { dogCss, dogSvg } from "./pet-dog";
import { foxCss, foxSvg } from "./pet-fox";
import { furStyle, kitCss, workCss } from "./pet-kit";
import { slimeSvg } from "./pet-slime";
import { MOMENT_MS, type Activity, type Moment } from "./pet-work";
import { petInfo, type PetKind } from "./pets";
import type { Mood } from "./types";
import { t } from "./i18n";

export type { Activity, Moment };

/**
 * The pet's picture, and the ONLY place that draws it. A pet with its own animated art (all five pets) is drawn in code.
 * It fills the box it is put in, so the same pet works small (a picker) and big (the stage).
 *
 * Besides its mood it can be busy (`activity`: housework or typing) and it can play a one-shot
 * `moment` (level up, waking up, a tap, a step done) once for each change of `momentSeq`.
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
    hungry: { type: Boolean },
    fur: { type: String },
    neck: { type: String },
    still: { type: Boolean, reflect: true },
    activity: { type: String },
    moment: { type: String },
    momentSeq: { type: Number },
    momentText: { type: String },
    _playing: { state: true },
    _text: { state: true },
  };

  declare kind: PetKind;
  declare mood: Mood;
  declare level: number;
  declare away: boolean; // away mode is on: the stage shows a suitcase; here only the emoji pets get a badge
  declare hungry: boolean; // nothing to eat yet today: a rumbling belly and a thought of food (only over a content or happy mood)
  declare fur: string; // the fur colour it wears (#rrggbb); "" = its own colour
  declare neck: string; // the colour of the scarf it wears (#rrggbb); "" = none
  declare still: boolean; // draw it without moving (small previews)
  declare activity: Activity; // busy with housework or typing
  declare moment: Moment; // which moment to play when momentSeq changes
  declare momentSeq: number;
  declare momentText: string; // "Level 6!" or "+10 XP"
  declare _playing: Moment; // the moment that is playing right now
  declare _text: string;

  private _momentTimer = 0;
  private _momentLeft = 0; // ms of the playing moment still to go (the clock stops while the page is hidden)
  private _momentSince = 0; // when the timer was last started

  constructor() {
    super();
    this.kind = "slime";
    this.mood = "content";
    this.level = 1;
    this.away = false;
    this.hungry = false;
    this.fur = "";
    this.neck = "";
    this.still = false;
    this.activity = "";
    this.moment = "";
    this.momentSeq = 0;
    this.momentText = "";
    this._playing = "";
    this._text = "";
  }

  private _onVisibility = (): void => {
    this.toggleAttribute("paused", document.hidden);
    // The animation pauses while the page is hidden, so its clock must too: otherwise the moment
    // would be over before the page is seen again.
    if (document.hidden) {
      if (this._momentTimer) {
        window.clearTimeout(this._momentTimer);
        this._momentTimer = 0;
        this._momentLeft = Math.max(0, this._momentLeft - (Date.now() - this._momentSince));
      }
    } else if (this._playing && !this._momentTimer) {
      this._startMomentTimer();
    }
  };

  private _startMomentTimer(): void {
    this._momentSince = Date.now();
    this._momentTimer = window.setTimeout(() => {
      this._momentTimer = 0;
      this._momentLeft = 0;
      this._playing = "";
      this.dispatchEvent(new CustomEvent("moment-end", { bubbles: true, composed: true }));
    }, this._momentLeft);
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this._onVisibility);
    this._onVisibility();
  }

  disconnectedCallback(): void {
    document.removeEventListener("visibilitychange", this._onVisibility);
    window.clearTimeout(this._momentTimer);
    super.disconnectedCallback();
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("momentSeq") && this.moment) void this._play(this.moment, this.momentText);
  }

  /** Play a moment once: take the class off, let the page notice, put it on again, take it off at the end. */
  private async _play(moment: Exclude<Moment, "">, text = ""): Promise<void> {
    window.clearTimeout(this._momentTimer);
    this._momentTimer = 0;
    this._playing = "";
    await this.updateComplete;
    void this.offsetWidth;
    this._text = text;
    this._playing = moment;
    this._momentLeft = MOMENT_MS[moment];
    if (!document.hidden) this._startMomentTimer(); // when hidden it starts when the page is shown again
  }

  private _art() {
    const info = petInfo(this.kind);
    const options = { activity: this.activity, moment: this._playing, text: this._text, neck: this.neck || undefined };
    if (info.art && info.kind === "slime") return slimeSvg(this.mood, options);
    if (info.art && info.kind === "bear") return bearSvg(this.mood, options);
    if (info.art && info.kind === "dog") return dogSvg(this.mood, options);
    if (info.art && info.kind === "cat") return catSvg(this.mood, options);
    if (info.art && info.kind === "fox") return foxSvg(this.mood, options);
    return html`<span class="emoji" aria-hidden="true">${info.emoji}</span>
      <span class="badge" aria-hidden="true">${this.away ? "🧳" : BADGE[this.mood]}</span>`;
  }

  /** A tap makes it squish. A secret: tap the pet 7 times quickly and the Easter egg plays. Nothing in the panel points to it. */
  private _taps: number[] = [];

  private _tap(): void {
    if (!this._playing && !this.still) void this._play("tap");
    const now = Date.now();
    this._taps = [...this._taps.filter((t) => now - t < 4000), now];
    if (this._taps.length >= 7) {
      this._taps = [];
      this.dispatchEvent(new CustomEvent("egg-found", { bubbles: true, composed: true }));
    }
  }

  /** Hungry only shows over a calm mood: a sleepy, sad or hibernating pet shows that first, and away mode leaves it as it was. */
  private get _showHunger(): boolean {
    return this.hungry && !this.away && (this.mood === "happy" || this.mood === "content");
  }

  render() {
    const hungry = this._showHunger;
    return html`<div
      class="pet ${this.mood} ${hungry ? "hungry" : ""}"
      style=${this.fur ? furStyle(this.fur) : ""}
      role="img"
      aria-label=${hungry ? t("pet.your_pet_is", { mood: t("pet.mood_hungry") }) : t("pet.your_pet_is", { mood: t(`pet.mood_${this.mood}`) })}
      @click=${() => this._tap()}
    >
      ${this._art()}
      ${hungry
        ? html`<span class="hunger" aria-hidden="true"
            ><span class="thought">🍖</span><span class="rumble r1"></span><span class="rumble r2"></span><span class="rumble r3"></span
          ></span>`
        : nothing}
    </div>`;
  }

  static styles = [
    kitCss,
    bearCss,
    catCss,
    dogCss,
    foxCss,
    workCss,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .pet {
        position: relative;
        width: 100%;
        height: 100%;
        container-type: size;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
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
      /* Hungry: a thought of food above, and three small rumble marks that pulse at the belly. Drawn over every pet, the same. */
      .hunger {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .thought {
        position: absolute;
        right: 14%;
        top: 2%;
        font-size: 20cqh;
        line-height: 1;
        padding: 3cqh 4cqh;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
        animation: hunger-bob 2.6s ease-in-out infinite;
      }
      .rumble {
        position: absolute;
        bottom: 26%;
        width: 6%;
        height: 2.4cqh;
        border-radius: 999px;
        background: currentColor;
        opacity: 0;
        animation: hunger-rumble 1.8s ease-in-out infinite;
      }
      .rumble.r1 {
        left: 22%;
        transform: rotate(-24deg);
      }
      .rumble.r2 {
        left: 47%;
        animation-delay: 0.25s;
      }
      .rumble.r3 {
        right: 22%;
        transform: rotate(24deg);
        animation-delay: 0.5s;
      }
      @keyframes hunger-bob {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-3cqh);
        }
      }
      @keyframes hunger-rumble {
        0%,
        55%,
        100% {
          opacity: 0;
        }
        20%,
        40% {
          opacity: 0.55;
        }
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
        .rumble {
          opacity: 0.4 !important;
        }
      }
    `,
  ];
}

customElements.define("boopli-pet", BoopliPet);
