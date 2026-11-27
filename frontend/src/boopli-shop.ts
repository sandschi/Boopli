import { LitElement, html, css, nothing } from "lit";
import { errorMessage, shopBuy } from "./api";
import { icon } from "./icon";
import { modalStyles } from "./modal-styles";
import { coin, itemArt, itemName } from "./shop-art";
import { sharedStyles } from "./styles";
import type { Hass, Pet, ShopItem } from "./types";
import { t } from "./i18n";

/** The groups of the shop, in the order they are shown. */
const GROUPS: { id: string; title: () => string; kinds: ShopItem["kind"][] }[] = [
  { id: "food", title: () => t("shop.food"), kinds: ["food"] },
  { id: "room", title: () => t("shop.for_the_room"), kinds: ["extra"] },
  { id: "looks", title: () => t("shop.wall_and_floor"), kinds: ["color", "pattern"] },
  { id: "upgrades", title: () => t("shop.upgrades"), kinds: ["upgrade"] },
];

/**
 * The shop, in its own window. It sells what the integration lists (`pet.items`): food again and again,
 * everything else once (a bought item is gone from here and shows up in the inventory). A locked item says why.
 * Fires `shop-close`.
 */
export class BoopliShop extends LitElement {
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
  declare _busy: string; // the id of the item being bought
  declare _error: string;
  declare _note: string;

  constructor() {
    super();
    this.open = false;
    this._busy = "";
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
    this.dispatchEvent(new CustomEvent("shop-close", { bubbles: true, composed: true }));
  }

  private async _buy(item: ShopItem): Promise<void> {
    if (!this.hass || this._busy) return;
    this._busy = item.id;
    this._error = "";
    this._note = "";
    try {
      await shopBuy(this.hass, item.id);
      this._note = t("shop.is_yours", { item: itemName(item.id) });
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

  private _row(item: ShopItem, pet: Pet) {
    const why = this._why(item, pet);
    const blocked = item.locked !== "";
    return html`<div class="row ${blocked ? "locked" : ""}">
      <div class="art">${itemArt(item.id)}</div>
      <div class="text">
        <div class="name">${itemName(item.id)}</div>
        <div class="note">
          ${item.food ? t("shop.gives_xp", { xp: item.xp }) : nothing}${why && !item.food ? why : nothing}${why && item.food ? html` · ${why}` : nothing}
        </div>
      </div>
      <div class="act">
        <button
          type="button"
          class="primary"
          ?disabled=${blocked || item.price > pet.blubs || !!this._busy}
          aria-label=${t("shop.buy_item_for", { item: itemName(item.id), price: item.price })}
          @click=${() => this._buy(item)}
        >
          ${coin()} ${item.price}
        </button>
      </div>
    </div>`;
  }

  render() {
    const pet = this.pet;
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
              <button type="button" class="close" aria-label=${t("common.close")} @click=${() => this._close()}>✕</button>
            </div>
            ${this._note ? html`<p class="muted" role="status">${this._note}</p>` : nothing}
            ${this._error ? html`<p class="error" role="alert">${this._error}</p>` : nothing}
            ${GROUPS.map((g) => {
              const items = pet.items
                .filter((i) => g.kinds.includes(i.kind) && (!i.owned || i.kind === "food"))
                .sort((a, b) => a.price - b.price);
              if (!items.length) return nothing;
              return html`<div class="group">
                <h4>${g.title()}</h4>
                <div class="rows">${items.map((i) => this._row(i, pet))}</div>
              </div>`;
            })}
            <div class="actions"><button type="button" @click=${() => this._close()}>${t("common.close")}</button></div>
          </div>`
        : nothing}
    </dialog>`;
  }

  static styles = [
    sharedStyles,
    modalStyles,
    css`
      .row.locked .art,
      .row.locked .name {
        opacity: 0.55;
      }
    `,
  ];
}

customElements.define("boopli-shop", BoopliShop);
