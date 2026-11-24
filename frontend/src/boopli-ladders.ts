import { LitElement, html, css, nothing } from "lit";
import { icon } from "./icon";
import { friendlyName, newLadderId, phoneName, PHONE_LEVEL_LABEL, styleLabel } from "./helpers";
import { speakerChoices } from "./boopli-rung";
import { sharedStyles } from "./styles";
import type { Hass, Ladder, NudgeStyle, Rung, Settings, Snapshot } from "./types";
import { t } from "./i18n";

// The same limits as in the integration.
const MAX_LADDERS = 30; // the same as the backend (the three standard ladders count too)
const MAX_NUDGES = 12;
const GAP_MIN = 1;
const GAP_MAX = 720;
const NAME_MAX = 40;

const BUILT_IN = (): { value: NudgeStyle; label: string }[] => [
  { value: "quiet", label: t("ladders.quiet_no_nudges") },
];

function copyRung(r: Rung): Rung {
  return structuredClone(r);
}

/**
 * "Nudge it your way": ladders of your own. A ladder is a list of nudges. For each nudge you say how
 * long Boopli waits for it and exactly which phone, light, speaker or alarm acts (and how loud).
 * A chore picks a ladder in its nudge style. The devices come from the other cards in Settings.
 */
export class BoopliLadders extends LitElement {
  static properties = {
    hass: { attribute: false },
    settings: { attribute: false },
    snapshot: { attribute: false },
    _open: { state: true },
    _note: { state: true },
  };

  declare hass?: Hass;
  declare settings?: Settings;
  declare snapshot?: Snapshot;
  declare _open: string; // the id of the ladder being edited
  declare _note: string;

  constructor() {
    super();
    this._open = "";
    this._note = "";
  }

  // --- data -------------------------------------------------------------

  private get _ladders(): Ladder[] {
    return this.settings?.ladders ?? [];
  }

  private _patch(ladders: Ladder[], extra: Partial<Settings> = {}): void {
    this._note = "";
    this.dispatchEvent(
      new CustomEvent("settings-patch", {
        detail: { ladders, ...extra },
        bubbles: true,
        composed: true,
      })
    );
  }

  /** Change one ladder. */
  private _edit(id: string, change: (l: Ladder) => void): void {
    const ladders = structuredClone(this._ladders);
    const ladder = ladders.find((l) => l.id === id);
    if (!ladder) return;
    change(ladder);
    this._patch(ladders);
  }

  /** Change one nudge of a ladder. */
  private _editRung(id: string, index: number, change: (r: Rung) => void): void {
    this._edit(id, (l) => {
      if (l.rungs[index]) change(l.rungs[index]);
    });
  }

  private _uniqueName(base: string): string {
    const taken = new Set(this._ladders.map((l) => l.name.toLowerCase()));
    if (!taken.has(base.toLowerCase())) return base;
    for (let n = 2; ; n++) {
      const name = `${base} ${n}`;
      if (!taken.has(name.toLowerCase())) return name;
    }
  }

  // --- ladders ----------------------------------------------------------

  private _add(): void {
    const s = this.settings;
    if (!s || this._ladders.length >= MAX_LADDERS) return;
    const first: Rung = {
      gap: 5,
      phones: Object.fromEntries(s.phones.map((p) => [p.service, p.level])),
      lights: {},
      speakers: {},
      alarms: [],
    };
    const ladder: Ladder = { id: newLadderId(), name: this._uniqueName(t("ladders.my_ladder")), rungs: [first], repeat_last: false };
    this._patch([...this._ladders, ladder]);
    this._open = ladder.id;
  }

  private _delete(ladder: Ladder): void {
    const style = `ladder:${ladder.id}`;
    const users = (this.snapshot?.chores ?? []).filter((c) => c.nudge_style === style).map((c) => c.name);
    if (users.length) {
      this._note = t("ladders.is_used_by_pick_another_nudge", { name: ladder.name, join: users.sort().join(", ") });
      return;
    }
    if (this.settings?.default_style === style) {
      this._note = t("ladders.is_the_style_for_new_chores", { name: ladder.name });
      return;
    }
    this._patch(this._ladders.filter((l) => l.id !== ladder.id));
    if (this._open === ladder.id) this._open = "";
  }

