import type { PetKind } from "./pets";

/** The accent colour of each pet, taken from its own art. Light enough to read on a dark screen. */
export const PET_ACCENTS: Record<PetKind, string> = {
  slime: "#5ee05a",
  bear: "#d79563",
  dog: "#f5b544",
  fox: "#f28a30",
  cat: "#a894e8",
};

/** The ready-made colours next to "Pet's colour" (a custom colour is also possible). */
export const SWATCHES: { name: string; hex: string }[] = [
  { name: "Green", hex: "#5ee05a" },
  { name: "Teal", hex: "#3fd1b5" },
  { name: "Blue", hex: "#4fb3f0" },
  { name: "Lilac", hex: "#a894e8" },
  { name: "Pink", hex: "#f07db0" },
  { name: "Coral", hex: "#f0605d" },
  { name: "Orange", hex: "#f28a30" },
  { name: "Gold", hex: "#f5b544" },
];

const HEX = /^#[0-9a-f]{6}$/i;

export function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

/** The accent to use: the colour the user picked, else the pet's own. */
export function accentFor(kind: string | undefined, custom: string | undefined): string {
  if (isHex(custom)) return custom.toLowerCase();
  return PET_ACCENTS[(kind ?? "slime") as PetKind] ?? PET_ACCENTS.slime;
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Text on top of the accent: dark on a light colour, white on a dark one, so it always reads. */
export function inkFor(hex: string): string {
  return luminance(hex) > 0.3 ? "#14210f" : "#ffffff";
}

/** The darker colour of the thick edge under a pressable button. */
export function deepFor(hex: string): string {
  const [r, g, b] = channels(hex).map((v) => Math.round(v * 0.62));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Put the accent on an element; everything inside it reads `--boopli-accent`, `-ink` and `-deep`. */
export function applyAccent(el: HTMLElement, kind: string | undefined, custom: string | undefined): void {
  const hex = accentFor(kind, custom);
  el.style.setProperty("--boopli-accent", hex);
  el.style.setProperty("--boopli-accent-ink", inkFor(hex));
  el.style.setProperty("--boopli-accent-deep", deepFor(hex));
}
