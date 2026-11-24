import type {
  AiAnswer,
  AiPreview,
  AiQuestion,
  AiStep,
  AlarmDeviceCfg,
  ClaudeStatus,
  ChoreDraft,
  ChoreQuestion,
  Hass,
  Home,
  LightCfg,
  PhoneCfg,
  PromptDefaults,
  Repeat,
  Settings,
  SpeakerCfg,
  SpeakerChoice,
  ExtraSound,
  Snapshot,
  Via,
} from "./types";

export interface TestResult {
  ok: boolean;
  mode?: string;
  note: string;
}

export function saveSettings(hass: Hass, settings: Settings): Promise<{ ladders?: Settings["ladders"] } | void> {
  return hass.callWS({ type: "boopli/settings_save", settings });
}

// --- backup of the setup (the file is saved with the extension .adhd; inside it is plain JSON) ---

export type BackupPart = "settings" | "chores" | "home" | "pet";
export const BACKUP_PARTS: BackupPart[] = ["settings", "chores", "home", "pet"];

/** What importing a backup would do (nothing is changed by asking). */
export interface BackupPreview {
  parts: BackupPart[];
  exported_at: string;
  boopli_version: string;
  counts: { chores: number; rooms: number; boards: number; history: number; level: number };
  missing_entities: string[];
  missing_entities_total: number;
  missing_services: string[];
  runs_ended: number;
  selection_error: string; // the parts picked do not fit together (empty: they do)
  settings: Settings | null; // the settings as an import would apply them
}

export function exportBackup(hass: Hass, parts: BackupPart[]): Promise<Record<string, unknown>> {
  return hass.callWS({ type: "boopli/backup_export", parts });
}

export function previewBackup(hass: Hass, backup: Record<string, unknown>, parts: BackupPart[]): Promise<BackupPreview> {
  return hass.callWS({ type: "boopli/backup_preview", backup, parts });
}

export function importBackup(
  hass: Hass,
  backup: Record<string, unknown>,
  parts: BackupPart[]
): Promise<{ imported: BackupPart[]; chores: number; runs_ended: number }> {
  return hass.callWS({ type: "boopli/backup_import", backup, parts });
}

/** `rooms` are the ids of the rooms whose notes go along; leave it out to let Boopli guess. */
export function aiQuestions(
  hass: Hass,
  task: string,
  kind: "now" | "recurring",
  answers: AiAnswer[],
  notes = "",
  rooms?: string[],
  scene = "",
  via: Via = "agent"
): Promise<{ enough: boolean; questions: AiQuestion[] }> {
  return hass.callWS({ type: "boopli/ai_questions", task, kind, answers, notes, scene, via, ...(rooms ? { rooms } : {}) });
}

/** The task split into small steps by the AI. */
export function aiSteps(
  hass: Hass,
  task: string,
  kind: "now" | "recurring",
  answers: AiAnswer[],
  notes = "",
  rooms?: string[],
  scene = "",
  via: Via = "agent"
): Promise<{ steps: AiStep[]; summary: string; questions?: ChoreQuestion[] }> {
  return hass.callWS({ type: "boopli/ai_steps", task, kind, answers, notes, scene, via, ...(rooms ? { rooms } : {}) });
}

/** Exactly what the first request to the AI would contain. */
export function aiPreview(
  hass: Hass,
  task: string,
  kind: "now" | "recurring",
  answers: AiAnswer[],
  notes: string,
  rooms: string[],
  scene = ""
): Promise<AiPreview> {
  return hass.callWS({ type: "boopli/ai_preview", task, kind, answers, notes, rooms, scene });
}

/** The ids of the rooms a task is about, guessed from its words. */
export async function roomsGuess(hass: Hass, task: string): Promise<string[]> {
  const result = await hass.callWS<{ rooms: string[] }>({ type: "boopli/rooms_guess", task });
  return result.rooms;
}

export function homeSave(hass: Hass, home: Home): Promise<void> {
  return hass.callWS({ type: "boopli/home_save", home });
}

/** Add rooms for new Home Assistant areas and return the home. */
export function homeSync(hass: Hass): Promise<Home> {
  return hass.callWS({ type: "boopli/home_sync" });
}

