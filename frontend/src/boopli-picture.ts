import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { entityIds, friendlyName } from "./helpers";
import { sharedStyles } from "./styles";
import type { Hass } from "./types";

type Mode = "none" | "camera" | "file";

const FILE_OK = /\.(jpe?g|png|gif|webp)$/i;

/**
 * A picture for the phone notification of one step: nothing, a camera of Home Assistant,
 * or a picture file in the media folder. Shows a small preview, so a wrong name is seen at
 * once. Fires `picture-change` with the new value ("" = none).
 */
export class BoopliPicture extends LitElement {
  static properties = {
    hass: { attribute: false },
    value: { type: String },
    _mode: { state: true },
    _src: { state: true },
    _note: { state: true },
  };

  declare hass?: Hass;
  declare value: string;
  declare _mode: Mode;
  declare _src: string; // the preview, when there is one
  declare _note: string; // why there is none

  private _timer = 0;
  private _seq = 0;
  private _seeded = false;

  constructor() {
    super();
    this.value = "";
    this._mode = "none";
    this._src = "";
    this._note = "";
  }

  protected willUpdate(changed: PropertyValues): void {
    if (!this._seeded || (changed.has("value") && this.value)) {
      // A value always says what kind it is. An empty one keeps what the person picked
      // (a kind chosen but no camera or file named yet).
      this._seeded = true;
      if (this.value) this._mode = this.value.startsWith("camera.") ? "camera" : "file";
      else if (!changed.has("value") || this._mode === "none") this._mode = "none";
    }
    if (changed.has("value")) this._preview();
  }

  disconnectedCallback(): void {
    window.clearTimeout(this._timer);
    super.disconnectedCallback();
  }

  private _emit(value: string): void {
    this.dispatchEvent(new CustomEvent("picture-change", { detail: value, bubbles: true, composed: true }));
  }

  private _setMode(mode: Mode): void {
    this._mode = mode;
    this._emit(""); // a new kind of picture starts empty
  }

  /** Look at what the phone would get, with a short pause while a name is being typed. */
  private _preview(): void {
    const seq = ++this._seq;
    window.clearTimeout(this._timer);
    this._src = "";
    this._note = "";
    const v = (this.value ?? "").trim();
    if (!v) return;
    if (v.startsWith("camera.")) {
      const pic = this.hass?.states[v]?.attributes?.entity_picture;
      if (typeof pic === "string" && pic) this._src = pic;
      else this._note = "This camera gives no picture right now.";
      return;
    }
    if (!FILE_OK.test(v)) {
      this._note = "Use a .jpg, .png, .gif or .webp file.";
      return;
    }
    this._timer = window.setTimeout(async () => {
      try {
        const r = await this.hass?.callWS<{ url: string }>({
          type: "media_source/resolve_media",
          media_content_id: `media-source://media_source/local/${v}`,
          expires: 300,
        });
        if (seq === this._seq && r?.url) this._src = r.url;
      } catch {
        if (seq === this._seq) this._note = "That file is not in the media folder.";
      }
    }, 500);
  }

  render() {
    const cameras = entityIds(this.hass, ["camera"]);
    const hasCameras = cameras.length > 0 || this.value.startsWith("camera.");
    return html`
      <div class="row">
        <span class="muted small">Picture in the phone notification (optional):</span>
        <select
          aria-label="Kind of picture"
          @change=${(e: Event) => this._setMode((e.target as HTMLSelectElement).value as Mode)}
        >
          <option value="none" ?selected=${this._mode === "none"}>None</option>
          ${hasCameras ? html`<option value="camera" ?selected=${this._mode === "camera"}>A camera</option>` : nothing}
          <option value="file" ?selected=${this._mode === "file"}>A picture file</option>
        </select>
      </div>
      ${this._mode === "camera"
        ? html`<div class="row">
            <select
              aria-label="Camera"
              @change=${(e: Event) => this._emit((e.target as HTMLSelectElement).value)}
            >
              <option value="" ?selected=${!this.value}>Pick a camera…</option>
              ${this.value && !cameras.includes(this.value)
                ? html`<option value=${this.value} selected>${this.value} (not found)</option>`
                : nothing}
              ${cameras.map(
                (id) => html`<option value=${id} ?selected=${this.value === id}>${friendlyName(this.hass, id)}</option>`
              )}
            </select>
            <span class="muted small">The phone shows a fresh snapshot when the nudge arrives.</span>
          </div>`
        : nothing}
      ${this._mode === "file"
        ? html`<div class="row">
            <input
              aria-label="Picture file"
              placeholder="boopli/pills.jpg"
              maxlength="120"
              .value=${this.value}
              @input=${(e: Event) => this._emit((e.target as HTMLInputElement).value.trim())}
            />
          </div>
          <div class="muted small">
            A file in Home Assistant's media folder (the one you see as "Media"), not the public www folder. Type its
            name with the folder, for example <code>boopli/pills.jpg</code>.
          </div>`
        : nothing}
      ${this._src
        ? html`<img
            class="preview"
            alt="Preview of the picture"
            src=${this._src}
            @error=${() => {
              this._src = "";
              this._note = this.value.startsWith("camera.")
                ? "The picture could not be loaded."
                : "That file is not in the media folder, or it is not a picture.";
            }}
          />`
        : nothing}
      ${this._note ? html`<div class="note small">${this._note}</div>` : nothing}
    `;
  }

  static styles = [
    sharedStyles,
    css`
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      .row select,
      .row input {
        max-width: 260px;
        min-width: 0;
      }
      .small {
        font-size: 14px;
      }
      .preview {
        display: block;
        margin-top: 10px;
        max-width: 100%;
        max-height: 140px;
        border-radius: 10px;
        border: 1px solid var(--divider-color, #444);
      }
      .note {
        margin-top: 8px;
        color: var(--warning-color, #b26a00);
      }
      code {
        font-size: 13px;
      }
    `,
  ];
}

customElements.define("boopli-picture", BoopliPicture);
