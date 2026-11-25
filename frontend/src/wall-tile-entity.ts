import { css, html } from "lit";
import { friendlyName } from "./helpers";
import { WallTile, wallTileStyles } from "./wall-tile";
import { icon } from "./icon";
import { t } from "./i18n";

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
  light: "lightbulb-outline",
  switch: "power-plug-outline",
  input_boolean: "toggle-switch-outline",
  fan: "fan",
  cover: "window-shutter",
  lock: "lock-outline",
  climate: "thermostat",
  sensor: "gauge",
  binary_sensor: "eye-outline",
  script: "script-text-play-outline",
  scene: "palette-outline",
  button: "gesture-tap-button",
  person: "account-outline",
  media_player: "speaker",
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
    if (!id) return html`<div class="center muted normal">${t("wall_tile_entity.pick_an_entity_in_the_board")}</div>`;
    const st = this.hass?.states[id];
    const domain = id.split(".")[0];
    const name = this.text("name") || friendlyName(this.hass, id);
    const unit = typeof st?.attributes?.unit_of_measurement === "string" ? ` ${st.attributes.unit_of_measurement}` : "";
    const on = st?.state === "on";
    const action = TAP[domain]?.[1];
    const tappable = !!action && this.text("tap", "toggle") === "toggle" && !this.preview; // in the editor it does nothing, so it is no button there
    const inside = html`<div class="icon big">${icon(ICON[domain] ?? "shape-outline")}</div>
      <div>
        <div class="label">${name}</div>
        <div class="big">${st ? `${st.state}${unit}` : t("wall_tile_entity.not_found")}</div>
      </div>`;
    if (!tappable) return html`<div class="ent ${on ? "on" : ""}">${inside}</div>`;

    const state = st?.state ?? t("wall_tile_entity.not_found");
    const label = t(
      action === "toggle" ? "wall_tile_entity.toggle_entity"
        : action === "press" ? "wall_tile_entity.press_button"
        : domain === "script" ? "wall_tile_entity.run_script"
        : "wall_tile_entity.tap_label",
      { name, state },
    );
    return html`<button type="button" class="ent tap ${on ? "on" : ""}" aria-label=${label} @click=${() => this._tap()}>${inside}</button>`;
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
        outline: 3px solid var(--boopli-accent, var(--primary-color));
        outline-offset: 4px;
        border-radius: 12px;
      }
      .on .icon {
        filter: drop-shadow(0 0 8px var(--boopli-accent, var(--primary-color)));
      }
      .big {
        text-transform: capitalize;
      }
    `,
  ];
}
customElements.define("wall-tile-entity", WallTileEntity);
