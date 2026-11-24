import type { Mood } from "./types";
import { t } from "./i18n";

/** The pets to choose from. The same list as in the integration (PET_KINDS). */
export type PetKind = "bear" | "cat" | "dog" | "fox" | "slime";

export interface PetInfo {
  kind: PetKind;
  label: string;
  /** What is shown until the pet has its own animated art. */
  emoji: string;
  /** Whether the pet has its own animated art yet. */
  art: boolean;
}

export const PETS = (): PetInfo[] => [
  { kind: "slime", label: t("pets.slime"), emoji: "🟢", art: true },
  { kind: "bear", label: t("pets.bear"), emoji: "🐻", art: true },
  { kind: "cat", label: t("pets.cat"), emoji: "🐱", art: true },
  { kind: "dog", label: t("pets.dog"), emoji: "🐶", art: true },
  { kind: "fox", label: t("pets.fox"), emoji: "🦊", art: true },
];

export const DEFAULT_PET: PetKind = "slime";

export const MOODS: Mood[] = ["happy", "content", "sleepy", "sad", "hibernating"];

export function petInfo(kind: string | undefined): PetInfo {
  return PETS().find((p) => p.kind === kind) ?? PETS()[0];
}
