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
 * What the household owns, in its own window: the food stock, the colours and patterns for the wall and the floor,
 * and the other things that stand in the room. Choose a slot and the bar at the bottom says what it is and offers
 * the one thing to do with it (feed, use). Fires `inventory-close`, and `open-shop` from the "to the shop" link.
 * The chosen slot is `kind:id`: `food:small`, `wall:<id>`, `floor:<id>` (an empty id = plain), `thing:<id>`.
 */
export class BoopliInventory extends LitElement {
  static properties = {
    hass: { attribute: false },
    pet: { attribute: false },
    open: { type: Boolean },
    _busy: { state: true },
    _error: { state: true },
    _note: { state: true },
    _sel: { state: true },
  };

  declare hass?: Hass;
  declare pet?: Pet;
  declare open: boolean;
  declare _busy: boolean;
  declare _error: string;
  declare _note: string;
  declare _sel: string;

  constructor() {
    super();
    this.open = false;
    this._busy = false;
    this._error = "";
    this._note = "";
    this._sel = "";
  }

  protected updated(changed: Map<string, unknown>): void {
    if (!changed.has("open")) return;
    const dialog = this.renderRoot.querySelector("dialog");
    if (!dialog) return;
    if (this.open && !dialog.open) {
      this._error = "";
      this._note = "";
      this._sel = "";
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

  /** One slot. `mark` is the small badge in the corner (the count, or a tick for what is in use). */
  private _slot(key: string, label: string, art: unknown, mark: string | number = "", dim = false) {
    return html`<button
      type="button"
      class="slot ${this._sel === key ? "sel" : ""} ${dim ? "dim" : ""}"
      aria-pressed=${this._sel === key}
      aria-label=${label}
      @click=${() => (this._sel = key)}
    >
      <span class="pic">${art}</span>
      ${mark !== "" ? html`<span class="mark" aria-hidden="true">${mark}</span>` : nothing}
    </button>`;
  }

  private _food(pet: Pet) {
    const full = pet.meals_today >= pet.meals_max;
    const any = FOOD_SIZES.some((s) => (pet.food[s] ?? 0) > 0);
    return html`<div class="group">
      <h4>${t("inventory.food")}</h4>
      <p class="muted meals">
        ${full ? t("common.is_full_for_today", { name: pet.name }) : t("common.meals_today", { eaten: pet.meals_today, max: pet.meals_max })}
      </p>
      <div class="slots">
        ${FOOD_SIZES.map((size) => {
          const count = pet.food[size] ?? 0;
          return this._slot(`food:${size}`, `${itemName(`food_${size}`)} · ${t("inventory.n_in_stock", { count })}`, foodArt(size), count, count <= 0);
        })}
      </div>
      ${any ? nothing : html`<p class="muted">${t("inventory.no_food_yet")}</p>`}
    </div>`;
  }

  /** Wall or floor: slots of the owned colours and patterns, and "plain". A tick marks what is in use. */
  private _paint(pet: Pet, place: "wall" | "floor", title: string) {
    const looks = pet.items.filter((i) => (i.kind === "color" || i.kind === "pattern") && i.owned);
    const current = pet.placed[place] ?? "";
    return html`<div class="group">
      <h4>${title}</h4>
      <div class="slots" role="group" aria-label=${title}>
        ${this._slot(`${place}:`, t("inventory.plain"), html`<span class="swatch plain"></span>`, current === "" ? "✓" : "")}
        ${looks.map((i) => this._slot(`${place}:${i.id}`, itemName(i.id), itemArt(i.id), current === i.id ? "✓" : ""))}
      </div>
    </div>`;
  }

  private _room(pet: Pet) {
    const things = pet.items.filter((i) => i.owned && i.kind === "extra");
    const looks = pet.items.some((i) => (i.kind === "color" || i.kind === "pattern") && i.owned);
    return html`<div class="group">
        <h4>${t("inventory.room")}</h4>
        ${looks ? nothing : html`<p class="muted">${t("inventory.no_colours_or_patterns_yet")}</p>`}
      </div>
      ${looks ? html`${this._paint(pet, "wall", t("inventory.wall"))}${this._paint(pet, "floor", t("inventory.floor"))}` : nothing}
      ${things.length
        ? html`<div class="group">
            <h4>${t("inventory.unlocked")}</h4>
            <div class="slots">${things.map((i) => this._slot(`thing:${i.id}`, itemName(i.id), itemArt(i.id), "", true))}</div>
          </div>`
        : nothing}`;
  }

  /** The bar at the bottom: the chosen slot and the one thing to do with it. */
  private _detail(pet: Pet) {
    const [kind, ...rest] = this._sel.split(":");
    const id = rest.join(":");
    if (!this._sel) return html`<div class="detail"><span class="dtext muted">${t("inventory.tap_something_to_see_more")}</span></div>`;
    if (kind === "food") {
      const size = id as FoodSize;
      const item = pet.items.find((i) => i.food === size);
      const count = pet.food[size] ?? 0;
      const full = pet.meals_today >= pet.meals_max;
      return html`<div class="detail">
        <span class="dpic">${foodArt(size)}</span>
        <span class="dtext">
          <div class="dname">${itemName(`food_${size}`)}</div>
          <div class="dnote">${t("inventory.fed_xp", { xp: item?.xp ?? 0 })} · ${t("inventory.n_in_stock", { count })}</div>
        </span>
        <button type="button" class="go" ?disabled=${full || count <= 0 || this._busy} @click=${() => this._feed(size, item)}>${t("inventory.feed")}</button>
      </div>`;
    }
    if (kind === "wall" || kind === "floor") {
      const inUse = (pet.placed[kind] ?? "") === id;
      const name = id ? itemName(id) : t("inventory.plain");
      return html`<div class="detail">
        <span class="dpic">${id ? itemArt(id) : html`<span class="swatch plain"></span>`}</span>
        <span class="dtext">
          <div class="dname">${name}</div>
          <div class="dnote">${kind === "wall" ? t("inventory.wall") : t("inventory.floor")}</div>
        </span>
        <button type="button" class="go" ?disabled=${inUse || this._busy} @click=${() => this._place(kind, id)}>
          ${inUse ? t("inventory.in_use") : t("inventory.use")}
        </button>
      </div>`;
    }
    return html`<div class="detail">
      <span class="dpic">${itemArt(id)}</span>
      <span class="dtext"><div class="dname">${itemName(id)}</div></span>
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
              <button type="button" class="shopbtn" @click=${() => this._toShop()}>${icon("store-outline")} ${t("inventory.to_the_shop")}</button>
              <button type="button" class="close" aria-label=${t("common.close")} @click=${() => this._close()}>✕</button>
            </div>
            <div class="body">
              ${this._note ? html`<p class="muted note" role="status">${this._note}</p>` : nothing}
              ${this._error ? html`<p class="error note" role="alert">${this._error}</p>` : nothing}
              ${this._food(pet)}${this._room(pet)}            </div>
            ${this._detail(pet)}
          </div>`
        : nothing}
    </dialog>`;
  }

  static styles = [
    sharedStyles,
    modalStyles,
    css`
      .meals {
        margin: 0 0 6px;
      }
    `,
  ];
}

customElements.define("boopli-inventory", BoopliInventory);
