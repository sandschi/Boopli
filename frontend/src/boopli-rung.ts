import { LitElement, html, css, nothing } from "lit";
import { icon } from "./icon";
import { friendlyName, hexToRgb, lightHasColor, phoneName, rgbToHex } from "./helpers";
import { sharedStyles } from "./styles";
import type { ExtraSound, Hass, LightMode, PhoneLevel, Rung, Settings, SpeakerCfg, SpeakerChoice } from "./types";
import { t } from "./i18n";

const GAP_MIN = 1;
const GAP_MAX = 720;

const PHONE_CHOICES = (): { value: PhoneLevel; label: string }[] => [
  { value: "normal", label: t("common.normal_notification") },
  { value: "high", label: t("common.high_priority_pops_up") },
  { value: "alarm", label: t("common.alarm_volume") },
  { value: "alarm_max", label: t("rung.max_volume") },
];

/** What a ladder can pick for a speaker: only what is set up (levels that are switched on, its extra sounds). */
export function speakerChoices(sp: SpeakerCfg, sounds: ExtraSound[] = []): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  // A ding and an alarm are always on offer; speaking needs somewhere to speak (set on the speaker).
  const alexa = sp.speech?.route !== "tts";
  const plays = (t?: { sound: string; kind: string }) => !!t?.sound && (t.kind !== "alexa" || alexa); // an Amazon sound needs an Alexa speaker
  if (plays(sp.cue)) out.push({ value: "cue", label: "A ding" });
  // your own sounds: a file plays on any speaker, an Alexa sound only on an Alexa one
  for (const x of sounds) if (x.sound && (x.kind !== "alexa" || alexa)) out.push({ value: `sound:${x.id}`, label: x.name });
  if (sp.speech?.target) {
    out.push({ value: "speech", label: t("rung.speaks") });
    // An announcement (starts with a chime) is something Alexa Media Player does.
    if (sp.speech.route === "alexa_media") out.push({ value: "speech_chime", label: t("rung.speaks_with_chime") });
  }
  if (plays(sp.alarm)) out.push({ value: "alarm", label: t("rung.alarm") });
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

  private _setGap(input: HTMLInputElement): void {
    const n = Math.round(Number(input.value));
    if (input.value.trim() === "" || Number.isNaN(n)) {
      input.value = String(this.rung?.gap ?? GAP_MIN); // blank is not a number: show the wait that is kept
      return;
    }
    const gap = Math.min(GAP_MAX, Math.max(GAP_MIN, n));
    input.value = String(gap); // show the number that is kept
    this._change((r) => (r.gap = gap));
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
            ${t("rung.wait")}
            <input
              type="number"
              min=${GAP_MIN}
              max=${GAP_MAX}
              .value=${String(r.gap)}
              aria-label=${t("ladders.minutes_before_nudge", { n })}
              @change=${(e: Event) => this._setGap(e.target as HTMLInputElement)}
            />
            ${t("rung.minutes_after_the_previous_nudge")}
          </label>`
        : nothing}
      ${none
        ? html`<p class="muted small">
            ${t("rung.set_up_a_phone_light_speaker")}
          </p>`
        : nothing}
      <div class="devs">
        ${s.phones.map(
          (p) => html`<label class="dev">
            <span>${icon("cellphone")} ${phoneName(p.service)}</span>
            <select
              aria-label=${t("rung.at_nudge", { phoneName: phoneName(p.service), n })}
              @change=${(e: Event) => this._setPhone(p.service, (e.target as HTMLSelectElement).value)}
            >
              <option value="" ?selected=${!r.phones[p.service]}>${t("rung.off")}</option>
              ${PHONE_CHOICES().map(
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
              <span>${icon("lightbulb-outline")} ${name}</span>
              <select
                aria-label=${t("rung.at_nudge_2", { name, n })}
                @change=${(e: Event) => this._setLight(light.entity_id, (e.target as HTMLSelectElement).value)}
              >
                <option value="" ?selected=${!use}>${t("rung.off")}</option>
                <option value="blink" ?selected=${use?.mode === "blink"}>${t("rung.blink")}</option>
                <option value="indicator" ?selected=${use?.mode === "indicator"}>${t("rung.status_light_stays_on_until_you")}</option>
                <option value="own" ?selected=${use?.mode === ""}>${t("rung.as_set_for_the_light")}</option>
              </select>
            </label>
            ${use && lightHasColor(this.hass, light.entity_id)
              ? html`<div class="dev colorrow">
                  <span>${t("settings.color")}</span>
                  <input
                    type="color"
                    class="swatch"
                    aria-label=${t("rung.color_at_nudge", { name, n })}
                    .value=${rgbToHex(use.color ?? light.color)}
                    @input=${(e: Event) => this._setLightColor(light.entity_id, hexToRgb((e.target as HTMLInputElement).value))}
                  />
                  <button type="button" class="chip" ?disabled=${!use.color} @click=${() => this._setLightColor(light.entity_id, null)}>
                    ${t("rung.use_the_normal_color")}
                  </button>
                </div>`
              : nothing}
          </div>`;
        })}
        ${s.speakers.map((sp) => {
          const choices = speakerChoices(sp, s.sounds);
          const current = r.speakers[sp.entity_id];
          const name = friendlyName(this.hass, sp.entity_id);
          return html`<label class="dev">
            <span>${icon("volume-high")} ${name}</span>
            <select
              aria-label=${t("rung.at_nudge_2", { name, n })}
              ?disabled=${!choices.length && !current}
              @change=${(e: Event) => this._setSpeaker(sp.entity_id, (e.target as HTMLSelectElement).value)}
            >
              <option value="" ?selected=${!current}>${choices.length ? t("rung.off") : t("rung.no_sound_set_up")}</option>
              ${choices.map((c) => html`<option value=${c.value} ?selected=${current === c.value}>${c.label}</option>`)}
              ${current && !choices.some((c) => c.value === current)
                ? html`<option value=${current} selected>${t("rung.not_available_any_more")}</option>`
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
            <span>${icon("bell-ring-outline")} ${friendlyName(this.hass, device.entity_id)}</span>
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
        font-size: 15px;
      }
      label.gap {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin: 0 0 10px;
        font-size: 16px;
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
        font-size: 16px;
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
        font-size: 15px;
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
