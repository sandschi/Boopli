import type { ChoreDraft } from "./types";

/** Starter chores the user can pick and edit. */
export interface Template {
  label: string;
  draft: ChoreDraft;
}

const noRepeat = { type: "none", time: "09:00", weekdays: [], every_n_days: 1 } as const;

export const TEMPLATES: Template[] = [
  {
    label: "Dishwasher",
    draft: {
      name: "Dishwasher",
      where: "home",
      enabled: true,
      one_off: false,
      repeat: { ...noRepeat, weekdays: [] },
      steps: [
        { title: "Load the dishwasher", wait_minutes: 0 },
        { title: "Start the dishwasher", wait_minutes: 0 },
        { title: "Open it so it can dry", wait_minutes: 0 },
        { title: "Empty the dishwasher", wait_minutes: 180 },
      ],
    },
  },
  {
    label: "Laundry",
    draft: {
      name: "Laundry",
      where: "home",
      enabled: true,
      one_off: false,
      repeat: { ...noRepeat, weekdays: [] },
      steps: [
        { title: "Start the washing machine", wait_minutes: 0 },
        { title: "Move the laundry to the dryer", wait_minutes: 60 },
        { title: "Take the laundry out and fold it", wait_minutes: 90 },
      ],
    },
  },
  {
    label: "Trash",
    draft: {
      name: "Take out the trash",
      where: "home",
      enabled: true,
      one_off: false,
      repeat: { type: "weekly", time: "19:00", weekdays: [3], every_n_days: 1 },
      steps: [{ title: "Take out the trash", wait_minutes: 0 }],
    },
  },
  {
    label: "Pills",
    draft: {
      name: "Take pills",
      where: "anywhere",
      enabled: true,
      one_off: false,
      repeat: { type: "daily", time: "08:00", weekdays: [], every_n_days: 1 },
      steps: [{ title: "Take your pills", wait_minutes: 0 }],
    },
  },
];

export function blankDraft(): ChoreDraft {
  return {
    name: "",
    where: "home",
    enabled: true,
    one_off: false,
    repeat: { type: "none", time: "09:00", weekdays: [], every_n_days: 1 },
    steps: [{ title: "", wait_minutes: 0 }],
  };
}
