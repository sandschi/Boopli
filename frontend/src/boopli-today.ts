import { LitElement, html, css, nothing } from "lit";
import { answerQuestions, awayEnd, completeStep, deleteChore, errorMessage, notOnIt, onIt, partPark, partTime, questSeen, releaseStep, snoozeStep, startChore, type ParkWhen } from "./api";
import "./boopli-questions";
import { agentOn, anyAi } from "./claude";
import { awayWhen } from "./boopli-away";
import { buildToday } from "./today";
import { petLook } from "./shop-art";
import { describeWhen, fmtTime, isToday, sinceLabel } from "./time";
import { sharedStyles } from "./styles";
import "./boopli-stage";
import "./boopli-shop";
import type { BoopliShop } from "./boopli-shop";
import "./boopli-inventory";
import "./boopli-news";
import "./boopli-pet";
import { icon } from "./icon";
import type { PetKind } from "./pets";
import type { Moment } from "./boopli-pet";
import "./boopli-egg";
import { accessOf } from "./helpers";
import type { Chore, Hass, Mood, Pet, Run, Snapshot, StepRun } from "./types";
import { t } from "./i18n";

/** The question "when should this part come back?", for a part of a running task or a parked one. */
interface ParkAsk {
  runId?: string; // setting a part of a running task aside
  group?: string;
  choreId?: string; // changing the time of a part that is already parked
  picking: boolean; // the date and time picker is open
  at: string; // "YYYY-MM-DDTHH:MM"
}

/** How far along the part (group) of this step is, and whether it can be set aside. */
/** How many finished steps the "done today" timeline shows (the rest is counted: "and 3 more"). */
const DONE_SHOWN = 6;
/** How many history entries the snapshot carries (the same number as HISTORY_IN_SNAPSHOT in manager.py). */
const HISTORY_IN_SNAPSHOT = 200;

function partInfo(run: Run, step: StepRun): { done: number; total: number; canPark: boolean } | null {
  if (!step.group) return null;
  const inPart = run.steps.filter((s) => s.group === step.group);
  const outside = run.steps.some((s) => s.group !== step.group && s.status !== "done");
  return {
    done: inPart.filter((s) => s.status === "done").length,
    total: inPart.length,
    canPark: outside,
  };
}

/** One friendly line per mood. Rewards only: nothing here ever scolds. */
function moodLine(pet: Pet): string {
  if (pet.away) return t("today.is_resting_while_you_are_away", { name: pet.name });
  const lines: Record<Mood, string> = {
    happy: t("today.nice_you_got_things_done_today"),
    content: t("today.ready_when_you_are"),
    sleepy: t("today.is_a_bit_sleepy", { name: pet.name }),
    sad: t("today.misses_you_one_step_is_enough", { name: pet.name }),
    hibernating: t("today.is_curled_up_resting_until_you", { name: pet.name }),
  };
  return lines[pet.mood];
}

/**
 * The Today screen.
 *
 * Top: the one step it is your turn for, big, with Done.
 * Below, dimmed and calm: everything else still to do today.
 */
