import { html, nothing, type TemplateResult } from "lit";
import { live } from "lit/directives/live.js";
import { ALEXA_SOUNDS } from "./alexa-sounds";
import { hasText, t } from "./i18n";
import { dateLocale } from "./time";

type Sound = { id: string; name: string; seconds: number };

const SOUNDS: readonly Sound[] = ALEXA_SOUNDS.map(([id, name, , seconds]) => ({ id, name, seconds }));
const KNOWN: ReadonlySet<string> = new Set(SOUNDS.map((s) => s.id));

/** The sound's name in the panel's language (Amazon's English name if there is no translation). */
const soundName = (s: Sound): string => {
  const short = s.id.replace(/^amzn_sfx_/, "");
  return hasText(`common.alexa_snd_${short}`) ? t(`common.alexa_snd_${short}`) : s.name;
};

const byName = (a: string, b: string): number => a.localeCompare(b, dateLocale(), { numeric: true });

/**
 * Choose an Alexa sound from one short list, sorted by name. Only sounds that really play on a real Alexa are
 * listed. A sound of your own that is already chosen shows a note until another one is picked.
 */
export function alexaSoundPicker(
  value: string,
  onChange: (id: string) => void,
  /** A Test button under the picker: it plays the chosen sound on a speaker; `note` is what came back. */
  test?: { run: () => void; note?: string },
): TemplateResult {
  const known = KNOWN.has(value);
  const sounds = SOUNDS.map((s) => ({ ...s, label: soundName(s) })).sort((a, b) => byName(a.label, b.label));
  return html`
    <label class="num wide">
      ${t("common.alexa_sound_which")}
      <select @change=${(e: Event) => onChange((e.target as HTMLSelectElement).value)}>
        ${known
          ? nothing
          : html`<option value="" .selected=${live(true)} disabled>${value ? t("common.alexa_sound_own_in_use") : t("common.alexa_sound_pick")}</option>`}
        ${sounds.map((s) => html`<option value=${s.id} .selected=${live(s.id === value)}>${s.label} · ${s.seconds.toFixed(1)} s</option>`)}
      </select>
    </label>
    ${test
      ? html`<div class="soundtest">
          <button type="button" class="test" ?disabled=${!value} @click=${test.run}>${t("common.test")}</button>
          ${test.note ? html`<span class="note muted small">${test.note}</span>` : nothing}
        </div>`
      : nothing}
  `;
}
