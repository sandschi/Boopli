import { LitElement, html, css, nothing } from "lit";
import { saveSetup, subscribe } from "./api";
import "./boopli-today";
import "./boopli-chores";
import "./boopli-settings";
import { ALL_SECTIONS, type Section } from "./boopli-wizard";
import { sharedStyles } from "./styles";
import type { Hass, Snapshot } from "./types";

/** What the wizard should walk through, and where to start. */
interface WizardRequest {
  sections: Section[];
  startAt: string;
}

type Tab = "today" | "chores" | "settings";

const TAB_LABELS: Record<Tab, string> = {
  today: "Today",
  chores: "Chores",
  settings: "Settings",
};

/**
 * Boopli sidebar panel. Home Assistant creates this element and keeps
 * setting `hass` on it with live state, plus `narrow` on small screens.
 *
 * It subscribes once to the integration and re-renders on every update.
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
  };

  declare hass?: Hass;
  declare narrow: boolean;
  declare _snapshot?: Snapshot;
  declare _tab: Tab;
  declare _nowMs: number;
  declare _connectionError: string;
  declare _wizard: WizardRequest | null;

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
  }

  /** Open the wizard: the full setup, or a guided setup of part of it. */
  private _openWizard(request: WizardRequest): void {
    this._wizard = request;
    if (this.hass && request.sections.includes("welcome")) {
      // Opened but not finished: Today will show a banner until it is done.
      void saveSetup(this.hass, "in_progress", request.startAt).catch(() => undefined);
    }
  }

  private _closeWizard(): void {
    this._wizard = null;
  }

  private _onOpenWizard = (e: Event): void => {
    const detail = (e as CustomEvent<Partial<WizardRequest>>).detail ?? {};
    const full = !detail.sections;
    const step = this._snapshot?.setup;
    this._openWizard({
      sections: detail.sections ?? [...ALL_SECTIONS],
      startAt:
        detail.startAt ??
        (full && step && step.status !== "done" && step.status !== "new" ? step.step : ""),
    });
  };

  connectedCallback(): void {
    super.connectedCallback();
    // Keep relative times ("in 2h") fresh.
    this._timer = window.setInterval(() => (this._nowMs = Date.now()), 30_000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
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
            this._openWizard({ sections: [...ALL_SECTIONS], startAt: "" });
          }
        }
      })
        .then((unsub) => {
          this._unsub = unsub;
        })
        .catch(() => {
          this._connectionError =
            "Could not reach Boopli. Is the integration set up?";
        })
        .finally(() => {
          this._subscribing = false;
        });
    }
  }

  private _toggleSidebar(): void {
    // The documented way for a custom panel to open HA's sidebar on mobile.
    this.dispatchEvent(
      new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true })
    );
  }

  render() {
    return html`
      <header>
        ${this.narrow
          ? html`<button
              class="menu"
              aria-label="Open sidebar"
              @click=${this._toggleSidebar}
            >
              ☰
            </button>`
          : nothing}
        <h1>Boopli</h1>
        <nav>
          ${(Object.keys(TAB_LABELS) as Tab[]).map(
            (tab) => html`<button
              class="tab ${this._tab === tab ? "on" : ""}"
              @click=${() => (this._tab = tab)}
            >
              ${TAB_LABELS[tab]}
            </button>`
          )}
        </nav>
      </header>
      <main @open-wizard=${this._onOpenWizard}>
        ${this._connectionError
          ? html`<p class="error">${this._connectionError}</p>`
          : this._wizard
            ? html`<boopli-wizard
                .hass=${this.hass}
                .snapshot=${this._snapshot}
                .sections=${this._wizard.sections}
                .startAt=${this._wizard.startAt}
                @wizard-close=${() => this._closeWizard()}
              ></boopli-wizard>`
          : this._tab === "today"
            ? html`<boopli-today
                .hass=${this.hass}
                .snapshot=${this._snapshot}
                .nowMs=${this._nowMs}
              ></boopli-today>`
            : this._tab === "chores"
              ? html`<boopli-chores
                  .hass=${this.hass}
                  .snapshot=${this._snapshot}
                  .nowMs=${this._nowMs}
                ></boopli-chores>`
              : html`<boopli-settings
                  .hass=${this.hass}
                  .snapshot=${this._snapshot}
                ></boopli-settings>`}
      </main>
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
      }
      .tab {
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
      main {
        max-width: 640px;
        margin: 0 auto;
        padding: 20px 16px 48px;
      }
    `,
  ];
}

customElements.define("boopli-panel", BoopliPanel);
