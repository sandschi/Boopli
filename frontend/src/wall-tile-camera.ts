import { css, html } from "lit";
import { WallTile, wallTileStyles } from "./wall-tile";

/** A picture from a camera, refreshed every few seconds. Options: entity_id, refresh_s. */
export class WallTileCamera extends WallTile {
  static properties = { ...WallTile.properties, _tick: { state: true } };
  declare _tick: number;
  private _timer?: number;
  private _every = 0;

  constructor() {
    super();
    this._tick = 0;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
    this._every = 0;
  }

  protected updated(): void {
    const every = this.num("refresh_s", 10);
    if (every === this._every) return;
    this._every = every;
    window.clearInterval(this._timer);
    this._timer = window.setInterval(() => (this._tick += 1), every * 1000);
  }

  render() {
    const id = this.text("entity_id");
    if (!id) return html`<div class="center muted normal">Pick a camera in the board settings.</div>`;
    const picture = this.hass?.states[id]?.attributes?.entity_picture;
    if (typeof picture !== "string") return html`<div class="center muted normal">No picture from this camera.</div>`;
    const src = `${picture}${picture.includes("?") ? "&" : "?"}t=${this._tick}`;
    return html`<img src=${src} alt="Camera picture" />`;
  }

  static styles = [
    wallTileStyles,
    css`
      :host {
        padding: 0;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
    `,
  ];
}
customElements.define("wall-tile-camera", WallTileCamera);
