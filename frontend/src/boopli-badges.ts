import { LitElement, html, css } from "lit";
import { TIERS, TIER_COLOR, TIER_METAL, achievementIcon, type Tier } from "./achievements";
import { icon } from "./icon";
import { sharedStyles } from "./styles";
import type { Snapshot } from "./types";
import { t } from "./i18n";

/** Each series has its own colour theme (the card, its big watermark and the bar take it). */
const HUE: Record<string, string> = {
  steps: "#4f9cf0",
  chores: "#2fc4a4",
  meals: "#f2a03d",
  streak: "#f0614a",
  level: "#a46bf0",
};
const HUE_OTHER = "#e0a84a";

/**
 * The achievements page: a header with the total, then one card for each achievement series with its own colour,
 * a big symbol, glossy medals (earned ones in their tier colour, the rest in dark sockets, the next one pulsing),
 * a bar to the next medal and what it needs. Below it the one-time achievements. The secret one (the Easter egg)
 * stays out of sight until it has been found. Everything comes from the integration's own list (pet.badges), so a
 * new tier or series shows up here without a change in this file (only its texts and a symbol).
 */
export class BoopliBadges extends LitElement {
  static properties = {
    snapshot: { attribute: false },
  };

  declare snapshot?: Snapshot;

  private _medal(tier: Tier, reached: boolean, isNext: boolean, target: number, symbol: string) {
    const label = `${t(`badges.tier_${tier}`)}: ${target}`;
    return html`<li class="medal-box ${reached ? "got" : ""} ${isNext ? "next" : ""}" title=${label}>
      <span
        class="medal t-${tier}"
        style=${reached ? `background:${TIER_METAL[tier]}` : ""}
        role="img"
        aria-label=${`${label}${reached ? `, ${t("badges.earned")}` : ""}`}
        >${icon(symbol)}</span
      >
      <span class="target">${target}</span>
    </li>`;
  }

