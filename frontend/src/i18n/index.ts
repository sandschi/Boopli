/// <reference types="vite/client" />
/**
 * Text for the panel. Every text the person reads goes through `t("some.key")`.
 *
 * - `en.json` is the source: nested keys like `settings.phone.title`.
 * - Another language is a file with the same keys (`de.json`). A key it lacks shows the English text.
 * - Values can hold `{name}` places that `t` fills in: t("today.stepOf", { n: 3, total: 8 }).
 * - Words that change with a number use `count`: t("steps", { count: 3 }) looks up `steps_one`,
 *   `steps_few`, `steps_other` and so on, by the plural rules of the language (`Intl.PluralRules`).
 */
import en from "./en.json";

type Tree = { [key: string]: string | Tree };
export type Params = Record<string, string | number | boolean | null | undefined | object>;

function flatten(tree: Tree, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else flatten(value, path, out);
  }
  return out;
}

// Every file next to this one (de.json, fr.json, ...) is a language. Only `en` is needed.
const files = import.meta.glob<Tree>("./*.json", { eager: true, import: "default" });
const catalogs: Record<string, Record<string, string>> = {};
for (const [path, tree] of Object.entries(files)) {
  const code = path.replace("./", "").replace(".json", "").toLowerCase();
  catalogs[code] = flatten(tree);
}
catalogs.en = flatten(en as Tree);

let current = "en";

// --- fancy English --------------------------------------------------------------------------
// English written with accents. It is made from the English texts on the spot (no file), so it
// always has every text. `pseudo` is the same with [brackets], to spot a text that skipped t().
export const FANCY = "fancy";
const PSEUDO = "pseudo";
const ACCENTS: Record<string, string> = {
  a: "à", e: "é", i: "ï", o: "ö", u: "ü", c: "ç", n: "ñ", s: "š", y: "ý", z: "ž",
  A: "Å", E: "É", I: "Ï", O: "Ö", U: "Ü", C: "Ç", N: "Ñ", S: "Š", Y: "Ý", Z: "Ž",
};
/** Accented look-alike letters. {places}, <tags> and &entities; stay as they are. */
export function fancify(text: string): string {
  return text.replace(/(\{\w+\}|<[^>]*>|&\w+;)|([A-Za-z])/g, (_m, keep: string | undefined, letter: string) => keep ?? ACCENTS[letter] ?? letter);
}
const isFancy = (code: string): boolean => code === FANCY || code === PSEUDO;

// --- which language -------------------------------------------------------------------------
const CHOICE_KEY = "boopli.language";

/** The language the person picked in Settings in this browser. "" means the language of Home Assistant. */
export function languageChoice(): string {
  try {
    return localStorage.getItem(CHOICE_KEY) ?? "";
  } catch {
    return ""; // private window or blocked storage: the language of Home Assistant
  }
}

export function setLanguageChoice(code: string): void {
  try {
    if (code) localStorage.setItem(CHOICE_KEY, code);
    else localStorage.removeItem(CHOICE_KEY);
  } catch {
    /* nothing to keep it in */
  }
}

const hasCatalog = (code: string): boolean => Object.prototype.hasOwnProperty.call(catalogs, code);

/**
 * Pick the language to show. First `?lang=xx` in the address, then the person's choice in
 * Settings, then Home Assistant's own language. "de-AT" uses "de-at", else "de", else English.
 */
export function setLanguage(haLanguage: string | undefined): void {
  let fromAddress = "";
  try {
    fromAddress = new URLSearchParams(location.search).get("lang") ?? "";
  } catch {
    /* no address to read (a test) */
  }
  const wanted = (fromAddress || languageChoice() || haLanguage || "en").toLowerCase();
  if (isFancy(wanted)) {
    current = wanted;
    return;
  }
  current = [wanted, wanted.split("-")[0]].find(hasCatalog) ?? "en";
}

export function currentLanguage(): string {
  return current;
}

/** The languages that have a file, English first. */
export function languages(): string[] {
  return ["en", ...Object.keys(catalogs).filter((c) => c !== "en").sort()];
}

/** A language's name in that language ("Deutsch"), for the picker. */
export function languageName(code: string): string {
  if (code === FANCY) return fancify("Fancy English");
  try {
    const name = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
    return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  } catch {
    return code;
  }
}

function lookup(key: string, count: number | undefined): string | undefined {
  const own = isFancy(current) ? catalogs.en : catalogs[current];
  const fallback = catalogs.en;
  if (count !== undefined) {
    const rule = new Intl.PluralRules(isFancy(current) ? "en" : current).select(count);
    for (const k of [`${key}_${rule}`, `${key}_other`]) {
      if (own[k] !== undefined) return own[k];
    }
    for (const k of [`${key}_${new Intl.PluralRules("en").select(count)}`, `${key}_other`]) {
      if (fallback[k] !== undefined) return fallback[k];
    }
  }
  return own[key] ?? fallback[key];
}

/** The text for a key in the current language, with the values filled in. */
export function t(key: string, params?: Params): string {
  const count = typeof params?.count === "number" ? params.count : undefined;
  const found = lookup(key, count);
  let text = found ?? key; // a missing key shows itself, so it is easy to spot
  if (found !== undefined && isFancy(current)) text = current === PSEUDO ? `[${fancify(found)}]` : fancify(found);
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name] ?? "") : whole));
}

// --- sentences with a little markup -----------------------------------------------------
import { html, type TemplateResult } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);
const ALLOWED_TAG = /^<\/?(b|i|em|strong|code)>$|^<br\s*\/?>$/;

/**
 * Like `t`, for a sentence that holds <b>, <i>, <em>, <strong>, <code> or <br>. The values are
 * escaped, and any other tag in a translation is shown as text, so a translation cannot
 * add markup.
 */
export function rich(key: string, params?: Record<string, string | number | TemplateResult>): TemplateResult {
  const safe: Params = {};
  const slots: Record<string, TemplateResult> = {};
  for (const [name, value] of Object.entries(params ?? {})) {
    if (typeof value === "number") safe[name] = value;
    else if (typeof value === "string") safe[name] = escapeHtml(value);
    else slots[name] = value; // a link or another template: it goes in where {name} stands
  }
  const text = t(key, safe).replace(/<[^>]*>/g, (tag) => (ALLOWED_TAG.test(tag) ? tag : escapeHtml(tag)));
  if (Object.keys(slots).length === 0) return html`${unsafeHTML(text)}`;
  // t() leaves {name} places it was not given, so the templates can be put in now
  const parts = text.split(/\{(\w+)\}/);
  return html`${parts.map((part, i) => (i % 2 ? (slots[part] ?? `{${part}}`) : unsafeHTML(part)))}`;
}

/** Whether a key has a text in the current language or in English. */
export function hasText(key: string): boolean {
  return catalogs[current]?.[key] !== undefined || catalogs.en[key] !== undefined;
}
