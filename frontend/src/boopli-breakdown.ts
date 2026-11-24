import { LitElement, html, css, nothing } from "lit";
import { icon } from "./icon";
import { aiPreview, aiQuestions, aiSteps, errorMessage, roomsGuess, scenePhotos } from "./api";
import { agentOn, anyAi, claudeReady, waitSeconds } from "./claude";
import "./boopli-wait";
import { MAX_PHOTOS, shrinkPhoto } from "./photos";
import { sharedStyles } from "./styles";
import type { AiAnswer, AiPreview, AiQuestion, AiStep, ChoreQuestion, Hass, Room, Snapshot, StepSize, Via } from "./types";
import { t } from "./i18n";

type Phase = "task" | "interview" | "working" | "review";
type Kind = "now" | "recurring";

/** What the breakdown hands back. The host decides what to do with it. */
export interface BreakdownResult {
  action: "start" | "save" | "schedule" | "replace" | "append";
  task: string;
  steps: AiStep[];
  notes: string;
  questions: ChoreQuestion[]; // asked every time the chore starts; steps point to them with only_if
}

const SIZES = (): { value: StepSize; letter: string; label: string; xp: number }[] => [
  { value: "small", letter: t("breakdown.letter_small"), label: t("breakdown.small_quick_and_easy"), xp: 10 },
  { value: "medium", letter: t("breakdown.letter_medium"), label: t("breakdown.medium_takes_some_effort"), xp: 15 },
  { value: "big", letter: t("breakdown.letter_big"), label: t("breakdown.big_hard_or_long"), xp: 20 },
];
const XP = { small: 10, medium: 15, big: 20 } as const;
const FINISH_BONUS = 20;
const MAX_STEPS = 50;

/**
 * Break a task down with your own AI agent: you say what you want to get done,
 * the AI asks what it needs to know (tap an option, or write in your own words,
 * as much as you like), then you get small steps to check and change.
 * Nothing is created until you press a button at the end.
 */
