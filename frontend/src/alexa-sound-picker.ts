import { html, nothing, type TemplateResult } from "lit";
import { live } from "lit/directives/live.js";
import { ALEXA_SOUNDS } from "./alexa-sounds";
import { t, rich } from "./i18n";

const SOUND_LIBRARY_URL = "https://developer.amazon.com/en-US/docs/alexa/custom-skills/ask-soundlibrary.html";

type Sound = { id: string; name: string; seconds: number };

/** Sounds grouped by their main category (Alarms, Animals, ...), both sorted by name. */
const GROUPS: ReadonlyMap<string, readonly Sound[]> = (() => {
  const map = new Map<string, Sound[]>();
  for (const [id, name, category, seconds] of ALEXA_SOUNDS) {
    const top = category.split("/")[0];
    (map.get(top) ?? map.set(top, []).get(top)!).push({ id, name, seconds });
  }
  for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b, "en")));
})();

const BY_ID: ReadonlyMap<string, string> = new Map(
  [...GROUPS.entries()].flatMap(([top, list]) => list.map((s) => [s.id, top] as const)),
);

/**
 * Choose an Alexa sound: first a kind of sound, then the sound itself. Picking a kind already picks its first
 * sound, so there is always something to press Test on. An ID that is not in the list stays usable under
 * "Type an ID yourself".
 */
export function alexaSoundPicker(
  value: string,
  onChange: (id: string) => void,
  /** A Test button under the pickers: it plays the chosen sound on a speaker; `note` is what came back. */
  test?: { run: () => void; note?: string },
): TemplateResult {
  const known = BY_ID.get(value);
  const sounds = known ? GROUPS.get(known)! : [];
  return html`
    <label class="num wide">
      ${t("common.alexa_sound_kind")}
      <select
        @change=${(e: Event) => {
          const first = GROUPS.get((e.target as HTMLSelectElement).value)?.[0];
          if (first) onChange(first.id);
        }}
      >
        <option value="" .selected=${live(!known)} ?disabled=${!!known}>${known ? t("common.alexa_sound_pick_kind") : value ? t("common.alexa_sound_own_in_use") : t("common.alexa_sound_pick_kind")}</option>
        ${[...GROUPS.keys()].map((top) => html`<option value=${top} .selected=${live(top === known)}>${top}</option>`)}
      </select>
    </label>
    ${known
      ? html`<label class="num wide">
          ${t("common.alexa_sound_which")}
          <select @change=${(e: Event) => onChange((e.target as HTMLSelectElement).value)}>
            ${sounds.map((s) => html`<option value=${s.id} .selected=${live(s.id === value)}>${s.name} · ${s.seconds.toFixed(1)} s</option>`)}
          </select>
        </label>`
      : nothing}
    ${test
      ? html`<div class="soundtest">
          <button type="button" class="test" ?disabled=${!value} @click=${test.run}>${t("common.test")}</button>
          ${test.note ? html`<span class="note muted small">${test.note}</span>` : nothing}
        </div>`
      : nothing}
    <details class="soundown" ?open=${!!value && !known}>
      <summary>${t("common.alexa_sound_type_own")}</summary>
      <label class="num wide">
        ${t("common.alexa_sound_id")}
        <input
          type="text"
          .value=${value}
          placeholder="amzn_sfx_…"
          @change=${(e: Event) => onChange((e.target as HTMLInputElement).value.trim())}
        />
      </label>
    </details>
    <div class="muted small libhint">
      ${rich("common.alexa_sound_library_hint", {
        library: html`<a href=${SOUND_LIBRARY_URL} target="_blank" rel="noopener noreferrer">${t("common.alexa_sound_library_name")}</a>`,
      })}
    </div>
  `;
}
