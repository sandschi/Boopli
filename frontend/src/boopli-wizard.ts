import { LitElement, html, css, nothing } from "lit";
import { errorMessage, saveChore, saveSetup, saveSettings, testLight, testPhone } from "./api";
import { TEMPLATES } from "./templates";
import { sharedStyles } from "./styles";
import "./boopli-speakers";
import type { Hass, LightCfg, NudgeStyle, QuietDay, Settings, Snapshot } from "./types";

/** Every step of the full setup, in order. Guided setups in Settings use a part of it. */
export const ALL_SECTIONS = [
  "welcome",
  "phone",
  "quiet",
  "nudging",
  "lights",
  "speakers",
  "presence",
  "chores",
  "done",
] as const;
export type Section = (typeof ALL_SECTIONS)[number];

const TITLES: Record<Section, string> = {
  welcome: "Welcome",
  phone: "Your phone",
  quiet: "Quiet hours",
  nudging: "How Boopli nudges",
  lights: "Lights",
  speakers: "Speakers and alarms",
  presence: "Are you home?",
  chores: "First chores",
  done: "All set",
};

const STYLE_CHOICES: { value: NudgeStyle; label: string; text: string }[] = [
  { value: "one", label: "One nudge", text: "A single nudge, then quiet." },
  { value: "escalating", label: "Escalating", text: "Gets more frequent, then stops." },
  { value: "persistent", label: "Persistent", text: "Every 5 minutes until it is done." },
  { value: "quiet", label: "Quiet", text: "Only shown in Boopli, never nudges." },
];

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [0, 1, 2, 3, 4];
const WEEKEND = [5, 6];
const DEFAULT_QUIET: QuietDay = { start: "07:00", stop: "22:00" };

type QuietMode = "none" | "same" | "split" | "custom";

/**
 * The setup wizard: one question per screen, every step skippable, nothing is
 * sent to a device until you press Test. Answers are saved as you go, so
 * closing it halfway loses nothing.
 *
 * `sections` is what to walk through: all of them for the full setup, or one
 * or two for a guided setup of a single area from Settings.
 */
