import { LitElement, html, css, nothing } from "lit";
import { claudeTest, claudeToken, errorMessage } from "./api";
import { sharedStyles } from "./styles";
import type { AiSettings, Hass, Snapshot } from "./types";

/**
 * The "Ask Claude" fields: switch, fire address, token, test. Used by the AI card in
 * Settings and by the Guide me wizard. The token is stored on the spot and never comes
 * back: this panel only learns that one is set. Everything else is a draft the host saves.
 *
 * Emits `ai-patch` ({ detail: Partial<AiSettings> }) when a draft field changes.
 */
export class BoopliClaude extends LitElement {
  static properties = {
    hass: { attribute: false },
    snapshot: { attribute: false },
    ai: { attribute: false },
    blocked: { type: String }, // a reason the test cannot run yet ("Save first to test.")
    hideIntro: { type: Boolean }, // the host already explained what Ask Claude is
    beforeTest: { attribute: false }, // saves the draft first (wizard)
    _token: { state: true },
    _changing: { state: true },
    _busy: { state: true },
    _note: { state: true },
    _bad: { state: true },
  };

  declare hass?: Hass;
  declare snapshot?: Snapshot;
  declare ai: AiSettings;
  declare blocked: string;
  declare hideIntro: boolean;
  declare beforeTest?: () => Promise<void>;
  declare _token: string;
  declare _changing: boolean;
  declare _busy: boolean;
  declare _note: string;
  declare _bad: boolean;

  constructor() {
    super();
    this.blocked = "";
    this.hideIntro = false;
    this._token = "";
    this._changing = false;
    this._busy = false;
    this._note = "";
    this._bad = false;
  }

  private _patch(patch: Partial<AiSettings>): void {
    this.dispatchEvent(new CustomEvent("ai-patch", { detail: patch, bubbles: true, composed: true }));
    this._note = "";
  }

  private async _saveToken(): Promise<void> {
    if (!this.hass) return;
    this._busy = true;
    this._bad = false;
    try {
      await claudeToken(this.hass, this._token);
      this._token = "";
      this._changing = false;
      this._note = "Token saved. Boopli keeps it out of backups and never shows it again.";
    } catch (err) {
      this._bad = true;
      this._note = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private async _removeToken(): Promise<void> {
    this._token = "";
    await this._saveToken();
    this._note = "Token removed.";
  }

  private async _test(): Promise<void> {
    if (!this.hass) return;
    this._busy = true;
    this._bad = false;
    this._note = "Asking Claude. This can take up to a minute…";
    try {
      if (this.beforeTest) await this.beforeTest();
      const result = await claudeTest(this.hass);
      this._note = `It works. Claude answered in ${result.seconds} seconds.`;
    } catch (err) {
      this._bad = true;
      this._note = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  render() {
    const ai = this.ai;
    if (!ai) return nothing;
    const status = this.snapshot?.claude;
    const tokenSet = !!status?.token_set;
    const ready = !!(ai.claude_enabled && ai.claude_fire_url?.trim() && tokenSet);
    const testOff = this._busy || !ready || !!this.blocked;
    return html`
      ${this.hideIntro
        ? nothing
        : html`<p class="muted small">
            Claude is an extra, next to your Home Assistant agent. Press <b>Ask Claude</b> when you do not trust the
            agent's answer, when your free agent is down, or when you have no agent. It uses your own Claude account:
            every ask is one run of your routine. Claude's routines are a research preview, so they can change or stop
            working. Boopli sends the task text and your answers. If you turned on room notes, the notes of the rooms a
            task is about go along, and a room interview sends that room's name and its notes. Photos you choose go
            along too. Never device names, history or location.
          </p>`}
      <label class="inline">
        <input
          type="checkbox"
          .checked=${!!ai.claude_enabled}
          @change=${(e: Event) => this._patch({ claude_enabled: (e.target as HTMLInputElement).checked })}
        />
        Switch Ask Claude on
      </label>
      <div class="field">
        <label for="claude-url">The routine's fire address</label>
        <input
          id="claude-url"
          type="url"
          autocomplete="off"
          placeholder="https://api.anthropic.com/v1/claude_code/routines/trig_…/fire"
          .value=${ai.claude_fire_url ?? ""}
          @change=${(e: Event) => this._patch({ claude_fire_url: (e.target as HTMLInputElement).value.trim() })}
        />
      </div>
      <div class="field">
        <label for="claude-token">The routine's token</label>
        ${tokenSet && !this._changing
          ? html`<div class="row">
              <span>Token is saved</span>
              <button type="button" ?disabled=${this._busy} @click=${() => (this._changing = true)}>Replace</button>
              <button type="button" class="danger" ?disabled=${this._busy} @click=${() => this._removeToken()}>Remove</button>
            </div>`
          : html`<div class="row">
              <input
                id="claude-token"
                type="password"
                autocomplete="off"
                spellcheck="false"
                placeholder="Paste the token here"
                .value=${this._token}
                @input=${(e: Event) => (this._token = (e.target as HTMLInputElement).value)}
              />
              <button type="button" ?disabled=${this._busy || !this._token.trim()} @click=${() => this._saveToken()}>
                Save token
              </button>
            </div>`}
      </div>
      <details>
        <summary class="muted small">Advanced: Home Assistant's web address</summary>
        <div class="field">
          <label for="claude-ha">Where the routine sends its answer</label>
          <input
            id="claude-ha"
            type="url"
            autocomplete="off"
            placeholder="Leave empty to use Home Assistant's external URL"
            .value=${ai.claude_ha_url ?? ""}
            @change=${(e: Event) => this._patch({ claude_ha_url: (e.target as HTMLInputElement).value.trim() })}
          />
          <div class="muted small">It must be reachable from the internet, and allowed in the routine's environment.</div>
        </div>
      </details>
      <div class="row">
        <button type="button" ?disabled=${testOff} @click=${() => this._test()}>Test Claude</button>
        ${this.blocked ? html`<span class="muted small">${this.blocked}</span>` : nothing}
        ${status ? html`<span class="muted small">${status.fires_left} of ${status.fires_per_hour} asks left this hour</span>` : nothing}
      </div>
      ${this._note ? html`<div class=${this._bad ? "error" : "note muted small"} role="status">${this._note}</div>` : nothing}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .small {
        font-size: 15px;
      }
      p {
        margin: 6px 0 10px;
      }
      .field {
        margin: 10px 0;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin: 8px 0;
      }
      .row input {
        flex: 1 1 200px;
        width: auto;
      }
      label.inline {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--primary-text-color);
      }
      label.inline input {
        width: auto;
        min-height: 0;
      }
      details {
        margin: 6px 0;
      }
      summary {
        cursor: pointer;
      }
      .note {
        margin: 6px 0;
      }
    `,
  ];
}

customElements.define("boopli-claude", BoopliClaude);
