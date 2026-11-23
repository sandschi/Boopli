import { css, html } from "lit";
import { awayWhen } from "./boopli-away";
import { WallTile, wallTileStyles } from "./wall-tile";

/** A note that away mode is on. It is only there while away mode is on (in the editor it is shown dimmed). */
export class WallTileAway extends WallTile {
  protected willUpdate(): void {
    const on = !!this.snapshot?.away?.active;
    this.toggleAttribute("hidden", !on && !this.preview);
  }

  render() {
    const away = this.snapshot?.away;
    if (!away?.active) return html`<div class="center muted normal">Shows only while away mode is on.</div>`;
    const onNow = !!this.snapshot?.away_now;
    const tz = this.snapshot?.time_zone ?? "UTC";
    return html`<div class="center">
      <div>
        <div class="big">🧳 ${onNow ? "Away mode is on" : "Away mode is planned"}</div>
        <div class="normal muted">${awayWhen(away, this.nowMs, tz, onNow)}</div>
      </div>
    </div>`;
  }

  static styles = [wallTileStyles, css``];
}
customElements.define("wall-tile-away", WallTileAway);
