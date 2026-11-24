/**
 * Boopli's font is Itim (SIL Open Font License, see fonts/OFL.txt), served by the integration itself, so
 * nothing is loaded from the internet. The browser keeps font files declared inside a shadow root to itself,
 * so the font is added to the page's own font list once; every part of the panel can then use it by name.
 */
const FILES: { file: string; range: string }[] = [
  {
    file: "Itim-latin.woff2",
    range: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  },
  {
    file: "Itim-latin-ext.woff2",
    range: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
  },
];

/** The font stack every part of Boopli uses: Itim, then what Home Assistant uses while it loads. */
export const BOOPLI_FONT = `"Itim", var(--paper-font-body1_-_font-family, Roboto, sans-serif)`;

let started = false;

/** Load the font once per page. Safe to call again; failures are ignored (the fallback font is used). */
export function loadFonts(): void {
  if (started || typeof FontFace === "undefined" || !document.fonts) return;
  started = true;
  // The folder this script comes from (written as a plain join, so the build leaves it alone).
  const folder = import.meta.url.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  for (const { file, range } of FILES) {
    const face = new FontFace("Itim", `url(${folder}fonts/${file}) format("woff2")`, {
      style: "normal",
      weight: "400",
      unicodeRange: range,
      display: "swap",
    });
    face
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .catch(() => undefined);
  }
}
