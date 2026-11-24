import { LitElement, html, css, nothing } from "lit";
import { agentOn, anyAi, claudeReady, waitSeconds } from "./claude";
import { icon } from "./icon";
import {
  chatPrompt,
  errorMessage,
  homeSave,
  homeSync,
  pasteHome,
  pasteNotes,
  roomNotes,
  roomPhotos,
  roomQuestions,
  type PastedRoom,
} from "./api";
import "./boopli-wait";
import { MAX_PHOTOS, shrinkPhoto } from "./photos";
import { sharedStyles } from "./styles";
import type { AiAnswer, AiQuestion, Hass, Home, Room, Snapshot, Via } from "./types";

const NOTES_MAX = 2000;

/** Photos picked for one room. They live only in this screen's memory until they are sent. */
interface PhotosTool {
  kind: "photos";
  roomId: string;
  photos: string[]; // shrunk JPEG data URLs
  working: boolean; // preparing or sending
  sending: boolean;
}

/** Talking a room (or the whole home) out in the person's own AI chat. */
interface ChatTool {
  kind: "chat";
  roomId: string; // "" = the whole home
  prompt: string;
  include: boolean;
  pasted: string;
  working: boolean;
  copied: boolean;
}

/** Pasted notes of the whole home, split into rooms for a last look. */
interface FlatTool {
  kind: "flat";
  items: (PastedRoom & { on: boolean })[];
}

type Tool = PhotosTool | ChatTool | FlatTool;

/** One room being described by the AI, from the first question to the notes it wrote. */
interface Interview {
  roomId: string;
  source: "ai" | "photos" | "paste";
  via: Via; // who answers the questions and writes the notes
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
    _tool: { state: true },
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
  declare _tool: Tool | null;
  declare _busy: boolean;
  declare _error: string;
  declare _message: string;
  private _justSaved = false;
  private _lastDirty = false;
  private _synced = false;
  private _run = 0; // counts AI requests, so an answer the person stopped waiting for is dropped
  private _promptAsk = 0; // counts requests for the chat text, so only the newest answer is used

  constructor() {
    super();
    this._newName = "";
    this._showHidden = false;
    this._iv = null;
    this._tool = null;
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
    this._tool = null;
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
    return anyAi(this.snapshot); // the agent, or Ask Claude
  }

  private _room(id: string): Room | undefined {
    return this._draft?.rooms.find((r) => r.id === id);
  }

  private async _startInterview(room: Room, via: Via = "agent"): Promise<void> {
    if (!this.hass) return;
    this._error = "";
    this._iv = { roomId: room.id, source: "ai", via, phase: "working", questions: [], picked: [], typed: [], extra: "", answers: [], result: "", round: 0 };
    await this._askQuestions([]);
  }

  /** Open the review screen with notes that came from somewhere else (photos or a paste). */
  private _review(roomId: string, source: Interview["source"], notes: string): void {
    this._tool = null;
    this._iv = { roomId, source, via: "agent", phase: "review", questions: [], picked: [], typed: [], extra: "", answers: [], result: notes, round: 0 };
  }

  // --- describing a room from photos (one time, never kept) --------------------------------

  private _openPhotos(room: Room): void {
    this._error = "";
    this._message = "";
    this._tool = { kind: "photos", roomId: room.id, photos: [], working: false, sending: false };
  }

  private _patchTool(patch: Partial<PhotosTool> | Partial<ChatTool> | Partial<FlatTool>): void {
    if (this._tool) this._tool = { ...this._tool, ...patch } as Tool;
  }