export function roomQuestions(
  hass: Hass,
  room: string,
  notes: string,
  answers: AiAnswer[],
  via: Via = "agent"
): Promise<{ enough: boolean; questions: AiQuestion[] }> {
  return hass.callWS({ type: "boopli/room_questions", room, notes, answers, via });
}

/** The notes the AI wrote about a room. Nothing is saved by this call. */
export function roomNotes(
  hass: Hass,
  room: string,
  notes: string,
  answers: AiAnswer[],
  via: Via = "agent"
): Promise<{ notes: string }> {
  return hass.callWS({ type: "boopli/room_notes", room, notes, answers, via });
}

/** The built-in prompts, to show and to reset to. */
export function aiDefaults(hass: Hass): Promise<PromptDefaults> {
  return hass.callWS({ type: "boopli/ai_defaults" });
}

/** Create a one-off task from reviewed steps and start it. */
export function taskAdd(
  hass: Hass,
  title: string,
  steps: AiStep[],
  notes = ""
): Promise<{ run_id: string }> {
  return hass.callWS({ type: "boopli/task_add", title, steps, notes });
}

/** The next due moments of a schedule, worked out by the integration (ISO strings). */
export async function previewSchedule(hass: Hass, repeat: Repeat, count = 5): Promise<string[]> {
  const result = await hass.callWS<{ times: string[] }>({
    type: "boopli/schedule_preview",
    repeat,
    count,
  });
  return result.times;
}

export function saveSetup(
  hass: Hass,
  status: "new" | "in_progress" | "skipped" | "done",
  step = ""
): Promise<void> {
  return hass.callWS({ type: "boopli/setup_save", status, step });
}

export function snoozeStep(
  hass: Hass,
  runId: string,
  stepId: string
): Promise<void> {
  return hass.callWS({
    type: "boopli/step_snooze",
    run_id: runId,
    step_id: stepId,
  });
}

export function onIt(hass: Hass, runId: string, stepId: string): Promise<void> {
  return hass.callWS({ type: "boopli/step_on_it", run_id: runId, step_id: stepId });
}

export function notOnIt(hass: Hass, runId: string, stepId: string): Promise<void> {
  return hass.callWS({ type: "boopli/step_not_on_it", run_id: runId, step_id: stepId });
}

export function testLight(hass: Hass, light: LightCfg): Promise<TestResult> {
  return hass.callWS({ type: "boopli/test_channel", kind: "light", light });
}

export function testPhone(hass: Hass, phone: PhoneCfg): Promise<TestResult> {
  return hass.callWS({ type: "boopli/test_channel", kind: "phone", phone });
}

export function testSpeaker(
  hass: Hass,
  speaker: SpeakerCfg,
  level: SpeakerChoice,
  sounds?: ExtraSound[] // your own sounds as they are on screen (maybe not saved yet)
): Promise<TestResult> {
  return hass.callWS({ type: "boopli/test_channel", kind: "speaker", speaker, level, ...(sounds ? { sounds } : {}) });
}

export function testAlarmDevice(
  hass: Hass,
  alarm_device: AlarmDeviceCfg
): Promise<TestResult> {
  return hass.callWS({ type: "boopli/test_channel", kind: "alarm_device", alarm_device });
}

/** Subscribe to live updates. The callback receives a full snapshot each time. */
export function subscribe(
  hass: Hass,
  callback: (snapshot: Snapshot) => void
): Promise<() => void> {
  return hass.connection.subscribeMessage<Snapshot>(callback, {
    type: "boopli/subscribe",
  });
}

export function saveChore(hass: Hass, chore: ChoreDraft): Promise<{ id: string }> {
  return hass.callWS({ type: "boopli/chore_save", chore });
}

export function deleteChore(hass: Hass, choreId: string): Promise<void> {
  return hass.callWS({ type: "boopli/chore_delete", chore_id: choreId });
}

/** Start a chore. With `answers` (question id -> yes) the steps for a "no" are left out. */
export function startChore(
  hass: Hass,
  choreId: string,
  answers?: Record<string, boolean>
): Promise<{ run_id: string }> {
  return hass.callWS({ type: "boopli/chore_start", chore_id: choreId, ...(answers ? { answers } : {}) });
}

/**
 * Switch away mode on (or change it). `start` and `until` are local "YYYY-MM-DDTHH:MM" or empty
 * (now / until switched off). `keepGoing` says which chores keep running while away.
 */
