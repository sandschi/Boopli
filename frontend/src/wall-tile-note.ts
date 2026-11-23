import { css, html } from "lit";
import { WallTile, wallTileStyles } from "./wall-tile";

/** A note you wrote. Options: text, big (large letters). This is the smallest tile: copy it to make your own. */
export class WallTileNote extends WallTile {
  render() {
    const text = this.text("text").trim();
    if (!text) return html`<div class="center muted normal">Write a note in the board settings.</div>`;
    return html`<div class="center"><div class=${this.flag("big") ? "big" : "normal"}>${text}</div></div>`;
  }

  static styles = [wallTileStyles, css`.center div { white-space: pre-line; }`];
}
customElements.define("wall-tile-note", WallTileNote);
