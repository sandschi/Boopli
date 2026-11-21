import { LitElement, html, css, nothing } from "lit";
import { errorMessage, testAlarmDevice, testSpeaker } from "./api";
import { sharedStyles } from "./styles";
import type {
  AlarmDeviceCfg,
  Hass,
  Settings,
  SoundCfg,
  SoundKind,
  SpeakerCfg,
  SpeakerLevel,
  SpeechCfg,
  SpeechRoute,
} from "./types";

const ALEXA_ALARM_SOUND = "amzn_sfx_scifi_alarm_01";
const ALEXA_DING_SOUND = "amzn_sfx_doorbell_chime_01";
const SOUND_LIBRARY_URL =
  "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html";
const ALARM_DOMAINS = ["siren", "switch", "input_boolean", "script"];

const SOUND_KINDS: { value: SoundKind; label: string }[] = [
  { value: "alexa", label: "Alexa sound" },
  { value: "file", label: "File in my media folder" },
];

const ROUTES: { value: SpeechRoute; label: string }[] = [
  { value: "alexa_media", label: "Alexa Media Player" },
  { value: "alexa_devices", label: "Alexa Devices (notify entity)" },
  { value: "tts", label: "A TTS voice on this speaker" },
];

/** Settings cards for speakers (ding, speech, alarm) and alarm devices. */
export class BoopliSpeakers extends LitElement {
  static properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    show: { type: String, reflect: true },
    _addSpeaker: { state: true },
    _addDevice: { state: true },
    _notes: { state: true },
  };

  declare hass?: Hass;
  declare settings?: Settings;
  declare show?: "all" | "speakers" | "devices";
  declare _addSpeaker: string;
  declare _addDevice: string;
  declare _notes: Record<string, string>;

  constructor() {
    super();
    this._addSpeaker = "";
    this._addDevice = "";
    this._notes = {};
  }

  // --- helpers ---------------------------------------------------------

  private _patch(patch: Partial<Settings>): void {
    this.dispatchEvent(
      new CustomEvent("settings-patch", { detail: patch, bubbles: true, composed: true })
    );
  }

  private _friendly(entityId: string): string {
    const name = this.hass?.states[entityId]?.attributes?.friendly_name;
    return typeof name === "string" && name ? name : entityId;
  }

  private _ids(domains: string[], used: string[] = []): string[] {
    return Object.keys(this.hass?.states ?? {})
      .filter((id) => domains.includes(id.split(".")[0]) && !used.includes(id))
      .sort((a, b) => this._friendly(a).localeCompare(this._friendly(b)));
  }

  private _note(key: string, text: string): void {
    this._notes = { ...this._notes, [key]: text };
  }

  private _targets(route: SpeechRoute, current: string): { value: string; label: string }[] {
    let options: { value: string; label: string }[] = [];
    if (route === "alexa_media") {
      options = Object.keys(this.hass?.services?.notify ?? {})
        .filter((s) => s.startsWith("alexa_media_") && s !== "alexa_media")
        .sort()
        .map((s) => ({ value: s, label: s.replace("alexa_media_", "") }));
    } else if (route === "alexa_devices") {
      options = Object.keys(this.hass?.states ?? {})
        .filter((id) => id.startsWith("notify.") && /_(speak|announce)$/.test(id))
        .sort()
        .map((id) => ({ value: id, label: this._friendly(id) }));
    } else {
      options = this._ids(["tts"]).map((id) => ({ value: id, label: this._friendly(id) }));
    }
    if (current && !options.some((o) => o.value === current)) {
      options.unshift({ value: current, label: `${current} (not found)` });
    }
    return options;
  }

  private _num(raw: string, min: number, max: number): number | undefined {
    const value = Math.round(Number(raw));
    if (raw.trim() === "" || Number.isNaN(value)) return undefined;
    return Math.min(max, Math.max(min, value));
  }

  // --- speakers --------------------------------------------------------

  private _speakers(): SpeakerCfg[] {
    return this.settings?.speakers ?? [];
  }

  private _updateSpeaker(entityId: string, fn: (s: SpeakerCfg) => SpeakerCfg): void {
    this._patch({
      speakers: this._speakers().map((s) => (s.entity_id === entityId ? fn(s) : s)),
    });
  }

  private _newSpeaker(entityId: string): SpeakerCfg {
    return {
      entity_id: entityId,
      cue: {
        enabled: false,
        kind: "alexa",
        sound: ALEXA_DING_SOUND,
        start_at: 1,
        seconds: 30,
        repeat_s: 5,
      },
      speech: { enabled: false, route: "alexa_media", target: "", announce: false, start_at: 2 },
      alarm: {
        enabled: false,
        kind: "alexa",
        sound: ALEXA_ALARM_SOUND,
        start_at: 4,
        seconds: 30,
        repeat_s: 5,
      },
    };
  }

  private _add(): void {
    if (!this._addSpeaker) return;
    this._patch({ speakers: [...this._speakers(), this._newSpeaker(this._addSpeaker)] });
    this._addSpeaker = "";
  }

  private _setSound(
    entityId: string,
    which: "cue" | "alarm",
    patch: Partial<SoundCfg>
  ): void {
    this._updateSpeaker(entityId, (s) => ({ ...s, [which]: { ...s[which], ...patch } }));
  }

  private _setSpeech(entityId: string, patch: Partial<SpeechCfg>): void {
    this._updateSpeaker(entityId, (s) => ({ ...s, speech: { ...s.speech, ...patch } }));
  }

  private async _test(speaker: SpeakerCfg, level: SpeakerLevel): Promise<void> {
    if (!this.hass) return;
    const key = `speaker:${speaker.entity_id}:${level}`;
    this._note(key, "Sending…");
    try {
      this._note(key, (await testSpeaker(this.hass, speaker, level)).note);
    } catch (err) {
      this._note(key, errorMessage(err));
    }
  }

  private _startAt(value: number, onChange: (n: number) => void, label = "Starts at nudge #") {
    return html`
      <label class="num">
        ${label}
        <input
          type="number"
          min="1"
          max="20"
          .value=${String(value)}
          @change=${(e: Event) => {
            const n = this._num((e.target as HTMLInputElement).value, 1, 20);
            if (n !== undefined) onChange(n);
          }}
        />
      </label>
    `;
  }

  private _soundRow(speaker: SpeakerCfg, which: "cue" | "alarm") {
    const cfg = speaker[which];
    const id = speaker.entity_id;
    const key = `speaker:${id}:${which}`;
    const alarm = which === "alarm";
    const title = alarm ? "Alarm sound (loud, repeats)" : "Ding (a small sound)";
    return html`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${cfg.enabled}
            @change=${(e: Event) =>
              this._setSound(id, which, { enabled: (e.target as HTMLInputElement).checked })}
          />
          ${title}
        </label>
        ${cfg.enabled
          ? html`
              <div class="fields">
                <label class="num wide">
                  Sound type
                  <select
                    .value=${cfg.kind}
                    @change=${(e: Event) =>
                      this._setSound(id, which, { kind: (e.target as HTMLSelectElement).value as SoundKind })}
                  >
                    ${SOUND_KINDS.map(
                      (k) => html`<option value=${k.value} ?selected=${k.value === cfg.kind}>${k.label}</option>`
                    )}
                  </select>
                </label>
                <label class="num wide">
                  ${cfg.kind === "alexa" ? "Alexa sound id" : "File (for example boopli/ding.mp3)"}
                  <input
                    type="text"
                    .value=${cfg.sound}
                    placeholder=${cfg.kind === "alexa" ? "amzn_sfx_…" : "boopli/ding.mp3"}
                    @change=${(e: Event) =>
                      this._setSound(id, which, { sound: (e.target as HTMLInputElement).value.trim() })}
                  />
                </label>
                ${cfg.kind === "alexa"
                  ? html`<div class="muted small libhint">
                      Pick a sound from the
                      <a href=${SOUND_LIBRARY_URL} target="_blank" rel="noopener noreferrer">Alexa sound library</a>.
                      The id is <code>amzn_sfx_</code> + the sound's name in lower case with underscores
                      + a two-digit number, for example "Doorbell Chime (1)" is
                      <code>amzn_sfx_doorbell_chime_01</code>. Press Test to hear it. Some ids stay silent.
                    </div>`
                  : nothing}
                ${this._startAt(cfg.start_at, (n) => this._setSound(id, which, { start_at: n }))}
                ${alarm
                  ? html`
                      <label class="num">
                        Rings for (seconds)
                        <input
                          type="number"
                          min="3"
                          max="600"
                          .value=${String(cfg.seconds)}
                          @change=${(e: Event) => {
                            const n = this._num((e.target as HTMLInputElement).value, 3, 600);
                            if (n !== undefined) this._setSound(id, which, { seconds: n });
                          }}
                        />
                      </label>
                      <label class="num">
                        Repeat every (seconds, 0 = once)
                        <input
                          type="number"
                          min="0"
                          max="60"
                          .value=${String(cfg.repeat_s)}
                          @change=${(e: Event) => {
                            const n = this._num((e.target as HTMLInputElement).value, 0, 60);
                            if (n !== undefined) this._setSound(id, which, { repeat_s: n });
                          }}
                        />
                      </label>
                    `
                  : nothing}
                <button @click=${() => this._test(speaker, which)}>Test</button>
              </div>
            `
          : nothing}
        ${this._notes[key] ? html`<div class="note muted small">${this._notes[key]}</div>` : nothing}
      </div>
    `;
  }

  private _speechRow(speaker: SpeakerCfg) {
    const cfg = speaker.speech;
    const id = speaker.entity_id;
    const key = `speaker:${id}:speech`;
    const targets = this._targets(cfg.route, cfg.target);
    return html`
      <div class="level">
        <label class="inline">
          <input
            type="checkbox"
            .checked=${cfg.enabled}
            @change=${(e: Event) =>
              this._setSpeech(id, { enabled: (e.target as HTMLInputElement).checked })}
          />
          Speak a sentence
        </label>
        ${cfg.enabled
          ? html`
              <div class="fields">
                <label class="num wide">
                  How
                  <select
                    .value=${cfg.route}
                    @change=${(e: Event) =>
                      this._setSpeech(id, {
                        route: (e.target as HTMLSelectElement).value as SpeechRoute,
                        target: "",
                      })}
                  >
                    ${ROUTES.map(
                      (r) => html`<option value=${r.value} ?selected=${r.value === cfg.route}>${r.label}</option>`
                    )}
                  </select>
                </label>
                <label class="num wide">
                  ${cfg.route === "tts" ? "Voice" : "Alexa device"}
                  <select
                    .value=${cfg.target}
                    @change=${(e: Event) =>
                      this._setSpeech(id, { target: (e.target as HTMLSelectElement).value })}
                  >
                    <option value="" ?selected=${cfg.target === ""}>Choose…</option>
                    ${targets.map(
                      (t) => html`<option value=${t.value} ?selected=${t.value === cfg.target}>${t.label}</option>`
                    )}
                  </select>
                </label>
                ${cfg.route === "alexa_media"
                  ? html`
                      <label class="inline small">
                        <input
                          type="checkbox"
                          .checked=${cfg.announce}
                          @change=${(e: Event) =>
                            this._setSpeech(id, { announce: (e.target as HTMLInputElement).checked })}
                        />
                        Announce (with chime). Some Alexas stay silent, so test it.
                      </label>
                    `
                  : nothing}
                ${this._startAt(cfg.start_at, (n) => this._setSpeech(id, { start_at: n }))}
                <button @click=${() => this._test(speaker, "speech")}>Test</button>
              </div>
            `
          : nothing}
        ${this._notes[key] ? html`<div class="note muted small">${this._notes[key]}</div>` : nothing}
      </div>
    `;
  }

  private _renderSpeakers(d: Settings) {
    const used = d.speakers.map((s) => s.entity_id);
    const choices = this._ids(["media_player"], used);
    return html`
      <section class="card">
        <h2>🔊 Speakers</h2>
        <p class="muted small">
          Each speaker can play a small ding, speak a sentence, and sound an
          alarm. A speaker plays the highest level that has been reached. Press
          Test on each one to hear it.
        </p>
        ${d.speakers.map(
          (speaker) => html`
            <div class="speaker">
              <div class="row">
                <div class="grow"><strong>${this._friendly(speaker.entity_id)}</strong></div>
                <button
                  aria-label="Remove speaker"
                  @click=${() =>
                    this._patch({ speakers: d.speakers.filter((s) => s.entity_id !== speaker.entity_id) })}
                >
                  ✕
                </button>
              </div>
              ${this._soundRow(speaker, "cue")} ${this._speechRow(speaker)}
              ${this._soundRow(speaker, "alarm")}
            </div>
          `
        )}
        <div class="row add">
          <select
            aria-label="Add a speaker"
            .value=${this._addSpeaker}
            @change=${(e: Event) => (this._addSpeaker = (e.target as HTMLSelectElement).value)}
          >
            <option value="">Add a speaker…</option>
            ${choices.map(
              (id) => html`<option value=${id} ?selected=${id === this._addSpeaker}>${this._friendly(id)}</option>`
            )}
          </select>
          <button ?disabled=${!this._addSpeaker} @click=${() => this._add()}>Add</button>
        </div>
        <div class="field">
          <label for="sentence">What the speakers say</label>
          <input
            id="sentence"
            type="text"
            .value=${d.speech_template}
            @change=${(e: Event) =>
              this._patch({ speech_template: (e.target as HTMLInputElement).value.trim() })}
          />
          <div class="muted small">
            Use {chore} for the chore name and {step} for the step. Example: "{chore}: {step}".
          </div>
        </div>
      </section>
    `;
  }

  // --- alarm devices ---------------------------------------------------

  private _updateDevice(entityId: string, patch: Partial<AlarmDeviceCfg>): void {
    this._patch({
      alarm_devices: (this.settings?.alarm_devices ?? []).map((a) =>
        a.entity_id === entityId ? { ...a, ...patch } : a
      ),
    });
  }

  private async _testDevice(device: AlarmDeviceCfg): Promise<void> {
    if (!this.hass) return;
    const key = `device:${device.entity_id}`;
    this._note(key, "Sending…");
    try {
      this._note(key, (await testAlarmDevice(this.hass, device)).note);
    } catch (err) {
      this._note(key, errorMessage(err));
    }
  }

  private _renderDevices(d: Settings) {
    const used = d.alarm_devices.map((a) => a.entity_id);
    const choices = this._ids(ALARM_DOMAINS, used);
    return html`
      <section class="card">
        <h2>🚨 Alarm devices</h2>
        <p class="muted small">
          A siren, switch or script that sounds the alarm. Boopli switches it on
          for the time you set and then off again, and off when you answer or
          when Home Assistant restarts.
        </p>
        ${d.alarm_devices.map((device) => {
          const key = `device:${device.entity_id}`;
          return html`
            <div class="row">
              <div class="grow">${this._friendly(device.entity_id)}</div>
              ${this._startAt(device.start_at, (n) => this._updateDevice(device.entity_id, { start_at: n }))}
              <label class="num">
                On for (seconds)
                <input
                  type="number"
                  min="3"
                  max="600"
                  .value=${String(device.seconds)}
                  @change=${(e: Event) => {
                    const n = this._num((e.target as HTMLInputElement).value, 3, 600);
                    if (n !== undefined) this._updateDevice(device.entity_id, { seconds: n });
                  }}
                />
              </label>
              <button @click=${() => this._testDevice(device)}>Test</button>
              <button
                aria-label="Remove alarm device"
                @click=${() =>
                  this._patch({ alarm_devices: d.alarm_devices.filter((a) => a.entity_id !== device.entity_id) })}
              >
                ✕
              </button>
            </div>
            ${this._notes[key] ? html`<div class="note muted small">${this._notes[key]}</div>` : nothing}
          `;
        })}
        <div class="row add">
          <select
            aria-label="Add an alarm device"
            .value=${this._addDevice}
            @change=${(e: Event) => (this._addDevice = (e.target as HTMLSelectElement).value)}
          >
            <option value="">Add a siren, switch or script…</option>
            ${choices.map(
              (id) => html`<option value=${id} ?selected=${id === this._addDevice}>${this._friendly(id)}</option>`
            )}
          </select>
          <button
            ?disabled=${!this._addDevice}
            @click=${() => {
              this._patch({
                alarm_devices: [
                  ...d.alarm_devices,
                  { entity_id: this._addDevice, seconds: 30, start_at: 4 },
                ],
              });
              this._addDevice = "";
            }}
          >
            Add
          </button>
        </div>
      </section>
    `;
  }

  render() {
    const d = this.settings;
    if (!d) return nothing;
    // `show` lets the Settings screen place the two cards in different columns.
    const part = this.show || "all";
    return html`${part !== "devices" ? this._renderSpeakers(d) : nothing}
    ${part !== "speakers" ? this._renderDevices(d) : nothing}`;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      section.card {
        margin: 0 0 16px;
      }
      :host([show]) section.card {
        margin: 0;
      }
      h2 {
        font-size: 18px;
        margin-bottom: 6px;
      }
      .small {
        font-size: 13px;
      }
      .speaker {
        border-top: 1px solid var(--divider-color);
        padding: 10px 0 4px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 6px 0;
      }
      .row.add {
        border-top: 1px solid var(--divider-color);
      }
      .row select {
        flex: 1 1 200px;
        width: auto;
      }
      .grow {
        flex: 1 1 160px;
      }
      .level {
        padding: 6px 0;
      }
      .fields {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: flex-end;
        padding: 6px 0 4px 28px;
      }
      label.num {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
        margin: 0;
        width: 150px;
      }
      label.num.wide {
        width: 220px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .note {
        padding: 2px 0 6px 28px;
      }
      .libhint {
        flex: 1 1 100%;
      }
      .libhint a {
        color: var(--primary-color);
      }
      code {
        font-size: 12px;
      }
      .field {
        margin: 14px 0 4px;
      }
    `,
  ];
}

customElements.define("boopli-speakers", BoopliSpeakers);
