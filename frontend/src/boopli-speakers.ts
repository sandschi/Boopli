import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import { errorMessage, testAlarmDevice, testSpeaker } from "./api";
import { newLadderId } from "./helpers";
import { icon } from "./icon";
import { sharedStyles } from "./styles";
import { t } from "./i18n";
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
    _sub: { state: true },
  };

  declare hass?: Hass;
  declare settings?: Settings;
  declare show?: "all" | "speakers" | "devices";
  declare _addSpeaker: string;
  declare _addDevice: string;
  declare _notes: Record<string, string>;
  declare _open: Record<string, boolean>; // the lines whose details are showing
  declare _sub: "" | "add" | "tone" | "own" | "say"; // which small window is open

  constructor() {
    super();
    this._addSpeaker = "";
    this._addDevice = "";
    this._notes = {};
    this._open = {};
    this._sub = "";
  }

  protected updated(): void {
    const d = this.renderRoot.querySelector<HTMLDialogElement>("dialog.sub");
    if (d && !d.open) d.showModal();
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

  /** Alexa speakers play Alexa sounds (or files); other media players can only play files. */
  private _group(s: SpeakerCfg): "alexa" | "other" {
    return s.speech.route === "tts" ? "other" : "alexa";
  }

  /** The ding and the alarm sound of a kind of speaker: the ones its speakers already have, or the first ones. */
  private _soundsFor(group: "alexa" | "other"): { cue: SoundCfg; alarm: SoundCfg } {
    const have = this._speakers().find((s) => this._group(s) === group);
    if (have) return { cue: { ...structuredClone(have.cue), enabled: true }, alarm: { ...structuredClone(have.alarm), enabled: true } };
    const alexa = group === "alexa";
    return {
      cue: { enabled: true, kind: alexa ? "alexa" : "file", sound: alexa ? ALEXA_DING_SOUND : "", start_at: 1, seconds: 30, repeat_s: 5 },
      alarm: { enabled: true, kind: alexa ? "alexa" : "file", sound: alexa ? ALEXA_ALARM_SOUND : "", start_at: 4, seconds: 30, repeat_s: 5 },
    };
  }

  private _newSpeaker(entityId: string): SpeakerCfg {
    return {
      entity_id: entityId,
      ...this._soundsFor("alexa"),
      speech: { enabled: false, route: "alexa_media", target: "", announce: false, start_at: 2 },
    };
  }

  private _setRoute(entityId: string, route: SpeechRoute): void {
    this._updateSpeaker(entityId, (s) => {
      const next: SpeakerCfg = { ...s, speech: { ...s.speech, route, target: "", enabled: false } };
      if (this._group(s) !== this._group(next)) Object.assign(next, this._soundsFor(this._group(next)));
      return next;
    });
  }

  private _add(): void {
    if (!this._addSpeaker) return;
    this._patch({ speakers: [...this._speakers(), this._newSpeaker(this._addSpeaker)] });
    this._addSpeaker = "";
    this._sub = "";
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

  /** Your own sounds are one list for all speakers (in the settings, not on a speaker). */
  private _sounds(): ExtraSound[] {
    return this.settings?.sounds ?? [];
  }

  private _setExtra(soundId: string, patch: Partial<ExtraSound>): void {
    this._patch({ sounds: this._sounds().map((x) => (x.id === soundId ? { ...x, ...patch } : x)) });
  }

  private _addExtra(): void {
    const taken = new Set(this._sounds().map((x) => x.name.toLowerCase()));
    let n = this._sounds().length + 1;
    while (taken.has(`sound ${n}`)) n++;
    this._patch({ sounds: [...this._sounds(), { id: newLadderId(), name: `Sound ${n}`, kind: "alexa", sound: "" }] });
  }

  private _removeExtra(soundId: string): void {
    this._patch({ sounds: this._sounds().filter((x) => x.id !== soundId) });
  }

  /** Test one of your sounds on the first speaker that can play it. */
  private async _testExtra(sound: ExtraSound): Promise<void> {
    const key = `own:${sound.id}`;
    const fits = this._speakers().filter((s) => sound.kind !== "alexa" || s.speech.route !== "tts");
    // the first speaker that can play it and is there right now
    const here = (s: SpeakerCfg) => {
      const state = this.hass?.states[s.entity_id]?.state; // no state at all: it is gone from Home Assistant
      return state !== undefined && state !== "unavailable";
    };
    const speaker = fits.find(here) ?? fits[0];
    if (!speaker) {
      this._note(key, "Add a speaker that can play it first.");
      return;
    }
    if (!this.hass) return;
    this._note(key, "Sending…");
    try {
      this._note(key, (await testSpeaker(this.hass, speaker, `sound:${sound.id}`, this._sounds())).note);
    } catch (err) {
      this._note(key, errorMessage(err));
    }
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
            Pick an id from the <a href=${SOUND_LIBRARY_URL} target="_blank" rel="noopener noreferrer">${t("speakers.alexa_sound_library")}</a>,
            for example <code>amzn_sfx_doorbell_chime_01</code>. Use a Test button to hear it. Some ids stay silent.
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
                <button type="button" class="test" @click=${() => l.onTest()}>${t("common.test")}</button>
                <button type="button" class="textlink quiet" aria-expanded=${open ? "true" : "false"} @click=${() => this._toggle(l.key)}>
                  ${t("speakers.details")}
                </button>
                ${l.onRemove
                  ? html`<button type="button" class="textlink quiet" aria-label=${l.removeLabel ?? "Remove"} @click=${() => l.onRemove!()}>${t("common.remove")}</button>`
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

  /** One speaker: a short line, test links, and what kind it is (folded) . What it plays when is set in the ladders. */
  private _speakerBody(speaker: SpeakerCfg) {
    const cfg = speaker.speech;
    const id = speaker.entity_id;
    const alexa = cfg.route !== "tts";
    const targets = this._targets(cfg.route, cfg.target);
    const kind = ROUTES.find((r) => r.value === cfg.route)?.label ?? cfg.route;
    const where = targets.find((x) => x.value === cfg.target)?.label ?? "no device chosen yet";
    const open = !!this._open["spk:" + id];
    const tests: { level: SpeakerChoice; label: string }[] = [
      ...(cfg.route === "alexa_media" ? [{ level: "speech_chime" as SpeakerChoice, label: "Test announcement" }] : []),
      { level: "speech", label: "Test talk" },
      { level: "cue", label: "Test ding" },
      { level: "alarm", label: "Test alarm" },
    ];
    return html`
      <div class="speaker">
        <div class="shead">
          <h3>${this._friendly(id)}</h3>
          <span class="lsum muted">${kind} · ${where}</span>
        </div>
        <div class="tests">
          ${tests.map((x) => html`<button type="button" class="test" @click=${() => void this._test(speaker, x.level)}>${x.label}</button>`)}
          <button type="button" class="textlink quiet" aria-expanded=${open ? "true" : "false"} @click=${() => this._toggle("spk:" + id)}>${t("speakers.details")}</button>
        </div>
        ${tests.map((x) => {
          const note = this._notes[`speaker:${id}:${x.level}`];
          return note ? html`<div class="note muted small">${x.label}: ${note}</div>` : nothing;
        })}
        ${open
          ? html`<div class="fields">
                <label class="num wide">
                  What kind of speaker
                  <select aria-label=${t("speakers.what_kind_of_speaker")} @change=${(e: Event) => this._setRoute(id, (e.target as HTMLSelectElement).value as SpeechRoute)}>
                    ${ROUTES.map((r) => html`<option value=${r.value} ?selected=${r.value === cfg.route}>${r.label}</option>`)}
                  </select>
                </label>
                <label class="num wide">
                  ${alexa ? "Alexa device" : "Voice"}
                  <select
                    aria-label=${alexa ? "Alexa device" : "Voice"}
                    @change=${(e: Event) => {
                      const target = (e.target as HTMLSelectElement).value;
                      this._setSpeech(id, { target, enabled: !!target });
                    }}
                  >
                    <option value="" ?selected=${cfg.target === ""}>${t("common.choose")}</option>
                    ${targets.map((x) => html`<option value=${x.value} ?selected=${x.value === cfg.target}>${x.label}</option>`)}
                  </select>
                </label>
                ${cfg.route === "alexa_devices" && !targets.length
                  ? html`<div class="note muted small libhint">${t("speakers.no_alexa_devices_entities_found_is")}</div>`
                  : nothing}
                <button
                  type="button"
                  class="textlink quiet"
                  aria-label="Remove speaker ${this._friendly(id)}"
                  @click=${() => this._patch({ speakers: this._speakers().filter((s) => s.entity_id !== id) })}
                >
                  ${t("speakers.remove_speaker")}
                </button>
              </div>`
          : nothing}
      </div>
    `;
  }

  /** The ding and the alarm sound, one setting for each kind of speaker (it is written to every speaker of that kind). */
  private _toneGroup(group: "alexa" | "other") {
    const speakers = this._speakers().filter((s) => this._group(s) === group);
    const title = group === "alexa" ? "Alexa speakers" : "Other media players";
    if (!speakers.length) {
      return html`<h4>${title}</h4><p class="muted small">${t("speakers.you_have_no_such_speaker_yet")}</p>`;
    }
    const first = speakers[0];
    const setAll = (which: "cue" | "alarm", patch: Partial<SoundCfg>) =>
      this._patch({
        speakers: this._speakers().map((s) => (this._group(s) === group ? { ...s, [which]: { ...s[which], ...patch, enabled: true } } : s)),
      });
    const one = (which: "cue" | "alarm", name: string, example: string) => {
      const c = first[which];
      const key = `shared:${group}:${which}`;
      const open = !!this._open[key];
      return html`
        <div class="line">
          <div class="lmain">
            <span class="ltitle">${name}</span>
            <span class="lsum muted">${group === "other" && c.kind === "alexa" ? "No file chosen yet" : this._soundSummary(c.kind as SoundKind, c.sound)}</span>
            <span class="lacts">
              <button type="button" class="textlink quiet" aria-expanded=${open ? "true" : "false"} @click=${() => this._toggle(key)}>${t("speakers.details")}</button>
            </span>
          </div>
          ${open
            ? html`<div class="fields">
                ${this._soundPicker(c, first, (x) => setAll(which, { kind: x.kind, sound: x.sound }))}
                ${group === "alexa"
                  ? this._soundFields(c.kind as SoundKind, c.sound, example, (k) => setAll(which, { kind: k }), (s) => setAll(which, { sound: s }))
                  : html`<label class="num wide">
                      File in my media folder (for example boopli/${example}.mp3)
                      <input type="text" .value=${c.kind === "alexa" ? "" : c.sound} placeholder=${`boopli/${example}.mp3`} @change=${(e: Event) => setAll(which, { kind: "file", sound: (e.target as HTMLInputElement).value.trim() })} />
                    </label>`}
                ${which === "alarm"
                  ? html`${this._numField("Rings for (seconds)", c.seconds, 3, 600, (n) => setAll(which, { seconds: n }))}
                    ${this._numField("Repeat every (seconds, 0 = once)", c.repeat_s, 0, 60, (n) => setAll(which, { repeat_s: n }))}`
                  : nothing}
              </div>`
            : nothing}
        </div>`;
    };
    return html`<h4>${title}</h4>${one("cue", "Ding", "ding")} ${one("alarm", "Alarm sound", "alarm")}`;
  }

  private _ownSounds() {
    const sounds = this._sounds();
    return html`
      <p class="muted small">
        ${t("speakers.one_list_for_all_speakers_pick")}
      </p>
      ${sounds.map((x) =>
        this._line({
          key: `own:${x.id}`,
          title: x.name,
          nameInput: html`<input
            class="soundname"
            type="text"
            maxlength="30"
            aria-label=${t("speakers.name_of_the_sound")}
            .value=${x.name}
            @change=${(e: Event) => this._setExtra(x.id, { name: (e.target as HTMLInputElement).value.trim() })}
          />`,
          summary: this._soundSummary(x.kind, x.sound),
          onTest: () => void this._testExtra(x),
          details: this._soundFields(x.kind, x.sound, "fanfare", (k) => this._setExtra(x.id, { kind: k }), (s) => this._setExtra(x.id, { sound: s })),
          onRemove: () => this._removeExtra(x.id),
          removeLabel: `Remove the sound ${x.name}`,
        })
      )}
      <button type="button" class="textlink" ?disabled=${sounds.length >= 60} @click=${() => this._addExtra()}>
        ${icon("plus")} ${t("speakers.add_a_sound")}
      </button>
    `;
  }

  /** The Sound list of the Ding and the Alarm: what it is now, your own sounds, or typed in by hand (in the details). */
  private _soundPicker(current: { kind: SoundKind; sound: string }, speaker: SpeakerCfg, onPick: (s: ExtraSound) => void) {
    const fits = this._sounds().filter((x) => x.kind !== "alexa" || speaker.speech.route !== "tts");
    if (!fits.length) return nothing;
    const chosen = fits.find((x) => x.kind === current.kind && x.sound === current.sound);
    return html`<label class="num wide">
      Pick one of your sounds
      <select
        aria-label=${t("speakers.pick_one_of_your_sounds")}
        @change=${(e: Event) => {
          const id = (e.target as HTMLSelectElement).value;
          const found = fits.find((x) => x.id === id);
          if (found) onPick(found);
        }}
      >
        <option value="" ?selected=${!chosen}>${chosen ? "Choose…" : "Not one of your sounds"}</option>
        ${fits.map((x) => html`<option value=${x.id} ?selected=${chosen?.id === x.id}>${x.name}</option>`)}
      </select>
    </label>`;
  }

  /** A small window on top of the Speakers window. */
  private _subWindow(title: string, body: TemplateResult) {
    const close = () => (this._sub = "");
    return html`<dialog
      class="sub"
      aria-label=${title}
      @close=${close}
      @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) close(); // the dark area around the window
      }}
    >
      <div class="win">
        <div class="head">
          <h3>${title}</h3>
          <button type="button" class="close" aria-label=${t("common.close")} @click=${close}>✕</button>
        </div>
        ${body}
        <div class="actions"><button type="button" class="primary" @click=${close}>${t("common.done")}</button></div>
      </div>
    </dialog>`;
  }

  private _renderSub(d: Settings) {
    if (this._sub === "add") {
      const used = d.speakers.map((s) => s.entity_id);
      const choices = this._ids(["media_player"], used);
      return this._subWindow(
        "Add a speaker",
        html`<div class="row">
          <select aria-label=${t("speakers.add_a_speaker")} .value=${this._addSpeaker} @change=${(e: Event) => (this._addSpeaker = (e.target as HTMLSelectElement).value)}>
            <option value="">${t("speakers.choose_a_media_player")}</option>
            ${choices.map((id) => html`<option value=${id} ?selected=${id === this._addSpeaker}>${this._friendly(id)}</option>`)}
          </select>
          <button type="button" ?disabled=${!this._addSpeaker} @click=${() => this._add()}>${t("common.add")}</button>
        </div>`
      );
    }
    if (this._sub === "tone") {
      return this._subWindow(
        "Ding and alarm sound",
        html`<p class="muted small">
            ${t("speakers.one_setting_for_each_kind_of")}
          </p>
          ${this._toneGroup("alexa")} ${this._toneGroup("other")}`
      );
    }
    if (this._sub === "own") return this._subWindow("Your own sounds", this._ownSounds());
    if (this._sub === "say") {
      return this._subWindow(
        "What the speakers say",
        html`<input
            id="sentence"
            type="text"
            aria-label=${t("speakers.what_the_speakers_say")}
            .value=${d.speech_template}
            @change=${(e: Event) => this._patch({ speech_template: (e.target as HTMLInputElement).value.trim() })}
          />
          <div class="muted small hintline">${t("speakers.use_chore_for_the_chore_name")}</div>`
      );
    }
    return nothing;
  }

  private _renderSpeakers(d: Settings) {
    const topButton = (sub: "add" | "tone" | "own" | "say", ico: string, label: string) =>
      html`<button type="button" class="textlink" @click=${() => (this._sub = sub)}>${icon(ico)} ${label}</button>`;
    return html`
      <section class="card">
        <h2>${icon("volume-high")} ${t("speakers.speakers")}</h2>
        <p class="muted small">
          ${t("speakers.press_a_test_link_to_hear")}
        </p>
        <div class="topbtns">
          ${topButton("add", "plus", "Add a speaker")} ${topButton("tone", "music-note", "Ding and alarm sound")}
          ${topButton("own", "playlist-music", "Your own sounds")} ${topButton("say", "message-text-outline", "What the speakers say")}
        </div>
        ${d.speakers.length ? d.speakers.map((speaker) => this._speakerBody(speaker)) : html`<p class="muted">${t("speakers.no_speaker_yet_press_add_a")}</p>`}
        ${this._renderSub(d)}
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
        <h2>${icon("bell-ring-outline")} ${t("speakers.alarm_devices")}</h2>
        <p class="muted small">
          ${t("speakers.a_siren_switch_or_script_that")}
        </p>
        ${d.alarm_devices.map((device) =>
          this._line({
            key: `device:${device.entity_id}`,
            title: this._friendly(device.entity_id),
            summary: `On for ${device.seconds} s`,
            onTest: () => void this._testDevice(device),
            details: this._numField("On for (seconds)", device.seconds, 3, 600, (n) => this._updateDevice(device.entity_id, { seconds: n })),
            onRemove: () => this._patch({ alarm_devices: d.alarm_devices.filter((a) => a.entity_id !== device.entity_id) }),
            removeLabel: `Remove alarm device ${this._friendly(device.entity_id)}`,
          })
        )}
        <h3 class="sec">${t("speakers.add_an_alarm_device")}</h3>
        <div class="row">
          <select
            aria-label=${t("speakers.add_an_alarm_device")}
            .value=${this._addDevice}
            @change=${(e: Event) => (this._addDevice = (e.target as HTMLSelectElement).value)}
          >
            <option value="">${t("speakers.choose_a_siren_switch_or_script")}</option>
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
            ${t("common.add")}
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
      .topbtns {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 22px;
        margin: 4px 0 12px;
      }
      dialog.sub {
        padding: 0;
        border: 1px solid var(--divider-color, #444);
        border-radius: 16px;
        width: min(94vw, 640px);
        max-height: 90vh;
        overflow: auto;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #fff);
      }
      dialog.sub::backdrop {
        background: rgba(0, 0, 0, 0.6);
      }
      dialog.sub .win {
        padding: 16px 18px 18px;
      }
      dialog.sub .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      dialog.sub .head h3 {
        font-size: 22px;
      }
      dialog.sub .close {
        border: 0;
        background: transparent;
        color: inherit;
        font-size: 22px;
        cursor: pointer;
      }
      dialog.sub .actions {
        margin-top: 14px;
      }
      .tests {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 10px;
        padding: 8px 0 0;
      }
      button.test {
        min-height: 36px;
        padding: 4px 14px;
        font-size: 16px;
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
