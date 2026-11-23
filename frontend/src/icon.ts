import { html } from "lit";

/**
 * One icon, from the Material Design Icons that Home Assistant ships (`mdi:<name>`).
 * It takes the colour and size of the text around it.
 */
export function icon(name: string) {
  return html`<ha-icon class="ico" icon="mdi:${name}" aria-hidden="true"></ha-icon>`;
}