  // --- nudges -----------------------------------------------------------

  private _addRung(id: string): void {
    this._edit(id, (l) => {
      if (l.rungs.length >= MAX_NUDGES) return;
      const last = l.rungs[l.rungs.length - 1];
      l.rungs.push(last ? copyRung(last) : { gap: 5, phones: {}, lights: {}, speakers: {}, alarms: [] });
    });
  }

  private _duplicateRung(id: string, index: number): void {
    this._edit(id, (l) => {
      if (l.rungs.length >= MAX_NUDGES) return;
      l.rungs.splice(index + 1, 0, copyRung(l.rungs[index]));
    });
  }

  private _removeRung(id: string, index: number): void {
    this._edit(id, (l) => {
      if (l.rungs.length > 1) l.rungs.splice(index, 1);
    });
  }

  private _moveRung(id: string, index: number, by: -1 | 1): void {
    this._edit(id, (l) => {
      const to = index + by;
      if (to < 0 || to >= l.rungs.length) return;
      [l.rungs[index], l.rungs[to]] = [l.rungs[to], l.rungs[index]];
    });
  }

  private _setGap(id: string, index: number, input: HTMLInputElement): void {
    const n = Math.round(Number(input.value));
    if (input.value.trim() === "" || Number.isNaN(n)) {
      // Blank is not a number: put the wait that is saved back, do not turn it into one minute.
      const r = this._ladders.find((l) => l.id === id)?.rungs[index];
      if (r) input.value = String(r.gap);
      return;
    }
    const gap = Math.min(GAP_MAX, Math.max(GAP_MIN, n));
    input.value = String(gap); // show the number that is kept (the field does not redraw when it is the same as before)
    this._editRung(id, index, (r) => (r.gap = gap));
  }

  // --- words ------------------------------------------------------------

  /** Who acts at one nudge, in words. */
  private _who(r: Rung): string {
    const parts: string[] = [];
    for (const [service, level] of Object.entries(r.phones)) {
      parts.push(`${phoneName(service)} (${PHONE_LEVEL_LABEL()[level] ?? level})`);
    }
    for (const [id, use] of Object.entries(r.lights)) {
      const how = use.mode === "indicator" ? t("ladders.how_status_light") : use.mode === "blink" ? t("ladders.how_blink") : "";
      parts.push(`${friendlyName(this.hass, id)}${how ? ` (${how}${use.color ? t("ladders.how_own_color") : ""})` : ""}`);
    }
    for (const [id, choice] of Object.entries(r.speakers)) {
      const sp = this.settings?.speakers.find((x) => x.entity_id === id);
      if (!sp) {
        parts.push(t("ladders.not_set_up_any_more", { device: friendlyName(this.hass, id) }));
        continue;
      }
      const label = speakerChoices(sp, this.settings?.sounds).find((c) => c.value === choice)?.label ?? choice;
      parts.push(`${friendlyName(this.hass, id)} (${label.toLowerCase()})`);
    }
    for (const id of r.alarms) parts.push(t("ladders.alarm", { device: friendlyName(this.hass, id) }));
    return parts.length ? parts.join(", ") : t("ladders.nothing");
  }

  /** One line per nudge, then how the ladder ends. */
  private _lines(l: Ladder): string[] {
    const lines = l.rungs.map((r, i) =>
      i === 0 ? t("ladders.nudge_1_right_away", { who: this._who(r) }) : t("ladders.nudge_min_later", { n: i + 1, gap: r.gap, who: this._who(r) })
    );
    const last = l.rungs[l.rungs.length - 1];
    lines.push(
      l.repeat_last && last
        ? t("ladders.then_it_repeats_the_last_nudge", { gap: last.gap })
        : t("ladders.then_it_stops")
    );
    return lines;
  }

