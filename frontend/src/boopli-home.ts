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
import { t, rich } from "./i18n";

const NOTES_MAX = 2000;

/** Photos picked for one room. They live only in this screen's memory until they are sent. */
interface PhotosTool {
  kind: "photos";
  roomId: string;
  photos: string[]; // shrunk JPEG data URLs
  working: boolean; // preparing or sending
  sending: boolean;
  via: Via; // who is looking at the photos
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
      this._message = t("common.saved");
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
  private _review(roomId: string, source: Interview["source"], notes: string, via: Via = "agent"): void {
    this._tool = null;
    this._iv = { roomId, source, via, phase: "review", questions: [], picked: [], typed: [], extra: "", answers: [], result: notes, round: 0 };
  }

  // --- describing a room from photos (one time, never kept) --------------------------------

  private _openPhotos(room: Room): void {
    this._error = "";
    this._message = "";
    this._tool = { kind: "photos", roomId: room.id, photos: [], working: false, sending: false, via: "agent" };
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
      if (files.length > room) this._error = t("home.up_to_photos_per_room_the", { max_photos: MAX_PHOTOS });
    } catch (err) {
      this._error = errorMessage(err);
    }
    const after = this._tool;
    if (after?.kind === "photos" && after.roomId === roomId) this._patchTool({ working: false });
  }

  private async _sendPhotos(via: Via = "agent"): Promise<void> {
    const tool = this._tool;
    const room = tool?.kind === "photos" ? this._room(tool.roomId) : undefined;
    if (!this.hass || tool?.kind !== "photos" || !room || !tool.photos.length) return;
    this._error = "";
    const run = ++this._run;
    this._patchTool({ working: true, sending: true, via });
    try {
      const result = await roomPhotos(this.hass, room.name, room.notes, tool.photos, via);
      if (run !== this._run) return; // the person stopped waiting
      this._review(room.id, "photos", result.notes, via); // the photos are gone with the tool
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
      this._error = t("common.you_stopped_waiting_your_photos_are");
    } else {
      this._iv = null;
      this._error = t("home.you_stopped_waiting_nothing_was_changed");
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
    if (!ok) this._error = t("home.copying_did_not_work_here_select");
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
      ? t("home.notes_are_in", { count: changed })
      : t("home.nothing_was_used");
  }

  private async _askQuestions(answers: AiAnswer[]): Promise<void> {
    const iv = this._iv;
    const room = iv && this._room(iv.roomId);
    if (!this.hass || !iv || !room) return;
    // If this fails, the screen goes back to what it showed (with the answers typed), so a retry
    // does not send them twice. The very first request has nothing to go back to.
    const back = iv.phase === "working" ? null : iv;
    this._error = "";
    this._iv = { ...iv, phase: "working", answers };
    const run = ++this._run;
    try {
      const result = await roomQuestions(this.hass, room.name, room.notes, answers, iv.via);
      if (run !== this._run) return; // the person stopped waiting
      if (result.enough || result.questions.length === 0) {
        await this._writeNotes(answers, back);
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
      this._iv = back;
    }
  }

  /** `back` is what to show again if this fails (a screen that was open before); left out = the screen as it is now. */
  private async _writeNotes(answers: AiAnswer[], back?: Interview | null): Promise<void> {
    const iv = this._iv;
    const room = iv && this._room(iv.roomId);
    if (!this.hass || !iv || !room) return;
    const restore = back !== undefined ? back : iv.phase === "working" ? null : iv;
    this._error = "";
    this._iv = { ...iv, phase: "working", answers };
    const run = ++this._run;
    try {
      const result = await roomNotes(this.hass, room.name, room.notes, answers, iv.via);
      if (run !== this._run) return; // the person stopped waiting
      this._iv = { ...iv, answers, phase: "review", result: result.notes };
    } catch (err) {
      if (run !== this._run) return;
      this._error = errorMessage(err);
      this._iv = restore;
    }
  }

  private _currentAnswers(iv: Interview): AiAnswer[] {
    const out: AiAnswer[] = [];
    iv.questions.forEach((q, i) => {
      const parts = [...iv.picked[i], iv.typed[i].trim()].filter(Boolean);
      if (parts.length) out.push({ question: q.text, answer: parts.join(", ") });
    });
    if (iv.extra.trim()) out.push({ question: t("home.anything_else_about_this_room"), answer: iv.extra.trim() });
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
        placeholder=${t("common.or_write_it_in_your_own")}
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
        <h2>${t("home.room_let_me_ask", { room: room?.name ?? t("home.room") })}</h2>
        <button type="button" class="link" @click=${() => ((this._run += 1), (this._iv = null))}>${t("common.cancel")}</button>
      </div>
      ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      ${iv.phase === "working"
        ? html`<boopli-wait
            .label=${iv.via === "claude" ? t("common.asking_claude_this_takes_a_little") : iv.answers.length ? t("home.writing_the_notes") : t("common.thinking")}
            .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
            .max=${waitSeconds(this.snapshot, iv.via)}
            @stop-waiting=${() => this._stopWaiting()}
          ></boopli-wait>`
        : nothing}
      ${iv.phase === "questions"
        ? html`
            <p class="muted small">
              ${iv.round > 1 ? t("home.a_few_more_things") : t("home.a_few_quick_questions_about_this")} ${t("common.tap_what_fits")}
            </p>
            ${iv.questions.map((q, i) => this._renderQuestion(q, i, iv))}
            <div class="question">
              <div class="qtext">${t("home.anything_else_about_this_room")}</div>
              <textarea
                rows="2"
                class="own"
                placeholder=${t("home.optional_long_answers_are_welcome")}
                .value=${iv.extra}
                @input=${(e: Event) => this._patchIv({ extra: (e.target as HTMLTextAreaElement).value })}
              ></textarea>
            </div>
            <div class="actions">
              <button class="primary big" @click=${() => this._askQuestions([...iv.answers, ...this._currentAnswers(iv)])}>
                ${t("home.next_questions")}
              </button>
              <button class="big" @click=${() => this._writeNotes([...iv.answers, ...this._currentAnswers(iv)])}>
                ${t("home.enough_write_the_notes")}
              </button>
            </div>
          `
        : nothing}
      ${iv.phase === "review"
        ? html`
            <p>
              ${iv.source === "paste"
                ? t("home.this_is_what_i_read_from")
                : iv.source === "photos"
                  ? t("home.this_is_what_the_ai_saw")
                  : t("home.this_is_what_i_would_write")}
              ${t("home.change_anything_that_is_wrong")} ${room?.notes ? html`<b>${t("home.it_replaces_the_notes_you_have")}</b>` : nothing} ${t("home.nothing_is_saved_until_you_press")}
            </p>
            <textarea
              rows="8"
              class="notes"
              aria-label=${t("home.proposed_notes")}
              .value=${iv.result}
              @input=${(e: Event) => this._patchIv({ result: (e.target as HTMLTextAreaElement).value })}
            ></textarea>
            <div class="actions">
              <button class="primary big" ?disabled=${!iv.result.trim()} @click=${() => this._acceptNotes()}>${t("home.use_these_notes")}</button>
              ${iv.source !== "paste" && this._aiOn()
                ? html`<button class="big" @click=${() => this._askQuestions(iv.answers)}>${t("home.ask_me_more")}</button>`
                : nothing}
              <button class="big" @click=${() => (this._iv = null)}>${t("home.throw_away")}</button>
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
        <h2>${t("home.room_describe_it_from_photos", { room: room?.name ?? t("home.room") })}</h2>
        <button type="button" class="link" ?disabled=${tool.sending} @click=${() => (this._tool = null)}>${t("common.cancel")}</button>
      </div>
      <p class="muted">
        ${t("home.take_or_pick_up_to_photos", { max_photos: MAX_PHOTOS })}
      </p>
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      ${tool.sending
        ? html`<boopli-wait
            .label=${tool.via === "claude" ? t("common.claude_is_looking_at_your_photos") : t("common.the_ai_is_looking_at_your")}
            .pet=${this.snapshot?.settings?.pet_kind ?? "slime"}
            .max=${waitSeconds(this.snapshot, tool.via)}
            @stop-waiting=${() => this._stopWaiting()}
          ></boopli-wait>`
        : html`
            <div class="thumbs">
              ${tool.photos.map(
                (src, i) => html`<div class="thumb">
                  <img src=${src} alt=${t("breakdown.photo", { n: i + 1 })} />
                  <button
                    type="button"
                    class="x"
                    aria-label=${t("breakdown.remove_photo", { n: i + 1 })}
                    @click=${() => this._patchTool({ photos: tool.photos.filter((_, k) => k !== i) })}
                  >
                    ×
                  </button>
                </div>`
              )}
            </div>
            <div class="actions">
              <label class="filebtn big ${full || tool.working ? "off" : ""}">
                ${tool.working ? t("breakdown.preparing") : tool.photos.length ? t("common.add_another_photo") : t("common.take_or_pick_photos")}
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
              ${agentOn(this.snapshot)
                ? html`<button class="primary big" ?disabled=${!tool.photos.length || tool.working} @click=${() => this._sendPhotos("agent")}>
                    ${t("home.describe_the_room")}
                  </button>`
                : nothing}
              ${claudeReady(this.snapshot)
                ? html`<button
                    class="${agentOn(this.snapshot) ? "" : "primary "}big"
                    ?disabled=${!tool.photos.length || tool.working}
                    @click=${() => this._sendPhotos("claude")}
                  >
                    ${icon("creation")} ${t("home.ask_claude_to_describe_it")}
                  </button>`
                : nothing}
            </div>
            <p class="muted small">
              ${agentOn(this.snapshot)
                ? t("home.the_agent_has_to_be_able")
                : ""}${claudeReady(this.snapshot)
                ? t("common.claude_gets_each_photo_through_a")
                : ""}
            </p>
          `}
    </section>`;
  }

  private _renderChat(tool: ChatTool) {
    const room = tool.roomId ? this._room(tool.roomId) : undefined;
    const whole = !tool.roomId;
    return html`<section class="card interview">
      <div class="top">
        <h2>${t("home.room_talk_it_out_in_your_own_ai_chat", { room: whole ? t("home.my_whole_home") : room?.name ?? t("home.room") })}</h2>
        <button type="button" class="link" @click=${() => (this._tool = null)}>${t("common.cancel")}</button>
      </div>
      <p class="muted">
        ${t("home.use_any_chat_you_like_for")}
      </p>
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      <ol class="stepslist">
        <li>
          ${rich("home.copy_this_and_paste_it")}
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
                ${t("home.include_what_i_have_written_so")}
              </label>`
            : nothing}
          <textarea id="promptbox" class="promptbox" rows="7" readonly .value=${tool.prompt}></textarea>
          <div class="actions">
            <button class="primary big" ?disabled=${!tool.prompt} @click=${() => this._copyPrompt()}>
              ${tool.copied ? t("home.copied") : t("home.copy_the_prompt")}
            </button>
          </div>
        </li>
        <li>
          ${rich("home.with_the_chat_when_you_say", { item: t("home.talk_it_through")  })}
        </li>
        <li>
          ${rich("home.copy_the_notes_it_gives_back")}
          <textarea
            class="pastebox"
            rows="6"
            aria-label=${t("home.pasted_notes")}
            placeholder=${whole ? t("home.paste_example_whole") : t("home.paste_example_room")}
            .value=${tool.pasted}
            @input=${(e: Event) => this._patchTool({ pasted: (e.target as HTMLTextAreaElement).value })}
          ></textarea>
          <div class="actions">
            <button class="primary big" ?disabled=${!tool.pasted.trim() || tool.working} @click=${() => this._readPasted()}>
              ${tool.working ? t("home.reading") : t("home.read_the_notes")}
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
        <h2>${t("home.my_whole_home_what_i_found")}</h2>
        <button type="button" class="link" @click=${() => (this._tool = null)}>${t("common.cancel")}</button>
      </div>
      <p>
        ${t("home.here_are_the_rooms_in_what")}
      </p>
      ${tool.items.map((item, i) => {
        const existing = item.id ? this._room(item.id) : undefined;
        return html`<div class="question">
          <label class="inline qtext">
            <input type="checkbox" .checked=${item.on} @change=${(e: Event) => this._patchFlat(i, { on: (e.target as HTMLInputElement).checked })} />
            ${item.name}
            <span class="tag">${item.id ? t("home.your_room") : t("home.new_room")}</span>
          </label>
          ${existing?.notes.trim() ? html`<div class="muted small">${t("home.it_replaces_the_notes_this_room")}</div>` : nothing}
          <textarea
            class="notes"
            rows="5"
            aria-label=${t("home.notes_for", { name: item.name })}
            .value=${item.notes}
            @input=${(e: Event) => this._patchFlat(i, { notes: (e.target as HTMLTextAreaElement).value })}
          ></textarea>
        </div>`;
      })}
      <div class="actions">
        <button class="primary big" ?disabled=${used === 0} @click=${() => this._applyFlat()}>
          ${t("home.use_rooms", { count: used })}
        </button>
        <button class="big" @click=${() => (this._tool = null)}>${t("home.throw_away")}</button>
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
          aria-label=${t("home.room_name")}
          .value=${room.name}
          @input=${(e: Event) => this._patchRoom(room.id, { name: (e.target as HTMLInputElement).value })}
        />
        ${this._roomChanged(room.id) ? html`<span class="unsaved-badge">${t("settings.unsaved")}</span>` : nothing}
      </div>
      ${room.area_id ? html`<div class="muted small">${t("home.from_your_home_assistant_areas")}</div>` : html`<div class="muted small">${t("home.added_by_you")}</div>`}
      <label for="n-${room.id}">${t("home.what_should_the_ai_know_about")}</label>
      <textarea
        id="n-${room.id}"
        class="notes"
        rows="5"
        maxlength=${NOTES_MAX}
        placeholder=${t("home.for_example_dishwasher_is_under_the")}
        .value=${room.notes}
        @input=${(e: Event) => this._patchRoom(room.id, { notes: (e.target as HTMLTextAreaElement).value })}
      ></textarea>
      <div class="row-actions">
        ${aiOn
          ? html`<button type="button" class="textlink" ?disabled=${!room.name.trim() || this._busy} @click=${() => this._startInterview(room)}>
              ${icon("auto-fix")} ${t("home.let_the_ai_ask_me")}
            </button>`
          : nothing}
        ${aiOn || claudeOn
          ? html`<button type="button" class="textlink" ?disabled=${!room.name.trim() || this._busy} @click=${() => this._openPhotos(room)}>
              ${icon("camera-outline")} ${t("home.from_photos")}
            </button>`
          : nothing}
        ${claudeOn
          ? html`<button type="button" class="textlink" ?disabled=${!room.name.trim() || this._busy} @click=${() => this._startInterview(room, "claude")}>
              ${icon("creation")} ${t("home.let_claude_ask_me")}
            </button>`
          : nothing}
        <button type="button" class="textlink" ?disabled=${!room.name.trim() || this._busy} @click=${() => this._openChat(room)}>
          ${icon("chat-outline")} ${t("home.in_my_own_chat")}
        </button>
        <span class="spacer"></span>
        <button type="button" class="textlink quiet" @click=${() => this._removeRoom(room)}>${room.area_id ? t("home.hide") : t("common.delete")}</button>
      </div>
    </section>`;
  }

  private _renderSaveBar() {
    if (!this._isDirty()) return nothing;
    return html`<div class="savebar" role="status">
      <span>${rich("chore_editor.you_have_unsaved_changes")}</span>
      <span class="spacer"></span>
      <button class="primary" ?disabled=${this._busy} @click=${() => this.save()}>${t("common.save")}</button>
      <button ?disabled=${this._busy} @click=${() => this.discard()}>${t("common.discard")}</button>
    </div>`;
  }

  render() {
    const d = this._draft;
    if (!d) return html`<p class="muted">${t("common.loading")}</p>`;
    if (this._iv) return html`${this._renderInterview(this._iv)}${this._renderSaveBar()}`;
    if (this._tool) return html`${this._renderTool(this._tool)}${this._renderSaveBar()}`;
    const shown = d.rooms.filter((r) => !r.hidden);
    const hidden = d.rooms.filter((r) => r.hidden);
    return html`
      <p class="intro">
        ${t("home.tell_boopli_about_your_rooms_so")}
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
        <span>${t("home.send_room_notes_to_the_ai")}</span>
      </label>
      ${!this._aiOn()
        ? html`<p class="muted small">
            ${t("home.ai_help_is_off_so_the")}
          </p>`
        : nothing}
      <div class="whole">
        <button type="button" class="textlink" @click=${() => this._openChat(null)}>${icon("chat-outline")} ${t("home.talk_through_my_whole_home_in")}</button>
        <span class="muted small">${t("home.copy_a_prompt_talk_it_out")}</span>
      </div>
      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
      ${this._message ? html`<div class="ok">${this._message}</div>` : nothing}
      <div class="grid">${shown.map((r) => this._renderRoom(r))}</div>
      <div class="add">
        <label for="newroom">${t("home.add_a_room_or_place")}</label>
        <div class="add-row">
          <input
            id="newroom"
            placeholder=${t("home.for_example_balcony")}
            .value=${this._newName}
            @input=${(e: Event) => (this._newName = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") this._addRoom();
            }}
          />
          <button type="button" class="primary" ?disabled=${!this._newName.trim()} @click=${() => this._addRoom()}>${t("common.add")}</button>
        </div>
      </div>
      ${hidden.length
        ? html`<details class="hiddenrooms" ?open=${this._showHidden} @toggle=${(e: Event) => (this._showHidden = (e.target as HTMLDetailsElement).open)}>
            <summary>${t("home.hidden_rooms", { count: hidden.length })}</summary>
            ${hidden.map(
              (r) => html`<div class="hiddenrow">
                <span>${r.name}</span>
                <button type="button" @click=${() => this._patchRoom(r.id, { hidden: false })}>${t("home.show_again")}</button>
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
