import { css } from "lit";

/**
 * The look of the shop's and the inventory's windows (a native <dialog>; on a phone it fills the screen).
 * Game-like: a framed wooden panel with a sign for a title, a grid of sunken slots with the pictures big in them,
 * and a bar at the bottom that says what the chosen slot is and what you can do with it. The wood is mixed into
 * the theme's card colour, so it stays dark in dark mode and light in light mode.
 */
export const modalStyles = css`
  dialog {
    --wood: color-mix(in srgb, #a8743c 30%, var(--card-background-color, #1c1c1c));
    --wood-dark: color-mix(in srgb, #5b3a17 65%, var(--card-background-color, #1c1c1c));
    --wood-edge: color-mix(in srgb, #8a5a2b 78%, var(--card-background-color, #1c1c1c));
    --slot: color-mix(in srgb, #2a1a08 38%, var(--wood));
    --gold: #d3a05a; /* softer amber: buttons, badges, coins */
    --wood-light: color-mix(in srgb, #c99a63 70%, var(--card-background-color, #1c1c1c)); /* selection rings */
    padding: 0;
    border: 6px solid var(--wood-edge);
    border-radius: 22px;
    box-shadow: 0 0 0 2px var(--wood-dark), 0 18px 48px rgba(0, 0, 0, 0.55);
    width: min(94vw, 600px);
    height: fit-content; /* (not auto: an open dialog is pinned top and bottom, and auto would stretch it) */
    min-height: min(440px, 90vh);
    max-height: min(90vh, 720px);
    background: var(--wood);
    color: var(--primary-text-color, #fff);
    overflow: hidden;
  }
  dialog[open] {
    display: flex;
    flex-direction: column;
  }
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.6);
  }
  .win {
    display: flex;
    flex-direction: column;
    flex: 1 auto;
    min-height: 0;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 10px 14px;
    background: linear-gradient(var(--wood-edge), var(--wood-dark));
    border-bottom: 3px solid var(--wood-dark);
  }
  .head h3 {
    flex: 1;
    margin: 0;
    font-size: 22px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .close {
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 22px;
    min-width: 40px;
    min-height: 40px;
  }
  .wallet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 2px solid var(--gold);
    border-radius: 999px;
    padding: 2px 12px;
    font-weight: 700;
    white-space: nowrap;
    background: color-mix(in srgb, #000 35%, transparent);
  }
  .shopbtn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 14px;
    border: 2px solid var(--gold);
    border-radius: 999px;
    background: var(--gold);
    color: #2a1e00;
    font-weight: 700;
    font-size: 16px;
    white-space: nowrap;
  }
  .cats {
    display: flex;
    gap: 6px;
    padding: 10px 12px 0;
    overflow-x: auto;
  }
  .cat {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 76px;
    padding: 6px 10px;
    border: 3px solid var(--wood-edge);
    border-radius: 14px 14px 0 0;
    background: var(--wood-dark);
    color: inherit;
    font-size: 15px;
    line-height: 1.1;
  }
  .cat .ico {
    --mdc-icon-size: 28px;
  }
  .cat.on {
    background: var(--wood);
    border-color: var(--wood-light);
    border-bottom-color: var(--wood);
    font-weight: 700;
  }
  .body {
    flex: 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 12px 14px;
    border-top: 3px solid var(--wood-edge);
  }
  .body > .note {
    margin: 0 0 8px;
  }
  .group {
    margin-bottom: 14px;
  }
  .group > h4 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 600;
  }
  .swatch {
    display: inline-block;
    width: 100%;
    height: 100%;
    max-width: 48px;
    max-height: 48px;
    border-radius: 50%;
    border: 2px solid var(--primary-text-color, #fff);
  }
  .coin {
    display: inline-flex;
    width: 1.3em;
    height: 1.3em;
    vertical-align: middle;
  }
  .coin svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  /* The slots: sunken squares, the picture big in them, a price tag or a count at the bottom. */
  .slots {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 8px;
  }
  .slot {
    position: relative;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 6px 20px;
    border: 3px solid var(--wood-dark);
    border-radius: 12px;
    background: var(--slot);
    box-shadow: inset 0 3px 7px rgba(0, 0, 0, 0.5);
    color: inherit;
    font-size: 15px;
  }
  button.slot:hover:not(:disabled) {
    background: color-mix(in srgb, #fff 8%, var(--slot));
  }
  button.slot:active:not(:disabled) {
    transform: translateY(2px);
  }
  .slot.sel {
    border-color: var(--wood-light);
    box-shadow: inset 0 3px 7px rgba(0, 0, 0, 0.5), 0 0 0 2px var(--wood-light);
  }
  .slot.dim {
    opacity: 0.5;
  }
  .slot .pic {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  .slot .pic svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .slot .pic .swatch.plain {
    background: transparent;
    border-style: dashed;
    opacity: 0.6;
  }
  .slot .tag {
    position: absolute;
    left: 4px;
    right: 4px;
    bottom: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-weight: 700;
    font-size: 14px;
    line-height: 1.2;
  }
  .slot .tag .coin {
    width: 1.1em;
    height: 1.1em;
  }
  .slot .lock {
    position: absolute;
    top: 3px;
    left: 4px;
    --mdc-icon-size: 18px;
  }
  .slot .mark {
    position: absolute;
    top: 3px;
    right: 4px;
    min-width: 20px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--gold);
    color: #2a1e00;
    font-weight: 700;
    font-size: 13px;
    line-height: 20px;
    text-align: center;
  }
  /* The bar at the bottom: what is chosen, and what to do with it. */
  .detail {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 84px;
    padding: 10px 14px;
    background: linear-gradient(var(--wood-dark), var(--wood-edge));
    border-top: 3px solid var(--wood-dark);
  }
  .detail .dpic {
    flex: none;
    width: 64px;
    height: 56px;
    border-radius: 10px;
    background: var(--slot);
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .detail .dpic svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .detail .dtext {
    flex: 1;
    min-width: 0;
  }
  .detail .dname {
    font-weight: 700;
    font-size: 18px;
  }
  .detail .dnote {
    font-size: 15px;
    opacity: 0.85;
  }
  .detail .go {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    padding: 0 18px;
    border: 2px solid var(--gold);
    border-radius: 999px;
    background: var(--gold);
    color: #2a1e00;
    font-weight: 700;
    font-size: 17px;
  }
  .detail .go:disabled {
    opacity: 0.45;
  }
  .foot {
    padding: 8px 14px 10px;
    background: var(--wood-edge);
  }
  .foot .textlink {
    margin-right: 12px;
  }
  @media (max-width: 760px) {
    dialog {
      width: 100vw;
      max-width: 100vw;
      height: 100vh;
      min-height: 100vh;
      max-height: 100vh;
      height: 100dvh;
      min-height: 100dvh;
      max-height: 100dvh;
      border-radius: 0;
      border-width: 0;
      box-shadow: none;
    }
    .slots {
      grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    }
    .detail .go {
      padding: 0 12px;
    }
    .shopbtn .lbl {
      display: none;
    }
    .shopbtn {
      padding: 0 10px;
    }
  }
`;
