import { weekdayNames } from "./time";
import { t } from "./i18n";
import type {
  AlarmDeviceCfg,
  Hass,
  Ladder,
  LightCfg,
  QuietDay,
  QuietHours,
  SpeakerCfg,
  SpeechRoute,
  Snapshot,
  Access,
} from "./types";


/** What this person may do. Before the integration says (an older one), nothing is hidden: it checks anyway. */
export function accessOf(snapshot?: Snapshot): Access {
  return snapshot?.access ?? { level: 3, admin: true, notes: true, all: true };
}

export const ALEXA_ALARM_SOUND = "amzn_sfx_scifi_alarm_01";
export const ALEXA_DING_SOUND = "amzn_sfx_doorbell_chime_01";
export const ALARM_DOMAINS = ["siren", "switch", "input_boolean", "script"];
export const DEFAULT_QUIET_DAY: QuietDay = { start: "07:00", stop: "22:00" };

export function friendlyName(hass: Hass | undefined, entityId: string): string {
  const name = hass?.states[entityId]?.attributes?.friendly_name;
  return typeof name === "string" && name ? name : entityId;
}

/** Entity ids of some domains, sorted by their friendly name. */
export function entityIds(hass: Hass | undefined, domains: string[], exclude: string[] = []): string[] {
  return Object.keys(hass?.states ?? {})
    .filter((id) => domains.includes(id.split(".")[0]) && !exclude.includes(id))
    .sort((a, b) => friendlyName(hass, a).localeCompare(friendlyName(hass, b)));
}

/** The things a spoken sentence can be sent to, for each way of speaking. */
export function speechTargets(
  hass: Hass | undefined,
  route: SpeechRoute,
  current: string
): { value: string; label: string }[] {
  let options: { value: string; label: string }[];
  if (route === "alexa_media") {
    options = Object.keys(hass?.services?.notify ?? {})
      .filter((s) => s.startsWith("alexa_media_") && s !== "alexa_media")
      .sort()
      .map((s) => ({ value: s, label: s.replace("alexa_media_", "") }));
  } else if (route === "alexa_devices") {
    options = Object.keys(hass?.states ?? {})
      .filter((id) => id.startsWith("notify.") && /_(speak|announce)$/.test(id))
      .sort()
      .map((id) => ({ value: id, label: friendlyName(hass, id) }));
  } else {
    options = entityIds(hass, ["tts"]).map((id) => ({ value: id, label: friendlyName(hass, id) }));
  }
  if (current && !options.some((o) => o.value === current)) {
    options.unshift({ value: current, label: t("speakers.not_found", { current }) });
  }
  return options;
}

export function newLight(entityId: string): LightCfg {
  return {
    entity_id: entityId,
    mode: "blink",
    color: [255, 90, 0],
    blink_ms: 1500,
    repeats: 1,
    gap_ms: 1000,
    start_at: 1,
  };
}

export function newSpeaker(entityId: string): SpeakerCfg {
  return {
    entity_id: entityId,
    cue: { enabled: true, kind: "alexa", sound: ALEXA_DING_SOUND, start_at: 1, seconds: 30, repeat_s: 5 },
    speech: { enabled: false, route: "alexa_media", target: "", announce: false, start_at: 2 },
    alarm: { enabled: true, kind: "alexa", sound: ALEXA_ALARM_SOUND, start_at: 4, seconds: 30, repeat_s: 5 },
  };
}

export function newAlarmDevice(entityId: string): AlarmDeviceCfg {
  return { entity_id: entityId, seconds: 30, start_at: 4 };
}

export function hexToRgb(hex: string): number[] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(rgb: number[]): string {
  return "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
}

export function phoneName(service: string): string {
  return service.replace("mobile_app_", "");
}

export const PHONE_LEVEL_LABEL = (): Record<string, string> => ({
  normal: t("helpers.level_normal"),
  high: t("helpers.level_high"),
  alarm: t("helpers.level_alarm"),
  alarm_max: t("helpers.level_alarm_max"),
});

