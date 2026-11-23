import { LitElement, html, css, type PropertyValues } from "lit";
import { bearCss, bearSvg } from "./pet-bear";
import { catCss, catSvg } from "./pet-cat";
import { dogCss, dogSvg } from "./pet-dog";
import { foxCss, foxSvg } from "./pet-fox";
import { kitCss, workCss } from "./pet-kit";
import { slimeSvg } from "./pet-slime";
import { MOMENT_MS, type Activity, type Moment } from "./pet-work";
import { petInfo, type PetKind } from "./pets";
import type { Mood } from "./types";

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
    const options = { activity: this.activity, moment: this._playing, text: this._text };
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
