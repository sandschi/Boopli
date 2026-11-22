import { LitElement, html, css, nothing } from "lit";
import { aiDefaults, aiSteps, errorMessage, saveSettings, testLight, testPhone } from "./api";
import type { WizardId } from "./boopli-wizard";
import {
  describeQuiet,
  describeSpeaker,
  entityIds,
  friendlyName,
  lightKind,
  phoneName,
  PHONE_LEVEL_LABEL,
  STYLE_LABEL,
} from "./helpers";
import { WEEKDAY_NAMES } from "./time";
import { sharedStyles } from "./styles";
import "./boopli-speakers";
import "./boopli-away";

type Mode = "simple" | "advanced";
const MODE_KEY = "boopli.settings_mode";

function loadMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === "advanced" ? "advanced" : "simple";
  } catch {
    return "simple";
  }
}
import type {
  Hass,
  LightCfg,
  LightMode,
  NudgeStyle,
  PhoneLevel,
  PromptDefaults,
  QuietDay,
  Settings,
  Snapshot,
} from "./types";

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

const STYLES: { value: NudgeStyle; label: string }[] = [
  { value: "quiet", label: "Quiet (no nudges)" },
  { value: "one", label: "One nudge" },
  { value: "escalating", label: "Escalating" },
  { value: "persistent", label: "Persistent" },
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
    _mode: { state: true },
    _defaults: { state: true },
    _aiNote: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare _draft?: Settings;
  declare _addLight: string;
  declare _busy: boolean;
  declare _message: string;
  declare _error: string;
  declare _notes: Record<string, string>;
  declare _mode: Mode;
  declare _defaults: PromptDefaults | null;
  declare _aiNote: string;
  private _base?: Settings; // the saved settings the draft is compared with
  private _justSaved = false;
  private _lastDirty = false;

  constructor() {
    super();
    this._addLight = "";
    this._busy = false;
    this._message = "";
    this._error = "";
    this._notes = {};
    this._mode = loadMode();
    this._defaults = null;
    this._aiNote = "";
  }

  protected willUpdate(): void {
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
      this._base = structuredClone(saved);
      this._draft = structuredClone(saved);
      this._justSaved = false;
    }
  }

  protected updated(): void {
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

  private _setMode(mode: Mode): void {
    this._mode = mode;
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* the choice just is not remembered */
    }
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

  private _startAtField(value: number, onChange: (n: number) => void) {
    return html`
      <label class="startat">
        Starts at nudge #
        <input
          type="number"
          min="1"
          max="20"
          .value=${String(value)}
          @change=${(e: Event) => {
            const n = Math.round(Number((e.target as HTMLInputElement).value));
            if (!Number.isNaN(n)) onChange(Math.min(20, Math.max(1, n)));
          }}
        />
      </label>
    `;
  }

  private _setPhoneStart(service: string, start_at: number): void {
    if (!this._draft) return;
    this._set({
      phones: this._draft.phones.map((p) =>
        p.service === service ? { ...p, start_at } : p
      ),
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
        <h2>📱 Phones ${this._badge("phones")}</h2>
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
                ${cfg
                  ? html`<div class="startrow">
                      ${this._startAtField(cfg.start_at ?? 1, (n) => this._setPhoneStart(service, n))}
                    </div>`
                  : nothing}
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
        <h2>💡 Reminder lights ${this._badge("lights")}</h2>
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
              <input
                type="color"
                class="swatch"
                aria-label="Color"
                .value=${this._rgbToHex(light.color)}
                @input=${(e: Event) =>
                  this._patchLight(id, { color: this._hexToRgb((e.target as HTMLInputElement).value) })}
              />
              <button @click=${() => this._testLight(light)}>Test</button>
              <button aria-label="Remove light" @click=${() => this._removeLight(id)}>✕</button>
            </div>
            <div class="startrow">
              ${this._startAtField(light.start_at ?? 1, (n) => this._patchLight(id, { start_at: n }))}
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
        <h2>🌙 Quiet hours ${this._badge("quiet_hours")}</h2>
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

  private _renderOther(d: Settings) {
    return html`
      <section class=${this._cardClass("presence_entity", "pet_name", "snooze_minutes", "question_wait_minutes", "check_in_minutes", "default_style")}>
        <h2>📍 Where you are, snooze and defaults ${this._badge("presence_entity", "pet_name", "snooze_minutes", "question_wait_minutes", "check_in_minutes", "default_style")}</h2>
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
        <div class="field">
          <label for="style">Default nudge style for new chores</label>
          <select
            id="style"
            .value=${d.default_style}
            @change=${(e: Event) => this._set({ default_style: (e.target as HTMLSelectElement).value as NudgeStyle })}
          >
            ${STYLES.map(
              (s) => html`<option value=${s.value} ?selected=${s.value === d.default_style}>${s.label}</option>`
            )}
          </select>
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
        <h2>🤖 AI help ${this._badge("ai")}</h2>
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

  // --- the simple view: what is set, with a step-by-step button per area ---------

  private _overviewCard(
    emoji: string,
    title: string,
    wizard: WizardId,
    lines: string[],
    empty: string,
    button = "Set up step by step"
  ) {
    return html`<section class="card overview">
      <h2><span class="emoji" aria-hidden="true">${emoji}</span> ${title}</h2>
      <div class="summary">
        ${lines.length
          ? lines.map((l) => html`<div>${l}</div>`)
          : html`<div class="muted">${empty}</div>`}
      </div>
      <button type="button" class="primary" @click=${() => this._openWizard(wizard)}>${button}</button>
    </section>`;
  }

  private _renderSimple() {
    // Always what is saved, so this view never shows half-finished edits.
    const s = this.snapshot?.settings;
    if (!s) return nothing;
    const fn = (id: string) => friendlyName(this.hass, id);
    return html`
      <div class="cards simple">
        ${this._overviewCard("🐻", "Your pet", "pet", [s.pet_name], "", "Rename")}
        ${this._overviewCard(
          "📱",
          "Phone",
          "phone",
          s.phones.map((p) => `${phoneName(p.service)}: ${PHONE_LEVEL_LABEL[p.level] ?? p.level}, from nudge ${p.start_at}`),
          "No phone set up yet."
        )}
        ${this._overviewCard("🌙", "Quiet hours", "quiet", [describeQuiet(s.quiet_hours)], "")}
        ${this._overviewCard(
          "⏰",
          "Snooze and style",
          "nudging",
          [`Snooze ${s.snooze_minutes} minutes`, `New chores: ${STYLE_LABEL[s.default_style] ?? s.default_style}`],
          ""
        )}
        ${this._overviewCard(
          "💡",
          "Reminder lights",
          "lights",
          s.lights.map((l) => `${fn(l.entity_id)}: ${lightKind(l)}`),
          "No reminder lights yet."
        )}
        ${this._overviewCard(
          "🔊",
          "Speakers",
          "speakers",
          s.speakers.map((sp) => `${fn(sp.entity_id)}: ${describeSpeaker(sp)}`),
          "No speakers yet."
        )}
        ${this._overviewCard(
          "🚨",
          "Alarm devices",
          "alarms",
          s.alarm_devices.map((a) => `${fn(a.entity_id)}: on for ${a.seconds} s, from nudge ${a.start_at}`),
          "No alarm devices yet."
        )}
        ${this._overviewCard(
          "🤖",
          "AI help",
          "ai",
          s.ai?.enabled
            ? [`On, using ${s.ai.entity_id ? fn(s.ai.entity_id) : "the Home Assistant default agent"}`]
            : [],
          "Off. Splits big tasks into tiny steps with your own AI agent."
        )}
        ${this._overviewCard(
          "📍",
          "Where you are",
          "presence",
          s.presence_entity ? [fn(s.presence_entity)] : [],
          "Not set. Boopli assumes you are home."
        )}
      </div>
      <p class="muted small">
        Want to do all of it again from the start?
        <button type="button" class="chip" @click=${() => this._openWizard("first")}>Run the first setup again</button>
      </p>
    `;
  }

  private _renderSaveBar() {
    if (!this._isDirty()) return nothing;
    return html`<div class="savebar" role="status">
      <span><b>●</b> You have unsaved changes</span>
      <span class="spacer"></span>
      <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save</button>
      <button ?disabled=${this._busy} @click=${() => this.discard()}>Discard</button>
    </div>`;
  }

  render() {
    const d = this._draft;
    if (!d) return html`<p class="muted">Loading…</p>`;
    const simple = this._mode === "simple";
    return html`
      <div class="toolbar">
        <h2 class="page-title">${simple ? "Settings" : "Settings: advanced"}</h2>
        <button type="button" @click=${() => this._setMode(simple ? "advanced" : "simple")}>
          ${simple ? "Advanced settings" : "Back to the simple view"}
        </button>
      </div>
      <section class="card away-card ${this.snapshot?.away?.active ? "on" : ""}">
        <boopli-away .hass=${this.hass} .snapshot=${this.snapshot}></boopli-away>
      </section>
      ${simple
        ? this._renderSimple()
        : html`
            <div class="cards advanced">
              <div class="slot s-speakers">
                <boopli-speakers
                  show="speakers"
                  class=${this._changed("speakers", "speech_template") ? "changed" : ""}
                  .hass=${this.hass}
                  .settings=${d}
                  @settings-patch=${(e: CustomEvent<Partial<Settings>>) => this._set(e.detail)}
                ></boopli-speakers>
              </div>
              <div class="slot s-general">${this._renderOther(d)}</div>
              <div class="slot s-quiet">${this._renderQuiet(d)}</div>
              <div class="slot s-phones">${this._renderPhones(d)}</div>
              <div class="slot s-lights">${this._renderLights(d)}</div>
              <div class="slot s-alarms">
                <boopli-speakers
                  show="devices"
                  class=${this._changed("alarm_devices") ? "changed" : ""}
                  .hass=${this.hass}
                  .settings=${d}
                  @settings-patch=${(e: CustomEvent<Partial<Settings>>) => this._set(e.detail)}
                ></boopli-speakers>
              </div>
              <div class="slot s-ai">${this._renderAi(d)}</div>
            </div>
            ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
            <div class="save">
              <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save settings</button>
              ${this._message ? html`<span class="muted">${this._message}</span>` : nothing}
            </div>
          `}
      ${this._renderSaveBar()}
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
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .page-title {
        font-size: 22px;
        margin: 0;
      }
      .away-card {
        margin-bottom: 16px;
      }
      .away-card.on {
        border: 2px solid var(--warning-color, #ffa600);
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(380px, 100%), 1fr));
        gap: 16px;
        align-items: start;
      }
      .cards.advanced {
        /* The browser balances the columns, so they end at about the same height
           and a short card is never pushed far down. */
        display: block;
        column-count: 3;
        column-gap: 16px;
      }
      .slot {
        break-inside: avoid;
        margin: 0 0 16px;
      }
      /* Narrow screens: one column, the most used cards first. */
      @media (max-width: 1100px) {
        .cards.advanced {
          display: flex;
          flex-direction: column;
          column-count: auto;
          gap: 16px;
        }
        .slot {
          margin: 0;
        }
        .s-general { order: 1; }
        .s-quiet { order: 2; }
        .s-phones { order: 3; }
        .s-lights { order: 4; }
        .s-speakers { order: 5; }
        .s-alarms { order: 6; }
        .s-ai { order: 7; }
      }
      .cards.simple {
        /* Cards in a row are the same height, and none is smaller than this. */
        grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
        grid-auto-rows: minmax(200px, auto);
        align-items: stretch;
      }
      .overview {
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
      }
      .overview h2 {
        margin: 0;
        font-size: 20px;
      }
      .emoji {
        display: inline-block;
        margin-right: 6px;
        font-size: 24px;
        vertical-align: -2px;
      }
      .summary {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        font-size: 15px;
      }
      .overview button {
        align-self: flex-start;
      }
      .spacer {
        flex: 1;
      }
      section.card {
        margin: 0;
      }
      section.card.changed,
      boopli-speakers.changed {
        border-color: var(--warning-color, #ffa600);
        box-shadow: inset 4px 0 0 var(--warning-color, #ffa600);
      }
      boopli-speakers[show="speakers"].changed::before {
        content: "● Unsaved changes in speakers";
        display: block;
        color: var(--warning-color, #ffa600);
        font-size: 13px;
        font-weight: 500;
        padding: 0 0 6px 4px;
      }
      boopli-speakers[show="devices"].changed::before {
        content: "● Unsaved changes in alarm devices";
        display: block;
        color: var(--warning-color, #ffa600);
        font-size: 13px;
        font-weight: 500;
        padding: 0 0 6px 4px;
      }
      .unsaved-badge {
        display: inline-block;
        margin-left: 8px;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 12px;
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
      .savebar b {
        color: var(--warning-color, #ffa600);
      }
      h2 {
        font-size: 18px;
        margin-bottom: 6px;
      }
      .small {
        font-size: 13px;
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
        font-size: 13px;
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
        font-size: 13px;
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
      .save {
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 8px 0 24px;
      }
    `,
  ];
}

customElements.define("boopli-settings", BoopliSettings);
