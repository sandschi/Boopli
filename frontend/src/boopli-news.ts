import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { newsSeen } from "./api";
import { icon } from "./icon";
import { TIERS, TIER_METAL, achievementIcon, badgeJoke, badgeSentence, parseAchievement, type Badge } from "./achievements";
import { itemArt, itemName } from "./shop-art";
import type { Hass, Pet, ShopItem } from "./types";
import { t } from "./i18n";

/**
 * The news pop-up: one window for everything that happened since it was last shown, never a stack of them.
 * New achievements and level ups come in one list, with what they unlocked and one funny line. The integration
 * keeps what has been shown (pet.news), so it also appears for something reached while the panel was closed, or
 * on another screen, and it is gone for good once someone closed it.
 *
 * `hold` keeps it back while another window covers Today (the shop, the inventory, the quest pop-up).
 */
export class BoopliNews extends LitElement {
  static properties = {
    hass: { attribute: false },
    pet: { attribute: false },
    hold: { type: Boolean },
  };

  declare hass?: Hass;
  declare pet?: Pet;
  declare hold: boolean;

  private _closedKey = ""; // what the last close covered: it is not shown again from this screen even if the server could not be told
  private _closing = false;

  constructor() {
    super();
    this.hold = false;
  }

  private get _levelFrom(): number {
    return this.pet?.news?.celebrated_level ?? this.pet?.level ?? 1;
  }

  private _badges(): Badge[] {
    const known = (this.pet?.news?.achievements ?? []).map(parseAchievement).filter((b): b is Badge => b !== null);
    // the highest tier first
    return known.sort((a, b) => TIERS.indexOf((b.tier || "common") as (typeof TIERS)[number]) - TIERS.indexOf((a.tier || "common") as (typeof TIERS)[number]));
  }

  private _levelUp(): boolean {
    return !!this.pet && this.pet.level > this._levelFrom;
  }

  private _key(): string {
    return `${this.pet?.level ?? 0}|${(this.pet?.news?.achievements ?? []).join(",")}`;
  }

  /** Things that can be bought or used now and could not before: reached by this level or by one of the new achievements. */
  private _unlocks(): ShopItem[] {
    const pet = this.pet;
    if (!pet) return [];
    const fresh = new Set(pet.news?.achievements ?? []);
    return pet.items.filter(
      (i) =>
        i.kind !== "food" &&
        !i.owned &&
        i.locked === "" &&
        ((i.min_level > this._levelFrom && i.min_level <= pet.level && (!i.achievement || (pet.achievements ?? []).includes(i.achievement))) ||
          (i.achievement !== "" && fresh.has(i.achievement) && i.min_level <= pet.level))
    );
  }

  protected updated(_changed: PropertyValues): void {
    const dialog = this.renderRoot.querySelector<HTMLDialogElement>("dialog");
    if (dialog && !dialog.open) dialog.showModal();
    // achievements this panel does not know: nothing to show, but they must not stay unseen
    if (!this._levelUp() && this._badges().length === 0 && (this.pet?.news?.achievements.length ?? 0) > 0 && this._key() !== this._closedKey) void this._close();
  }

  /** Close (by the button, or by itself for achievements this panel does not know). The attempt is remembered either way, so a failed call is not repeated in a loop. */
  private async _close(): Promise<void> {
    if (!this.hass || !this.pet || this._closing) return;
    this._closing = true;
    const key = this._key();
    this._closedKey = key;
    this.requestUpdate(); // the window goes at once; the server is told in the background
    try {
      await newsSeen(this.hass, this.pet.level, this.pet.news?.achievements ?? []);
    } catch {
      // the server did not hear it: it shows again after a reload, but not in a loop here
    } finally {
      this._closing = false;
      this.requestUpdate();
    }
  }