  // --- render -----------------------------------------------------------

  private _renderRung(l: Ladder, r: Rung, index: number) {
    const many = l.rungs.length > 1;
    return html`<div class="rung">
      <div class="rung-head">
        <b>${t("ladders.nudge", { value: index + 1 })}</b>
        ${index === 0 && !(l.rungs.length === 1 && l.repeat_last)
          ? html`<span class="muted small">${t("ladders.right_away")}</span>`
          : html`<label class="gap">
              ${index === 0 ? t("ladders.right_away_then_repeats_every") : t("rung.wait")}
              <input
                type="number"
                min=${GAP_MIN}
                max=${GAP_MAX}
                .value=${String(r.gap)}
                aria-label=${t("ladders.minutes_before_nudge", { n: index + 1 })}
                @change=${(e: Event) => this._setGap(l.id, index, e.target as HTMLInputElement)}
              />
              ${t("chore_editor.min")}
            </label>`}
        <span class="spacer"></span>
        <button class="chip" title=${t("ladders.move_up")} aria-label=${t("ladders.move_nudge_up", { n: index + 1 })} ?disabled=${index === 0}
          @click=${() => this._moveRung(l.id, index, -1)}>↑</button>
        <button class="chip" title=${t("ladders.move_down")} aria-label=${t("ladders.move_nudge_down", { n: index + 1 })} ?disabled=${index === l.rungs.length - 1}
          @click=${() => this._moveRung(l.id, index, 1)}>↓</button>
        <button class="chip" title=${t("ladders.copy_this_nudge")} aria-label=${t("ladders.copy_nudge", { n: index + 1 })} ?disabled=${l.rungs.length >= MAX_NUDGES}
          @click=${() => this._duplicateRung(l.id, index)}>⧉</button>
        <button class="chip" title=${t("ladders.remove_this_nudge")} aria-label=${t("ladders.remove_nudge", { n: index + 1 })} ?disabled=${!many}
          @click=${() => this._removeRung(l.id, index)}>✕</button>
      </div>
      <boopli-rung
        .hass=${this.hass}
        .settings=${this.settings}
        .rung=${r}
        .index=${index}
        @rung-change=${(e: CustomEvent<Rung>) => this._editRung(l.id, index, (x) => Object.assign(x, e.detail))}
      ></boopli-rung>
    </div>`;
  }

  private _renderEditor(l: Ladder) {
    return html`<div class="editor">
      <div class="field">
        <label for="name-${l.id}">${t("common.name")}</label>
        <input
          id="name-${l.id}"
          maxlength=${NAME_MAX}
          .value=${l.name}
          @input=${(e: Event) => this._edit(l.id, (x) => (x.name = (e.target as HTMLInputElement).value))}
        />
      </div>
      ${l.rungs.map((r, i) => this._renderRung(l, r, i))}
      <div class="row">
        <button ?disabled=${l.rungs.length >= MAX_NUDGES} @click=${() => this._addRung(l.id)}>${t("ladders.add_a_nudge")}</button>
        <span class="muted small">${t("ladders.of", { count: l.rungs.length, max_nudges: MAX_NUDGES })}</span>
      </div>
      <div class="field">
        <label for="end-${l.id}">${t("ladders.after_the_last_nudge")}</label>
        <select
          id="end-${l.id}"
          @change=${(e: Event) =>
            this._edit(l.id, (x) => (x.repeat_last = (e.target as HTMLSelectElement).value === "repeat"))}
        >
          <option value="stop" ?selected=${!l.repeat_last}>${t("common.stop")}</option>
          <option value="repeat" ?selected=${l.repeat_last}>${t("ladders.repeat_the_last_nudge_until_i")}</option>
        </select>
      </div>
      <div class="summary">
        <b class="small">${t("ladders.what_it_will_do")}</b>
        ${this._lines(l).map((line) => html`<div class="small">${line}</div>`)}
      </div>
    </div>`;
  }

