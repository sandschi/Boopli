// TEMPORARY TOOL: try every Alexa sound on a real speaker and mark it as working or not.
// The marks are kept by the backend (boopli/sound_test_get / sound_test_set) and every change is written to the
// Home Assistant log, so they can be read from there. Delete this file, its backend commands and the
// "Try the sounds" button once the list of working sounds is settled. English only on purpose (not shipped).
import { LitElement, html, css, nothing } from "lit";
import { ALEXA_SOUNDS } from "./alexa-sounds";
import { errorMessage, testNote, testSpeaker } from "./api";
import { sharedStyles } from "./styles";
import type { Hass, SpeakerCfg } from "./types";

type Mark = "ok" | "bad";
type Filter = "all" | "open" | "ok" | "bad";

const TOP = (category: string) => category.split("/")[0];

export class BoopliSoundTest extends LitElement {
  static properties = {
    hass: { attribute: false },
    speakers: { attribute: false },
    _marks: { state: true },
    _filter: { state: true },
    _speaker: { state: true },
    _notes: { state: true },
    _loaded: { state: true },
    _error: { state: true },
  };

  declare hass?: Hass;
  declare speakers: SpeakerCfg[];
  declare _marks: Record<string, Mark>;
  declare _filter: Filter;
  declare _speaker: string;
  declare _notes: Record<string, string>;
  declare _loaded: boolean;
  declare _error: string;

  constructor() {
    super();
    this.speakers = [];
    this._marks = {};
    this._filter = "all";
    this._speaker = "";
    this._notes = {};
    this._loaded = false;
    this._error = "";
  }

  connectedCallback(): void {
    super.connectedCallback();
    void this._load();
  }

  private async _load(): Promise<void> {
    if (!this.hass) return;
    try {
      const res = await this.hass.callWS<{ marks: Record<string, Mark> }>({ type: "boopli/sound_test_get" });
      this._marks = res.marks ?? {};
      this._loaded = true;
    } catch (err) {
      this._error = errorMessage(err);
    }
  }

  private _alexa(): SpeakerCfg[] {
    return this.speakers.filter((s) => s.speech.route !== "tts");
  }

  private _current(): SpeakerCfg | undefined {
    const list = this._alexa();
    const here = (s: SpeakerCfg) => {
      const state = this.hass?.states[s.entity_id]?.state;
      return state !== undefined && state !== "unavailable";
    };
    return list.find((s) => s.entity_id === this._speaker) ?? list.find(here) ?? list[0];
  }

  private _note(id: string, text: string): void {
    this._notes = { ...this._notes, [id]: text };
  }

  private async _test(id: string): Promise<void> {
    const speaker = this._current();
    if (!this.hass || !speaker) return;
    this._note(id, "Sending…");
    try {
      const res = await testSpeaker(this.hass, speaker, "sound:try", [{ id: "try", name: "try", kind: "alexa", sound: id }]);
      this._note(id, testNote(res));
    } catch (err) {
      this._note(id, errorMessage(err));
    }
  }

  private async _mark(id: string, mark: Mark): Promise<void> {
    if (!this.hass) return;
    const next = this._marks[id] === mark ? "" : mark; // pressing the same mark again takes it back
    const before = this._marks;
    const marks = { ...before };
    if (next) marks[id] = next;
    else delete marks[id];
    this._marks = marks;
    try {
      await this.hass.callWS({ type: "boopli/sound_test_set", sound: id, mark: next });
    } catch (err) {
      this._marks = before;
      this._note(id, errorMessage(err));
    }
  }

  private _counts() {
    let ok = 0;
    let bad = 0;
    for (const [id] of ALEXA_SOUNDS) {
      if (this._marks[id] === "ok") ok++;
      else if (this._marks[id] === "bad") bad++;
    }
    return { ok, bad, open: ALEXA_SOUNDS.length - ok - bad };
  }

