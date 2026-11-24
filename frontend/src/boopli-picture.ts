import { LitElement, html, css, nothing, type PropertyValues } from "lit";
import { entityIds, friendlyName } from "./helpers";
import { sharedStyles } from "./styles";
import type { Hass } from "./types";
import { t, rich } from "./i18n";

type Mode = "none" | "camera" | "file";

// The same as in the integration: what phones show in a notification (JPEG, PNG, GIF).
const FILE_OK = /\.(jpe?g|png|gif)$/i;
const CAMERA_ID = /^camera\.[a-z0-9_]+$/;

/** A camera id. A name that ends like a picture file ("camera.png") is a file. */
function isCamera(value: string): boolean {
  return CAMERA_ID.test(value) && !FILE_OK.test(value);
}

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
  private _emitted: string | null = null; // the last value this element sent out itself

  constructor() {
    super();
    this.value = "";
    this._mode = "none";
    this._src = "";
    this._note = "";
  }

  protected willUpdate(changed: PropertyValues): void {
    if (!this._seeded) {
      this._seeded = true;
      this._mode = !this.value ? "none" : isCamera(this.value) ? "camera" : "file";
    } else if (changed.has("value") && this.value && this.value !== this._emitted) {
      // The value was changed from outside (the editor loaded another one): it says what kind it is.
      // What the person types or picks here never changes the kind they chose, so typing
      // a file name that starts with "camera." stays a file.
      this._mode = isCamera(this.value) ? "camera" : "file";
    }
    if (changed.has("value")) this._preview();
  }

  disconnectedCallback(): void {
    window.clearTimeout(this._timer);
    super.disconnectedCallback();
  }

  private _emit(value: string): void {
    this._emitted = value;
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
    if (this._mode === "camera") {
      const pic = this.hass?.states[v]?.attributes?.entity_picture;
      if (typeof pic === "string" && pic) this._src = pic;
      else this._note = t("picture.this_camera_gives_no_picture_right");
      return;
    }
    if (!FILE_OK.test(v)) {
      this._note = t("picture.use_a_jpg_png_or_gif");
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
        if (seq === this._seq) this._note = t("picture.that_file_is_not_in_the");
      }
    }, 500);
  }

  render() {
    const cameras = entityIds(this.hass, ["camera"]);
    const hasCameras = cameras.length > 0 || isCamera(this.value);
    return html`
      <div class="row">
        <span class="muted small">${t("picture.picture_in_the_phone_notification_optional")}</span>
        <select
          aria-label=${t("picture.kind_of_picture")}
          @change=${(e: Event) => this._setMode((e.target as HTMLSelectElement).value as Mode)}
        >
          <option value="none" ?selected=${this._mode === "none"}>${t("picture.none")}</option>
          ${hasCameras ? html`<option value="camera" ?selected=${this._mode === "camera"}>${t("picture.a_camera")}</option>` : nothing}
          <option value="file" ?selected=${this._mode === "file"}>${t("picture.a_picture_file")}</option>
        </select>
      </div>
      ${this._mode === "camera"
        ? html`<div class="row">
            <select
              aria-label=${t("picture.camera")}
              @change=${(e: Event) => this._emit((e.target as HTMLSelectElement).value)}
            >
              <option value="" ?selected=${!this.value}>${t("picture.pick_a_camera")}</option>
              ${this.value && !cameras.includes(this.value)
                ? html`<option value=${this.value} selected>${t("picture.not_found", { value: this.value })}</option>`
                : nothing}
              ${cameras.map(
                (id) => html`<option value=${id} ?selected=${this.value === id}>${friendlyName(this.hass, id)}</option>`
              )}
            </select>
            <span class="muted small">${t("picture.the_phone_shows_a_fresh_snapshot")}</span>
          </div>`
        : nothing}
      ${this._mode === "file"
        ? html`<div class="row">
            <input
              aria-label=${t("picture.picture_file")}
              placeholder="boopli/pills.jpg"
              maxlength="120"
              .value=${this.value}
              @input=${(e: Event) => this._emit((e.target as HTMLInputElement).value.trim())}
            />
          </div>
          <div class="muted small">
            ${rich("picture.a_file_in_home_assistants_media")}
          </div>`
        : nothing}
      ${this._src
        ? html`<img
            class="preview"
            alt=${t("picture.preview_of_the_picture")}
            src=${this._src}
            @error=${() => {
              this._src = "";
              this._note = this._mode === "camera"
                ? t("picture.the_picture_could_not_be_loaded")
                : t("picture.that_file_is_not_in_the_2");
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
        font-size: 16px;
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
        font-size: 15px;
      }
    `,
  ];
}

customElements.define("boopli-picture", BoopliPicture);
