import { friendlyName, lightKind, phoneName, PHONE_LEVEL_LABEL, styleLabel } from "./helpers";
import { weekdayNames } from "./time";
import type { Hass, Settings, SoundCfg, SpeakerCfg } from "./types";
import { t } from "./i18n";

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
  if (b.enabled !== a.enabled) out.push(t("diff.sound_state", { name, state: a.enabled ? t("common.state_on") : t("common.state_off") }));
  if (a.enabled) {
    if (b.sound !== a.sound) out.push(t("diff.sound", { name, before: b.sound, after: a.sound }));
    if (b.start_at !== a.start_at) out.push(t("diff.starts_at_nudge", { name, before: b.start_at, after: a.start_at }));
    if (withAlarm && b.seconds !== a.seconds) out.push(t("diff.lasts_s", { name, before: b.seconds, after: a.seconds }));
    if (withAlarm && b.repeat_s !== a.repeat_s) out.push(t("diff.repeats_every_s", { name, before: b.repeat_s, after: a.repeat_s }));
  }
  return out;
}

function speakerChanges(b: SpeakerCfg, a: SpeakerCfg): string[] {
  const out = [
    ...soundChanges(t("diff.sound_ding"), b.cue, a.cue, false),
    ...soundChanges(t("diff.sound_alarm"), b.alarm, a.alarm, true),
  ];
  if (b.speech.enabled !== a.speech.enabled) out.push(t("diff.speech_state", { state: a.speech.enabled ? t("common.state_on") : t("common.state_off") }));
  if (a.speech.enabled) {
    if (b.speech.target !== a.speech.target || b.speech.route !== a.speech.route)
      out.push(t("diff.speech_goes_to", { target: a.speech.target || t("diff.nothing") }));
    if (b.speech.start_at !== a.speech.start_at)
      out.push(t("diff.speech_starts_at_nudge", { before: b.speech.start_at, after: a.speech.start_at }));
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

  if (before.pet_name !== after.pet_name) out.push(t("diff.pet_name", { before: before.pet_name, after: after.pet_name }));
  if ((before.pet_kind ?? "slime") !== (after.pet_kind ?? "slime"))
    out.push(t("diff.pet_kind", { before: before.pet_kind ?? "slime", after: after.pet_kind ?? "slime" }));
  if ((before.accent ?? "") !== (after.accent ?? ""))
    out.push(t("diff.accent_colour", { before: before.accent || t("diff.the_pets_own"), after: after.accent || t("diff.the_pets_own") }));

  const phones = byKey(before.phones, after.phones, (p) => p.service);
  phones.added.forEach((p) => out.push(t("diff.phone_added", { phone: phoneName(p.service), level: PHONE_LEVEL_LABEL()[p.level] ?? p.level  })));
  phones.removed.forEach((p) => out.push(t("diff.phone_removed", { phone: phoneName(p.service) })));
  phones.kept.forEach(({ before: b, after: a }) => {
    if (b.level !== a.level)
      out.push(t("diff.level", { phone: phoneName(a.service), before: PHONE_LEVEL_LABEL()[b.level], after: PHONE_LEVEL_LABEL()[a.level] }));
    if (b.start_at !== a.start_at)
      out.push(t("diff.starts_at_nudge_2", { phone: phoneName(a.service), before: b.start_at, after: a.start_at }));
  });

  const qb = before.quiet_hours;
  const qa = after.quiet_hours;
  if (qb.enabled !== qa.enabled) {
    out.push(t("diff.quiet_hours_state", { before: qb.enabled ? t("common.state_on") : t("common.state_off"), after: qa.enabled ? t("common.state_on") : t("common.state_off") }));
  }
  if (qa.enabled) {
    // One line per day that changed, never grouped.
    const window = (q: Settings["quiet_hours"], i: number) => {
      const day = q.days[String(i)] ?? null;
      return day ? t("diff.hours_range", { start: day.start, stop: day.stop }) : t("diff.no_limit");
    };
    weekdayNames().forEach((dayName, i) => {
      const was = qb.enabled ? window(qb, i) : t("diff.any_time");
      const now = window(qa, i);
      if (was !== now) out.push(`${dayName}: ${was} → ${now}`);
    });
  }

  if (before.snooze_minutes !== after.snooze_minutes)
    out.push(t("diff.snooze_min", { before: before.snooze_minutes, after: after.snooze_minutes }));
  if ((before.question_wait_minutes ?? 30) !== (after.question_wait_minutes ?? 30))
    out.push(
      t("diff.wait_for_your_answers_min", { before: before.question_wait_minutes ?? 30, after: after.question_wait_minutes ?? 30 })
    );
  if ((before.check_in_minutes ?? 30) !== (after.check_in_minutes ?? 30))
    out.push(t("diff.check_in_after_on_it_min", { before: before.check_in_minutes ?? 30, after: after.check_in_minutes ?? 30 }));
  if (before.default_style !== after.default_style)
    out.push(t("diff.default_style", { before: styleLabel(before.default_style, before.ladders), after: styleLabel(after.default_style, after.ladders) }));

  // Your own sounds (one list for all speakers).
  const was = new Map((before.sounds ?? []).map((s) => [s.id, s.name]));
  const now = new Map((after.sounds ?? []).map((s) => [s.id, s.name]));
  for (const [id, label] of now) if (!was.has(id)) out.push(t("diff.sound_added", { label }));
  for (const [id, label] of was) if (!now.has(id)) out.push(t("diff.sound_removed", { label }));
  for (const s of after.sounds ?? []) {
    const o = (before.sounds ?? []).find((x) => x.id === s.id);
    if (o && (o.name !== s.name || o.kind !== s.kind || o.sound !== s.sound)) out.push(t("diff.sound_changed", { name: s.name }));
  }

  const boards = byKey(before.boards ?? [], after.boards ?? [], (b) => b.id);
  boards.added.forEach((b) => out.push(t("diff.wall_board_added_tiles", { name: b.name, count: b.tiles.length })));
  boards.removed.forEach((b) => out.push(t("diff.wall_board_removed", { name: b.name })));
  boards.kept.forEach(({ before: b, after: a }) => {
    if (b.name !== a.name) out.push(t("diff.wall_board_renamed", { before: b.name, after: a.name }));
    if (JSON.stringify({ c: b.columns, r: b.rows, n: b.night, t: b.tiles }) !== JSON.stringify({ c: a.columns, r: a.rows, n: a.night, t: a.tiles }))
      out.push(t("diff.wall_board_changed", { name: a.name }));
  });

  const ladders = byKey(before.ladders ?? [], after.ladders ?? [], (l) => l.id);
  ladders.added.forEach((l) => out.push(t("diff.nudge_ladder_added_nudges", { name: l.name, count: l.rungs.length })));
  ladders.removed.forEach((l) => out.push(t("diff.nudge_ladder_removed", { name: l.name })));
  ladders.kept.forEach(({ before: b, after: a }) => {
    if (b.name !== a.name) out.push(t("diff.nudge_ladder_renamed", { before: b.name, after: a.name }));
    if (JSON.stringify({ r: b.rungs, x: b.repeat_last }) !== JSON.stringify({ r: a.rungs, x: a.repeat_last }))
      out.push(t("diff.nudge_ladder_changed", { name: a.name }));
  });

  const lights = byKey(before.lights, after.lights, (l) => l.entity_id);
  lights.added.forEach((l) => out.push(t("diff.reminder_light_added", { name: name(l.entity_id), light: lightKind(l) })));
  lights.removed.forEach((l) => out.push(t("diff.reminder_light_removed", { name: name(l.entity_id) })));
  lights.kept.forEach(({ before: b, after: a }) => {
    const n = name(a.entity_id);
    if (b.mode !== a.mode) out.push(`${n}: ${lightKind(b)} → ${lightKind(a)}`);
    if (b.color.join() !== a.color.join()) out.push(t("diff.color_changed", { n }));
    if (b.blink_ms !== a.blink_ms) out.push(t("diff.blink_length_ms", { n, before: b.blink_ms, after: a.blink_ms }));
    if (b.repeats !== a.repeats) out.push(t("diff.blinks", { n, before: b.repeats, after: a.repeats }));
    if (b.gap_ms !== a.gap_ms) out.push(t("diff.pause_ms", { n, before: b.gap_ms, after: a.gap_ms }));
    if (b.start_at !== a.start_at) out.push(t("diff.starts_at_nudge_3", { n, before: b.start_at, after: a.start_at }));
  });

  const speakers = byKey(before.speakers, after.speakers, (s) => s.entity_id);
  speakers.added.forEach((s) => out.push(t("diff.speaker_added", { name: name(s.entity_id) })));
  speakers.removed.forEach((s) => out.push(t("diff.speaker_removed", { name: name(s.entity_id) })));
  speakers.kept.forEach(({ before: b, after: a }) =>
    speakerChanges(b, a).forEach((c) => out.push(`${name(a.entity_id)}: ${c}`))
  );
  if (before.speech_template !== after.speech_template)
    out.push(t("diff.spoken_sentence", { before: before.speech_template, after: after.speech_template }));

  const devices = byKey(before.alarm_devices, after.alarm_devices, (d) => d.entity_id);
  devices.added.forEach((d) => out.push(t("diff.alarm_device_added", { name: name(d.entity_id) })));
  devices.removed.forEach((d) => out.push(t("diff.alarm_device_removed", { name: name(d.entity_id) })));
  devices.kept.forEach(({ before: b, after: a }) => {
    if (b.seconds !== a.seconds) out.push(t("diff.on_for_s", { name: name(a.entity_id), before: b.seconds, after: a.seconds }));
    if (b.start_at !== a.start_at)
      out.push(t("diff.starts_at_nudge_4", { name: name(a.entity_id), before: b.start_at, after: a.start_at }));
  });

  if (before.ai.enabled !== after.ai.enabled) out.push(t("diff.ai_help_state", { before: before.ai.enabled ? t("common.state_on") : t("common.state_off"), after: after.ai.enabled ? t("common.state_on") : t("common.state_off") }));
  if (before.ai.entity_id !== after.ai.entity_id) {
    const label = (id: string) => (id ? name(id) : t("diff.the_home_assistant_default"));
    out.push(t("diff.ai_agent", { before: label(before.ai.entity_id), after: label(after.ai.entity_id) }));
  }
  if ((before.ai.photo_entity_id ?? "") !== (after.ai.photo_entity_id ?? "")) {
    const label = (id: string) => (id ? name(id) : t("diff.the_same_agent"));
    out.push(t("diff.agent_for_photos", { before: label(before.ai.photo_entity_id ?? ""), after: label(after.ai.photo_entity_id ?? "") }));
  }
  if (!!before.ai.claude_enabled !== !!after.ai.claude_enabled)
    out.push(t("diff.ask_claude_state", { before: before.ai.claude_enabled ? t("common.state_on") : t("common.state_off"), after: after.ai.claude_enabled ? t("common.state_on") : t("common.state_off") }));
  if ((before.ai.claude_fire_url ?? "") !== (after.ai.claude_fire_url ?? "")) out.push(t("diff.claude_routine_address_changed"));
  if ((before.ai.claude_ha_url ?? "") !== (after.ai.claude_ha_url ?? "")) out.push(t("diff.home_assistant_address_for_claude_changed"));
  if (before.ai.questions_prompt !== after.ai.questions_prompt) out.push(t("diff.ai_questions_prompt_changed"));
  if (before.ai.steps_prompt !== after.ai.steps_prompt) out.push(t("diff.ai_steps_prompt_changed"));
  if ((before.ai.chat_room_prompt ?? "") !== (after.ai.chat_room_prompt ?? "")) out.push(t("diff.chat_prompt_for_one_room_changed"));
  if ((before.ai.chat_home_prompt ?? "") !== (after.ai.chat_home_prompt ?? "")) out.push(t("diff.chat_prompt_for_the_whole_home"));

  if (before.presence_entity !== after.presence_entity) {
    const label = (id: string) => (id ? name(id) : t("diff.not_set"));
    out.push(t("diff.where_you_are", { before: label(before.presence_entity), after: label(after.presence_entity) }));
  }
  return out;
}
