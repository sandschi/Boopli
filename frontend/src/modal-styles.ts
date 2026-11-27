import { css } from "lit";

/** The look of the shop's and the inventory's windows (a native <dialog>; on a phone it fills the screen). */
export const modalStyles = css`
  dialog {
    padding: 0;
    border: 1px solid var(--divider-color, #444);
    border-radius: 16px;
    width: min(94vw, 640px);
    max-height: 90vh;
    overflow: auto;
    background: var(--card-background-color, #1c1c1c);
    color: var(--primary-text-color, #fff);
  }
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.6);
  }
  .win {
    padding: 16px 18px 18px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .head h3 {
    margin: 0;
    font-size: 22px;
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
    border: 2px solid color-mix(in srgb, var(--primary-text-color, #888) 35%, transparent);
    border-radius: 999px;
    padding: 2px 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .group {
    margin-top: 16px;
  }
  .group > h4 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 500;
    color: var(--secondary-text-color);
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--divider-color, #444);
  }
  .row .art {
    flex: none;
    width: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .row .art svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 52px;
  }
  .swatch {
    display: inline-block;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid var(--primary-text-color, #fff);
  }
  .row .text {
    flex: 1;
    min-width: 0;
  }
  .row .name {
    font-weight: 500;
  }
  .row .note {
    font-size: 16px;
    color: var(--secondary-text-color);
  }
  .row .act {
    flex: none;
    text-align: right;
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
  /* Tiles: the shop and the inventory are made of them. Warm gold-tinted, but following the theme (dark in dark mode). */
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  .tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    min-height: 132px;
    padding: 12px 6px 8px;
    border-radius: 16px;
    border: 2px solid color-mix(in srgb, #e9b949 60%, transparent);
    background: color-mix(in srgb, #e9b949 13%, var(--card-background-color, #1c1c1c));
    color: var(--primary-text-color, #fff);
    font-size: 17px;
    text-align: center;
  }
  button.tile:hover:not(:disabled) {
    background: color-mix(in srgb, #e9b949 22%, var(--card-background-color, #1c1c1c));
  }
  button.tile:active:not(:disabled) {
    transform: translateY(2px);
  }
  button.tile:disabled {
    opacity: 0.5;
  }
  .tile.static {
    min-height: 0;
    padding-bottom: 10px;
  }
  .tile.on {
    border-color: var(--boopli-accent, var(--primary-color, #03a9f4));
    background: color-mix(in srgb, var(--boopli-accent, var(--primary-color, #03a9f4)) 22%, var(--card-background-color, #1c1c1c));
  }
  .tile .pic {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 52px;
  }
  .tile .pic svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .tile .pic .swatch {
    width: 44px;
    height: 44px;
  }
  .tile .pic .swatch.plain {
    background: transparent;
    border-style: dashed;
    opacity: 0.6;
  }
  .tile .tname {
    font-weight: 700;
    line-height: 1.1;
  }
  .tile .txp {
    min-height: 18px;
    font-size: 15px;
    color: var(--secondary-text-color, #aaa);
    line-height: 1.15;
  }
  .tile .price {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: auto;
    font-weight: 700;
  }
  .tile .count {
    position: absolute;
    top: 6px;
    right: 8px;
    min-width: 24px;
    padding: 0 6px;
    border-radius: 999px;
    background: #e9b949;
    color: #2a1e00;
    font-weight: 700;
    font-size: 15px;
  }
  .actions {
    margin-top: 16px;
  }
  @media (max-width: 760px) {
    dialog {
      width: 100vw;
      max-width: 100vw;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
      border: 0;
    }
    .row {
      gap: 8px;
    }
    .row .art {
      width: 52px;
    }
  }
`;
