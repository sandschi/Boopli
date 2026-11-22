import { LitElement, html, css } from "lit";
import "./boopli-pet";
import { sharedStyles } from "./styles";
import { MOODS, PETS, petInfo } from "./pets";

/**
 * Choose a pet. Each pet is a small picture you press; below, the chosen one in all five moods.
 * Fires `pet-kind-change` with the pet's kind.
 */
export class BoopliPetPicker extends LitElement {
  static properties = {
    value: { type: String },
    moods: { type: Boolean },
  };

  declare value: string;
  /** Also show the chosen pet in all five moods. */
  declare moods: boolean;

  constructor() {
    super();
    this.value = "slime";
    this.moods = false;
  }

  private _pick(kind: string): void {
    this.dispatchEvent(new CustomEvent("pet-kind-change", { detail: kind, bubbles: true, composed: true }));
  }

  /** The arrow keys, Home and End move between the pets and choose, like any radio group. */
  private _key(e: KeyboardEvent, index: number): void {
    const last = PETS.length - 1;
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    this._pick(PETS[next].kind);
    (this.shadowRoot?.querySelectorAll<HTMLElement>("button.choice")[next])?.focus();
  }

  render() {
    const chosen = petInfo(this.value);
    return html`
      <div class="grid" role="radiogroup" aria-label="Your pet">
        ${PETS.map(
          (p, i) => html`<button
            type="button"
            role="radio"
            class="choice ${p.kind === chosen.kind ? "on" : ""}"
            aria-checked=${p.kind === chosen.kind}
            tabindex=${p.kind === chosen.kind ? 0 : -1}
            @click=${() => this._pick(p.kind)}
            @keydown=${(e: KeyboardEvent) => this._key(e, i)}
          >
            <span class="pic"><boopli-pet .kind=${p.kind} .mood=${"content"} still></boopli-pet></span>
            <span class="name">${p.label}</span>
            ${p.art ? "" : html`<span class="soon">art soon</span>`}
          </button>`
        )}
      </div>
      ${this.moods
        ? html`<div class="moods" aria-label="${chosen.label} in every mood">
            ${MOODS.map(
              (m) => html`<div class="mood">
                <span class="pic"><boopli-pet .kind=${chosen.kind} .mood=${m} still></boopli-pet></span>
                <span class="small muted">${m}</span>
              </div>`
            )}
          </div>`
        : ""}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
        gap: 10px;
      }
      .choice {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 6px 8px;
        border-radius: 14px;
        border: 2px solid var(--divider-color, #444);
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
      }
      .choice.on {
        border-color: var(--primary-color, #03a9f4);
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent);
      }
      .pic {
        display: block;
        width: 64px;
        height: 64px;
      }
      .name {
        font-weight: 500;
      }
      .soon {
        font-size: 12px;
        opacity: 0.65;
      }
      .moods {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 12px;
      }
      .mood {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 72px;
      }
      .mood .pic {
        width: 56px;
        height: 56px;
      }
      .small {
        font-size: 13px;
      }
    `,
  ];
}

customElements.define("boopli-pet-picker", BoopliPetPicker);
