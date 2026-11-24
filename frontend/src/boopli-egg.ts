import { LitElement, html, css } from "lit";
import { t } from "./i18n";

/**
 * The Easter egg: the spinning cat.
 *
 * Put it in the page and it plays once, over the whole screen: in the middle
 * for the first spins, then hopping around when the music sets in, and it fades
 * out (picture and sound together) after 30 seconds. The cat is the original
 * clip's own frames, so the fast, slow and steady spins are the original's.
 * It never takes a click and has its own mute button.
 *
 * Events: `egg-started` when it starts (the panel uses it for the one-time
 * gift) and `egg-done` when it is over.
 */
const EGG_PLAY_SECONDS = 30;
const EGG_FADE_SECONDS = 1.5;
const EGG_VOLUME = 0.55;
const MUSIC_SETS_IN = 6.1; // seconds into the song: the cat stays put before this, then roams
const HOP_SECONDS = 60 / 140; // one hop per beat
const CAT_WIDTH = 260; // css pixels (the clips are 350 x 305)
const CAT_HEIGHT = 227;
const EGG_AUDIO = new URL("./easter-egg.mp3", import.meta.url).href;
const EGG_INTRO = new URL("./easter-egg-intro.webm", import.meta.url).href; // the first spins, as in the original
const EGG_LOOP = new URL("./easter-egg-loop.webm", import.meta.url).href; // the steady spin that follows, repeated

const NOTE_SECONDS = 12;

/** Safari's engine (WebKit) can't show see-through VP9 video. Every browser on iPhone and iPad uses it. */
function usesAppleEngine(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /safari/i.test(ua) && !/chrome|chromium|crios|fxios|edg|android/i.test(ua);
  return ios || safari;
}

export class BoopliEgg extends LitElement {
  static properties = {
    _muted: { state: true },
    _cat: { state: true },
    _note: { state: true },
  };

  declare _note: boolean; // Safari's engine: show the note instead of the egg
  private _noteTimer?: number;
  declare _muted: boolean;
  declare _cat: boolean; // the browser can show the see-through clips and the person allows motion
  private _frame?: number;
  private _audio?: HTMLAudioElement;
  private _started = 0;
  private _lastHop = -1;
  private _hasSound = false;
  private _over = false;

  constructor() {
    super();
    this._muted = false;
    this._cat = false;
    this._note = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (usesAppleEngine()) {
      // Safari's engine (every browser on iPhone and iPad) can't show the see-through cat.
      // No cat, no music, no gift: just a sassy note, then it is over.
      this._note = true;
      this._noteTimer = window.setTimeout(() => this._stop(true), NOTE_SECONDS * 1000);
      return;
    }
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this._cat = !calm && document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
    this._started = performance.now();
    try {
      const audio = new Audio(EGG_AUDIO);
      audio.volume = EGG_VOLUME;
      audio.muted = this._muted;
      this._audio = audio;
      // The browser may refuse sound; then the cat just plays without it.
      void audio.play().then(
        () => (this._hasSound = true),
        () => undefined
      );
    } catch {
      /* no sound, the cat still plays */
    }
    this.dispatchEvent(new CustomEvent("egg-started", { bubbles: true, composed: true }));
    void this.updateComplete.then(() => this._run());
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stop(false);
  }

  /** The clock of the egg in seconds: the music's own clock when there is sound. */
  private _time(): number {
    return this._hasSound && this._audio ? this._audio.currentTime : (performance.now() - this._started) / 1000;
  }

