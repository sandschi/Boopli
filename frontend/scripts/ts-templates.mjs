// Finds the tagged templates (html`...`, svg`...`) of a TypeScript file, also nested ones,
// and returns for each the static text with every ${...} replaced by one BLANK character,
// plus a map from positions in that text back to positions in the file.
export const BLANK = "\u0000";

export function scanTemplates(src, withStrings = false) {
  const out = [];
  const strings = [];
  const n = src.length;
  let i = 0;

  const skipString = (q) => {
    const from = i + 1;
    i++;
    while (i < n && src[i] !== q) {
      if (src[i] === "\\") i++;
      i++;
    }
    strings.push({ text: src.slice(from, i), at: from });
    i++;
  };
  const skipRegex = () => {
    i++;
    let inClass = false;
    while (i < n) {
      const c = src[i];
      if (c === "\\") i += 2;
      else if (c === "[") (inClass = true), i++;
      else if (c === "]") (inClass = false), i++;
      else if (c === "/" && !inClass) {
        i++;
        break;
      } else i++;
    }
    while (/[a-z]/.test(src[i] ?? "")) i++;
  };
  const prevSignificant = (at) => {
    let j = at - 1;
    while (j >= 0 && /\s/.test(src[j])) j--;
    return j >= 0 ? src[j] : "";
  };
  const tagBefore = (at) => {
    let j = at - 1;
    while (j >= 0 && /[\w$]/.test(src[j])) j--;
    return src.slice(j + 1, at);
  };

  function template(tag) {
    const quasis = [];
    i++; // the opening backtick
    let qs = i;
    while (i < n) {
      const c = src[i];
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === "`") {
        quasis.push([qs, i]);
        i++;
        break;
      }
      if (c === "$" && src[i + 1] === "{") {
        quasis.push([qs, i]);
        i += 2;
        expression();
        qs = i;
        continue;
      }
      i++;
    }
    if (tag !== "css" && tag !== "unsafeCSS") out.push({ tag, quasis });
  }

  function code(stopAtBrace) {
    let depth = 1;
    while (i < n) {
      const c = src[i];
      if (c === "'" || c === '"') {
        skipString(c);
        continue;
      }
      if (c === "`") {
        template(tagBefore(i));
        continue;
      }
      if (c === "/" && src[i + 1] === "/") {
        while (i < n && src[i] !== "\n") i++;
        continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        i += 2;
        while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
        i += 2;
        continue;
      }
      if (c === "/" && "(,=:[!&|?{};".includes(prevSignificant(i)) ) {
        skipRegex();
        continue;
      }
      if (stopAtBrace) {
        if (c === "{") depth++;
        else if (c === "}") {
          depth--;
          if (depth === 0) {
            i++;
            return;
          }
        }
      }
      i++;
    }
  }
  const expression = () => code(true);

  code(false);

  // build the blanked body of each template
  const templates = out.map(({ tag, quasis }) => {
    let body = "";
    const map = [];
    quasis.forEach(([s, e], k) => {
      for (let p = s; p < e; p++) {
        body += src[p];
        map.push(p);
      }
      if (k < quasis.length - 1) {
        body += BLANK;
        map.push(e);
      }
    });
    return { tag, body, map, range: [quasis[0][0], quasis[quasis.length - 1][1]] };
  });
  return withStrings ? { templates, strings } : templates;
}

/** The text nodes and attribute texts of a template body: [{ kind, text, at }] (at = index in body). */
export function textsOf(body) {
  const found = [];
  let i = 0;
  const n = body.length;
  let text = "";
  let textStart = 0;
  let lastTag = "";
  let pending = null; // the text run still waiting for the tag that follows it
  const flush = () => {
    if (text) {
      pending = { kind: "text", text, at: textStart, before: lastTag, after: "" };
      found.push(pending);
    }
    text = "";
  };
  while (i < n) {
    const c = body[i];
    if (c === "<" && /[a-zA-Z/!]/.test(body[i + 1] ?? "")) {
      flush();
      // a tag: read to the closing ">" (quotes inside may hold ">")
      let j = i + 1;
      let quote = "";
      const tagStart = i;
      while (j < n) {
        const d = body[j];
        if (quote) {
          if (d === quote) quote = "";
        } else if (d === '"' || d === "'") quote = d;
        else if (d === ">") break;
        j++;
      }
      const tag = body.slice(tagStart, j + 1);
      if (pending) pending.after = tag;
      pending = null;
      lastTag = tag;
      for (const m of tag.matchAll(/\b(title|placeholder|aria-label|label|alt|allLabel)="([^"]*)"/gi)) {
        found.push({ kind: "attr", attr: m[1], text: m[2], at: tagStart + m.index });
      }
      const name = /^<\/?([a-zA-Z][\w-]*)/.exec(tag)?.[1]?.toLowerCase();
      i = j + 1;
      if (name === "style" || name === "script") {
        const close = body.indexOf(`</${name}`, i);
        i = close < 0 ? n : close;
      }
      continue;
    }
    if (!text) textStart = i;
    text += c;
    i++;
  }
  flush();
  return found;
}