export class BoopliBreakdown extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    kind: { type: String },
    task: { type: String },
    notes: { type: String },
    mode: { type: String }, // "page": start or save a task. "editor": fill a chore's steps.
    hasSteps: { type: Boolean }, // editor mode: the chore already has steps
    externalError: { type: String }, // a problem the host had with the result
    _phase: { state: true },
    _task: { state: true },
    _answers: { state: true },
    _questions: { state: true },
    _picked: { state: true },
    _typed: { state: true },
    _extra: { state: true },
    _steps: { state: true },
    _checks: { state: true },
    _notes: { state: true },
    _busy: { state: true },
    _error: { state: true },
    _round: { state: true },
    _rooms: { state: true },
    _preview: { state: true },
    _scene: { state: true },
    _photos: { state: true },
    _photosOpen: { state: true },
    _looking: { state: true },
    _sending: { state: true },
    _via: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare kind: Kind;
  declare task: string;
  declare notes: string;
  declare mode: "page" | "editor";
  declare hasSteps: boolean;
  declare externalError: string;
  declare _phase: Phase;
  declare _task: string;
  declare _answers: AiAnswer[];
  declare _questions: AiQuestion[];
  declare _picked: string[][]; // chosen options per question
  declare _typed: string[]; // own words per question
  declare _extra: string;
  declare _steps: AiStep[];
  declare _checks: ChoreQuestion[]; // yes/no questions the AI wrote for a chore that repeats
  declare _notes: string;
  declare _busy: boolean;
  declare _error: string;
  declare _round: number;
  declare _rooms: string[]; // ids of the rooms whose notes go along
  declare _preview: AiPreview | null; // exactly what would be sent, when the user asks
  declare _scene: string; // what the place looks like today, from a one-time look at photos (text only)
  declare _photos: string[]; // shrunk photos waiting to be looked at; never kept
  declare _photosOpen: boolean;
  declare _looking: boolean;
  declare _sending: boolean; // the photos are with the agent right now
  declare _via: Via; // who is answering this round: the agent, or Claude (the extra)
  private _roomsTouched = false; // the user chose the rooms, so stop guessing
  private _guessedFor: string | null = null;
  private _guessing?: Promise<void>;
  private _guessTimer?: number;
  private _started = false;
  private _askId = 0; // counts requests, so an answer the person stopped waiting for is dropped
  private _backPhase: Phase = "task";
  private _lookId = 0; // the same for the look at photos
  private _lookVia: Via = "agent"; // who is looking at the photos right now

  constructor() {
    super();
    this.kind = "now";
    this.task = "";
    this.notes = "";
    this.mode = "page";
    this.hasSteps = false;
    this.externalError = "";
    this._phase = "task";
    this._task = "";
    this._answers = [];
    this._questions = [];
    this._picked = [];
    this._typed = [];
    this._extra = "";
    this._steps = [];
    this._checks = [];
    this._notes = "";
    this._busy = false;
    this._error = "";
    this._round = 0;
    this._rooms = [];
    this._preview = null;
    this._scene = "";
    this._photos = [];
    this._photosOpen = false;
    this._looking = false;
    this._sending = false;
    this._via = "agent";
  }

  protected willUpdate(): void {
    if (this._started) return;
    this._started = true;
    this._task = this.task;
    this._notes = this.notes;
  }

  protected firstUpdated(): void {
    // A task that came with the click starts the questions at once.
    if (this._task.trim() && this._aiOn()) void this._begin();
    else void this._guess();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearTimeout(this._guessTimer);
  }

  // --- rooms: which notes go along ---------------------------------------------------

  private _homeOn(): boolean {
    return !!this.snapshot?.home?.enabled;
  }

  /** Rooms that have notes: only these have anything to send. */
  private _notedRooms(): Room[] {
    return (this.snapshot?.home?.rooms ?? []).filter((r) => !r.hidden && r.notes.trim());
  }

  /** Guess the rooms from the words of the task, unless the user already chose. */
  private _guess(): Promise<void> {
    window.clearTimeout(this._guessTimer);
    const task = this._task.trim();
    if (!this.hass || !task || this._roomsTouched || !this._homeOn()) return Promise.resolve();
    if (this._guessedFor === task && this._guessing) return this._guessing; // already running or done
    this._guessedFor = task;
    this._guessing = (async () => {
      try {
        const ids = await roomsGuess(this.hass!, task);
        if (this._roomsTouched || this._task.trim() !== task) return;
        const noted = new Set(this._notedRooms().map((r) => r.id));
        this._rooms = ids.filter((id) => noted.has(id));
        this._preview = null;
      } catch {
        this._rooms = [];
      }
    })();
    return this._guessing;
  }

  private _onTaskInput(value: string): void {
    this._task = value;
    window.clearTimeout(this._guessTimer);
    this._guessTimer = window.setTimeout(() => void this._guess(), 400);
  }

  private _toggleRoom(id: string): void {
    this._roomsTouched = true;
    this._rooms = this._rooms.includes(id) ? this._rooms.filter((r) => r !== id) : [...this._rooms, id];
    this._preview = null;
  }

  private async _showPreview(): Promise<void> {
    if (!this.hass) return;
    if (this._preview) {
      this._preview = null;
      return;
    }
    try {
      this._preview = await aiPreview(
        this.hass,
        this._task.trim() || t("breakdown.your_task"),
        this.kind,
        this._answers,
        this._notes,
        this._rooms,
        this._scene
      );
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private _renderRooms() {
    if (!this._homeOn()) return nothing;
    const noted = this._notedRooms();
    if (noted.length === 0) {
      return html`<p class="muted small roomtip">
        ${t("breakdown.tip_tell_boopli_about_your_rooms")}
        <button type="button" class="link" @click=${() => this._fire("open-home")}>${t("breakdown.open_my_home")}</button>
      </p>`;
    }
    const chosen = noted.filter((r) => this._rooms.includes(r.id));
    return html`<div class="rooms">
      <div class="roomline">
        <span class="muted small">${t("breakdown.room_notes_the_ai_will_see")}</span>
        ${noted.map(
          (r) => html`<button
            type="button"
            class="chip ${this._rooms.includes(r.id) ? "on" : ""}"
            aria-pressed=${this._rooms.includes(r.id)}
            @click=${() => this._toggleRoom(r.id)}
          >
            ${r.name}
          </button>`
        )}
        ${chosen.length === 0 ? html`<span class="muted small">${t("breakdown.none")}</span>` : nothing}
        <button type="button" class="link" @click=${() => this._showPreview()}>
          ${this._preview ? t("breakdown.hide_what_is_sent") : t("breakdown.what_will_the_ai_see")}
        </button>
      </div>
      ${this._preview
        ? html`<div class="preview">
            ${this._preview.shortened ? html`<div class="muted small">${t("breakdown.a_long_note_was_shortened_to")}</div>` : nothing}
            <pre>${this._preview.instructions}</pre>
          </div>`
        : nothing}
    </div>`;
  }

  // --- photos of how it looks now: one look, text only -------------------------------------

  private async _addPhotos(files: FileList | null): Promise<void> {
    if (!files) return;
    const room = Math.max(0, MAX_PHOTOS - this._photos.length);
    this._error = "";
    this._looking = true;
    try {
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, room)) added.push(await shrinkPhoto(file));
      this._photos = [...this._photos, ...added];
      if (files.length > room) this._error = t("breakdown.up_to_photos_the_rest_were", { max_photos: MAX_PHOTOS });
    } catch (err) {
      this._error = errorMessage(err);
    }
    this._looking = false;
  }

  /** Send the photos once, keep only the text the agent writes about them. */
  private async _look(via: Via = "agent"): Promise<void> {
    if (!this.hass || !this._photos.length || !this._task.trim()) return;
    this._error = "";
    const id = ++this._lookId;
    this._lookVia = via;
    this._sending = true;
    this._looking = true;
    try {
      await this._guess();
      if (id !== this._lookId) return; // stopped while the rooms were being guessed: send nothing
      const result = await scenePhotos(this.hass, this._task.trim(), this._photos, this._rooms, via);
      if (id !== this._lookId) return; // the person stopped waiting
      this._scene = result.scene;
      this._photos = []; // the photos are gone; only the text goes on
      this._photosOpen = false;
      this._preview = null;
    } catch (err) {
      if (id === this._lookId) this._error = errorMessage(err);
    }
    if (id === this._lookId) {
      this._looking = false;
      this._sending = false;
    }
  }

  private _stopLooking(): void {
    this._lookId++;
    this._looking = false;
    this._sending = false;
    this._error = t("common.you_stopped_waiting_your_photos_are");
  }

  private _renderScene() {
    if (!anyAi(this.snapshot)) return nothing;
    if (this._scene) {
      return html`<div class="scene">
        <label for="scene">${t("breakdown.what_the_ai_sees_today_from")}</label>
        <textarea
          id="scene"
          rows="5"
          maxlength="1500"
          .value=${this._scene}
          @input=${(e: Event) => {
            this._scene = (e.target as HTMLTextAreaElement).value;
            this._preview = null;
          }}
        ></textarea>
        <div class="muted small">${t("breakdown.the_photos_are_already_gone_this")}</div>
        <button type="button" class="link" @click=${() => ((this._scene = ""), (this._preview = null))}>${t("breakdown.remove_it")}</button>
      </div>`;
    }
    if (!this._photosOpen) {
      return html`<div class="scene">
        <button type="button" @click=${() => (this._photosOpen = true)}>${icon("camera-outline")} ${t("breakdown.add_photos_of_how_it_looks")}</button>
      </div>`;
    }
    const full = this._photos.length >= MAX_PHOTOS;
    return html`<div class="scene">
      <p class="muted small">
        ${t("breakdown.take_or_pick_up_to_photos", { max_photos: MAX_PHOTOS })}
      </p>
      <div class="thumbs">
        ${this._photos.map(
          (src, i) => html`<div class="thumb">
            <img src=${src} alt=${t("breakdown.photo", { n: i + 1 })} />
            <button type="button" class="x" aria-label=${t("breakdown.remove_photo", { n: i + 1 })} @click=${() => (this._photos = this._photos.filter((_, k) => k !== i))}>×</button>
          </div>`
        )}
      </div>
      ${this._sending
        ? html`<boopli-wait
            .label=${this._lookVia === "claude" ? t("common.claude_is_looking_at_your_photos") : t("common.the_ai_is_looking_at_your")}
            .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
            .max=${waitSeconds(this.snapshot, this._lookVia)}
            @stop-waiting=${() => this._stopLooking()}
          ></boopli-wait>`
        : this._looking
          ? html`<div class="muted" role="status">${t("breakdown.preparing")}</div>`
          : html`<div class="actions">
            <label class="filebtn ${full ? "off" : ""}">
              ${this._photos.length ? t("common.add_another_photo") : t("common.take_or_pick_photos")}
              <input
                type="file"
                accept="image/*"
                multiple
                ?disabled=${full}
                @change=${(e: Event) => {
                  const input = e.target as HTMLInputElement;
                  void this._addPhotos(input.files).then(() => (input.value = ""));
                }}
              />
            </label>
            ${agentOn(this.snapshot)
              ? html`<button class="primary" ?disabled=${!this._photos.length || !this._task.trim()} @click=${() => this._look("agent")}>
                  ${t("breakdown.look_at_the_photos")}
                </button>`
              : nothing}
            ${claudeReady(this.snapshot)
              ? html`<button
                  class=${agentOn(this.snapshot) ? "" : "primary"}
                  ?disabled=${!this._photos.length || !this._task.trim()}
                  @click=${() => this._look("claude")}
                >
                  ${icon("creation")} ${t("breakdown.ask_claude_to_look")}
                </button>`
              : nothing}
            <button type="button" class="link" @click=${() => ((this._photosOpen = false), (this._photos = []))}>${t("common.cancel")}</button>
          </div>`}
      <div class="muted small">
        ${agentOn(this.snapshot)
          ? t("breakdown.the_agent_has_to_be_able")
          : ""}${claudeReady(this.snapshot)
          ? t("common.claude_gets_each_photo_through_a")
          : ""}
      </div>
    </div>`;
  }

  /** Is any helper available: the Home Assistant agent, or Ask Claude? */
  private _aiOn(): boolean {
    return anyAi(this.snapshot);
  }

  /** Who answers now: the one asked for, else the agent, else Claude when it is the only one. */
  private _choose(via?: Via): void {
    this._via = via ?? (agentOn(this.snapshot) ? this._via : "claude");
  }

  private _fire(name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  // --- talking to the AI ----------------------------------------------------------

  /** Run a call to the AI agent with a busy flag and a readable error. */
  private async _ask<T>(run: () => Promise<T>, phaseAfterError: Phase): Promise<T | null> {
    const id = ++this._askId;
    this._backPhase = phaseAfterError;
    this._busy = true;
    this._error = "";
    try {
      const result = await run();
      return id === this._askId ? result : null; // the person stopped waiting: drop a late answer
    } catch (err) {
      if (id !== this._askId) return null;
      this._error = errorMessage(err);
      this._phase = phaseAfterError;
      return null;
    } finally {
      if (id === this._askId) this._busy = false;
    }
  }

  /** The person gave up waiting: go back, keep everything they typed, ignore a late answer. */
  private _stopWaiting(): void {
    this._askId++;
    this._busy = false;
    this._phase = this._backPhase;
    this._error = t("breakdown.you_stopped_waiting_your_task_and");
  }

  private async _begin(via?: Via): Promise<void> {
    if (!this.hass || !this._task.trim()) return;
    this._choose(via);
    const asking = this._via; // the helper this round was started with, whatever happens meanwhile
    this._answers = [];
    this._round = 0;
    this._phase = "working";
    this._backPhase = "task";
    const owner = ++this._askId; // "Stop waiting" during the guess must stop the request that follows
    await this._guess();
    if (owner !== this._askId) return;
    const result = await this._ask(
      () => aiQuestions(this.hass!, this._task.trim(), this.kind, [], this._notes, this._rooms, this._scene, asking),
      "task"
    );
    if (!result) return;
    this._showQuestions(result.enough, result.questions);
  }

  private _showQuestions(enough: boolean, questions: AiQuestion[]): void {
    if (enough || questions.length === 0) {
      void this._loadSteps();
      return;
    }
    this._questions = questions;
    this._picked = questions.map(() => []);
    this._typed = questions.map(() => "");
    this._extra = "";
    this._round += 1;
    this._phase = "interview";
  }

  /** The answers typed or tapped on the screen now, as question and answer pairs. */
  private _currentAnswers(): AiAnswer[] {
    const out: AiAnswer[] = [];
    this._questions.forEach((q, i) => {
      const parts = [...this._picked[i], this._typed[i].trim()].filter(Boolean);
      if (parts.length) out.push({ question: q.text, answer: parts.join(", ") });
    });
    if (this._extra.trim()) out.push({ question: t("breakdown.anything_else_to_know"), answer: this._extra.trim() });
    return out;
  }

  private async _send(): Promise<void> {
    if (!this.hass) return;
    const answers = [...this._answers, ...this._currentAnswers()];
    this._answers = answers;
    this._phase = "working";
    const result = await this._ask(
      () => aiQuestions(this.hass!, this._task.trim(), this.kind, answers, this._notes, this._rooms, this._scene, this._via),
      "interview"
    );
    if (!result) return;
    this._showQuestions(result.enough, result.questions);
  }

  private async _enough(): Promise<void> {
    this._answers = [...this._answers, ...this._currentAnswers()];
    await this._loadSteps();
  }

  private async _loadSteps(via?: Via): Promise<void> {
    if (!this.hass) return;
    if (via || this._phase === "task") this._choose(via);
    const asking = this._via;
    this._phase = "working";
    this._backPhase = this._questions.length ? "interview" : "task";
    const owner = ++this._askId;
    await this._guess();
    if (owner !== this._askId) return;
    const result = await this._ask(
      () => aiSteps(this.hass!, this._task.trim(), this.kind, this._answers, this._notes, this._rooms, this._scene, asking),
      this._questions.length ? "interview" : "task"
    );
    if (!result) return;
    this._steps = result.steps.slice(0, MAX_STEPS);
    this._checks = this.kind === "recurring" ? (result.questions ?? []) : [];
    if (result.summary && !this._notes.includes(result.summary)) {
      this._notes = [this._notes, result.summary].filter(Boolean).join("\n");
    }
    this._phase = "review";
  }

  // --- reviewing the steps ---------------------------------------------------------

  private _patchStep(index: number, patch: Partial<AiStep>): void {
    this._steps = this._steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
  }

  private _move(index: number, by: -1 | 1): void {
    const target = index + by;
    if (target < 0 || target >= this._steps.length) return;
    const steps = [...this._steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    this._steps = steps;
  }

  private _remove(index: number): void {
    this._steps = this._steps.filter((_, i) => i !== index);
  }

  private _add(afterIndex: number): void {
    const group = this._steps[afterIndex]?.group ?? "";
    const steps = [...this._steps];
    steps.splice(afterIndex + 1, 0, { title: "", group, size: "small", wait_minutes: 0 });
    this._steps = steps.slice(0, MAX_STEPS);
  }

  private _finish(action: BreakdownResult["action"]): void {
    const steps = this._steps.filter((s) => s.title.trim()).map((s) => ({ ...s, title: s.title.trim() }));
    if (steps.length === 0) {
      this._error = t("breakdown.there_is_no_step_yet_add");
      return;
    }
    // Only the questions that a step still points to are kept, with a text that is not empty.
    const usedIds = new Set(steps.map((s) => s.only_if).filter(Boolean));
    const questions = this._checks.filter((q) => q.text.trim() && usedIds.has(q.id)).map((q) => ({ ...q, text: q.text.trim() }));
    const known = new Set(questions.map((q) => q.id));
    this._fire("breakdown-result", {
      action,
      task: this._task.trim(),
      steps: steps.map((s) => (s.only_if && !known.has(s.only_if) ? { ...s, only_if: "" } : s)),
      notes: this._notes.trim(),
      questions,
    } satisfies BreakdownResult);
  }

  private _patchCheck(id: string, text: string): void {
    this._checks = this._checks.map((q) => (q.id === id ? { ...q, text } : q));
  }

  /** Take a question away: the steps that pointed to it stay, as steps that are always there. */
  private _removeCheck(id: string): void {
    this._checks = this._checks.filter((q) => q.id !== id);
    this._steps = this._steps.map((s) => (s.only_if === id ? { ...s, only_if: "" } : s));
  }

  private _cancel(): void {
    this._fire("breakdown-cancel");
  }

  // --- screens ---------------------------------------------------------------------

  private _renderOff() {
    return html`<section class="card main">
      <h2>${t("breakdown.ai_help_is_switched_off")}</h2>
      <p>
        ${t("breakdown.to_split_tasks_into_small_steps")}
      </p>
      <div class="actions">
        <button class="primary" @click=${() => this._fire("open-wizard", { wizard: "ai" })}>${t("common.set_up_ai_help")}</button>
        <button @click=${() => this._cancel()}>${t("common.close")}</button>
      </div>
    </section>`;
  }

  private _renderTask() {
    return html`
      <p>
        ${this.kind === "recurring"
          ? t("breakdown.what_is_the_chore_i_will")
          : t("breakdown.what_do_you_want_to_get")}
      </p>
      <textarea
        rows="3"
        placeholder=${this.kind === "recurring" ? t("breakdown.for_example_clean_my_room") : t("today.for_example_clean_the_bathroom")}
        .value=${this._task}
        @input=${(e: Event) => this._onTaskInput((e.target as HTMLTextAreaElement).value)}
      ></textarea>
      ${this._renderRooms()}
      ${this._renderScene()}
      <div class="actions">
        ${agentOn(this.snapshot)
          ? html`<button class="primary big" ?disabled=${!this._task.trim() || this._busy} @click=${() => this._begin("agent")}>
              ${this.kind === "recurring" ? t("breakdown.ask_me_about_it") : t("breakdown.break_it_down")}
            </button>`
          : nothing}
        ${claudeReady(this.snapshot)
          ? html`<button
              class="${agentOn(this.snapshot) ? "" : "primary "}big"
              ?disabled=${!this._task.trim() || this._busy}
              @click=${() => this._begin("claude")}
            >
              ${icon("creation")} ${t("common.ask_claude")}
            </button>`
          : nothing}
        <button ?disabled=${!this._task.trim() || this._busy} @click=${() => this._loadSteps(agentOn(this.snapshot) ? "agent" : "claude")}>
          ${t("breakdown.skip_the_questions")}
        </button>
      </div>
      ${claudeReady(this.snapshot)
        ? html`<div class="muted small">
            ${t("breakdown.claude_asks_left", { count: this.snapshot?.claude?.fires_left ?? 0 })}
          </div>`
        : nothing}
    `;
  }

  private _renderQuestion(q: AiQuestion, i: number) {
    const picked = this._picked[i] ?? [];
    return html`<div class="question">
      <div class="qtext">${q.text}</div>
      <div class="chips">
        ${q.options.map((o) => {
          const on = picked.includes(o);
          return html`<button
            type="button"
            class="chip big ${on ? "on" : ""}"
            aria-pressed=${on}
            @click=${() => {
              // Read the selection as it is now, not as it was at the last redraw.
              const current = this._picked[i] ?? [];
              const isOn = current.includes(o);
              const next = q.multiple
                ? isOn
                  ? current.filter((p) => p !== o)
                  : [...current, o]
                : isOn
                  ? []
                  : [o];
              this._picked = this._picked.map((p, k) => (k === i ? next : p));
            }}
          >
            ${o}
          </button>`;
        })}
      </div>
      <textarea
        rows="1"
        class="own"
        placeholder=${t("common.or_write_it_in_your_own")}
        .value=${this._typed[i] ?? ""}
        @input=${(e: Event) =>
          (this._typed = this._typed.map((t, k) => (k === i ? (e.target as HTMLTextAreaElement).value : t)))}
      ></textarea>
    </div>`;
  }

  private _renderInterview() {
    return html`
      ${this._answers.length
        ? html`<details class="said">
            <summary>${t("breakdown.what_you_told_me_so_far", { count: this._answers.length })}</summary>
            <ul>
              ${this._answers.map((a) => html`<li><span class="muted">${a.question}</span> ${a.answer}</li>`)}
            </ul>
          </details>`
        : nothing}
      <p class="muted small">
        ${this._round > 1 ? t("breakdown.a_few_more_things_so_the") : t("breakdown.a_few_questions_so_the_steps")} ${t("common.tap_what_fits")}
      </p>
      ${this._renderRooms()}
      ${this._renderScene()}
      ${this._questions.map((q, i) => this._renderQuestion(q, i))}
      <div class="question">
        <div class="qtext">${t("breakdown.anything_else_i_should_know")}</div>
        <textarea
          rows="2"
          class="own"
          placeholder=${t("home.optional_long_answers_are_welcome")}
          .value=${this._extra}
          @input=${(e: Event) => (this._extra = (e.target as HTMLTextAreaElement).value)}
        ></textarea>
      </div>
      <div class="actions">
        <button class="primary big" ?disabled=${this._busy} @click=${() => this._send()}>${t("home.next_questions")}</button>
        <button class="big" ?disabled=${this._busy} @click=${() => this._enough()}>${t("breakdown.enough_go_on")}</button>
      </div>
    `;
  }

  private _renderWorking() {
    return html`<boopli-wait
      .label=${this._via === "claude"
        ? t("common.asking_claude_this_takes_a_little")
        : this._answers.length || this._steps.length
          ? t("breakdown.writing_the_steps")
          : t("common.thinking")}
      .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
      .max=${waitSeconds(this.snapshot, this._via)}
      @stop-waiting=${() => this._stopWaiting()}
    ></boopli-wait>`;
  }

  private _xp(): number {
    return this._steps.reduce((sum, s) => sum + XP[s.size], 0) + FINISH_BONUS;
  }

  private _renderStep(s: AiStep, i: number) {
    const showGroup = i === 0 || this._steps[i - 1].group !== s.group;
    return html`
      ${showGroup && s.group ? html`<div class="group">${s.group}</div>` : nothing}
      <div class="step">
        <span class="num">${i + 1}</span>
        <input
          class="title"
          aria-label=${t("breakdown.step", { n: i + 1 })}
          placeholder=${t("chore_editor.what_to_do")}
          .value=${s.title}
          @input=${(e: Event) => this._patchStep(i, { title: (e.target as HTMLInputElement).value })}
        />
        <span class="sizes" role="group" aria-label=${t("breakdown.size")}>
          ${SIZES().map(
            (z) => html`<button
              type="button"
              class="chip size ${s.size === z.value ? "on" : ""}"
              title=${t("breakdown.xp", { label: z.label, xp: z.xp })}
              aria-pressed=${s.size === z.value}
              @click=${() => this._patchStep(i, { size: z.value })}
            >
              ${z.letter}
            </button>`
          )}
        </span>
        ${s.wait_minutes > 0
          ? html`<span class="wait muted small" title=${t("breakdown.time_to_wait_before_this_step")}>${t("breakdown.min", { wait_minutes: s.wait_minutes })}</span>`
          : nothing}
        <span class="tools">
          <button type="button" aria-label=${t("ladders.move_up")} ?disabled=${i === 0} @click=${() => this._move(i, -1)}>↑</button>
          <button type="button" aria-label=${t("ladders.move_down")} ?disabled=${i === this._steps.length - 1} @click=${() => this._move(i, 1)}>↓</button>
          <button type="button" aria-label=${t("breakdown.add_a_step_after_this")} @click=${() => this._add(i)}>+</button>
          <button type="button" aria-label=${t("common.remove")} @click=${() => this._remove(i)}>✕</button>
        </span>
      </div>
      ${this._checks.length
        ? html`<div class="only-if">
            <label>
              <span class="muted small">${t("breakdown.only_if")}</span>
              <select aria-label=${t("breakdown.only_if_for_step", { n: i + 1 })} @change=${(e: Event) => this._patchStep(i, { only_if: (e.target as HTMLSelectElement).value })}>
                <option value="" ?selected=${!s.only_if}>${t("common.always_there")}</option>
                ${this._checks.map((q) => html`<option value=${q.id} ?selected=${s.only_if === q.id}>${t("breakdown.yes", { text: q.text })}</option>`)}
              </select>
            </label>
          </div>`
        : nothing}
    `;
  }

  private _renderChecks() {
    if (!this._checks.length) return nothing;
    return html`<div class="checks">
      <b>${t("breakdown.questions_asked_each_time_you_start")}</b>
      <div class="muted small">
        ${t("breakdown.today_it_may_look_different_than")}
      </div>
      ${this._checks.map(
        (q) => html`<div class="check">
          <input aria-label=${t("chore_editor.question")} .value=${q.text} @input=${(e: Event) => this._patchCheck(q.id, (e.target as HTMLInputElement).value)} />
          <button type="button" aria-label=${t("chore_editor.remove_this_question")} @click=${() => this._removeCheck(q.id)}>✕</button>
        </div>`
      )}
    </div>`;
  }

  private _renderReview() {
    const steps = this._steps;
    const editor = this.mode === "editor";
    return html`
      <p>
        <b>${t("common.steps_count", { count: steps.length })}</b>
        <span class="muted"> ${t("breakdown.worth_about_xp_when_all_are", { xp: this._xp() })}</span>
      </p>
      ${this._renderChecks()}
      <div class="steps">${steps.map((s, i) => this._renderStep(s, i))}</div>
      <div class="inline-actions">
        <button type="button" @click=${() => this._add(steps.length - 1)}>${t("breakdown.add_a_step")}</button>
        <button type="button" ?disabled=${this._busy} @click=${() => this._loadSteps()}>${t("breakdown.try_again")}</button>
        ${agentOn(this.snapshot) && claudeReady(this.snapshot)
          ? html`<button type="button" ?disabled=${this._busy} @click=${() => this._loadSteps("claude")}>
              ${icon("creation")} ${t("breakdown.ask_claude_instead")}
            </button>`
          : nothing}
        ${this._answers.length || this._questions.length
          ? html`<button type="button" ?disabled=${this._busy} @click=${() => this._begin()}>${t("breakdown.ask_me_again")}</button>`
          : nothing}
      </div>
      ${this.kind === "recurring" || editor
        ? html`<div class="field">
            <label for="notes">${t("breakdown.kept_with_the_chore_for_next")}</label>
            <textarea id="notes" rows="2" .value=${this._notes} @input=${(e: Event) => (this._notes = (e.target as HTMLTextAreaElement).value)}></textarea>
          </div>`
        : nothing}
      <div class="actions">
        ${editor
          ? this.hasSteps
            ? html`<button class="primary big" @click=${() => this._finish("replace")}>${t("breakdown.replace_my_steps")}</button>
                <button class="big" @click=${() => this._finish("append")}>${t("breakdown.add_to_my_steps")}</button>`
            : html`<button class="primary big" @click=${() => this._finish("replace")}>${t("breakdown.use_these_steps")}</button>`
          : this.kind === "recurring"
            ? html`<button class="primary big" @click=${() => this._finish("schedule")}>${t("breakdown.save_and_set_the_schedule")}</button>
                <button class="big" @click=${() => this._finish("save")}>${t("breakdown.save_without_a_schedule")}</button>`
            : html`<button class="primary big" @click=${() => this._finish("start")}>${t("common.start_now")}</button>
                <button class="big" @click=${() => this._finish("save")}>${t("breakdown.save_as_chore")}</button>`}
      </div>
    `;
  }

  render() {
    if (!this._aiOn()) return this._renderOff();
    const titles: Record<Phase, string> = {
      task: this.kind === "recurring" ? t("today.break_down_a_recurring_chore") : t("common.break_it_down_now"),
      interview: t("breakdown.a_few_questions"),
      working: this._task,
      review: this._task,
    };
    return html`
      <section class="card main">
        <div class="top">
          <h2>${titles[this._phase]}</h2>
          <button type="button" class="link" @click=${() => this._cancel()}>${t("common.close")}</button>
        </div>
        ${this.externalError ? html`<div class="error">${this.externalError}</div>` : nothing}
        ${this._error
          ? html`<div class="error">
              ${this._error}
              ${this._phase === "interview" || this._phase === "task"
                ? html`<div class="muted small">${t("breakdown.you_can_try_again_or_skip")}</div>`
                : nothing}
            </div>`
          : nothing}
        ${this._phase === "task" ? this._renderTask() : nothing}
        ${this._phase === "interview" ? this._renderInterview() : nothing}
        ${this._phase === "working" ? this._renderWorking() : nothing}
        ${this._phase === "review" ? this._renderReview() : nothing}
      </section>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .main {
        padding: 24px;
        max-width: 980px;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      h2 {
        font-size: 22px;
      }
      p {
        margin: 10px 0;
        line-height: 1.5;
        max-width: 760px;
      }
      .small {
        font-size: 15px;
      }
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 4px 6px;
      }
      textarea {
        font: inherit;
        width: 100%;
        max-width: 760px;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
      }
      button.big {
        min-height: 48px;
        padding: 0 22px;
        font-size: 18px;
      }
      .question {
        padding: 14px 16px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        margin: 10px 0;
        max-width: 760px;
      }
      .qtext {
        font-weight: 500;
        margin-bottom: 10px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }
      .own {
        min-height: 40px;
      }
      .said {
        margin: 6px 0 12px;
        font-size: 16px;
      }
      .said summary {
        cursor: pointer;
        color: var(--secondary-text-color);
      }
      .said li {
        margin: 4px 0;
      }
      .working {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 28px 4px;
        font-size: 20px;
      }
      .dots {
        display: inline-flex;
        gap: 6px;
      }
      .dots i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--boopli-accent, var(--primary-color));
        animation: bounce 1s infinite ease-in-out;
      }
      .dots i:nth-child(2) {
        animation-delay: 0.15s;
      }
      .dots i:nth-child(3) {
        animation-delay: 0.3s;
      }
      @keyframes bounce {
        0%,
        80%,
        100% {
          opacity: 0.25;
          transform: scale(0.8);
        }
        40% {
          opacity: 1;
          transform: scale(1);
        }
      }
      .steps {
        margin: 10px 0;
      }
      .group {
        margin: 16px 0 6px;
        font-size: 15px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--boopli-accent, var(--primary-color));
      }
      .step {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid var(--divider-color);
      }
      .only-if {
        padding: 2px 0 8px 34px;
        border-bottom: 1px solid var(--divider-color);
      }
      .only-if label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
      }
      .only-if select {
        flex: 1;
        min-width: 0;
        font-size: 15px;
      }
      .checks {
        margin: 12px 0;
        padding: 12px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        display: grid;
        gap: 8px;
      }
      .check {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .check input {
        flex: 1;
        min-width: 0;
      }
      .num {
        width: 26px;
        text-align: right;
        color: var(--secondary-text-color);
        font-size: 15px;
        flex: 0 0 26px;
      }
      input.title {
        flex: 1;
        min-width: 0;
      }
      .sizes {
        display: inline-flex;
        gap: 4px;
      }
      button.size {
        min-width: 34px;
        min-height: 34px;
        padding: 0;
        font-weight: 600;
      }
      .wait {
        white-space: nowrap;
      }
      .tools {
        display: inline-flex;
        gap: 4px;
      }
      .tools button {
        min-width: 34px;
        min-height: 34px;
        padding: 0 6px;
      }
      .inline-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0;
      }
      .field {
        margin: 16px 0;
        max-width: 760px;
      }
      .rooms,
      .roomtip {
        margin: 12px 0;
        max-width: 760px;
      }
      .roomline {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .scene {
        margin-top: 12px;
        max-width: 760px;
      }
      .scene textarea {
        font: inherit;
        width: 100%;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
      }
      .scene label {
        display: block;
        margin-bottom: 6px;
      }
      .thumbs {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 12px 0;
      }
      .thumb {
        position: relative;
        width: 140px;
        height: 105px;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid var(--divider-color);
      }
      .thumb .x {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 28px;
        min-height: 28px;
        height: 28px;
        padding: 0;
        border-radius: 50%;
        font-size: 20px;
        line-height: 1;
      }
      .filebtn {
        display: inline-flex;
        align-items: center;
        position: relative;
        cursor: pointer;
        min-height: 40px;
        padding: 0 16px;
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
      }
      .filebtn.off {
        opacity: 0.5;
        cursor: default;
      }
      .filebtn input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        width: 100%;
        height: 100%;
      }
      .preview {
        margin-top: 8px;
      }
      .preview pre {
        white-space: pre-wrap;
        font: inherit;
        font-size: 15px;
        line-height: 1.45;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        max-height: 320px;
        overflow: auto;
        margin: 6px 0 0;
      }
      @media (max-width: 700px) {
        .step {
          flex-wrap: wrap;
        }
        input.title {
          flex-basis: calc(100% - 40px);
        }
      }
    `,
  ];
}

customElements.define("boopli-breakdown", BoopliBreakdown);
