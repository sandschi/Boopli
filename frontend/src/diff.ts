import { friendlyName, lightKind, phoneName, PHONE_LEVEL_LABEL, STYLE_LABEL } from "./helpers";
import { WEEKDAY_NAMES } from "./time";
import type { Hass, Settings, SoundCfg, SpeakerCfg } from "./types";

/** Compare two arrays of items by a key. */
function byKey<T>(before: T[], after: T[], key: (item: T) => string) {
  const b = new Map(before.map((x) => [key(x), x]));
  const a = new Map(after.map((x) => [key(x), x]));
  return {
    added: [...a].filter(([k]) => !b.has(k)).map(([, v]) => v),
    removed: [...b].filter(([k]) => !a.has(k)).map(([, v]) => v),
    kept: [...a].filter(([k]) => b.has(k)).map(([k, v]) => ({ before: b.get(k) as T, after: v })),
  };
}

function soundChanges(name: string, b: SoundCfg, a: SoundCfg, withAlarm: boolean): string[] {
  const out: string[] = [];
  if (b.enabled !== a.enabled) out.push(`${name} ${a.enabled ? "on" : "off"}`);
  if (a.enabled) {
    if (b.sound !== a.sound) out.push(`${name} sound ${b.sound} → ${a.sound}`);
    if (b.start_at !== a.start_at) out.push(`${name} starts at nudge ${b.start_at} → ${a.start_at}`);
    if (withAlarm && b.seconds !== a.seconds) out.push(`${name} lasts ${b.seconds} → ${a.seconds} s`);
    if (withAlarm && b.repeat_s !== a.repeat_s) out.push(`${name} repeats every ${b.repeat_s} → ${a.repeat_s} s`);
  }
  return out;
}

function speakerChanges(b: SpeakerCfg, a: SpeakerCfg): string[] {
  const out = [
    ...soundChanges("ding", b.cue, a.cue, false),
    ...soundChanges("alarm", b.alarm, a.alarm, true),
  ];
  if (b.speech.enabled !== a.speech.enabled) out.push(`speech ${a.speech.enabled ? "on" : "off"}`);
  if (a.speech.enabled) {
    if (b.speech.target !== a.speech.target || b.speech.route !== a.speech.route)
      out.push(`speech goes to ${a.speech.target || "nothing"}`);
    if (b.speech.start_at !== a.speech.start_at)
      out.push(`speech starts at nudge ${b.speech.start_at} → ${a.speech.start_at}`);
  }
  return out;
}

/**
 * The difference between two sets of settings, as short plain sentences.
 * An empty list means nothing changed.
 */