  render() {
    const s = this.settings;
    if (!s) return nothing;
    const ladders = this._ladders;
    return html`<section class="card">
      <h2>${icon("stairs")} ${t("common.nudge_it_your_way")}</h2>
      <p class="muted small">
        ${t("ladders.build_your_own_ladder_of_nudges")}
      </p>
      <div class="field">
        <label for="default-style">${t("ladders.use_for_new_chores")}</label>
        <select
          id="default-style"
          @change=${(e: Event) => this._patch(ladders, { default_style: (e.target as HTMLSelectElement).value as NudgeStyle })}
        >
          ${BUILT_IN().map(
            (o) => html`<option value=${o.value} ?selected=${o.value === s.default_style}>${o.label}</option>`
          )}
          ${ladders.map(
            (l) => html`<option value=${`ladder:${l.id}`} ?selected=${`ladder:${l.id}` === s.default_style}>
              ${l.name || t("ladders.no_name")}

            </option>`
          )}
          ${s.default_style.startsWith("ladder:") && !ladders.some((l) => `ladder:${l.id}` === s.default_style)
            ? html`<option value=${s.default_style} selected>${styleLabel(s.default_style, ladders)}</option>`
            : nothing}
        </select>
      </div>
      ${ladders.length === 0
        ? html`<p class="muted">${t("ladders.no_ladders_yet_the_built_in")}</p>`
        : ladders.map((l) => {
            const open = this._open === l.id;
            return html`<div class="ladder">
              <div class="lhead">
                <b class="lname">${l.name || t("ladders.no_name")}</b>
                <span class="muted small">${t("common.nudges_count", { count: l.rungs.length })}</span>
                <span class="spacer"></span>
                <button class="chip" aria-expanded=${open ? "true" : "false"} @click=${() => (this._open = open ? "" : l.id)}>
                  ${open ? t("common.close") : t("chores.edit")}
                </button>
                ${l.id.startsWith("standard_") ? nothing : html`<button class="chip danger" @click=${() => this._delete(l)}>${t("chore_editor.delete")}</button>`}
              </div>
              ${open
                ? this._renderEditor(l)
                : html`<div class="summary">${this._lines(l).map((line) => html`<div class="small">${line}</div>`)}</div>`}
            </div>`;
          })}
      ${this._note ? html`<div class="error" role="alert">${this._note}</div>` : nothing}
      <div class="row">
        <button class="primary" ?disabled=${ladders.length >= MAX_LADDERS} @click=${() => this._add()}>${t("ladders.new_ladder")}</button>
      </div>
    </section>`;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      :host([plain]) section.card {
        border: 0;
        box-shadow: none;
        background: none;
        padding: 0;
        margin: 0;
      }
      :host([plain]) h2 {
        display: none;
      }
      :host(.changed) section.card {
        border-color: var(--warning-color, #ffa600);
        box-shadow: inset 4px 0 0 var(--warning-color, #ffa600);
      }
      h2 {
        font-size: 20px;
        margin-bottom: 6px;
      }
      .small {
        font-size: 15px;
      }
      .spacer {
        flex: 1;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 6px 0;
      }
      .ladder {
        border-top: 1px solid var(--divider-color);
        padding: 10px 0 6px;
      }
      .lhead {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .lname {
        overflow-wrap: anywhere;
      }
      .summary {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 8px 0 2px;
        color: var(--secondary-text-color);
      }
      .editor {
        padding-top: 8px;
      }
      .rung {
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        padding: 8px 10px;
        margin: 0 0 8px;
      }
      .rung-head {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        padding-bottom: 6px;
      }
      .rung-head button.chip {
        padding: 4px 10px;
        min-height: 32px;
      }
      label.gap {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;
      }
      label.gap input {
        width: 76px;
        min-height: 34px;
        padding: 4px 8px;
      }
      .field {
        margin: 0 0 10px;
      }
    `,
  ];
}

customElements.define("boopli-ladders", BoopliLadders);
