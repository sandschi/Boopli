// Makes src/i18n/pseudo.json: every text with accented look-alike letters, like "[Ŝàvé]".
// Open the panel with ?lang=pseudo: any English text you still see did not go through t().
// The file is for testing only and is not committed.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const dir = join(fileURLToPath(new URL("..", import.meta.url)), "src", "i18n");
const en = JSON.parse(readFileSync(join(dir, "en.json"), "utf8"));
const MAP = { a: "à", e: "é", i: "ï", o: "ö", u: "ü", c: "ç", n: "ñ", s: "š", y: "ý", A: "Å", E: "É", I: "Ï", O: "Ö", U: "Ü", S: "Š", C: "Ç" };
function pseudo(s) {
  // keep {places}, <tags> and &entities; change only the letters between them
  return "[" + s.replace(/(\{\w+\}|<[^>]*>|&\w+;)|([A-Za-z])/g, (m, keep, letter) => (keep ? keep : MAP[letter] ?? letter)) + "]";
}
const walk = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? pseudo(v) : walk(v)]));
writeFileSync(join(dir, "pseudo.json"), JSON.stringify(walk(en), null, 2) + "\n");
console.log("src/i18n/pseudo.json written");
