import { css, html } from "lit";
import { WallTile, wallTileStyles } from "./wall-tile";
import { icon } from "./icon";
import { t } from "./i18n";

const SKY: Record<string, string> = {
  "clear-night": "weather-night",
  cloudy: "weather-cloudy",
  exceptional: "alert-outline",
  fog: "weather-fog",
  hail: "weather-hail",
  lightning: "weather-lightning",
  "lightning-rainy": "weather-lightning-rainy",
  partlycloudy: "weather-partly-cloudy",
  pouring: "weather-pouring",
  rainy: "weather-rainy",
  snowy: "weather-snowy",
  "snowy-rainy": "weather-snowy-rainy",
  sunny: "weather-sunny",
  windy: "weather-windy",
  "windy-variant": "weather-windy-variant",
};

/** The weather now, from a weather entity. Option: entity_id. */
export class WallTileWeather extends WallTile {
  render() {
    const id = this.text("entity_id");
    if (!id) return html`<div class="center muted normal">${t("wall_tile_weather.pick_a_weather_entity_in_the")}</div>`;
    const st = this.hass?.states[id];
    if (!st) return html`<div class="center muted normal">${t("wall_tile_weather.weather_not_found")}</div>`;
    const a = st.attributes;
    const temp = a.temperature !== undefined ? `${a.temperature}${a.temperature_unit ?? "°"}` : "";
    const humidity = a.humidity !== undefined ? t("wall_tile_weather.humidity", { percent: a.humidity }) : "";
    return html`<div class="w">
      <div class="huge sky">${icon(SKY[st.state] ?? "thermometer")}</div>
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
      .sky .ico {
        --mdc-icon-size: 1em;
        margin: 0;
      }
      .normal {
        text-transform: capitalize;
      }
    `,
  ];
}
customElements.define("wall-tile-weather", WallTileWeather);