  private _run(): void {
    const intro = this.renderRoot.querySelector<HTMLVideoElement>("video.intro");
    const loop = this.renderRoot.querySelector<HTMLVideoElement>("video.loop");
    const cat = this.renderRoot.querySelector<HTMLElement>(".egg-cat");
    const layer = this.renderRoot.querySelector<HTMLElement>(".egg-layer");
    if (intro) void intro.play().catch(() => undefined);
    let inLoop = false;
    if (cat) {
      const x = (window.innerWidth - CAT_WIDTH) / 2;
      const y = (window.innerHeight - CAT_HEIGHT) / 2;
      cat.style.transform = `translate(${x}px, ${y}px) scale(1)`;
    }
    const tick = () => {
      const t = this._time();
      // Fade out at the end, picture and sound together.
      const left = EGG_PLAY_SECONDS - t;
      const fade = Math.max(0, Math.min(1, left / EGG_FADE_SECONDS));
      if (layer) layer.style.opacity = String(fade);
      if (this._audio) this._audio.volume = EGG_VOLUME * fade;
      if (left <= 0) {
        this._stop(true);
        return;
      }
      if (intro && loop && !inLoop) {
        // Keep the first spins in step with the music (the clips are the original's frames).
        if (this._hasSound && Math.abs(intro.currentTime - t) > 0.15) intro.currentTime = t;
        if (intro.ended || intro.currentTime >= intro.duration - 0.04) {
          inLoop = true;
          loop.hidden = false;
          void loop.play().catch(() => undefined);
          intro.hidden = true;
        }
      }
      // Stay in the middle for the first spins; roam when the music sets in.
      if (cat && t >= MUSIC_SETS_IN) {
        const hop = Math.floor((t - MUSIC_SETS_IN) / HOP_SECONDS);
        if (hop !== this._lastHop) {
          this._lastHop = hop;
          const scale = 0.75 + Math.random() * 0.7;
          const w = CAT_WIDTH * scale;
          const h = CAT_HEIGHT * scale;
          const x = Math.random() * Math.max(1, window.innerWidth - w);
          const y = Math.random() * Math.max(1, window.innerHeight - h);
          cat.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }
      }
      this._frame = requestAnimationFrame(tick);
    };
    this._frame = requestAnimationFrame(tick);
  }

  private _stop(announce: boolean): void {
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = undefined;
    if (this._noteTimer) window.clearTimeout(this._noteTimer);
    this._noteTimer = undefined;
    if (this._audio) {
      this._audio.pause();
      this._audio = undefined;
    }
    if (announce && !this._over) {
      this._over = true;
      this.dispatchEvent(new CustomEvent("egg-done", { bubbles: true, composed: true }));
    }
  }

  private _toggleMute(): void {
    this._muted = !this._muted;
    if (this._audio) this._audio.muted = this._muted;
  }

  render() {
    if (this._note) {
      return html`<div class="note" role="status">
        <span
          >${t("egg.here_would_be_an_easter_egg")}</span
        >
        <button type="button" class="ctl" aria-label=${t("common.close")} @click=${() => this._stop(true)}>✕</button>
      </div>`;
    }
    return html`${this._cat
        ? html`<div class="egg-layer" aria-hidden="true">
            <div class="egg-cat">
              <video class="intro" src=${EGG_INTRO} muted playsinline preload="auto"></video>
              <video class="loop" src=${EGG_LOOP} muted playsinline loop preload="auto" hidden></video>
            </div>
          </div>`
        : ""}
      <div class="controls">
        <button
          type="button"
          class="ctl"
          aria-label=${this._muted ? "Turn the sound on" : "Turn the sound off"}
          @click=${() => this._toggleMute()}
        >
          ${this._muted ? "🔇" : "🔊"}
        </button>
        <button type="button" class="ctl" aria-label=${t("egg.stop_the_easter_egg")} @click=${() => this._stop(true)}>${t("egg.stop")}</button>
      </div>`;
  }

  static styles = css`
    :host {
      display: contents;
    }
    /* The cat roams over the whole screen and never takes a click. */
    .egg-layer {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      overflow: hidden;
    }
    .egg-cat {
      position: absolute;
      left: 0;
      top: 0;
      width: 260px;
      height: 227px;
      transform-origin: 0 0;
      transition: transform 0.32s cubic-bezier(0.25, 1.35, 0.5, 1);
      will-change: transform;
    }
    .egg-cat video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      pointer-events: none;
    }
    .controls {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 10000;
      display: flex;
      gap: 8px;
    }
    .note {
      position: fixed;
      right: 18px;
      bottom: 18px;
      left: 18px;
      max-width: 420px;
      margin-left: auto;
      z-index: 10000;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 12px 14px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font-size: 15px;
      line-height: 1.4;
    }
    .ctl {
      border: 1px solid var(--divider-color);
      border-radius: 999px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      min-height: 0;
      padding: 6px 14px;
      font: inherit;
      font-size: 16px;
      cursor: pointer;
    }
  `;
}

customElements.define("boopli-egg", BoopliEgg);