export class BoopliToday extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    nowMs: { type: Number },
    _busy: { state: true },
    _error: { state: true },
    _toast: { state: true },
    _quick: { state: true },
    _park: { state: true },
    _removing: { state: true },
    _egg: { state: true },
    _shop: { state: true },
    _inventory: { state: true },
    _quest: { state: true },
    _questError: { state: true },
    _moment: { state: true },
    _momentSeq: { state: true },
    _feedSeq: { state: true },
    _momentText: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare nowMs: number;
  declare _busy: boolean;
  declare _error: string;
  declare _toast: string;
  declare _quick: string;
  declare _park: ParkAsk | null;
  declare _removing: string; // the parked part that is asked "really remove?"
  declare _egg: boolean; // the Easter egg is playing (found by tapping the pet)
  declare _shop: boolean; // the shop window is open
  declare _inventory: boolean; // the inventory window is open
  declare _quest: boolean; // the one-time pop-up at the end of the starter quest is open
  declare _questError: string;
  private _questHandled = false; // the server has been told it was seen (from this screen)
  private _feedPending = false; // a meal was given while a window covered the room: play the eating scene when it closes
  declare _moment: Moment; // what the pet plays once: level up, waking up, a step done
  declare _momentSeq: number; // counts them, so the same moment can play again
  declare _feedSeq: number; // counts the meals just given, so each one plays the eating scene
  declare _momentText: string;
  private _lastRunIds: string[] = [];
  private _lastPet?: Pet;
  private _toastTimer?: number;
  private _feedTimer?: number;

  constructor() {
    super();
    this.nowMs = Date.now();
    this._busy = false;
    this._error = "";
    this._toast = "";
    this._quick = "";
    this._park = null;
    this._removing = "";
    this._egg = false;
    this._shop = false;
    this._inventory = false;
    this._quest = false;
    this._questError = "";
    this._moment = "";
    this._momentSeq = 0;
    this._feedSeq = 0;
    this._momentText = "";
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearTimeout(this._toastTimer);
    window.clearTimeout(this._feedTimer);
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    if (!accessOf(this.snapshot).all) {
      // the level was lowered: the question is gone, and so is a half-written quick task (it would reappear when the level rises again)
      this._removing = "";
      this._quick = "";
    }
    if (!changed.has("snapshot") || !this.snapshot?.pet) return;
    const pet = this.snapshot.pet;
    const before = this._lastPet;
    this._lastPet = pet;
    if (before && pet.meals_today > before.meals_today) {
      // A meal was just given (here or on another screen). The eating scene waits until the shop or the inventory is closed, so it can be seen.
      if (this._shop || this._inventory) this._feedPending = true;
      else this._feedSeq += 1;
    }
    // A task that was running and is now finished: celebrate it by name.
    const runIds = this.snapshot.runs.map((r) => r.id);
    const finished = this._lastRunIds
      .filter((id) => !runIds.includes(id))
      .map((id) => this.snapshot!.history.find((h) => h.kind === "chore_done" && h.run_id === id)?.chore_name)
      .filter((name): name is string => !!name);
    this._lastRunIds = runIds;
    // The one-time pop-up at the end of the starter quest (level 10), once per household.
    if (pet.quest_popup && !this._questHandled) this._quest = true;
    const gainedBlubs = before ? pet.blubs - before.blubs : 0; // spending Blubs in the shop is not a gain
    const gainedXp = before ? pet.total_xp - before.total_xp : 0;
    if (!before || (gainedBlubs <= 0 && gainedXp <= 0)) return; // the first look shows nothing
    // The pet celebrates: a level up first, then waking up, otherwise a small hop for the step or the meal.
    const gains: string[] = [];
    if (gainedBlubs > 0) gains.push(t("today.blubs_gained", { blubs: gainedBlubs }));
    if (gainedXp > 0) gains.push(t("today.xp_gained", { xp: gainedXp }));
    this._moment = "done";
    this._momentText = gains.join(" · ");
    if (before.mood === "sleepy" || before.mood === "hibernating") {
      this._moment = "wake";
      this._momentText = "";
    }
    if (pet.level > before.level) {
      this._moment = "levelup";
      this._momentText = t("today.level_2", { level: pet.level });
    }
    this._momentSeq += 1;
    const parts = [...gains];
    if (finished.length) parts.unshift(t("today.is_done", { value: finished[0] }));
    if (pet.level > before.level) parts.push(t("today.level_2", { level: pet.level }));
    if (before.mood === "sad" || before.mood === "hibernating")
      parts.push(t("today.is_awake_welcome_back", { name: pet.name }));
    this._toast = parts.join("  ·  ");
    window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = ""), 5000);
  }

  /** A short message at the bottom of Today, gone after a few seconds. */
  private _say(text: string): void {
    this._toast = text;
    window.clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => (this._toast = ""), 5000);
  }

  private _openBreakdown(kind: "now" | "recurring"): void {
    this.dispatchEvent(
      new CustomEvent("open-breakdown", {
        detail: { kind, task: this._quick.trim() },
        bubbles: true,
        composed: true,
      })
    );
    this._quick = "";
  }

  /** The quick task box: say what you want to get done and let the AI break it down. */
  private _renderQuick() {
    if (!accessOf(this.snapshot).all) return nothing; // making chores is for those who may change them
    const aiOn = anyAi(this.snapshot); // the agent, or Ask Claude
    return html`
      <section class="card quick">
        <span class="mark" aria-hidden="true">${icon("auto-fix")}</span>
        <h3><span class="seal" aria-hidden="true">${icon("auto-fix")}</span>${t("today.what_do_you_want_to_get")}</h3>
        ${aiOn
          ? html`
              <textarea
                rows="2"
                placeholder=${t("today.for_example_clean_the_bathroom")}
                .value=${this._quick}
                @input=${(e: Event) => (this._quick = (e.target as HTMLTextAreaElement).value)}
              ></textarea>
              <div class="quick-actions">
                <button class="primary" @click=${() => this._openBreakdown("now")}>${icon("auto-fix")} ${agentOn(this.snapshot) ? t("common.break_it_down_now") : t("today.ask_claude_to_break_it_down")}</button>
                <button @click=${() => this._openBreakdown("recurring")}>${icon("repeat")} ${t("today.break_down_a_recurring_chore")}</button>
              </div>
            `
          : html`
              <p class="muted small">
                ${t("today.boopli_can_split_a_big_task")}
              </p>
              <button
                @click=${() =>
                  this.dispatchEvent(
                    new CustomEvent("open-wizard", { detail: { wizard: "ai" }, bubbles: true, composed: true })
                  )}
              >
                ${icon("robot-outline")} ${t("common.set_up_ai_help")}
              </button>
            `}
      </section>
    `;
  }

  private _renderPet() {
    const pet = this.snapshot?.pet;
    if (!pet) return nothing;
    const pct = pet.xp_for_level > 0 ? Math.round((pet.xp_in_level / pet.xp_for_level) * 100) : 0;
    // While you are working on a step ("On it"), the pet does housework too.
    const working = (this.snapshot?.runs ?? []).some((r) =>
      r.steps.some((s) => s.status === "active" && !!s.on_it_until)
    );
    const full = pet.meals_today >= pet.meals_max;
    return html`
      <section class="card pet-card stage-slot">
        <boopli-stage
          controls
          .blubs=${pet.blubs}
          .canBuy=${pet.can_buy}
          .mealsEaten=${pet.meals_today}
          .mealsMax=${pet.meals_max}
          .feedSeq=${this._feedSeq}
          .owned=${pet.owned}
          .placed=${pet.placed}
          @open-shop=${() => (this._shop = true)}
          @open-inventory=${() => (this._inventory = true)}
          .kind=${this.snapshot?.settings?.pet_kind ?? "slime"}
          .mood=${pet.mood}
          .level=${pet.level}
          .away=${pet.away ?? false}
          .hungry=${pet.hungry ?? false}
          .activity=${working && !pet.away ? "housework" : ""}
          .moment=${this._moment}
          .momentSeq=${this._momentSeq}
          .momentText=${this._momentText}
          @egg-found=${() => (this._egg = true)}
        ></boopli-stage>
        ${this._egg ? html`<boopli-egg @egg-done=${() => (this._egg = false)}></boopli-egg>` : nothing}
        <div class="pet-info">
          <span class="mark" aria-hidden="true">${icon("paw")}</span>
          <div class="pet-name">${pet.name} <span class="lvl">${icon("star-four-points")} ${t("today.level", { level: pet.level }).replace(/^[\s·•]+/, "")}</span></div>
          <div class="bar" role="progressbar" aria-valuenow=${pct} aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width:${pct}%"></div>
          </div>
          <div class="muted small">${t("today.xp_to_the_next_level", { xp: pet.xp_in_level, xp_needed: pet.xp_for_level })}</div>
          <div class="small">${moodLine(pet)}</div>
          ${full ? html`<div class="small muted meals">${t("common.is_full_for_today", { name: pet.name })}</div>` : nothing}
        </div>
      </section>
      ${this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : nothing}
      <boopli-shop
        .hass=${this.hass}
        .pet=${pet}
        .open=${this._shop}
        @shop-close=${() => this._closeWindow("shop")}
        @open-inventory=${() => {
          this._shop = false;
          this._inventory = true;
        }}
      ></boopli-shop>
      <boopli-inventory
        .hass=${this.hass}
        .pet=${pet}
        .open=${this._inventory}
        @inventory-close=${() => this._closeWindow("inventory")}
        @inventory-error=${(e: CustomEvent<string>) => this._inventoryError(e.detail)}
        @open-shop=${() => {
          this._inventory = false;
          this._shop = true;
        }}
      ></boopli-inventory>
      ${this._renderQuest()}
      <boopli-news .hass=${this.hass} .pet=${pet} .hold=${this._shop || this._inventory || this._quest}></boopli-news>
    `;
  }

  /** A failed inventory action that ended after the inventory was closed: the shop (if it covers Today now) says it, else Today. */
  private _inventoryError(text: string): void {
    const shop = this.renderRoot.querySelector<BoopliShop>("boopli-shop");
    if (this._shop && shop) shop.showError(text);
    else this._say(text);
  }

  /** Close the shop or the inventory; a meal given while it was open now plays its eating scene (unless the other one is still open). */
  private _closeWindow(which: "shop" | "inventory"): void {
    if (which === "shop") this._shop = false;
    else this._inventory = false;
    if (this._feedPending && !this._shop && !this._inventory) {
      window.clearTimeout(this._feedTimer);
      this._feedTimer = window.setTimeout(() => {
        // after the window has faded away; if one was opened again meanwhile, the scene keeps waiting for it
        if (this._shop || this._inventory) return;
        this._feedPending = false;
        this._feedSeq += 1;
      }, 250);
    }
  }

  /** The one-time pop-up at level 10: the starter quest is done, from here it is slower but reachable. */
  private _renderQuest() {
    if (!this._quest) return nothing;
    return html`<dialog
      class="quest"
      aria-label=${t("today.quest_title")}
      @cancel=${(e: Event) => {
        e.preventDefault(); // Escape asks the same as the button: the server has to hear it first
        void this._closeQuest();
      }}
    >
      <h3>${t("today.quest_title")}</h3>
      <p>${t("today.quest_text")}</p>
      ${this._questError ? html`<p class="error" role="alert">${this._questError}</p>` : nothing}
      <button type="button" class="primary" @click=${() => this._closeQuest()}>${t("today.quest_ok")}</button>
    </dialog>`;
  }

  /** Tell the server the pop-up was seen. Only when that worked is it closed for good; otherwise it stays so it can be tried again. */
  private async _closeQuest(): Promise<void> {
    if (!this.hass) return;
    try {
      await questSeen(this.hass);
      this._questHandled = true;
      this._questError = "";
      this._quest = false;
    } catch (err) {
      if (this._questError) {
        // the second try failed as well: let the person go back to Today. The server still has not heard it, so it shows again after a reload.
        this._questHandled = true;
        this._questError = "";
        this._quest = false;
        return;
      }
      this._questError = errorMessage(err);
    }
  }

  protected updated(): void {
    const dialog = this.renderRoot.querySelector<HTMLDialogElement>("dialog.quest");
    // A native modal: focus starts on Continue, Escape and the keyboard stay inside, and focus goes back afterwards.
    if (this._quest && dialog && !dialog.open) dialog.showModal();
  }

  /**
   * How far along this chore is: a fat bar with your pet riding the end of the fill towards the flag,
   * and the names of the steps underneath (done ones ticked) when there are few enough to read.
   */
  private _renderTrail(now: NonNullable<ReturnType<typeof buildToday>["now"]>) {
    const pct = (now.done / now.total) * 100;
    const place = Math.min(94, Math.max(6, pct)); // the pet stays inside the bar
    const names = now.total <= 6;
    const look = petLook(this.snapshot?.pet?.placed); // the rider wears what the pet wears in its room
    return html`<div class="trail">
      <div
        class="track"
        role="progressbar"
        aria-label=${t("today.steps_done")}
        aria-valuenow=${now.done}
        aria-valuemin="0"
        aria-valuemax=${now.total}
      >
        <div class="trail-fill" style="width:${pct}%"></div>
        <boopli-pet
          class="rider"
          style="left:${place}%"
          still
          .kind=${(this.snapshot?.settings?.pet_kind ?? "slime") as PetKind}
          .mood=${"happy"}
          .fur=${look.fur}
          .neck=${look.neck}
        ></boopli-pet>
        <span class="flag">${icon("flag-checkered")}</span>
      </div>
      ${names
        ? html`<ol class="trail-steps">
            ${now.run.steps.map(
              (s) =>
                html`<li class=${s.status === "done" ? "ok" : s.step_id === now.step.step_id ? "here" : ""}>
                  ${s.status === "done" ? icon("check") : nothing}${s.title}
                </li>`
            )}
          </ol>`
        : html`<div class="muted small">${t("today.step_of", { value: now.done + 1, total: now.total })}</div>`}
    </div>`;
  }

  private async _done(runId: string, stepId: string): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await completeStep(this.hass, runId, stepId);
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  /** A waiting step is started by hand: "now" instead of "someday". */
  private async _release(runId: string, stepId: string): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await releaseStep(this.hass, runId, stepId);
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  /** "On it" (or "Still on it", or taking it back): quiet until the check-in. */
  private async _working(runId: string, stepId: string, on: boolean): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await (on ? onIt : notOnIt)(this.hass, runId, stepId);
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  /** Push the next nudge of this step back by the snooze length from Settings. */
  private async _snooze(runId: string, stepId: string): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await snoozeStep(this.hass, runId, stepId);
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  // --- setting a part aside for later ---------------------------------------------------------

  /** A sensible default for the picker: tomorrow at 09:00, in the browser's own time. */
  private _defaultPick(): string {
    const d = new Date(this.nowMs + 24 * 3600 * 1000);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T09:00`;
  }

  private _openPark(ask: Omit<ParkAsk, "picking" | "at">): void {
    this._error = "";
    this._park = { ...ask, picking: false, at: this._defaultPick() };
  }

  private async _choose(when: ParkWhen): Promise<void> {
    const ask = this._park;
    if (!this.hass || !ask || this._busy) return;
    if (when === "at" && !ask.picking) {
      this._park = { ...ask, picking: true };
      return;
    }
    this._busy = true;
    this._error = "";
    try {
      if (ask.choreId) await partTime(this.hass, ask.choreId, when, ask.at);
      else await partPark(this.hass, ask.runId ?? "", ask.group ?? "", when, ask.at);
      this._park = null;
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _renderParkAsk() {
    const ask = this._park;
    if (!ask) return nothing;
    return html`<div class="park-ask" role="group" aria-label=${t("today.when_should_this_part_come_back")}>
      <div class="small">${ask.choreId ? t("today.when_should_it_come_back") : t("today.set_aside_when_should_it_come", { group: ask.group ?? "" })}</div>
      <div class="park-buttons">
        <button ?disabled=${this._busy} @click=${() => this._choose("any")}>${t("today.when_i_want")}</button>
        <button ?disabled=${this._busy} @click=${() => this._choose("tomorrow")}>${t("today.tomorrow_9_00")}</button>
        <button ?disabled=${this._busy} @click=${() => this._choose("at")}>${t("today.pick_a_time")}</button>
        <button class="link" @click=${() => (this._park = null)}>${t("common.cancel")}</button>
      </div>
      ${ask.picking
        ? html`<div class="park-pick">
            <input
              type="datetime-local"
              aria-label=${t("today.date_and_time")}
              .value=${ask.at}
              @input=${(e: Event) => this._park && (this._park = { ...this._park, at: (e.target as HTMLInputElement).value })}
            />
            <button class="primary" ?disabled=${this._busy || !ask.at} @click=${() => this._choose("at")}>${t("today.set_it")}</button>
          </div>`
        : nothing}
      <div class="muted small">${t("today.nothing_is_lost_the_steps_wait")}</div>
    </div>`;
  }

  /** Away mode is on (or planned): a loud banner at the very top, as a firm reminder. Set up in Settings. */
  private _renderAway(tz: string) {
    const away = this.snapshot?.away;
    if (!away?.active) return nothing;
    const onNow = !!this.snapshot?.away_now;
    return html`<section class="away-banner ${onNow ? "on" : "planned"}" role="status">
      <span class="mark" aria-hidden="true">${icon("bag-suitcase")}</span>
      <div class="away-icon" aria-hidden="true">${icon("bag-suitcase")}</div>
      <div class="away-text">
        <div class="away-title">${onNow ? t("today.away_mode_is_on") : t("today.away_mode_is_planned")}</div>
        <div class="away-when">${awayWhen(away, this.nowMs, tz, onNow)}</div>
        <div class="away-note">
          ${onNow
            ? t("common.nothing_starts_and_nothing_nudges_you")
            : t("common.boopli_carries_on_as_usual_until")}
        </div>
      </div>
      <div class="away-actions">
        <button class="primary big" ?disabled=${this._busy} @click=${() => this._partAction(() => awayEnd(this.hass!))}>
          ${onNow ? t("common.back_now") : t("common.cancel_it")}
        </button>
        ${accessOf(this.snapshot).all
          ? html`<button class="link" @click=${() => this.dispatchEvent(new CustomEvent("goto-settings", { bubbles: true, composed: true }))}>
              ${t("today.change_in_settings")}
            </button>`
          : nothing}
      </div>
    </section>`;
  }

  /** Chores that started by themselves with all steps and still wait for the answers to their questions. */
  private _renderQuestions() {
    const open = (this.snapshot?.runs ?? []).filter((r) => r.questions_open && (r.questions ?? []).length > 0);
    return open.map(
      (run) => html`<section class="card now ask">
        <span class="mark" aria-hidden="true">${icon("help-circle-outline")}</span>
        <div class="now-head">
          <span class="seal" aria-hidden="true">${icon("help")}</span>
          <div class="muted small">${run.chore_name}</div>
        </div>
        <h2>${t("today.quick_look_first")}</h2>
        <p class="muted small">
          ${t("today.it_started_with_all_its_steps")}
        </p>
        <boopli-questions
          soft
          .questions=${run.questions ?? []}
          .busy=${this._busy}
          .cancelable=${false}
          label=${t("common.done")}
          allLabel=${t("today.keep_all_steps")}
          @answered=${(e: CustomEvent<{ answers: Record<string, boolean> }>) =>
            this._partAction(() => answerQuestions(this.hass!, run.id, e.detail.answers))}
          @all-steps=${() => this._partAction(() => answerQuestions(this.hass!, run.id, {}))}
        ></boopli-questions>
      </section>`
    );
  }

  /** Parts that were set aside and are not running now. */
  private _parkedParts(): Chore[] {
    const running = new Set(this.snapshot?.runs.map((r) => r.chore_id) ?? []);
    return (this.snapshot?.chores ?? []).filter((c) => c.parked && !running.has(c.id));
  }

  private async _partAction(fn: () => Promise<unknown>): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    try {
      await fn();
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  // --- the lists next to the big step, in the order you read them ---------------------------

  /** A list heading with a count, so the parts of the screen are easy to tell apart. */
  private _heading(title: string, count: number | string, symbol: string) {
    return html`<h3 class="sec-title"><span class="seal" aria-hidden="true">${icon(symbol)}</span>${title}<span class="count">${count}</span></h3>`;
  }

  /** 1. Other steps that are your turn right now. */
  private _renderReady(model: ReturnType<typeof buildToday>) {
    const count = model.ready.reduce((n, g) => n + g.steps.length, 0);
    if (count === 0) return nothing;
    return html`<section class="sec sec-ready">
      <span class="mark" aria-hidden="true">${icon("play-circle-outline")}</span>
      ${this._heading(t("today.ready_now"), count, "play-circle-outline")}
      ${model.ready.map(
        (g) => html`<div class="group">
          <div class="group-name strong">${g.run.chore_name}</div>
          ${g.steps.map(
            (s) => html`<div class="row">
              <span class="rowmain">
                <button
                  type="button"
                  class="go"
                  title=${t("today.done_step", { step: s.title })}
                  aria-label=${t("today.done_step", { step: s.title })}
                  ?disabled=${this._busy}
                  @click=${() => this._done(g.run.id, s.stepId)}
                >
                  ${icon("check-bold")}
                </button>
                <span>${s.title}</span>
              </span>
            </div>`
          )}
        </div>`
      )}
    </section>`;
  }

  /** 2. The rest of what is going on today. */
  private _renderStill(model: ReturnType<typeof buildToday>, tz: string) {
    const count = model.groups.reduce((n, g) => n + g.steps.length, 0) + model.dueToday.length;
    if (count === 0) return nothing;
    // When some step can be started with the chevrons, the others keep the same space, so all titles start in one line.
    const anyGo = model.groups.some((g) => g.steps.some((s) => s.status === "waiting"));
    return html`<section class="sec sec-still soft">
      <span class="mark" aria-hidden="true">${icon("clock-outline")}</span>
      ${this._heading(t("today.still_to_do_today"), count, "clock-outline")}
      ${model.groups.map(
        (g) => html`<div class="group">
          <div class="group-name">${g.run.chore_name}</div>
          ${g.steps.map(
            (s) => html`<div class="row">
              <span class="rowmain">
                ${s.status === "waiting"
                  ? html`<button
                      type="button"
                      class="go"
                      title=${t("today.start_step_now", { step: s.title })}
                      aria-label=${t("today.start_step_now", { step: s.title })}
                      ?disabled=${this._busy}
                      @click=${() => this._release(g.run.id, s.stepId)}
                    >
                      ${icon("chevron-double-right")}
                    </button>`
                  : anyGo
                    ? html`<span class="go-space" aria-hidden="true"></span>`
                    : nothing}
                <span>${s.title}</span>
              </span>
              <span class="hint">${s.hint}</span>
            </div>`
          )}
        </div>`
      )}
      ${model.dueToday.map(
        (d) => html`<div class="group">
          <div class="row">
            <span class="group-name">${d.chore.name}</span>
            <span class="hint">${t("today.at", { time: fmtTime(d.at, tz) })}</span>
          </div>
        </div>`
      )}
    </section>`;
  }

  /** 3. Scheduled chores on later days. */
  private _renderUpcoming(model: ReturnType<typeof buildToday>) {
    if (model.upcoming.length === 0) return nothing;
    const tz = this.snapshot?.time_zone ?? "UTC";
    const shown = model.upcoming.slice(0, 8);
    return html`<section class="sec sec-upcoming soft">
      <span class="mark" aria-hidden="true">${icon("calendar-clock")}</span>
      ${this._heading(t("today.upcoming"), model.upcoming.length, "calendar-clock")}
      ${shown.map(
        (d) => html`<div class="group">
          <div class="row">
            <span class="group-name">${d.chore.name}</span>
            <span class="hint">${describeWhen(d.at, this.nowMs, tz)}</span>
          </div>
        </div>`
      )}
      ${model.upcoming.length > shown.length
        ? html`<div class="muted small more">${t("today.and_more_in_the_chores_tab", { count: model.upcoming.length - shown.length })}</div>`
        : nothing}
    </section>`;
  }

  private _renderParked() {
    const parts = this._parkedParts();
    if (parts.length === 0) return nothing;
    const tz = this.snapshot?.time_zone ?? "UTC";
    return html`<section class="sec sec-parked parked">
      <span class="mark" aria-hidden="true">${icon("pause-circle-outline")}</span>
      ${this._heading(t("today.set_aside_for_later"), parts.length, "pause-circle-outline")}
      ${parts.map(
        (c) => html`<div class="part">
          <div class="part-name">${c.name}</div>
          <div class="muted small">
            ${t("common.steps_count", { count: c.steps.length })} ·
            ${c.next_due ? t("today.comes_back", { when: describeWhen(c.next_due, this.nowMs, tz) }) : t("today.waiting_until_you_start_it")}
          </div>
          ${this._park?.choreId === c.id
            ? this._renderParkAsk()
            : html`<div class="part-actions">
                <button class="primary" ?disabled=${this._busy} @click=${() => this._partAction(() => startChore(this.hass!, c.id))}>
                  ${t("common.start_now")}
                </button>
                <button class="mild" ?disabled=${this._busy} @click=${() => this._openPark({ choreId: c.id })}>${t("today.change_time")}</button>
                ${!accessOf(this.snapshot).all
                  ? nothing // taking a chore away is level 3, like changing it
                  : this._removing === c.id
                  ? html`<span class="small">${t("today.remove_it")}</span>
                      <button
                        ?disabled=${this._busy}
                        @click=${() => this._partAction(async () => { await deleteChore(this.hass!, c.id); this._removing = ""; })}
                      >
                        ${t("today.yes_remove")}
                      </button>
                      <button class="link" @click=${() => (this._removing = "")}>${t("today.keep")}</button>`
                  : html`<button class="link" @click=${() => (this._removing = c.id)}>${t("common.delete")}</button>`}
              </div>`}
        </div>`
      )}
    </section>`;
  }

  /**
   * What was finished today (since midnight, the same day the pet's meals and the lists count by): one timeline of the
   * household's own steps and the ones that finished by themselves (marked with a robot), newest first. The step that
   * finished a chore gets a flag. It is the only place that shows what is already done, so nothing happens silently.
   */
  private _renderDone() {
    const snapshot = this.snapshot;
    if (!snapshot) return nothing;
    const tz = snapshot.time_zone;
    const today = snapshot.history.filter((h) => isToday(h.ts, this.nowMs, tz));
    const finishedRuns = new Set(today.filter((h) => h.kind === "chore_done").map((h) => h.run_id));
    const steps = today.filter((h) => h.kind === "step_done").reverse(); // the history is oldest first
    if (steps.length === 0) return nothing;
    const shown = steps.slice(0, DONE_SHOWN);
    const more = steps.length - shown.length;
    // The snapshot only carries the latest 200 history entries: if even the oldest one is from today, older steps of
    // today may be cut off, so the counts are shown as "at least" (the newest rows are always right).
    const cut = snapshot.history.length >= HISTORY_IN_SNAPSHOT && isToday(snapshot.history[0].ts, this.nowMs, tz);
    const flagged = new Set<string>(); // the newest step of a finished chore is the one that finished it
    return html`
      <section class="sec sec-done soft">
        <span class="mark" aria-hidden="true">${icon("check-all")}</span>
        ${this._heading(t("today.done_today"), cut ? `${steps.length}+` : steps.length, "check-all")}
        ${shown.map((h) => {
          const auto = h.by === "auto";
          const finished = finishedRuns.has(h.run_id) && !flagged.has(h.run_id);
          if (finished) flagged.add(h.run_id);
          return html`<div class="row">
            <span class="rowmain">
              <span class="donei ${auto ? "auto" : ""}" title=${auto ? t("today.done_by_itself") : t("common.done")}>${icon(auto ? "home-automation" : "check")}</span>
              <span class=${finished ? "fin" : ""}>${h.chore_name}: ${h.step_title}</span>
            </span>
            <span class="hint">${auto && h.reason ? `${h.reason}, ` : ""}${fmtTime(h.ts, tz)}${finished ? html` <span class="fin-flag" aria-hidden="true">${icon("flag-checkered")}</span>` : nothing}</span>
          </div>`;
        })}
        ${more > 0 ? html`<div class="muted small more">${t("today.and_n_more", { count: cut ? `${more}+` : more })}</div>` : nothing}
      </section>
    `;
  }

  render() {
    if (!this.snapshot) return html`<p class="muted">${t("common.loading")}</p>`;
    const tz = this.snapshot.time_zone;
    const model = buildToday(this.snapshot, this.nowMs);
    const hasChores = this.snapshot.chores.length > 0;

    const setup = this.snapshot.setup?.status;
    return html`
      ${this._renderAway(tz)}
      ${accessOf(this.snapshot).all
        ? nothing
        : html`<section class="card"><boopli-away .hass=${this.hass} .snapshot=${this.snapshot} .nowMs=${this.nowMs}></boopli-away></section>`}
      <div class="cols"><div class="col">
      ${(setup === "skipped" || setup === "in_progress") && accessOf(this.snapshot).all
        ? html`<section class="card banner">
            <span class="mark" aria-hidden="true">${icon("rocket-launch-outline")}</span>
            <span class="seal" aria-hidden="true">${icon("rocket-launch")}</span>
            <span class="bannertext">${t("today.boopli_is_not_fully_set_up")}</span>
            <button
              class="primary"
              @click=${() =>
                this.dispatchEvent(
                  new CustomEvent("open-wizard", { bubbles: true, composed: true })
                )}
            >
              ${t("today.finish_setting_up")}
            </button>
          </section>`
        : nothing}
      ${this._renderQuestions()}
      ${model.now
        ? html`
            <section class=${model.now.step.on_it_until ? "card now working" : "card now"}>
              <span class="mark" aria-hidden="true">${icon("clipboard-check-outline")}</span>
              <div class="now-head">
                <span class="seal" aria-hidden="true">${icon("clipboard-check-outline")}</span>
                <div class="muted small">
                  ${model.now.run.chore_name}
                  ${model.now.step.group ? html`<span class="tag">${model.now.step.group}</span>` : nothing}
                </div>
              </div>
              <h2>${model.now.step.title}</h2>
              ${model.now.total > 1 ? this._renderTrail(model.now) : nothing}
              ${(() => {
                const part = partInfo(model.now!.run, model.now!.step);
                return part && part.total > 1
                  ? html`<div class="muted small">${t("today.step_of_2", { group: model.now!.step.group ?? "", min: Math.min(part.done + 1, part.total), total: part.total })}</div>`
                  : nothing;
              })()}
              ${model.now.step.active_at
                ? html`<div class="muted small">
                    ${sinceLabel(model.now.step.active_at, tz)}
                  </div>`
                : nothing}
              ${model.now.step.snoozed_until &&
              Date.parse(model.now.step.snoozed_until) > this.nowMs
                ? html`<div class="muted small">
                    ${t("today.snoozed_until", { time: fmtTime(model.now.step.snoozed_until, tz) })}
                  </div>`
                : nothing}
              ${model.now.step.on_it_until
                ? html`<div class="in-progress">
                    ${icon("check-circle")} ${t("today.in_progress")}${model.now.step.on_it_since ? html` ${t("today.since", { time: fmtTime(model.now.step.on_it_since, tz) })}` : nothing}
                    <span class="muted small">${t("today.boopli_checks_in_at", { time: fmtTime(model.now.step.on_it_until, tz) })}</span>
                  </div>`
                : nothing}
              <div class="now-buttons">
                <button
                  class="press done"
                  ?disabled=${this._busy}
                  @click=${() =>
                    this._done(model.now!.run.id, model.now!.step.step_id)}
                >
                  ${icon("check-bold")} ${t("common.done")}
                </button>
                ${model.now.step.on_it_until
                  ? html`<button
                      class="link"
                      ?disabled=${this._busy}
                      @click=${() => this._working(model.now!.run.id, model.now!.step.step_id, false)}
                    >
                      ${t("today.not_on_it")}
                    </button>`
                  : html`<button
                      class="on-it"
                      ?disabled=${this._busy}
                      @click=${() => this._working(model.now!.run.id, model.now!.step.step_id, true)}
                    >
                      ${t("today.on_it")}
                    </button>`}
                <button
                  class="link"
                  ?disabled=${this._busy}
                  @click=${() => this._snooze(model.now!.run.id, model.now!.step.step_id)}
                >
                  ${t("today.snooze_for", { minutes: this.snapshot.settings.snooze_minutes })}
                </button>
              </div>
              ${(() => {
                const part = partInfo(model.now!.run, model.now!.step);
                if (!part?.canPark) return nothing;
                if (this._park && this._park.runId === model.now!.run.id) return this._renderParkAsk();
                return html`<button
                  class="link later-btn"
                  ?disabled=${this._busy}
                  @click=${() => this._openPark({ runId: model.now!.run.id, group: model.now!.step.group })}
                >
                  ${t("today.do_this_part_later", { group: model.now!.step.group ?? "" })}
                </button>`;
              })()}
              ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
            </section>
          `
        : html`
            <section class="card empty">
              <h2>${t("today.nothing_needs_you_right_now")}</h2>
              <p class="muted">
                ${hasChores
                  ? t("today.enjoy_the_quiet_what_is_coming")
                  : accessOf(this.snapshot).all ? t("today.add_your_first_chore_in_the") : t("chores.no_chores_yet_ask_an_admin")}
              </p>
              ${this._error ? html`<div class="error">${this._error}</div>` : nothing}
            </section>
          `}
      ${this._renderQuick()}
      ${this._renderParked()}
      </div><div class="col">
      ${this._renderPet()}
      ${this._renderReady(model)}
      ${this._renderStill(model, tz)}
      ${this._renderUpcoming(model)}
      ${this._renderDone()}
      </div></div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        --pane: var(--card-background-color, #1c1c1c);
        --gap: 14px; /* the space between two cards, in both columns */
      }
      .small {
        font-size: 17px;
      }
      .card.quick {
        --hue: #8793a6; /* a quiet slate: it must not compete with the step card above it */
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid color-mix(in srgb, var(--hue) 45%, transparent);
        background: linear-gradient(155deg, color-mix(in srgb, var(--hue) 20%, var(--pane)), var(--pane) 62%);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
      }
      .quick h3 {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 19px;
        font-weight: 600;
        margin-bottom: 10px;
      }
      .quick h3 .seal {
        width: 34px;
        height: 34px;
        border-radius: 11px;
      }
      .quick h3 .seal ha-icon {
        --mdc-icon-size: 20px;
      }
      .quick textarea {
        font: inherit;
        width: 100%;
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 10px;
        padding: 10px 12px;
        resize: vertical;
      }
      /* The main button of this card takes the card's own colour, not the loud pet green. */
      .card.quick button.primary {
        background: linear-gradient(180deg, color-mix(in srgb, var(--hue) 62%, #fff 10%), color-mix(in srgb, var(--hue) 62%, #000));
        border-color: color-mix(in srgb, var(--hue) 55%, transparent);
        color: #fff;
      }
      .card.quick button.primary,
      .card.quick .quick-actions button {
        border-radius: 12px;
      }
      /* The second button of the quick card: dark and tinted with the card's colour, like "Change time" in the parked card. */
      .card.quick .quick-actions button:not(.primary),
      .card.quick .quick-actions button:not(.primary):hover:not(:disabled) {
        background: linear-gradient(180deg, color-mix(in srgb, var(--hue) 17%, var(--pane)), color-mix(in srgb, var(--hue) 8%, var(--pane)));
        border: 1px solid color-mix(in srgb, var(--hue) 28%, transparent);
        color: color-mix(in srgb, var(--hue) 45%, var(--primary-text-color));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2);
      }
      .card.quick .quick-actions button:not(.primary):hover:not(:disabled) {
        filter: brightness(1.12);
      }
      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .tag {
        margin-left: 6px;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 15px;
        background: var(--secondary-background-color);
        color: var(--boopli-accent, var(--primary-color));
      }
      /* No boxes on this screen: type, space and thin lines do the grouping. */
      .card {
        background: none;
        border: 0;
        border-radius: 0;
        padding: 0;
      }
      .trail {
        margin: 22px 0 6px;
      }
      .track {
        position: relative;
        height: 20px;
        border-radius: 10px;
        background: var(--secondary-background-color);
        margin: 26px 0 12px;
      }
      .trail-fill {
        height: 100%;
        border-radius: 10px;
        background: var(--boopli-accent, var(--primary-color));
        transition: width 0.5s ease;
      }
      .rider {
        position: absolute;
        top: -30px;
        width: 60px;
        height: 60px;
        transform: translateX(-50%);
        transition: left 0.5s ease;
        pointer-events: none;
      }
      .flag {
        position: absolute;
        right: 6px;
        top: -1px;
        font-size: 20px;
        line-height: 20px;
        color: var(--secondary-text-color);
      }
      .trail-steps {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 4px 18px;
        font-size: 17px;
        color: var(--secondary-text-color);
      }
      .trail-steps li.ok {
        color: var(--boopli-accent, var(--primary-color));
      }
      .trail-steps li.here {
        color: var(--primary-text-color);
        font-weight: 500;
      }
      /* The setup reminder: a calm sky-blue card with the same look as the others. */
      .card.banner {
        position: relative;
        overflow: hidden;
        --hue: #58a6e8;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px 14px;
        flex-wrap: wrap;
        margin-bottom: var(--gap);
        padding: 14px 16px;
        border-radius: 18px;
        border: 1px solid color-mix(in srgb, var(--hue) 45%, transparent);
        background: linear-gradient(155deg, color-mix(in srgb, var(--hue) 20%, var(--pane)), var(--pane) 62%);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
      }
      .card.banner > *:not(.mark) {
        position: relative;
      }
      .card.banner .seal {
        width: 38px;
        height: 38px;
        border-radius: 12px;
      }
      .bannertext {
        flex: 1 1 200px;
        font-size: 18px;
        font-weight: 600;
      }
      .card.banner button.primary {
        min-height: 40px;
        border-radius: 12px;
        background: linear-gradient(180deg, color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 100%, #fff 12%), color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 74%, #000));
        border: 1px solid color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 55%, transparent);
        color: var(--boopli-accent-ink, #fff);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 3px 10px rgba(0, 0, 0, 0.3);
      }
      .away-banner {
        position: relative;
        overflow: hidden;
        --hue: #f2a03d;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 16px;
        margin-bottom: var(--gap);
        padding: 16px 18px;
        border-radius: 20px;
        border: 1px solid color-mix(in srgb, var(--hue) 55%, transparent);
        background: linear-gradient(155deg, color-mix(in srgb, var(--hue) 30%, var(--pane)), var(--pane) 65%);
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.28);
        color: var(--primary-text-color);
      }
      .away-banner.planned {
        border-style: dashed;
        background: linear-gradient(155deg, color-mix(in srgb, var(--hue) 16%, var(--pane)), var(--pane) 65%);
        box-shadow: none;
      }
      .away-banner > * {
        position: relative;
      }
      .away-banner .mark {
        position: absolute;
        right: -14px;
        top: -14px;
        opacity: 0.1;
        color: var(--hue);
      }
      .away-icon {
        flex: none;
        width: 52px;
        height: 52px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        color: #fff;
        background: linear-gradient(145deg, color-mix(in srgb, var(--hue) 100%, #fff 25%), color-mix(in srgb, var(--hue) 100%, #000 25%));
        box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.3), 0 3px 8px rgba(0, 0, 0, 0.35);
      }
      .away-icon ha-icon {
        --mdc-icon-size: 30px;
        display: flex;
      }
      .away-text {
        flex: 1 1 220px;
        min-width: 0;
      }
      .away-title {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: color-mix(in srgb, var(--hue) 70%, var(--primary-text-color));
      }
      .away-when {
        font-size: 19px;
        font-weight: 500;
        margin-top: 2px;
      }
      .away-note {
        margin-top: 4px;
        font-size: 17px;
        color: var(--secondary-text-color);
      }
      .away-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        align-items: center;
      }
      .away-banner button.primary {
        min-height: 44px;
        padding: 0 20px;
        font-size: 18px;
        border-radius: 12px;
        background: linear-gradient(180deg, color-mix(in srgb, var(--hue) 100%, #fff 12%), color-mix(in srgb, var(--hue) 72%, #000));
        border: 1px solid color-mix(in srgb, var(--hue) 55%, transparent);
        color: #fff;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 3px 10px rgba(0, 0, 0, 0.3);
      }
      .pet-card {
        margin-bottom: var(--gap);
        padding: 0;
      }
      .pet-info {
        margin-top: var(--gap);
        padding: 14px 16px;
        min-width: 0;
        --hue: var(--boopli-accent, var(--primary-color, #4a90e2));
        border-radius: 18px;
        border: 1px solid color-mix(in srgb, var(--hue) 40%, transparent);
        background: linear-gradient(155deg, color-mix(in srgb, var(--hue) 20%, var(--pane)), var(--pane) 65%);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
      }
      .pet-name {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 20px;
        font-weight: 600;
      }
      .lvl {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 12px 2px 8px;
        border-radius: 999px;
        font-size: 16px;
        font-weight: 700;
        color: #3b2a05;
        background: linear-gradient(140deg, #fff6c2 0%, #f6cf55 22%, #b2801a 50%, #f9e286 72%, #c89322 100%);
        box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.45), 0 2px 6px rgba(0, 0, 0, 0.35);
      }
      .lvl ha-icon {
        --mdc-icon-size: 16px;
        display: flex;
      }
      .bar {
        height: 18px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.35);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        margin: 10px 0 6px;
      }
      .fill {
        height: 100%;
        background: var(--boopli-accent, var(--primary-color));
        border-radius: 999px;
        transition: width 0.4s ease;
      }
      .meals {
        margin-top: 2px;
      }
      /* The one-time pop-up at the end of the starter quest: calm, one button. */
      .quest {
        max-width: min(420px, 92vw);
        padding: 22px;
        border-radius: 16px;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #fff);
        border: 1px solid var(--divider-color, #444);
      }
      .quest::backdrop {
        background: rgba(0, 0, 0, 0.55);
      }
      .quest h3 {
        margin: 0 0 8px;
        font-size: 22px;
      }
      .quest p {
        margin: 0 0 16px;
        line-height: 1.4;
      }
      .toast {
        position: fixed;
        left: 50%;
        bottom: 28px;
        transform: translateX(-50%);
        background: var(--boopli-accent, var(--primary-color));
        color: var(--boopli-accent-ink, var(--text-primary-color, #fff));
        padding: 10px 18px;
        border-radius: 999px;
        font-weight: 500;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        z-index: 10;
        max-width: 90vw;
        text-align: center;
      }
      .cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(360px, 100%), 1fr));
        gap: 24px;
        align-items: start;
      }
      .col {
        min-width: 0;
      }
      /* The big step: a card in the pet's colour, with a seal and a faint symbol behind it. */
      .now,
      .empty {
        position: relative;
        overflow: hidden;
        --hue: var(--boopli-accent, var(--primary-color, #4a90e2));
        padding: 18px 20px;
        border-radius: 22px;
        border: 1px solid color-mix(in srgb, var(--hue) 55%, transparent);
        background: linear-gradient(155deg, color-mix(in srgb, var(--hue) 24%, var(--pane)), var(--pane) 65%);
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.28);
      }
      /* The faint symbol in the corner behind the content: the same on every card, in the card's own colour. */
      .now,
      .card.quick,
      .pet-info,
      .sec,
      .card.banner {
        position: relative;
        overflow: hidden;
      }
      .mark {
        position: absolute;
        right: -14px;
        top: -14px;
        color: var(--hue);
        opacity: 0.1;
        pointer-events: none;
      }
      .mark ha-icon {
        --mdc-icon-size: 104px;
        display: flex;
      }
      .now .mark {
        right: -18px;
        top: -18px;
      }
      .now .mark ha-icon {
        --mdc-icon-size: 150px;
      }
      .now > *:not(.mark),
      .card.quick > *:not(.mark),
      .pet-info > *:not(.mark),
      .sec > *:not(.mark) {
        position: relative;
      }
      .now-head {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .seal {
        flex: none;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        display: grid;
        place-items: center;
        color: #fff;
        background: linear-gradient(145deg, color-mix(in srgb, var(--hue) 100%, #fff 25%), color-mix(in srgb, var(--hue) 100%, #000 25%));
        box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.3), 0 3px 8px rgba(0, 0, 0, 0.35);
      }
      .seal ha-icon {
        --mdc-icon-size: 24px;
        display: flex;
      }
      .now .track {
        height: 22px;
        background: rgba(0, 0, 0, 0.35);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
      }
      .now .trail-fill,
      .fill {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0) 55%), var(--boopli-accent, var(--primary-color));
        box-shadow: inset 0 -3px 4px rgba(0, 0, 0, 0.2);
      }
      /* The Done button: the pet's colour, in the same soft, curved look as the other buttons (no thick edge underneath). */
      .now .press.done {
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 100%, #fff 12%),
          color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 74%, #000)
        );
        border: 1px solid color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 55%, transparent);
        border-radius: 14px;
        padding: 10px 48px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 3px 10px rgba(0, 0, 0, 0.3);
      }
      .now .press.done:hover:not(:disabled) {
        filter: brightness(1.08);
      }
      .now .press.done:active:not(:disabled) {
        transform: translateY(1px);
        border-bottom-width: 1px;
      }
      /* The cards in a column stand apart from each other, and from the list under them. */
      .now,
      .empty,
      .quick {
        margin-bottom: var(--gap);
      }
      /* The questions of a chore that started with all its steps: a coral card, so it is noticed without shouting. */
      .card.ask {
        --hue: #ee8a6b;
      }
      .ask h2 {
        font-size: 28px;
        margin: 6px 0 4px;
      }
      .now h2 {
        font-size: 34px;
        line-height: 1.15;
        margin: 8px 0;
      }
      .done {
        min-width: 200px;
      }
      .now-buttons {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
      }
      .on-it {
        min-height: 56px;
        padding: 0 22px;
        font-size: 20px;
        border-radius: 14px;
        cursor: pointer;
      }
      /* "On it": the same soft look as Done, but dark and tinted with the card's colour, so Done keeps the focus. */
      .now .on-it,
      .now .on-it:hover:not(:disabled) {
        background: linear-gradient(180deg, color-mix(in srgb, var(--hue) 17%, var(--pane)), color-mix(in srgb, var(--hue) 8%, var(--pane)));
        border: 1px solid color-mix(in srgb, var(--hue) 30%, transparent);
        color: color-mix(in srgb, var(--hue) 55%, var(--primary-text-color));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2);
      }
      .now .on-it:hover:not(:disabled) {
        filter: brightness(1.12);
      }
      /* A step you said "On it" to: green, so it is clear it was noticed. */
      .now.working {
        --hue: var(--success-color, #2e7d32);
        border: 2px solid var(--success-color, #2e7d32);
      }
      .in-progress {
        margin-top: 8px;
        font-weight: 600;
        color: var(--success-color, #2e7d32);
      }
      /* The lists next to the big step: a clear heading, a visible line, calm rows. */
      .sec {
        margin-bottom: var(--gap);
        padding: 12px 16px 10px;
        --hue: #4f9cf0;
        --line: color-mix(in srgb, var(--primary-text-color) 14%, transparent);
        border-radius: 18px;
        border: 1px solid color-mix(in srgb, var(--hue) 45%, transparent);
        background: linear-gradient(155deg, color-mix(in srgb, var(--hue) 20%, var(--pane)), var(--pane) 62%);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
      }
      .sec-ready {
        --hue: #46c46f;
      }
      .sec-still {
        --hue: #4f9cf0;
      }
      .sec-upcoming {
        --hue: #2fc4a4;
      }
      .sec-parked {
        --hue: #f2a03d;
      }
      .sec-done {
        --hue: #7f93b3;
      }
      .sec-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 19px;
        font-weight: 600;
        color: var(--primary-text-color);
        margin: 0 0 8px;
      }
      .sec-title .seal {
        width: 34px;
        height: 34px;
        border-radius: 11px;
      }
      .sec-title .seal ha-icon {
        --mdc-icon-size: 20px;
      }
      .count {
        margin-left: auto;
        min-width: 26px;
        padding: 1px 9px;
        border-radius: 999px;
        text-align: center;
        font-size: 16px;
        font-weight: 700;
        color: var(--primary-text-color);
        background: rgba(0, 0, 0, 0.3);
      }
      .soft .group,
      .soft .more {
        opacity: 0.88;
      }
      .strong {
        font-weight: 500;
      }
      .more {
        padding: 8px 0;
      }
      .part {
        padding: 10px 0;
        border-top: 1px solid var(--line);
      }
      .part:first-of-type {
        border-top: 0;
      }
      .part-name {
        font-size: 18px;
      }
      /* "Start now" of a set-aside part: the pet's colour in the soft look of the Done button. */
      .sec-parked .part-actions button.primary {
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 100%, #fff 12%),
          color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 74%, #000)
        );
        border: 1px solid color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 55%, transparent);
        border-radius: 12px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 3px 10px rgba(0, 0, 0, 0.3);
      }
      /* "Change time": the same soft look, but in a muted tone of the card's orange, so "Start now" keeps the focus. */
      .sec-parked .part-actions button.mild,
      .sec-parked .part-actions button.mild:hover:not(:disabled) {
        background: linear-gradient(180deg, color-mix(in srgb, var(--hue) 17%, var(--pane)), color-mix(in srgb, var(--hue) 8%, var(--pane)));
        border: 1px solid color-mix(in srgb, var(--hue) 26%, transparent);
        border-radius: 12px;
        color: color-mix(in srgb, var(--hue) 32%, var(--primary-text-color));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2);
      }
      .sec-parked .part-actions button.mild:hover:not(:disabled) {
        filter: brightness(1.12);
      }
      .part-actions,
      .park-buttons,
      .park-pick {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      /* "When should it come back?": a darker panel inside its card, with the card's colour (--hue) in its buttons. */
      .park-ask {
        margin-top: 14px;
        padding: 12px 14px;
        border: 1px solid color-mix(in srgb, var(--hue, #8793a6) 30%, transparent);
        border-radius: 14px;
        background: color-mix(in srgb, var(--hue, #8793a6) 8%, rgba(0, 0, 0, 0.28));
      }
      .park-ask button:not(.link):not(.primary),
      .park-ask button:not(.link):not(.primary):hover:not(:disabled) {
        min-height: 40px;
        border-radius: 12px;
        background: linear-gradient(180deg, color-mix(in srgb, var(--hue, #8793a6) 17%, var(--pane)), color-mix(in srgb, var(--hue, #8793a6) 8%, var(--pane)));
        border: 1px solid color-mix(in srgb, var(--hue, #8793a6) 28%, transparent);
        color: color-mix(in srgb, var(--hue, #8793a6) 40%, var(--primary-text-color));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.2);
      }
      .park-ask button:not(.link):not(.primary):hover:not(:disabled) {
        filter: brightness(1.12);
      }
      .park-ask button.primary {
        min-height: 40px;
        border-radius: 12px;
        background: linear-gradient(180deg, color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 100%, #fff 12%), color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 74%, #000));
        border: 1px solid color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 55%, transparent);
        color: var(--boopli-accent-ink, #fff);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 3px 10px rgba(0, 0, 0, 0.3);
      }
      .park-ask input {
        font: inherit;
        color: var(--primary-text-color);
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid color-mix(in srgb, var(--hue, #8793a6) 30%, transparent);
        border-radius: 10px;
        padding: 8px 10px;
        color-scheme: dark;
      }
      .later-btn,
      .link {
        border: 0;
        background: none;
        color: var(--secondary-text-color);
        text-decoration: underline;
        min-height: 0;
        padding: 8px 4px;
        font-size: 17px;
      }
      .later-btn {
        display: block;
        margin-top: 10px;
      }
      .sec-done .row {
        padding-left: 0;
      }
      .sec-done .hint {
        white-space: normal;
        text-align: right;
      }
      .group {
        padding: 6px 0;
        border-top: 1px solid var(--line);
      }
      .group:first-of-type {
        border-top: 0;
      }
      .group-name {
        font-size: 17px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center; /* the middle of the symbol, the title and the time on one line */
        gap: 12px;
        font-size: 17px;
        padding: 2px 0 2px 12px;
      }
      .group > .row:only-child {
        padding-left: 0;
      }
      .rowmain {
        display: flex;
        align-items: center;
        gap: 2px; /* the chevrons sit right next to the title */
        min-width: 0;
      }
      /* "Start now" on a waiting step: just two chevrons in the pet's colour (the words are the tooltip). */
      .row .go {
        flex: none;
        width: 22px;
        height: 28px;
        min-height: 0;
        padding: 0;
        border: 0;
        border-radius: 8px;
        display: grid;
        place-items: center;
        background: none;
        color: var(--boopli-accent, var(--primary-color));
        /* The letters of this font sit about 2 px below the middle of their line box (room for tall letters above),
           the symmetric chevrons do not: lower them so both share one visual middle. */
        position: relative;
        top: 2px;
      }
      /* The done timeline: a tick for the household's own steps, a robot for the ones that finished by themselves. */
      .donei {
        flex: none;
        width: 22px;
        display: grid;
        place-items: center;
        color: var(--success-color, #46c46f);
      }
      .donei.auto {
        color: var(--hue);
      }
      .donei ha-icon {
        --mdc-icon-size: 18px;
        display: flex;
      }
      .sec-done .fin {
        font-weight: 600;
      }
      .sec-done .fin-flag {
        color: var(--boopli-accent, var(--primary-color));
      }
      .sec-done .fin-flag ha-icon {
        --mdc-icon-size: 16px;
        display: inline-flex;
        vertical-align: -0.2em;
      }
      .go-space {
        flex: none;
        width: 22px;
      }
      .row .go ha-icon {
        --mdc-icon-size: 26px;
        display: flex;
      }
      .row .go:hover:not(:disabled) {
        background: color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 22%, transparent);
      }
      .row .go:active:not(:disabled) {
        transform: translateX(1px);
      }
      .hint {
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      /* One column (a phone): the pet's room comes first, then your step. Last in the sheet, so it wins. */
      @media (max-width: 760px) {
        .cols {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 0;
        }
        .col {
          display: contents;
        }
        .stage-slot {
          order: -1;
        }
      }
    `,
  ];
}

customElements.define("boopli-today", BoopliToday);
