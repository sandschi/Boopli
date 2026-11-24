import { LitElement, html, css, nothing } from "lit";
import { aiDefaults, aiSteps, errorMessage, saveSettings, testLight, testPhone } from "./api";
import type { WizardId } from "./boopli-wizard";
import {
  describeQuiet,
  describeSpeaker,
  entityIds,
  friendlyName,
  lightHasColor,
  lightKind,
  phoneName,
  PHONE_LEVEL_LABEL,
  styleLabel,
} from "./helpers";
import { WEEKDAY_NAMES } from "./time";
import { sharedStyles } from "./styles";
import "./boopli-speakers";
import "./boopli-away";
import "./boopli-ladders";
import "./boopli-pet-picker";
import "./boopli-pet-preview";
import "./boopli-backup";
import { petInfo } from "./pets";
import { accentFor, applyAccent, isHex, SWATCHES } from "./accent";
import { icon } from "./icon";

import type {
  Hass,
  LightCfg,
  LightMode,
  PhoneLevel,
  PromptDefaults,
  QuietDay,
  Settings,
  Snapshot,
} from "./types";

/** The parts of Settings. Each is a card on the page, with a guide and an "Advanced" window. */
type Area = "phone" | "lights" | "speakers" | "alarms" | "quiet" | "timing" | "ladders" | "presence" | "pet" | "wall" | "ai" | "backup";

interface AreaDef {
  icon: string; // a Material Design icon name (mdi:<name>)
  title: string;
  wizard?: WizardId; // what "Guide me" opens (the Backup card has no guide)
  keys: (keyof Settings)[]; // the settings that belong to it (to see what has unsaved changes)
}

const AREAS: Record<Area, AreaDef> = {
  phone: { icon: "cellphone", title: "Phone", wizard: "phone", keys: ["phones"] },
  lights: { icon: "lightbulb-outline", title: "Reminder lights", wizard: "lights", keys: ["lights"] },
  speakers: { icon: "volume-high", title: "Speakers", wizard: "speakers", keys: ["speakers", "speech_template", "sounds"] },
  alarms: { icon: "bell-ring-outline", title: "Alarm devices", wizard: "alarms", keys: ["alarm_devices"] },
  quiet: { icon: "weather-night", title: "Quiet hours", wizard: "quiet", keys: ["quiet_hours"] },
  timing: {
    icon: "alarm",
    title: "Snooze and timing",
    wizard: "nudging",
    keys: ["snooze_minutes", "question_wait_minutes", "check_in_minutes"],
  },
  ladders: { icon: "stairs", title: "Nudge it your way", wizard: "ladders", keys: ["ladders", "default_style"] },
  presence: { icon: "map-marker-outline", title: "Where you are", wizard: "presence", keys: ["presence_entity"] },
  pet: { icon: "paw", title: "Your pet and accent colour", wizard: "pet", keys: ["pet_name", "pet_kind", "accent"] },
  wall: { icon: "monitor-dashboard", title: "Wall board", wizard: "wall", keys: ["boards"] },
  ai: { icon: "robot-outline", title: "AI help", wizard: "ai", keys: ["ai"] },
  backup: { icon: "content-save-outline", title: "Backup", keys: [] },
};

/** The groups on the page, and the cards in each. */
const GROUPS: { title: string; areas: Area[] }[] = [
  { title: "Devices", areas: ["phone", "lights", "speakers", "alarms"] },
  { title: "Timing", areas: ["quiet", "timing", "ladders", "presence"] },
  { title: "Extras", areas: ["pet", "wall", "ai", "backup"] },
];
const AREA_ORDER: Area[] = GROUPS.flatMap((g) => g.areas);

const LEVELS: { value: PhoneLevel; label: string }[] = [
  { value: "normal", label: "Normal notification" },
  { value: "high", label: "High priority (pops up)" },
  { value: "alarm", label: "Alarm volume" },
  { value: "alarm_max", label: "Max volume (not on every phone)" },
];

const LIGHT_MODES: { value: LightMode; label: string }[] = [
  { value: "blink", label: "Blink" },
  { value: "indicator", label: "Indicator lamp (on until done)" },
];

const DEFAULT_DAY: QuietDay = { start: "07:00", stop: "22:00" };

