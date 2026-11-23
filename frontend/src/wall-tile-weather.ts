import { css, html } from "lit";
import { WallTile, wallTileStyles } from "./wall-tile";

const EMOJI: Record<string, string> = {
  "clear-night": "🌙",
  cloudy: "☁️",
  exceptional: "⚠️",
  fog: "🌫️",
  hail: "🌨️",
  lightning: "🌩️",
  "lightning-rainy": "⛈️",
  partlycloudy: "⛅",
  pouring: "🌧️",
  rainy: "🌦️",
  snowy: "❄️",
  "snowy-rainy": "🌨️",
  sunny: "☀️",
  windy: "💨",
  "windy-variant": "💨",
};

/** The weather now, from a weather entity. Option: entity_id. */
export class WallTileWeather extends WallTile {
  render() {
    const id = this.text("entity_id");
    if (!id) return html`<div class="center muted normal">Pick a weather entity in the board settings.</div>`;
    const st = this.hass?.states[id];
    if (!st) return html`<div class="center muted normal">Weather not found.</div>`;
    const a = st.attributes;
    const temp = a.temperature !== undefined ? `${a.temperature}${a.temperature_unit ?? "°"}` : "";
    const humidity = a.humidity !== undefined ? `${a.humidity} % humidity` : "";
    return html`<div class="w">
      <div class="huge sky">${EMOJI[st.state] ?? "🌡️"}</div>
      <div>
        <div class="big">${temp}</div>
        <div class="normal">${st.state.replace(/-/g, " ")}</div>
        <div class="small muted">${humidity}</div>
      </div>
    </div>`;
  }

  static styles = [
    wallTileStyles,
    css`
      .w {
        height: 100%;
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .sky {
        line-height: 1;
      }
      .normal {
        text-transform: capitalize;
      }
    `,
  ];
}
customElements.define("wall-tile-weather", WallTileWeather);
