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

// 4: text written directly in templates
const allowFile = join(root, "scripts", "i18n-allow.txt");
const allowed = new Set(existsSync(allowFile) ? readFileSync(allowFile, "utf8").split(/\r?\n/).filter(Boolean) : []);
const hard = [];
const looksLikeText = (s) => /[A-Za-z]{2,}/.test(s) && !/^[\s\d.,:;·•/\\|()[\]{}%+\-–—×✓✕…]*$/.test(s);
for (const file of files) {
  const rel = relative(src, file).replaceAll("\\", "/");
  const text = readFileSync(file, "utf8");
  // only inside html`...` templates
  for (const block of text.matchAll(/html`([\s\S]*?)`(?=[;,)\s]|$)/g)) {
    const body = block[1].replace(/\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, "\u0000"); // blank out ${...}
    const startLine = text.slice(0, block.index).split("\n").length;
    for (const m of body.matchAll(/>([^<>\u0000]*[A-Za-z][^<>\u0000]*)</g)) {
      const s = m[1].trim();
      if (looksLikeText(s)) hard.push([rel, startLine + body.slice(0, m.index).split("\n").length - 1, s]);
    }
    for (const m of body.matchAll(/\b(?:title|placeholder|aria-label|label|alt)="([^"\u0000]*[A-Za-z][^"\u0000]*)"/g)) {
      const s = m[1].trim();
      if (looksLikeText(s)) hard.push([rel, startLine + body.slice(0, m.index).split("\n").length - 1, s]);
    }
    // text on its own lines between tags
    body.split("\n").forEach((line, i) => {
      const s = line.trim();
      if (/^[A-Z][^<>=;{}\u0000]*[a-z]{2}[^<>=;{}\u0000]*$/.test(s) && s.includes(" ")) {
        hard.push([rel, startLine + i, s]);
      }
    });
  }
}
const seen = new Set();
const remaining = hard.filter(([file, , s]) => {
  const id = `${file}: ${s}`;
  if (allowed.has(id) || seen.has(`${id}@${s}`)) return false;
  return true;
});

if (report) {
  const per = {};
  for (const [file] of remaining) per[file] = (per[file] ?? 0) + 1;
  for (const [file, n] of Object.entries(per).sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(4), file);
}
for (const [file, line, s] of remaining.slice(0, report ? 0 : 40)) console.log(`hard-coded text: ${file}:${line}: ${s.slice(0, 70)}`);
if (!report && remaining.length > 40) console.log(`... and ${remaining.length - 40} more (run with --report for counts)`);
for (const w of warnings.slice(0, 20)) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
console.log(
  `\n${used.size} keys used, ${Object.keys(en).length} keys in en.json, ${remaining.length} hard-coded texts, ${errors.length} errors`
);
process.exit(errors.length || remaining.length ? 1 : 0);