export const STYLE_LABEL = (): Record<string, string> => ({
  quiet: t("common.quiet"),
  one: t("helpers.one_nudge"),
  escalating: t("helpers.escalating"),
  persistent: t("helpers.persistent"),
});

/**
 * Whether a light can show a color (the same test Boopli uses when it sends one). A light that cannot, only
 * goes on and off, so there is no color to pick. When the light's state is not known, say yes.
 */
export function lightHasColor(hass: Hass | undefined, entityId: string): boolean {
  const modes = hass?.states[entityId]?.attributes?.supported_color_modes;
  if (!Array.isArray(modes)) return true;
  return modes.some((m) => ["rgb", "rgbw", "rgbww", "xy", "hs"].includes(String(m)));
}

/** A short unique id for a new ladder. */
export function newLadderId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  } catch {
    return Math.random().toString(16).slice(2, 14).padEnd(12, "0");
  }
}

/** The name of a nudge style, including one of your own ladders. A ladder that is gone is called that. */
/** A stored built-in style ("escalating") as the standard ladder that replaced it, when there is one. */
export function normalizeStyle(style: string, ladders: Ladder[] | undefined): string {
  const id = { one: "standard_one", escalating: "standard_escalating", persistent: "standard_persistent" }[style];
  return id && ladders?.some((l) => l.id === id) ? `ladder:${id}` : style;
}

/**
 * The name of a ladder as shown. The three standard ladders are stored with their English names; while
 * one still has that name it is shown in the panel's language, and once you rename it your name is shown.
 */
export function ladderName(l: Ladder): string {
  const standard: Record<string, [string, () => string]> = {
    standard_one: ["One nudge", () => t("helpers.one_nudge")],
    standard_escalating: ["Escalating", () => t("helpers.escalating")],
    standard_persistent: ["Persistent", () => t("helpers.persistent")],
  };
  const entry = standard[l.id];
  return entry && l.name === entry[0] ? entry[1]() : l.name;
}

export function styleLabel(style: string, ladders: Ladder[] | undefined): string {
  if (style.startsWith("ladder:")) {
    const ladder = ladders?.find((l) => `ladder:${l.id}` === style);
    return ladder ? ladderName(ladder) : t("chore_editor.a_ladder_that_is_gone");
  }
  return STYLE_LABEL()[style] ?? style;
}

/**
 * Quiet hours in plain words. Days that share the same hours and sit next to
 * each other are written together ("Mon to Fri 07:30 to 22:00") just to keep it
 * short; each day is still stored on its own.
 */
export function describeQuiet(qh: QuietHours): string {
  if (!qh.enabled) return t("helpers.off_boopli_nudges_at_any_time");
  const parts: string[] = [];
  let i = 0;
  while (i < 7) {
    const day = qh.days[String(i)] ?? null;
    let j = i;
    while (
      j + 1 < 7 &&
      (qh.days[String(j + 1)] ?? null)?.start === day?.start &&
      (qh.days[String(j + 1)] ?? null)?.stop === day?.stop
    )
      j++;
    const name = i === j ? weekdayNames()[i] : t("helpers.day_range", { from: weekdayNames()[i], to: weekdayNames()[j] });
    parts.push(day ? t("helpers.day_hours", { name, start: day.start, stop: day.stop }) : t("helpers.no_limit", { name }));
    i = j + 1;
  }
  return t("helpers.nudges_allowed", { hours: parts.join(", ") });
}

/** What a speaker plays, in a few words. */
export function describeSpeaker(s: SpeakerCfg): string {
  const kind = s.speech.route === "tts" ? t("helpers.tts_voice") : s.speech.route === "alexa_devices" ? t("helpers.alexa_devices") : t("helpers.alexa_media_player");
  return s.speech.target && s.speech.enabled ?t("helpers.speaks", { kind }) : t("helpers.no_speaking_device_yet", { kind });
}

export function lightKind(l: LightCfg): string {
  return l.mode === "indicator" ? t("helpers.status_light_stays_on") : t("helpers.blinks");
}
