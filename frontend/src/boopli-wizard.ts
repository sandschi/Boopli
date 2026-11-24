import { LitElement, html, css, nothing } from "lit";
import {
  aiSteps,
  errorMessage,
  saveChore,
  saveSetup,
  saveSettings,
  testAlarmDevice,
  testLight,
  testPhone,
  testSpeaker,
} from "./api";
import { diffSettings } from "./diff";
import {
  ALARM_DOMAINS,
  DEFAULT_QUIET_DAY,
  describeSpeaker,
  entityIds,
  friendlyName,
  hexToRgb,
  lightHasColor,
  newLadderId,
  newAlarmDevice,
  newLight,
  newSpeaker,
  phoneName,
  rgbToHex,
  speechTargets,
} from "./helpers";
import "./boopli-pet-picker";
import "./boopli-rung";
import { boardLink, starterTiles } from "./wall-tiles";
import { sharedStyles } from "./styles";
import { TEMPLATES } from "./templates";
import { WEEKDAY_NAMES } from "./time";
import type {
  AlarmDeviceCfg,
  Hass,
  Ladder,
  LightCfg,
  NudgeStyle,
  Rung,
  PhoneCfg,
  PhoneLevel,
  QuietDay,
  Settings,
  Snapshot,
  SoundCfg,
  SoundKind,
  SpeakerCfg,
  SpeakerLevel,
  SpeechRoute,
  Board,
} from "./types";

/** The wizards. "first" is the first-run setup; the others each set up one area. */
export type WizardId =
  | "first"
  | "phone"
  | "quiet"
  | "lights"
  | "speakers"
  | "alarms"
  | "presence"
  | "nudging"
  | "pet"
  | "ai"
  | "ladders"
  | "wall";

type StepId =
  | "welcome"
  | "phone"
  | "phone_detail"
  | "quiet"
  | "nudging"
  | "lights"
  | "lights_detail"
  | "speaker_gate"
  | "spk_pick"
  | "spk_ding"
  | "spk_speech"
  | "spk_alarm"
  | "spk_when"
  | "alarm_devices"
  | "alarm_detail"
  | "presence"
  | "pet"
  | "ai_intro"
  | "ai_agent"
  | "chores"
  | "lad_start"
  | "lad_name"
  | "lad_nudge"
  | "lad_more"
  | "lad_end"
  | "lad_delete"
  | "wall_start"
  | "done";

const SEQUENCES: Record<WizardId, StepId[]> = {
  first: ["welcome", "phone", "quiet", "nudging", "lights", "speaker_gate", "presence", "chores", "done"],
  phone: ["phone", "phone_detail", "done"],
  quiet: ["quiet", "done"],
  lights: ["lights", "lights_detail", "done"],
  speakers: ["spk_pick", "spk_ding", "spk_speech", "spk_alarm", "spk_when", "done"],
  alarms: ["alarm_devices", "alarm_detail", "done"],
  presence: ["presence", "done"],
  nudging: ["nudging", "done"],
  pet: ["pet", "done"],
  ai: ["ai_intro", "ai_agent", "done"],
  ladders: ["lad_start", "done"], // the rest depends on what you want to do (see _startLadderWork)
  wall: ["wall_start", "done"],
};

/** What "Set up speakers" adds to the first-run setup. */
const SPEAKER_STEPS: StepId[] = ["spk_pick", "spk_ding", "spk_speech", "spk_alarm", "alarm_devices"];

export const WIZARD_TITLES: Record<WizardId, string> = {
  first: "First setup",
  phone: "Phone setup",
  quiet: "Quiet hours setup",
  lights: "Reminder lights setup",
  speakers: "Speaker setup",
  alarms: "Alarm devices setup",
  presence: "Where you are",
  nudging: "Snooze and style",
  pet: "Your pet",
  ai: "AI help setup",
  ladders: "Nudge it your way",
  wall: "Wall board",
};

const MAX_BOARDS = 10; // the most boards (the same as in the board editor)
const MAX_LADDERS = 20; // the most ladders (the same as in the ladder editor)

const TITLES: Record<StepId, string> = {
  welcome: "Welcome",
  phone: "Your phone",
  phone_detail: "Phone details",
  quiet: "Quiet hours",
  nudging: "Snooze and style",
  lights: "Reminder lights",
  lights_detail: "Light details",
  speaker_gate: "Speaker reminders",
  spk_pick: "Pick a speaker",
  spk_ding: "A small ding",
  spk_speech: "A spoken sentence",
  spk_alarm: "An alarm sound",
  spk_when: "When it joins in",
  alarm_devices: "Alarm devices",
  alarm_detail: "Alarm device details",
  presence: "Where you are",
  pet: "Your pet",
  ai_intro: "AI help",
  ai_agent: "Your AI agent",
  chores: "First chores",
  lad_start: "What do you want to do?",
  lad_name: "Name your ladder",
  lad_nudge: "A nudge",
  lad_more: "Another nudge?",
  lad_end: "How it ends",
  lad_delete: "Delete a ladder",
  wall_start: "Which board?",
  done: "All set",
};

const OPTIONAL_STEPS: StepId[] = ["phone_detail", "lights_detail", "spk_when", "alarm_detail"];

const STYLE_CHOICES: { value: NudgeStyle; label: string; text: string }[] = [
  { value: "one", label: "One nudge", text: "A single nudge, then quiet." },
  { value: "escalating", label: "Escalating", text: "Gets more frequent, then stops." },
  { value: "persistent", label: "Persistent", text: "Every 5 minutes until it is done." },
  { value: "quiet", label: "Quiet", text: "Only shown in Boopli, never nudges." },
];

const LEVELS: { value: PhoneLevel; label: string }[] = [
  { value: "normal", label: "Normal notification" },
  { value: "high", label: "High priority (pops up)" },
  { value: "alarm", label: "Alarm volume" },
  { value: "alarm_max", label: "Max volume (not on every phone)" },
];

const ROUTES: { value: SpeechRoute; label: string }[] = [
  { value: "alexa_media", label: "Alexa Media Player" },
  { value: "alexa_devices", label: "Alexa Devices (notify entity)" },
  { value: "tts", label: "A TTS voice on this speaker" },
];

const SOUND_KINDS: { value: SoundKind; label: string }[] = [
  { value: "alexa", label: "Alexa sound" },
  { value: "file", label: "File in my media folder" },
];

const SOUND_LIBRARY_URL =
  "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html";
const DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * A wizard: one question per screen, a rail of the steps on the left, every
 * step skippable, and nothing is sent to a device until you press Test.
 * Answers are saved as you go. The last screen lists exactly what changed.
 */
