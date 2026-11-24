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
import { weekdayNames } from "./time";
import { sharedStyles } from "./styles";
import "./boopli-speakers";
import "./boopli-away";
import "./boopli-ladders";
import "./boopli-pet-picker";
import "./boopli-pet-preview";
import "./boopli-backup";
import "./boopli-claude";
import { petInfo } from "./pets";
import { accentFor, applyAccent, isHex, SWATCHES } from "./accent";
import { icon } from "./icon";
import { FANCY, languageChoice, languageName, languages, setLanguageChoice, t } from "./i18n";

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
type Area = "phone" | "lights" | "speakers" | "alarms" | "quiet" | "timing" | "ladders" | "presence" | "pet" | "wall" | "ai" | "backup" | "language";

interface AreaDef {
  icon: string; // a Material Design icon name (mdi:<name>)
  title: string;
  wizard?: WizardId; // what "Guide me" opens (the Backup card has no guide)
  keys: (keyof Settings)[]; // the settings that belong to it (to see what has unsaved changes)
}

const AREAS = (): Record<Area, AreaDef> => ({
  phone: { icon: "cellphone", title: t("settings.phone"), wizard: "phone", keys: ["phones"] },
  lights: { icon: "lightbulb-outline", title: t("settings.reminder_lights"), wizard: "lights", keys: ["lights"] },
  speakers: { icon: "volume-high", title: t("speakers.speakers"), wizard: "speakers", keys: ["speakers", "speech_template", "sounds"] },
  alarms: { icon: "bell-ring-outline", title: t("speakers.alarm_devices"), wizard: "alarms", keys: ["alarm_devices"] },
  quiet: { icon: "weather-night", title: t("settings.quiet_hours"), wizard: "quiet", keys: ["quiet_hours"] },
  timing: {
    icon: "alarm",
    title: t("settings.snooze_and_timing"),
    wizard: "nudging",
    keys: ["snooze_minutes", "question_wait_minutes", "check_in_minutes"],
  },
  ladders: { icon: "stairs", title: t("common.nudge_it_your_way"), wizard: "ladders", keys: ["ladders", "default_style"] },
  presence: { icon: "map-marker-outline", title: t("common.where_you_are"), wizard: "presence", keys: ["presence_entity"] },
  pet: { icon: "paw", title: t("settings.your_pet_and_accent_colour"), wizard: "pet", keys: ["pet_name", "pet_kind", "accent"] },
  wall: { icon: "monitor-dashboard", title: t("common.wall_board"), wizard: "wall", keys: ["boards"] },
  ai: { icon: "robot-outline", title: t("settings.ai_help"), wizard: "ai", keys: ["ai"] },
  backup: { icon: "content-save-outline", title: t("backup.backup"), keys: [] },
  language: { icon: "translate", title: t("settings.language"), keys: [] },
});

/** The groups on the page, and the cards in each. */
const GROUPS = (): { title: string; areas: Area[] }[] => [
  { title: t("settings.devices"), areas: ["phone", "lights", "speakers", "alarms"] },
  { title: t("settings.timing"), areas: ["quiet", "timing", "ladders", "presence"] },
  { title: t("settings.extras"), areas: ["pet", "wall", "ai", "backup", "language"] },
];
const AREA_ORDER: Area[] = GROUPS().flatMap((g) => g.areas);

const LEVELS = (): { value: PhoneLevel; label: string }[] => [
  { value: "normal", label: t("common.normal_notification") },
  { value: "high", label: t("common.high_priority_pops_up") },
  { value: "alarm", label: t("common.alarm_volume") },
  { value: "alarm_max", label: t("common.max_volume_not_on_every_phone") },
];