export function awaySet(
  hass: Hass,
  start: string,
  until: string,
  keepGoing: Record<string, boolean>
): Promise<void> {
  return hass.callWS({ type: "boopli/away_set", start, until, keep_going: keepGoing });
}

/** Back now (or cancel away mode that has not begun). */
export function awayEnd(hass: Hass): Promise<void> {
  return hass.callWS({ type: "boopli/away_end" });
}

/** Answer the questions of a running chore. Empty answers mean "start with all steps". */
export function answerQuestions(
  hass: Hass,
  runId: string,
  answers: Record<string, boolean>
): Promise<void> {
  return hass.callWS({ type: "boopli/questions_answer", run_id: runId, answers });
}

export function completeStep(
  hass: Hass,
  runId: string,
  stepId: string
): Promise<void> {
  return hass.callWS({
    type: "boopli/step_complete",
    run_id: runId,
    step_id: stepId,
  });
}

/** Turn a failed websocket call into a readable message. */
export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong.";
}

/** Describe a room from photos, one time. `photos` are base64 JPEGs; they are deleted right after. */
export function roomPhotos(
  hass: Hass,
  room: string,
  notes: string,
  photos: string[],
  via: Via = "agent"
): Promise<{ notes: string }> {
  return hass.callWS({ type: "boopli/room_photos", room, notes, photos, via });
}

/** The text to copy into your own AI chat. An empty room means the whole home. */
export async function chatPrompt(
  hass: Hass,
  includeNotes: boolean,
  room = "",
  notes = "",
  rooms?: { name: string; notes: string }[]
): Promise<string> {
  const result = await hass.callWS<{ prompt: string }>({
    type: "boopli/chat_prompt",
    room,
    notes,
    include_notes: includeNotes,
    ...(rooms ? { rooms } : {}),
  });
  return result.prompt;
}

/** Clean up notes pasted back from your own AI chat for one room. Nothing is saved. */
export function pasteNotes(hass: Hass, text: string): Promise<{ notes: string }> {
  return hass.callWS({ type: "boopli/paste_notes", text });
}

export interface PastedRoom {
  name: string;
  id: string | null; // null = not one of your rooms yet
  notes: string;
}

/** Split pasted notes of the whole home into rooms. Nothing is saved. */
export async function pasteHome(hass: Hass, text: string, rooms: { id: string; name: string }[]): Promise<PastedRoom[]> {
  const result = await hass.callWS<{ rooms: PastedRoom[] }>({
    type: "boopli/paste_notes",
    text,
    whole_home: true,
    rooms,
  });
  return result.rooms;
}

export type ParkWhen = "any" | "tomorrow" | "at";

/** Set a part (group) of a running task aside as a small task of its own. */
export function partPark(
  hass: Hass,
  runId: string,
  group: string,
  when: ParkWhen,
  at = ""
): Promise<{ chore_id: string }> {
  return hass.callWS({ type: "boopli/part_park", run_id: runId, group, when, at });
}

/** Change when a parked part comes back. */
export function partTime(hass: Hass, choreId: string, when: ParkWhen, at = ""): Promise<void> {
  return hass.callWS({ type: "boopli/part_time", chore_id: choreId, when, at });
}

/** What a place looks like today, from a one-time look at photos. The photos are deleted right after. */
export function scenePhotos(
  hass: Hass,
  task: string,
  photos: string[],
  rooms?: string[],
  via: Via = "agent"
): Promise<{ scene: string }> {
  return hass.callWS({ type: "boopli/scene_photos", task, photos, via, ...(rooms ? { rooms } : {}) });
}

/** The Easter egg played. The first time it gives a small gift of XP. */
export function eggFound(hass: Hass): Promise<{ xp: number }> {
  return hass.callWS({ type: "boopli/egg_found" });
}

/** Store the Claude routine's token (empty removes it). It is never sent back. */
export function claudeToken(hass: Hass, token: string): Promise<ClaudeStatus> {
  return hass.callWS({ type: "boopli/claude_token", token });
}

/** Ask the routine for a tiny answer; says how many seconds the round trip took. */
export function claudeTest(hass: Hass): Promise<{ seconds: number }> {
  return hass.callWS({ type: "boopli/claude_test" });
}
