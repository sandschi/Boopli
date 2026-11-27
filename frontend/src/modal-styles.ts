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
