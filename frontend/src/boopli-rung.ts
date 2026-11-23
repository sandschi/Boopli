import { LitElement, html, css, nothing } from "lit";
import { friendlyName, hexToRgb, lightHasColor, phoneName, rgbToHex } from "./helpers";
import { sharedStyles } from "./styles";
import type { Hass, LightMode, PhoneLevel, Rung, Settings, SpeakerCfg, SpeakerChoice } from "./types";

const GAP_MIN = 1;
const GAP_MAX = 720;

const PHONE_CHOICES: { value: PhoneLevel; label: string }[] = [
  { value: "normal", label: "Normal notification" },
  { value: "high", label: "High priority (pops up)" },
  { value: "alarm", label: "Alarm volume" },
  { value: "alarm_max", label: "Max volume" },
];

/** What a ladder can pick for a speaker: only what is set up (levels that are switched on, its extra sounds). */
export function speakerChoices(sp: SpeakerCfg): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  if (sp.cue?.enabled) out.push({ value: "cue", label: "A ding" });
  for (const x of sp.sounds ?? []) out.push({ value: `sound:${x.id}`, label: `🔔 ${x.name}` });
  if (sp.speech?.enabled) {
    out.push({ value: "speech", label: "Speaks" });
    // An announcement (starts with a chime) is something Alexa Media Player does.
    if (sp.speech.route === "alexa_media") out.push({ value: "speech_chime", label: "Speaks with chime" });
  }
  if (sp.alarm?.enabled) out.push({ value: "alarm", label: "Alarm" });
  return out;
}

/**
 * One nudge of a ladder: which phone, light, speaker and alarm device acts, and how loud. With `gap`
 * (the wizard) it also asks how long to wait for this nudge. The devices come from Settings.
 * It sends `rung-change` with the whole changed nudge.
 */
