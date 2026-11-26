import { html, nothing, type TemplateResult } from "lit";
import { live } from "lit/directives/live.js";
import { ALEXA_SOUNDS } from "./alexa-sounds";
import { hasText, t } from "./i18n";
import { dateLocale } from "./time";

type Sound = { id: string; name: string; seconds: number };

/** Sounds grouped by their main category (Alarms, Animals, ...); shown sorted by their translated names. */
const GROUPS: ReadonlyMap<string, readonly Sound[]> = (() => {
  const map = new Map<string, Sound[]>();
  for (const [id, name, category, seconds] of ALEXA_SOUNDS) {
    const top = category.split("/")[0];
    (map.get(top) ?? map.set(top, []).get(top)!).push({ id, name, seconds });
  }
  return map;
})();

/** The kind's name in the panel's language (Amazon's English name if there is no translation). */
const kindName = (top: string): string => {
  const name = top.toLowerCase();
  return hasText(`common.alexa_kind_${name}`) ? t(`common.alexa_kind_${name}`) : top;
};

/** The sound's name in the panel's language (Amazon's English name if there is no translation). */
const soundName = (s: Sound): string => {
  const short = s.id.replace(/^amzn_sfx_/, "");
  return hasText(`common.alexa_snd_${short}`) ? t(`common.alexa_snd_${short}`) : s.name;
};

const byName = (a: string, b: string): number => a.localeCompare(b, dateLocale(), { numeric: true });
const BY_ID: ReadonlyMap<string, string> = new Map(
  [...GROUPS.entries()].flatMap(([top, list]) => list.map((s) => [s.id, top] as const)),
);

/**
 * Choose an Alexa sound: first a kind of sound, then the sound itself. Picking a kind already picks its first
 * sound, so there is always something to press Test on. Only sounds that really play on a real Alexa are listed.
 */
export function alexaSoundPicker(
  value: string,
  onChange: (id: string) => void,
  /** A Test button under the pickers: it plays the chosen sound on a speaker; `note` is what came back. */
  test?: { run: () => void; note?: string },
): TemplateResult {
  const known = BY_ID.get(value);
  const sounds = known ? GROUPS.get(known)!.map((s) => ({ ...s, label: soundName(s) })).sort((a, b) => byName(a.label, b.label)) : [];
  const kinds = [...GROUPS.keys()].map((top) => ({ top, label: kindName(top) })).sort((a, b) => byName(a.label, b.label));
  return html`
    <label class="num wide">
      ${t("common.alexa_sound_kind")}
      <select
        @change=${(e: Event) => {
          const list = GROUPS.get((e.target as HTMLSelectElement).value);
          const first = list && [...list].sort((a, b) => byName(soundName(a), soundName(b)))[0];
          if (first) onChange(first.id);
        }}
      >
        <option value="" .selected=${live(!known)} ?disabled=${!!known}>${known ? t("common.alexa_sound_pick_kind") : value ? t("common.alexa_sound_own_in_use") : t("common.alexa_sound_pick_kind")}</option>
        ${kinds.map((k) => html`<option value=${k.top} .selected=${live(k.top === known)}>${k.label}</option>`)}
      </select>
    </label>
    ${known
      ? html`<label class="num wide">
          ${t("common.alexa_sound_which")}
          <select @change=${(e: Event) => onChange((e.target as HTMLSelectElement).value)}>
            ${sounds.map((s) => html`<option value=${s.id} .selected=${live(s.id === value)}>${s.label} · ${s.seconds.toFixed(1)} s</option>`)}
          </select>
        </label>`
      : nothing}
    ${test
      ? html`<div class="soundtest">
          <button type="button" class="test" ?disabled=${!value} @click=${test.run}>${t("common.test")}</button>
          ${test.note ? html`<span class="note muted small">${test.note}</span>` : nothing}
        </div>`
      : nothing}
  `;
}