  private async _addPhotos(files: FileList | null): Promise<void> {
    const tool = this._tool;
    if (!files || tool?.kind !== "photos") return;
    const room = Math.max(0, MAX_PHOTOS - tool.photos.length);
    this._error = "";
    const roomId = tool.roomId;
    this._patchTool({ working: true });
    try {
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, room)) added.push(await shrinkPhoto(file));
      const now = this._tool;
      // Only if the person is still looking at the same room's photos.
      if (now?.kind !== "photos" || now.roomId !== roomId) return;
      this._patchTool({ photos: [...now.photos, ...added] });
      if (files.length > room) this._error = `Up to ${MAX_PHOTOS} photos per room. The rest were left out.`;
    } catch (err) {
      this._error = errorMessage(err);
    }
    const after = this._tool;
    if (after?.kind === "photos" && after.roomId === roomId) this._patchTool({ working: false });
  }

  private async _sendPhotos(): Promise<void> {
    const tool = this._tool;
    const room = tool?.kind === "photos" ? this._room(tool.roomId) : undefined;
    if (!this.hass || tool?.kind !== "photos" || !room || !tool.photos.length) return;
    this._error = "";
    const run = ++this._run;
    this._patchTool({ working: true, sending: true });
    try {
      const result = await roomPhotos(this.hass, room.name, room.notes, tool.photos);
      if (run !== this._run) return; // the person stopped waiting
      this._review(room.id, "photos", result.notes); // the photos are gone with the tool
    } catch (err) {
      if (run !== this._run) return;
      this._error = errorMessage(err);
      this._patchTool({ working: false, sending: false });
    }
  }

  /** The person gave up waiting: keep what they have, ignore a late answer. */
  private _stopWaiting(): void {
    this._run++;
    if (this._tool?.kind === "photos") {
      this._patchTool({ working: false, sending: false });
      this._error = "You stopped waiting. Your photos are still here, so you can try again.";
    } else {
      this._iv = null;
      this._error = "You stopped waiting. Nothing was changed, so you can try again.";
    }
  }

  // --- talking it out in your own AI chat --------------------------------------------------

  private _liveRooms(): Room[] {
    return (this._draft?.rooms ?? []).filter((r) => !r.hidden);
  }

  private _hasNotes(roomId: string): boolean {
    return roomId ? !!this._room(roomId)?.notes.trim() : this._liveRooms().some((r) => r.notes.trim());
  }

  private async _openChat(room: Room | null): Promise<void> {
    this._error = "";
    this._message = "";
    this._tool = { kind: "chat", roomId: room?.id ?? "", prompt: "", include: true, pasted: "", working: false, copied: false };
    await this._loadPrompt();
  }

  private async _loadPrompt(): Promise<void> {
    const tool = this._tool;
    if (!this.hass || tool?.kind !== "chat") return;
    const room = tool.roomId ? this._room(tool.roomId) : undefined;
    const ask = ++this._promptAsk;
    try {
      const prompt = await chatPrompt(
        this.hass,
        tool.include,
        room?.name ?? "",
        room?.notes ?? "",
        room ? undefined : this._liveRooms().map((r) => ({ name: r.name, notes: r.notes }))
      );
      if (ask !== this._promptAsk) return; // a newer choice was made while this one was on its way
      this._patchTool({ prompt, copied: false });
    } catch (err) {
      if (ask === this._promptAsk) this._error = errorMessage(err);
    }
  }

  private async _copyPrompt(): Promise<void> {
    const tool = this._tool;
    if (tool?.kind !== "chat") return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(tool.prompt);
      ok = true;
    } catch {
      // No clipboard access (an insecure address): copy from the visible box instead.
      const box = this.renderRoot.querySelector<HTMLTextAreaElement>("#promptbox");
      if (box) {
        box.select();
        ok = document.execCommand("copy");
      }
    }
    this._patchTool({ copied: ok });
    if (!ok) this._error = "Copying did not work here. Select the text in the box and copy it yourself.";
  }

  private async _readPasted(): Promise<void> {
    const tool = this._tool;
    if (!this.hass || tool?.kind !== "chat" || !tool.pasted.trim()) return;
    this._error = "";
    this._patchTool({ working: true });
    try {
      if (tool.roomId) {
        const result = await pasteNotes(this.hass, tool.pasted);
        this._review(tool.roomId, "paste", result.notes);
      } else {
        const rooms = await pasteHome(
          this.hass,
          tool.pasted,
          this._liveRooms().map((r) => ({ id: r.id, name: r.name }))
        );
        this._tool = { kind: "flat", items: rooms.map((r) => ({ ...r, on: true })) };
      }
    } catch (err) {
      this._error = errorMessage(err);
      this._patchTool({ working: false });
    }
  }

  private _patchFlat(index: number, patch: Partial<PastedRoom & { on: boolean }>): void {
    const tool = this._tool;
    if (tool?.kind !== "flat") return;
    this._patchTool({ items: tool.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
  }

  private _applyFlat(): void {
    const tool = this._tool;
    if (tool?.kind !== "flat" || !this._draft) return;
    let rooms = [...this._draft.rooms];
    let changed = 0;
    for (const item of tool.items) {
      const notes = item.notes.trim().slice(0, NOTES_MAX);
      if (!item.on || !notes) continue;
      changed += 1;
      if (item.id && rooms.some((r) => r.id === item.id)) {
        rooms = rooms.map((r) => (r.id === item.id ? { ...r, notes } : r));
      } else {
        rooms.push({ id: newId(), name: item.name, area_id: "", notes, hidden: false });
      }
    }
    this._draft = { ...this._draft, rooms };
    this._tool = null;
    this._message = changed
      ? `Notes for ${changed} ${changed === 1 ? "room" : "rooms"} are in. Press Save to keep them.`
      : "Nothing was used.";
  }

  private async _askQuestions(answers: AiAnswer[]): Promise<void> {
    const iv = this._iv;
    const room = iv && this._room(iv.roomId);
    if (!this.hass || !iv || !room) return;
    this._iv = { ...iv, phase: "working", answers };
    const run = ++this._run;
    try {
      const result = await roomQuestions(this.hass, room.name, room.notes, answers, iv.via);
      if (run !== this._run) return; // the person stopped waiting
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
      if (run !== this._run) return;
      this._error = errorMessage(err);
      this._iv = null;
    }
  }

  private async _writeNotes(answers: AiAnswer[]): Promise<void> {
    const iv = this._iv;
    const room = iv && this._room(iv.roomId);
    if (!this.hass || !iv || !room) return;
    this._iv = { ...iv, phase: "working", answers };
    const run = ++this._run;
    try {
      const result = await roomNotes(this.hass, room.name, room.notes, answers, iv.via);
      if (run !== this._run) return; // the person stopped waiting
      this._iv = { ...iv, answers, phase: "review", result: result.notes };
    } catch (err) {
      if (run !== this._run) return;
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
        <button type="button" class="link" @click=${() => ((this._run += 1), (this._iv = null))}>Cancel</button>
      </div>
      ${iv.phase === "working"
        ? html`<boopli-wait
            .label=${iv.via === "claude" ? "Asking Claude. This takes a little while…" : iv.answers.length ? "Writing the notes…" : "Thinking…"}
            .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
            .max=${waitSeconds(this.snapshot, iv.via)}
            @stop-waiting=${() => this._stopWaiting()}
          ></boopli-wait>`
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
              ${iv.source === "paste"
                ? "This is what I read from what you pasted."
                : iv.source === "photos"
                  ? "This is what the AI saw in your photos. The photos are already gone."
                  : "This is what I would write down."}
              Change anything that is wrong.
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
              ${iv.source !== "paste" && this._aiOn()
                ? html`<button class="big" @click=${() => this._askQuestions(iv.answers)}>Ask me more</button>`
                : nothing}
              <button class="big" @click=${() => (this._iv = null)}>Throw away</button>
            </div>
          `
        : nothing}
    </section>`;
  }

  private _renderTool(tool: Tool) {
    if (tool.kind === "photos") return this._renderPhotos(tool);
    if (tool.kind === "chat") return this._renderChat(tool);
    return this._renderFlat(tool);
  }

  private _renderPhotos(tool: PhotosTool) {
    const room = this._room(tool.roomId);
    const full = tool.photos.length >= MAX_PHOTOS;
    return html`<section class="card interview">
      <div class="top">
        <h2>${room?.name ?? "Room"}: describe it from photos</h2>
        <button type="button" class="link" ?disabled=${tool.sending} @click=${() => (this._tool = null)}>Cancel</button>
      </div>
      <p class="muted">
        Take or pick up to ${MAX_PHOTOS} photos of this room. They go once to your AI agent, which writes down what it
        sees. Boopli does not keep them: they are not saved anywhere, and later requests carry only the notes.
      </p>
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      ${tool.sending
        ? html`<boopli-wait
            .label=${"The AI is looking at your photos…"}
            .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
            .max=${this.snapshot?.ai_timeout ?? 180}
            @stop-waiting=${() => this._stopWaiting()}
          ></boopli-wait>`
        : html`
            <div class="thumbs">
              ${tool.photos.map(
                (src, i) => html`<div class="thumb">
                  <img src=${src} alt="Photo ${i + 1}" />
                  <button
                    type="button"
                    class="x"
                    aria-label="Remove photo ${i + 1}"
                    @click=${() => this._patchTool({ photos: tool.photos.filter((_, k) => k !== i) })}
                  >
                    ×
                  </button>
                </div>`
              )}
            </div>
            <div class="actions">
              <label class="filebtn big ${full || tool.working ? "off" : ""}">
                ${tool.working ? "Preparing…" : tool.photos.length ? "Add another photo" : "Take or pick photos"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ?disabled=${full || tool.working}
                  @change=${(e: Event) => {
                    const input = e.target as HTMLInputElement;
                    void this._addPhotos(input.files).then(() => (input.value = ""));
                  }}
                />
              </label>
              <button class="primary big" ?disabled=${!tool.photos.length || tool.working} @click=${() => this._sendPhotos()}>
                Describe the room
              </button>
            </div>
            <p class="muted small">
              The agent has to be able to read images. If it cannot, you can pick another one for photos in Settings
              under AI help, Advanced.
            </p>
          `}
    </section>`;
  }

  private _renderChat(tool: ChatTool) {
    const room = tool.roomId ? this._room(tool.roomId) : undefined;
    const whole = !tool.roomId;
    return html`<section class="card interview">
      <div class="top">
        <h2>${whole ? "My whole home" : room?.name ?? "Room"}: talk it out in your own AI chat</h2>
        <button type="button" class="link" @click=${() => (this._tool = null)}>Cancel</button>
      </div>
      <p class="muted">
        Use any chat you like, for example one you can talk to by voice. Boopli sends nothing: you copy and paste
        yourself, so this works even with AI help switched off.
      </p>
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      <ol class="stepslist">
        <li>
          <b>Copy this</b> and paste it into your chat.
          ${this._hasNotes(tool.roomId)
            ? html`<label class="inline">
                <input
                  type="checkbox"
                  .checked=${tool.include}
                  @change=${(e: Event) => {
                    // The old text is dropped at once, so a prompt with the wrong notes cannot be copied.
                    this._patchTool({ include: (e.target as HTMLInputElement).checked, prompt: "" });
                    void this._loadPrompt();
                  }}
                />
                Include what I have written so far
              </label>`
            : nothing}
          <textarea id="promptbox" class="promptbox" rows="7" readonly .value=${tool.prompt}></textarea>
          <div class="actions">
            <button class="primary big" ?disabled=${!tool.prompt} @click=${() => this._copyPrompt()}>
              ${tool.copied ? "Copied ✓" : "Copy the prompt"}
            </button>
          </div>
        </li>
        <li>
          <b>Talk it through</b> with the chat. When you say you are done, it answers with the notes.
        </li>
        <li>
          <b>Copy the notes</b> it gives back and paste them here.
          <textarea
            class="pastebox"
            rows="6"
            aria-label="Pasted notes"
            placeholder=${whole ? "## Kitchen\nDishwasher is under the counter\n## Bedroom\n…" : "Dishwasher is under the counter\nBalcony door sticks"}
            .value=${tool.pasted}
            @input=${(e: Event) => this._patchTool({ pasted: (e.target as HTMLTextAreaElement).value })}
          ></textarea>
          <div class="actions">
            <button class="primary big" ?disabled=${!tool.pasted.trim() || tool.working} @click=${() => this._readPasted()}>
              ${tool.working ? "Reading…" : "Read the notes"}
            </button>
          </div>
        </li>
      </ol>
    </section>`;
  }

  private _renderFlat(tool: FlatTool) {
    const used = tool.items.filter((i) => i.on && i.notes.trim()).length;
    return html`<section class="card interview">
      <div class="top">
        <h2>My whole home: what I found</h2>
        <button type="button" class="link" @click=${() => (this._tool = null)}>Cancel</button>
      </div>
      <p>
        Here are the rooms in what you pasted. Change anything that is wrong, and untick a room you do not want.
        Nothing is saved until you press Save afterwards.
      </p>
      ${tool.items.map((item, i) => {
        const existing = item.id ? this._room(item.id) : undefined;
        return html`<div class="question">
          <label class="inline qtext">
            <input type="checkbox" .checked=${item.on} @change=${(e: Event) => this._patchFlat(i, { on: (e.target as HTMLInputElement).checked })} />
            ${item.name}
            <span class="tag">${item.id ? "your room" : "new room"}</span>
          </label>
          ${existing?.notes.trim() ? html`<div class="muted small">It replaces the notes this room has now.</div>` : nothing}
          <textarea
            class="notes"
            rows="5"
            aria-label="Notes for ${item.name}"
            .value=${item.notes}
            @input=${(e: Event) => this._patchFlat(i, { notes: (e.target as HTMLTextAreaElement).value })}
          ></textarea>
        </div>`;
      })}
      <div class="actions">
        <button class="primary big" ?disabled=${used === 0} @click=${() => this._applyFlat()}>
          Use ${used} ${used === 1 ? "room" : "rooms"}
        </button>
        <button class="big" @click=${() => (this._tool = null)}>Throw away</button>
      </div>
    </section>`;
  }

  private _renderRoom(room: Room) {
    const aiOn = agentOn(this.snapshot);
    const claudeOn = claudeReady(this.snapshot);
    return html`<section class="room ${this._roomChanged(room.id) ? "changed" : ""}">
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
          ? html`<button type="button" class="textlink" ?disabled=${!room.name.trim() || this._busy} @click=${() => this._startInterview(room)}>
                ${icon("auto-fix")} Let the AI ask me
              </button>
              <button type="button" class="textlink" ?disabled=${!room.name.trim() || this._busy} @click=${() => this._openPhotos(room)}>
                ${icon("camera-outline")} From photos
              </button>`
          : nothing}
        ${claudeOn
          ? html`<button type="button" class="textlink" ?disabled=${!room.name.trim() || this._busy} @click=${() => this._startInterview(room, "claude")}>
              ${icon("creation")} Let Claude ask me
            </button>`
          : nothing}
        <button type="button" class="textlink" ?disabled=${!room.name.trim() || this._busy} @click=${() => this._openChat(room)}>
          ${icon("chat-outline")} In my own chat
        </button>
        <span class="spacer"></span>
        <button type="button" class="textlink quiet" @click=${() => this._removeRoom(room)}>${room.area_id ? "Hide" : "Delete"}</button>
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
    if (this._tool) return html`${this._renderTool(this._tool)}${this._renderSaveBar()}`;
    const shown = d.rooms.filter((r) => !r.hidden);
    const hidden = d.rooms.filter((r) => r.hidden);
    return html`
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
      <div class="whole">
        <button type="button" class="textlink" @click=${() => this._openChat(null)}>${icon("chat-outline")} Talk through my whole home in my own chat</button>
        <span class="muted small">Copy a prompt, talk it out by voice or text, paste the result back.</span>
      </div>
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      ${this._message ? html`<div class="ok">${this._message}</div>` : nothing}
      <div class="grid">${shown.map((r) => this._renderRoom(r))}</div>
      <div class="add">
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
        font-size: 16px;
      }
      .ok {
        color: var(--success-color, #43a047);
        margin: 8px 0;
      }
      .switch {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 17px;
        color: var(--primary-text-color);
        margin: 8px 0;
        cursor: pointer;
      }
      .switch input {
        width: 20px;
        min-height: 20px;
        height: 20px;
      }
      /* Rooms without boxes: a thin line on top (accent colour on hover or while typing), the name, the notes. */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
        gap: 22px 32px;
        margin: 16px 0;
        align-items: start;
      }
      .room {
        padding-top: 10px;
        border-top: 2px solid var(--divider-color);
        transition: border-color 0.15s;
      }
      .room:hover,
      .room:focus-within {
        border-top-color: var(--boopli-accent, var(--primary-color));
      }
      .room.changed {
        border-top-color: var(--warning-color, #ffa600);
      }
      .head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }
      /* The room name looks like a heading until you click it. */
      input.name {
        font-size: 21px;
        font-weight: 500;
        background: none;
        border: 0;
        border-bottom: 1px solid transparent;
        border-radius: 0;
        padding: 4px 0;
      }
      input.name:hover,
      input.name:focus {
        border-bottom-color: var(--divider-color);
        outline: none;
      }
      .add {
        padding-top: 10px;
        border-top: 2px solid var(--divider-color);
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
      .row-actions button.textlink {
        font-size: 17px;
        padding: 4px 2px;
      }
      button.textlink.quiet {
        color: var(--secondary-text-color);
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
        font-size: 15px;
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
        font-size: 18px;
      }
      .whole {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin: 6px 0 4px;
      }
      .row-actions {
        flex-wrap: wrap;
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
      .stepslist {
        max-width: 760px;
        padding-left: 22px;
        line-height: 1.5;
      }
      .stepslist li {
        margin: 0 0 18px;
      }
      .promptbox,
      .pastebox {
        display: block;
        margin-top: 8px;
      }
      .inline {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-left: 6px;
      }
      .inline input {
        width: 20px;
        min-height: 20px;
        height: 20px;
      }
      .tag {
        font-size: 15px;
        font-weight: 400;
        padding: 1px 8px;
        border-radius: 999px;
        border: 1px solid var(--divider-color);
        color: var(--secondary-text-color);
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
    `,
  ];
}

customElements.define("boopli-home", BoopliHome);
