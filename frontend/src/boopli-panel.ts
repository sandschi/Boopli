import { LitElement, html, css, nothing } from "lit";
import { eggFound, saveChore, saveSetup, subscribe, taskAdd } from "./api";
import "./boopli-today";
import "./boopli-chores";
import "./boopli-settings";
import "./boopli-home";
import "./boopli-wizard";
import "./boopli-breakdown";
import "./boopli-wall";
import "./boopli-wall-edit";
import { pickBoard } from "./wall-tiles";
import { awayWhen } from "./boopli-away";
import type { BreakdownResult } from "./boopli-breakdown";
import type { WizardId } from "./boopli-wizard";
import { sharedStyles } from "./styles";
import type { ChoreDraft, Hass, Snapshot } from "./types";

type Tab = "today" | "chores" | "home" | "settings";

const TAB_LABELS: Record<Tab, string> = {
  today: "Today",
  chores: "Chores",
  home: "My home",
  settings: "Settings",
};

/** What the wizard should do, and where to start. */
interface WizardRequest {
  wizard: WizardId;
  startAt: string;
}

type Choice = "save" | "discard" | "stay";

/** What the Settings and Chores screens offer for unsaved changes. */
interface Editable extends HTMLElement {
  save?: () => Promise<boolean>;
  discard?: () => void;
}

/**
 * Boopli sidebar panel. Home Assistant creates this element and keeps
 * setting `hass` on it with live state, plus `narrow` on small screens.
 *
 * It subscribes once to the integration and re-renders on every update.
 * It also stands guard over unsaved changes: leaving a screen with edits that
 * were not saved always asks first.
 */
