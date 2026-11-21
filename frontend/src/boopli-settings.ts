import { LitElement, html, css, nothing } from "lit";
import { errorMessage, saveSettings, testLight, testPhone } from "./api";
import { WEEKDAY_NAMES } from "./time";
import { sharedStyles } from "./styles";
import type {
  Hass,
  LightCfg,
  LightMode,
  NudgeStyle,
  PhoneLevel,
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
  { value: "auto", label: "Auto (flash if it can)" },
  { value: "flash", label: "Flash" },
  { value: "indicator", label: "Indicator lamp (on until done)" },
];

const STYLES: { value: NudgeStyle; label: string }[] = [
  { value: "quiet", label: "Quiet (no nudges)" },
  { value: "one", label: "One nudge" },
  { value: "escalating", label: "Escalating" },
  { value: "persistent", label: "Persistent" },
];

const DEFAULT_DAY: QuietDay = { start: "07:00", stop: "22:00" };
const FLASH_FEATURE = 8;

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
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare _draft?: Settings;
  declare _addLight: string;
  declare _busy: boolean;
  declare _message: string;
  declare _error: string;
  declare _notes: Record<string, string>;

  constructor() {
    super();
    this._addLight = "";
    this._busy = false;
    this._message = "";
    this._error = "";
    this._notes = {};
  }

  protected willUpdate(): void {
    // Take a copy of the saved settings once; edits stay local until Save.
    if (!this._draft && this.snapshot) {
      this._draft = structuredClone(this.snapshot.settings);
    }
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

  private _canFlash(entityId: string): boolean | undefined {
    const attrs = this.hass?.states[entityId]?.attributes;
    if (!attrs) return undefined;
    return (Number(attrs.supported_features ?? 0) & FLASH_FEATURE) !== 0;
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
    this._set({ phones: on ? [...rest, { service, level: "normal" }] : rest });
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
      const result = await testPhone(this.hass, { service, level });
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
      mode: "auto",
      color: [255, 90, 0],
    };
    this._set({ lights: [...this._draft.lights, light] });
    this._addLight = "";
  }

  private _setLightMode(entityId: string, mode: LightMode): void {
    if (!this._draft) return;
    this._set({
      lights: this._draft.lights.map((l) =>
        l.entity_id === entityId ? { ...l, mode } : l
      ),
    });
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
    if (!this.hass || !this._draft || this._busy) return;
    this._busy = true;
    this._error = "";
    this._message = "";
    try {
      await saveSettings(this.hass, this._draft);
      this._message = "Saved.";
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  // --- render ----------------------------------------------------------

  private _renderPhones(d: Settings) {
    const services = this._phoneServices();
    return html`
      <section class="card">
        <h2>Phones</h2>
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
      <section class="card">
        <h2>Lights</h2>
        <p class="muted small">
          A light that can flash flashes. One that cannot is used as an
          indicator lamp: it switches on in a color until you are done.
        </p>
        ${d.lights.map((light) => {
          const can = this._canFlash(light.entity_id);
          const note = this._notes[`light:${light.entity_id}`];
          return html`
            <div class="row">
              <div class="grow">
                <div>${this._friendly(light.entity_id)}</div>
                <div class="muted small">
                  ${can === undefined
                    ? "Not found right now"
                    : can
                      ? "Can flash"
                      : "Cannot flash, so it works as an indicator lamp"}
                </div>
              </div>
              <select
                aria-label="Light mode"
                .value=${light.mode}
                @change=${(e: Event) =>
                  this._setLightMode(light.entity_id, (e.target as HTMLSelectElement).value as LightMode)}
              >
                ${LIGHT_MODES.map(
                  (m) => html`<option value=${m.value} ?selected=${m.value === light.mode}>${m.label}</option>`
                )}
              </select>
              <button @click=${() => this._testLight(light)}>Test</button>
              <button aria-label="Remove light" @click=${() => this._removeLight(light.entity_id)}>✕</button>
            </div>
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
      <section class="card">
        <h2>Quiet hours</h2>
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
      <section class="card">
        <h2>Presence, snooze and defaults</h2>
        <div class="field">
          <label for="presence">Presence (optional)</label>
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

  render() {
    const d = this._draft;
    if (!d) return html`<p class="muted">Loading…</p>`;
    return html`
      ${this._renderPhones(d)} ${this._renderLights(d)} ${this._renderQuiet(d)}
      ${this._renderOther(d)}
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      <div class="save">
        <button class="primary" ?disabled=${this._busy} @click=${() => this._save()}>Save settings</button>
        ${this._message ? html`<span class="muted">${this._message}</span>` : nothing}
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      section.card {
        margin-bottom: 16px;
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
