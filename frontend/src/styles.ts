import { css, unsafeCSS } from "lit";
import { BOOPLI_FONT } from "./fonts";

/** Styles shared by all Boopli components. Uses Home Assistant's theme variables. */
export const sharedStyles = css`
  :host {
    display: block;
    color: var(--primary-text-color);
    font-family: ${unsafeCSS(BOOPLI_FONT)};
    font-size: 16px; /* Itim reads small, and Home Assistant's own 14px is too little for it */
  }
  button,
  input,
  select,
  textarea {
    font-family: inherit;
  }
  * {
    box-sizing: border-box;
  }
  h2,
  h3 {
    margin: 0;
    font-weight: 500;
  }
  .muted {
    color: var(--secondary-text-color);
  }
  .dim {
    opacity: 0.6;
  }
  .card {
    background: var(--card-background-color, var(--primary-background-color));
    border: 1px solid var(--divider-color);
    border-radius: 14px;
    padding: 16px;
  }
  button {
    font: inherit;
    cursor: pointer;
    color: var(--primary-text-color);
    background: transparent;
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    padding: 8px 14px;
    min-height: 40px;
  }
  button:hover {
    background: var(--secondary-background-color);
  }
  button.primary {
    background: var(--boopli-accent, var(--primary-color));
    border-color: var(--boopli-accent, var(--primary-color));
    color: var(--boopli-accent-ink, var(--text-primary-color, #fff));
    font-weight: 500;
  }
  /* The big, chunky button: a thick darker edge underneath that sinks when it is pressed. */
  button.press {
    background: var(--boopli-accent, var(--primary-color));
    color: var(--boopli-accent-ink, #fff);
    border: 0;
    border-bottom: 6px solid var(--boopli-accent-deep, #2a6e8a);
    border-radius: 16px;
    font-weight: 600;
    font-size: 22px;
    letter-spacing: 0.02em;
    min-height: 60px;
    padding: 14px 48px 10px;
    transition: transform 0.08s, border-bottom-width 0.08s;
  }
  button.press:hover {
    background: var(--boopli-accent, var(--primary-color));
    filter: brightness(1.06);
  }
  button.press:active:not(:disabled) {
    transform: translateY(4px);
    border-bottom-width: 2px;
  }
  .ico {
    --mdc-icon-size: 1.1em;
    display: inline-flex;
    vertical-align: middle;
    margin-top: -0.12em; /* centred on the letters, not sunk below them */
  }
  /* A text link in the accent colour. */
  button.textlink {
    border: 0;
    background: none;
    min-height: 0;
    padding: 6px 2px;
    color: var(--boopli-accent, var(--primary-color));
  }
  button.textlink:hover {
    background: none;
    text-decoration: underline;
  }
  button.primary:hover {
    filter: brightness(1.08);
  }
  button.danger {
    color: var(--error-color, #db4437);
    border-color: var(--error-color, #db4437);
  }
  button.chip {
    border-radius: 999px;
    padding: 6px 12px;
    min-height: 34px;
    font-size: 17px;
  }
  button.chip.on {
    background: var(--boopli-accent, var(--primary-color));
    border-color: var(--boopli-accent, var(--primary-color));
    color: var(--boopli-accent-ink, var(--text-primary-color, #fff));
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  input,
  select {
    font: inherit;
    color: var(--primary-text-color);
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 10px;
    padding: 8px 10px;
    min-height: 40px;
    width: 100%;
  }
  label {
    display: block;
    font-size: 16px;
    color: var(--secondary-text-color);
    margin-bottom: 4px;
  }
  .error {
    color: var(--error-color, #db4437);
    font-size: 17px;
    margin: 8px 0;
  }
`;
