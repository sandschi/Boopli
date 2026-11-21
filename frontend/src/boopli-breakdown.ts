import { LitElement, html, css, nothing } from "lit";
import { aiQuestions, aiSteps, errorMessage } from "./api";
import { sharedStyles } from "./styles";
import type { AiAnswer, AiQuestion, AiStep, Hass, Snapshot, StepSize } from "./types";

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
  private _started = false;

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
    this._busy = true;
    this._error = "";
    try {
      return await run();
    } catch (err) {
      this._error = errorMessage(err);
      this._phase = phaseAfterError;
      return null;
    } finally {
      this._busy = false;
    }
  }

  private async _begin(): Promise<void> {
    if (!this.hass || !this._task.trim()) return;
    this._answers = [];
    this._round = 0;
    this._phase = "working";
    const result = await this._ask(
      () => aiQuestions(this.hass!, this._task.trim(), this.kind, [], this._notes),
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
      () => aiQuestions(this.hass!, this._task.trim(), this.kind, answers, this._notes),
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
    const result = await this._ask(
      () => aiSteps(this.hass!, this._task.trim(), this.kind, this._answers, this._notes),
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
        @input=${(e: Event) => (this._task = (e.target as HTMLTextAreaElement).value)}
      ></textarea>
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
    return html`<div class="working" role="status">
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>${this._answers.length || this._steps.length ? "Writing the steps…" : "Thinking…"}</span>
    </div>`;
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
