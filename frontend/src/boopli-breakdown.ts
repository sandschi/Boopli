import { LitElement, html, css, nothing } from "lit";
import { aiPreview, aiQuestions, aiSteps, errorMessage, roomsGuess, scenePhotos } from "./api";
import "./boopli-wait";
import { MAX_PHOTOS, shrinkPhoto } from "./photos";
import { sharedStyles } from "./styles";
import type { AiAnswer, AiPreview, AiQuestion, AiStep, Hass, Room, Snapshot, StepSize } from "./types";

type Phase = "task" | "interview" | "working" | "review";
type Kind = "now" | "recurring";

/** What the breakdown hands back. The host decides what to do with it. */
export interface BreakdownResult {
  action: "start" | "save" | "schedule" | "replace" | "append";
  task: string;
  steps: AiStep[];
  notes: string;
}

const SIZES: { value: StepSize; letter: string; label: string; xp: number }[] = [
  { value: "small", letter: "S", label: "Small: quick and easy", xp: 10 },
  { value: "medium", letter: "M", label: "Medium: takes some effort", xp: 15 },
  { value: "big", letter: "B", label: "Big: hard or long", xp: 20 },
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
  private _roomsTouched = false; // the user chose the rooms, so stop guessing
  private _guessedFor: string | null = null;
  private _guessing?: Promise<void>;
  private _guessTimer?: number;
  private _started = false;
  private _askId = 0; // counts requests, so an answer the person stopped waiting for is dropped
  private _backPhase: Phase = "task";
  private _lookId = 0; // the same for the look at photos

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
        this._task.trim() || "(your task)",
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
        Tip: tell Boopli about your rooms and the steps will fit them.
        <button type="button" class="link" @click=${() => this._fire("open-home")}>Open My home</button>
      </p>`;
    }
    const chosen = noted.filter((r) => this._rooms.includes(r.id));
    return html`<div class="rooms">
      <div class="roomline">
        <span class="muted small">Room notes the AI will see:</span>
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
        ${chosen.length === 0 ? html`<span class="muted small">none</span>` : nothing}
        <button type="button" class="link" @click=${() => this._showPreview()}>
          ${this._preview ? "Hide what is sent" : "What will the AI see?"}
        </button>
      </div>
      ${this._preview
        ? html`<div class="preview">
            ${this._preview.shortened ? html`<div class="muted small">A long note was shortened to keep the request small.</div>` : nothing}
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
      if (files.length > room) this._error = `Up to ${MAX_PHOTOS} photos. The rest were left out.`;
    } catch (err) {
      this._error = errorMessage(err);
    }
    this._looking = false;
  }

  /** Send the photos once, keep only the text the agent writes about them. */
  private async _look(): Promise<void> {
    if (!this.hass || !this._photos.length || !this._task.trim()) return;
    this._error = "";
    const id = ++this._lookId;
    this._sending = true;
    this._looking = true;
    try {
      await this._guess();
      const result = await scenePhotos(this.hass, this._task.trim(), this._photos, this._rooms);
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
    this._error = "You stopped waiting. Your photos are still here, so you can try again.";
  }

  private _renderScene() {
    if (!this._aiOn()) return nothing;
    if (this._scene) {
      return html`<div class="scene">
        <label for="scene">What the AI sees today (from your photos). Change anything that is wrong:</label>
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
        <div class="muted small">The photos are already gone. This text goes with the questions and the steps, and is not saved afterwards.</div>
        <button type="button" class="link" @click=${() => ((this._scene = ""), (this._preview = null))}>Remove it</button>
      </div>`;
    }
    if (!this._photosOpen) {
      return html`<div class="scene">
        <button type="button" @click=${() => (this._photosOpen = true)}>📷 Add photos of how it looks now (optional)</button>
      </div>`;
    }
    const full = this._photos.length >= MAX_PHOTOS;
    return html`<div class="scene">
      <p class="muted small">
        Take or pick up to ${MAX_PHOTOS} photos. They go once to your AI agent, which writes down what is out of place.
        Boopli keeps no photo: you see the text it wrote, and only that text is used.
      </p>
      <div class="thumbs">
        ${this._photos.map(
          (src, i) => html`<div class="thumb">
            <img src=${src} alt="Photo ${i + 1}" />
            <button type="button" class="x" aria-label="Remove photo ${i + 1}" @click=${() => (this._photos = this._photos.filter((_, k) => k !== i))}>×</button>
          </div>`
        )}
      </div>
      ${this._sending
        ? html`<boopli-wait
            .label=${"The AI is looking at your photos…"}
            .max=${this.snapshot?.ai_timeout ?? 180}
            @stop-waiting=${() => this._stopLooking()}
          ></boopli-wait>`
        : this._looking
          ? html`<div class="muted" role="status">Preparing…</div>`
          : html`<div class="actions">
            <label class="filebtn ${full ? "off" : ""}">
              ${this._photos.length ? "Add another photo" : "Take or pick photos"}
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
            <button class="primary" ?disabled=${!this._photos.length || !this._task.trim()} @click=${() => this._look()}>
              Look at the photos
            </button>
            <button type="button" class="link" @click=${() => ((this._photosOpen = false), (this._photos = []))}>Cancel</button>
          </div>`}
      <div class="muted small">The agent has to be able to read images. You can pick another one for photos in Settings, under AI help, Advanced.</div>
    </div>`;
  }

  private _aiOn(): boolean {
    return !!this.snapshot?.settings.ai?.enabled;
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
    this._error = "You stopped waiting. Your task and answers are still here, so you can try again.";
  }

  private async _begin(): Promise<void> {
    if (!this.hass || !this._task.trim()) return;
    this._answers = [];
    this._round = 0;
    this._phase = "working";
    await this._guess();
    const result = await this._ask(
      () => aiQuestions(this.hass!, this._task.trim(), this.kind, [], this._notes, this._rooms, this._scene),
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
    if (this._extra.trim()) out.push({ question: "Anything else to know?", answer: this._extra.trim() });
    return out;
  }

  private async _send(): Promise<void> {
    if (!this.hass) return;
    const answers = [...this._answers, ...this._currentAnswers()];
    this._answers = answers;
    this._phase = "working";
    const result = await this._ask(
      () => aiQuestions(this.hass!, this._task.trim(), this.kind, answers, this._notes, this._rooms, this._scene),
      "interview"
    );
    if (!result) return;
    this._showQuestions(result.enough, result.questions);
  }

  private async _enough(): Promise<void> {
    this._answers = [...this._answers, ...this._currentAnswers()];
    await this._loadSteps();
  }

  private async _loadSteps(): Promise<void> {
    if (!this.hass) return;
    this._phase = "working";
    await this._guess();
    const result = await this._ask(
      () => aiSteps(this.hass!, this._task.trim(), this.kind, this._answers, this._notes, this._rooms, this._scene),
      this._questions.length ? "interview" : "task"
    );
    if (!result) return;
    this._steps = result.steps.slice(0, MAX_STEPS);
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
      this._error = "There is no step yet. Add one, or try again.";
      return;
    }
    this._fire("breakdown-result", {
      action,
      task: this._task.trim(),
      steps,
      notes: this._notes.trim(),
    } satisfies BreakdownResult);
  }

  private _cancel(): void {
    this._fire("breakdown-cancel");
  }

  // --- screens ---------------------------------------------------------------------

  private _renderOff() {
    return html`<section class="card main">
      <h2>AI help is switched off</h2>
      <p>
        To split tasks into small steps, switch on AI help and choose your Home Assistant AI agent.
        It takes a minute, and Boopli never sends anything before you do.
      </p>
      <div class="actions">
        <button class="primary" @click=${() => this._fire("open-wizard", { wizard: "ai" })}>Set up AI help</button>
        <button @click=${() => this._cancel()}>Close</button>
      </div>
    </section>`;
  }

  private _renderTask() {
    return html`
      <p>
        ${this.kind === "recurring"
          ? "What is the chore? I will ask what it really involves, so we can break it into tiny steps once and reuse them every time."
          : "What do you want to get done? Write it the way you would say it."}
      </p>
      <textarea
        rows="3"
        placeholder=${this.kind === "recurring" ? "For example: clean my room" : "For example: clean the bathroom"}
        .value=${this._task}
        @input=${(e: Event) => this._onTaskInput((e.target as HTMLTextAreaElement).value)}
      ></textarea>
      ${this._renderRooms()}
      ${this._renderScene()}
      <div class="actions">
        <button class="primary big" ?disabled=${!this._task.trim() || this._busy} @click=${() => this._begin()}>
          ${this.kind === "recurring" ? "Ask me about it" : "Break it down"}
        </button>
        <button ?disabled=${!this._task.trim() || this._busy} @click=${() => this._loadSteps()}>Skip the questions</button>
      </div>
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
        placeholder="Or write it in your own words"
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
            <summary>What you told me so far (${this._answers.length})</summary>
            <ul>
              ${this._answers.map((a) => html`<li><span class="muted">${a.question}</span> ${a.answer}</li>`)}
            </ul>
          </details>`
        : nothing}
      <p class="muted small">
        ${this._round > 1 ? "A few more things, so the steps fit." : "A few questions so the steps fit your situation."}
        Tap what fits, or write as much as you like. You can skip any question.
      </p>
      ${this._renderRooms()}
      ${this._renderScene()}
      ${this._questions.map((q, i) => this._renderQuestion(q, i))}
      <div class="question">
        <div class="qtext">Anything else I should know?</div>
        <textarea
          rows="2"
          class="own"
          placeholder="Optional. Long answers are welcome."
          .value=${this._extra}
          @input=${(e: Event) => (this._extra = (e.target as HTMLTextAreaElement).value)}
        ></textarea>
      </div>
      <div class="actions">
        <button class="primary big" ?disabled=${this._busy} @click=${() => this._send()}>Next questions</button>
        <button class="big" ?disabled=${this._busy} @click=${() => this._enough()}>Enough, go on</button>
      </div>
    `;
  }

  private _renderWorking() {
    return html`<boopli-wait
      .label=${this._answers.length || this._steps.length ? "Writing the steps…" : "Thinking…"}
      .max=${this.snapshot?.ai_timeout ?? 180}
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
          aria-label="Step ${i + 1}"
          placeholder="What to do"
          .value=${s.title}
          @input=${(e: Event) => this._patchStep(i, { title: (e.target as HTMLInputElement).value })}
        />
        <span class="sizes" role="group" aria-label="Size">
          ${SIZES.map(
            (z) => html`<button
              type="button"
              class="chip size ${s.size === z.value ? "on" : ""}"
              title="${z.label} (${z.xp} XP)"
              aria-pressed=${s.size === z.value}
              @click=${() => this._patchStep(i, { size: z.value })}
            >
              ${z.letter}
            </button>`
          )}
        </span>
        ${s.wait_minutes > 0
          ? html`<span class="wait muted small" title="Time to wait before this step">⏳ ${s.wait_minutes} min</span>`
          : nothing}
        <span class="tools">
          <button type="button" aria-label="Move up" ?disabled=${i === 0} @click=${() => this._move(i, -1)}>↑</button>
          <button type="button" aria-label="Move down" ?disabled=${i === this._steps.length - 1} @click=${() => this._move(i, 1)}>↓</button>
          <button type="button" aria-label="Add a step after this" @click=${() => this._add(i)}>+</button>
          <button type="button" aria-label="Remove" @click=${() => this._remove(i)}>✕</button>
        </span>
      </div>
    `;
  }

  private _renderReview() {
    const steps = this._steps;
    const editor = this.mode === "editor";
    return html`
      <p>
        <b>${steps.length} ${steps.length === 1 ? "step" : "steps"}</b>
        <span class="muted"> · worth about ${this._xp()} XP when all are done. Check them, change what does not fit.</span>
      </p>
      <div class="steps">${steps.map((s, i) => this._renderStep(s, i))}</div>
      <div class="inline-actions">
        <button type="button" @click=${() => this._add(steps.length - 1)}>+ Add a step</button>
        <button type="button" ?disabled=${this._busy} @click=${() => this._loadSteps()}>Try again</button>
        ${this._answers.length || this._questions.length
          ? html`<button type="button" ?disabled=${this._busy} @click=${() => this._begin()}>Ask me again</button>`
          : nothing}
      </div>
      ${this.kind === "recurring" || editor
        ? html`<div class="field">
            <label for="notes">Kept with the chore, for next time (you can edit it)</label>
            <textarea id="notes" rows="2" .value=${this._notes} @input=${(e: Event) => (this._notes = (e.target as HTMLTextAreaElement).value)}></textarea>
          </div>`
        : nothing}
      <div class="actions">
        ${editor
          ? this.hasSteps
            ? html`<button class="primary big" @click=${() => this._finish("replace")}>Replace my steps</button>
                <button class="big" @click=${() => this._finish("append")}>Add to my steps</button>`
            : html`<button class="primary big" @click=${() => this._finish("replace")}>Use these steps</button>`
          : this.kind === "recurring"
            ? html`<button class="primary big" @click=${() => this._finish("schedule")}>Save and set the schedule</button>
                <button class="big" @click=${() => this._finish("save")}>Save without a schedule</button>`
            : html`<button class="primary big" @click=${() => this._finish("start")}>Start now</button>
                <button class="big" @click=${() => this._finish("save")}>Save as chore</button>`}
      </div>
    `;
  }

  render() {
    if (!this._aiOn()) return this._renderOff();
    const titles: Record<Phase, string> = {
      task: this.kind === "recurring" ? "Break down a recurring chore" : "Break it down now",
      interview: "A few questions",
      working: this._task,
      review: this._task,
    };
    return html`
      <section class="card main">
        <div class="top">
          <h2>${titles[this._phase]}</h2>
          <button type="button" class="link" @click=${() => this._cancel()}>Close</button>
        </div>
        ${this.externalError ? html`<div class="error">${this.externalError}</div>` : nothing}
        ${this._error
          ? html`<div class="error">
              ${this._error}
              ${this._phase === "interview" || this._phase === "task"
                ? html`<div class="muted small">You can try again, or skip the questions.</div>`
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
        font-size: 13px;
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
        font-size: 16px;
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
        font-size: 14px;
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
        font-size: 18px;
      }
      .dots {
        display: inline-flex;
        gap: 6px;
      }
      .dots i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-color);
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
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--primary-color);
      }
      .step {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid var(--divider-color);
      }
      .num {
        width: 26px;
        text-align: right;
        color: var(--secondary-text-color);
        font-size: 13px;
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
        font-size: 18px;
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
        font-size: 13px;
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
