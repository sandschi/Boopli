import { LitElement, html, css } from "lit";
import "../src/boopli-stage";
import { PET_FUR, PET_NECK, ROOM_ITEMS as CATALOGUE, ROOM_PAINT } from "../src/shop-art";
import { PETS, MOODS, type PetKind } from "../src/pets";
import type { Mood } from "../src/types";

/**
 * The item check page (development only; it is not part of the panel bundle).
 * It shows every shop item once, so you can look at all of them at a glance after each change:
 * what is in the room, every colour and pattern on the wall and the floor, and every pet.
 *
 * Run it with `npm run check` in frontend/ and open http://localhost:5173/dev/items.html
 */

/** The room items that exist, in the order of the room (the catalogue in shop-art.ts). */
const ROOM_ITEMS = CATALOGUE.map((item) => item.id);

class BoopliItemCheck extends LitElement {
  static properties = { _mood: { state: true } };
  declare _mood: Mood;

  constructor() {
    super();
    this._mood = "content";
  }

  private _stage(
    kind: PetKind,
    owned: string[],
    placed: { wall?: string; floor?: string; fur?: string; neck?: string } = {},
    mood: Mood = this._mood,
  ) {
    return html`<boopli-stage .kind=${kind} .mood=${mood} .level=${4} .owned=${owned} .placed=${placed}></boopli-stage>`;
  }

  render() {
    const kinds = PETS().map((p) => p.kind);
    return html`
      <h1>Item check</h1>
      <p class="muted">Every item once. The mood below changes all rooms at once.</p>
      <div class="chips">
        ${MOODS.map(
          (m) => html`<button class=${m === this._mood ? "on" : ""} @click=${() => (this._mood = m)}>${m}</button>`,
        )}
      </div>

      <h2>Room items</h2>
      <div class="grid">
        ${CATALOGUE.map((item) => {
          // An attachment is shown with the item it sits on, an item of one pet kind with that pet.
          const owned = item.attach ? [item.attach.to, item.id] : [item.id];
          const note = [item.attach && `on ${item.attach.to}`, item.species && `only for the ${item.species}`, !item.spot && !item.attach && "no place"]
            .filter(Boolean)
            .join(", ");
          return html`<figure>
            ${this._stage(item.species ?? "slime", owned)}<figcaption>${item.id}${note ? ` (${note})` : ""}</figcaption>
          </figure>`;
        })}
        <figure>${this._stage("dog", ROOM_ITEMS)}<figcaption>all room items together (dog, so its own item shows)</figcaption></figure>
      </div>

      <h2>Colours and patterns (wall and floor)</h2>
      <div class="grid">
        ${Object.keys(ROOM_PAINT).map(
          (id) =>
            html`<figure>${this._stage("slime", [], { wall: id, floor: id })}<figcaption>${id}</figcaption></figure>`,
        )}
      </div>

      <h2>What a pet wears (fur colour, scarf)</h2>
      <div class="grid">
        ${kinds.flatMap((kind) =>
          Object.keys(PET_FUR).flatMap((fur) =>
            Object.keys(PET_NECK).flatMap((neck) => [
              html`<figure>${this._stage(kind, [], { fur })}<figcaption>${kind}: ${fur}</figcaption></figure>`,
              html`<figure>${this._stage(kind, [], { neck })}<figcaption>${kind}: ${neck}</figcaption></figure>`,
              html`<figure>${this._stage(kind, [], { fur, neck })}<figcaption>${kind}: ${fur} and ${neck}</figcaption></figure>`,
            ]),
          ),
        )}
      </div>

      <h2>Pets</h2>
      <div class="grid">
        ${kinds.map(
          (kind) =>
            html`<figure>${this._stage(kind, ROOM_ITEMS)}<figcaption>${kind}</figcaption></figure>`,
        )}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 16px 24px 48px;
      font-family: system-ui, sans-serif;
    }
    h1,
    h2 {
      font-weight: 500;
    }
    h2 {
      margin-top: 32px;
      border-top: 2px solid var(--divider-color, #3a3a3a);
      padding-top: 14px;
    }
    .muted {
      color: var(--secondary-text-color, #a8a8a8);
    }
    .chips {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .chips button {
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid #555;
      background: none;
      color: inherit;
      cursor: pointer;
    }
    .chips button.on {
      background: #03a9f4;
      border-color: #03a9f4;
      color: #000;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(360px, 100%), 1fr));
      gap: 16px;
    }
    figure {
      margin: 0;
    }
    figcaption {
      margin-top: 4px;
      font-size: 13px;
      color: var(--secondary-text-color, #a8a8a8);
    }
  `;
}

customElements.define("boopli-item-check", BoopliItemCheck);
