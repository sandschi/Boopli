import type { ChoreDraft } from "./types";
import { inEveryLanguage, t } from "./i18n";

/** Starter chores the user can pick and edit. */
export interface Template {
  label: string;
  draft: ChoreDraft;
}

/**
 * Whether a starter is already among the chores. A starter added while the panel was in another
 * language (or in English) has that language's name, so its name in every language counts too.
 */
export function starterNamesTaken(existing: string[]): (starterName: string) => boolean {
  const have = new Set(existing);
  const now = TEMPLATES().map((tpl) => tpl.draft.name);
  const everyLanguage = inEveryLanguage(() => TEMPLATES().map((tpl) => tpl.draft.name));
  return (name) => {
    const at = now.indexOf(name);
    return have.has(name) || (at >= 0 && everyLanguage.some((names) => have.has(names[at])));
  };
}

const noRepeat = { type: "none", time: "09:00", every_n_days: 1, days: {} } as const;

export const TEMPLATES = (): Template[] => [
  {
    label: t("templates.dishwasher"),
    draft: {
      name: t("templates.dishwasher"),
      where: "home",
      enabled: true,
      one_off: false,
      repeat: { ...noRepeat, days: {} },
      steps: [
        { title: t("templates.load_the_dishwasher"), wait_minutes: 0 },
        { title: t("templates.start_the_dishwasher"), wait_minutes: 0 },
        { title: t("templates.open_it_so_it_can_dry"), wait_minutes: 0 },
        { title: t("templates.empty_the_dishwasher"), wait_minutes: 180 },
      ],
    },
  },
  {
    label: t("templates.laundry"),
    draft: {
      name: t("templates.laundry"),
      where: "home",
      enabled: true,
      one_off: false,
      repeat: { ...noRepeat, days: {} },
      steps: [
        { title: t("templates.start_the_washing_machine"), wait_minutes: 0 },
        { title: t("templates.hang_the_laundry_up"), wait_minutes: 60 },
        { title: t("templates.take_the_laundry_down_and_put"), wait_minutes: 240 },
      ],
    },
  },
  {
    label: t("templates.trash"),
    draft: {
      name: t("templates.take_out_the_trash"),
      where: "home",
      enabled: true,
      one_off: false,
      repeat: { type: "schedule", time: "09:00", every_n_days: 1, days: { "3": ["19:00"] } },
      steps: [{ title: t("templates.take_out_the_trash"), wait_minutes: 0 }],
    },
  },
  {
    label: t("templates.pills"),
    draft: {
      name: t("templates.take_pills"),
      where: "anywhere",
      enabled: true,
      one_off: false,
      repeat: {
        type: "schedule",
        time: "09:00",
        every_n_days: 1,
        days: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [String(d), ["08:00"]])),
      },
      nudge_style: "ladder:standard_escalating",
      ignore_quiet_hours: true,
      keeps_going: true, // pills are taken on holiday too
      steps: [{ title: t("templates.take_your_pills"), wait_minutes: 0 }],
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
