import { LitElement, html, css, type PropertyValues } from "lit";
import { slimeCss, slimeSvg, workCss } from "./pet-slime";
import { MOMENT_MS, type Activity, type Moment } from "./pet-slime-work";
import { petInfo, type PetKind } from "./pets";
import type { Mood } from "./types";

export type { Activity, Moment };

/**
 * The pet's picture, and the ONLY place that draws it. A pet with its own animated art (the
 * slime so far) is drawn in code; the others show their emoji until their art is ready.
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
  };

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
    this._playing = "";
    await this.updateComplete;
    void this.offsetWidth;
    this._text = text;
    this._playing = moment;
    this._momentTimer = window.setTimeout(() => {
      this._playing = "";
      this.dispatchEvent(new CustomEvent("moment-end", { bubbles: true, composed: true }));
    }, MOMENT_MS[moment]);
  }

  private _art() {
    const info = petInfo(this.kind);
    if (info.art && info.kind === "slime") {
      return slimeSvg(this.mood, { activity: this.activity, moment: this._playing, text: this._text });
    }
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
    slimeCss,
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
