import { LitElement, html, css, nothing } from "lit";

/** The slice of Home Assistant's `hass` object that the panel uses. */
interface Hass {
  user?: { name?: string };
  states: Record<string, unknown>;
}

/**
 * Boopli sidebar panel. Home Assistant creates this element and keeps
 * setting `hass` on it with live state, plus `narrow` on small screens.
 *
 * M1: a "hello" screen that proves the panel loads and receives live data.
 */
export class BoopliPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
  };

  declare hass?: Hass;
  declare narrow: boolean;

  constructor() {
    super();
    this.narrow = false;
  }

  private _toggleSidebar(): void {
    // The documented way for a custom panel to open HA's sidebar on mobile.
    this.dispatchEvent(
      new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true })
    );
  }

  render() {
    const name = this.hass?.user?.name ?? "there";
    const entityCount = this.hass ? Object.keys(this.hass.states).length : 0;

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
      </header>
      <main>
        <div class="pet" aria-hidden="true">🌱</div>
        <h2>Hello, ${name}!</h2>
        <p>Boopli is installed and the panel is alive.</p>
        <p class="muted">
          Live link to Home Assistant: ${entityCount} entities visible.
        </p>
      </main>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100%;
      box-sizing: border-box;
      background: var(--primary-background-color, #111);
      color: var(--primary-text-color, #fff);
      font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif);
    }
    header {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 56px;
      padding: 0 16px;
      background: var(--app-header-background-color, var(--primary-color));
      color: var(--app-header-text-color, #fff);
    }
    header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }
    .menu {
      background: none;
      border: 0;
      color: inherit;
      font-size: 22px;
      cursor: pointer;
      padding: 8px;
    }
    main {
      max-width: 560px;
      margin: 0 auto;
      padding: 48px 16px;
      text-align: center;
    }
    .pet {
      font-size: 72px;
      line-height: 1;
    }
    h2 {
      margin: 16px 0 8px;
      font-weight: 500;
    }
    p {
      margin: 8px 0;
    }
    .muted {
      color: var(--secondary-text-color, #aaa);
      font-size: 14px;
    }
  `;
}

customElements.define("boopli-panel", BoopliPanel);
