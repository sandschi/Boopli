import { css, html } from "lit";
import "./boopli-stage";
import { WallTile, wallTileStyles } from "./wall-tile";
import { t } from "./i18n";

/** The pet in its room, with its name and level. */
export class WallTilePet extends WallTile {
  render() {
    const pet = this.snapshot?.pet;
    if (!pet) return html`<div class="center muted normal">${t("common.loading")}</div>`;
    const working = (this.snapshot?.runs ?? []).some((r) =>
      r.steps.some((s) => s.status === "active" && !!s.on_it_until)
    );
    return html`<div class="wrap">
      <boopli-stage
        .kind=${this.snapshot?.settings?.pet_kind ?? "slime"}
        .mood=${pet.mood}
        .level=${pet.level}
        .away=${pet.away ?? false}
        .activity=${working && !pet.away ? "housework" : ""}
      ></boopli-stage>
      <div class="normal name">${pet.name} <span class="muted">· Level ${pet.level}</span></div>
    </div>`;
  }

  static styles = [
    wallTileStyles,
    css`
      :host {
        padding: 8px;
      }
      .wrap {
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      boopli-stage {
        /* the room keeps its shape: as wide as fits, and as tall as the tile leaves room for */
        flex: none;
        width: min(100cqw - 16px, calc((100cqh - 56px) * 3.2));
        align-self: center;
      }
      .name {
        text-align: center;
      }
    `,
  ];
}
customElements.define("wall-tile-pet", WallTilePet);