export class BoopliRung extends LitElement {
  static properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    rung: { attribute: false },
    index: { type: Number },
    gap: { type: Boolean },
  };

  declare hass?: Hass;
  declare settings?: Settings;
  declare rung?: Rung;
  declare index: number; // 0 for the first nudge (used in the labels)
  declare gap: boolean; // also show the wait (not for the first nudge)

  constructor() {
    super();
    this.index = 0;
    this.gap = false;
  }

  private _change(fn: (r: Rung) => void): void {
    if (!this.rung) return;
    const next = structuredClone(this.rung);
    fn(next);
    this.dispatchEvent(new CustomEvent("rung-change", { detail: next, bubbles: true, composed: true }));
  }

  private _toggle(device: string, on: boolean): void {
    this._change((r) => {
      const rest = r.alarms.filter((d) => d !== device);
      r.alarms = on ? [...rest, device] : rest;
    });
  }

  private _setPhone(service: string, level: string): void {
    this._change((r) => {
      if (level) r.phones[service] = level as PhoneLevel;
      else delete r.phones[service];
    });
  }

  private _setSpeaker(entity: string, choice: string): void {
    this._change((r) => {
      if (choice) r.speakers[entity] = choice as SpeakerChoice;
      else delete r.speakers[entity];
    });
  }

  /** A light at this nudge: "" off, "blink", "indicator" (a status light) or "own" (as set for the light). */
  private _setLight(entity: string, value: string): void {
    this._change((r) => {
      if (!value) {
        delete r.lights[entity];
        return;
      }
      const keep = r.lights[entity];
      r.lights[entity] = { mode: value === "own" ? "" : (value as LightMode), color: keep?.color ?? null };
    });
  }

  private _setLightColor(entity: string, color: number[] | null): void {
    this._change((r) => {
      if (r.lights[entity]) r.lights[entity].color = color;
    });
  }

  private _setGap(raw: string): void {
    const n = Math.round(Number(raw));
    if (raw.trim() === "" || Number.isNaN(n)) return;
    this._change((r) => (r.gap = Math.min(GAP_MAX, Math.max(GAP_MIN, n))));
  }

  render() {
    const s = this.settings;
    const r = this.rung;
    if (!s || !r) return nothing;
    const n = this.index + 1;
    const none = !s.phones.length && !s.lights.length && !s.speakers.length && !s.alarm_devices.length;
    return html`
      ${this.gap && this.index > 0
        ? html`<label class="gap">
            Wait
            <input
              type="number"
              min=${GAP_MIN}
              max=${GAP_MAX}
              .value=${String(r.gap)}
              aria-label="Minutes before nudge ${n}"
              @change=${(e: Event) => this._setGap((e.target as HTMLInputElement).value)}
            />
            minutes after the previous nudge
          </label>`
        : nothing}
      ${none
        ? html`<p class="muted small">
            Set up a phone, light, speaker or alarm device in Settings first. They show up here.
          </p>`
        : nothing}
      <div class="devs">
        ${s.phones.map(
          (p) => html`<label class="dev">
            <span>📱 ${phoneName(p.service)}</span>
            <select
              aria-label="${phoneName(p.service)} at nudge ${n}"
              @change=${(e: Event) => this._setPhone(p.service, (e.target as HTMLSelectElement).value)}
            >
              <option value="" ?selected=${!r.phones[p.service]}>Off</option>
              ${PHONE_CHOICES.map(
                (c) => html`<option value=${c.value} ?selected=${r.phones[p.service] === c.value}>${c.label}</option>`
              )}
            </select>
          </label>`
        )}
        ${s.lights.map((light) => {
          const use = r.lights[light.entity_id];
          const name = friendlyName(this.hass, light.entity_id);
          return html`<div class="devblock">
            <label class="dev">
              <span>💡 ${name}</span>
              <select
                aria-label="${name} at nudge ${n}"
                @change=${(e: Event) => this._setLight(light.entity_id, (e.target as HTMLSelectElement).value)}
              >
                <option value="" ?selected=${!use}>Off</option>
                <option value="blink" ?selected=${use?.mode === "blink"}>Blink</option>
                <option value="indicator" ?selected=${use?.mode === "indicator"}>Status light (stays on until you answer)</option>
                <option value="own" ?selected=${use?.mode === ""}>As set for the light</option>
              </select>
            </label>
            ${use && lightHasColor(this.hass, light.entity_id)
              ? html`<div class="dev colorrow">
                  <span>Color</span>
                  <input
                    type="color"
                    class="swatch"
                    aria-label="${name} color at nudge ${n}"
                    .value=${rgbToHex(use.color ?? light.color)}
                    @input=${(e: Event) => this._setLightColor(light.entity_id, hexToRgb((e.target as HTMLInputElement).value))}
                  />
                  <button type="button" class="chip" ?disabled=${!use.color} @click=${() => this._setLightColor(light.entity_id, null)}>
                    Use the normal color
                  </button>
                </div>`
              : nothing}
          </div>`;
        })}
        ${s.speakers.map((sp) => {
          const choices = speakerChoices(sp);
          const current = r.speakers[sp.entity_id];
          const name = friendlyName(this.hass, sp.entity_id);
          return html`<label class="dev">
            <span>🔊 ${name}</span>
            <select
              aria-label="${name} at nudge ${n}"
              ?disabled=${!choices.length && !current}
              @change=${(e: Event) => this._setSpeaker(sp.entity_id, (e.target as HTMLSelectElement).value)}
            >
              <option value="" ?selected=${!current}>${choices.length ? "Off" : "No sound set up"}</option>
              ${choices.map((c) => html`<option value=${c.value} ?selected=${current === c.value}>${c.label}</option>`)}
              ${current && !choices.some((c) => c.value === current)
                ? html`<option value=${current} selected>(not available any more)</option>`
                : nothing}
            </select>
          </label>`;
        })}
        ${s.alarm_devices.map(
          (device) => html`<label class="dev check">
            <input
              type="checkbox"
              .checked=${r.alarms.includes(device.entity_id)}
              @change=${(e: Event) => this._toggle(device.entity_id, (e.target as HTMLInputElement).checked)}
            />
            <span>🚨 ${friendlyName(this.hass, device.entity_id)}</span>
          </label>`
        )}
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .small {
        font-size: 13px;
      }
      label.gap {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin: 0 0 10px;
        font-size: 14px;
        color: var(--primary-text-color);
      }
      label.gap input {
        width: 84px;
        min-height: 36px;
        padding: 4px 8px;
      }
      .devs {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      label.dev {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 10px;
        margin: 0;
        font-size: 14px;
        color: var(--primary-text-color);
      }
      label.dev > span {
        flex: 1 1 110px;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      label.dev select {
        flex: 1 1 170px;
        width: auto;
        min-width: 0;
      }
      .devblock {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .colorrow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
        padding-left: 4px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .colorrow .swatch {
        width: 44px;
        min-height: 34px;
        padding: 2px;
      }
      label.dev.check {
        justify-content: flex-start;
      }
      label.dev.check input {
        width: auto;
        min-height: 0;
        flex: none;
      }
      label.dev.check span {
        flex: 1;
      }
    `,
  ];
}

customElements.define("boopli-rung", BoopliRung);
