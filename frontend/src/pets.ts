import type { Mood } from "./types";

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

export const PETS: PetInfo[] = [
  { kind: "slime", label: "Slime", emoji: "🟢", art: true },
  { kind: "bear", label: "Bear", emoji: "🐻", art: true },
  { kind: "cat", label: "Cat", emoji: "🐱", art: true },
  { kind: "dog", label: "Dog", emoji: "🐶", art: true },
  { kind: "fox", label: "Fox", emoji: "🦊", art: true },
];

export const DEFAULT_PET: PetKind = "slime";

export const MOODS: Mood[] = ["happy", "content", "sleepy", "sad", "hibernating"];

export function petInfo(kind: string | undefined): PetInfo {
  return PETS.find((p) => p.kind === kind) ?? PETS[0];
}