const LIGHT_MODES = (): { value: LightMode; label: string }[] => [
  { value: "blink", label: t("rung.blink") },
  { value: "indicator", label: t("settings.indicator_lamp_on_until_done") },
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
    _claudeOpen: { state: true },
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
  declare _claudeOpen: boolean; // the small Ask Claude window on top of the AI help window
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
    this._claudeOpen = false;
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
    const sub = this.renderRoot.querySelector<HTMLDialogElement>("dialog.sub");
    if (sub && !sub.open) sub.showModal();
    const dialog = this.renderRoot.querySelector<HTMLDialogElement>("dialog:not(.sub)");
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
    return this._changed(...keys) ? html`<span class="unsaved-badge">${t("settings.unsaved")}</span>` : nothing;
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
      this._message = t("common.saved");
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
    this._note(`phone:${service}`, t("common.sending"));
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
    this._note(`light:${light.entity_id}`, t("common.testing"));
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
        weekdayNames().map((_, i) => [String(i), { ...DEFAULT_DAY }])
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
      weekdayNames().map((_, i) => [String(i), monday ? { ...monday } : null])
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
        <h2>${t("settings.phones")} ${this._badge("phones")}</h2>
        <p class="muted small">
          ${t("settings.boopli_sends_a_notification_with_done")}
        </p>
        ${services.length === 0
          ? html`<p class="muted">${t("settings.no_phones_with_the_home_assistant")}</p>`
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
                    aria-label=${t("settings.notification_level")}
                    ?disabled=${!cfg}
                    .value=${cfg?.level ?? "normal"}
                    @change=${(e: Event) =>
                      this._setPhoneLevel(service, (e.target as HTMLSelectElement).value as PhoneLevel)}
                  >
                    ${LEVELS().map(
                      (l) => html`<option value=${l.value} ?selected=${l.value === (cfg?.level ?? "normal")}>${l.label}</option>`
                    )}
                  </select>
                  <button @click=${() => this._testPhone(service)}>${t("common.test")}</button>
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
        <h2>${t("settings.reminder_lights")} ${this._badge("lights")}</h2>
        <p class="muted small">
          ${t("settings.boopli_blinks_a_light_itself_and")}
        </p>
        ${d.lights.map((light) => {
          const note = this._notes[`light:${light.entity_id}`];
          const id = light.entity_id;
          const blink = light.mode === "blink";
          return html`
            <div class="row">
              <div class="grow">
                <div>${this._friendly(id)}</div>
                ${this.hass?.states[id] ? nothing : html`<div class="muted small">${t("settings.not_found_right_now")}</div>`}
              </div>
              <select
                aria-label=${t("settings.light_mode")}
                .value=${light.mode}
                @change=${(e: Event) =>
                  this._setLightMode(id, (e.target as HTMLSelectElement).value as LightMode)}
              >
                ${LIGHT_MODES().map(
                  (m) => html`<option value=${m.value} ?selected=${m.value === light.mode}>${m.label}</option>`
                )}
              </select>
              ${lightHasColor(this.hass, id)
                ? html`<input
                    type="color"
                    class="swatch"
                    aria-label=${t("settings.color")}
                    .value=${this._rgbToHex(light.color)}
                    @input=${(e: Event) =>
                      this._patchLight(id, { color: this._hexToRgb((e.target as HTMLInputElement).value) })}
                  />`
                : nothing}
              <button @click=${() => this._testLight(light)}>${t("common.test")}</button>
              <button aria-label=${t("settings.remove_light")} @click=${() => this._removeLight(id)}>✕</button>
            </div>
            ${blink
              ? html`
                  <div class="blinkopts">
                    <label>
                      ${t("wizard.blink_length_ms")}
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
                      ${t("settings.blinks")}
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
                      ${t("settings.pause_between_ms")}
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
                    ${t("settings.a_light_in_your_home_can")}
                  </div>
                `
              : nothing}
            ${note ? html`<div class="note muted small">${note}</div>` : nothing}
          `;
        })}
        <div class="row add">
          <select
            aria-label=${t("settings.add_a_light")}
            .value=${this._addLight}
            @change=${(e: Event) => (this._addLight = (e.target as HTMLSelectElement).value)}
          >
            <option value="">${t("settings.add_a_light_2")}</option>
            ${choices.map(
              (id) => html`<option value=${id} ?selected=${id === this._addLight}>${this._friendly(id)}</option>`
            )}
          </select>
          <button ?disabled=${!this._addLight} @click=${() => this._addSelectedLight()}>${t("common.add")}</button>
        </div>
      </section>
    `;
  }

  private _renderQuiet(d: Settings) {
    const qh = d.quiet_hours;
    return html`
      <section class=${this._cardClass("quiet_hours")}>
        <h2>${t("settings.quiet_hours")} ${this._badge("quiet_hours")}</h2>
        <p class="muted small">
          ${t("settings.nudges_wait_outside_these_times_set")}
        </p>
        <label class="inline">
          <input
            type="checkbox"
            .checked=${qh.enabled}
            @change=${(e: Event) => this._setQuiet((e.target as HTMLInputElement).checked)}
          />
          ${t("settings.hold_nudges_outside_these_hours")}
        </label>
        ${qh.enabled
          ? html`
              ${weekdayNames().map((name, i) => {
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
                      ${t("common.no_limit")}
                    </label>
                    ${day
                      ? html`
                          <span class="muted small">${t("common.from")}</span>
                          <input
                            type="time"
                            aria-label=${t("settings.nudges_start", { name })}
                            .value=${day.start}
                            @input=${(e: Event) => this._setDay(i, { ...day, start: (e.target as HTMLInputElement).value })}
                          />
                          <span class="muted small">${t("common.until")}</span>
                          <input
                            type="time"
                            aria-label=${t("settings.nudges_stop", { name })}
                            .value=${day.stop}
                            @input=${(e: Event) => this._setDay(i, { ...day, stop: (e.target as HTMLInputElement).value })}
                          />
                        `
                      : nothing}
                  </div>
                `;
              })}
              <button class="chip" @click=${() => this._copyMondayToAll()}>${t("common.copy_monday_to_all_days")}</button>
            `
          : nothing}
      </section>
    `;
  }

  private _renderPresence(d: Settings) {
    return html`
      <section class=${this._cardClass("presence_entity")}>
        <div class="field">
          <label for="presence">${t("settings.where_you_are_optional")}</label>
          <select
            id="presence"
            .value=${d.presence_entity}
            @change=${(e: Event) => this._set({ presence_entity: (e.target as HTMLSelectElement).value })}
          >
            <option value="" ?selected=${d.presence_entity === ""}>${t("settings.none_assume_i_am_home")}</option>
            ${this._persons().map(
              (id) => html`<option value=${id} ?selected=${id === d.presence_entity}>${this._friendly(id)}</option>`
            )}
          </select>
          <div class="muted small">
            ${t("settings.presence_note")}
            ${this.snapshot ? (this.snapshot.is_home ? t("settings.right_now_home") : t("settings.right_now_away")) : nothing}
          </div>
        </div>
      </section>
    `;
  }

  private _renderPet(d: Settings) {
    return html`
      <section class=${this._cardClass("pet_name", "pet_kind", "accent")}>
        <div class="field">
          <label for="petname">${t("settings.your_pets_name")}</label>
          <input
            id="petname"
            maxlength="30"
            .value=${d.pet_name ?? "Boopli"}
            @input=${(e: Event) => this._set({ pet_name: (e.target as HTMLInputElement).value })}
          />
        </div>
        <div class="field">
          <label>${t("common.your_pet")}</label>
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
      <label id="accent-label">${t("settings.accent_colour")}</label>
      <div class="swatches" role="group" aria-labelledby="accent-label">
        <button
          type="button"
          class="acc own ${picked ? "" : "on"}"
          style="--sw:${own}"
          aria-pressed=${picked ? "false" : "true"}
          title=${t("settings.your_pets_own_colour")}
          @click=${() => set("")}
        >
          ${t("settings.pets_colour")}
        </button>
        ${SWATCHES().map(
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
        <label class="acc custom" title=${t("settings.pick_any_colour")}>
          ${t("settings.custom")}
          <input
            type="color"
            .value=${picked || own}
            aria-label=${t("settings.custom_accent_colour")}
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
          <label for="snooze">${t("settings.snooze_length_minutes")}</label>
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
          <label for="qwait">${t("settings.how_long_the_first_nudge_waits")}</label>
          <input
            id="qwait"
            type="number"
            min="5"
            max="720"
            .value=${String(d.question_wait_minutes ?? 30)}
            @input=${(e: Event) => this._set({ question_wait_minutes: Number((e.target as HTMLInputElement).value) || 30 })}
          />
          <div class="muted small">
            ${t("settings.for_chores_that_start_by_themselves")}
          </div>
        </div>
        <div class="field">
          <label for="checkin">${t("settings.after_on_it_boopli_asks_still")}</label>
          <input
            id="checkin"
            type="number"
            min="5"
            max="720"
            .value=${String(d.check_in_minutes ?? 30)}
            @input=${(e: Event) => this._set({ check_in_minutes: Number((e.target as HTMLInputElement).value) || 30 })}
          />
          <div class="muted small">
            ${t("settings.when_you_press_on_it_on")}
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
    this._aiNote = t("settings.asking_the_agent");
    try {
      const result = await aiSteps(this.hass, t("common.make_a_cup_of_tea"), "now", []);
      this._aiNote = t("common.agent_test_works", { count: result.steps.length, first: result.steps[0]?.title ?? t("common.none") });
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
          ${t("settings.reset_to_the_built_in_prompt")}
        </button>
      </div>
    `;
    return html`
      <section class=${this._cardClass("ai")}>
        <h2>${t("settings.ai_help")} ${this._badge("ai")}</h2>
        <p class="muted small">
          ${t("settings.boopli_can_split_a_task_into")}
        </p>
        <div class="aitop">
          <label class="inline">
            <input
              type="checkbox"
              .checked=${ai.enabled}
              @change=${(e: Event) => this._setAi({ enabled: (e.target as HTMLInputElement).checked })}
            />
            ${t("common.switch_ai_help_on")}
          </label>
          <button type="button" ?disabled=${changed || !ai.enabled} @click=${() => this._testAi()}>${t("settings.test_the_agent")}</button>
          <button type="button" @click=${() => (this._claudeOpen = true)}>
            ${icon("creation")} ${t("settings.ask_claude_extra")}${ai.claude_enabled ? t("settings.claude_on_suffix") : ""}
          </button>
        </div>
        ${changed ? html`<div class="muted small">${t("settings.save_first_to_test")}</div>` : nothing}
        ${this._aiNote ? html`<div class="note muted small">${this._aiNote}</div>` : nothing}
        <div class="field">
          <label for="ai-agent">${t("settings.which_ai_agent")}</label>
          <select id="ai-agent" @change=${(e: Event) => this._setAi({ entity_id: (e.target as HTMLSelectElement).value })}>
            <option value="" .selected=${ai.entity_id === ""}>${t("wizard.home_assistant_default")}</option>
            ${agents.map((id) => html`<option value=${id} .selected=${id === ai.entity_id}>${friendlyName(this.hass, id)}</option>`)}
            ${ai.entity_id && !agents.includes(ai.entity_id)
              ? html`<option value=${ai.entity_id} selected>${t("settings.not_found", { entity_id: ai.entity_id })}</option>`
              : nothing}
          </select>
          ${agents.length === 0
            ? html`<div class="muted small">${t("settings.no_ai_task_agent_found_in")}</div>`
            : nothing}
        </div>
        ${this._claudeOpen
          ? html`<dialog
              class="sub"
              aria-label=${t("common.ask_claude")}
              @close=${() => (this._claudeOpen = false)}
              @click=${(e: MouseEvent) => {
                if (e.target === e.currentTarget) this._claudeOpen = false; // the dark area around the window
              }}
            >
              <div class="cwin">
                <div class="chead">
                  <h3>${icon("creation")} ${t("settings.ask_claude_extra")}</h3>
                  <button type="button" class="cclose" aria-label=${t("common.close")} @click=${() => (this._claudeOpen = false)}>✕</button>
                </div>
                <boopli-claude
                  .hass=${this.hass}
                  .snapshot=${this.snapshot}
                  .ai=${ai}
                  .blocked=${changed ? t("settings.save_first_to_test") : ""}
                  @ai-patch=${(e: CustomEvent<Partial<Settings["ai"]>>) => this._setAi(e.detail)}
                ></boopli-claude>
                <div class="cactions"><button type="button" class="primary" @click=${() => (this._claudeOpen = false)}>${t("common.done")}</button></div>
              </div>
            </dialog>`
          : nothing}
        <details @toggle=${(e: Event) => (e.target as HTMLDetailsElement).open && this._loadDefaults()}>
          <summary class="muted small">${t("settings.advanced_agent_for_photos_and_the")}</summary>
          <div class="field">
            <label for="ai-photo-agent">${t("settings.agent_for_room_photos")}</label>
            <select
              id="ai-photo-agent"
              @change=${(e: Event) => this._setAi({ photo_entity_id: (e.target as HTMLSelectElement).value })}
            >
              <option value="" .selected=${(ai.photo_entity_id ?? "") === ""}>${t("settings.the_same_agent_as_above")}</option>
              ${agents.map(
                (id) => html`<option value=${id} .selected=${id === ai.photo_entity_id}>${friendlyName(this.hass, id)}</option>`
              )}
              ${ai.photo_entity_id && !agents.includes(ai.photo_entity_id)
                ? html`<option value=${ai.photo_entity_id} selected>${t("settings.not_found_2", { photo_entity_id: ai.photo_entity_id })}</option>`
                : nothing}
            </select>
            <div class="muted small">
              ${t("settings.only_used_when_you_describe_a")}
            </div>
          </div>
          <p class="muted small">
            ${t("settings.these_are_the_instructions_given_to")}
          </p>
          ${prompt("questions_prompt", t("settings.questions_prompt"))} ${prompt("steps_prompt", t("settings.steps_prompt"))}
          <h3>${t("settings.prompts_you_copy_into_your_own")}</h3>
          <p class="muted small">
            ${t("settings.these_are_the_texts_the_in")}
          </p>
          ${prompt("chat_room_prompt", t("settings.chat_prompt_for_one_room"))} ${prompt("chat_home_prompt", t("settings.chat_prompt_for_the_whole_home"))}
        </details>
      </section>
    `;
  }

  // --- the page: cards in groups. "Guide me" opens the wizard, "Advanced" opens a window ----------

  /** A few short lines of what is set (from the draft, so unsaved edits show too). */
    /** The summary lines that say "nothing yet" and are shown in a quieter colour. */
  private _dimLines(): string[] {
    return [
      t("settings.no_phone_set_up_yet"),
      t("settings.no_reminder_lights_yet"),
      t("settings.no_speakers_yet"),
      t("settings.no_alarm_devices_yet"),
      t("settings.no_ladders_of_your_own_yet"),
      t("settings.not_set_boopli_assumes_you_are"),
      t("settings.off_splits_big_tasks_into_tiny"),
      t("helpers.off_boopli_nudges_at_any_time"),
    ];
  }

  private _summary(area: Area, d: Settings): string[] {
    const fn = (id: string) => friendlyName(this.hass, id);
    switch (area) {
      case "phone":
        return d.phones.length
          ? d.phones.map((p) => `${phoneName(p.service)}: ${PHONE_LEVEL_LABEL()[p.level] ?? p.level}`)
          : [t("settings.no_phone_set_up_yet")];
      case "lights":
        return d.lights.length ? d.lights.map((l) => `${fn(l.entity_id)}: ${lightKind(l)}`) : [t("settings.no_reminder_lights_yet")];
      case "speakers":
        return d.speakers.length
          ? d.speakers.map((sp) => `${fn(sp.entity_id)}: ${describeSpeaker(sp)}`)
          : [t("settings.no_speakers_yet")];
      case "alarms":
        return d.alarm_devices.length
          ? d.alarm_devices.map((a) => t("settings.on_for_s", { name: fn(a.entity_id), seconds: a.seconds  }))
          : [t("settings.no_alarm_devices_yet")];
      case "quiet":
        return [describeQuiet(d.quiet_hours)];
      case "timing":
        return [
          t("settings.snooze_minutes", { snooze_minutes: d.snooze_minutes }),
          t("settings.still_on_it_after_minutes", { value: d.check_in_minutes ?? 30 }),
          t("settings.first_nudge_waits_minutes_for_your", { value: d.question_wait_minutes ?? 30 }),
        ];
      case "ladders": {
        const ladders = d.ladders ?? [];
        return [
          t("settings.new_chores", { style: styleLabel(d.default_style, ladders) }),
          ...ladders.map((l) => t("settings.ladder_nudges", { name: l.name, count: l.rungs.length })),
          ...(ladders.length ? [] : [t("settings.no_ladders_of_your_own_yet")]),
        ];
      }
      case "wall": {
        const night: Record<string, string> = { dim: t("settings.night_dims"), black: t("settings.night_goes_black"), off: t("settings.night_stays_on") };
        return (d.boards ?? []).map((b) => t("settings.board_summary", { name: b.name, count: b.tiles.length, night: night[b.night] ?? b.night }));
      }
      case "presence":
        return [d.presence_entity ? fn(d.presence_entity) : t("settings.not_set_boopli_assumes_you_are")];
      case "pet":
        return [
          t("settings.the", { pet_name: d.pet_name, value: petInfo(d.pet_kind).label.toLowerCase() }),
          isHex(d.accent) ? t("settings.accent_colour_2", { value: d.accent.toLowerCase() }) : t("settings.accent_colour_your_pets_own"),
        ];
      case "backup":
        return [t("settings.save_your_whole_setup_to_one")];
      case "language":
        return [];
      case "ai":
        return [
          d.ai?.enabled
            ? t("settings.on_using", { agent: d.ai.entity_id ? fn(d.ai.entity_id) : t("settings.the_home_assistant_default_agent") })
            : t("settings.off_splits_big_tasks_into_tiny"),
          ...(d.ai?.claude_enabled ? [t("settings.ask_claude_is_on")] : []),
        ];
    }
  }

  /** The language of the panel, kept in this browser. Changing it reloads the panel. */
  private _renderLanguageCard() {
    const a = AREAS().language;
    const choice = languageChoice();
    const codes = [...languages(), FANCY];
    return html`<section id="card-language" class="card area">
      <div class="card-head">
        <span class="card-icon">${icon(a.icon)}</span>
        <h3 tabindex="-1">${a.title}</h3>
      </div>
      <div class="field">
        <select
          aria-label=${a.title}
          ?disabled=${this._isDirty()}
          .value=${choice}
          @change=${(e: Event) => {
            setLanguageChoice((e.target as HTMLSelectElement).value);
            // a ?lang=xx in the address would still win over the choice: take it out
            const address = new URL(location.href);
            address.searchParams.delete("lang");
            history.replaceState(null, "", address);
            location.reload(); // every text is drawn again in the new language
          }}
        >
          <option value="" ?selected=${choice === ""}>${t("settings.language_same_as_home_assistant")}</option>
          ${codes.map((code) => html`<option value=${code} ?selected=${choice === code}>${languageName(code)}</option>`)}
        </select>
        <div class="muted small">${this._isDirty() ? t("settings.language_save_first") : t("settings.language_note")}</div>
      </div>
    </section>`;
  }

  private _card(area: Area, d: Settings) {
    if (area === "language") return this._renderLanguageCard();
    const a = AREAS()[area];
    const changed = this._changed(...a.keys);
    return html`<section id="card-${area}" class="card area ${area === "pet" ? "accented" : ""} ${changed ? "changed" : ""} ${this._flash === area ? "flash" : ""}">
      <div class="card-head">
        <span class="card-icon">${icon(a.icon)}</span>
        <h3 tabindex="-1">
          ${a.title}
          ${changed ? html`<span class="unsaved-badge">${t("settings.unsaved")}</span>` : nothing}
        </h3>
      </div>
      <div class="summary">
        ${this._summary(area, d).map(
          (line) =>
            html`<div class=${this._dimLines().includes(line) ? "muted" : ""}>${area === "pet" && isHex(d.accent) && line === this._summary(area, d)[1] ? html`<span class="accent-dot"></span>` : nothing}${line}</div>`
        )}
      </div>
      <div class="buttons">
        ${area === "backup"
          ? html`<button type="button" class="textlink" aria-label=${t("common.export_a_backup")} @click=${() => (this._backup = "export")}>${t("settings.export")}</button>
              <button type="button" class="textlink quiet" aria-label=${t("common.import_a_backup")} ?disabled=${this._isDirty()} @click=${() => (this._backup = "import")}>${t("settings.import")}</button>`
          : html`<button type="button" class="textlink" aria-label=${t("settings.guide_me_2", { title: a.title })} @click=${() => this._openWizard(a.wizard)}>${t("settings.guide_me")}</button>`}
        ${area === "backup"
          ? nothing
          : area === "wall"
          ? html`<button type="button" class="textlink quiet" aria-label=${t("settings.edit_on_the_wall")} @click=${() => this._editWall()}>${t("settings.edit_on_the_wall")}</button>`
          : html`<button type="button" class="textlink quiet" aria-label=${t("settings.advanced_2", { title: a.title })} ?disabled=${this._busy} @click=${() => this._openArea(area)}>${t("settings.advanced")}</button>`}
      </div>
      ${area === "backup" && this._isDirty() ? html`<p class="muted small">${t("settings.save_or_discard_your_unsaved_changes")}</p>` : nothing}
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
    const area = this._modal ? AREAS()[this._modal] : null;
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
            <div class="win-head ${this._modal === "ai" ? "noline" : ""}">
              <h2 id="win-title">${icon(area.icon)} ${area.title}</h2>
              <button type="button" class="close" aria-label=${t("settings.keep_for_later_and_close")} ?disabled=${this._busy} @click=${() => this._keep()}>✕</button>
            </div>
            <div class="win-body plain">${this._areaContent(this._modal, d)}</div>
            ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
            <div class="win-foot">
              <button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._saveClose()}>${t("settings.save_and_close")}</button>
              <button type="button" class="danger" ?disabled=${this._busy} @click=${() => this._discardClose()}>${t("settings.discard_and_close")}</button>
              <button type="button" ?disabled=${this._busy} @click=${() => this._keep()}>${t("settings.keep_for_later")}</button>
              <p class="muted small hint-line">
                ${t("settings.keep_for_later_closes_this_window")}
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
    const where = AREA_ORDER.filter((a) => this._changed(...AREAS()[a].keys));
    return html`${this._error && !this._modal ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      <div class="savebar" role="status">
        <div class="where">
          <b aria-hidden="true">●</b> ${t("settings.unsaved_changes_in")}
          ${where.map(
            (a) => html`<button type="button" class="chip where-chip" @click=${() => this._show(a)}>${AREAS()[a].title}</button>`
          )}
        </div>
        <span class="spacer"></span>
        <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>${t("common.save")}</button>
        <button ?disabled=${this._busy} @click=${() => this.discard()}>${t("settings.discard_all")}</button>
      </div>`;
  }

  render() {
    const d = this._draft;
    if (!d) return html`<p class="muted">${t("common.loading")}</p>`;
    return html`
      <section class="card away-card ${this.snapshot?.away?.active ? "on" : ""}">
        <boopli-away .hass=${this.hass} .snapshot=${this.snapshot}></boopli-away>
      </section>
      ${GROUPS().map(
        (g) => html`<h2 class="group">${g.title}</h2>
          <div class="cards">${g.areas.map((a) => this._card(a, d))}</div>`
      )}
      <p class="muted small">
        ${t("settings.want_to_do_all_of_it")}
        <button type="button" class="chip" @click=${() => this._openWizard("first")}>${t("settings.run_the_first_setup_again")}</button>
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
      /* A small window on top of the AI help window. */
      dialog.sub {
        width: min(94vw, 640px);
        overflow: auto;
      }
      .cwin {
        padding: 16px 18px 18px;
      }
      .chead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      .chead h3 {
        font-size: 22px;
      }
      .cclose {
        border: 0;
        background: transparent;
        color: inherit;
        font-size: 22px;
        cursor: pointer;
      }
      .cactions {
        margin-top: 14px;
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
      .win-head.noline {
        border-bottom: 0;
      }
      .aitop {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 14px;
        margin: 6px 0 10px;
      }
      .aitop label.inline {
        margin: 0;
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
