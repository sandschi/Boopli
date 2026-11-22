import type { ChoreDraft } from "./types";

/** Starter chores the user can pick and edit. */
export interface Template {
  label: string;
  draft: ChoreDraft;
}

const noRepeat = { type: "none", time: "09:00", every_n_days: 1, days: {} } as const;

export const TEMPLATES: Template[] = [
  {
    label: "Dishwasher",
    draft: {
      name: "Dishwasher",
      where: "home",
      enabled: true,
      one_off: false,
      repeat: { ...noRepeat, days: {} },
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
      repeat: { ...noRepeat, days: {} },
      steps: [
        { title: "Start the washing machine", wait_minutes: 0 },
        { title: "Hang the laundry up", wait_minutes: 60 },
        { title: "Take the laundry down and put it away", wait_minutes: 240 },
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
      repeat: { type: "schedule", time: "09:00", every_n_days: 1, days: { "3": ["19:00"] } },
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
      repeat: {
        type: "schedule",
        time: "09:00",
        every_n_days: 1,
        days: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), ["08:00"]])),
      },
      nudge_style: "escalating",
      ignore_quiet_hours: true,
      keeps_going: true, // pills are taken on holiday too
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
    repeat: { type: "none", time: "09:00", every_n_days: 1, days: {} },
    steps: [{ title: "", wait_minutes: 0 }],
  };
}
