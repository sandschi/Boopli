import { css, html } from "lit";
import { friendlyName } from "./helpers";
import { WallTile, wallTileStyles } from "./wall-tile";

/** What a tap does, by kind of entity: [domain, service], or none (a sensor has nothing to press). */
const TAP: Record<string, [string, string]> = {
  light: ["homeassistant", "toggle"],
  switch: ["homeassistant", "toggle"],
  input_boolean: ["homeassistant", "toggle"],
  fan: ["homeassistant", "toggle"],
  humidifier: ["homeassistant", "toggle"],
  automation: ["homeassistant", "toggle"],
  cover: ["cover", "toggle"],
  script: ["script", "turn_on"],
  scene: ["scene", "turn_on"],
  button: ["button", "press"],
  input_button: ["input_button", "press"],
};

const ICON: Record<string, string> = {
  light: "💡",
  switch: "🔌",
  input_boolean: "🔘",
  fan: "🌀",
  cover: "🪟",
  lock: "🔒",
  climate: "🌡️",
  sensor: "📟",
  binary_sensor: "👁️",
  script: "▶️",
  scene: "🎬",
  button: "⏺️",
  person: "🧑",
  media_player: "🎵",
};

/** Any Home Assistant entity: its state, and a tap that toggles it when that makes sense. Options: entity_id, name, tap. */
export class WallTileEntity extends WallTile {
  private _tap(): void {
    const id = this.text("entity_id");
    const action = TAP[id.split(".")[0]];
    if (this.preview || !this.hass?.callService || !action || this.text("tap", "toggle") !== "toggle") return;
    const [domain, service] = action;
    void this.hass.callService(domain, service, { entity_id: id });
  }

  render() {
    const id = this.text("entity_id");
    if (!id) return html`<div class="center muted normal">Pick an entity in the board settings.</div>`;
    const st = this.hass?.states[id];
    const domain = id.split(".")[0];
    const name = this.text("name") || friendlyName(this.hass, id);
    const unit = typeof st?.attributes?.unit_of_measurement === "string" ? ` ${st.attributes.unit_of_measurement}` : "";
    const on = st?.state === "on";
    const tappable = !!TAP[domain] && this.text("tap", "toggle") === "toggle" && !this.preview; // in the editor it does nothing, so it is no button there
    const inside = html`<div class="icon big">${ICON[domain] ?? "◻️"}</div>
      <div>
        <div class="label">${name}</div>
        <div class="big">${st ? `${st.state}${unit}` : "not found"}</div>
      </div>`;
    // something a tap switches is a real button, so it can also be reached and used from a keyboard
    return tappable
      ? html`<button type="button" class="ent tap ${on ? "on" : ""}" aria-label="${name}: ${st?.state ?? "not found"}. Switch" @click=${() => this._tap()}>${inside}</button>`
      : html`<div class="ent ${on ? "on" : ""}">${inside}</div>`;
  }

  static styles = [
    wallTileStyles,
    css`
      .ent {
        height: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
      }
      button.ent {
        all: unset;
        box-sizing: border-box;
        width: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
        color: inherit;
        font: inherit;
      }
      .tap {
        cursor: pointer;
      }
      button.ent:focus-visible {
        outline: 3px solid var(--primary-color);
        outline-offset: 4px;
        border-radius: 12px;
      }
      .on .icon {
        filter: drop-shadow(0 0 8px var(--primary-color));
      }
      .big {
        text-transform: capitalize;
      }
    `,
  ];
}
customElements.define("wall-tile-entity", WallTileEntity);
