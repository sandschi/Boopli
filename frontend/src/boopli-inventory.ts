import { LitElement, html, css, nothing } from "lit";
import { errorMessage, feedPet, shopPlace } from "./api";
import { icon } from "./icon";
import { modalStyles } from "./modal-styles";
import { foodArt, itemArt, itemName } from "./shop-art";
import { sharedStyles } from "./styles";
import type { FoodSize, Hass, Pet, ShopItem } from "./types";
import { t } from "./i18n";

const FOOD_SIZES: FoodSize[] = ["small", "medium", "big"];

/**
 * What the household owns, in its own window: the food stock (fed from here), the colours and patterns to
 * put on the wall and the floor, and the other things that stand in the room. Fires `inventory-close`,
 * and `open-shop` from the "to the shop" link.
 */
export class BoopliInventory extends LitElement {
  static properties = {
    hass: { attribute: false },
    pet: { attribute: false },
    open: { type: Boolean },
    _busy: { state: true },
    _error: { state: true },
    _note: { state: true },
  };

  declare hass?: Hass;
  declare pet?: Pet;
  declare open: boolean;
  declare _busy: boolean;
  declare _error: string;
  declare _note: string;

  constructor() {
    super();
    this.open = false;
    this._busy = false;
    this._error = "";
    this._note = "";
  }

  protected updated(changed: Map<string, unknown>): void {
    if (!changed.has("open")) return;
    const dialog = this.renderRoot.querySelector("dialog");
    if (!dialog) return;
    if (this.open && !dialog.open) {
      this._error = "";
      this._note = "";
      dialog.showModal();
    } else if (!this.open && dialog.open) dialog.close();
  }

  private _close(): void {
    this.dispatchEvent(new CustomEvent("inventory-close", { bubbles: true, composed: true }));
  }

  private _toShop(): void {
    this.dispatchEvent(new CustomEvent("open-shop", { bubbles: true, composed: true }));
  }

  private async _run(job: () => Promise<void>, note = ""): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = true;
    this._error = "";
    this._note = "";
    try {
      await job();
      this._note = note;
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = false;
    }
  }

  private _feed(size: FoodSize, item?: ShopItem): void {
    void this._run(() => feedPet(this.hass!, size), t("inventory.fed_xp", { xp: item?.xp ?? 0 }));
  }

  private _place(place: "wall" | "floor", id: string): void {
    void this._run(() => shopPlace(this.hass!, place, id));
  }

  private _food(pet: Pet) {
    const full = pet.meals_today >= pet.meals_max;
    const any = FOOD_SIZES.some((s) => (pet.food[s] ?? 0) > 0);
    // Three big buttons, one per food: press the food to feed it. A size you have none of stays, dimmed, so nothing jumps around.
    return html`<div class="group">
      <h4>${t("inventory.food")}</h4>
      <p class="muted small meals">
        ${full ? t("common.is_full_for_today", { name: pet.name }) : t("common.meals_today", { eaten: pet.meals_today, max: pet.meals_max })}
      </p>
      <div class="tiles">
        ${FOOD_SIZES.map((size) => {
          const item = pet.items.find((i) => i.food === size);
          const count = pet.food[size] ?? 0;
          const name = itemName(`food_${size}`);
          return html`<button
            type="button"
            class="tile"
            ?disabled=${full || count <= 0 || this._busy}
            aria-label="${name} · ${t("inventory.n_in_stock", { count })} · ${t("shop.gives_xp", { xp: item?.xp ?? 0 })}"
            @click=${() => this._feed(size, item)}
          >
            <span class="count" aria-hidden="true">${count}</span>
            <span class="pic">${foodArt(size)}</span>
            <span class="tname">${name}</span>
            <span class="txp">${t("inventory.fed_xp", { xp: item?.xp ?? 0 })}</span>
          </button>`;
        })}
      </div>
      ${any ? nothing : html`<p class="muted">${t("inventory.no_food_yet")}</p>`}
      <button type="button" class="textlink" @click=${() => this._toShop()}>${t("inventory.to_the_shop")}</button>
    </div>`;
  }

  /** Wall or floor: tiles of the owned colours and patterns, and "plain". */
  private _paint(pet: Pet, place: "wall" | "floor", title: string) {
    const looks = pet.items.filter((i) => (i.kind === "color" || i.kind === "pattern") && i.owned);
    const current = pet.placed[place] ?? "";
    return html`<div class="place">
      <div class="label">${title}</div>
      <div class="tiles small-tiles" role="group" aria-label=${title}>
        <button type="button" class="tile ${current === "" ? "on" : ""}" aria-pressed=${current === ""} ?disabled=${this._busy} @click=${() => this._place(place, "")}>
          <span class="pic"><span class="swatch plain"></span></span>
          <span class="tname">${t("inventory.plain")}</span>
        </button>
        ${looks.map(
          (i) => html`<button
            type="button"
            class="tile ${current === i.id ? "on" : ""}"
            aria-pressed=${current === i.id}
            ?disabled=${this._busy}
            @click=${() => this._place(place, i.id)}
          >
            <span class="pic">${itemArt(i.id)}</span>
            <span class="tname">${itemName(i.id)}</span>
          </button>`
        )}
      </div>
    </div>`;
  }

  private _room(pet: Pet) {
    const things = pet.items.filter((i) => i.owned && i.kind === "extra");
    const looks = pet.items.some((i) => (i.kind === "color" || i.kind === "pattern") && i.owned);
    return html`<div class="group">
      <h4>${t("inventory.room")}</h4>
      ${looks
        ? html`${this._paint(pet, "wall", t("inventory.wall"))}${this._paint(pet, "floor", t("inventory.floor"))}`
        : html`<p class="muted">${t("inventory.no_colours_or_patterns_yet")}</p>`}
      ${things.length
        ? html`<div class="tiles small-tiles things">
            ${things.map(
              (i) => html`<div class="tile static">
                <span class="pic">${itemArt(i.id)}</span>
                <span class="tname">${itemName(i.id)}</span>
              </div>`
            )}
          </div>`
        : nothing}
    </div>`;
  }

  render() {
    const pet = this.pet;
    return html`<dialog
      aria-label=${t("inventory.inventory")}
      @close=${() => this.open && this._close()}
      @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) this._close();
      }}
    >
      ${pet
        ? html`<div class="win">
            <div class="head">
              <h3>${icon("bag-personal-outline")} ${t("inventory.inventory")}</h3>
              <button type="button" class="close" aria-label=${t("common.close")} @click=${() => this._close()}>✕</button>
            </div>
            ${this._note ? html`<p class="muted" role="status">${this._note}</p>` : nothing}
            ${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}
            ${this._food(pet)}${this._room(pet)}
            <div class="actions"><button type="button" @click=${() => this._close()}>${t("common.close")}</button></div>
          </div>`
        : nothing}
    </dialog>`;
  }

  static styles = [
    sharedStyles,
    modalStyles,
    css`
      .small {
        font-size: 16px;
      }
      .meals {
        margin: 0 0 6px;
      }
      .place {
        margin-bottom: 10px;
      }
      .label {
        font-weight: 500;
        margin-bottom: 6px;
      }
      .small-tiles {
        grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
      }
      .small-tiles .tile {
        min-height: 0;
        padding-bottom: 10px;
      }
      .things {
        margin-top: 10px;
      }
    `,
  ];
}

customElements.define("boopli-inventory", BoopliInventory);