export class BoopliWizard extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    wizard: { type: String },
    startAt: { type: String },
    _draft: { state: true },
    _steps: { state: true },
    _index: { state: true },
    _busy: { state: true },
    _error: { state: true },
    _notes: { state: true },
    _picked: { state: true },
    _speaker: { state: true },
    _addDevice: { state: true },
    _ladderId: { state: true },
    _ladderName: { state: true },
    _ladderAction: { state: true },
    _ladderPick: { state: true },
    _boardId: { state: true },
    _boardName: { state: true },
    _boardPick: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare wizard: WizardId;
  declare startAt: string;
  declare _draft?: Settings;
  declare _steps: StepId[];
  declare _index: number;
  declare _busy: boolean;
  declare _error: string;
  declare _notes: Record<string, string>;
  declare _picked: string[]; // labels of the starter chores to add
  declare _speaker: string; // entity id of the speaker being set up
  declare _addDevice: string;
  declare _ladderId: string; // the ladder this wizard is building
  declare _ladderName: string;
  declare _ladderAction: "create" | "edit" | "delete";
  declare _ladderPick: string; // the ladder to edit or delete
  declare _boardId: string; // the board this guide works on
  declare _boardName: string; // the name for a new board
  declare _boardPick: string; // the board to work on, empty = a new one
  declare _createdId: string; // the ladder this guide made (going back must not make a second one)
  private _started = false;
  private _saved?: Settings; // what is saved right now
  private _baseline?: Settings; // what it was when this wizard opened

  constructor() {
    super();
    this.wizard = "first";
    this.startAt = "";
    this._steps = [];
    this._index = 0;
    this._busy = false;
    this._error = "";
    this._notes = {};
    this._picked = [];
    this._speaker = "";
    this._addDevice = "";
    this._ladderId = "";
    this._ladderName = "";
    this._ladderAction = "create";
    this._ladderPick = "";
    this._createdId = "";
    this._boardId = "";
    this._boardName = "";
    this._boardPick = "";
  }

  private get _first(): boolean {
    return this.wizard === "first";
  }

  private get _step(): StepId {
    return this._steps[Math.min(this._index, this._steps.length - 1)] ?? "done";
  }

  protected willUpdate(): void {
    if (this._started || !this.snapshot) return;
    this._started = true;
    this._saved = structuredClone(this.snapshot.settings);
    this._baseline = structuredClone(this.snapshot.settings);
    this._draft = structuredClone(this.snapshot.settings);
    this._steps = [...SEQUENCES[this.wizard]];
    const resume = this.startAt as StepId;
    if (this._first && SPEAKER_STEPS.includes(resume)) {
      const gate = this._steps.indexOf("speaker_gate");
      this._steps.splice(gate + 1, 0, ...SPEAKER_STEPS);
    }
    const at = this._steps.indexOf(resume);
    this._index = at >= 0 ? at : 0;
    this._picked = TEMPLATES.filter(
      (t) => !this.snapshot!.chores.some((c) => c.name === t.draft.name)
    ).map((t) => t.label);
    if (this.snapshot.settings.speakers.length === 1) {
      this._speaker = this.snapshot.settings.speakers[0].entity_id;
    }
    this._enter();
  }

  // --- helpers -----------------------------------------------------------

  private _set(patch: Partial<Settings>): void {
    if (this._draft) this._draft = { ...this._draft, ...patch };
  }

  private _note(key: string, text: string): void {
    this._notes = { ...this._notes, [key]: text };
  }

  private _fn(id: string): string {
    return friendlyName(this.hass, id);
  }

  private _phones(): string[] {
    const known = Object.keys(this.hass?.services?.notify ?? {}).filter((s) =>
      s.startsWith("mobile_app_")
    );
    const saved = this._draft?.phones.map((p) => p.service) ?? [];
    return [...new Set([...known, ...saved])].sort();
  }

  private _num(raw: string, min: number, max: number): number | undefined {
    const value = Math.round(Number(raw));
    if (raw.trim() === "" || Number.isNaN(value)) return undefined;
    return Math.min(max, Math.max(min, value));
  }

  /** A labelled number field that keeps its value inside a range. */
  private _numField(
    label: string,
    value: number,
    min: number,
    max: number,
    onChange: (n: number) => void,
    step = 1
  ) {
    return html`<label class="num">
      ${label}
      <input
        type="number"
        min=${min}
        max=${max}
        step=${step}
        .value=${String(value)}
        @change=${(e: Event) => {
          const n = this._num((e.target as HTMLInputElement).value, min, max);
          if (n !== undefined) onChange(n);
        }}
      />
    </label>`;
  }

  private _currentSpeaker(): SpeakerCfg | undefined {
    return this._draft?.speakers.find((s) => s.entity_id === this._speaker);
  }

  private _patchSpeaker(fn: (s: SpeakerCfg) => SpeakerCfg): void {
    if (!this._draft) return;
    this._set({
      speakers: this._draft.speakers.map((s) => (s.entity_id === this._speaker ? fn(s) : s)),
    });
  }

  private _patchSound(which: "cue" | "alarm", patch: Partial<SoundCfg>): void {
    this._patchSpeaker((s) => ({ ...s, [which]: { ...s[which], ...patch } }));
  }

  /** Called whenever a step is shown. */
  private _enter(): void {
    this._error = "";
    const d = this._draft;
    if (!d) return;
    if (this._step === "phone" && d.phones.length === 0) {
      const phones = this._phones();
      if (phones.length === 1) {
        this._set({ phones: [{ service: phones[0], level: "normal", start_at: 1 }] });
      }
    }
  }

  // --- navigation ----------------------------------------------------------

  private async _go(delta: 1 | -1, mode: "next" | "skip" | "gate" | "more" = "next"): Promise<void> {
    if (!this.hass || !this._draft || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      if (delta === 1 && mode === "next") {
        if (this._step === "spk_pick" && !this._speaker) {
          throw new Error("Pick a speaker, or press Skip.");
        }
        if (this._step === "lad_start") this._startLadderWork();
        if (this._step === "wall_start") this._startBoardWork();
        if (this._step === "lad_name") this._ensureLadder();
        const sent = structuredClone(this._draft);
        await saveSettings(this.hass, sent);
        this._saved = sent;
      }
      if (delta === 1 && mode === "skip") {
        // Skip: drop what was changed on this screen.
        this._draft = structuredClone(this._saved!);
        if (this._step === "chores") this._picked = [];
      }
      if (mode === "more") {
        // "Add another nudge": one more screen for it, unless it is already there (after going back).
        if (this._steps[this._index + 1] !== "lad_nudge") {
          this._steps = [
            ...this._steps.slice(0, this._index + 1),
            "lad_nudge",
            "lad_more",
            ...this._steps.slice(this._index + 1),
          ];
        }
        this._rungAt(this._nudgesBefore(this._index + 1));
      }
      if (mode === "gate") {
        this._steps = [
          ...this._steps.slice(0, this._index + 1),
          ...SPEAKER_STEPS,
          ...this._steps.slice(this._index + 1),
        ];
      }
      const target = Math.max(0, Math.min(this._index + delta, this._steps.length - 1));
      if (this._steps[target] === "lad_nudge") this._rungAt(this._nudgesBefore(target));
      if (this._first) await saveSetup(this.hass, "in_progress", this._steps[target]);
      this._index = target;
      this._enter();
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _jump(index: number): void {
    if (this._busy || index >= this._index) return; // only back to steps already seen
    this._index = index;
    this._enter();
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent("wizard-close", { bubbles: true, composed: true }));
  }

  private async _leave(): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    try {
      if (this._first) await saveSetup(this.hass, "skipped", this._step);
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
      if (this._first) {
        for (const t of TEMPLATES.filter((x) => this._picked.includes(x.label))) {
          // On demand: nothing nudges until you set a time or start it yourself.
          await saveChore(this.hass, {
            ...t.draft,
            repeat: { type: "none", time: "09:00", every_n_days: 1, days: {} },
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

  // --- a ladder of your own -------------------------------------------------------

  private _ladder(): Ladder | undefined {
    return this._draft?.ladders?.find((l) => l.id === this._ladderId);
  }

  /** How many nudge screens come before step `index` (so which nudge a screen is for). */
  private _nudgesBefore(index: number): number {
    return this._steps.slice(0, index).filter((s) => s === "lad_nudge").length;
  }

  private _newRung(): Rung {
    return {
      gap: 5,
      phones: Object.fromEntries((this._draft?.phones ?? []).map((p) => [p.service, p.level])),
      lights: {},
      speakers: {},
      alarms: [],
    };
  }

  private _patchLadder(fn: (l: Ladder) => Ladder): void {
    const d = this._draft;
    if (!d) return;
    this._set({ ladders: (d.ladders ?? []).map((l) => (l.id === this._ladderId ? fn(l) : l)) });
  }

  // --- the wall board -------------------------------------------------------------------

  private _board(): Board | undefined {
    return this._draft?.boards?.find((b) => b.id === this._boardId);
  }

  /** Called when leaving the first screen of the wall guide: pick the board, or make a new one. */
  private _startBoardWork(): void {
    const d = this._draft;
    if (!d) return;
    const boards = d.boards ?? [];
    if (this._boardPick) {
      const b = boards.find((x) => x.id === this._boardPick);
      if (!b) throw new Error("Pick a board first.");
      this._boardId = b.id;
      return;
    }
    const name = this._boardName.trim();
    if (!name) throw new Error("Give the new board a name.");
    if (boards.length >= MAX_BOARDS) throw new Error(`You have ${MAX_BOARDS} boards, the most. Edit or delete one.`);
    if (boards.some((b) => b.name.toLowerCase() === name.toLowerCase())) throw new Error(`There is already a board called "${name}".`);
    const board: Board = { id: newLadderId(), name, columns: 16, rows: 9, night: "dim", tiles: starterTiles(16, 9) };
    this._boardId = board.id;
    this._boardPick = board.id; // going back and forward again goes on with this board, not a second one
    this._set({ boards: [...boards, board] });
  }

  private _renderWallStart(d: Settings) {
    const boards = d.boards ?? [];
    return html`
      <p>A board is a grid of tiles for a screen on the wall: the clock, the pet, what is due, the weather and more.</p>
      <div class="field">
        <label for="boardpick">Which board?</label>
        <select id="boardpick" @change=${(e: Event) => (this._boardPick = (e.target as HTMLSelectElement).value)}>
          <option value="" ?selected=${!this._boardPick}>A new board</option>
          ${boards.map((b) => html`<option value=${b.id} ?selected=${this._boardPick === b.id}>${b.name}</option>`)}
        </select>
      </div>
      ${this._boardPick
        ? nothing
        : html`<div class="field">
            <label for="boardname">Name of the new board</label>
            <input id="boardname" maxlength="40" .value=${this._boardName} @input=${(e: Event) => (this._boardName = (e.target as HTMLInputElement).value)} />
          </div>`}
    `;
  }

  /** Called when leaving the first screen: the rest of the guide depends on what you want to do. */
  private _startLadderWork(): void {
    const ladders = this._draft?.ladders ?? [];
    if (this._ladderAction === "create") {
      const made = ladders.find((l) => l.id === this._createdId);
      if (made) {
        // Back to the first screen and forward again: go on with the ladder made here, not a second one.
        this._ladderId = made.id;
        this._ladderName = made.name;
        this._steps = ["lad_start", "lad_name", ...made.rungs.map((): StepId => "lad_nudge"), "lad_more", "lad_end", "done"];
        return;
      }
      if (ladders.length >= MAX_LADDERS) throw new Error(`You have ${MAX_LADDERS} ladders, the most. Edit or delete one.`);
      this._ladderId = "";
      this._ladderName = "";
      this._steps = ["lad_start", "lad_name", "lad_nudge", "lad_more", "lad_end", "done"];
      return;
    }
    const pick = this._ladderPick || (ladders.length === 1 ? ladders[0].id : "");
    const ladder = ladders.find((l) => l.id === pick);
    if (!ladder) throw new Error("Pick a ladder first.");
    this._ladderPick = ladder.id;
    this._ladderId = ladder.id;
    this._ladderName = ladder.name;
    this._steps =
      this._ladderAction === "edit"
        ? ["lad_start", "lad_name", ...ladder.rungs.map((): StepId => "lad_nudge"), "lad_more", "lad_end", "done"]
        : ["lad_start", "lad_delete", "done"];
  }

  /** Take the nudge of this screen out of the ladder (and the screen out of the guide). */
  private _removeNudge(index: number): void {
    const l = this._ladder();
    if (!l || l.rungs.length < 2) return;
    this._patchLadder((x) => ({ ...x, rungs: x.rungs.filter((_, i) => i !== index) }));
    this._steps = this._steps.filter((_, i) => i !== this._index);
    this._index = Math.min(this._index, this._steps.length - 1);
  }

  /** Delete the picked ladder, unless chores use it or it is the style for new chores. */
  private async _deleteLadder(): Promise<void> {
    const l = this._ladder();
    const d = this._draft;
    if (!l || !d) return;
    const style = `ladder:${l.id}`;
    const users = (this.snapshot?.chores ?? []).filter((c) => c.nudge_style === style).map((c) => c.name).sort();
    if (users.length) {
      this._error = `"${l.name}" is used by ${users.join(", ")}. Pick another nudge style for them first.`;
      return;
    }
    if (d.default_style === style) {
      this._error = `"${l.name}" is the style for new chores. Choose another one for new chores first.`;
      return;
    }
    const before = d;
    this._set({ ladders: (d.ladders ?? []).filter((x) => x.id !== l.id) });
    await this._go(1);
    if (this._error) this._draft = before; // not saved: keep the ladder, so you can try again
  }

  /** Called when leaving the name screen: make the ladder (or rename it). */
  private _ensureLadder(): void {
    const d = this._draft;
    if (!d) return;
    const name = this._ladderName.trim();
    if (!name) throw new Error("Give the ladder a name.");
    if (this._ladder()) {
      this._patchLadder((l) => ({ ...l, name }));
      return;
    }
    if ((d.ladders ?? []).length >= MAX_LADDERS) throw new Error(`You have ${MAX_LADDERS} ladders, the most. Edit or delete one.`);
    const id = newLadderId();
    this._ladderId = id;
    this._createdId = id;
    this._set({ ladders: [...(d.ladders ?? []), { id, name, rungs: [this._newRung()], repeat_last: false }] });
  }

  /** Make sure the ladder has a nudge number `n` (a copy of the last one). */
  private _rungAt(n: number): void {
    const l = this._ladder();
    if (!l || n < l.rungs.length) return;
    this._patchLadder((x) => {
      const rungs = [...x.rungs];
      while (rungs.length <= n) rungs.push(structuredClone(rungs[rungs.length - 1] ?? this._newRung()));
      return { ...x, rungs };
    });
  }

  private _setRung(index: number, rung: Rung): void {
    this._patchLadder((l) => ({ ...l, rungs: l.rungs.map((r, i) => (i === index ? rung : r)) }));
  }

  private _title(id: StepId, index: number): string {
    return id === "lad_nudge" ? `Nudge ${this._nudgesBefore(index) + 1}` : TITLES[id];
  }

  private _renderLadStart(d: Settings) {
    const ladders = d.ladders ?? [];
    const none = ladders.length === 0;
    const choice = (value: "create" | "edit" | "delete", label: string, text: string, disabled = false) => html`<label class="inline option">
      <input
        type="radio"
        name="ladact"
        .checked=${this._ladderAction === value}
        ?disabled=${disabled}
        @change=${() => (this._ladderAction = value)}
      />
      <span><b>${label}</b> <span class="muted small">${text}</span></span>
    </label>`;
    return html`
      ${choice("create", "Create a ladder", ladders.length >= MAX_LADDERS ? `You have ${MAX_LADDERS} ladders, the most.` : "A new list of nudges.", ladders.length >= MAX_LADDERS)}
      ${choice("edit", "Edit a ladder", none ? "You have no ladders yet." : "Change its name, its nudges or how it ends.", none)}
      ${choice("delete", "Delete a ladder", none ? "You have no ladders yet." : "Remove one you do not need any more.", none)}
      ${this._ladderAction !== "create" && !none
        ? html`<div class="field">
            <label for="ladpick">Which ladder?</label>
            <select id="ladpick" .value=${this._ladderPick} @change=${(e: Event) => (this._ladderPick = (e.target as HTMLSelectElement).value)}>
              <option value="" ?selected=${!this._ladderPick}>Pick a ladder…</option>
              ${ladders.map(
                (l) => html`<option value=${l.id} ?selected=${this._ladderPick === l.id}>
                  ${l.name} (${l.rungs.length} ${l.rungs.length === 1 ? "nudge" : "nudges"})
                </option>`
              )}
            </select>
          </div>`
        : nothing}
    `;
  }

  private _renderLadDelete() {
    const l = this._ladder();
    if (!l) return html`<p class="muted">Pick a ladder first.</p>`;
    const style = `ladder:${l.id}`;
    const users = (this.snapshot?.chores ?? []).filter((c) => c.nudge_style === style).map((c) => c.name).sort();
    return html`
      <p>Delete the ladder <b>${l.name}</b>? This cannot be undone.</p>
      ${users.length
        ? html`<p class="muted">It is used by ${users.join(", ")}. Pick another nudge style for them first, then come back.</p>`
        : nothing}
      <div class="gate">
        <button type="button" class="danger big" ?disabled=${this._busy || users.length > 0} @click=${() => this._deleteLadder()}>
          Delete this ladder
        </button>
      </div>
    `;
  }

  private _renderLadName() {
    return html`
      <p>
        A ladder is a list of nudges. For each nudge you choose how long Boopli waits, and exactly which devices act
        and how loud. Start by giving it a name.
      </p>
      <div class="field">
        <label for="ladname">Name</label>
        <input
          id="ladname"
          maxlength="40"
          placeholder="For example: Pills"
          .value=${this._ladderName}
          @input=${(e: Event) => (this._ladderName = (e.target as HTMLInputElement).value)}
        />
      </div>
    `;
  }

  private _renderLadNudge(d: Settings) {
    const i = this._nudgesBefore(this._index);
    const rung = this._ladder()?.rungs[i];
    if (!rung) return html`<p class="muted">Give the ladder a name first.</p>`;
    return html`
      <p>
        ${i === 0
          ? "The first nudge goes out right away. Which devices should act?"
          : "How long should Boopli wait for this nudge, and which devices should act?"}
      </p>
      <boopli-rung
        gap
        .hass=${this.hass}
        .settings=${d}
        .rung=${rung}
        .index=${i}
        @rung-change=${(e: CustomEvent<Rung>) => this._setRung(i, e.detail)}
      ></boopli-rung>
      ${(this._ladder()?.rungs.length ?? 0) > 1
        ? html`<p><button type="button" class="danger" ?disabled=${this._busy} @click=${() => this._removeNudge(i)}>Remove this nudge</button></p>`
        : nothing}
    `;
  }

  private _renderLadMore() {
    const n = this._ladder()?.rungs.length ?? 0;
    return html`
      <p>This ladder has ${n} ${n === 1 ? "nudge" : "nudges"} so far. Add another one, or are you done?</p>
      <div class="gate">
        <button type="button" class="primary big" ?disabled=${this._busy || n >= 12} @click=${() => this._go(1, "more")}>
          Add another nudge
        </button>
        <button type="button" class="big" ?disabled=${this._busy} @click=${() => this._go(1)}>That's all</button>
      </div>
      ${n >= 12 ? html`<p class="muted small">12 nudges is the most.</p>` : nothing}
    `;
  }

  private _renderLadEnd(d: Settings) {
    const l = this._ladder();
    if (!l) return html`<p class="muted">Give the ladder a name first.</p>`;
    const style = `ladder:${l.id}` as NudgeStyle;
    return html`
      <p>What should happen after the last nudge?</p>
      <label class="inline option">
        <input type="radio" name="end" .checked=${!l.repeat_last} @change=${() => this._patchLadder((x) => ({ ...x, repeat_last: false }))} />
        <span><b>Stop</b> <span class="muted small">No more nudges after the last one.</span></span>
      </label>
      <label class="inline option">
        <input type="radio" name="end" .checked=${l.repeat_last} @change=${() => this._patchLadder((x) => ({ ...x, repeat_last: true }))} />
        <span><b>Repeat the last nudge</b> <span class="muted small">Until you answer.</span></span>
      </label>
      ${l.repeat_last && l.rungs.length === 1
        ? this._numField("Repeat every (minutes)", l.rungs[0].gap, 1, 720, (n) => this._setRung(0, { ...l.rungs[0], gap: n }))
        : nothing}
      <p>
        <label class="inline option">
          <input
            type="checkbox"
            .checked=${d.default_style === style}
            @change=${(e: Event) =>
              this._set({
                default_style: (e.target as HTMLInputElement).checked ? style : this._baseline?.default_style && this._baseline.default_style !== style
                    ? this._baseline.default_style
                    : "escalating",
              })}
          />
          <span><b>Use it for new chores</b></span>
        </label>
      </p>
      <p class="muted small">You pick a ladder for a chore in the chore's nudge style.</p>
    `;
  }

  // --- quiet hours (one row per day, never grouped) -----------------------------

  private _setQuiet(enabled: boolean): void {
    if (!this._draft) return;
    let days = this._draft.quiet_hours.days;
    if (enabled && Object.keys(days).length === 0) {
      days = Object.fromEntries(DAYS.map((i) => [String(i), { ...DEFAULT_QUIET_DAY }]));
    }
    this._set({ quiet_hours: { enabled, days } });
  }

  private _setDay(day: number, value: QuietDay | null): void {
    if (!this._draft) return;
    const qh = this._draft.quiet_hours;
    this._set({ quiet_hours: { ...qh, days: { ...qh.days, [String(day)]: value } } });
  }

  private _copyDayAbove(day: number): void {
    if (!this._draft || day === 0) return;
    const above = this._draft.quiet_hours.days[String(day - 1)] ?? null;
    this._setDay(day, above ? { ...above } : null);
  }

  private _copyMondayToAll(): void {
    if (!this._draft) return;
    const qh = this._draft.quiet_hours;
    const monday = qh.days["0"] ?? null;
    this._set({
      quiet_hours: {
        ...qh,
        days: Object.fromEntries(DAYS.map((i) => [String(i), monday ? { ...monday } : null])),
      },
    });
  }

  // --- tests -------------------------------------------------------------------

  private async _try(key: string, run: () => Promise<{ note: string }>): Promise<void> {
    this._note(key, "Testing…");
    try {
      this._note(key, (await run()).note);
    } catch (err) {
      this._note(key, errorMessage(err));
    }
  }

  private _noteLine(key: string) {
    const note = this._notes[key];
    return note ? html`<div class="muted small note">${note}</div>` : nothing;
  }

  // --- screens -----------------------------------------------------------------

  private _renderWelcome(d: Settings) {
    return html`
      <p>
        Boopli breaks chores into small steps and nudges you with the lights, speakers and phone
        you already have. A few quick questions, and you can skip any of them. Nothing leaves your
        home, and nothing is sent to a device until you press a Test button.
      </p>
      ${this._renderPet(d)}
    `;
  }

  private _renderPet(d: Settings) {
    return html`<div class="field">
      <label for="petname">What should your pet be called?</label>
      <input
        id="petname"
        maxlength="30"
        .value=${d.pet_name ?? "Boopli"}
        @input=${(e: Event) => this._set({ pet_name: (e.target as HTMLInputElement).value })}
      />
    </div>
    <div class="field">
      <label>Pick your pet</label>
      <boopli-pet-picker
        .value=${d.pet_kind ?? "slime"}
        @pet-kind-change=${(e: CustomEvent<string>) => this._set({ pet_kind: e.detail })}
      ></boopli-pet-picker>
    </div>`;
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
            No phone with the Home Assistant app found. Install the app and sign in, then come back.
            You can skip this for now.
          </p>`
        : html`<div class="list">
            ${phones.map((service) => {
              const cfg = d.phones.find((p) => p.service === service);
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
                  ${phoneName(service)}
                </label>
                <button type="button" @click=${() => this._try(`phone:${service}`, () => testPhone(this.hass!, { service, level: cfg?.level ?? "normal", start_at: 1 }))}>
                  Send a test
                </button>
                ${this._noteLine(`phone:${service}`)}
              </div>`;
            })}
          </div>`}
    `;
  }

  private _renderPhoneDetail(d: Settings) {
    if (d.phones.length === 0) return html`<p class="muted">No phone is set up yet. Skip this.</p>`;
    return html`
      <p>
        How loud should each phone be, and from which nudge on? Nudge 1 is the first one for a step.
        You can leave the defaults.
      </p>
      <div class="list">
        ${d.phones.map(
          (p: PhoneCfg) => html`<div class="choice col">
            <b>${phoneName(p.service)}</b>
            <label class="num">
              Notification level
              <select
                @change=${(e: Event) =>
                  this._set({
                    phones: d.phones.map((x) =>
                      x.service === p.service ? { ...x, level: (e.target as HTMLSelectElement).value as PhoneLevel } : x
                    ),
                  })}
              >
                ${LEVELS.map((l) => html`<option value=${l.value} .selected=${l.value === p.level}>${l.label}</option>`)}
              </select>
            </label>
            ${this._numField("Starts at nudge #", p.start_at ?? 1, 1, 20, (n) =>
              this._set({ phones: d.phones.map((x) => (x.service === p.service ? { ...x, start_at: n } : x)) })
            )}
            <button type="button" @click=${() => this._try(`phone:${p.service}`, () => testPhone(this.hass!, p))}>Send a test</button>
            ${this._noteLine(`phone:${p.service}`)}
          </div>`
        )}
      </div>
    `;
  }

  private _renderQuiet(d: Settings) {
    const qh = d.quiet_hours;
    return html`
      <p>
        Should Boopli stay quiet at certain times, like at night? Set the times Boopli may nudge you
        for each day on its own. Outside them, nudges wait. A chore can opt out later, for example
        pills.
      </p>
      <label class="inline option">
        <input
          type="checkbox"
          .checked=${qh.enabled}
          @change=${(e: Event) => this._setQuiet((e.target as HTMLInputElement).checked)}
        />
        Hold nudges outside the times below
      </label>
      ${qh.enabled
        ? html`
            <div class="days">
              ${DAYS.map((i) => {
                const day = qh.days[String(i)] ?? null;
                return html`<div class="dayrow">
                  <span class="dayname">${WEEKDAY_NAMES[i]}</span>
                  <label class="inline small">
                    <input
                      type="checkbox"
                      .checked=${day === null}
                      @change=${(e: Event) =>
                        this._setDay(i, (e.target as HTMLInputElement).checked ? null : { ...DEFAULT_QUIET_DAY })}
                    />
                    No limit
                  </label>
                  ${day
                    ? html`<span class="muted small">from</span>
                        <input
                          type="time"
                          aria-label="${WEEKDAY_NAMES[i]} from"
                          .value=${day.start}
                          @input=${(e: Event) => this._setDay(i, { ...day, start: (e.target as HTMLInputElement).value })}
                        />
                        <span class="muted small">until</span>
                        <input
                          type="time"
                          aria-label="${WEEKDAY_NAMES[i]} until"
                          .value=${day.stop}
                          @input=${(e: Event) => this._setDay(i, { ...day, stop: (e.target as HTMLInputElement).value })}
                        />`
                    : nothing}
                  ${i > 0
                    ? html`<button type="button" class="chip" @click=${() => this._copyDayAbove(i)}>Same as ${WEEKDAY_NAMES[i - 1]}</button>`
                    : nothing}
                </div>`;
              })}
            </div>
            <button type="button" class="chip" @click=${() => this._copyMondayToAll()}>Copy Monday to all days</button>
          `
        : nothing}
    `;
  }

  private _renderNudging(d: Settings) {
    return html`
      <div class="field">
        <label for="snooze">When you press Snooze, how many minutes until the next nudge?</label>
        <div class="chips">
          ${[5, 10, 15, 30].map(
            (m) => html`<button type="button" class="chip ${d.snooze_minutes === m ? "on" : ""}" @click=${() => this._set({ snooze_minutes: m })}>${m} min</button>`
          )}
          <input
            id="snooze"
            class="short"
            type="number"
            min="1"
            max="720"
            .value=${String(d.snooze_minutes)}
            @input=${(e: Event) => this._set({ snooze_minutes: Number((e.target as HTMLInputElement).value) || 15 })}
          />
        </div>
      </div>
      <p>How should new chores nudge you, unless you say otherwise?</p>
      ${[
        ...STYLE_CHOICES,
        ...(d.ladders ?? []).map((l) => ({
          value: `ladder:${l.id}` as NudgeStyle,
          label: l.name,
          text: `Your own ladder, ${l.rungs.length} ${l.rungs.length === 1 ? "nudge" : "nudges"}.`,
        })),
      ].map(
        (s) => html`<label class="inline option">
          <input type="radio" name="style" .checked=${d.default_style === s.value} @change=${() => this._set({ default_style: s.value })} />
          <span><b>${s.label}</b> <span class="muted small">${s.text}</span></span>
        </label>`
      )}
    `;
  }

  private _renderLights(d: Settings) {
    const lights = entityIds(this.hass, ["light"]);
    return html`
      <p>
        Which lights should remind you? Each one either <b>blinks</b> when a step is your turn, or
        is a <b>status light</b> that turns on and stays on until you are done. This is optional.
      </p>
      ${lights.length === 0
        ? html`<p class="muted">No lights found.</p>`
        : html`<div class="list grid">
            ${lights.map((id) => {
              const cfg = d.lights.find((l) => l.entity_id === id);
              return html`<div class="choice col">
                <label class="inline">
                  <input
                    type="checkbox"
                    .checked=${!!cfg}
                    @change=${(e: Event) => {
                      const on = (e.target as HTMLInputElement).checked;
                      const rest = d.lights.filter((l) => l.entity_id !== id);
                      this._set({ lights: on ? [...rest, newLight(id)] : rest });
                    }}
                  />
                  ${this._fn(id)}
                </label>
                <!-- always shown (greyed out until the light is ticked), so every card is the same height -->
                <div class="radios ${cfg ? "" : "off"}">
                  ${(["blink", "indicator"] as const).map(
                    (mode) => html`<label class="inline small">
                      <input
                        type="radio"
                        name="mode-${id}"
                        ?disabled=${!cfg}
                        .checked=${cfg?.mode === mode}
                        @change=${() => this._set({ lights: d.lights.map((l) => (l.entity_id === id ? { ...l, mode } : l)) })}
                      />
                      ${mode === "blink" ? "Blinks" : "Status light (stays on until done)"}
                    </label>`
                  )}
                  <button type="button" ?disabled=${!cfg} @click=${() => cfg && this._try(`light:${id}`, () => testLight(this.hass!, cfg))}>Test</button>
                </div>
                ${cfg ? this._noteLine(`light:${id}`) : nothing}
              </div>`;
            })}
          </div>`}
    `;
  }

  private _renderLightDetail(d: Settings) {
    if (d.lights.length === 0) return html`<p class="muted">No reminder light is set up yet. Skip this.</p>`;
    return html`
      <p>
        Fine-tune each light. A light in your home can follow a few hundred milliseconds; a
        cloud-connected light needs about a second or more, so find its limit with Test.
      </p>
      <div class="list grid">
        ${d.lights.map((l: LightCfg) => {
          const patch = (p: Partial<LightCfg>) =>
            this._set({ lights: d.lights.map((x) => (x.entity_id === l.entity_id ? { ...x, ...p } : x)) });
          return html`<div class="choice col">
            <b>${this._fn(l.entity_id)}</b>
            ${lightHasColor(this.hass, l.entity_id)
              ? html`<label class="num">
                  Color
                  <input type="color" class="swatch" .value=${rgbToHex(l.color)} @input=${(e: Event) => patch({ color: hexToRgb((e.target as HTMLInputElement).value) })} />
                </label>`
              : html`<span class="muted small">This light only goes on and off, so it has no color.</span>`}
            ${l.mode === "blink"
              ? html`${this._numField("Blink length (ms)", l.blink_ms, 100, 30000, (n) => patch({ blink_ms: n }), 100)}
                ${this._numField("Number of blinks", l.repeats, 1, 5, (n) => patch({ repeats: n }))}
                ${this._numField("Pause between blinks (ms)", l.gap_ms, 0, 30000, (n) => patch({ gap_ms: n }), 100)}`
              : html`<span class="muted small">A status light has no blink settings.</span>`}
            ${this._numField("Starts at nudge #", l.start_at ?? 1, 1, 20, (n) => patch({ start_at: n }))}
            <button type="button" @click=${() => this._try(`light:${l.entity_id}`, () => testLight(this.hass!, l))}>Test</button>
            ${this._noteLine(`light:${l.entity_id}`)}
          </div>`;
        })}
      </div>
    `;
  }

  private _renderGate() {
    return html`
      <p>
        Do you want speaker reminders? A speaker can play a small ding, say the step out loud, or
        sound an alarm if you keep ignoring it. You can also use a siren or a switch as an alarm.
        If you only want lights and your phone, skip this.
      </p>
      <div class="gate">
        <button type="button" class="primary big" ?disabled=${this._busy} @click=${() => this._go(1, "gate")}>Set up speakers</button>
        <button type="button" class="big" ?disabled=${this._busy} @click=${() => this._go(1, "skip")}>Skip</button>
      </div>
    `;
  }

  private _renderSpkPick(d: Settings) {
    const players = entityIds(this.hass, ["media_player"]);
    return html`
      <p>Which speaker do you want to set up? You can add more speakers afterwards.</p>
      ${players.length === 0
        ? html`<p class="muted">No speakers (media players) found.</p>`
        : html`<div class="list grid">
            ${players.map((id) => {
              const cfg = d.speakers.find((s) => s.entity_id === id);
              return html`<label class="inline option card-choice">
                <input
                  type="radio"
                  name="speaker"
                  .checked=${this._speaker === id}
                  @change=${() => {
                    this._speaker = id;
                    if (!cfg) this._set({ speakers: [...d.speakers, newSpeaker(id)] });
                  }}
                />
                <span>
                  ${this._fn(id)}
                  ${cfg ? html`<span class="muted small"><br />set up: ${describeSpeaker(cfg)}</span>` : nothing}
                </span>
              </label>`;
            })}
          </div>`}
    `;
  }

  private _noSpeaker() {
    return html`<p class="muted">Pick a speaker first. Press Back.</p>`;
  }

  private _soundBlock(which: "cue" | "alarm", s: SpeakerCfg, intro: string, level: SpeakerLevel) {
    const sound = s[which];
    return html`
      <p>${intro}</p>
      <label class="inline option">
        <input type="checkbox" .checked=${sound.enabled} @change=${(e: Event) => this._patchSound(which, { enabled: (e.target as HTMLInputElement).checked })} />
        Use this on ${this._fn(s.entity_id)}
      </label>
      ${sound.enabled
        ? html`<div class="fields">
            <label class="num">
              Sound type
              <select @change=${(e: Event) => this._patchSound(which, { kind: (e.target as HTMLSelectElement).value as SoundKind })}>
                ${SOUND_KINDS.map((k) => html`<option value=${k.value} .selected=${k.value === sound.kind}>${k.label}</option>`)}
              </select>
            </label>
            <label class="num wide">
              ${sound.kind === "alexa" ? "Alexa sound id" : "File in the media folder (or a URL)"}
              <input .value=${sound.sound} @input=${(e: Event) => this._patchSound(which, { sound: (e.target as HTMLInputElement).value })} />
            </label>
            ${sound.kind === "alexa"
              ? html`<div class="muted small">
                  Pick a sound from the <a href=${SOUND_LIBRARY_URL} target="_blank" rel="noreferrer">Amazon sound library</a>. The id is
                  <code>amzn_sfx_</code> plus the sound's name in lower case with underscores and a two-digit number, for example
                  <code>amzn_sfx_doorbell_chime_01</code>. Some sounds stay silent on some Echo devices, so press Test.
                </div>`
              : html`<div class="muted small">For example <code>boopli/ding.mp3</code> in your Home Assistant media folder.</div>`}
            ${which === "alarm"
              ? html`${this._numField("Lasts (seconds)", sound.seconds, 3, 600, (n) => this._patchSound("alarm", { seconds: n }))}
                ${this._numField("Repeats every (seconds, 0 = once)", sound.repeat_s, 0, 60, (n) => this._patchSound("alarm", { repeat_s: n }))}`
              : nothing}
            <div><button type="button" @click=${() => this._try(`spk:${level}`, () => testSpeaker(this.hass!, s, level))}>Test</button></div>
            ${this._noteLine(`spk:${level}`)}
          </div>`
        : nothing}
    `;
  }

  private _renderSpkSpeech(s: SpeakerCfg, d: Settings) {
    const sp = s.speech;
    const patch = (p: Partial<SpeakerCfg["speech"]>) => this._patchSpeaker((x) => ({ ...x, speech: { ...x.speech, ...p } }));
    const targets = speechTargets(this.hass, sp.route, sp.target);
    return html`
      <p>The speaker says the step out loud, for example "Dishwasher: Empty it".</p>
      <label class="inline option">
        <input type="checkbox" .checked=${sp.enabled} @change=${(e: Event) => patch({ enabled: (e.target as HTMLInputElement).checked })} />
        Say it on ${this._fn(s.entity_id)}
      </label>
      ${sp.enabled
        ? html`<div class="fields">
            <label class="num">
              How
              <select @change=${(e: Event) => patch({ route: (e.target as HTMLSelectElement).value as SpeechRoute, target: "" })}>
                ${ROUTES.map((r) => html`<option value=${r.value} .selected=${r.value === sp.route}>${r.label}</option>`)}
              </select>
            </label>
            <label class="num">
              ${sp.route === "tts" ? "Voice" : "Alexa device"}
              <select @change=${(e: Event) => patch({ target: (e.target as HTMLSelectElement).value })}>
                <option value="" .selected=${sp.target === ""}>Choose…</option>
                ${targets.map((t) => html`<option value=${t.value} .selected=${t.value === sp.target}>${t.label}</option>`)}
              </select>
            </label>
            ${sp.route === "alexa_media"
              ? html`<label class="inline small">
                  <input type="checkbox" .checked=${sp.announce} @change=${(e: Event) => patch({ announce: (e.target as HTMLInputElement).checked })} />
                  Announce with a chime (some Alexas stay silent, so test it)
                </label>`
              : nothing}
            <label class="num wide">
              The sentence ({chore} and {step} are filled in)
              <input .value=${d.speech_template} @input=${(e: Event) => this._set({ speech_template: (e.target as HTMLInputElement).value })} />
            </label>
            <div><button type="button" @click=${() => this._try("spk:speech", () => testSpeaker(this.hass!, s, "speech"))}>Test</button></div>
            ${this._noteLine("spk:speech")}
          </div>`
        : nothing}
    `;
  }

  private _renderSpkWhen(s: SpeakerCfg) {
    const rows: { label: string; on: boolean; value: number; set: (n: number) => void }[] = [
      { label: "Ding", on: s.cue.enabled, value: s.cue.start_at, set: (n) => this._patchSound("cue", { start_at: n }) },
      {
        label: "Spoken sentence",
        on: s.speech.enabled,
        value: s.speech.start_at,
        set: (n) => this._patchSpeaker((x) => ({ ...x, speech: { ...x.speech, start_at: n } })),
      },
      { label: "Alarm sound", on: s.alarm.enabled, value: s.alarm.start_at, set: (n) => this._patchSound("alarm", { start_at: n }) },
    ];
    const active = rows.filter((r) => r.on);
    return html`
      <p>
        From which nudge does each thing join in on ${this._fn(s.entity_id)}? Nudge 1 is the first
        for a step. A speaker plays the highest one reached.
      </p>
      ${active.length === 0
        ? html`<p class="muted">Nothing is switched on for this speaker yet.</p>`
        : html`<div class="fields">${active.map((r) => this._numField(`${r.label} starts at nudge #`, r.value, 1, 20, r.set))}</div>`}
      <div class="actions inline-actions">
        <button type="button" ?disabled=${this._busy} @click=${() => this._addAnotherSpeaker()}>Add another speaker</button>
      </div>
    `;
  }

  private async _addAnotherSpeaker(): Promise<void> {
    if (!this.hass || !this._draft || this._busy) return;
    this._busy = true;
    try {
      const sent = structuredClone(this._draft);
      await saveSettings(this.hass, sent);
      this._saved = sent;
      this._speaker = "";
      this._index = this._steps.indexOf("spk_pick");
      this._enter();
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _renderAlarmDevices(d: Settings) {
    const choices = entityIds(
      this.hass,
      ALARM_DOMAINS,
      d.alarm_devices.map((x) => x.entity_id)
    );
    return html`
      <p>
        Optional: a siren, switch or script that Boopli switches on for a while if you keep ignoring
        a step, and off again. It also stops when you answer.
      </p>
      <div class="list">
        ${d.alarm_devices.map(
          (a) => html`<div class="choice">
            <span class="grow">${this._fn(a.entity_id)}</span>
            <button type="button" @click=${() => this._try(`alarm:${a.entity_id}`, () => testAlarmDevice(this.hass!, a))}>Test (3 s)</button>
            <button type="button" aria-label="Remove" @click=${() => this._set({ alarm_devices: d.alarm_devices.filter((x) => x.entity_id !== a.entity_id) })}>✕</button>
            ${this._noteLine(`alarm:${a.entity_id}`)}
          </div>`
        )}
      </div>
      <div class="choice">
        <select class="grow" @change=${(e: Event) => (this._addDevice = (e.target as HTMLSelectElement).value)}>
          <option value="" .selected=${this._addDevice === ""}>Add a siren, switch or script…</option>
          ${choices.map((id) => html`<option value=${id} .selected=${id === this._addDevice}>${this._fn(id)}</option>`)}
        </select>
        <button
          type="button"
          ?disabled=${!this._addDevice}
          @click=${() => {
            this._set({ alarm_devices: [...d.alarm_devices, newAlarmDevice(this._addDevice)] });
            this._addDevice = "";
          }}
        >
          Add
        </button>
      </div>
    `;
  }

  private _renderAlarmDetail(d: Settings) {
    if (d.alarm_devices.length === 0) return html`<p class="muted">No alarm device is set up yet. Skip this.</p>`;
    return html`
      <p>How long should each device stay on, and from which nudge on?</p>
      <div class="list grid">
        ${d.alarm_devices.map((a: AlarmDeviceCfg) => {
          const patch = (p: Partial<AlarmDeviceCfg>) =>
            this._set({ alarm_devices: d.alarm_devices.map((x) => (x.entity_id === a.entity_id ? { ...x, ...p } : x)) });
          return html`<div class="choice col">
            <b>${this._fn(a.entity_id)}</b>
            ${this._numField("On for (seconds)", a.seconds, 1, 600, (n) => patch({ seconds: n }))}
            ${this._numField("Starts at nudge #", a.start_at ?? 4, 1, 20, (n) => patch({ start_at: n }))}
            <button type="button" @click=${() => this._try(`alarm:${a.entity_id}`, () => testAlarmDevice(this.hass!, a))}>Test (3 s)</button>
            ${this._noteLine(`alarm:${a.entity_id}`)}
          </div>`;
        })}
      </div>
    `;
  }

  private _renderPresence(d: Settings) {
    const persons = entityIds(this.hass, ["person"]);
    return html`
      <p>
        If Boopli knows where you are, it reminds you with lights and speakers only when you are
        home, and only on your phone when you are away. This is optional. Without it, Boopli assumes
        you are home.
      </p>
      <div class="field">
        <label for="presence">Which person are you?</label>
        <select id="presence" @change=${(e: Event) => this._set({ presence_entity: (e.target as HTMLSelectElement).value })}>
          <option value="" .selected=${d.presence_entity === ""}>Skip (assume I am home)</option>
          ${persons.map((id) => html`<option value=${id} .selected=${id === d.presence_entity}>${this._fn(id)}</option>`)}
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
      <div class="list">
        ${TEMPLATES.map((t) => {
          const taken = existing.has(t.draft.name);
          return html`<label class="inline option">
            <input
              type="checkbox"
              ?disabled=${taken}
              .checked=${!taken && this._picked.includes(t.label)}
              @change=${(e: Event) => {
                const on = (e.target as HTMLInputElement).checked;
                this._picked = on ? [...this._picked, t.label] : this._picked.filter((l) => l !== t.label);
              }}
            />
            <span>
              <b>${t.draft.name}</b>
              <span class="muted small">${taken ? "already added" : t.draft.steps.map((s) => s.title).join(" → ")}</span>
            </span>
          </label>`;
        })}
      </div>
    `;
  }

  private _renderAiIntro(d: Settings) {
    return html`
      <p>
        Boopli can split a big task, like "clean my room", into tiny steps. It asks you a few questions first, so
        the steps fit your situation. This uses <b>your own</b> Home Assistant AI agent.
      </p>
      <p class="muted">
        Boopli sends nothing by itself. When you use it, the text of the task and your answers go to the agent you
        choose, and nothing else: no device names, no history, no location. A cloud agent receives that text, and
        free models may keep or learn from what they get, so do not type private details. A local agent keeps
        everything at home.
      </p>
      <label class="inline option">
        <input
          type="checkbox"
          .checked=${d.ai.enabled}
          @change=${(e: Event) => this._set({ ai: { ...d.ai, enabled: (e.target as HTMLInputElement).checked } })}
        />
        Switch AI help on
      </label>
    `;
  }

  private _renderAiAgent(d: Settings) {
    const agents = entityIds(this.hass, ["ai_task"]);
    if (!d.ai.enabled) return html`<p class="muted">AI help is off. Go back to switch it on, or skip this.</p>`;
    return html`
      <p>Which AI agent should Boopli use?</p>
      <div class="field">
        <select @change=${(e: Event) => this._set({ ai: { ...d.ai, entity_id: (e.target as HTMLSelectElement).value } })}>
          <option value="" .selected=${d.ai.entity_id === ""}>Home Assistant default</option>
          ${agents.map((id) => html`<option value=${id} .selected=${id === d.ai.entity_id}>${this._fn(id)}</option>`)}
        </select>
        ${agents.length === 0
          ? html`<div class="muted small">No AI Task agent found yet. Add one in Home Assistant under Settings, Devices and services, then come back.</div>`
          : nothing}
      </div>
      <p class="muted small">Press the button to save and test it, or Next to only save it.</p>
      <div class="actions inline-actions">
        <button
          type="button"
          ?disabled=${this._busy}
          @click=${() => this._testAiAgent(d)}
        >
          Save and test the agent
        </button>
      </div>
      ${this._noteLine("ai:test")}
    `;
  }

  private async _testAiAgent(d: Settings): Promise<void> {
    if (!this.hass) return;
    this._note("ai:test", "Saving and asking the agent…");
    try {
      const sent = structuredClone(d);
      await saveSettings(this.hass, sent);
      this._saved = sent;
      const result = await aiSteps(this.hass, "Make a cup of tea", "now", []);
      this._note("ai:test", `It works. The agent split "Make a cup of tea" into ${result.steps.length} steps, starting with: ${result.steps[0]?.title ?? "(none)"}`);
    } catch (err) {
      this._note("ai:test", errorMessage(err));
    }
  }

  /** The last screen of the wall guide: leave the guide and open the board in edit mode. */
  private _editOnWall(): void {
    const b = this._board();
    if (!b) return;
    this._close();
    this.dispatchEvent(new CustomEvent("open-wall", { detail: { name: b.name, edit: true }, bubbles: true, composed: true }));
  }

  private _renderDone(d: Settings) {
    const changes = this._baseline ? diffSettings(this._baseline, d, this.hass) : [];
    const adding = TEMPLATES.filter((t) => this._picked.includes(t.label)).map((t) => t.draft.name);
    if (this._first && adding.length) changes.push(`Chores added: ${adding.join(", ")}`);
    return html`
      <p><b>What changed</b> ${this._first ? "from before this setup" : "in this setup"}:</p>
      ${changes.length === 0
        ? html`<p class="muted">Nothing changed.</p>`
        : html`<ul>${changes.map((c) => html`<li>${c}</li>`)}</ul>`}
      ${this.wizard === "wall" && this._board()
        ? html`<p>Next: put the tiles where you want them, on the board itself.</p>
            <p><button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._editOnWall()}>Edit it on the wall</button></p>
            <p class="small">Link for the tablet's start page: <code>${boardLink(this._board()!)}</code></p>`
        : nothing}
      <p class="muted small">
        Everything can be changed again in Settings, step by step or in the full forms.
      </p>
    `;
  }

  private _renderStep(d: Settings) {
    const s = this._currentSpeaker();
    switch (this._step) {
      case "welcome":
        return this._renderWelcome(d);
      case "pet":
        return this._renderPet(d);
      case "ai_intro":
        return this._renderAiIntro(d);
      case "ai_agent":
        return this._renderAiAgent(d);
      case "phone":
        return this._renderPhone(d);
      case "phone_detail":
        return this._renderPhoneDetail(d);
      case "quiet":
        return this._renderQuiet(d);
      case "nudging":
        return this._renderNudging(d);
      case "lights":
        return this._renderLights(d);
      case "lights_detail":
        return this._renderLightDetail(d);
      case "speaker_gate":
        return this._renderGate();
      case "spk_pick":
        return this._renderSpkPick(d);
      case "spk_ding":
        return s ? this._soundBlock("cue", s, "A short, friendly sound, the gentlest reminder.", "cue") : this._noSpeaker();
      case "spk_speech":
        return s ? this._renderSpkSpeech(s, d) : this._noSpeaker();
      case "spk_alarm":
        return s
          ? this._soundBlock("alarm", s, "A loud sound that repeats for a while, for when a step keeps being ignored.", "alarm")
          : this._noSpeaker();
      case "spk_when":
        return s ? this._renderSpkWhen(s) : this._noSpeaker();
      case "alarm_devices":
        return this._renderAlarmDevices(d);
      case "alarm_detail":
        return this._renderAlarmDetail(d);
      case "presence":
        return this._renderPresence(d);
      case "chores":
        return this._renderChores();
      case "wall_start":
        return this._renderWallStart(d);
      case "lad_start":
        return this._renderLadStart(d);
      case "lad_name":
        return this._renderLadName();
      case "lad_delete":
        return this._renderLadDelete();
      case "lad_nudge":
        return this._renderLadNudge(d);
      case "lad_more":
        return this._renderLadMore();
      case "lad_end":
        return this._renderLadEnd(d);
      default:
        return this._renderDone(d);
    }
  }

  render() {
    const d = this._draft;
    if (!d) return html`<p class="muted">Loading…</p>`;
    const step = this._step;
    const isDone = step === "done";
    const isGate = step === "speaker_gate" || step === "lad_more" || step === "lad_delete"; // these screens have their own buttons
    const last = this._steps.length - 1;
    return html`
      <div class="shell">
        <nav class="rail" aria-label="Steps">
          <div class="rail-title">${WIZARD_TITLES[this.wizard]}</div>
          ${this._steps.map(
            (id, i) => html`<button
              type="button"
              class="rail-item ${i === this._index ? "current" : ""} ${i < this._index ? "past" : ""}"
              ?disabled=${i >= this._index}
              @click=${() => this._jump(i)}
            >
              <span class="mark">${i < this._index ? "✓" : i + 1}</span>
              <span>${this._title(id, i)}</span>
            </button>`
          )}
        </nav>
        <section class="card main">
          <div class="top">
            <span class="muted small">Step ${this._index + 1} of ${this._steps.length}</span>
            ${isDone && this._first
              ? nothing
              : html`<button type="button" class="link" ?disabled=${this._busy} @click=${() => this._leave()}>
                  ${this._first ? "Skip for now" : "Close"}
                </button>`}
          </div>
          <div class="bar"><div class="fill" style="width:${((this._index + 1) / this._steps.length) * 100}%"></div></div>
          <h2>${this._title(step, this._index)}</h2>
          ${OPTIONAL_STEPS.includes(step)
            ? html`<div class="muted small optional">Optional details. Skip if the defaults are fine.</div>`
            : nothing}
          ${this._renderStep(d)}
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
          <div class="actions">
            ${this._index > 0
              ? html`<button type="button" ?disabled=${this._busy} @click=${() => this._go(-1)}>Back</button>`
              : nothing}
            <span class="spacer"></span>
            ${isDone
              ? html`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._finish()}>
                  ${this._first ? "Finish" : "Save and close"}
                </button>`
              : isGate
                ? nothing
                : html`${step === "lad_name" || step === "lad_start" || step === "lad_nudge" ? nothing : html`<button type="button" ?disabled=${this._busy} @click=${() => this._go(1, "skip")}>Skip</button>`}
                    <button type="button" class="primary" ?disabled=${this._busy || this._index >= last} @click=${() => this._go(1)}>Next</button>`}
          </div>
        </section>
      </div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .shell {
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        gap: 24px;
        align-items: start;
      }
      .rail {
        position: sticky;
        top: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .rail-title {
        font-size: 15px;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 0 0 8px 8px;
      }
      .rail-item {
        display: flex;
        align-items: center;
        gap: 10px;
        text-align: left;
        border: 0;
        background: none;
        border-radius: 10px;
        padding: 8px 10px;
        min-height: 0;
        color: var(--secondary-text-color);
      }
      .rail-item.current {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        font-weight: 500;
      }
      .rail-item.past {
        color: var(--primary-text-color);
        cursor: pointer;
      }
      .rail-item:disabled {
        opacity: 1;
        cursor: default;
      }
      .rail-item.past:disabled {
        cursor: default;
      }
      .mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
        border-radius: 50%;
        border: 1px solid var(--divider-color);
        font-size: 14px;
      }
      .past .mark {
        background: var(--boopli-accent, var(--primary-color));
        border-color: var(--boopli-accent, var(--primary-color));
        color: var(--text-primary-color, #fff);
      }
      .main {
        padding: 24px;
        min-width: 0;
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
        margin-bottom: 18px;
      }
      .fill {
        height: 100%;
        background: var(--boopli-accent, var(--primary-color));
        transition: width 0.3s ease;
      }
      h2 {
        font-size: 22px;
        margin-bottom: 10px;
      }
      p {
        margin: 10px 0;
        line-height: 1.5;
        max-width: 760px;
      }
      .small {
        font-size: 15px;
      }
      .optional {
        margin-bottom: 8px;
      }
      .field {
        margin: 14px 0;
        max-width: 420px;
      }
      .list {
        display: flex;
        flex-direction: column;
      }
      .list.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr));
        gap: 10px;
        margin-top: 6px;
        align-items: start;
      }
      .choice {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        margin: 4px 0;
      }
      .list.grid .choice {
        margin: 0;
      }
      .choice.col {
        flex-direction: column;
        align-items: stretch;
      }
      .choice .inline {
        flex: 1;
        min-width: 160px;
      }
      .choice select.grow,
      .grow {
        flex: 1;
        min-width: 0;
      }
      .radios {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-left: 28px;
      }
      .radios.off {
        opacity: 0.45;
      }
      .note {
        flex-basis: 100%;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 17px;
        color: var(--primary-text-color);
        margin: 0;
      }
      label.inline.small {
        font-size: 16px;
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      label.option {
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        margin: 6px 0;
        max-width: 760px;
      }
      label.card-choice {
        margin: 0;
        max-width: none;
      }
      label.num {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 15px;
        margin: 0;
      }
      label.num.wide {
        max-width: 560px;
      }
      .fields {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 12px 0;
        max-width: 560px;
      }
      .swatch {
        width: 56px;
        min-height: 36px;
        padding: 2px;
      }
      code {
        background: var(--secondary-background-color);
        padding: 1px 5px;
        border-radius: 5px;
      }
      a {
        color: var(--boopli-accent, var(--primary-color));
      }
      .days {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 12px 0;
      }
      .dayrow {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        max-width: 760px;
      }
      .dayname {
        width: 40px;
        font-weight: 500;
      }
      .dayrow input[type="time"] {
        width: 130px;
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
      .gate {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }
      button.big {
        min-height: 52px;
        padding: 0 24px;
        font-size: 18px;
      }
      .actions {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-top: 24px;
      }
      .actions.inline-actions {
        margin-top: 8px;
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
        margin: 6px 0;
      }
      @media (max-width: 860px) {
        .shell {
          grid-template-columns: minmax(0, 1fr);
        }
        .rail {
          display: none;
        }
      }
    `,
  ];
}

customElements.define("boopli-wizard", BoopliWizard);