export class BoopliWizard extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    sections: { attribute: false },
    startAt: { type: String },
    _draft: { state: true },
    _index: { state: true },
    _busy: { state: true },
    _error: { state: true },
    _notes: { state: true },
    _picked: { state: true },
    _quietMode: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare sections: Section[];
  declare startAt: string;
  declare _draft?: Settings;
  declare _index: number;
  declare _busy: boolean;
  declare _error: string;
  declare _notes: Record<string, string>;
  declare _picked: string[]; // labels of the starter chores to add
  declare _quietMode: QuietMode;
  private _started = false;

  constructor() {
    super();
    this.sections = [...ALL_SECTIONS];
    this.startAt = "";
    this._index = 0;
    this._busy = false;
    this._error = "";
    this._notes = {};
    this._picked = [];
    this._quietMode = "none";
  }

  private get _full(): boolean {
    return this.sections.includes("welcome") && this.sections.includes("done");
  }

  private get _section(): Section {
    return this.sections[Math.min(this._index, this.sections.length - 1)];
  }

  protected willUpdate(): void {
    if (this._started || !this.snapshot) return;
    this._started = true;
    this._draft = structuredClone(this.snapshot.settings);
    const resume = this.sections.indexOf(this.startAt as Section);
    this._index = resume >= 0 ? resume : 0;
    this._picked = TEMPLATES.filter(
      (t) => !this.snapshot!.chores.some((c) => c.name === t.draft.name)
    ).map((t) => t.label);
    this._enter();
  }

  // --- helpers -----------------------------------------------------------

  private _set(patch: Partial<Settings>): void {
    if (this._draft) this._draft = { ...this._draft, ...patch };
  }

  private _friendly(entityId: string): string {
    const name = this.hass?.states[entityId]?.attributes?.friendly_name;
    return typeof name === "string" && name ? name : entityId;
  }

  private _note(key: string, text: string): void {
    this._notes = { ...this._notes, [key]: text };
  }

  private _phones(): string[] {
    const known = Object.keys(this.hass?.services?.notify ?? {}).filter((s) =>
      s.startsWith("mobile_app_")
    );
    const saved = this._draft?.phones.map((p) => p.service) ?? [];
    return [...new Set([...known, ...saved])].sort();
  }

  private _lights(): string[] {
    return Object.keys(this.hass?.states ?? {})
      .filter((id) => id.startsWith("light."))
      .sort((a, b) => this._friendly(a).localeCompare(this._friendly(b)));
  }

  private _persons(): string[] {
    return Object.keys(this.hass?.states ?? {})
      .filter((id) => id.startsWith("person."))
      .sort();
  }

  /** Called whenever a step is shown. */
  private _enter(): void {
    this._error = "";
    const d = this._draft;
    if (!d) return;
    if (this._section === "phone" && d.phones.length === 0) {
      const phones = this._phones();
      if (phones.length === 1) {
        this._set({ phones: [{ service: phones[0], level: "normal", start_at: 1 }] });
      }
    }
    if (this._section === "quiet") this._quietMode = this._detectQuiet(d);
  }

  // --- navigation ----------------------------------------------------------

  private _fresh(): void {
    // Drop what was changed on this screen (used by Skip).
    if (this.snapshot) this._draft = structuredClone(this.snapshot.settings);
  }

  private async _go(delta: 1 | -1, save: boolean): Promise<void> {
    if (!this.hass || !this._draft || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      const target = this._index + delta;
      if (delta === 1 && save) await saveSettings(this.hass, this._draft);
      if (delta === 1 && !save) {
        this._fresh();
        if (this._section === "chores") this._picked = []; // skipped: add none
      }
      if (this._full) {
        const next = this.sections[Math.min(target, this.sections.length - 1)];
        await saveSetup(this.hass, "in_progress", next);
      }
      this._index = Math.max(0, Math.min(target, this.sections.length - 1));
      this._enter();
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent("wizard-close", { bubbles: true, composed: true }));
  }

  private async _skipAll(): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    try {
      if (this._full) await saveSetup(this.hass, "skipped", this._section);
      this._close();
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private async _finish(): Promise<void> {
    if (!this.hass || !this._draft || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await saveSettings(this.hass, this._draft);
      if (this._full) {
        for (const t of TEMPLATES.filter((x) => this._picked.includes(x.label))) {
          // On demand: nothing nudges until you set a time or start it yourself.
          await saveChore(this.hass, {
            ...t.draft,
            repeat: { type: "none", time: "09:00", weekdays: [], every_n_days: 1 },
          });
        }
        await saveSetup(this.hass, "done", "");
      }
      this._close();
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  // --- quiet hours -----------------------------------------------------------

  private _sameDay(a: QuietDay | null | undefined, b: QuietDay | null | undefined): boolean {
    return (a?.start ?? "") === (b?.start ?? "") && (a?.stop ?? "") === (b?.stop ?? "");
  }

  private _detectQuiet(d: Settings): QuietMode {
    const qh = d.quiet_hours;
    if (!qh.enabled) return "none";
    const day = (i: number) => qh.days[String(i)] ?? null;
    if (DAYS.every((i) => day(i) && this._sameDay(day(i), day(0)))) return "same";
    if (
      WEEKDAYS.every((i) => day(i) && this._sameDay(day(i), day(0))) &&
      WEEKEND.every((i) => day(i) && this._sameDay(day(i), day(5)))
    )
      return "split";
    return "custom";
  }

  private _quiet(): Settings["quiet_hours"] {
    return this._draft!.quiet_hours;
  }

  private _setQuietMode(mode: QuietMode): void {
    if (!this._draft) return;
    this._quietMode = mode;
    if (mode === "none") {
      this._set({ quiet_hours: { ...this._quiet(), enabled: false } });
      return;
    }
    const days = this._quiet().days;
    const weekday = days["0"] ?? { ...DEFAULT_QUIET };
    const weekend = days["5"] ?? { ...weekday };
    this._applyQuiet(weekday, mode === "same" ? weekday : weekend);
  }

  private _applyQuiet(weekday: QuietDay, weekend: QuietDay): void {
    const days: Record<string, QuietDay | null> = {};
    for (const i of DAYS) days[String(i)] = { ...(WEEKEND.includes(i) ? weekend : weekday) };
    this._set({ quiet_hours: { enabled: true, days } });
  }

  private _editQuiet(which: "weekday" | "weekend", key: "start" | "stop", value: string): void {
    const days = this._quiet().days;
    const weekday = { ...(days["0"] ?? DEFAULT_QUIET) };
    const weekend = { ...(days["5"] ?? weekday) };
    if (this._quietMode === "same") {
      weekday[key] = value;
      this._applyQuiet(weekday, { ...weekday });
    } else if (which === "weekday") {
      weekday[key] = value;
      this._applyQuiet(weekday, weekend);
    } else {
      weekend[key] = value;
      this._applyQuiet(weekday, weekend);
    }
  }

  // --- tests -----------------------------------------------------------------

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

  // --- screens ---------------------------------------------------------------

  private _renderWelcome(d: Settings) {
    return html`
      <p>
        Boopli breaks chores into small steps and nudges you with the lights, speakers and phone
        you already have. A few quick questions, and you can skip any of them. Nothing leaves your
        home.
      </p>
      <div class="field">
        <label for="petname">What should your pet be called?</label>
        <input
          id="petname"
          maxlength="30"
          .value=${d.pet_name ?? "Boopli"}
          @input=${(e: Event) => this._set({ pet_name: (e.target as HTMLInputElement).value })}
        />
      </div>
    `;
  }

  private _renderPhone(d: Settings) {
    const phones = this._phones();
    return html`
      <p>
        Which phone should get Boopli's notifications? They have <b>Done</b> and <b>Snooze</b>
        buttons, so you can answer without opening anything.
      </p>
      ${phones.length === 0
        ? html`<p class="muted">
            No phone with the Home Assistant app found. Install the app and sign in, then come back
            here from Settings. You can skip this for now.
          </p>`
        : phones.map((service) => {
            const cfg = d.phones.find((p) => p.service === service);
            const note = this._notes[`phone:${service}`];
            return html`<div class="choice">
              <label class="inline">
                <input
                  type="checkbox"
                  .checked=${!!cfg}
                  @change=${(e: Event) => {
                    const on = (e.target as HTMLInputElement).checked;
                    const rest = d.phones.filter((p) => p.service !== service);
                    this._set({
                      phones: on ? [...rest, { service, level: "normal", start_at: 1 }] : rest,
                    });
                  }}
                />
                ${service.replace("mobile_app_", "")}
              </label>
              <button type="button" @click=${() => this._testPhone(service)}>Send a test</button>
              ${note ? html`<div class="muted small">${note}</div>` : nothing}
            </div>`;
          })}
    `;
  }

  private _renderQuiet(d: Settings) {
    const mode = this._quietMode;
    const days = d.quiet_hours.days;
    const weekday = days["0"] ?? DEFAULT_QUIET;
    const weekend = days["5"] ?? weekday;
    const times = (label: string, which: "weekday" | "weekend", day: QuietDay) => html`
      <div class="times">
        <span>${label}</span>
        <input
          type="time"
          aria-label="${label} from"
          .value=${day.start}
          @input=${(e: Event) => this._editQuiet(which, "start", (e.target as HTMLInputElement).value)}
        />
        <span class="muted">until</span>
        <input
          type="time"
          aria-label="${label} until"
          .value=${day.stop}
          @input=${(e: Event) => this._editQuiet(which, "stop", (e.target as HTMLInputElement).value)}
        />
      </div>
    `;
    const radio = (value: QuietMode, label: string) => html`<label class="inline option">
      <input
        type="radio"
        name="quiet"
        .checked=${mode === value}
        @change=${() => this._setQuietMode(value)}
      />
      ${label}
    </label>`;
    return html`
      <p>Should Boopli stay quiet at certain times, like at night? Nudges wait until it is allowed again.</p>
      ${radio("none", "No, nudge me any time")}
      ${radio("same", "Yes, the same every day")}
      ${radio("split", "Yes, different on weekdays and weekends")}
      ${mode === "custom"
        ? html`<p class="muted small">
            You have custom hours for each day. They stay as they are; change them in Settings.
          </p>`
        : nothing}
      ${mode === "same"
        ? html`<p class="muted small">Boopli may nudge you:</p>${times("Every day", "weekday", weekday)}`
        : nothing}
      ${mode === "split"
        ? html`<p class="muted small">Boopli may nudge you:</p>
            ${times("Mon to Fri", "weekday", weekday)} ${times("Sat and Sun", "weekend", weekend)}`
        : nothing}
      <p class="muted small">A chore can opt out later, for example pills.</p>
    `;
  }

  private _renderNudging(d: Settings) {
    return html`
      <div class="field">
        <label for="snooze">When you press Snooze, how many minutes until the next nudge?</label>
        <div class="chips">
          ${[5, 10, 15, 30].map(
            (m) => html`<button
              type="button"
              class="chip ${d.snooze_minutes === m ? "on" : ""}"
              @click=${() => this._set({ snooze_minutes: m })}
            >
              ${m} min
            </button>`
          )}
          <input
            id="snooze"
            class="short"
            type="number"
            min="1"
            max="720"
            .value=${String(d.snooze_minutes)}
            @input=${(e: Event) =>
              this._set({ snooze_minutes: Number((e.target as HTMLInputElement).value) || 15 })}
          />
        </div>
      </div>
      <p>How should new chores nudge you, unless you say otherwise?</p>
      ${STYLE_CHOICES.map(
        (s) => html`<label class="inline option">
          <input
            type="radio"
            name="style"
            .checked=${d.default_style === s.value}
            @change=${() => this._set({ default_style: s.value })}
          />
          <span><b>${s.label}</b> <span class="muted small">${s.text}</span></span>
        </label>`
      )}
    `;
  }

  private _renderLights(d: Settings) {
    const lights = this._lights();
    return html`
      <p>
        Want a light to blink when a step is your turn? Pick the ones you would notice. This is
        optional.
      </p>
      ${lights.length === 0
        ? html`<p class="muted">No lights found.</p>`
        : lights.map((id) => {
            const cfg = d.lights.find((l) => l.entity_id === id);
            const note = this._notes[`light:${id}`];
            return html`<div class="choice">
              <label class="inline">
                <input
                  type="checkbox"
                  .checked=${!!cfg}
                  @change=${(e: Event) => {
                    const on = (e.target as HTMLInputElement).checked;
                    const rest = d.lights.filter((l) => l.entity_id !== id);
                    const light: LightCfg = {
                      entity_id: id,
                      mode: "blink",
                      color: [255, 90, 0],
                      blink_ms: 1500,
                      repeats: 1,
                      gap_ms: 1000,
                      start_at: 1,
                    };
                    this._set({ lights: on ? [...rest, light] : rest });
                  }}
                />
                ${this._friendly(id)}
              </label>
              ${cfg
                ? html`<button type="button" @click=${() => this._testLight(cfg)}>Test</button>`
                : nothing}
              ${note ? html`<div class="muted small">${note}</div>` : nothing}
            </div>`;
          })}
      <p class="muted small">Blink length, color and more are in Settings.</p>
    `;
  }

  private _renderSpeakers(d: Settings) {
    return html`
      <p>
        Optional: a speaker can play a small ding, say the step out loud, or sound an alarm if you
        keep ignoring it. You can also add a siren or a switch as an alarm. Skip this if you only
        want lights and your phone.
      </p>
      <boopli-speakers
        .hass=${this.hass}
        .settings=${d}
        @settings-patch=${(e: CustomEvent<Partial<Settings>>) => {
          e.stopPropagation();
          this._set(e.detail);
        }}
      ></boopli-speakers>
    `;
  }

  private _renderPresence(d: Settings) {
    return html`
      <p>
        If Boopli knows whether you are home, it nudges your lights and speakers only when you are
        there, and only your phone when you are away. This is optional. Without it, Boopli assumes
        you are home.
      </p>
      <div class="field">
        <label for="presence">Which person are you?</label>
        <select
          id="presence"
          @change=${(e: Event) =>
            this._set({ presence_entity: (e.target as HTMLSelectElement).value })}
        >
          <option value="" ?selected=${d.presence_entity === ""}>Skip (assume I am home)</option>
          ${this._persons().map(
            (id) =>
              html`<option value=${id} ?selected=${id === d.presence_entity}>${this._friendly(id)}</option>`
          )}
        </select>
      </div>
    `;
  }

  private _renderChores() {
    const existing = new Set(this.snapshot?.chores.map((c) => c.name));
    return html`
      <p>
        Some chores to start with. Untick what you do not want. They are added without a schedule,
        so nothing nudges you until you set a time (in the Chores tab) or start one yourself.
      </p>
      ${TEMPLATES.map((t) => {
        const taken = existing.has(t.draft.name);
        return html`<label class="inline option">
          <input
            type="checkbox"
            ?disabled=${taken}
            .checked=${!taken && this._picked.includes(t.label)}
            @change=${(e: Event) => {
              const on = (e.target as HTMLInputElement).checked;
              this._picked = on
                ? [...this._picked, t.label]
                : this._picked.filter((l) => l !== t.label);
            }}
          />
          <span>
            <b>${t.draft.name}</b>
            <span class="muted small">
              ${taken ? "already added" : t.draft.steps.map((s) => s.title).join(" → ")}
            </span>
          </span>
        </label>`;
      })}
    `;
  }

  private _renderDone(d: Settings) {
    const lines: string[] = [];
    if (this._full) lines.push(`Your pet: ${d.pet_name}`);
    lines.push(
      d.phones.length ? `Phone notifications: ${d.phones.length}` : "Phone notifications: none yet"
    );
    lines.push(d.quiet_hours.enabled ? "Quiet hours: on" : "Quiet hours: off");
    lines.push(`Snooze ${d.snooze_minutes} min, default style: ${d.default_style}`);
    lines.push(`Lights: ${d.lights.length}, speakers: ${d.speakers.length}, alarm devices: ${d.alarm_devices.length}`);
    const adding = TEMPLATES.filter((t) => this._picked.includes(t.label)).map((t) => t.draft.name);
    if (this._full) lines.push(adding.length ? `Adding chores: ${adding.join(", ")}` : "No chores added");
    return html`
      <p>That is it. Here is what is set:</p>
      <ul>
        ${lines.map((l) => html`<li>${l}</li>`)}
      </ul>
      <p class="muted small">
        Everything can be changed in Settings, and each part has a Guided setup button there.
      </p>
    `;
  }

  private _renderStep(d: Settings) {
    switch (this._section) {
      case "welcome":
        return this._renderWelcome(d);
      case "phone":
        return this._renderPhone(d);
      case "quiet":
        return this._renderQuiet(d);
      case "nudging":
        return this._renderNudging(d);
      case "lights":
        return this._renderLights(d);
      case "speakers":
        return this._renderSpeakers(d);
      case "presence":
        return this._renderPresence(d);
      case "chores":
        return this._renderChores();
      default:
        return this._renderDone(d);
    }
  }

  render() {
    const d = this._draft;
    if (!d) return html`<p class="muted">Loading…</p>`;
    const section = this._section;
    const last = section === "done" || this._index >= this.sections.length - 1;
    const counted = this.sections.filter((s) => s !== "done").length;
    const showBar = section !== "done" && counted > 1;
    const sectionOnlyEnd = !this._full && last;
    return html`
      <section class="card wizard">
        <div class="top">
          ${showBar
            ? html`<span class="muted small">Step ${this._index + 1} of ${counted}</span>`
            : html`<span></span>`}
          ${section === "done" && this._full
            ? nothing
            : html`<button type="button" class="link" ?disabled=${this._busy} @click=${() => this._skipAll()}>
                ${this._full ? "Skip for now" : "Close"}
              </button>`}
        </div>
        ${showBar
          ? html`<div class="bar"><div class="fill" style="width:${((this._index + 1) / counted) * 100}%"></div></div>`
          : nothing}
        <h2>${TITLES[section]}</h2>
        ${this._renderStep(d)}
        ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
        <div class="actions">
          ${this._index > 0
            ? html`<button type="button" ?disabled=${this._busy} @click=${() => this._go(-1, false)}>Back</button>`
            : nothing}
          <span class="spacer"></span>
          ${section === "done" || sectionOnlyEnd
            ? html`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._finish()}>
                ${section === "done" ? "Finish" : "Save and close"}
              </button>`
            : html`
                <button type="button" ?disabled=${this._busy} @click=${() => this._go(1, false)}>Skip</button>
                <button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._go(1, true)}>Next</button>
              `}
        </div>
      </section>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .wizard {
        padding: 20px;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 4px 6px;
      }
      .bar {
        height: 6px;
        border-radius: 999px;
        background: var(--secondary-background-color);
        overflow: hidden;
        margin-bottom: 16px;
      }
      .fill {
        height: 100%;
        background: var(--primary-color);
        transition: width 0.3s ease;
      }
      h2 {
        margin-bottom: 12px;
      }
      p {
        margin: 10px 0;
        line-height: 1.45;
      }
      .small {
        font-size: 13px;
      }
      .field {
        margin: 14px 0;
      }
      .choice {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        border-top: 1px solid var(--divider-color);
      }
      .choice .inline {
        flex: 1;
        min-width: 160px;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      label.option {
        padding: 10px 0;
        border-top: 1px solid var(--divider-color);
      }
      .times {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin: 8px 0;
      }
      .times > span:first-child {
        min-width: 90px;
      }
      .times input {
        width: auto;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      input.short {
        width: 84px;
      }
      .actions {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 22px;
      }
      .actions button {
        min-width: 84px;
        min-height: 46px;
      }
      .spacer {
        flex: 1;
      }
      ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      li {
        margin: 4px 0;
      }
    `,
  ];
}

customElements.define("boopli-wizard", BoopliWizard);
