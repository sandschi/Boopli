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
import { routinePrompt, routineHost } from "./claude";
import { diffSettings } from "./diff";
import {
  ALARM_DOMAINS,
  DEFAULT_QUIET_DAY,
  describeSpeaker,
  entityIds,
  friendlyName,
  hexToRgb,
  ladderName,
  lightHasColor,
  newLadderId,
  newAlarmDevice,
  newLight,
  newSpeaker,
  phoneName,
  rgbToHex,
  speechTargets,
} from "./helpers";
import "./boopli-claude";
import "./boopli-pet-picker";
import "./boopli-rung";
import { boardLink, starterTiles } from "./wall-tiles";
import { sharedStyles } from "./styles";
import { starterNamesTaken, TEMPLATES } from "./templates";
import { weekdayNames } from "./time";
import { t, rich } from "./i18n";
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
  | "claude_intro"
  | "claude_make"
  | "claude_paste"
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
  ai: ["ai_intro", "ai_agent", "claude_intro", "claude_make", "claude_paste", "done"],
  ladders: ["lad_start", "done"], // the rest depends on what you want to do (see _startLadderWork)
  wall: ["wall_start", "done"],
};

/** What "Set up speakers" adds to the first-run setup. */
const SPEAKER_STEPS: StepId[] = ["spk_pick", "spk_ding", "spk_speech", "spk_alarm", "alarm_devices"];

export const WIZARD_TITLES = (): Record<WizardId, string> => ({
  first: t("wizard.first_setup"),
  phone: t("wizard.phone_setup"),
  quiet: t("wizard.quiet_hours_setup"),
  lights: t("wizard.reminder_lights_setup"),
  speakers: t("wizard.speaker_setup"),
  alarms: t("wizard.alarm_devices_setup"),
  presence: t("common.where_you_are"),
  nudging: t("wizard.snooze_and_style"),
  pet: t("common.your_pet"),
  ai: t("wizard.ai_help_setup"),
  ladders: t("common.nudge_it_your_way"),
  wall: t("common.wall_board"),
});

const MAX_BOARDS = 10; // the most boards (the same as in the board editor)
const MAX_LADDERS = 30; // the most ladders (the same as in the ladder editor and the backend)

const TITLES = (): Record<StepId, string> => ({
  welcome: t("wizard.welcome"),
  phone: t("wizard.your_phone"),
  phone_detail: t("wizard.phone_details"),
  quiet: t("settings.quiet_hours"),
  nudging: t("wizard.snooze_and_style"),
  lights: t("settings.reminder_lights"),
  lights_detail: t("wizard.light_details"),
  speaker_gate: t("wizard.speaker_reminders"),
  spk_pick: t("wizard.pick_a_speaker"),
  spk_ding: t("wizard.a_small_ding"),
  spk_speech: t("wizard.a_spoken_sentence"),
  spk_alarm: t("wizard.an_alarm_sound"),
  spk_when: t("wizard.when_it_joins_in"),
  alarm_devices: t("speakers.alarm_devices"),
  alarm_detail: t("wizard.alarm_device_details"),
  presence: t("common.where_you_are"),
  pet: t("common.your_pet"),
  ai_intro: t("settings.ai_help"),
  ai_agent: t("wizard.your_ai_agent"),
  claude_intro: t("settings.ask_claude_extra"),
  claude_make: t("wizard.make_the_routine"),
  claude_paste: t("wizard.connect_it"),
  chores: t("wizard.first_chores"),
  lad_start: t("wizard.what_do_you_want_to_do"),
  lad_name: t("wizard.name_your_ladder"),
  lad_nudge: t("wizard.a_nudge"),
  lad_more: t("wizard.another_nudge"),
  lad_end: t("wizard.how_it_ends"),
  lad_delete: t("wizard.delete_a_ladder"),
  wall_start: t("wizard.which_board"),
  done: t("common.all_set"),
});

const OPTIONAL_STEPS: StepId[] = ["phone_detail", "lights_detail", "spk_when", "alarm_detail"];

const STYLE_CHOICES = (): { value: NudgeStyle; label: string; text: string }[] => [
  { value: "quiet", label: t("common.quiet"), text: t("wizard.only_shown_in_boopli_never_nudges") },
];

const LEVELS = (): { value: PhoneLevel; label: string }[] => [
  { value: "normal", label: t("common.normal_notification") },
  { value: "high", label: t("common.high_priority_pops_up") },
  { value: "alarm", label: t("common.alarm_volume") },
  { value: "alarm_max", label: t("common.max_volume_not_on_every_phone") },
];

const ROUTES = (): { value: SpeechRoute; label: string }[] => [
  { value: "alexa_media", label: t("helpers.alexa_media_player") },
  { value: "alexa_devices", label: t("common.alexa_devices_notify_entity") },
  { value: "tts", label: t("common.a_tts_voice_on_this_speaker") },
];

