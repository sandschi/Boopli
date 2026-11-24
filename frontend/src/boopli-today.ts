import { LitElement, html, css, nothing } from "lit";
import { answerQuestions, awayEnd, completeStep, deleteChore, errorMessage, notOnIt, onIt, partPark, partTime, startChore, type ParkWhen } from "./api";
import "./boopli-questions";
import { agentOn, anyAi } from "./claude";
import { awayWhen } from "./boopli-away";
import { buildToday } from "./today";
import { describeWhen, fmtTime, sinceLabel } from "./time";
import { sharedStyles } from "./styles";
import "./boopli-stage";
import "./boopli-pet";
import { icon } from "./icon";
import type { PetKind } from "./pets";
import type { Moment } from "./boopli-pet";
import "./boopli-egg";
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
    _moment: { state: true },
    _momentSeq: { state: true },
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
  declare _moment: Moment; // what the pet plays once: level up, waking up, a step done
  declare _momentSeq: number; // counts them, so the same moment can play again
  declare _momentText: string;
  private _lastRunIds: string[] = [];
  private _lastPet?: Pet;
  private _toastTimer?: number;

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
    this._moment = "";
    this._momentSeq = 0;
    this._momentText = "";
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearTimeout(this._toastTimer);
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    if (!changed.has("snapshot") || !this.snapshot?.pet) return;
    const pet = this.snapshot.pet;
    const before = this._lastPet;
    this._lastPet = pet;
    // A task that was running and is now finished: celebrate it by name.
    const runIds = this.snapshot.runs.map((r) => r.id);
    const finished = this._lastRunIds
      .filter((id) => !runIds.includes(id))
      .map((id) => this.snapshot!.history.find((h) => h.kind === "chore_done" && h.run_id === id)?.chore_name)
      .filter((name): name is string => !!name);
    this._lastRunIds = runIds;
    if (!before || pet.total_xp <= before.total_xp) return; // the first look shows nothing
    // The pet celebrates: a level up first, then waking up, otherwise a small hop for the step.
    this._moment = "done";
    this._momentText = `+${pet.total_xp - before.total_xp} XP`;
    if (before.mood === "sleepy" || before.mood === "hibernating") {
      this._moment = "wake";
      this._momentText = "";
    }
    if (pet.level > before.level) {
      this._moment = "levelup";
      this._momentText = t("today.level_2", { level: pet.level });
    }
    this._momentSeq += 1;
    const parts = [`+${pet.total_xp - before.total_xp} XP`];
    if (finished.length) parts.unshift(t("today.is_done", { value: finished[0] }));
    if (pet.level > before.level) parts.push(t("today.level_2", { level: pet.level }));
    if (before.mood === "sad" || before.mood === "hibernating")
      parts.push(t("today.is_awake_welcome_back", { name: pet.name }));
    this._toast = parts.join("  ·  ");
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
    const aiOn = anyAi(this.snapshot); // the agent, or Ask Claude
    return html`
      <section class="card quick">
        <h3>${t("today.what_do_you_want_to_get")}</h3>
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
    return html`
      <section class="card pet-card stage-slot">
        <boopli-stage
          .kind=${this.snapshot?.settings?.pet_kind ?? "slime"}
          .mood=${pet.mood}
          .level=${pet.level}
          .away=${pet.away ?? false}
          .activity=${working && !pet.away ? "housework" : ""}
          .moment=${this._moment}
          .momentSeq=${this._momentSeq}
          .momentText=${this._momentText}
          @egg-found=${() => (this._egg = true)}
        ></boopli-stage>
        ${this._egg ? html`<boopli-egg @egg-done=${() => (this._egg = false)}></boopli-egg>` : nothing}
        <div class="pet-info">
          <div class="pet-name">${pet.name} <span class="muted">${t("today.level", { level: pet.level })}</span></div>
          <div class="bar" role="progressbar" aria-valuenow=${pct} aria-valuemin="0" aria-valuemax="100">
            <div class="fill" style="width:${pct}%"></div>
          </div>
          <div class="muted small">${t("today.xp_to_the_next_level", { xp: pet.xp_in_level, xp_needed: pet.xp_for_level })}</div>
          <div class="small">${moodLine(pet)}</div>
        </div>
      </section>
      ${this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : nothing}
    `;
  }

  /**
   * How far along this chore is: a fat bar with your pet riding the end of the fill towards the flag,
   * and the names of the steps underneath (done ones ticked) when there are few enough to read.
   */
  private _renderTrail(now: NonNullable<ReturnType<typeof buildToday>["now"]>) {
    const pct = (now.done / now.total) * 100;
    const place = Math.min(94, Math.max(6, pct)); // the pet stays inside the bar
    const names = now.total <= 6;
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
        <button class="link" @click=${() => this.dispatchEvent(new CustomEvent("goto-settings", { bubbles: true, composed: true }))}>
          ${t("today.change_in_settings")}
        </button>
      </div>
    </section>`;
  }

  /** Chores that started by themselves with all steps and still wait for the answers to their questions. */
  private _renderQuestions() {
    const open = (this.snapshot?.runs ?? []).filter((r) => r.questions_open && (r.questions ?? []).length > 0);
    return open.map(
      (run) => html`<section class="card ask">
        <div class="muted small">${run.chore_name}</div>
        <h2>${t("today.quick_look_first")}</h2>
        <p class="muted small">
          ${t("today.it_started_with_all_its_steps")}
        </p>
        <boopli-questions
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
  private _heading(title: string, count: number) {
    return html`<h3 class="sec-title">${title}<span class="count">${count}</span></h3>`;
  }

  /** 1. Other steps that are your turn right now. */
  private _renderReady(model: ReturnType<typeof buildToday>) {
    const count = model.ready.reduce((n, g) => n + g.steps.length, 0);
    if (count === 0) return nothing;
    return html`<section class="sec">
      ${this._heading(t("today.ready_now"), count)}
      ${model.ready.map(
        (g) => html`<div class="group">
          <div class="group-name strong">${g.run.chore_name}</div>
          ${g.steps.map((s) => html`<div class="row"><span>${s.title}</span></div>`)}
        </div>`
      )}
    </section>`;
  }

  /** 2. The rest of what is going on today. */
  private _renderStill(model: ReturnType<typeof buildToday>, tz: string) {
    const count = model.groups.reduce((n, g) => n + g.steps.length, 0) + model.dueToday.length;
    if (count === 0) return nothing;
    return html`<section class="sec soft">
      ${this._heading(t("today.still_to_do_today"), count)}
      ${model.groups.map(
        (g) => html`<div class="group">
          <div class="group-name">${g.run.chore_name}</div>
          ${g.steps.map(
            (s) => html`<div class="row">
              <span>${s.title}</span>
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
    return html`<section class="sec soft">
      ${this._heading(t("today.upcoming"), model.upcoming.length)}
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
    return html`<section class="sec parked">
      ${this._heading(t("today.set_aside_for_later"), parts.length)}
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
                <button ?disabled=${this._busy} @click=${() => this._openPark({ choreId: c.id })}>${t("today.change_time")}</button>
                ${this._removing === c.id
                  ? html`<span class="small">${t("today.remove_it")}</span>
                      <button
                        ?disabled=${this._busy}
                        @click=${() => this._partAction(async () => { await deleteChore(this.hass!, c.id); this._removing = ""; })}
                      >
                        ${t("today.yes_remove")}
                      </button>
                      <button class="link" @click=${() => (this._removing = "")}>${t("today.keep")}</button>`
                  : html`<button class="link" @click=${() => (this._removing = c.id)}>${t("common.remove")}</button>`}
              </div>`}
        </div>`
      )}
    </section>`;
  }

  /** Steps that finished by themselves in the last day, so nothing happens silently. */
  private _renderAuto() {
    const snapshot = this.snapshot;
    if (!snapshot) return nothing;
    const since = this.nowMs - 24 * 3600 * 1000;
    const items = snapshot.history
      .filter((h) => h.kind === "step_done" && h.by === "auto" && Date.parse(h.ts) >= since)
      .slice(-3)
      .reverse();
    if (items.length === 0) return nothing;
    return html`
      <section class="sec auto soft">
        ${this._heading(t("today.done_by_itself"), items.length)}
        ${items.map(
          (h) => html`<div class="row">
            <span>${icon("check")} ${h.chore_name}: ${h.step_title}</span>
            <span class="hint">${h.reason ? `${h.reason}, ` : ""}${fmtTime(h.ts, snapshot.time_zone)}</span>
          </div>`
        )}
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
      <div class="cols"><div class="col">
      ${setup === "skipped" || setup === "in_progress"
        ? html`<section class="card banner">
            <span>${t("today.boopli_is_not_fully_set_up")}</span>
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
              <div class="muted small">
                ${model.now.run.chore_name}
                ${model.now.step.group ? html`<span class="tag">${model.now.step.group}</span>` : nothing}
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
                  ${t("today.do_this_part_later")}
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
                  : t("today.add_your_first_chore_in_the")}
              </p>
            </section>
          `}
      ${this._renderQuick()}
      ${this._renderParked()}
      </div><div class="col">
      ${this._renderPet()}
      ${this._renderReady(model)}
      ${this._renderStill(model, tz)}
      ${this._renderUpcoming(model)}
      ${this._renderAuto()}
      </div></div>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .small {
        font-size: 17px;
      }
      .quick h3 {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 10px;
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
      .banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
        padding: 12px 16px;
      }
      .away-banner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 16px;
        margin-bottom: 16px;
        padding: 16px 18px;
        border-radius: 16px;
        background: var(--warning-color, #ffa600);
        color: #1a1200;
      }
      .away-banner.planned {
        background: transparent;
        color: var(--primary-text-color);
        border: 2px solid var(--warning-color, #ffa600);
      }
      .away-icon {
        font-size: 40px;
        line-height: 1;
      }
      .away-text {
        flex: 1 1 220px;
        min-width: 0;
      }
      .away-title {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      .away-when {
        font-size: 19px;
        font-weight: 500;
        margin-top: 2px;
      }
      .away-note {
        margin-top: 4px;
        font-size: 17px;
        opacity: 0.85;
      }
      .away-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        align-items: center;
      }
      .away-banner.on button.primary {
        background: #1a1200;
        color: #fff;
        border-color: #1a1200;
      }
      .away-banner.on button.link {
        color: #1a1200;
      }
      .pet-card {
        margin-bottom: 8px;
        padding: 0;
      }
      .pet-info {
        margin-top: 12px;
        padding: 0 4px 2px;
        min-width: 0;
      }
      .pet-name {
        font-size: 19px;
        font-weight: 500;
      }
      .bar {
        height: 16px;
        border-radius: 999px;
        background: var(--secondary-background-color);
        overflow: hidden;
        margin: 10px 0 6px;
      }
      .fill {
        height: 100%;
        background: var(--boopli-accent, var(--primary-color));
        border-radius: 999px;
        transition: width 0.4s ease;
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
      .now,
      .empty {
        padding: 4px 0 12px;
      }
      /* The cards in a column stand apart from each other, and from the list under them. */
      .now,
      .empty,
      .quick {
        margin-bottom: 16px;
      }
      .quick + .sec {
        margin-top: 24px;
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
        border: 2px solid color-mix(in srgb, var(--boopli-accent, var(--primary-color)) 55%, transparent);
        color: var(--boopli-accent, var(--primary-color));
        background: transparent;
        cursor: pointer;
      }
      /* A step you said "On it" to: green, so it is clear it was noticed. */
      .now.working {
        border: 2px solid var(--success-color, #2e7d32);
        background: color-mix(in srgb, var(--success-color, #2e7d32) 12%, var(--card-background-color, transparent));
      }
      .in-progress {
        margin-top: 8px;
        font-weight: 600;
        color: var(--success-color, #2e7d32);
      }
      /* The lists next to the big step: a clear heading, a visible line, calm rows. */
      .sec {
        margin-bottom: 14px;
        --line: color-mix(in srgb, var(--primary-text-color) 20%, transparent);
      }
      .sec-title {
        font-size: 18px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin: 0 0 6px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--line);
      }
      .count {
        margin-left: 8px;
        font-size: 17px;
        font-weight: 400;
        color: var(--secondary-text-color);
      }
      .soft .group,
      .soft .more {
        opacity: 0.7;
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
      .part-actions,
      .park-buttons,
      .park-pick {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      .park-ask {
        margin-top: 14px;
        padding: 12px 14px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
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
      .auto .row {
        padding-left: 0;
      }
      .auto .hint {
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
        gap: 12px;
        font-size: 17px;
        padding: 2px 0 2px 12px;
      }
      .group > .row:only-child {
        padding-left: 0;
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
