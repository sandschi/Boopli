import { css, html } from "lit";
import { WallTile, wallTileStyles } from "./wall-tile";

/** The time, and the date under it. Options: format (24h or 12h), date (show the date). */
export class WallTileClock extends WallTile {
  render() {
    const tz = this.snapshot?.time_zone;
    const at = new Date(this.nowMs || Date.now());
    const time = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: this.text("format", "24h") === "12h",
    }).format(at);
    const date = new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(at);
    return html`<div class="center">
      <div>
        <div class="huge">${time}</div>
        ${this.flag("date", true) ? html`<div class="normal muted">${date}</div>` : ""}
      </div>
    </div>`;
  }

  static styles = [wallTileStyles, css``];
}
customElements.define("wall-tile-clock", WallTileClock);
