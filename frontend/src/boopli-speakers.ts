import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { errorMessage, testAlarmDevice, testSpeaker } from "./api";
import { newLadderId } from "./helpers";
import { icon } from "./icon";
import { sharedStyles } from "./styles";
import type {
  AlarmDeviceCfg,
  ExtraSound,
  Hass,
  Settings,
  SoundCfg,
  SoundKind,
  SpeakerCfg,
  SpeakerChoice,
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

/** What one line of a speaker (a ding, a sentence, an alarm, one of your own sounds) needs to be drawn. */
interface Line {
  key: string; // identifies it for "Details" and for the test note
  title: string;
  enabled?: boolean; // undefined: always on (your own sounds have no switch)
  onToggle?: (on: boolean) => void;
  summary: string;
  from?: number; // "From nudge"
  onFrom?: (n: number) => void;
  onTest: () => void;
  details: TemplateResult;
  nameInput?: TemplateResult; // your own sounds are named right on the line
  onRemove?: () => void;
  removeLabel?: string;
}

/** The speakers and the alarm devices of Settings. Each speaker is a few short lines; the technical parts fold open. */
export class BoopliSpeakers extends LitElement {
  static properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    show: { type: String, reflect: true },
    _addSpeaker: { state: true },
    _addDevice: { state: true },
    _notes: { state: true },
    _open: { state: true },
  };

  declare hass?: Hass;
  declare settings?: Settings;
  declare show?: "all" | "speakers" | "devices";
  declare _addSpeaker: string;
  declare _addDevice: string;
  declare _notes: Record<string, string>;
  declare _open: Record<string, boolean>; // the lines whose details are showing

  constructor() {
    super();
    this._addSpeaker = "";
    this._addDevice = "";
    this._notes = {};
    this._open = {};
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

  private _toggle(key: string): void {
    this._open = { ...this._open, [key]: !this._open[key] };
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

  // --- the data of a speaker --------------------------------------------

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

  private _setSound(entityId: string, which: "cue" | "alarm", patch: Partial<SoundCfg>): void {
    this._updateSpeaker(entityId, (s) => ({ ...s, [which]: { ...s[which], ...patch } }));
  }

  private _setSpeech(entityId: string, patch: Partial<SpeechCfg>): void {
    this._updateSpeaker(entityId, (s) => ({ ...s, speech: { ...s.speech, ...patch } }));
  }

  private async _test(speaker: SpeakerCfg, level: SpeakerChoice): Promise<void> {
    if (!this.hass) return;
    const key = `speaker:${speaker.entity_id}:${level}`;
    this._note(key, "Sending…");
    try {
      this._note(key, (await testSpeaker(this.hass, speaker, level)).note);
    } catch (err) {
      this._note(key, errorMessage(err));
    }
  }

  // --- your own sounds (for ladders) ---

  private _setExtra(entityId: string, soundId: string, patch: Partial<ExtraSound>): void {
    this._updateSpeaker(entityId, (s) => ({
      ...s,
      sounds: (s.sounds ?? []).map((x) => (x.id === soundId ? { ...x, ...patch } : x)),
    }));
  }

  private _addExtra(entityId: string): void {
    this._updateSpeaker(entityId, (s) => {
      const taken = new Set((s.sounds ?? []).map((x) => x.name.toLowerCase()));
      let n = (s.sounds ?? []).length + 1;
      while (taken.has(`sound ${n}`)) n++;
      return { ...s, sounds: [...(s.sounds ?? []), { id: newLadderId(), name: `Sound ${n}`, kind: "alexa", sound: "" }] };
    });
  }

  private _removeExtra(entityId: string, soundId: string): void {
    this._updateSpeaker(entityId, (s) => ({ ...s, sounds: (s.sounds ?? []).filter((x) => x.id !== soundId) }));
  }

  // --- drawing -----------------------------------------------------------

  /** What a sound says about itself in one short line. */
  private _soundSummary(kind: SoundKind, sound: string): string {
    if (!sound) return "No sound chosen yet";
    return kind === "alexa" ? `Alexa sound: ${sound.replace(/^amzn_sfx_/, "")}` : `File: ${sound}`;
  }

  /** The two fields that choose a sound: its type and its id (or file). */
  private _soundFields(kind: SoundKind, sound: string, example: string, onKind: (k: SoundKind) => void, onSound: (s: string) => void) {
    return html`
      <label class="num wide">
        Sound type
        <select .value=${kind} @change=${(e: Event) => onKind((e.target as HTMLSelectElement).value as SoundKind)}>
          ${SOUND_KINDS.map((k) => html`<option value=${k.value} ?selected=${k.value === kind}>${k.label}</option>`)}
        </select>
      </label>
      <label class="num wide">
        ${kind === "alexa" ? "Alexa sound id" : `File (for example boopli/${example}.mp3)`}
        <input
          type="text"
          .value=${sound}
          placeholder=${kind === "alexa" ? "amzn_sfx_…" : `boopli/${example}.mp3`}
          @change=${(e: Event) => onSound((e.target as HTMLInputElement).value.trim())}
        />
      </label>
      ${kind === "alexa"
        ? html`<div class="muted small libhint">
            Pick an id from the <a href=${SOUND_LIBRARY_URL} target="_blank" rel="noopener noreferrer">Alexa sound library</a>,
            for example <code>amzn_sfx_doorbell_chime_01</code>. Press Test to hear it. Some ids stay silent.
          </div>`
        : nothing}
    `;
  }

  /** One short line: a switch (or a name), what it is, From nudge, Test and Details. The details fold open under it. */
  private _line(l: Line) {
    const on = l.enabled !== false;
    const open = !!this._open[l.key] && on;
    return html`
      <div class="line ${on ? "" : "off"}">
        <div class="lmain">
          ${l.onToggle
            ? html`<label class="switch">
                <input type="checkbox" .checked=${!!l.enabled} @change=${(e: Event) => l.onToggle!((e.target as HTMLInputElement).checked)} />
                <span class="ltitle">${l.title}</span>
              </label>`
            : html`<span class="ltitle">${l.nameInput ?? l.title}</span>`}
          <span class="lsum muted">${on ? l.summary : "Off"}</span>
          ${on
            ? html`<span class="lacts">
                ${l.from !== undefined && l.onFrom
                  ? html`<label class="from">
                      From nudge
                      <input
                        type="number"
                        min="1"
                        max="20"
                        .value=${String(l.from)}
                        @change=${(e: Event) => {
                          const n = this._num((e.target as HTMLInputElement).value, 1, 20);
                          if (n !== undefined) l.onFrom!(n);
                        }}
                      />
                    </label>`
                  : nothing}
                <button type="button" class="textlink" @click=${() => l.onTest()}>Test</button>
                <button type="button" class="textlink quiet" aria-expanded=${open ? "true" : "false"} @click=${() => this._toggle(l.key)}>
                  Details
                </button>
                ${l.onRemove
                  ? html`<button type="button" class="textlink quiet" aria-label=${l.removeLabel ?? "Remove"} @click=${() => l.onRemove!()}>Remove</button>`
                  : nothing}
              </span>`
            : nothing}
        </div>
        ${open ? html`<div class="fields">${l.details}</div>` : nothing}
        ${this._notes[l.key] ? html`<div class="note muted small">${this._notes[l.key]}</div>` : nothing}
      </div>
    `;
  }

  private _numField(label: string, value: number, min: number, max: number, onChange: (n: number) => void) {
    return html`<label class="num">
      ${label}
      <input
        type="number"
        min=${min}
        max=${max}
        .value=${String(value)}
        @change=${(e: Event) => {
          const n = this._num((e.target as HTMLInputElement).value, min, max);
          if (n !== undefined) onChange(n);
        }}
      />
    </label>`;
  }

  private _soundLine(speaker: SpeakerCfg, which: "cue" | "alarm") {
    const cfg = speaker[which];
    const id = speaker.entity_id;
    const alarm = which === "alarm";
    const key = `speaker:${id}:${which}`;
    return this._line({
      key,
      title: alarm ? "Alarm sound" : "Ding",
      enabled: cfg.enabled,
      onToggle: (on) => this._setSound(id, which, { enabled: on }),
      summary: alarm ? `${this._soundSummary(cfg.kind, cfg.sound)} · loud, rings ${cfg.seconds} s` : `${this._soundSummary(cfg.kind, cfg.sound)} · a small sound`,
      from: cfg.start_at,
      onFrom: (n) => this._setSound(id, which, { start_at: n }),
      onTest: () => void this._test(speaker, which),
      details: html`
        ${this._soundFields(cfg.kind, cfg.sound, alarm ? "alarm" : "ding", (k) => this._setSound(id, which, { kind: k }), (s) => this._setSound(id, which, { sound: s }))}
        ${alarm
          ? html`${this._numField("Rings for (seconds)", cfg.seconds, 3, 600, (n) => this._setSound(id, which, { seconds: n }))}
            ${this._numField("Repeat every (seconds, 0 = once)", cfg.repeat_s, 0, 60, (n) => this._setSound(id, which, { repeat_s: n }))}`
          : nothing}
      `,
    });
  }

  private _speechLine(speaker: SpeakerCfg) {
    const cfg = speaker.speech;
    const id = speaker.entity_id;
    const targets = this._targets(cfg.route, cfg.target);
    const route = ROUTES.find((r) => r.value === cfg.route)?.label ?? cfg.route;
    const target = targets.find((t) => t.value === cfg.target)?.label;
    return this._line({
      key: `speaker:${id}:speech`,
      title: "Speak a sentence",
      enabled: cfg.enabled,
      onToggle: (on) => this._setSpeech(id, { enabled: on }),
      summary: `${route} · ${target ?? "no device chosen yet"}`,
      from: cfg.start_at,
      onFrom: (n) => this._setSpeech(id, { start_at: n }),
      onTest: () => void this._test(speaker, "speech"),
      details: html`
        <label class="num wide">
          How
          <select
            .value=${cfg.route}
            @change=${(e: Event) => this._setSpeech(id, { route: (e.target as HTMLSelectElement).value as SpeechRoute, target: "" })}
          >
            ${ROUTES.map((r) => html`<option value=${r.value} ?selected=${r.value === cfg.route}>${r.label}</option>`)}
          </select>
        </label>
        <label class="num wide">
          ${cfg.route === "tts" ? "Voice" : "Alexa device"}
          <select .value=${cfg.target} @change=${(e: Event) => this._setSpeech(id, { target: (e.target as HTMLSelectElement).value })}>
            <option value="" ?selected=${cfg.target === ""}>Choose…</option>
            ${targets.map((t) => html`<option value=${t.value} ?selected=${t.value === cfg.target}>${t.label}</option>`)}
          </select>
        </label>
        ${cfg.route === "alexa_media"
          ? html`<label class="inline small libhint">
              <input type="checkbox" .checked=${cfg.announce} @change=${(e: Event) => this._setSpeech(id, { announce: (e.target as HTMLInputElement).checked })} />
              Announce (with chime). Some Alexas stay silent, so test it.
            </label>`
          : nothing}
      `,
    });
  }

  private _ownSounds(speaker: SpeakerCfg) {
    const id = speaker.entity_id;
    const sounds = speaker.sounds ?? [];
    return html`
      <div class="own">
        <h4>Your own sounds</h4>
        <p class="muted small">For your own ladders (Nudge it your way). Give each a name.</p>
        ${sounds.map((x) =>
          this._line({
            key: `speaker:${id}:sound:${x.id}`,
            title: x.name,
            nameInput: html`<input
              class="soundname"
              type="text"
              maxlength="30"
              aria-label="Name of the sound"
              .value=${x.name}
              @change=${(e: Event) => this._setExtra(id, x.id, { name: (e.target as HTMLInputElement).value.trim() })}
            />`,
            summary: this._soundSummary(x.kind, x.sound),
            onTest: () => void this._test(speaker, `sound:${x.id}`),
            details: this._soundFields(x.kind, x.sound, "fanfare", (k) => this._setExtra(id, x.id, { kind: k }), (s) => this._setExtra(id, x.id, { sound: s })),
            onRemove: () => this._removeExtra(id, x.id),
            removeLabel: `Remove the sound ${x.name}`,
          })
        )}
        <button type="button" class="textlink" ?disabled=${sounds.length >= 30} @click=${() => this._addExtra(id)}>
          ${icon("plus")} Add a sound
        </button>
      </div>
    `;
  }

  private _renderSpeakers(d: Settings) {
    const used = d.speakers.map((s) => s.entity_id);
    const choices = this._ids(["media_player"], used);
    return html`
      <section class="card">
        <h2>${icon("volume-high")} Speakers</h2>
        <p class="muted small">
          Each speaker can play a ding, speak a sentence and sound an alarm. Press Test to hear one.
          <b>From nudge</b> says when it starts in the built-in styles, which play the highest level reached.
          Your own ladders choose per nudge, so it does not apply there.
        </p>
        ${d.speakers.map(
          (speaker) => html`
            <div class="speaker">
              <div class="shead">
                <h3>${this._friendly(speaker.entity_id)}</h3>
                <button
                  type="button"
                  class="textlink quiet"
                  aria-label="Remove speaker ${this._friendly(speaker.entity_id)}"
                  @click=${() => this._patch({ speakers: d.speakers.filter((s) => s.entity_id !== speaker.entity_id) })}
                >
                  Remove speaker
                </button>
              </div>
              ${this._soundLine(speaker, "cue")} ${this._speechLine(speaker)} ${this._soundLine(speaker, "alarm")}
              ${this._ownSounds(speaker)}
            </div>
          `
        )}
        <h3 class="sec">Add a speaker</h3>
        <div class="row">
          <select
            aria-label="Add a speaker"
            .value=${this._addSpeaker}
            @change=${(e: Event) => (this._addSpeaker = (e.target as HTMLSelectElement).value)}
          >
            <option value="">Choose a media player…</option>
            ${choices.map((id) => html`<option value=${id} ?selected=${id === this._addSpeaker}>${this._friendly(id)}</option>`)}
          </select>
          <button type="button" ?disabled=${!this._addSpeaker} @click=${() => this._add()}>Add</button>
        </div>
        <h3 class="sec">What the speakers say</h3>
        <input
          id="sentence"
          type="text"
          aria-label="What the speakers say"
          .value=${d.speech_template}
          @change=${(e: Event) => this._patch({ speech_template: (e.target as HTMLInputElement).value.trim() })}
        />
        <div class="muted small hintline">Use {chore} for the chore name and {step} for the step. Example: "{chore}: {step}".</div>
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
        <h2>${icon("bell-ring-outline")} Alarm devices</h2>
        <p class="muted small">
          A siren, switch or script that sounds the alarm. Boopli switches it on for the time you set, then off again,
          and also off when you answer or when Home Assistant restarts.
        </p>
        ${d.alarm_devices.map((device) =>
          this._line({
            key: `device:${device.entity_id}`,
            title: this._friendly(device.entity_id),
            summary: `On for ${device.seconds} s`,
            from: device.start_at,
            onFrom: (n) => this._updateDevice(device.entity_id, { start_at: n }),
            onTest: () => void this._testDevice(device),
            details: this._numField("On for (seconds)", device.seconds, 3, 600, (n) => this._updateDevice(device.entity_id, { seconds: n })),
            onRemove: () => this._patch({ alarm_devices: d.alarm_devices.filter((a) => a.entity_id !== device.entity_id) }),
            removeLabel: `Remove alarm device ${this._friendly(device.entity_id)}`,
          })
        )}
        <h3 class="sec">Add an alarm device</h3>
        <div class="row">
          <select
            aria-label="Add an alarm device"
            .value=${this._addDevice}
            @change=${(e: Event) => (this._addDevice = (e.target as HTMLSelectElement).value)}
          >
            <option value="">Choose a siren, switch or script…</option>
            ${choices.map((id) => html`<option value=${id} ?selected=${id === this._addDevice}>${this._friendly(id)}</option>`)}
          </select>
          <button
            type="button"
            ?disabled=${!this._addDevice}
            @click=${() => {
              this._patch({ alarm_devices: [...d.alarm_devices, { entity_id: this._addDevice, seconds: 30, start_at: 4 }] });
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
      :host([plain]) section.card {
        border: 0;
        box-shadow: none;
        background: none;
        padding: 0;
        margin: 0;
      }
      :host([plain]) h2 {
        display: none;
      }
      h2 {
        font-size: 24px;
        margin-bottom: 6px;
      }
      .small {
        font-size: 16px;
      }
      p.small {
        margin: 0 0 12px;
        line-height: 1.4;
      }
      /* One speaker: its name, three short lines, and its own sounds. */
      .speaker {
        border-top: 2px solid var(--divider-color);
        padding: 12px 0 8px;
        margin-bottom: 8px;
      }
      .shead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      h3 {
        font-size: 21px;
        margin: 0;
      }
      h3.sec {
        margin: 22px 0 8px;
        padding-top: 12px;
        border-top: 2px solid var(--divider-color);
      }
      h4 {
        font-size: 18px;
        font-weight: 400;
        margin: 14px 0 2px;
      }
      .line {
        padding: 8px 0;
        border-top: 1px solid var(--divider-color);
      }
      .line.off .ltitle {
        color: var(--secondary-text-color);
      }
      .lmain {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 14px;
      }
      label.switch {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0;
        color: var(--primary-text-color);
        min-width: 190px;
      }
      label.switch input {
        width: 20px;
        min-height: 20px;
        height: 20px;
      }
      .ltitle {
        font-size: 18px;
        min-width: 190px;
      }
      .lmain > .ltitle {
        min-width: 190px;
      }
      .lsum {
        flex: 1 1 120px;
        font-size: 16px;
        overflow-wrap: anywhere;
      }
      .lacts {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px 14px;
        margin-left: auto;
      }
      label.from {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 16px;
      }
      label.from input {
        width: 64px;
        min-height: 36px;
        padding: 4px 8px;
      }
      input.soundname {
        width: 190px;
      }
      .fields {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: flex-end;
        padding: 10px 0 4px 30px;
      }
      label.num {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 16px;
        margin: 0;
        width: 170px;
      }
      label.num.wide {
        width: 240px;
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
        padding: 2px 0 4px 30px;
      }
      .libhint {
        flex: 1 1 100%;
      }
      .libhint a {
        color: var(--boopli-accent, var(--primary-color));
      }
      code {
        font-size: 15px;
      }
      .own {
        margin-top: 10px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .row select {
        flex: 1 1 220px;
        width: auto;
      }
      .hintline {
        margin-top: 6px;
      }
      /* A phone: the parts of a line stack. */
      @media (max-width: 600px) {
        .lacts {
          margin-left: 0;
        }
        label.switch,
        .ltitle,
        .lmain > .ltitle {
          min-width: 0;
          flex: 1 1 100%;
        }
        .fields {
          padding-left: 0;
        }
        label.num,
        label.num.wide {
          width: 100%;
        }
        .note {
          padding-left: 0;
        }
        input.soundname {
          width: 100%;
        }
      }
    `,
  ];
}

customElements.define("boopli-speakers", BoopliSpeakers);
