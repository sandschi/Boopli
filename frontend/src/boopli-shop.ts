import { LitElement, html, css, nothing } from "lit";
import { errorMessage, shopBuy } from "./api";
import { icon } from "./icon";
import { modalStyles } from "./modal-styles";
import { coin, itemArt, itemName } from "./shop-art";
import { sharedStyles } from "./styles";
import type { Hass, Pet, ShopItem } from "./types";
import { t } from "./i18n";

/** The groups of the shop, in the order they are shown (one at a time, picked at the top). */
const GROUPS: { id: string; icon: string; title: () => string; kinds: ShopItem["kind"][] }[] = [
  { id: "food", icon: "bowl-mix-outline", title: () => t("shop.food"), kinds: ["food"] },
  { id: "room", icon: "sofa-outline", title: () => t("shop.for_the_room"), kinds: ["extra"] },
  { id: "looks", icon: "palette-outline", title: () => t("shop.wall_and_floor"), kinds: ["color", "pattern"] },
  { id: "upgrades", icon: "arrow-up-bold-circle-outline", title: () => t("shop.upgrades"), kinds: ["upgrade"] },
];

/**
 * The shop, in its own window. It sells what the integration lists (`pet.items`): food again and again,
 * everything else once (a bought item is gone from here and shows up in the inventory). Pick a group at the top,
 * choose a slot, and the bar at the bottom says what it is, why it is locked (if so) and has the buy button.
 * Fires `shop-close`, and `open-inventory` from the inventory button.
 */
export class BoopliShop extends LitElement {
  static properties = {
    hass: { attribute: false },
    pet: { attribute: false },
    open: { type: Boolean },
    _busy: { state: true },
    _error: { state: true },
    _note: { state: true },
    _cat: { state: true },
    _sel: { state: true },
  };

  declare hass?: Hass;
  declare pet?: Pet;
  declare open: boolean;
  declare _busy: string; // the id of the item being bought
  declare _error: string;
  declare _note: string;
  declare _cat: string; // the shown group
  declare _sel: string; // the chosen item

  constructor() {
    super();
    this.open = false;
    this._busy = "";
    this._error = "";
    this._note = "";
    this._cat = "";
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
    this.dispatchEvent(new CustomEvent("shop-close", { bubbles: true, composed: true }));
  }

  private _toInventory(): void {
    this.dispatchEvent(new CustomEvent("open-inventory", { bubbles: true, composed: true }));
  }

  private async _buy(item: ShopItem): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = item.id;
    this._error = "";
    this._note = "";
    try {
      await shopBuy(this.hass, item.id);
      this._note = t("shop.is_yours", { item: itemName(item.id) });
      if (!item.food && this._sel === item.id) this._sel = ""; // a bought thing leaves the shop
    } catch (err) {
      this._error = errorMessage(err);
    } finally {
      this._busy = "";
    }
  }

  /** Why an item cannot be bought right now, in words ("" = it can). */
  private _why(item: ShopItem, pet: Pet): string {
    if (item.locked === "level") return t("shop.from_level", { level: item.min_level });
    if (item.locked === "achievement") return t("shop.needs_an_achievement");
    if (item.locked === "requires") return t("shop.needs_something_first");
    if (item.price > pet.blubs) return t("shop.not_enough_blubs_yet");
    return "";
  }

  /** One slot: the picture big, the price as a tag under it, a lock when something is in the way. */
  private _slot(item: ShopItem, pet: Pet) {
    const dim = item.locked !== "" || item.price > pet.blubs;
    return html`<button
      type="button"
      class="slot ${this._sel === item.id ? "sel" : ""} ${dim ? "dim" : ""}"
      aria-pressed=${this._sel === item.id}
      aria-label=${itemName(item.id)}
      @click=${() => (this._sel = item.id)}
    >
      ${item.locked !== "" ? html`<span class="lock">${icon("lock-outline")}</span>` : nothing}
      <span class="pic">${itemArt(item.id)}</span>
      <span class="tag">${coin()} ${item.price}</span>
    </button>`;
  }

  /** The bar at the bottom: what is chosen, what is in the way, and the buy button. */
  private _detail(pet: Pet) {
    const item = pet.items.find((i) => i.id === this._sel);
    if (!item) return html`<div class="detail"><span class="dtext muted">${t("shop.tap_something_to_see_more")}</span></div>`;
    const why = this._why(item, pet);
    const blocked = item.locked !== "" || item.price > pet.blubs || !!this._busy;
    return html`<div class="detail">
      <span class="dpic">${itemArt(item.id)}</span>
      <span class="dtext">
        <div class="dname">${itemName(item.id)}</div>
        <div class="dnote">${item.food ? t("inventory.fed_xp", { xp: item.xp }) : nothing} ${why}</div>
      </span>
      <button
        type="button"
        class="go"
        ?disabled=${blocked}
        aria-label=${t("shop.buy_item_for", { item: itemName(item.id), price: item.price })}
        @click=${() => this._buy(item)}
      >
        ${t("shop.buy")} ${coin()} ${item.price}
      </button>
    </div>`;
  }

  render() {
    const pet = this.pet;
    const groups = pet
      ? GROUPS.map((g) => ({
          ...g,
          items: pet.items.filter((i) => g.kinds.includes(i.kind) && (!i.owned || i.kind === "food")).sort((a, b) => a.price - b.price),
        })).filter((g) => g.items.length)
      : [];
    const group = groups.find((g) => g.id === this._cat) ?? groups[0];
    return html`<dialog
      aria-label=${t("shop.shop")}
      @close=${() => this.open && this._close()}
      @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) this._close(); // a click on the dark area around the window
      }}
    >
      ${pet
        ? html`<div class="win">
            <div class="head">
              <h3>${icon("store-outline")} ${t("shop.shop")}</h3>
              <span class="wallet" title=${t("shop.your_blubs")}>${coin()} ${t("shop.n_blubs", { count: pet.blubs })}</span>
              <button type="button" class="shopbtn" aria-label=${t("inventory.inventory")} @click=${() => this._toInventory()}>${icon("bag-personal-outline")}<span class="lbl">${t("inventory.inventory")}</span></button>
              <button type="button" class="close" aria-label=${t("common.close")} @click=${() => this._close()}>✕</button>
            </div>
            <div class="cats" role="group" aria-label=${t("shop.shop")}>
              ${groups.map(
                (g) => html`<button
                  type="button"
                  class="cat ${g === group ? "on" : ""}"
                  aria-pressed=${g === group}
                  @click=${() => {
                    this._cat = g.id;
                    this._sel = "";
                  }}
                >
                  ${icon(g.icon)}<span>${g.title()}</span>
                </button>`
              )}
            </div>
            <div class="body">
              ${this._note ? html`<p class="muted note" role="status">${this._note}</p>` : nothing}
              ${this._error ? html`<p class="error note" role="alert">${this._error}</p>` : nothing}
              ${group ? html`<div class="slots">${group.items.map((i) => this._slot(i, pet))}</div>` : nothing}
            </div>
            ${this._detail(pet)}
          </div>`
        : nothing}
    </dialog>`;
  }

  static styles = [
    sharedStyles,
    modalStyles,
    css`
      .cat span {
        white-space: nowrap;
      }
    `,
  ];
}

customElements.define("boopli-shop", BoopliShop);
