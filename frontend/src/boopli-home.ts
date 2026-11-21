import { LitElement, html, css, nothing } from "lit";
import { errorMessage, homeSave, homeSync, roomNotes, roomQuestions } from "./api";
import { sharedStyles } from "./styles";
import type { AiAnswer, AiQuestion, Hass, Home, Room, Snapshot } from "./types";

const NOTES_MAX = 2000;

/** One room being described by the AI, from the first question to the notes it wrote. */
interface Interview {
  roomId: string;
  phase: "working" | "questions" | "review";
  questions: AiQuestion[];
  picked: string[][];
  typed: string[];
  extra: string;
  answers: AiAnswer[];
  result: string;
  round: number;
}

function newId(): string {
  return `r${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * "My home": the rooms and what the AI should know about them. Notes are kept
 * only in Boopli. They leave only inside a request to your own AI agent, and
 * only the notes of the rooms a task is about. Edits are saved with a button;
 * the AI interview only fills in a proposal that you accept or change first.
 */
export class BoopliHome extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    _draft: { state: true },
    _base: { state: true },
    _newName: { state: true },
    _showHidden: { state: true },
    _iv: { state: true },
    _busy: { state: true },
    _error: { state: true },
    _message: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare _draft?: Home;
  declare _base?: Home;
  declare _newName: string;
  declare _showHidden: boolean;
  declare _iv: Interview | null;
  declare _busy: boolean;
  declare _error: string;
  declare _message: string;
  private _justSaved = false;
  private _lastDirty = false;
  private _synced = false;

  constructor() {
    super();
    this._newName = "";
    this._showHidden = false;
    this._iv = null;
    this._busy = false;
    this._error = "";
    this._message = "";
  }

  // --- draft and saving -------------------------------------------------------------

  protected willUpdate(): void {
    const saved = this.snapshot?.home;
    if (!saved) return;
    if (!this._draft || !this._base) {
      this._base = structuredClone(saved);
      this._draft = structuredClone(saved);
      return;
    }
    // Just saved: take the home as Boopli stored it, so tidied-up text is not "unsaved".
    if (this._justSaved && JSON.stringify(saved) !== JSON.stringify(this._base)) {
      this._base = structuredClone(saved);
      this._draft = structuredClone(saved);
      this._justSaved = false;
    }
  }

  protected updated(): void {
    if (!this._synced && this.hass) {
      this._synced = true;
      // Rooms for areas that were added in Home Assistant since the last visit.
      void homeSync(this.hass)
        .then((home) => {
          if (!this._isDirty()) {
            this._base = structuredClone(home);
            this._draft = structuredClone(home);
          }
        })
        .catch(() => undefined);
    }
    const dirty = this._isDirty();
    if (dirty !== this._lastDirty) {
      this._lastDirty = dirty;
      this.dispatchEvent(
        new CustomEvent("dirty-change", {
          detail: { source: "home", dirty },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  private _isDirty(): boolean {
    return !!this._draft && !!this._base && JSON.stringify(this._draft) !== JSON.stringify(this._base);
  }

  private _roomChanged(id: string): boolean {
    const now = this._draft?.rooms.find((r) => r.id === id);
    const before = this._base?.rooms.find((r) => r.id === id);
    return JSON.stringify(now) !== JSON.stringify(before);
  }

  /** Save the draft. Used by the Save buttons and by the panel's "Save" on leaving. */
  async save(): Promise<boolean> {
    if (!this.hass || !this._draft || this._busy) return false;
    this._busy = true;
    this._error = "";
    this._message = "";
    try {
      await homeSave(this.hass, this._draft);
      this._justSaved = true;
      this._base = structuredClone(this._draft);
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
    this._iv = null;
    this._message = "";
    this._error = "";
  }

  private _patchRoom(id: string, patch: Partial<Room>): void {
    if (!this._draft) return;
    this._draft = {
      ...this._draft,
      rooms: this._draft.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    };
    this._message = "";
  }

  private _addRoom(): void {
    const name = this._newName.trim();
    if (!name || !this._draft) return;
    this._draft = {
      ...this._draft,
      rooms: [...this._draft.rooms, { id: newId(), name, area_id: "", notes: "", hidden: false }],
    };
    this._newName = "";
    this._message = "";
  }

  private _removeRoom(room: Room): void {
    if (!this._draft) return;
    if (room.area_id) {
      // A Home Assistant area stays known (hidden), so it does not come back by itself.
      this._patchRoom(room.id, { hidden: true });
    } else {
      this._draft = { ...this._draft, rooms: this._draft.rooms.filter((r) => r.id !== room.id) };
    }
  }

  // --- the AI interview --------------------------------------------------------------------

  private _aiOn(): boolean {
    return !!this.snapshot?.settings.ai?.enabled;
  }

  private _room(id: string): Room | undefined {
    return this._draft?.rooms.find((r) => r.id === id);
  }

  private async _startInterview(room: Room): Promise<void> {
    if (!this.hass) return;
    this._error = "";
    this._iv = { roomId: room.id, phase: "working", questions: [], picked: [], typed: [], extra: "", answers: [], result: "", round: 0 };
    await this._askQuestions([]);
  }

  private async _askQuestions(answers: AiAnswer[]): Promise<void> {
    const iv = this._iv;
    const room = iv && this._room(iv.roomId);
    if (!this.hass || !iv || !room) return;
    this._iv = { ...iv, phase: "working", answers };
    try {
      const result = await roomQuestions(this.hass, room.name, room.notes, answers);
      if (result.enough || result.questions.length === 0) {
        await this._writeNotes(answers);
        return;
      }
      this._iv = {
        ...iv,
        answers,
        phase: "questions",
        questions: result.questions,
        picked: result.questions.map(() => []),
        typed: result.questions.map(() => ""),
        extra: "",
        round: iv.round + 1,
      };
    } catch (err) {
      this._error = errorMessage(err);
      this._iv = null;
    }
  }

  private async _writeNotes(answers: AiAnswer[]): Promise<void> {
    const iv = this._iv;
    const room = iv && this._room(iv.roomId);
    if (!this.hass || !iv || !room) return;
    this._iv = { ...iv, phase: "working", answers };
    try {
      const result = await roomNotes(this.hass, room.name, room.notes, answers);
      this._iv = { ...iv, answers, phase: "review", result: result.notes };
    } catch (err) {
      this._error = errorMessage(err);
      this._iv = null;
    }
  }

  private _currentAnswers(iv: Interview): AiAnswer[] {
    const out: AiAnswer[] = [];
    iv.questions.forEach((q, i) => {
      const parts = [...iv.picked[i], iv.typed[i].trim()].filter(Boolean);
      if (parts.length) out.push({ question: q.text, answer: parts.join(", ") });
    });
    if (iv.extra.trim()) out.push({ question: "Anything else about this room?", answer: iv.extra.trim() });
    return out;
  }

  private _patchIv(patch: Partial<Interview>): void {
    if (this._iv) this._iv = { ...this._iv, ...patch };
  }

  private _acceptNotes(): void {
    const iv = this._iv;
    if (!iv) return;
    this._patchRoom(iv.roomId, { notes: iv.result.trim().slice(0, NOTES_MAX) });
    this._iv = null;
  }

  // --- screens ----------------------------------------------------------------------------

  private _renderQuestion(q: AiQuestion, i: number, iv: Interview) {
    const picked = iv.picked[i] ?? [];
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
              const current = this._iv?.picked[i] ?? [];
              const isOn = current.includes(o);
              const next = q.multiple ? (isOn ? current.filter((p) => p !== o) : [...current, o]) : isOn ? [] : [o];
              this._patchIv({ picked: (this._iv?.picked ?? []).map((p, k) => (k === i ? next : p)) });
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
        .value=${iv.typed[i] ?? ""}
        @input=${(e: Event) =>
          this._patchIv({
            typed: (this._iv?.typed ?? []).map((t, k) => (k === i ? (e.target as HTMLTextAreaElement).value : t)),
          })}
      ></textarea>
    </div>`;
  }

  private _renderInterview(iv: Interview) {
    const room = this._room(iv.roomId);
    return html`<section class="card interview">
      <div class="top">
        <h2>${room?.name ?? "Room"}: let me ask</h2>
        <button type="button" class="link" @click=${() => (this._iv = null)}>Cancel</button>
      </div>
      ${iv.phase === "working"
        ? html`<div class="working" role="status">
            <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>${iv.answers.length ? "Writing the notes…" : "Thinking…"}</span>
          </div>`
        : nothing}
      ${iv.phase === "questions"
        ? html`
            <p class="muted small">
              ${iv.round > 1 ? "A few more things." : "A few quick questions about this room."} Tap what fits, or write as
              much as you like. You can skip any question.
            </p>
            ${iv.questions.map((q, i) => this._renderQuestion(q, i, iv))}
            <div class="question">
              <div class="qtext">Anything else about this room?</div>
              <textarea
                rows="2"
                class="own"
                placeholder="Optional. Long answers are welcome."
                .value=${iv.extra}
                @input=${(e: Event) => this._patchIv({ extra: (e.target as HTMLTextAreaElement).value })}
              ></textarea>
            </div>
            <div class="actions">
              <button class="primary big" @click=${() => this._askQuestions([...iv.answers, ...this._currentAnswers(iv)])}>
                Next questions
              </button>
              <button class="big" @click=${() => this._writeNotes([...iv.answers, ...this._currentAnswers(iv)])}>
                Enough, write the notes
              </button>
            </div>
          `
        : nothing}
      ${iv.phase === "review"
        ? html`
            <p>
              This is what I would write down. Change anything that is wrong.
              ${room?.notes ? html`<b>It replaces the notes you have now.</b>` : nothing}
              Nothing is saved until you press Save afterwards.
            </p>
            <textarea
              rows="8"
              class="notes"
              aria-label="Proposed notes"
              .value=${iv.result}
              @input=${(e: Event) => this._patchIv({ result: (e.target as HTMLTextAreaElement).value })}
            ></textarea>
            <div class="actions">
              <button class="primary big" ?disabled=${!iv.result.trim()} @click=${() => this._acceptNotes()}>Use these notes</button>
              <button class="big" @click=${() => this._askQuestions(iv.answers)}>Ask me more</button>
              <button class="big" @click=${() => (this._iv = null)}>Throw away</button>
            </div>
          `
        : nothing}
    </section>`;
  }

  private _renderRoom(room: Room) {
    const aiOn = this._aiOn();
    return html`<section class="card room ${this._roomChanged(room.id) ? "changed" : ""}">
      <div class="head">
        <input
          class="name"
          aria-label="Room name"
          .value=${room.name}
          @input=${(e: Event) => this._patchRoom(room.id, { name: (e.target as HTMLInputElement).value })}
        />
        ${this._roomChanged(room.id) ? html`<span class="unsaved-badge">Unsaved</span>` : nothing}
      </div>
      ${room.area_id ? html`<div class="muted small">From your Home Assistant areas</div>` : html`<div class="muted small">Added by you</div>`}
      <label for="n-${room.id}">What should the AI know about this room?</label>
      <textarea
        id="n-${room.id}"
        class="notes"
        rows="5"
        maxlength=${NOTES_MAX}
        placeholder="For example: Dishwasher is under the counter. The balcony door sticks."
        .value=${room.notes}
        @input=${(e: Event) => this._patchRoom(room.id, { notes: (e.target as HTMLTextAreaElement).value })}
      ></textarea>
      <div class="row-actions">
        ${aiOn
          ? html`<button type="button" ?disabled=${!room.name.trim() || this._busy} @click=${() => this._startInterview(room)}>
              ✨ Let the AI ask me
            </button>`
          : nothing}
        <span class="spacer"></span>
        <button type="button" class="link" @click=${() => this._removeRoom(room)}>${room.area_id ? "Hide" : "Delete"}</button>
      </div>
    </section>`;
  }

  private _renderSaveBar() {
    if (!this._isDirty()) return nothing;
    return html`<div class="savebar" role="status">
      <span><b>●</b> You have unsaved changes</span>
      <span class="spacer"></span>
      <button class="primary" ?disabled=${this._busy} @click=${() => this.save()}>Save</button>
      <button ?disabled=${this._busy} @click=${() => this.discard()}>Discard</button>
    </div>`;
  }

  render() {
    const d = this._draft;
    if (!d) return html`<p class="muted">Loading…</p>`;
    if (this._iv) return html`${this._renderInterview(this._iv)}${this._renderSaveBar()}`;
    const shown = d.rooms.filter((r) => !r.hidden);
    const hidden = d.rooms.filter((r) => r.hidden);
    return html`
      <h2>My home</h2>
      <p class="intro">
        Tell Boopli about your rooms, so the AI's small steps fit your home. The notes stay in Boopli on your Home
        Assistant. They only leave inside a request to your own AI agent, and only the notes of the rooms a task is
        about. Before you send a task, you can see exactly what goes out.
      </p>
      <label class="switch">
        <input
          type="checkbox"
          .checked=${d.enabled}
          @change=${(e: Event) => {
            this._draft = { ...d, enabled: (e.target as HTMLInputElement).checked };
            this._message = "";
          }}
        />
        <span>Send room notes to the AI with my tasks</span>
      </label>
      ${!this._aiOn()
        ? html`<p class="muted small">
            AI help is off, so the notes are not used yet. Turn it on in Settings. Until then you can still write the
            notes yourself.
          </p>`
        : nothing}
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      ${this._message ? html`<div class="ok">${this._message}</div>` : nothing}
      <div class="grid">${shown.map((r) => this._renderRoom(r))}</div>
      <div class="add card">
        <label for="newroom">Add a room or place</label>
        <div class="add-row">
          <input
            id="newroom"
            placeholder="For example: Balcony"
            .value=${this._newName}
            @input=${(e: Event) => (this._newName = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") this._addRoom();
            }}
          />
          <button type="button" class="primary" ?disabled=${!this._newName.trim()} @click=${() => this._addRoom()}>Add</button>
        </div>
      </div>
      ${hidden.length
        ? html`<details class="hiddenrooms" ?open=${this._showHidden} @toggle=${(e: Event) => (this._showHidden = (e.target as HTMLDetailsElement).open)}>
            <summary>${hidden.length} hidden ${hidden.length === 1 ? "room" : "rooms"}</summary>
            ${hidden.map(
              (r) => html`<div class="hiddenrow">
                <span>${r.name}</span>
                <button type="button" @click=${() => this._patchRoom(r.id, { hidden: false })}>Show again</button>
              </div>`
            )}
          </details>`
        : nothing}
      ${this._renderSaveBar()}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      h2 {
        font-size: 22px;
        margin-bottom: 8px;
      }
      .intro {
        max-width: 820px;
        line-height: 1.5;
        margin: 6px 0 14px;
      }
      .small {
        font-size: 13px;
      }
      .ok {
        color: var(--success-color, #43a047);
        margin: 8px 0;
      }
      .switch {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        color: var(--primary-text-color);
        margin: 8px 0;
        cursor: pointer;
      }
      .switch input {
        width: 20px;
        min-height: 20px;
        height: 20px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 16px;
        margin: 16px 0;
        align-items: start;
      }
      .room.changed,
      .card.changed {
        border-color: var(--warning-color, #ffa600);
      }
      .head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
      .name {
        font-size: 17px;
        font-weight: 500;
      }
      textarea {
        font: inherit;
        width: 100%;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
      }
      .room label {
        margin-top: 12px;
      }
      .row-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
      }
      .spacer {
        flex: 1;
      }
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 4px 6px;
      }
      .add {
        max-width: 520px;
      }
      .add-row {
        display: flex;
        gap: 8px;
      }
      .hiddenrooms {
        margin: 16px 0;
        max-width: 520px;
      }
      .hiddenrooms summary {
        cursor: pointer;
        color: var(--secondary-text-color);
      }
      .hiddenrow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid var(--divider-color);
      }
      .unsaved-badge {
        display: inline-block;
        padding: 1px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 500;
        color: #000;
        background: var(--warning-color, #ffa600);
        white-space: nowrap;
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
      .interview {
        padding: 24px;
        max-width: 980px;
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
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
      .interview .notes {
        max-width: 760px;
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
    `,
  ];
}

customElements.define("boopli-home", BoopliHome);