  render() {
    const pet = this.snapshot?.pet;
    const badges = pet?.badges;
    if (!pet || !badges) return html`<p class="muted">${t("common.loading")}</p>`;
    const reached = new Set(pet.achievements ?? []);
    const singles = badges.singles.filter((b) => reached.has(b.id) || b.id !== "egg"); // the secret one stays secret until found
    const total = badges.series.reduce((n, s) => n + s.targets.length, 0) + singles.length;
    const earned =
      badges.series.reduce((n, s) => n + s.targets.filter((_, i) => reached.has(`${s.id}_${TIERS[i]}`)).length, 0) +
      singles.filter((b) => reached.has(b.id)).length;
    return html`
      <h2>${t("badges.title")}</h2>
      <p class="intro muted">${t("badges.intro")}</p>
      <section class="hero" aria-label=${t("badges.total", { n: earned, m: total })}>
        <span class="trophy" aria-hidden="true">${icon("trophy")}</span>
        <div class="herotext">
          <div class="bignum"><b>${earned}</b> / ${total}</div>
          <div class="herobar"><div class="herofill" style=${`width:${total ? (earned / total) * 100 : 0}%`}></div></div>
          <div class="herolabel">${t("badges.total", { n: earned, m: total })}</div>
        </div>
      </section>
      <div class="series">
        ${badges.series.map((s) => {
          const count = badges.counts[s.stat] ?? 0;
          const isReached = (i: number) => reached.has(`${s.id}_${TIERS[i]}`);
          const nextIndex = s.targets.findIndex((_, i) => !isReached(i));
          const next = nextIndex === -1 ? undefined : s.targets[nextIndex];
          const done = s.targets.filter((_, i) => isReached(i)).length;
          const top = done > 0 ? TIERS[Math.max(...s.targets.map((_, i) => (isReached(i) ? i : -1)))] : "";
          const from = nextIndex > 0 ? s.targets[nextIndex - 1] : 0;
          const pct = next === undefined ? 100 : Math.max(0, Math.min(100, ((count - from) / (next - from)) * 100));
          const symbol = achievementIcon(s.id);
          const barColor = nextIndex === -1 ? TIER_COLOR.legendary : TIER_COLOR[TIERS[nextIndex]];
          return html`<section class="card top-${top}" style=${`--hue:${HUE[s.id] ?? HUE_OTHER}`}>
            <span class="mark" aria-hidden="true">${icon(symbol)}</span>
            <div class="head">
              <span class="seal" aria-hidden="true">${icon(symbol)}</span>
              <div class="titles">
                <h3>${t(`news.series_${s.id}`)}</h3>
                <p class="about">${t(`badges.about_${s.id}`)}</p>
              </div>
              <span class="count">${count}</span>
            </div>
            <ul class="medals">
              ${s.targets.map((target, i) => this._medal(TIERS[i], isReached(i), i === nextIndex, target, symbol))}
            </ul>
            <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(pct)} aria-label=${t(`news.series_${s.id}`)}>
              <div class="fill" style=${`width:${pct}%;background:${barColor}`}></div>
            </div>
            <p class="nextline">
              <span>${next === undefined ? t("badges.all_earned") : t("badges.next", { target: next, left: Math.max(0, next - count) })}</span>
              <span class="nofm">${t("badges.n_of_m", { n: done, m: s.targets.length })}</span>
            </p>
          </section>`;
        })}
      </div>
      <h3 class="oneoffs">${t("badges.one_offs")}</h3>
      <ul class="singles">
        ${singles.map((b) => {
          const got = reached.has(b.id);
          return html`<li class=${got ? "got" : ""} style=${`--hue:${HUE_OTHER}`}>
            <span class="medal small" style=${got ? `background:${TIER_METAL.legendary}` : ""} aria-hidden="true">${icon(achievementIcon(b.id))}</span>
            <span>${got ? t(`news.single_${b.id}`) : t(`badges.hint_${b.id}`)}</span>
          </li>`;
        })}
      </ul>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        --pane: var(--card-background-color, #1c1c1c);
      }
      h2 {
        font-size: 24px;
        margin-bottom: 4px;
      }
      .intro {
        max-width: 720px;
        margin: 0 0 14px;
        line-height: 1.45;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      /* The header: the total, big. */
      .hero {
        display: flex;
        align-items: center;
        gap: 18px;
        margin-bottom: 18px;
        padding: 16px 20px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: linear-gradient(120deg, rgba(79, 156, 240, 0.35), rgba(164, 107, 240, 0.35) 55%, rgba(242, 160, 61, 0.35)), var(--pane);
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.3);
      }
      .trophy {
        flex: none;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        position: relative;
        overflow: hidden;
        background: linear-gradient(140deg, #fff6c2 0%, #f6cf55 22%, #b2801a 50%, #f9e286 72%, #c89322 100%);
        box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.5), inset 0 -8px 12px rgba(0, 0, 0, 0.25), 0 4px 14px rgba(0, 0, 0, 0.45), 0 0 22px 2px rgba(247, 213, 106, 0.35);
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
      }
      .trophy::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0) 50%);
        pointer-events: none;
      }
      .trophy::before {
        content: "";
        position: absolute;
        top: -20%;
        bottom: -20%;
        width: 35%;
        left: -60%;
        transform: skewX(-20deg);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        animation: shine 4s ease-in-out infinite;
      }
      .trophy ha-icon {
        --mdc-icon-size: 36px;
        display: flex;
        position: relative;
        z-index: 1;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
      }
      .herotext {
        flex: 1;
        min-width: 0;
      }
      .bignum {
        font-size: 18px;
        color: var(--secondary-text-color);
      }
      .bignum b {
        font-size: 34px;
        color: var(--primary-text-color);
      }
      .herobar {
        height: 12px;
        margin: 6px 0 4px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.35);
        overflow: hidden;
      }
      .herofill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #6aa8f0, #b07fe0, #f7d56a);
        transition: width 0.6s ease;
      }
      .herolabel {
        font-size: 15px;
        color: var(--secondary-text-color);
      }

      /* One card for each series, in its own colour. */
      .series {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, max(340px, calc((100% - 32px) / 3))), 1fr));
        gap: 16px;
        align-items: stretch;
      }
      .card {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 16px 18px 14px;
        border-radius: 20px;
        border: 1px solid color-mix(in srgb, var(--hue) 50%, transparent);
        background: linear-gradient(155deg, color-mix(in srgb, var(--hue) 26%, var(--pane)), var(--pane) 62%);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
      }
      .card.top-epic {
        box-shadow: 0 0 0 1px rgba(176, 127, 224, 0.7), 0 4px 22px rgba(176, 127, 224, 0.35);
      }
      .card.top-legendary {
        box-shadow: 0 0 0 1px rgba(247, 213, 106, 0.85), 0 4px 26px rgba(247, 213, 106, 0.4);
      }
      .mark {
        position: absolute;
        right: -14px;
        top: -14px;
        color: var(--hue);
        opacity: 0.12;
        pointer-events: none;
      }
      .mark ha-icon {
        --mdc-icon-size: 130px;
        display: flex;
      }
      .head {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }
      .seal {
        flex: none;
        width: 46px;
        height: 46px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        color: #fff;
        background: linear-gradient(145deg, color-mix(in srgb, var(--hue) 100%, #fff 25%), color-mix(in srgb, var(--hue) 100%, #000 25%));
        box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.3), 0 3px 8px rgba(0, 0, 0, 0.35);
      }
      .seal ha-icon {
        --mdc-icon-size: 28px;
        display: flex;
      }
      .titles {
        flex: 1;
        min-width: 0;
      }
      .head h3 {
        font-size: 20px;
      }
      .about {
        margin: 1px 0 0;
        font-size: 14px;
        line-height: 1.3;
        color: var(--secondary-text-color);
      }
      .count {
        font-size: 30px;
        font-weight: 700;
        line-height: 1;
        text-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
      }

      /* Glossy medals: the earned ones in their tier colour, the rest in dark sockets; the next one pulses. */
      .medals {
        position: relative;
        display: flex;
        justify-content: space-between;
        gap: 6px;
        margin-bottom: 14px;
      }
      .medal-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        flex: 1;
      }
      .medal {
        position: relative;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        background-color: rgba(0, 0, 0, 0.38);
        box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.6), inset 0 0 0 2px rgba(255, 255, 255, 0.06);
      }
      .medal ha-icon {
        --mdc-icon-size: 26px;
        display: flex;
        opacity: 0.28;
      }
      .got .medal {
        box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.4), inset 0 -6px 10px rgba(0, 0, 0, 0.25), 0 4px 10px rgba(0, 0, 0, 0.45);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      }
      .got .medal::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 22%, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0) 52%);
        pointer-events: none;
      }
      .got .medal ha-icon {
        opacity: 1;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
      }
      .got .medal.t-epic {
        box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.4), 0 0 14px 3px rgba(176, 127, 224, 0.75);
      }
      .got .medal.t-legendary {
        overflow: hidden;
        box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.6), 0 0 18px 5px rgba(247, 213, 106, 0.85);
      }
      .got .medal.t-legendary::before {
        content: "";
        position: absolute;
        top: -20%;
        bottom: -20%;
        width: 40%;
        left: -60%;
        transform: skewX(-20deg);
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
        animation: shine 3.2s ease-in-out infinite;
      }
      .next .medal {
        animation: pulse 1.8s ease-in-out infinite;
        box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.6), 0 0 0 2px var(--hue);
      }
      .next .medal ha-icon {
        opacity: 0.55;
      }
      .target {
        font-size: 14px;
        color: var(--secondary-text-color);
      }
      .got .target {
        color: var(--primary-text-color);
        font-weight: 700;
      }
      .next .target {
        color: var(--primary-text-color);
        font-weight: 700;
      }

      .bar {
        height: 12px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.35);
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.6s ease;
        box-shadow: inset 0 -3px 4px rgba(0, 0, 0, 0.2), inset 0 2px 3px rgba(255, 255, 255, 0.35);
      }
      .nextline {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin: 8px 0 0;
        font-size: 15px;
        font-weight: 600;
      }
      .nofm {
        color: var(--secondary-text-color);
        font-weight: 400;
        white-space: nowrap;
      }

      /* The one-time achievements. */
      .oneoffs {
        margin: 24px 0 10px;
        font-size: 20px;
      }
      .singles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, max(300px, calc((100% - 24px) / 3))), 1fr));
        gap: 12px;
      }
      .singles li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid var(--divider-color, #444);
        background: color-mix(in srgb, var(--pane) 92%, #fff);
        color: var(--secondary-text-color);
      }
      .singles li.got {
        color: var(--primary-text-color);
        font-weight: 600;
        border-color: color-mix(in srgb, var(--hue) 60%, transparent);
        background: linear-gradient(135deg, color-mix(in srgb, var(--hue) 24%, var(--pane)), var(--pane));
      }
      .singles .medal.small {
        flex: none;
        width: 40px;
        height: 40px;
      }
      .singles .medal.small ha-icon {
        --mdc-icon-size: 22px;
      }
      .singles li.got .medal {
        box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.4), 0 3px 8px rgba(0, 0, 0, 0.4);
      }
      .singles li.got .medal ha-icon {
        opacity: 1;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.07);
        }
      }
      @keyframes shine {
        0%,
        55% {
          left: -60%;
        }
        100% {
          left: 130%;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .next .medal,
        .trophy::before,
        .got .medal.t-legendary::before {
          animation: none;
        }
        .herofill,
        .fill {
          transition: none;
        }
      }
    `,
  ];
}

customElements.define("boopli-badges", BoopliBadges);
