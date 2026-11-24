import { css, html } from "lit";
import { WallTile, wallTileStyles } from "./wall-tile";
import { t } from "./i18n";

/** A note you wrote. Options: text, big (large letters). This is the smallest tile: copy it to make your own. */
export class WallTileNote extends WallTile {
  render() {
    const text = this.text("text").trim();
    if (!text) return html`<div class="center muted normal">${t("wall_tile_note.write_a_note_in_the_board")}</div>`;
    return html`<div class="center"><div class=${this.flag("big") ? "big" : "normal"}>${text}</div></div>`;
  }

  static styles = [wallTileStyles, css`.center div { white-space: pre-line; }`];
}
customElements.define("wall-tile-note", WallTileNote);