  render() {
    if (this._error) return html`<p class="note">${this._error}</p>`;
    if (!this._loaded) return html`<p class="muted">Loading…</p>`;
    const alexa = this._alexa();
    if (!alexa.length) return html`<p class="muted">Add an Alexa speaker first, then come back here.</p>`;
    const cur = this._current();
    const c = this._counts();
    const shown = ALEXA_SOUNDS.filter(([id]) => {
      const m = this._marks[id];
      return this._filter === "all" || (this._filter === "open" ? !m : m === this._filter);
    });
    const groups = new Map<string, (typeof ALEXA_SOUNDS)[number][]>();
    for (const s of shown) (groups.get(TOP(s[2])) ?? groups.set(TOP(s[2]), []).get(TOP(s[2]))!).push(s);
    const filterBtn = (f: Filter, label: string) =>
      html`<button type="button" class="chip" aria-pressed=${this._filter === f ? "true" : "false"} @click=${() => (this._filter = f)}>${label}</button>`;
    return html`
      <p class="muted small">Press Test, listen on the speaker, then mark the sound. Your marks are saved right away.</p>
      <label class="spk">
        Test on
        <select @change=${(e: Event) => (this._speaker = (e.target as HTMLSelectElement).value)}>
          ${alexa.map((s) => html`<option value=${s.entity_id} ?selected=${s.entity_id === cur?.entity_id}>${this.hass?.states[s.entity_id]?.attributes?.friendly_name ?? s.entity_id}</option>`)}
        </select>
      </label>
      <div class="chips">
        ${filterBtn("all", `All ${ALEXA_SOUNDS.length}`)} ${filterBtn("open", `Open ${c.open}`)} ${filterBtn("ok", `Works ${c.ok}`)}
        ${filterBtn("bad", `Doesn't work ${c.bad}`)}
      </div>
      ${shown.length === 0 ? html`<p class="muted">Nothing in this list.</p>` : nothing}
      ${[...groups.entries()].map(
        ([group, list]) => html`
          <h4>${group.replace(/_/g, " ")} <span class="muted small">${list.length}</span></h4>
          ${list.map(([id, name, , secs]) => {
            const m = this._marks[id];
            return html`<div class="row ${m ?? ""}">
              <span class="name">${name} <span class="muted small">${secs.toFixed(1)} s</span></span>
              <button type="button" @click=${() => void this._test(id)}>Test</button>
              <button type="button" class="yes" aria-pressed=${m === "ok" ? "true" : "false"} @click=${() => void this._mark(id, "ok")}>Works</button>
              <button type="button" class="no" aria-pressed=${m === "bad" ? "true" : "false"} @click=${() => void this._mark(id, "bad")}>Doesn't work</button>
              ${this._notes[id] ? html`<span class="note muted small">${this._notes[id]}</span>` : nothing}
            </div>`;
          })}
        `
      )}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .spk {
        display: flex;
        gap: 8px;
        align-items: center;
        margin: 8px 0;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 8px 0 12px;
      }
      .chip[aria-pressed="true"] {
        border-color: var(--boopli-accent, #5fe05f);
        color: var(--boopli-accent, #5fe05f);
      }
      h4 {
        margin: 14px 0 4px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        padding: 5px 0;
        border-top: 1px solid var(--divider-color, #333);
      }
      .row .name {
        flex: 1 1 200px;
      }
      .row.ok .name {
        color: var(--boopli-accent, #5fe05f);
      }
      .row.bad .name {
        text-decoration: line-through;
        opacity: 0.6;
      }
      .row button[aria-pressed="true"].yes {
        background: var(--boopli-accent, #5fe05f);
        color: #111;
      }
      .row button[aria-pressed="true"].no {
        background: #e05f5f;
        color: #111;
      }
      .note {
        flex-basis: 100%;
      }
    `,
  ];
}

customElements.define("boopli-sound-test", BoopliSoundTest);