/** Settings: where Boopli nudges you, quiet hours, presence, snooze. */
export class BoopliSettings extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    _draft: { state: true },
    _addLight: { state: true },
    _busy: { state: true },
    _message: { state: true },
    _error: { state: true },
    _notes: { state: true },
    _modal: { state: true },
    _flash: { state: true },
    _defaults: { state: true },
    _aiNote: { state: true },
    _backup: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare _draft?: Settings;
  declare _addLight: string;
  declare _busy: boolean;
  declare _message: string;
  declare _error: string;
  declare _notes: Record<string, string>;
  declare _modal: Area | ""; // the advanced window that is open
  declare _flash: Area | ""; // the card that is lit up ("look here")
  declare _defaults: PromptDefaults | null;
  declare _aiNote: string;
  declare _backup: "" | "export" | "import"; // the backup window that is open
  private _base?: Settings; // the saved settings the draft is compared with
  private _justSaved = false;
  private _lastDirty = false;
  private _modalBase?: Settings; // the draft as it was when the window opened (what "Discard and close" goes back to)
  private _flashTimer = 0;

  constructor() {
    super();
    this._addLight = "";
    this._busy = false;
    this._message = "";
    this._error = "";
    this._notes = {};
    this._modal = "";
    this._flash = "";
    this._defaults = null;
    this._aiNote = "";
    this._backup = "";
  }

  protected willUpdate(): void {
    // A colour or pet picked here shows at once, before it is saved (the panel takes over when you leave).
    if (this._draft) applyAccent(this, this._draft.pet_kind, this._draft.accent);
    const saved = this.snapshot?.settings;
    if (!saved) return;
    if (!this._draft || !this._base) {
      this._base = structuredClone(saved);
      this._draft = structuredClone(saved);
      return;
    }
    // Just saved: take the settings as the integration stored them, so what it
    // tidied up (trimmed names and so on) does not count as an unsaved change.
    if (this._justSaved && JSON.stringify(saved) !== JSON.stringify(this._base)) {
      // Edits made while the save was on its way stay (as unsaved); only an untouched draft takes the tidied values.
      const untouched = JSON.stringify(this._draft) === JSON.stringify(this._base);
      this._base = structuredClone(saved);
      if (untouched) {
        this._draft = structuredClone(saved);
        if (this._modal) this._modalBase = structuredClone(saved); // "Discard" must not bring back the values before the save tidied them
      }
      this._justSaved = false;
    }
    // Settings that changed on the server without this page saving them (an import, another screen): while
    // there is nothing unsaved here, take them in, so the next Save cannot bring the old values back.
    if (!this._isDirty() && JSON.stringify(saved) !== JSON.stringify(this._base)) {
      this._base = structuredClone(saved);
      this._draft = structuredClone(saved);
      if (this._modal) this._modalBase = structuredClone(saved);
    }
  }

  protected updated(): void {
    const dialog = this.renderRoot.querySelector("dialog");
    if (dialog) {
      if (this._modal && !dialog.open) dialog.showModal();
      if (!this._modal && dialog.open) dialog.close();
    }
    const dirty = this._isDirty();
    if (dirty !== this._lastDirty) {
      this._lastDirty = dirty;
      this.dispatchEvent(
        new CustomEvent("dirty-change", {
          detail: { source: "settings", dirty },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  // --- unsaved changes -----------------------------------------------------------

  private _isDirty(): boolean {
    return !!this._draft && !!this._base && JSON.stringify(this._draft) !== JSON.stringify(this._base);
  }

  /** Whether any of these settings differ from what is saved. */
  private _changed(...keys: (keyof Settings)[]): boolean {
    const d = this._draft;
    const b = this._base;
    if (!d || !b) return false;
    return keys.some((k) => JSON.stringify(d[k]) !== JSON.stringify(b[k]));
  }

  private _badge(...keys: (keyof Settings)[]) {
    return this._changed(...keys) ? html`<span class="unsaved-badge">Unsaved</span>` : nothing;
  }

  private _cardClass(...keys: (keyof Settings)[]): string {
    return this._changed(...keys) ? "card changed" : "card";
  }

  /** Save the draft. Used by the Save buttons and by the panel's "Save" on leaving. */
  async save(): Promise<boolean> {
    if (!this.hass || !this._draft || this._busy) return false;
    this._busy = true;
    this._error = "";
    this._message = "";
    const sent = structuredClone(this._draft); // what goes out now; edits made while it is on its way stay "unsaved"
    try {
      await saveSettings(this.hass, sent);
      this._justSaved = true;
      this._base = sent;
      this._message = "Saved.";
      return true;
    } catch (err) {
      this._error = errorMessage(err);
      return false;
    } finally {
      this._busy = false;
    }
  }

  /** Throw the unsaved edits away. */
  discard(): void {
    if (this._base) this._draft = structuredClone(this._base);
    this._message = "";
    this._error = "";
  }

  private _openWizard(wizard?: WizardId): void {
    this.dispatchEvent(
      new CustomEvent("open-wizard", {
        detail: wizard ? { wizard } : {},
        bubbles: true,
        composed: true,
      })
    );
  }

  // --- helpers ---------------------------------------------------------

  private _set(patch: Partial<Settings>): void {
    if (!this._draft) return;
    this._draft = { ...this._draft, ...patch };
    this._message = "";
  }

  private _friendly(entityId: string): string {
    const name = this.hass?.states[entityId]?.attributes?.friendly_name;
    return typeof name === "string" && name ? name : entityId;
  }

  private _phoneServices(): string[] {
    const known = Object.keys(this.hass?.services?.notify ?? {}).filter((s) =>
      s.startsWith("mobile_app_")
    );
    const saved = this._draft?.phones.map((p) => p.service) ?? [];
    return [...new Set([...known, ...saved])].sort();
  }

  private _lightChoices(): string[] {
    const used = new Set(this._draft?.lights.map((l) => l.entity_id));
    return Object.keys(this.hass?.states ?? {})
      .filter((id) => id.startsWith("light.") && !used.has(id))
      .sort((a, b) => this._friendly(a).localeCompare(this._friendly(b)));
  }

  private _persons(): string[] {
    return Object.keys(this.hass?.states ?? {})
      .filter((id) => id.startsWith("person."))
      .sort();
  }

  private _note(key: string, text: string): void {
    this._notes = { ...this._notes, [key]: text };
  }

  // --- phones ----------------------------------------------------------

  private _togglePhone(service: string, on: boolean): void {
    if (!this._draft) return;
    const rest = this._draft.phones.filter((p) => p.service !== service);
    this._set({
      phones: on ? [...rest, { service, level: "normal", start_at: 1 }] : rest,
    });
  }

  private _setPhoneLevel(service: string, level: PhoneLevel): void {
    if (!this._draft) return;
    this._set({
      phones: this._draft.phones.map((p) =>
        p.service === service ? { ...p, level } : p
      ),
    });
  }

  private async _testPhone(service: string): Promise<void> {
    if (!this.hass || !this._draft) return;
    const level = this._draft.phones.find((p) => p.service === service)?.level ?? "normal";
    this._note(`phone:${service}`, "Sending…");
    try {
      const result = await testPhone(this.hass, { service, level, start_at: 1 });
      this._note(`phone:${service}`, result.note);
    } catch (err) {
      this._note(`phone:${service}`, errorMessage(err));
    }
  }

  // --- lights ----------------------------------------------------------

  private _addSelectedLight(): void {
    if (!this._draft || !this._addLight) return;
    const light: LightCfg = {
      entity_id: this._addLight,
      mode: "blink",
      color: [255, 90, 0],
      blink_ms: 1500,
      repeats: 1,
      gap_ms: 1000,
      start_at: 1,
    };
    this._set({ lights: [...this._draft.lights, light] });
    this._addLight = "";
  }

  private _patchLight(entityId: string, patch: Partial<LightCfg>): void {
    if (!this._draft) return;
    this._set({
      lights: this._draft.lights.map((l) =>
        l.entity_id === entityId ? { ...l, ...patch } : l
      ),
    });
  }

  private _setLightMode(entityId: string, mode: LightMode): void {
    this._patchLight(entityId, { mode });
  }

  /** Update a number field, clamped to the range the integration accepts. */
  private _setLightNumber(
    entityId: string,
    key: "blink_ms" | "repeats" | "gap_ms",
    raw: string,
    min: number,
    max: number
  ): void {
    const value = Math.round(Number(raw));
    if (raw.trim() === "" || Number.isNaN(value)) return;
    this._patchLight(entityId, { [key]: Math.min(max, Math.max(min, value)) });
  }

  private _hexToRgb(hex: string): number[] {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  private _rgbToHex(rgb: number[]): string {
    return "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
  }

  private _removeLight(entityId: string): void {
    if (!this._draft) return;
    this._set({ lights: this._draft.lights.filter((l) => l.entity_id !== entityId) });
  }

  private async _testLight(light: LightCfg): Promise<void> {
    if (!this.hass) return;
    this._note(`light:${light.entity_id}`, "Testing…");
    try {
      const result = await testLight(this.hass, light);
      this._note(`light:${light.entity_id}`, result.note);
    } catch (err) {
      this._note(`light:${light.entity_id}`, errorMessage(err));
    }
  }

  // --- quiet hours -----------------------------------------------------

  private _setQuiet(enabled: boolean): void {
    if (!this._draft) return;
    let days = this._draft.quiet_hours.days;
    if (enabled && Object.keys(days).length === 0) {
      days = Object.fromEntries(
        WEEKDAY_NAMES.map((_, i) => [String(i), { ...DEFAULT_DAY }])
      );
    }
    this._set({ quiet_hours: { enabled, days } });
  }

  private _setDay(day: number, value: QuietDay | null): void {
    if (!this._draft) return;
    const qh = this._draft.quiet_hours;
    this._set({ quiet_hours: { ...qh, days: { ...qh.days, [String(day)]: value } } });
  }

  private _copyMondayToAll(): void {
    if (!this._draft) return;
    const qh = this._draft.quiet_hours;
    const monday = qh.days["0"];
    const days = Object.fromEntries(
      WEEKDAY_NAMES.map((_, i) => [String(i), monday ? { ...monday } : null])
    );
    this._set({ quiet_hours: { ...qh, days } });
  }

  // --- save ------------------------------------------------------------

  private async _save(): Promise<void> {
    await this.save();
  }

  // --- render ----------------------------------------------------------

  private _renderPhones(d: Settings) {
    const services = this._phoneServices();
    return html`
      <section class=${this._cardClass("phones")}>
        <h2>Phones${this._badge("phones")}</h2>
        <p class="muted small">
          Boopli sends a notification with Done and Snooze buttons through the
          Home Assistant app on the phones you turn on.
        </p>
        ${services.length === 0
          ? html`<p class="muted">No phones with the Home Assistant app found.</p>`
          : services.map((service) => {
              const cfg = d.phones.find((p) => p.service === service);
              const note = this._notes[`phone:${service}`];
              return html`
                <div class="row">
                  <label class="inline">
                    <input
                      type="checkbox"
                      .checked=${!!cfg}
                      @change=${(e: Event) =>
                        this._togglePhone(service, (e.target as HTMLInputElement).checked)}
                    />
                    ${service.replace("mobile_app_", "")}
                  </label>
                  <select
                    aria-label="Notification level"
                    ?disabled=${!cfg}
                    .value=${cfg?.level ?? "normal"}
                    @change=${(e: Event) =>
                      this._setPhoneLevel(service, (e.target as HTMLSelectElement).value as PhoneLevel)}
                  >
                    ${LEVELS.map(
                      (l) => html`<option value=${l.value} ?selected=${l.value === (cfg?.level ?? "normal")}>${l.label}</option>`
                    )}
                  </select>
                  <button @click=${() => this._testPhone(service)}>Test</button>
                </div>
                ${note ? html`<div class="note muted small">${note}</div>` : nothing}
              `;
            })}
      </section>
    `;
  }

  private _renderLights(d: Settings) {
    const choices = this._lightChoices();
    return html`
      <section class=${this._cardClass("lights")}>
        <h2>Reminder lights${this._badge("lights")}</h2>
        <p class="muted small">
          Boopli blinks a light itself and puts it back exactly as it was, or
          uses it as an indicator lamp that stays on in a color until you are
          done. Press Test to see what a light really does: lights differ a lot.
        </p>
        ${d.lights.map((light) => {
          const note = this._notes[`light:${light.entity_id}`];
          const id = light.entity_id;
          const blink = light.mode === "blink";
          return html`
            <div class="row">
              <div class="grow">
                <div>${this._friendly(id)}</div>
                ${this.hass?.states[id] ? nothing : html`<div class="muted small">Not found right now</div>`}
              </div>
              <select
                aria-label="Light mode"
                .value=${light.mode}
                @change=${(e: Event) =>
                  this._setLightMode(id, (e.target as HTMLSelectElement).value as LightMode)}
              >
                ${LIGHT_MODES.map(
                  (m) => html`<option value=${m.value} ?selected=${m.value === light.mode}>${m.label}</option>`
                )}
              </select>
              ${lightHasColor(this.hass, id)
                ? html`<input
                    type="color"
                    class="swatch"
                    aria-label="Color"
                    .value=${this._rgbToHex(light.color)}
                    @input=${(e: Event) =>
                      this._patchLight(id, { color: this._hexToRgb((e.target as HTMLInputElement).value) })}
                  />`
                : nothing}
              <button @click=${() => this._testLight(light)}>Test</button>
              <button aria-label="Remove light" @click=${() => this._removeLight(id)}>✕</button>
            </div>
            ${blink
              ? html`
                  <div class="blinkopts">
                    <label>
                      Blink length (ms)
                      <input
                        type="number"
                        min="100"
                        max="30000"
                        step="100"
                        .value=${String(light.blink_ms)}
                        @change=${(e: Event) =>
                          this._setLightNumber(id, "blink_ms", (e.target as HTMLInputElement).value, 100, 30000)}
                      />
                    </label>
                    <label>
                      Blinks
                      <input
                        type="number"
                        min="1"
                        max="5"
                        .value=${String(light.repeats)}
                        @change=${(e: Event) =>
                          this._setLightNumber(id, "repeats", (e.target as HTMLInputElement).value, 1, 5)}
                      />
                    </label>
                    <label>
                      Pause between (ms)
                      <input
                        type="number"
                        min="0"
                        max="30000"
                        step="100"
                        .value=${String(light.gap_ms)}
                        @change=${(e: Event) =>
                          this._setLightNumber(id, "gap_ms", (e.target as HTMLInputElement).value, 0, 30000)}
                      />
                    </label>
                  </div>
                  <div class="muted small hint">
                    A light in your home can follow a few hundred milliseconds. A
                    light that goes through a cloud service needs about a second
                    or more, so find its limit with Test.
                  </div>
                `
              : nothing}
            ${note ? html`<div class="note muted small">${note}</div>` : nothing}
          `;
        })}
        <div class="row add">
          <select
            aria-label="Add a light"
            .value=${this._addLight}
            @change=${(e: Event) => (this._addLight = (e.target as HTMLSelectElement).value)}
          >
            <option value="">Add a light…</option>
            ${choices.map(
              (id) => html`<option value=${id} ?selected=${id === this._addLight}>${this._friendly(id)}</option>`
            )}
          </select>
          <button ?disabled=${!this._addLight} @click=${() => this._addSelectedLight()}>Add</button>
        </div>
      </section>
    `;
  }

  private _renderQuiet(d: Settings) {
    const qh = d.quiet_hours;
    return html`
      <section class=${this._cardClass("quiet_hours")}>
        <h2>Quiet hours${this._badge("quiet_hours")}</h2>
        <p class="muted small">
          Nudges wait outside these times. Set different hours for each day.
          A chore can opt out (for example pills).
        </p>
        <label class="inline">
          <input
            type="checkbox"
            .checked=${qh.enabled}
            @change=${(e: Event) => this._setQuiet((e.target as HTMLInputElement).checked)}
          />
          Hold nudges outside these hours
        </label>
        ${qh.enabled
          ? html`
              ${WEEKDAY_NAMES.map((name, i) => {
                const day = qh.days[String(i)] ?? null;
                return html`
                  <div class="row day">
                    <span class="dayname">${name}</span>
                    <label class="inline small">
                      <input
                        type="checkbox"
                        .checked=${day === null}
                        @change=${(e: Event) =>
                          this._setDay(i, (e.target as HTMLInputElement).checked ? null : { ...DEFAULT_DAY })}
                      />
                      No limit
                    </label>
                    ${day
                      ? html`
                          <span class="muted small">from</span>
                          <input
                            type="time"
                            aria-label="${name} nudges start"
                            .value=${day.start}
                            @input=${(e: Event) => this._setDay(i, { ...day, start: (e.target as HTMLInputElement).value })}
                          />
                          <span class="muted small">until</span>
                          <input
                            type="time"
                            aria-label="${name} nudges stop"
                            .value=${day.stop}
                            @input=${(e: Event) => this._setDay(i, { ...day, stop: (e.target as HTMLInputElement).value })}
                          />
                        `
                      : nothing}
                  </div>
                `;
              })}
              <button class="chip" @click=${() => this._copyMondayToAll()}>Copy Monday to all days</button>
            `
          : nothing}
      </section>
    `;
  }

  private _renderPresence(d: Settings) {
    return html`
      <section class=${this._cardClass("presence_entity")}>
        <div class="field">
          <label for="presence">Where you are (optional)</label>
          <select
            id="presence"
            .value=${d.presence_entity}
            @change=${(e: Event) => this._set({ presence_entity: (e.target as HTMLSelectElement).value })}
          >
            <option value="" ?selected=${d.presence_entity === ""}>None (assume I am home)</option>
            ${this._persons().map(
              (id) => html`<option value=${id} ?selected=${id === d.presence_entity}>${this._friendly(id)}</option>`
            )}
          </select>
          <div class="muted small">
            At home Boopli uses everything above. Away, it only uses your phone,
            and only for chores marked "anywhere".
            ${this.snapshot ? (this.snapshot.is_home ? "Right now: home." : "Right now: away.") : nothing}
          </div>
        </div>
      </section>
    `;
  }

  private _renderPet(d: Settings) {
    return html`
      <section class=${this._cardClass("pet_name", "pet_kind", "accent")}>
        <div class="field">
          <label for="petname">Your pet's name</label>
          <input
            id="petname"
            maxlength="30"
            .value=${d.pet_name ?? "Boopli"}
            @input=${(e: Event) => this._set({ pet_name: (e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="field">
          <label>Your pet</label>
          <boopli-pet-picker
            moods
            .value=${d.pet_kind ?? "slime"}
            @pet-kind-change=${(e: CustomEvent<string>) => this._set({ pet_kind: e.detail })}
          ></boopli-pet-picker>
          <boopli-pet-preview .kind=${d.pet_kind ?? "slime"}></boopli-pet-preview>
        </div>
        ${this._renderAccent(d)}
      </section>
    `;
  }

  /** The colour of buttons and bars: the pet's own by default, or one of a few swatches, or any colour. */
  private _renderAccent(d: Settings) {
    const own = accentFor(d.pet_kind, "");
    const picked = isHex(d.accent) ? d.accent.toLowerCase() : "";
    const set = (hex: string) => this._set({ accent: hex });
    return html`<div class="field">
      <label id="accent-label">Accent colour</label>
      <div class="swatches" role="group" aria-labelledby="accent-label">
        <button
          type="button"
          class="acc own ${picked ? "" : "on"}"
          style="--sw:${own}"
          aria-pressed=${picked ? "false" : "true"}
          title="Your pet's own colour"
          @click=${() => set("")}
        >
          Pet's colour
        </button>
        ${SWATCHES.map(
          (s) => html`<button
            type="button"
            class="acc dot ${picked === s.hex ? "on" : ""}"
            style="--sw:${s.hex}"
            aria-pressed=${picked === s.hex ? "true" : "false"}
            aria-label=${s.name}
            title=${s.name}
            @click=${() => set(s.hex)}
          ></button>`
        )}
        <label class="acc custom" title="Pick any colour">
          Custom
          <input
            type="color"
            .value=${picked || own}
            aria-label="Custom accent colour"
            @input=${(e: Event) => set((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>
    </div>`;
  }

  private _renderTiming(d: Settings) {
    return html`
      <section class=${this._cardClass("snooze_minutes", "question_wait_minutes", "check_in_minutes")}>
        <div class="field">
          <label for="snooze">Snooze length (minutes)</label>
          <input
            id="snooze"
            type="number"
            min="1"
            max="720"
            .value=${String(d.snooze_minutes)}
            @input=${(e: Event) => this._set({ snooze_minutes: Number((e.target as HTMLInputElement).value) || 15 })}
          />
        </div>
        <div class="field">
          <label for="qwait">How long the first nudge waits for your answers (minutes)</label>
          <input
            id="qwait"
            type="number"
            min="5"
            max="720"
            .value=${String(d.question_wait_minutes ?? 30)}
            @input=${(e: Event) => this._set({ question_wait_minutes: Number((e.target as HTMLInputElement).value) || 30 })}
          />
          <div class="muted small">
            For chores that start by themselves and have questions. They start with all steps; this is how long Boopli
            waits for your answers before it nudges.
          </div>
        </div>
        <div class="field">
          <label for="checkin">After "On it", Boopli asks "still on it?" after (minutes)</label>
          <input
            id="checkin"
            type="number"
            min="5"
            max="720"
            .value=${String(d.check_in_minutes ?? 30)}
            @input=${(e: Event) => this._set({ check_in_minutes: Number((e.target as HTMLInputElement).value) || 30 })}
          />
          <div class="muted small">
            When you press "On it" on a nudge, Boopli stays quiet while you work and checks in once after this time.
          </div>
        </div>
      </section>
    `;
  }

  // --- AI help ---------------------------------------------------------------------

  private _setAi(patch: Partial<Settings["ai"]>): void {
    if (!this._draft) return;
    this._set({ ai: { ...this._draft.ai, ...patch } });
    this._aiNote = "";
  }

  private async _loadDefaults(): Promise<void> {
    if (this._defaults || !this.hass) return;
    try {
      this._defaults = await aiDefaults(this.hass);
    } catch {
      this._defaults = { questions_prompt: "", steps_prompt: "", chat_room_prompt: "", chat_home_prompt: "" };
    }
  }

  /** Try the saved AI settings with a harmless sample task. */
  private async _testAi(): Promise<void> {
    if (!this.hass) return;
    this._aiNote = "Asking the agent…";
    try {
      const result = await aiSteps(this.hass, "Make a cup of tea", "now", []);
      this._aiNote = `It works. The agent split "Make a cup of tea" into ${result.steps.length} steps, starting with: ${result.steps[0]?.title ?? "(none)"}`;
    } catch (err) {
      this._aiNote = errorMessage(err);
    }
  }

  private _renderAi(d: Settings) {
    const agents = entityIds(this.hass, ["ai_task"]);
    const ai = d.ai;
    const def = this._defaults;
    const changed = this._changed("ai");
    const prompt = (key: keyof PromptDefaults, label: string) => html`
      <div class="field">
        <label for="ai-${key}">${label}</label>
        <textarea
          id="ai-${key}"
          rows="10"
          .value=${ai[key] || def?.[key] || ""}
          @input=${(e: Event) => {
            const value = (e.target as HTMLTextAreaElement).value;
            this._setAi({ [key]: def && value.trim() === def[key].trim() ? "" : value });
          }}
        ></textarea>
        <button type="button" class="chip" ?disabled=${!ai[key]} @click=${() => this._setAi({ [key]: "" })}>
          Reset to the built-in prompt
        </button>
      </div>
    `;
    return html`
      <section class=${this._cardClass("ai")}>
        <h2>AI help${this._badge("ai")}</h2>
        <p class="muted small">
          Boopli can split a task into tiny steps with your own Home Assistant AI agent. It is off until you
          switch it on. Boopli sends nothing by itself: when you use it, the text of the task and your answers
          go to the agent you choose, and nothing else (no device names, history or location). A cloud agent
          receives that text, and free models may keep or learn from what they get, so do not type private
          details. A local agent keeps everything at home.
        </p>
        <label class="inline">
          <input
            type="checkbox"
            .checked=${ai.enabled}
            @change=${(e: Event) => this._setAi({ enabled: (e.target as HTMLInputElement).checked })}
          />
          Switch AI help on
        </label>
        <div class="field">
          <label for="ai-agent">Which AI agent?</label>
          <select id="ai-agent" @change=${(e: Event) => this._setAi({ entity_id: (e.target as HTMLSelectElement).value })}>
            <option value="" .selected=${ai.entity_id === ""}>Home Assistant default</option>
            ${agents.map((id) => html`<option value=${id} .selected=${id === ai.entity_id}>${friendlyName(this.hass, id)}</option>`)}
            ${ai.entity_id && !agents.includes(ai.entity_id)
              ? html`<option value=${ai.entity_id} selected>${ai.entity_id} (not found)</option>`
              : nothing}
          </select>
          ${agents.length === 0
            ? html`<div class="muted small">No AI Task agent found in Home Assistant yet. Add one under Settings, Devices and services.</div>`
            : nothing}
        </div>
        <div class="row">
          <button type="button" ?disabled=${changed || !ai.enabled} @click=${() => this._testAi()}>Test the agent</button>
          ${changed ? html`<span class="muted small">Save first to test.</span>` : nothing}
        </div>
        ${this._aiNote ? html`<div class="note muted small">${this._aiNote}</div>` : nothing}
        <details @toggle=${(e: Event) => (e.target as HTMLDetailsElement).open && this._loadDefaults()}>
          <summary class="muted small">Advanced: agent for photos, and the prompts Boopli sends</summary>
          <div class="field">
            <label for="ai-photo-agent">Agent for room photos</label>
            <select
              id="ai-photo-agent"
              @change=${(e: Event) => this._setAi({ photo_entity_id: (e.target as HTMLSelectElement).value })}
            >
              <option value="" .selected=${(ai.photo_entity_id ?? "") === ""}>The same agent as above</option>
              ${agents.map(
                (id) => html`<option value=${id} .selected=${id === ai.photo_entity_id}>${friendlyName(this.hass, id)}</option>`
              )}
              ${ai.photo_entity_id && !agents.includes(ai.photo_entity_id)
                ? html`<option value=${ai.photo_entity_id} selected>${ai.photo_entity_id} (not found)</option>`
                : nothing}
            </select>
            <div class="muted small">
              Only used when you describe a room from photos on the My home screen. Pick an agent whose model can
              read images. Your normal agent stays as it is.
            </div>
          </div>
          <p class="muted small">
            These are the instructions given to the agent. You can change them. Leave a prompt as it is to use the
            built-in one. The placeholders {task}, {kind}, {known} and {answers} are filled in by Boopli.
          </p>
          ${prompt("questions_prompt", "Questions prompt")} ${prompt("steps_prompt", "Steps prompt")}
          <h3>Prompts you copy into your own AI chat</h3>
          <p class="muted small">
            These are the texts the "In my own chat" buttons on My home give you to copy. Boopli fills in {room}
            (the room name), {names} (your rooms) and {known} (the notes so far, if you tick that). Keep the part that
            asks for the answer in the same shape: one short fact per line in one code block, and for the whole home
            a "## Room" heading line before each room. Boopli reads the pasted answer that way.
          </p>
          ${prompt("chat_room_prompt", "Chat prompt for one room")} ${prompt("chat_home_prompt", "Chat prompt for the whole home")}
        </details>
      </section>
    `;
  }

  // --- the page: cards in groups. "Guide me" opens the wizard, "Advanced" opens a window ----------

  /** A few short lines of what is set (from the draft, so unsaved edits show too). */
  private _summary(area: Area, d: Settings): string[] {
    const fn = (id: string) => friendlyName(this.hass, id);
    switch (area) {
      case "phone":
        return d.phones.length
          ? d.phones.map((p) => `${phoneName(p.service)}: ${PHONE_LEVEL_LABEL[p.level] ?? p.level}`)
          : ["No phone set up yet."];
      case "lights":
        return d.lights.length ? d.lights.map((l) => `${fn(l.entity_id)}: ${lightKind(l)}`) : ["No reminder lights yet."];
      case "speakers":
        return d.speakers.length
          ? d.speakers.map((sp) => `${fn(sp.entity_id)}: ${describeSpeaker(sp)}`)
          : ["No speakers yet."];
      case "alarms":
        return d.alarm_devices.length
          ? d.alarm_devices.map((a) => `${fn(a.entity_id)}: on for ${a.seconds} s`)
          : ["No alarm devices yet."];
      case "quiet":
        return [describeQuiet(d.quiet_hours)];
      case "timing":
        return [
          `Snooze ${d.snooze_minutes} minutes`,
          `"Still on it?" after ${d.check_in_minutes ?? 30} minutes`,
          `First nudge waits ${d.question_wait_minutes ?? 30} minutes for your answers`,
        ];
      case "ladders": {
        const ladders = d.ladders ?? [];
        return [
          `New chores: ${styleLabel(d.default_style, ladders)}`,
          ...ladders.map((l) => `${l.name}: ${l.rungs.length} ${l.rungs.length === 1 ? "nudge" : "nudges"}`),
          ...(ladders.length ? [] : ["No ladders of your own yet."]),
        ];
      }
      case "wall": {
        const night: Record<string, string> = { dim: "dims", black: "goes black", off: "stays on" };
        return (d.boards ?? []).map((b) => `${b.name}: ${b.tiles.length} ${b.tiles.length === 1 ? "tile" : "tiles"}, ${night[b.night] ?? b.night} at night`);
      }
      case "presence":
        return [d.presence_entity ? fn(d.presence_entity) : "Not set. Boopli assumes you are home."];
      case "pet":
        return [
          `${d.pet_name} the ${petInfo(d.pet_kind).label.toLowerCase()}`,
          isHex(d.accent) ? `Accent colour: ${d.accent.toLowerCase()}` : "Accent colour: your pet's own",
        ];
      case "backup":
        return ["Save your whole setup to one file (.adhd), or load one on a new install."];
      case "ai":
        return [
          d.ai?.enabled
            ? `On, using ${d.ai.entity_id ? fn(d.ai.entity_id) : "the Home Assistant default agent"}`
            : "Off. Splits big tasks into tiny steps with your own AI agent.",
        ];
    }
  }

  private _card(area: Area, d: Settings) {
    const a = AREAS[area];
    const changed = this._changed(...a.keys);
    return html`<section id="card-${area}" class="card area ${area === "pet" ? "accented" : ""} ${changed ? "changed" : ""} ${this._flash === area ? "flash" : ""}">
      <div class="card-head">
        <span class="card-icon">${icon(a.icon)}</span>
        <h3 tabindex="-1">
          ${a.title}
          ${changed ? html`<span class="unsaved-badge">Unsaved</span>` : nothing}
        </h3>
      </div>
      <div class="summary">
        ${this._summary(area, d).map(
          (line) =>
            html`<div class=${line.startsWith("No ") || line.startsWith("Not ") || line.startsWith("Off") ? "muted" : ""}>${area === "pet" && line.startsWith("Accent colour") ? html`<span class="accent-dot"></span>` : nothing}${line}</div>`
        )}
      </div>
      <div class="buttons">
        ${area === "backup"
          ? html`<button type="button" class="textlink" aria-label="Export a backup" @click=${() => (this._backup = "export")}>Export</button>
              <button type="button" class="textlink quiet" aria-label="Import a backup" ?disabled=${this._isDirty()} @click=${() => (this._backup = "import")}>Import</button>`
          : html`<button type="button" class="textlink" aria-label="Guide me: ${a.title}" @click=${() => this._openWizard(a.wizard)}>Guide me</button>`}
        ${area === "backup"
          ? nothing
          : area === "wall"
          ? html`<button type="button" class="textlink quiet" aria-label="Edit on the wall" @click=${() => this._editWall()}>Edit on the wall</button>`
          : html`<button type="button" class="textlink quiet" aria-label="Advanced: ${a.title}" ?disabled=${this._busy} @click=${() => this._openArea(area)}>Advanced</button>`}
      </div>
      ${area === "backup" && this._isDirty() ? html`<p class="muted small">Save or discard your unsaved changes to import.</p>` : nothing}
    </section>`;
  }

  // --- the advanced window ---------------------------------------------------------

  /** The wall board is edited on the board itself: open the wall in edit mode. */
  private _editWall(): void {
    this.dispatchEvent(new CustomEvent("open-wall", { detail: { name: this._draft?.boards?.[0]?.name ?? "", edit: true }, bubbles: true, composed: true }));
  }

  private _openArea(area: Area): void {
    if (this._busy) return; // a save is on its way: wait for it
    this._modalBase = this._draft ? structuredClone(this._draft) : undefined;
    this._error = "";
    this._message = "";
    this._modal = area;
  }

  /** Close the window and keep the edits as an unsaved draft. */
  private _keep(): void {
    if (this._busy) return; // a save is on its way: the window stays until it is done
    this._modal = "";
  }

  /** Close the window and throw away what was changed since it opened. */
  private _discardClose(): void {
    if (this._modalBase) this._draft = structuredClone(this._modalBase);
    this._error = "";
    this._modal = "";
  }

  private async _saveClose(): Promise<void> {
    const area = this._modal;
    if ((await this.save()) && this._modal === area) this._modal = "";
  }

  private _areaContent(area: Area, d: Settings) {
    const patch = (e: CustomEvent<Partial<Settings>>) => this._set(e.detail);
    switch (area) {
      case "phone":
        return this._renderPhones(d);
      case "lights":
        return this._renderLights(d);
      case "speakers":
        return html`<boopli-speakers plain show="speakers" .hass=${this.hass} .settings=${d} @settings-patch=${patch}></boopli-speakers>`;
      case "alarms":
        return html`<boopli-speakers plain show="devices" .hass=${this.hass} .settings=${d} @settings-patch=${patch}></boopli-speakers>`;
      case "quiet":
        return this._renderQuiet(d);
      case "timing":
        return this._renderTiming(d);
      case "wall":
        return nothing; // the wall board is edited on the wall itself (see _editWall)
      case "ladders":
        return html`<boopli-ladders
          plain
          .hass=${this.hass}
          .settings=${d}
          .snapshot=${this.snapshot}
          @settings-patch=${patch}
        ></boopli-ladders>`;
      case "backup":
        return nothing; // the Backup card has its own windows (see boopli-backup.ts)
      case "presence":
        return this._renderPresence(d);
      case "pet":
        return this._renderPet(d);
      case "ai":
        return this._renderAi(d);
    }
  }

  private _renderModal(d: Settings) {
    const area = this._modal ? AREAS[this._modal] : null;
    return html`<dialog
      aria-labelledby="win-title"
      @cancel=${(e: Event) => {
        e.preventDefault(); // Esc keeps the edits, like "Keep for later"
        this._keep();
      }}
      @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) this._keep(); // a click on the dark area around the window
      }}
    >
      ${area && this._modal
        ? html`<div class="win">
            <div class="win-head">
              <h2 id="win-title">${icon(area.icon)} ${area.title}</h2>
              <button type="button" class="close" aria-label="Keep for later and close" ?disabled=${this._busy} @click=${() => this._keep()}>✕</button>
            </div>
            <div class="win-body plain">${this._areaContent(this._modal, d)}</div>
            ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
            <div class="win-foot">
              <button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._saveClose()}>Save and close</button>
              <button type="button" class="danger" ?disabled=${this._busy} @click=${() => this._discardClose()}>Discard and close</button>
              <button type="button" ?disabled=${this._busy} @click=${() => this._keep()}>Keep for later</button>
              <p class="muted small hint-line">
                "Keep for later" closes this window and keeps your changes. The card shows an orange "Unsaved" tag.
              </p>
            </div>
          </div>`
        : nothing}
    </dialog>`;
  }

  // --- where the unsaved changes are -----------------------------------------------

  /** Scroll to a card and light it up, so you can see what has not been saved. */
  private _show(area: Area): void {
    this._flash = area;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const card = this.renderRoot.querySelector(`#card-${area}`);
    card?.querySelector<HTMLElement>("h3")?.focus({ preventScroll: true }); // the next Tab starts inside this card
    card?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    window.clearTimeout(this._flashTimer);
    this._flashTimer = window.setTimeout(() => (this._flash = ""), 2600);
  }

  private _renderSaveBar() {
    if (!this._isDirty()) return nothing;
    const where = AREA_ORDER.filter((a) => this._changed(...AREAS[a].keys));
    return html`${this._error && !this._modal ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      <div class="savebar" role="status">
        <div class="where">
          <b aria-hidden="true">●</b> Unsaved changes in:
          ${where.map(
            (a) => html`<button type="button" class="chip where-chip" @click=${() => this._show(a)}>${AREAS[a].title}</button>`
          )}
        </div>
        <span class="spacer"></span>
        <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
        <button ?disabled=${this._busy} @click=${() => this.discard()}>Discard all</button>
      </div>`;
  }

  render() {
    const d = this._draft;
    if (!d) return html`<p class="muted">Loading…</p>`;
    return html`
      <section class="card away-card ${this.snapshot?.away?.active ? "on" : ""}">
        <boopli-away .hass=${this.hass} .snapshot=${this.snapshot}></boopli-away>
      </section>
      ${GROUPS.map(
        (g) => html`<h2 class="group">${g.title}</h2>
          <div class="cards">${g.areas.map((a) => this._card(a, d))}</div>`
      )}
      <p class="muted small">
        Want to do all of it again from the start?
        <button type="button" class="chip" @click=${() => this._openWizard("first")}>Run the first setup again</button>
      </p>
      ${this._renderModal(d)} ${this._renderSaveBar()}
      ${this._backup
        ? html`<boopli-backup .hass=${this.hass} .snapshot=${this.snapshot} .mode=${this._backup} @backup-close=${() => (this._backup = "")}></boopli-backup>`
        : nothing}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      textarea {
        font: inherit;
        width: 100%;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
        margin-bottom: 6px;
      }
      .toolbar {
        margin-bottom: 14px;
      }
      .page-title {
        font-size: 22px;
        margin: 0;
      }
      /* A section is one tier above a card: bigger than the card names, and the brightest text on the page. */
      h2.group {
        font-size: 30px;
        font-weight: 400;
        letter-spacing: 0.01em;
        color: var(--primary-text-color);
        margin: 18px 0 8px;
      }
      section.card.away-card {
        margin: 0 0 2px;
        padding: 6px 0 2px;
        border: 0;
        border-top: 2px solid var(--divider-color);
        border-radius: 0;
        background: none;
      }
      section.card.away-card.on {
        border: 2px solid var(--warning-color, #ffa600);
        border-radius: 14px;
        padding: 8px 14px;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(210px, 100%), 1fr));
        gap: 14px 32px;
        align-items: stretch;
      }
      /* "Invisible cards": no box. A thin line on top, an icon, the name, what is set, and two quiet links. */
      section.card.area {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 0;
        padding: 10px 0 0;
        border: 0;
        border-top: 2px solid var(--divider-color);
        border-radius: 0;
        background: none;
        transition: border-color 0.15s;
      }
      section.card.area:hover,
      section.card.area:focus-within {
        border-top-color: var(--boopli-accent, var(--primary-color));
      }
      /* A small dot in the accent colour next to "Accent colour: ...". */
      .accent-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-right: 6px;
        border-radius: 50%;
        background: var(--boopli-accent, var(--primary-color));
      }
      .card-head {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      /* The name and its icon are white, the biggest thing on the card; what is set under it is grey. */
      .card-icon {
        font-size: 26px;
        line-height: 1;
        color: var(--primary-text-color);
      }
      section.card.area h3 {
        margin: 0;
        color: var(--primary-text-color);
        font-size: 23px;
        font-weight: 400;
        letter-spacing: 0.01em;
      }
      .swatches {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }
      .acc {
        --sw: var(--boopli-accent, var(--primary-color));
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        cursor: pointer;
        border: 2px solid var(--divider-color);
        border-radius: 999px;
        padding: 6px 12px;
        min-height: 36px;
        font-size: 17px;
        color: var(--primary-text-color);
      }
      .acc.own::before {
        content: "";
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--sw);
      }
      .acc.dot {
        width: 36px;
        padding: 0;
        background: var(--sw);
        border-color: transparent;
      }
      .acc.dot:hover {
        background: var(--sw);
        filter: brightness(1.12);
      }
      .acc.on {
        border-color: var(--primary-text-color);
      }
      .acc {
        flex: none;
        white-space: nowrap;
        background: transparent;
      }
      .acc.custom input {
        width: 24px;
        height: 24px;
        min-height: 0;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: none;
        cursor: pointer;
      }
      .acc.custom input::-webkit-color-swatch-wrapper {
        padding: 0;
      }
      .acc.custom input::-webkit-color-swatch {
        border: 0;
        border-radius: 50%;
      }
      .acc.custom input::-moz-color-swatch {
        border: 0;
        border-radius: 50%;
      }
      .buttons button {
        font-size: 17px;
        padding: 4px 2px;
      }
      @media (max-width: 600px) {
        .cards {
          gap: 18px;
        }
        section.card.area {
          min-height: 0;
        }
      }
      .buttons button.quiet {
        color: var(--secondary-text-color);
      }
      .buttons {
        gap: 4px 16px;
      }
      .summary {
        display: flex;
        flex-direction: column;
        gap: 3px;
        flex: 1;
        font-size: 17px;
        color: var(--secondary-text-color);
        overflow-wrap: anywhere;
      }
      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      /* The card with unsaved changes, and the one the bar points to. */
      section.card.area.flash {
        outline: 3px solid var(--warning-color, #ffa600);
        outline-offset: 2px;
        animation: look-here 0.7s ease-in-out 3;
      }
      @keyframes look-here {
        50% {
          transform: scale(1.025);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        section.card.area.flash {
          animation: none;
        }
      }

      /* The advanced window. */
      dialog {
        border: 0;
        padding: 0;
        border-radius: 16px;
        color: var(--primary-text-color);
        background: var(--card-background-color, var(--primary-background-color));
        width: min(760px, calc(100vw - 24px));
        max-width: none;
        max-height: calc(100vh - 24px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.6);
      }
      .win {
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 24px);
      }
      .win-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--divider-color);
      }
      .win-head h2 {
        margin: 0;
        font-size: 22px;
      }
      .close {
        padding: 4px 10px;
        min-height: 36px;
      }
      .win-body {
        padding: 14px 18px;
        overflow-y: auto;
        flex: 1;
      }
      .win > .error {
        margin: 0;
        padding: 8px 18px 0;
      }
      .win-foot {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 12px 18px 14px;
        border-top: 1px solid var(--divider-color);
      }
      .hint-line {
        flex: 1 1 100%;
        margin: 2px 0 0;
      }
      /* Inside the window the cards lose their frame and heading: the window has its own. */
      .plain section.card {
        border: 0;
        box-shadow: none;
        background: none;
        padding: 0;
        margin: 0;
      }
      .plain section.card > h2 {
        display: none;
      }
      @media (max-width: 600px) {
        dialog {
          width: 100vw;
          max-width: 100vw;
          height: 100vh;
          height: 100dvh;
          max-height: 100vh;
          max-height: 100dvh;
          border-radius: 0;
        }
        .win {
          height: 100vh;
          height: 100dvh;
          max-height: 100vh;
          max-height: 100dvh;
        }
        /* Save on its own line, the other two side by side; the hint goes (the orange tag says it). */
        .win-foot button.primary {
          flex: 1 1 100%;
        }
        .win-foot button:not(.primary) {
          flex: 1 1 calc(50% - 4px);
        }
        .hint-line {
          display: none;
        }
      }

      .spacer {
        flex: 1;
      }
      section.card {
        margin: 0;
      }
      section.card.changed {
        border-top-color: var(--warning-color, #ffa600);
      }
      boopli-speakers.changed {
        border-color: var(--warning-color, #ffa600);
        box-shadow: inset 4px 0 0 var(--warning-color, #ffa600);
      }
      boopli-speakers[show="speakers"].changed::before {
        content: "● Unsaved changes in speakers";
        display: block;
        color: var(--warning-color, #ffa600);
        font-size: 16px;
        font-weight: 500;
        padding: 0 0 6px 4px;
      }
      boopli-speakers[show="devices"].changed::before {
        content: "● Unsaved changes in alarm devices";
        display: block;
        color: var(--warning-color, #ffa600);
        font-size: 16px;
        font-weight: 500;
        padding: 0 0 6px 4px;
      }
      .unsaved-badge {
        display: inline-block;
        margin-left: 8px;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 15px;
        font-weight: 500;
        color: #000;
        background: var(--warning-color, #ffa600);
        vertical-align: middle;
      }
      .savebar {
        position: sticky;
        bottom: 12px;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
        padding: 12px 16px;
        border-radius: 14px;
        border: 2px solid var(--warning-color, #ffa600);
        background: var(--card-background-color, var(--primary-background-color));
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
      }
      .savebar {
        flex-wrap: wrap;
      }
      .savebar b {
        color: var(--warning-color, #ffa600);
      }
      .where {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 8px;
        flex: 1 1 260px;
      }
      .where-chip {
        border-color: var(--warning-color, #ffa600);
      }
      h2 {
        font-size: 20px;
        margin-bottom: 6px;
      }
      .small {
        font-size: 16px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 8px 0;
        border-top: 1px solid var(--divider-color);
      }
      .row select {
        flex: 1 1 200px;
        width: auto;
      }
      .grow {
        flex: 1 1 160px;
      }
      .note {
        padding: 0 0 8px;
      }
      .startrow {
        padding: 0 0 8px;
      }
      label.startat {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        margin: 0;
      }
      label.startat input {
        width: 80px;
      }
      .blinkopts {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding: 0 0 4px;
      }
      .blinkopts label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 16px;
        margin: 0;
      }
      .blinkopts input {
        width: 130px;
      }
      .hint {
        padding: 0 0 8px;
      }
      .swatch {
        width: 44px;
        min-height: 36px;
        padding: 2px;
        flex: 0 0 auto;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--primary-text-color);
        margin: 0;
        flex: 1 1 140px;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      .day input[type="time"] {
        width: 120px;
      }
      .dayname {
        width: 36px;
        font-weight: 500;
      }
      .field {
        margin: 14px 0;
      }
      .add {
        border-top: 1px solid var(--divider-color);
      }
    `,
  ];
}

customElements.define("boopli-settings", BoopliSettings);