  render() {
    const pet = this.pet;
    if (!pet || this.hold || this._key() === this._closedKey) return nothing;
    const badges = this._badges();
    const levelUp = this._levelUp();
    if (!levelUp && badges.length === 0) return nothing;
    const unlocks = this._unlocks();
    const title = levelUp && badges.length ? t("news.title_both") : levelUp ? t("news.title_level") : t("news.title_badge");
    const joke = badges.length ? badgeJoke(badges[0]) : t(`news.level_joke_${pet.level % 3}`);
    return html`<dialog
      aria-label=${title}
      @cancel=${(e: Event) => {
        e.preventDefault(); // Escape does what the button does: the server has to hear it first
        void this._close();
      }}
    >
      <h3>${title}</h3>
      <ul class="list">
        ${levelUp
          ? html`<li>
              <span class="medal level" aria-hidden="true">${pet.level}</span>
              <span class="what">${t("news.level_reached", { level: pet.level })}</span>
            </li>`
          : nothing}
        ${badges.map(
          (b) => html`<li>
            <span class="medal ${b.tier ? `t-${b.tier}` : ""}" style="background:${TIER_METAL[b.tier || "legendary"]}" aria-hidden="true">${icon(achievementIcon(b.series || b.id))}</span>
            <span class="what">${badgeSentence(b)}</span>
          </li>`
        )}
      </ul>
      <p class="joke">${joke}</p>
      ${unlocks.length
        ? html`<div class="unlocked">
            <h4>${t("news.unlocked")}</h4>
            <ul>
              ${unlocks.map((i) => html`<li><span class="pic">${itemArt(i.id)}</span><span>${itemName(i.id)}</span></li>`)}
            </ul>
          </div>`
        : nothing}
      <button type="button" class="primary" @click=${() => this._close()}>${t("news.ok")}</button>
    </dialog>`;
  }

  static styles = css`
    dialog {
      max-width: min(440px, 92vw);
      padding: 22px;
      border-radius: 16px;
      background: var(--card-background-color, #1c1c1c);
      color: var(--primary-text-color, #fff);
      border: 1px solid var(--divider-color, #444);
      animation: pop 0.35s cubic-bezier(0.2, 1.4, 0.4, 1);
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.55);
    }
    h3 {
      margin: 0 0 12px;
      font-size: 22px;
      text-align: center;
    }
    h4 {
      margin: 14px 0 6px;
      font-size: 14px;
      opacity: 0.75;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .list li,
    .unlocked li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
    }
    .medal {
      flex: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 800;
      font-size: 20px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
      position: relative;
      box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.45), inset 0 -5px 8px rgba(0, 0, 0, 0.22), 0 3px 8px rgba(0, 0, 0, 0.4);
    }
    .medal:not(.level)::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0) 52%);
      pointer-events: none;
    }
    .medal.level {
      background: var(--boopli-accent, var(--primary-color, #4a90e2));
    }
    .medal ha-icon {
      --mdc-icon-size: 24px;
      display: flex;
    }
    .medal.t-epic {
      box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.35), 0 0 10px 2px rgba(176, 127, 224, 0.7);
    }
    .medal.t-legendary {
      box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.55), 0 0 14px 4px rgba(247, 213, 106, 0.85);
    }
    .what {
      font-weight: 600;
      line-height: 1.3;
    }
    .joke {
      margin: 10px 0 0;
      text-align: center;
      font-style: italic;
      opacity: 0.85;
      line-height: 1.4;
    }
    .unlocked li {
      font-weight: 500;
    }
    .pic {
      flex: none;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pic svg {
      width: 100%;
      height: 100%;
    }
    .pic .swatch {
      display: block;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.4), 0 1px 3px rgba(0, 0, 0, 0.35);
    }
    button.primary {
      display: block;
      margin: 18px auto 0;
      padding: 10px 28px;
      border: 0;
      border-radius: 999px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      background: var(--boopli-accent, var(--primary-color, #4a90e2));
      color: var(--boopli-accent-ink, var(--text-primary-color, #fff));
    }
    @keyframes pop {
      from {
        transform: scale(0.85);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      dialog {
        animation: none;
      }
    }
  `;
}

customElements.define("boopli-news", BoopliNews);