const SOUND_KINDS = (): { value: SoundKind; label: string }[] => [
  { value: "alexa", label: t("common.alexa_sound") },
  { value: "file", label: t("common.file_in_my_media_folder") },
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
    const have = starterNamesTaken(this.snapshot.chores.map((c) => c.name));
    this._picked = TEMPLATES().filter((t) => !have(t.draft.name)).map((t) => t.label);
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
    // The ding and the alarm sound are one setting for each kind of speaker (Alexa, or another media player).
    const cur = this._currentSpeaker();
    if (!this._draft || !cur) return;
    const alexa = cur.speech.route !== "tts";
    this._set({
      speakers: this._draft.speakers.map((s) =>
        (s.speech.route !== "tts") === alexa ? { ...s, [which]: { ...s[which], ...patch, enabled: true } } : s
      ),
    });
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
          throw new Error(t("wizard.pick_a_speaker_or_press_skip"));
        }
        if (this._step === "lad_start") this._startLadderWork();
        if (this._step === "wall_start") this._startBoardWork();
        if (this._step === "lad_name") this._ensureLadder();
        const sent = structuredClone(this._draft);
        this._adoptLadders(await saveSettings(this.hass, sent), sent);
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
        for (const t of TEMPLATES().filter((x) => this._picked.includes(x.label))) {
          // On demand: nothing nudges until you set a time or start it yourself.
          await saveChore(this.hass, {
            ...t.draft,
            repeat: { type: "none", time: "09:00", every_n_days: 1, days: {} },
          });
          // saved: if a later one fails, trying again must not add this one a second time
          this._picked = this._picked.filter((l) => l !== t.label);
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
      if (!b) throw new Error(t("wizard.pick_a_board_first"));
      this._boardId = b.id;
      return;
    }
    const name = this._boardName.trim();
    if (!name) throw new Error(t("wizard.give_the_new_board_a_name"));
    if (boards.length >= MAX_BOARDS) throw new Error(t("wizard.you_have_boards_the_most_edit", { max_boards: MAX_BOARDS }));
    if (boards.some((b) => b.name.toLowerCase() === name.toLowerCase())) throw new Error(t("wizard.there_is_already_a_board_called", { name }));
    const board: Board = { id: newLadderId(), name, columns: 16, rows: 9, night: "dim", tiles: starterTiles(16, 9) };
    this._boardId = board.id;
    this._boardPick = board.id; // going back and forward again goes on with this board, not a second one
    this._set({ boards: [...boards, board] });
  }

  private _renderWallStart(d: Settings) {
    const boards = d.boards ?? [];
    return html`
      <p>${t("wizard.a_board_is_a_grid_of")}</p>
      <div class="field">
        <label for="boardpick">${t("wizard.which_board")}</label>
        <select id="boardpick" @change=${(e: Event) => (this._boardPick = (e.target as HTMLSelectElement).value)}>
          <option value="" ?selected=${!this._boardPick}>${t("wizard.a_new_board")}</option>
          ${boards.map((b) => html`<option value=${b.id} ?selected=${this._boardPick === b.id}>${b.name}</option>`)}
        </select>
      </div>
      ${this._boardPick
        ? nothing
        : html`<div class="field">
            <label for="boardname">${t("wizard.name_of_the_new_board")}</label>
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
      if (ladders.length >= MAX_LADDERS) throw new Error(t("wizard.you_have_ladders_the_most_edit", { max_ladders: MAX_LADDERS }));
      this._ladderId = "";
      this._ladderName = "";
      this._steps = ["lad_start", "lad_name", "lad_nudge", "lad_more", "lad_end", "done"];
      return;
    }
    const pick = this._ladderPick || (ladders.length === 1 ? ladders[0].id : "");
    const ladder = ladders.find((l) => l.id === pick);
    if (!ladder) throw new Error(t("wizard.pick_a_ladder_first"));
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
      this._error = t("ladders.is_used_by_pick_another_nudge", { name: ladderName(l), join: users.join(", ") });
      return;
    }
    if (d.default_style === style) {
      this._error = t("ladders.is_the_style_for_new_chores", { name: ladderName(l) });
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
    if (!name) throw new Error(t("wizard.give_the_ladder_a_name"));
    if (this._ladder()) {
      this._patchLadder((l) => ({ ...l, name }));
      return;
    }
    if ((d.ladders ?? []).length >= MAX_LADDERS) throw new Error(t("wizard.you_have_ladders_the_most_edit", { max_ladders: MAX_LADDERS }));
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
    return id === "lad_nudge" ? t("wizard.nudge", { n: this._nudgesBefore(index) + 1 }) : TITLES()[id];
  }

  private _renderLadStart(d: Settings) {
    const ladders = d.ladders ?? [];
    const none = ladders.length === 0;
    const own = ladders.filter((l) => !l.id.startsWith("standard_")); // the standard ladders can be changed, not deleted
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
      ${choice("create", t("wizard.create_a_ladder"), ladders.length >= MAX_LADDERS ? t("wizard.you_have_ladders_the_most", { max_ladders: MAX_LADDERS }) : t("wizard.a_new_list_of_nudges"), ladders.length >= MAX_LADDERS)}
      ${choice("edit", t("wizard.edit_a_ladder"), none ? t("wizard.you_have_no_ladders_yet") : t("wizard.change_its_name_its_nudges_or"), none)}
      ${choice("delete", t("wizard.delete_a_ladder"), own.length === 0 ? t("wizard.only_your_own_ladders_can_be") : t("wizard.remove_one_of_your_own_that"), own.length === 0)}
      ${this._ladderAction !== "create" && !none
        ? html`<div class="field">
            <label for="ladpick">${t("wizard.which_ladder")}</label>
            <select id="ladpick" .value=${this._ladderPick} @change=${(e: Event) => (this._ladderPick = (e.target as HTMLSelectElement).value)}>
              <option value="" ?selected=${!this._ladderPick}>${t("wizard.pick_a_ladder")}</option>
              ${(this._ladderAction === "delete" ? own : ladders).map(
                (l) => html`<option value=${l.id} ?selected=${this._ladderPick === l.id}>
                  ${l.name} (${t("common.nudges_count", { count: l.rungs.length })})
                </option>`
              )}
            </select>
          </div>`
        : nothing}
    `;
  }

  private _renderLadDelete() {
    const l = this._ladder();
    if (!l) return html`<p class="muted">${t("wizard.pick_a_ladder_first")}</p>`;
    const style = `ladder:${l.id}`;
    const users = (this.snapshot?.chores ?? []).filter((c) => c.nudge_style === style).map((c) => c.name).sort();
    return html`
      <p>${rich("wizard.delete_the_ladder_this_cannot_be", { name: ladderName(l) })}</p>
      ${users.length
        ? html`<p class="muted">${t("wizard.it_is_used_by_pick_another", { join: users.join(", ") })}</p>`
        : nothing}
      <div class="gate">
        <button type="button" class="danger big" ?disabled=${this._busy || users.length > 0} @click=${() => this._deleteLadder()}>
          ${t("wizard.delete_this_ladder")}
        </button>
      </div>
    `;
  }

  private _renderLadName() {
    return html`
      <p>
        ${t("wizard.a_ladder_is_a_list_of")}
      </p>
      <div class="field">
        <label for="ladname">${t("common.name")}</label>
        <input
          id="ladname"
          maxlength="40"
          placeholder=${t("wizard.for_example_pills")}
          .value=${this._ladderName}
          @input=${(e: Event) => (this._ladderName = (e.target as HTMLInputElement).value)}
        />
      </div>
    `;
  }

  private _renderLadNudge(d: Settings) {
    const i = this._nudgesBefore(this._index);
    const rung = this._ladder()?.rungs[i];
    if (!rung) return html`<p class="muted">${t("wizard.give_the_ladder_a_name_first")}</p>`;
    return html`
      <p>
        ${i === 0
          ? t("wizard.the_first_nudge_goes_out_right")
          : t("wizard.how_long_should_boopli_wait_for")}
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
        ? html`<p><button type="button" class="danger" ?disabled=${this._busy} @click=${() => this._removeNudge(i)}>${t("ladders.remove_this_nudge")}</button></p>`
        : nothing}
    `;
  }

  private _renderLadMore() {
    const n = this._ladder()?.rungs.length ?? 0;
    return html`
      <p>${t("wizard.this_ladder_has_nudges", { count: n })}</p>
      <div class="gate">
        <button type="button" class="primary big" ?disabled=${this._busy || n >= 12} @click=${() => this._go(1, "more")}>
          ${t("wizard.add_another_nudge")}
        </button>
        <button type="button" class="big" ?disabled=${this._busy} @click=${() => this._go(1)}>${t("wizard.thats_all")}</button>
      </div>
      ${n >= 12 ? html`<p class="muted small">${t("wizard.12_nudges_is_the_most")}</p>` : nothing}
    `;
  }

  private _renderLadEnd(d: Settings) {
    const l = this._ladder();
    if (!l) return html`<p class="muted">${t("wizard.give_the_ladder_a_name_first")}</p>`;
    const style = `ladder:${l.id}` as NudgeStyle;
    return html`
      <p>${t("wizard.what_should_happen_after_the_last")}</p>
      <label class="inline option">
        <input type="radio" name="end" .checked=${!l.repeat_last} @change=${() => this._patchLadder((x) => ({ ...x, repeat_last: false }))} />
        <span><b>${t("common.stop")}</b> <span class="muted small">${t("wizard.no_more_nudges_after_the_last")}</span></span>
      </label>
      <label class="inline option">
        <input type="radio" name="end" .checked=${l.repeat_last} @change=${() => this._patchLadder((x) => ({ ...x, repeat_last: true }))} />
        <span><b>${t("wizard.repeat_the_last_nudge")}</b> <span class="muted small">${t("wizard.until_you_answer")}</span></span>
      </label>
      ${l.repeat_last && l.rungs.length === 1
        ? this._numField(t("wizard.repeat_every_minutes"), l.rungs[0].gap, 1, 720, (n) => this._setRung(0, { ...l.rungs[0], gap: n }))
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
                    : style === "ladder:standard_escalating" ? "ladder:standard_one" : "ladder:standard_escalating",
              })}
          />
          <span><b>${t("wizard.use_it_for_new_chores")}</b></span>
        </label>
      </p>
      <p class="muted small">${t("wizard.you_pick_a_ladder_for_a")}</p>
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
    this._note(key, t("common.testing"));
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
        ${t("wizard.boopli_breaks_chores_into_small_steps")}
      </p>
      ${this._renderPet(d)}
    `;
  }

  private _renderPet(d: Settings) {
    return html`<div class="field">
      <label for="petname">${t("wizard.what_should_your_pet_be_called")}</label>
      <input
        id="petname"
        maxlength="30"
        .value=${d.pet_name ?? "Boopli"}
        @input=${(e: Event) => this._set({ pet_name: (e.target as HTMLInputElement).value })}
      />
    </div>
    <div class="field">
      <label>${t("wizard.pick_your_pet")}</label>
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
        ${rich("wizard.which_phone_should_get_booplis_notifications", { item: t("common.done"), item2: t("wizard.snooze")  })}
      </p>
      ${phones.length === 0
        ? html`<p class="muted">
            ${t("wizard.no_phone_with_the_home_assistant")}
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
                  ${t("wizard.send_a_test")}
                </button>
                ${this._noteLine(`phone:${service}`)}
              </div>`;
            })}
          </div>`}
    `;
  }

  private _renderPhoneDetail(d: Settings) {
    if (d.phones.length === 0) return html`<p class="muted">${t("wizard.no_phone_is_set_up_yet")}</p>`;
    return html`
      <p>
        ${t("wizard.how_loud_should_each_phone_be")}
      </p>
      <div class="list">
        ${d.phones.map(
          (p: PhoneCfg) => html`<div class="choice col">
            <b>${phoneName(p.service)}</b>
            <label class="num">
              ${t("settings.notification_level")}
              <select
                @change=${(e: Event) =>
                  this._set({
                    phones: d.phones.map((x) =>
                      x.service === p.service ? { ...x, level: (e.target as HTMLSelectElement).value as PhoneLevel } : x
                    ),
                  })}
              >
                ${LEVELS().map((l) => html`<option value=${l.value} .selected=${l.value === p.level}>${l.label}</option>`)}
              </select>
            </label>
            <button type="button" @click=${() => this._try(`phone:${p.service}`, () => testPhone(this.hass!, p))}>${t("wizard.send_a_test")}</button>
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
        ${t("wizard.should_boopli_stay_quiet_at_certain")}
      </p>
      <label class="inline option">
        <input
          type="checkbox"
          .checked=${qh.enabled}
          @change=${(e: Event) => this._setQuiet((e.target as HTMLInputElement).checked)}
        />
        ${t("wizard.hold_nudges_outside_the_times_below")}
      </label>
      ${qh.enabled
        ? html`
            <div class="days">
              ${DAYS.map((i) => {
                const day = qh.days[String(i)] ?? null;
                return html`<div class="dayrow">
                  <span class="dayname">${weekdayNames()[i]}</span>
                  <label class="inline small">
                    <input
                      type="checkbox"
                      .checked=${day === null}
                      @change=${(e: Event) =>
                        this._setDay(i, (e.target as HTMLInputElement).checked ? null : { ...DEFAULT_QUIET_DAY })}
                    />
                    ${t("common.no_limit")}
                  </label>
                  ${day
                    ? html`<span class="muted small">${t("common.from")}</span>
                        <input
                          type="time"
                          aria-label=${t("wizard.from", { value: weekdayNames()[i] })}
                          .value=${day.start}
                          @input=${(e: Event) => this._setDay(i, { ...day, start: (e.target as HTMLInputElement).value })}
                        />
                        <span class="muted small">${t("common.until")}</span>
                        <input
                          type="time"
                          aria-label=${t("wizard.until", { value: weekdayNames()[i] })}
                          .value=${day.stop}
                          @input=${(e: Event) => this._setDay(i, { ...day, stop: (e.target as HTMLInputElement).value })}
                        />`
                    : nothing}
                  ${i > 0
                    ? html`<button type="button" class="chip" @click=${() => this._copyDayAbove(i)}>${t("schedule_days.same_as", { value: weekdayNames()[i - 1] })}</button>`
                    : nothing}
                </div>`;
              })}
            </div>
            <button type="button" class="chip" @click=${() => this._copyMondayToAll()}>${t("common.copy_monday_to_all_days")}</button>
          `
        : nothing}
    `;
  }

  private _renderNudging(d: Settings) {
    return html`
      <div class="field">
        <label for="snooze">${t("wizard.when_you_press_snooze_how_many")}</label>
        <div class="chips">
          ${[5, 10, 15, 30].map(
            (m) => html`<button type="button" class="chip ${d.snooze_minutes === m ? "on" : ""}" @click=${() => this._set({ snooze_minutes: m })}>${t("wizard.min", { m })}</button>`
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
      <p>${t("wizard.how_should_new_chores_nudge_you")}</p>
      ${[
        ...STYLE_CHOICES(),
        ...(d.ladders ?? []).map((l) => ({
          value: `ladder:${l.id}` as NudgeStyle,
          label: l.name,
          text: html`
            ${l.id.startsWith("standard_") ? nothing : html`<span class="sequence-type">${t("wizard.your_own_ladder").trimEnd()}</span>`}
            <span>${t("wizard.ladder_nudges_sentence", { count: l.rungs.length })}</span>
          `,
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
        ${rich("wizard.which_lights_should_remind_you_each", { item: t("wizard.blinks"), item2: t("wizard.status_light")  })}
      </p>
      ${lights.length === 0
        ? html`<p class="muted">${t("wizard.no_lights_found")}</p>`
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
                      ${mode === "blink" ? t("settings.blinks") : t("wizard.status_light_stays_on_until_done")}
                    </label>`
                  )}
                  <button type="button" ?disabled=${!cfg} @click=${() => cfg && this._try(`light:${id}`, () => testLight(this.hass!, cfg))}>${t("common.test")}</button>
                </div>
                ${cfg ? this._noteLine(`light:${id}`) : nothing}
              </div>`;
            })}
          </div>`}
    `;
  }

  private _renderLightDetail(d: Settings) {
    if (d.lights.length === 0) return html`<p class="muted">${t("wizard.no_reminder_light_is_set_up")}</p>`;
    return html`
      <p>
        ${t("wizard.fine_tune_each_light_a_light")}
      </p>
      <div class="list grid">
        ${d.lights.map((l: LightCfg) => {
          const patch = (p: Partial<LightCfg>) =>
            this._set({ lights: d.lights.map((x) => (x.entity_id === l.entity_id ? { ...x, ...p } : x)) });
          return html`<div class="choice col">
            <b>${this._fn(l.entity_id)}</b>
            ${lightHasColor(this.hass, l.entity_id)
              ? html`<label class="num">
                  ${t("settings.color")}
                  <input type="color" class="swatch" .value=${rgbToHex(l.color)} @input=${(e: Event) => patch({ color: hexToRgb((e.target as HTMLInputElement).value) })} />
                </label>`
              : html`<span class="muted small">${t("wizard.this_light_only_goes_on_and")}</span>`}
            ${l.mode === "blink"
              ? html`${this._numField(t("wizard.blink_length_ms"), l.blink_ms, 100, 30000, (n) => patch({ blink_ms: n }), 100)}
                ${this._numField(t("wizard.number_of_blinks"), l.repeats, 1, 5, (n) => patch({ repeats: n }))}
                ${this._numField(t("wizard.pause_between_blinks_ms"), l.gap_ms, 0, 30000, (n) => patch({ gap_ms: n }), 100)}`
              : html`<span class="muted small">${t("wizard.a_status_light_has_no_blink")}</span>`}
            <button type="button" @click=${() => this._try(`light:${l.entity_id}`, () => testLight(this.hass!, l))}>${t("common.test")}</button>
            ${this._noteLine(`light:${l.entity_id}`)}
          </div>`;
        })}
      </div>
    `;
  }

  private _renderGate() {
    return html`
      <p>
        ${t("wizard.do_you_want_speaker_reminders_a")}
      </p>
      <div class="gate">
        <button type="button" class="primary big" ?disabled=${this._busy} @click=${() => this._go(1, "gate")}>${t("wizard.set_up_speakers")}</button>
        <button type="button" class="big" ?disabled=${this._busy} @click=${() => this._go(1, "skip")}>${t("wizard.skip")}</button>
      </div>
    `;
  }

  private _renderSpkPick(d: Settings) {
    const players = entityIds(this.hass, ["media_player"]);
    return html`
      <p>${t("wizard.which_speaker_do_you_want_to")}</p>
      ${players.length === 0
        ? html`<p class="muted">${t("wizard.no_speakers_media_players_found")}</p>`
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
                  ${cfg ? html`<span class="muted small">${rich("wizard.set_up", { speaker: describeSpeaker(cfg)  })}</span>` : nothing}
                </span>
              </label>`;
            })}
          </div>`}
    `;
  }

  /** What was saved is now the base. The server may have added a new device to the standard ladders: keep those too. */
  private _adoptLadders(result: { ladders?: Settings["ladders"] } | void, sent: Settings): void {
    const ladders = result && result.ladders ? structuredClone(result.ladders) : sent.ladders;
    this._saved = { ...sent, ladders };
    // Only if the ladders were not changed while the save was on its way (that edit would be lost).
    if (this._draft && JSON.stringify(this._draft.ladders) === JSON.stringify(sent.ladders)) {
      this._draft = { ...this._draft, ladders: structuredClone(ladders) };
    }
  }

  private _noSpeaker() {
    return html`<p class="muted">${t("wizard.pick_a_speaker_first_press_back")}</p>`;
  }

  private _soundBlock(which: "cue" | "alarm", s: SpeakerCfg, intro: string, level: SpeakerLevel) {
    const sound = s[which];
    return html`
      <p>${t("wizard.which_nudge_plays_it_is_set", { intro })}</p>
      ${html`<div class="fields">
            <label class="num">
              ${t("common.sound_type")}
              <select @change=${(e: Event) => this._patchSound(which, { kind: (e.target as HTMLSelectElement).value as SoundKind })}>
                ${SOUND_KINDS().filter((k) => k.value === "file" || s.speech.route !== "tts").map((k) => html`<option value=${k.value} .selected=${k.value === sound.kind}>${k.label}</option>`)}
              </select>
            </label>
            <label class="num wide">
              ${sound.kind === "alexa" ? t("common.alexa_sound_id") : t("wizard.file_in_the_media_folder_or")}
              <input .value=${sound.sound} @input=${(e: Event) => this._patchSound(which, { sound: (e.target as HTMLInputElement).value })} />
            </label>
            ${sound.kind === "alexa"
              ? html`<div class="muted small">
                  ${rich("wizard.amazon_sound_hint", { library: html`<a href=${SOUND_LIBRARY_URL} target="_blank" rel="noreferrer">${t("wizard.amazon_sound_library")}</a>` })}
                </div>`
              : html`<div class="muted small">${rich("wizard.for_example_boopli_ding_mp3_in")}</div>`}
            ${which === "alarm"
              ? html`${this._numField(t("wizard.lasts_seconds"), sound.seconds, 3, 600, (n) => this._patchSound("alarm", { seconds: n }))}
                ${this._numField(t("wizard.repeats_every_seconds_0_once"), sound.repeat_s, 0, 60, (n) => this._patchSound("alarm", { repeat_s: n }))}`
              : nothing}
            <div><button type="button" @click=${() => this._try(`spk:${level}`, () => testSpeaker(this.hass!, s, level))}>${t("common.test")}</button></div>
            ${this._noteLine(`spk:${level}`)}
          </div>`}
    `;
  }

  private _renderSpkSpeech(s: SpeakerCfg, d: Settings) {
    const sp = s.speech;
    const patch = (p: Partial<SpeakerCfg["speech"]>) => this._patchSpeaker((x) => ({ ...x, speech: { ...x.speech, ...p } }));
    const targets = speechTargets(this.hass, sp.route, sp.target);
    return html`
      <p>${t("wizard.the_speaker_says_the_step_out")}</p>
      ${html`<div class="fields">
            <label class="num">
              ${t("wizard.how")}
              <select
                @change=${(e: Event) => {
                  const route = (e.target as HTMLSelectElement).value as SpeechRoute;
                  // Another media player can only play files, not Amazon's sounds.
                  const tone = (t: SpeakerCfg["cue"]) => (route === "tts" && t.kind === "alexa" ? { ...t, kind: "file" as SoundKind, sound: "" } : t);
                  this._patchSpeaker((x) => ({ ...x, cue: tone(x.cue), alarm: tone(x.alarm), speech: { ...x.speech, route, target: "", enabled: false } }));
                }}
              >
                ${ROUTES().map((r) => html`<option value=${r.value} .selected=${r.value === sp.route}>${r.label}</option>`)}
              </select>
            </label>
            <label class="num">
              ${sp.route === "tts" ? t("common.voice") : t("common.alexa_device")}
              <select @change=${(e: Event) => patch({ target: (e.target as HTMLSelectElement).value, enabled: !!(e.target as HTMLSelectElement).value })}>
                <option value="" .selected=${sp.target === ""}>${t("common.choose")}</option>
                ${targets.map((t) => html`<option value=${t.value} .selected=${t.value === sp.target}>${t.label}</option>`)}
              </select>
            </label>
            <label class="num wide">
              ${t("wizard.the_sentence_chore_and_step_are")}
              <input .value=${d.speech_template} @input=${(e: Event) => this._set({ speech_template: (e.target as HTMLInputElement).value })} />
            </label>
            <div><button type="button" @click=${() => this._try("spk:speech", () => testSpeaker(this.hass!, s, "speech"))}>${t("common.test")}</button></div>
            ${this._noteLine("spk:speech")}
          </div>`}
    `;
  }

  private _renderSpkWhen(s: SpeakerCfg) {
    return html`
      <p>
        ${rich("wizard.joins_the_standard_nudges_one_nudge", { name: this._fn(s.entity_id), item: t("common.nudge_it_your_way")  })}
      </p>
      <div class="actions inline-actions">
        <button type="button" ?disabled=${this._busy} @click=${() => this._addAnotherSpeaker()}>${t("wizard.add_another_speaker")}</button>
      </div>
    `;
  }

  private async _addAnotherSpeaker(): Promise<void> {
    if (!this.hass || !this._draft || this._busy) return;
    this._busy = true;
    try {
      const sent = structuredClone(this._draft);
      this._adoptLadders(await saveSettings(this.hass, sent), sent);
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
        ${t("wizard.optional_a_siren_switch_or_script")}
      </p>
      <div class="list">
        ${d.alarm_devices.map(
          (a) => html`<div class="choice">
            <span class="grow">${this._fn(a.entity_id)}</span>
            <button type="button" @click=${() => this._try(`alarm:${a.entity_id}`, () => testAlarmDevice(this.hass!, a))}>${t("wizard.test_3_s")}</button>
            <button type="button" aria-label=${t("common.remove")} @click=${() => this._set({ alarm_devices: d.alarm_devices.filter((x) => x.entity_id !== a.entity_id) })}>✕</button>
            ${this._noteLine(`alarm:${a.entity_id}`)}
          </div>`
        )}
      </div>
      <div class="choice">
        <select class="grow" @change=${(e: Event) => (this._addDevice = (e.target as HTMLSelectElement).value)}>
          <option value="" .selected=${this._addDevice === ""}>${t("wizard.add_a_siren_switch_or_script")}</option>
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
          ${t("common.add")}
        </button>
      </div>
    `;
  }

  private _renderAlarmDetail(d: Settings) {
    if (d.alarm_devices.length === 0) return html`<p class="muted">${t("wizard.no_alarm_device_is_set_up")}</p>`;
    return html`
      <p>${t("wizard.how_long_should_each_device_stay")}</p>
      <div class="list grid">
        ${d.alarm_devices.map((a: AlarmDeviceCfg) => {
          const patch = (p: Partial<AlarmDeviceCfg>) =>
            this._set({ alarm_devices: d.alarm_devices.map((x) => (x.entity_id === a.entity_id ? { ...x, ...p } : x)) });
          return html`<div class="choice col">
            <b>${this._fn(a.entity_id)}</b>
            ${this._numField(t("common.on_for_seconds"), a.seconds, 1, 600, (n) => patch({ seconds: n }))}
            <button type="button" @click=${() => this._try(`alarm:${a.entity_id}`, () => testAlarmDevice(this.hass!, a))}>${t("wizard.test_3_s")}</button>
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
        ${t("wizard.if_boopli_knows_where_you_are")}
      </p>
      <div class="field">
        <label for="presence">${t("wizard.which_person_are_you")}</label>
        <select id="presence" @change=${(e: Event) => this._set({ presence_entity: (e.target as HTMLSelectElement).value })}>
          <option value="" .selected=${d.presence_entity === ""}>${t("wizard.skip_assume_i_am_home")}</option>
          ${persons.map((id) => html`<option value=${id} .selected=${id === d.presence_entity}>${this._fn(id)}</option>`)}
        </select>
      </div>
    `;
  }

  private _renderChores() {
    const have = starterNamesTaken((this.snapshot?.chores ?? []).map((c) => c.name));
    return html`
      <p>
        ${t("wizard.some_chores_to_start_with_untick")}
      </p>
      <div class="list">
        ${TEMPLATES().map((tpl) => {
          const taken = have(tpl.draft.name);
          return html`<label class="inline option">
            <input
              type="checkbox"
              ?disabled=${taken}
              .checked=${!taken && this._picked.includes(tpl.label)}
              @change=${(e: Event) => {
                const on = (e.target as HTMLInputElement).checked;
                this._picked = on ? [...this._picked, tpl.label] : this._picked.filter((l) => l !== tpl.label);
              }}
            />
            <span>
              <b>${tpl.draft.name}</b>
              <span class="muted small">${taken ? t("wizard.already_added") : tpl.draft.steps.map((s) => s.title).join(" → ")}</span>
            </span>
          </label>`;
        })}
      </div>
    `;
  }

  private _renderAiIntro(d: Settings) {
    return html`
      <p>
        ${rich("wizard.boopli_can_split_a_big_task", { item: t("wizard.your_own")  })}
      </p>
      <p class="muted">
        ${t("wizard.boopli_sends_nothing_by_itself_when")}
      </p>
      <label class="inline option">
        <input
          type="checkbox"
          .checked=${d.ai.enabled}
          @change=${(e: Event) => this._set({ ai: { ...d.ai, enabled: (e.target as HTMLInputElement).checked } })}
        />
        ${t("common.switch_ai_help_on")}
      </label>
    `;
  }

  private _renderAiAgent(d: Settings) {
    const agents = entityIds(this.hass, ["ai_task"]);
    if (!d.ai.enabled) return html`<p class="muted">${t("wizard.ai_help_is_off_go_back")}</p>`;
    return html`
      <p>${t("wizard.which_ai_agent_should_boopli_use")}</p>
      <div class="field">
        <select @change=${(e: Event) => this._set({ ai: { ...d.ai, entity_id: (e.target as HTMLSelectElement).value } })}>
          <option value="" .selected=${d.ai.entity_id === ""}>${t("wizard.home_assistant_default")}</option>
          ${agents.map((id) => html`<option value=${id} .selected=${id === d.ai.entity_id}>${this._fn(id)}</option>`)}
        </select>
        ${agents.length === 0
          ? html`<div class="muted small">${t("wizard.no_ai_task_agent_found_yet")}</div>`
          : nothing}
      </div>
      <p class="muted small">${t("wizard.press_the_button_to_save_and")}</p>
      <div class="actions inline-actions">
        <button
          type="button"
          ?disabled=${this._busy}
          @click=${() => this._testAiAgent(d)}
        >
          ${t("wizard.save_and_test_the_agent")}
        </button>
      </div>
      ${this._noteLine("ai:test")}
    `;
  }

  private async _testAiAgent(d: Settings): Promise<void> {
    if (!this.hass) return;
    this._note("ai:test", t("wizard.saving_and_asking_the_agent"));
    try {
      const sent = structuredClone(d);
      this._adoptLadders(await saveSettings(this.hass, sent), sent);
      const result = await aiSteps(this.hass, t("common.make_a_cup_of_tea"), "now", []);
      this._note("ai:test", t("common.agent_test_works", { count: result.steps.length, first: result.steps[0]?.title ?? t("common.none") }));
    } catch (err) {
      this._note("ai:test", errorMessage(err));
    }
  }

  private _renderClaudeIntro(d: Settings) {
    return html`
      <p>
        ${rich("wizard.is_an_extra_button_next_to", { item: t("common.ask_claude")  })}
      </p>
      <p class="muted">
        ${rich("wizard.it_uses_you_make_a_small", { item: t("wizard.your_own_claude_account")  })}
      </p>
      <label class="inline option">
        <input
          type="checkbox"
          .checked=${!!d.ai.claude_enabled}
          @change=${(e: Event) => this._set({ ai: { ...d.ai, claude_enabled: (e.target as HTMLInputElement).checked } })}
        />
        ${t("common.switch_ask_claude_on")}
      </label>
      <p class="muted small">${t("wizard.not_interested_press_skip_or_go")}</p>
    `;
  }

  private async _copyRoutinePrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(routinePrompt());
      this._note("claude:copy", t("wizard.copied"));
    } catch {
      this._note("claude:copy", t("wizard.your_browser_did_not_allow_copying"));
    }
  }

  private _renderClaudeMake(d: Settings) {
    if (!d.ai.claude_enabled) return html`<p class="muted">${t("wizard.ask_claude_is_off_go_back")}</p>`;
    const host = routineHost(d.ai.claude_ha_url, this.snapshot);
    return html`
      <p>${rich("wizard.do_this_once_on_claude_ai")}</p>
      <ol class="how">
        <li>${rich("wizard.make_a_new_routine_name_it", { item: t("wizard.boopli")  })}</li>
        <li>
          ${t("wizard.paste_this_as_its_instructions")}
          <textarea class="code" rows="6" readonly aria-label=${t("wizard.routine_instructions")} .value=${routinePrompt()}></textarea>
          <div class="actions inline-actions">
            <button type="button" @click=${() => this._copyRoutinePrompt()}>${t("wizard.copy_the_instructions")}</button>
          </div>
          ${this._noteLine("claude:copy")}
        </li>
        <li>
          ${rich("wizard.make_an_environment")}
          ${host
            ? html`<code>${host}</code>`
            : html`${rich("wizard.home_assistant_address_unknown")}`}
        </li>
        <li>${rich("wizard.add_an_to_the_routine_and", { item: t("wizard.api_trigger"), item2: t("wizard.generate_token")  })}</li>
        <li>${rich("wizard.leave_every_connector_gmail_calendar_and", { item: t("wizard.off")  })}</li>
      </ol>
      <p class="muted small">${t("wizard.claudes_screens_change_now_and_then")}</p>
    `;
  }

  private _renderClaudePaste(d: Settings) {
    if (!d.ai.claude_enabled) return html`<p class="muted">${t("wizard.ask_claude_is_off_go_back")}</p>`;
    return html`
      <p>${t("wizard.paste_the_routines_fire_address_and")}</p>
      <boopli-claude
        .hass=${this.hass}
        .snapshot=${this.snapshot}
        .ai=${d.ai}
        .hideIntro=${true}
        .beforeTest=${async () => {
          if (!this.hass) return;
          const sent = structuredClone(d);
          this._adoptLadders(await saveSettings(this.hass, sent), sent);
        }}
        @ai-patch=${(e: CustomEvent<Partial<Settings["ai"]>>) => this._set({ ai: { ...d.ai, ...e.detail } })}
      ></boopli-claude>
      <p class="muted small">${t("wizard.the_test_saves_your_settings_first")}</p>
    `;
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
    const adding = TEMPLATES().filter((t) => this._picked.includes(t.label)).map((t) => t.draft.name);
    if (this._first && adding.length) changes.push(t("wizard.chores_added", { join: adding.join(", ") }));
    return html`
      <p>${rich(this._first ? "wizard.what_changed_before_setup" : "wizard.what_changed_in_setup")}</p>
      ${changes.length === 0
        ? html`<p class="muted">${t("wizard.nothing_changed")}</p>`
        : html`<ul>${changes.map((c) => html`<li>${c}</li>`)}</ul>`}
      ${this.wizard === "wall" && this._board()
        ? html`<p>${t("wizard.next_put_the_tiles_where_you")}</p>
            <p><button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._editOnWall()}>${t("wizard.edit_it_on_the_wall")}</button></p>
            <p class="small">${rich("wizard.link_for_the_tablets_start_page", { value: boardLink(this._board()!) })}</p>`
        : nothing}
      <p class="muted small">
        ${t("wizard.everything_can_be_changed_again_in")}
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
      case "claude_intro":
        return this._renderClaudeIntro(d);
      case "claude_make":
        return this._renderClaudeMake(d);
      case "claude_paste":
        return this._renderClaudePaste(d);
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
        return s ? this._soundBlock("cue", s, t("wizard.a_short_friendly_sound_the_gentlest"), "cue") : this._noSpeaker();
      case "spk_speech":
        return s ? this._renderSpkSpeech(s, d) : this._noSpeaker();
      case "spk_alarm":
        return s
          ? this._soundBlock("alarm", s, t("wizard.a_loud_sound_that_repeats_for"), "alarm")
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
    if (!d) return html`<p class="muted">${t("common.loading")}</p>`;
    const step = this._step;
    const isDone = step === "done";
    const isGate = step === "speaker_gate" || step === "lad_more" || step === "lad_delete"; // these screens have their own buttons
    const last = this._steps.length - 1;
    return html`
      <div class="shell">
        <nav class="rail" aria-label=${t("common.steps")}>
          <div class="rail-title">${WIZARD_TITLES()[this.wizard]}</div>
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
            <span class="muted small">${t("schedule_wizard.step_of", { value: this._index + 1, count: this._steps.length })}</span>
            ${isDone && this._first
              ? nothing
              : html`<button type="button" class="link" ?disabled=${this._busy} @click=${() => this._leave()}>
                  ${this._first ? t("wizard.skip_for_now") : t("common.close")}
                </button>`}
          </div>
          <div class="bar"><div class="fill" style="width:${((this._index + 1) / this._steps.length) * 100}%"></div></div>
          <h2>${this._title(step, this._index)}</h2>
          ${OPTIONAL_STEPS.includes(step)
            ? html`<div class="muted small optional">${t("wizard.optional_details_skip_if_the_defaults")}</div>`
            : nothing}
          ${this._renderStep(d)}
          ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
          <div class="actions">
            ${this._index > 0
              ? html`<button type="button" ?disabled=${this._busy} @click=${() => this._go(-1)}>${t("common.back")}</button>`
              : nothing}
            <span class="spacer"></span>
            ${isDone
              ? html`<button type="button" class="primary" ?disabled=${this._busy} @click=${() => this._finish()}>
                  ${this._first ? t("wizard.finish") : t("settings.save_and_close")}
                </button>`
              : isGate
                ? nothing
                : html`${step === "lad_name" || step === "lad_start" || step === "lad_nudge" ? nothing : html`<button type="button" ?disabled=${this._busy} @click=${() => this._go(1, "skip")}>${t("wizard.skip")}</button>`}
                    <button type="button" class="primary" ?disabled=${this._busy || this._index >= last} @click=${() => this._go(1)}>${t("common.next")}</button>`}
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
      .sequence-type {
        margin-inline-end: 0.15em;
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
        overflow-wrap: anywhere;
      }
      ol.how {
        padding-left: 22px;
        max-width: 760px;
      }
      ol.how li {
        margin: 10px 0;
      }
      textarea.code {
        display: block;
        width: 100%;
        margin-top: 6px;
        font-family: monospace;
        font-size: 14px;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 8px 10px;
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