export function diffSettings(before: Settings, after: Settings, hass?: Hass): string[] {
  const name = (id: string) => friendlyName(hass, id);
  const out: string[] = [];

  if (before.pet_name !== after.pet_name) out.push(`Pet name: ${before.pet_name} → ${after.pet_name}`);

  const phones = byKey(before.phones, after.phones, (p) => p.service);
  phones.added.forEach((p) => out.push(`Phone added: ${phoneName(p.service)} (${PHONE_LEVEL_LABEL[p.level] ?? p.level})`));
  phones.removed.forEach((p) => out.push(`Phone removed: ${phoneName(p.service)}`));
  phones.kept.forEach(({ before: b, after: a }) => {
    if (b.level !== a.level)
      out.push(`${phoneName(a.service)}: level ${PHONE_LEVEL_LABEL[b.level]} → ${PHONE_LEVEL_LABEL[a.level]}`);
    if (b.start_at !== a.start_at)
      out.push(`${phoneName(a.service)}: starts at nudge ${b.start_at} → ${a.start_at}`);
  });

  const qb = before.quiet_hours;
  const qa = after.quiet_hours;
  if (qb.enabled !== qa.enabled) {
    out.push(`Quiet hours: ${qb.enabled ? "on" : "off"} → ${qa.enabled ? "on" : "off"}`);
  }
  if (qa.enabled) {
    // One line per day that changed, never grouped.
    const window = (q: Settings["quiet_hours"], i: number) => {
      const day = q.days[String(i)] ?? null;
      return day ? `${day.start} to ${day.stop}` : "no limit";
    };
    WEEKDAY_NAMES.forEach((dayName, i) => {
      const was = qb.enabled ? window(qb, i) : "any time";
      const now = window(qa, i);
      if (was !== now) out.push(`${dayName}: ${was} → ${now}`);
    });
  }

  if (before.snooze_minutes !== after.snooze_minutes)
    out.push(`Snooze: ${before.snooze_minutes} → ${after.snooze_minutes} min`);
  if ((before.question_wait_minutes ?? 30) !== (after.question_wait_minutes ?? 30))
    out.push(
      `Wait for your answers: ${before.question_wait_minutes ?? 30} → ${after.question_wait_minutes ?? 30} min`
    );
  if (before.default_style !== after.default_style)
    out.push(`Default style: ${STYLE_LABEL[before.default_style]} → ${STYLE_LABEL[after.default_style]}`);

  const lights = byKey(before.lights, after.lights, (l) => l.entity_id);
  lights.added.forEach((l) => out.push(`Reminder light added: ${name(l.entity_id)} (${lightKind(l)})`));
  lights.removed.forEach((l) => out.push(`Reminder light removed: ${name(l.entity_id)}`));
  lights.kept.forEach(({ before: b, after: a }) => {
    const n = name(a.entity_id);
    if (b.mode !== a.mode) out.push(`${n}: ${lightKind(b)} → ${lightKind(a)}`);
    if (b.color.join() !== a.color.join()) out.push(`${n}: color changed`);
    if (b.blink_ms !== a.blink_ms) out.push(`${n}: blink length ${b.blink_ms} → ${a.blink_ms} ms`);
    if (b.repeats !== a.repeats) out.push(`${n}: blinks ${b.repeats} → ${a.repeats}`);
    if (b.gap_ms !== a.gap_ms) out.push(`${n}: pause ${b.gap_ms} → ${a.gap_ms} ms`);
    if (b.start_at !== a.start_at) out.push(`${n}: starts at nudge ${b.start_at} → ${a.start_at}`);
  });

  const speakers = byKey(before.speakers, after.speakers, (s) => s.entity_id);
  speakers.added.forEach((s) => out.push(`Speaker added: ${name(s.entity_id)}`));
  speakers.removed.forEach((s) => out.push(`Speaker removed: ${name(s.entity_id)}`));
  speakers.kept.forEach(({ before: b, after: a }) =>
    speakerChanges(b, a).forEach((c) => out.push(`${name(a.entity_id)}: ${c}`))
  );
  if (before.speech_template !== after.speech_template)
    out.push(`Spoken sentence: ${before.speech_template} → ${after.speech_template}`);

  const devices = byKey(before.alarm_devices, after.alarm_devices, (d) => d.entity_id);
  devices.added.forEach((d) => out.push(`Alarm device added: ${name(d.entity_id)}`));
  devices.removed.forEach((d) => out.push(`Alarm device removed: ${name(d.entity_id)}`));
  devices.kept.forEach(({ before: b, after: a }) => {
    if (b.seconds !== a.seconds) out.push(`${name(a.entity_id)}: on for ${b.seconds} → ${a.seconds} s`);
    if (b.start_at !== a.start_at)
      out.push(`${name(a.entity_id)}: starts at nudge ${b.start_at} → ${a.start_at}`);
  });

  if (before.ai.enabled !== after.ai.enabled) out.push(`AI help: ${before.ai.enabled ? "on" : "off"} → ${after.ai.enabled ? "on" : "off"}`);
  if (before.ai.entity_id !== after.ai.entity_id) {
    const label = (id: string) => (id ? name(id) : "the Home Assistant default");
    out.push(`AI agent: ${label(before.ai.entity_id)} → ${label(after.ai.entity_id)}`);
  }
  if ((before.ai.photo_entity_id ?? "") !== (after.ai.photo_entity_id ?? "")) {
    const label = (id: string) => (id ? name(id) : "the same agent");
    out.push(`Agent for photos: ${label(before.ai.photo_entity_id ?? "")} → ${label(after.ai.photo_entity_id ?? "")}`);
  }
  if (before.ai.questions_prompt !== after.ai.questions_prompt) out.push("AI questions prompt changed");
  if (before.ai.steps_prompt !== after.ai.steps_prompt) out.push("AI steps prompt changed");
  if ((before.ai.chat_room_prompt ?? "") !== (after.ai.chat_room_prompt ?? "")) out.push("Chat prompt for one room changed");
  if ((before.ai.chat_home_prompt ?? "") !== (after.ai.chat_home_prompt ?? "")) out.push("Chat prompt for the whole home changed");

  if (before.presence_entity !== after.presence_entity) {
    const label = (id: string) => (id ? name(id) : "not set");
    out.push(`Where you are: ${label(before.presence_entity)} → ${label(after.presence_entity)}`);
  }
  return out;
}