export class BoopliPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    _snapshot: { state: true },
    _tab: { state: true },
    _nowMs: { state: true },
    _connectionError: { state: true },
    _wizard: { state: true },
    _breakdown: { state: true },
    _breakdownError: { state: true },
    _choresRequest: { state: true },
    _dirty: { state: true },
    _confirm: { state: true },
    _wall: { state: true },
    _wallEdit: { state: true },
  };

  declare hass?: Hass;
  declare narrow: boolean;
  declare _snapshot?: Snapshot;
  declare _tab: Tab;
  declare _nowMs: number;
  declare _connectionError: string;
  declare _wizard: WizardRequest | null;
  declare _breakdown: { kind: "now" | "recurring"; task: string } | null;
  declare _breakdownError: string;
  declare _choresRequest: { id: number; draft: ChoreDraft; schedule: boolean } | null;
  private _requestId = 0;
  declare _dirty: { settings: boolean; chore: boolean; home: boolean };
  declare _confirm: ((choice: Choice) => void) | null;
  declare _wallEdit: boolean; // the wall view is in edit mode (the pencil)
  declare _wall: string | null; // the wall view is open: the name of the board (empty: the first one), or null

  private _unsub?: () => void;
  private _subscribing = false;
  private _timer?: number;
  private _autoChecked = false;

  constructor() {
    super();
    this.narrow = false;
    this._tab = "today";
    this._nowMs = Date.now();
    this._connectionError = "";
    this._wizard = null;
    this._breakdown = null;
    this._breakdownError = "";
    this._choresRequest = null;
    this._dirty = { settings: false, chore: false, home: false };
    this._confirm = null;
    this._wallEdit = false;
    const params = new URLSearchParams(location.search);
    this._wall = params.has("wall") ? (params.get("wall") ?? "") : null;
  }

  // --- unsaved changes ---------------------------------------------------------

  private get _hasUnsaved(): boolean {
    return this._dirty.settings || this._dirty.chore || this._dirty.home;
  }

  private _onDirty = (e: Event): void => {
    const { source, dirty } = (e as CustomEvent<{ source: "settings" | "chore" | "home"; dirty: boolean }>).detail;
    this._dirty = { ...this._dirty, [source]: dirty };
  };

  private _beforeUnload = (e: BeforeUnloadEvent): void => {
    if (this._hasUnsaved) {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  private _editable(): Editable | null {
    const tag =
      this._tab === "settings"
        ? "boopli-settings"
        : this._tab === "chores"
          ? "boopli-chores"
          : this._tab === "home"
            ? "boopli-home"
            : "";
    return tag ? (this.renderRoot.querySelector(tag) as Editable | null) : null;
  }

  /** Returns true when it is fine to leave: nothing unsaved, or it was saved or discarded. */
  private async _guard(): Promise<boolean> {
    if (!this._hasUnsaved) return true;
    const choice = await new Promise<Choice>((resolve) => {
      this._confirm = resolve;
    });
    this._confirm = null;
    if (choice === "stay") return false;
    const editor = this._editable();
    if (choice === "save") {
      const ok = (await editor?.save?.()) ?? false;
      if (!ok) return false;
    } else {
      editor?.discard?.();
    }
    this._dirty = { settings: false, chore: false, home: false };
    return true;
  }

  // --- tabs and the wizard ------------------------------------------------------

  private async _selectTab(tab: Tab): Promise<void> {
    if (tab === this._tab && !this._wizard) return;
    if (!(await this._guard())) return;
    this._wizard = null;
    this._breakdown = null;
    this._tab = tab;
  }

  /** Open a wizard. The first-run setup is also remembered as "in progress". */
  private _openWizard(request: WizardRequest): void {
    this._breakdown = null;
    this._wizard = request;
    if (this.hass && request.wizard === "first") {
      // Opened but not finished: Today will show a banner until it is done.
      void saveSetup(this.hass, "in_progress", request.startAt).catch(() => undefined);
    }
  }

  private _onOpenWizard = async (e: Event): Promise<void> => {
    const detail = (e as CustomEvent<Partial<WizardRequest>>).detail ?? {};
    const wizard = detail.wizard ?? "first";
    if (!(await this._guard())) return;
    const setup = this._snapshot?.setup;
    this._openWizard({
      wizard,
      startAt:
        detail.startAt ??
        (wizard === "first" && setup && (setup.status === "skipped" || setup.status === "in_progress")
          ? setup.step
          : ""),
    });
  };

  // --- breaking a task down with AI ---------------------------------------------

  private _onOpenBreakdown = async (e: Event): Promise<void> => {
    const detail = (e as CustomEvent<{ kind?: "now" | "recurring"; task?: string }>).detail ?? {};
    if (!(await this._guard())) return;
    this._wizard = null;
    this._breakdownError = "";
    this._breakdown = { kind: detail.kind ?? "now", task: detail.task ?? "" };
  };

  private _draftFrom(result: BreakdownResult): ChoreDraft {
    return {
      name: result.task,
      where: "home",
      enabled: true,
      one_off: false,
      repeat: { type: "none", time: "09:00", every_n_days: 1, days: {} },
      notes: result.notes,
      questions: result.questions,
      steps: result.steps.map((s) => ({
        title: s.title,
        wait_minutes: s.wait_minutes,
        size: s.size,
        group: s.group,
        only_if: s.only_if ?? "",
      })),
    };
  }

  /** The review is done: start the task, save the chore, or go on to its schedule. */
  private _onBreakdownResult = async (e: Event): Promise<void> => {
    if (!this.hass) return;
    const result = (e as CustomEvent<BreakdownResult>).detail;
    this._breakdownError = "";
    try {
      if (result.action === "start") {
        await taskAdd(this.hass, result.task, result.steps, result.notes);
        this._breakdown = null;
        this._tab = "today";
      } else if (result.action === "save") {
        await saveChore(this.hass, this._draftFrom(result));
        this._breakdown = null;
        this._tab = "chores";
      } else if (result.action === "schedule") {
        // The chores screen opens the new chore straight in the schedule wizard.
        this._choresRequest = { id: ++this._requestId, draft: this._draftFrom(result), schedule: true };
        this._breakdown = null;
        this._tab = "chores";
      }
    } catch (err) {
      this._breakdownError =
        err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Something went wrong.";
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    // Keep relative times ("in 2h") fresh.
    this._timer = window.setInterval(() => (this._nowMs = Date.now()), 30_000);
    window.addEventListener("beforeunload", this._beforeUnload);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
    window.removeEventListener("beforeunload", this._beforeUnload);
    this._unsub?.();
    this._unsub = undefined;
    this._subscribing = false;
  }

  protected updated(): void {
    if (this.hass && !this._unsub && !this._subscribing) {
      this._subscribing = true;
      subscribe(this.hass, (snapshot) => {
        this._snapshot = snapshot;
        this._nowMs = Date.now();
        this._connectionError = "";
        // The very first visit opens the wizard by itself (once per page load).
        if (!this._autoChecked) {
          this._autoChecked = true;
          if (snapshot.setup?.status === "new") {
            this._openWizard({ wizard: "first", startAt: "" });
          }
        }
      })
        .then((unsub) => {
          this._unsub = unsub;
        })
        .catch(() => {
          this._connectionError = "Could not reach Boopli. Is the integration set up?";
        })
        .finally(() => {
          this._subscribing = false;
        });
    }
  }

  private _toggleSidebar(): void {
    // The documented way for a custom panel to open HA's sidebar on mobile.
    this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
  }

  private _renderConfirm() {
    if (!this._confirm) return nothing;
    const answer = (c: Choice) => () => this._confirm?.(c);
    return html`<div class="backdrop" role="dialog" aria-modal="true" aria-label="Unsaved changes">
      <div class="card dialog">
        <h2>You have unsaved changes</h2>
        <p class="muted">Leave without saving and they are lost.</p>
        <div class="dialog-actions">
          <button class="primary" @click=${answer("save")}>Save</button>
          <button class="danger" @click=${answer("discard")}>Discard</button>
          <button @click=${answer("stay")}>Stay</button>
        </div>
      </div>
    </div>`;
  }

  /** A thin reminder under the tabs on every screen but Today (Today has the big banner) while away mode is on. */
  private _renderAwayBar() {
    const away = this._snapshot?.away;
    // Today has the big banner and Settings has the card itself.
    if (!away?.active || ((this._tab === "today" || this._tab === "settings") && !this._wizard && !this._breakdown)) {
      return nothing;
    }
    const onNow = !!this._snapshot?.away_now;
    const tz = this._snapshot?.time_zone ?? "UTC";
    return html`<div class="away-bar" role="status">
      <span>🧳 <b>${onNow ? "Away mode is on" : "Away mode is planned"}</b> ${awayWhen(away, this._nowMs, tz, onNow)}</span>
      <button type="button" @click=${() => this._selectTab("settings")}>${onNow ? "Back now…" : "Change"}</button>
    </div>`;
  }

  /** Open the wall view: a board over the whole screen. */
  private async _openWall(name = "", edit = false): Promise<void> {
    if (!(await this._guard())) return;
    this._wall = name;
    this._wallEdit = edit;
    const url = new URL(location.href);
    url.searchParams.set("wall", name);
    history.replaceState(null, "", url);
  }

  private _closeWall = (): void => {
    this._wall = null;
    this._wallEdit = false;
    const url = new URL(location.href);
    url.searchParams.delete("wall");
    history.replaceState(null, "", url);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  };

  render() {
    if (this._wall !== null && this._wallEdit) {
      return html`<boopli-wall-edit
        .hass=${this.hass}
        .snapshot=${this._snapshot}
        .nowMs=${this._nowMs}
        .boardName=${this._wall}
        @wall-edit-exit=${(e: Event) => {
          this._wall = (e as CustomEvent<string>).detail ?? "";
          this._wallEdit = false;
          const url = new URL(location.href);
          url.searchParams.set("wall", this._wall);
          history.replaceState(null, "", url);
        }}
      ></boopli-wall-edit>`;
    }
    if (this._wall !== null) {
      return html`<boopli-wall
        .hass=${this.hass}
        .snapshot=${this._snapshot}
        .nowMs=${this._nowMs}
        .boardName=${this._wall}
        @wall-exit=${this._closeWall}
        @wall-edit=${() => (this._wallEdit = true)}
      ></boopli-wall>`;
    }
    const unsaved: Record<Tab, boolean> = {
      today: false,
      chores: this._dirty.chore,
      home: this._dirty.home,
      settings: this._dirty.settings,
    };
    return html`
      <header>
        ${this.narrow
          ? html`<button class="menu" aria-label="Open sidebar" @click=${this._toggleSidebar}>☰</button>`
          : nothing}
        <h1>Boopli</h1>
        <nav>
          ${(Object.keys(TAB_LABELS) as Tab[]).map(
            (tab) => html`<button
              class="tab ${this._tab === tab && !this._wizard ? "on" : ""}"
              @click=${() => this._selectTab(tab)}
            >
              ${TAB_LABELS[tab]}
              ${unsaved[tab] ? html`<span class="dot" title="Unsaved changes" aria-label="Unsaved changes"></span>` : nothing}
            </button>`
          )}
        </nav>
        <span class="grow"></span>
        <button class="wallbtn" title="Show a board for a screen on the wall" @click=${() => this._openWall(pickBoard(this._snapshot?.settings?.boards, "")?.name ?? "")}>🖥 Wall view</button>
      </header>
      ${this._renderAwayBar()}
      <main
        @goto-settings=${() => this._selectTab("settings")}
        @open-wizard=${this._onOpenWizard}
        @open-breakdown=${this._onOpenBreakdown}
        @open-home=${() => this._selectTab("home")}
        @open-wall=${(e: Event) => {
          const d = (e as CustomEvent<{ name?: string; edit?: boolean }>).detail ?? {};
          void this._openWall(d.name ?? "", !!d.edit);
        }}
        @egg-started=${() => this.hass && void eggFound(this.hass).catch(() => undefined)}
        @dirty-change=${this._onDirty}
      >
        ${this._connectionError
          ? html`<p class="error">${this._connectionError}</p>`
          : this._wizard
            ? html`<boopli-wizard
                .hass=${this.hass}
                .snapshot=${this._snapshot}
                .wizard=${this._wizard.wizard}
                .startAt=${this._wizard.startAt}
                @wizard-close=${() => (this._wizard = null)}
              ></boopli-wizard>`
            : this._breakdown
              ? html`<boopli-breakdown
                  .hass=${this.hass}
                  .snapshot=${this._snapshot}
                  .kind=${this._breakdown.kind}
                  .task=${this._breakdown.task}
                  .externalError=${this._breakdownError}
                  @breakdown-result=${this._onBreakdownResult}
                  @breakdown-cancel=${() => (this._breakdown = null)}
                ></boopli-breakdown>`
              : this._tab === "today"
                ? html`<boopli-today .hass=${this.hass} .snapshot=${this._snapshot} .nowMs=${this._nowMs}></boopli-today>`
                : this._tab === "chores"
                  ? html`<boopli-chores
                      .hass=${this.hass}
                      .snapshot=${this._snapshot}
                      .nowMs=${this._nowMs}
                      .openRequest=${this._choresRequest}
                      @request-handled=${() => (this._choresRequest = null)}
                    ></boopli-chores>`
                  : this._tab === "home"
                    ? html`<boopli-home .hass=${this.hass} .snapshot=${this._snapshot}></boopli-home>`
                    : html`<boopli-settings .hass=${this.hass} .snapshot=${this._snapshot}></boopli-settings>`}
      </main>
      ${this._renderConfirm()}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        min-height: 100%;
        background: var(--primary-background-color);
      }
      header {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        padding: 0 16px;
        background: var(--app-header-background-color, var(--primary-color));
        color: var(--app-header-text-color, #fff);
      }
      header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        margin-right: 8px;
      }
      header .grow {
        flex: 1;
      }
      header .wallbtn {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: inherit;
        min-height: 36px;
        padding: 4px 12px;
        white-space: nowrap;
      }
      header .menu {
        background: none;
        border: 0;
        color: inherit;
        font-size: 22px;
        padding: 8px;
        min-height: 0;
      }
      nav {
        display: flex;
        gap: 4px;
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .tab {
        white-space: nowrap;
      }
      .tab {
        position: relative;
        background: none;
        border: 0;
        border-radius: 10px;
        color: inherit;
        opacity: 0.75;
        padding: 8px 14px;
      }
      .tab:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .tab.on {
        opacity: 1;
        background: rgba(255, 255, 255, 0.2);
        font-weight: 500;
      }
      .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-left: 6px;
        border-radius: 50%;
        background: var(--warning-color, #ffa600);
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.25);
      }
      main {
        padding: 20px 24px 64px;
      }
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 16px;
      }
      .dialog {
        max-width: 420px;
        width: 100%;
        padding: 20px;
      }
      .dialog-actions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      .away-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 6px 12px;
        padding: 8px 16px;
        background: var(--warning-color, #ffa600);
        color: #1a1200;
        font-size: 15px;
      }
      .away-bar button {
        min-height: 0;
        padding: 4px 12px;
        background: #1a1200;
        color: #fff;
        border: 0;
        border-radius: 999px;
      }
      /* Phones: these come last so they win over the rules above. */
      @media (max-width: 600px) {
        header {
          padding: 0 8px;
          gap: 6px;
        }
        header h1 {
          font-size: 18px;
          margin-right: 0;
        }
        .tab {
          padding: 8px 9px;
          font-size: 14px;
        }
        main {
          padding: 12px 12px 64px;
        }
      }
      @media (max-width: 480px) {
        header h1 {
          display: none;
        }
        nav {
          gap: 0;
        }
        .tab {
          padding: 8px 7px;
        }
      }
    `,
  ];
}

customElements.define("boopli-panel", BoopliPanel);
