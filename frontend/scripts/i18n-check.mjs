// Checks the panel's translations. Run: npm run i18n:check   (add --report for a list per file)
//
//  1. every t("key") used in the code exists in src/i18n/en.json
//  2. every key in en.json is used (a warning)
//  3. every other language file has only keys that en.json has, with the same {places}
//  4. no visible text is written directly in a template (the "hard-coded" list). Texts that must
//     stay as they are go in scripts/i18n-allow.txt, one `file: text` per line.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "src");
const report = process.argv.includes("--report");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === "i18n" ? [] : walk(full);
    return full.endsWith(".ts") ? [full] : [];
  });
}

function flatten(tree, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else flatten(value, path, out);
  }
  return out;
}

const i18nDir = join(src, "i18n");
const en = flatten(JSON.parse(readFileSync(join(i18nDir, "en.json"), "utf8")));
const files = walk(src);
const errors = [];
const warnings = [];

// 1 and 2: keys used in code
const used = new Set();
const prefixes = new Set();
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(/\bt\(\s*(["'`])([\w.]+?)(\$\{|\1)/g)) {
    if (m[3] === "${") prefixes.add(m[2]); // t(`errors.${code}`): everything under errors. counts as used
    else used.add(m[2]);
  }
}
const baseKey = (k) => k.replace(/_(zero|one|two|few|many|other)$/, "");
for (const key of used) {
  if (!(key in en) && !Object.keys(en).some((k) => baseKey(k) === key)) {
    errors.push(`missing in en.json: ${key}`);
  }
}
for (const key of Object.keys(en)) {
  const base = baseKey(key);
  if (!used.has(key) && !used.has(base) && ![...prefixes].some((p) => key.startsWith(p))) {
    warnings.push(`never used: ${key}`);
  }
}

// 3: other languages
const places = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
for (const name of readdirSync(i18nDir).filter((n) => n.endsWith(".json") && n !== "en.json")) {
  const other = flatten(JSON.parse(readFileSync(join(i18nDir, name), "utf8")));
  for (const [key, value] of Object.entries(other)) {
    if (!(key in en) && !Object.keys(en).some((k) => baseKey(k) === baseKey(key))) {
      errors.push(`${name}: key not in en.json: ${key}`);
    } else if (key in en && places(value) !== places(en[key])) {
      errors.push(`${name}: {places} differ from English in ${key}`);
    }
  }
}

// 4: text written directly in templates, and sentences written as string literals
import { scanTemplates, textsOf, BLANK } from "./ts-templates.mjs";
const allowFile = join(root, "scripts", "i18n-allow.txt");
const allowed = new Set(existsSync(allowFile) ? readFileSync(allowFile, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#")) : []);
const looksLikeText = (s) => /[A-Za-z]{2,}/.test(s) && !/^[\s\d.,:;·•/\|()[\]{}%+\-–—×✓✕…]*$/.test(s);
const identifierish = (s) => /^[\w./:@#-]+$/.test(s) && /[_/.:@#]/.test(s);
const hard = []; // { file, line, text, why }
for (const file of files) {
  const rel = relative(src, file).replaceAll("\\", "/");
  const text = readFileSync(file, "utf8");
  const lineOf = (at) => text.slice(0, at).split("\n").length;
  const { templates, strings } = scanTemplates(text, true);
  for (const tpl of templates) {
    for (const f of textsOf(tpl.body)) {
      const real = f.text.replaceAll(BLANK, " ").replace(/\s+/g, " ").trim();
      if (!looksLikeText(real) || identifierish(real) || /^https?:/.test(real)) continue;
      const at = tpl.map[Math.min(f.at, tpl.map.length - 1)];
      hard.push({ file: rel, line: lineOf(at), text: real, why: f.text.includes(BLANK) ? "with values" : f.kind });
    }
  }
  // a sentence as a string literal: three or more words, starting with a capital letter
  for (const s of strings) {
    const v = s.text;
    if (/^[A-Z][a-z'’]+( [\w'’,.!?:;…()-]+){2,}/.test(v) && !/^(Itim|Roboto)/.test(v)) {
      hard.push({ file: rel, line: lineOf(s.at), text: v, why: "string" });
    }
  }
}
const remaining = hard.filter((h) => !allowed.has(`${h.file}: ${h.text}`));

if (report) {
  const per = {};
  for (const h of remaining) per[h.file] = (per[h.file] ?? 0) + 1;
  for (const [file, n] of Object.entries(per).sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(4), file);
}
const showAll = process.argv.includes("--all");
for (const h of remaining.slice(0, report ? 0 : showAll ? remaining.length : 40)) console.log(`hard-coded [${h.why}] ${h.file}:${h.line}: ${h.text.slice(0, 80)}`);
if (!report && !showAll && remaining.length > 40) console.log(`... and ${remaining.length - 40} more (run with --report for counts, --all for the list)`);
for (const w of warnings.slice(0, 20)) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
console.log(`\n${used.size} keys used, ${Object.keys(en).length} keys in en.json, ${remaining.length} hard-coded texts, ${errors.length} errors`);
process.exit(errors.length || remaining.length ? 1 : 0);
