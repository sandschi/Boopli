/** Types shared by the panel. They mirror what the integration sends. */

export type StepStatus = "pending" | "waiting" | "active" | "done";
export type RepeatType = "none" | "schedule" | "every_n_days";
export type Where = "home" | "anywhere";
export type NudgeStyle = "quiet" | "one" | "escalating" | "persistent";
export type PhoneLevel = "normal" | "high" | "alarm" | "alarm_max";
export type LightMode = "blink" | "indicator";

export type TriggerKind = "state" | "tag" | "button";
export type TriggerMode = "happens" | "is";

/** Something that finishes a step by itself. Any one of a step's triggers is enough. */
export interface Trigger {
  kind: TriggerKind;
  entity_id: string; // state and button
  mode: TriggerMode; // state only
  state: string; // state: the state to wait for, for example "on"
  above: number | null; // state: a number the value must be above
  below: number | null; // state: a number the value must be below
  for_minutes: number; // state: it has to hold this long
  tag_id: string; // tag
  press: string; // button: a specific press type, empty = any
}

export type StepSize = "small" | "medium" | "big";

export interface Step {
  id: string;
  title: string;
  wait_minutes: number;
  resolve: string;
  triggers: Trigger[];
  size: StepSize; // small, medium or big: worth 10, 15 or 20 XP
  group: string; // the part of the task, for example Table
  wait_for?: Trigger[]; // the step stays quiet until one of these happens
  only_if?: string; // id of a question of the chore: the step is only there on "yes"
  image?: string; // a picture for the phone notification: "camera.x" or a file in the media folder
}

/** A yes/no question a chore asks every time it starts ("Does the table need decluttering?"). */
export interface ChoreQuestion {
  id: string;
  text: string;
}

export interface Repeat {
  type: RepeatType;
  time: string; // HH:MM, local time (every_n_days only)
  every_n_days: number;
  /** schedule: "0" (Monday) to "6" (Sunday) -> the times that day; a missing day has none. */
  days: Record<string, string[]>;
}

export interface Chore {
  id: string;
  name: string;
  steps: Step[];
  repeat: Repeat;
  where: Where;
  enabled: boolean;
  one_off: boolean;
  next_due: string | null;
  created_at: string;
  nudge_style: NudgeStyle;
  ignore_quiet_hours: boolean;
  notes: string; // what the AI learned about the task
  parked: boolean; // a part of a task that was set aside to do later
  questions?: ChoreQuestion[]; // asked every time it starts
  keeps_going?: boolean; // runs as usual while away mode is on
}

export interface StepRun {
  step_id: string;
  title: string;
  wait_minutes: number;
  status: StepStatus;
  active_at: string | null;
  done_at: string | null;
  nudge_count: number;
  next_nudge_at: string | null;
  snoozed_until: string | null;
  on_it_since?: string | null; // "On it": when you started this step
  on_it_until?: string | null; // while it is in progress: when Boopli checks in
  triggers?: Trigger[];
  wait_for?: Trigger[];
  done_by?: "manual" | "auto" | null;
  done_reason?: string | null;
  size?: StepSize;
  group?: string;
}

export interface Run {
  id: string;
  chore_id: string;
  chore_name: string;
  where: Where;
  started_at: string;
  status: "active" | "done";
  steps: StepRun[];
  finished_at: string | null;
  questions?: ChoreQuestion[];
  answers?: Record<string, boolean>; // question id -> yes
  /** Started by itself with all steps: the questions are still waiting for your answers. */
  questions_open?: boolean;
  asking_until?: string | null; // the first nudge waits for the answers until then
}

export interface HistoryEntry {
  ts: string;
  kind: "step_done" | "chore_done";
  chore_id: string;
  chore_name: string;
  run_id: string;
  step_title: string | null;
  by?: "manual" | "auto" | null;
  reason?: string | null;
}

export interface LightCfg {
  entity_id: string;
  mode: LightMode;
  color: number[];
  blink_ms: number; // how long the color stays on per blink
  repeats: number; // how many blinks
  gap_ms: number; // pause between blinks
  start_at: number; // used from this nudge number on
}

export interface PhoneCfg {
  service: string; // notify service name without "notify."
  level: PhoneLevel;
  start_at: number;
}

export type SoundKind = "alexa" | "file";
export type SpeechRoute = "alexa_media" | "alexa_devices" | "tts";
export type SpeakerLevel = "cue" | "speech" | "alarm";

export interface SoundCfg {
  enabled: boolean;
  kind: SoundKind;
  sound: string; // Alexa sound id, or a file path / media-source id / URL
  start_at: number;
  seconds: number; // alarm only
  repeat_s: number; // alarm only
}

export interface SpeechCfg {
  enabled: boolean;
  route: SpeechRoute;
  target: string;
  announce: boolean;
  start_at: number;
}

export interface SpeakerCfg {
  entity_id: string; // a media_player
  cue: SoundCfg;
  speech: SpeechCfg;
  alarm: SoundCfg;
}

export interface AlarmDeviceCfg {
  entity_id: string; // siren, switch, input_boolean or script
  seconds: number;
  start_at: number;
}

export interface QuietDay {
  start: string; // HH:MM
  stop: string;
}

export interface QuietHours {
  enabled: boolean;
  /** "0" (Monday) to "6" (Sunday). null or missing means no limit that day. */
  days: Record<string, QuietDay | null>;
}

export interface Settings {
  lights: LightCfg[];
  phones: PhoneCfg[];
  speakers: SpeakerCfg[];
  alarm_devices: AlarmDeviceCfg[];
  speech_template: string;
  quiet_hours: QuietHours;
  presence_entity: string;
  snooze_minutes: number;
  default_style: NudgeStyle;
  pet_name: string;
  pet_kind?: string; // which pet: bear, cat, dog, fox or slime
  ai: AiSettings;
  question_wait_minutes?: number; // how long the first nudge waits for the questions
  check_in_minutes?: number; // after "On it": when Boopli asks "still on it?"
}

/** Optional AI help: splitting tasks into small steps with your own Home Assistant AI agent. */
export interface AiSettings {
  enabled: boolean;
  entity_id: string; // an ai_task entity, empty = Home Assistant's default
  photo_entity_id: string; // optional agent for reading photos, empty = the same agent
  questions_prompt: string; // empty = the built-in prompt
  steps_prompt: string;
  chat_room_prompt: string; // the text to copy into your own chat, one room; empty = built-in
  chat_home_prompt: string; // the same for the whole home
}

export type Mood = "happy" | "content" | "sleepy" | "sad" | "hibernating";

export interface Pet {
  name: string;
  mood: Mood;
  level: number;
  total_xp: number;
  xp_in_level: number;
  xp_for_level: number;
  last_activity: string | null;
  away?: boolean; // away mode is on: the mood stays as it was
}

/** Away mode: Boopli rests for a few days. */
export interface Away {
  active: boolean; // switched on (it may begin later)
  start: string | null; // when it begins; null = it began when it was switched on
  until: string | null; // when it ends by itself; null = until switched off
  began_at: string | null;
}

export type SetupStatus = "new" | "in_progress" | "skipped" | "done";

export interface Setup {
  status: SetupStatus;
  step: string; // id of the wizard step to resume at
}

/** One room with notes the user may let the AI see. */
export interface Room {
  id: string;
  name: string;
  area_id: string; // empty = added by hand
  notes: string;
  hidden: boolean;
}

/** "My home": the rooms, kept only in Boopli. */
export interface Home {
  enabled: boolean; // room notes go along with AI requests
  rooms: Room[];
}

/** Exactly what the first AI request would contain. */
export interface AiPreview {
  instructions: string;
  rooms_text: string;
  shortened: boolean;
  enabled: boolean;
}

export interface Snapshot {
  now: string;
  time_zone: string;
  ai_timeout?: number; // the longest Boopli waits for the AI agent, in seconds
  is_home: boolean;
  pet: Pet;
  away?: Away;
  away_now?: boolean; // away mode is on right now
  setup: Setup;
  home: Home;
  settings: Settings;
  chores: Chore[];
  runs: Run[];
  history: HistoryEntry[];
}

/** What the editor sends when saving a chore. */
export interface ChoreDraft {
  id?: string;
  name: string;
  where: Where;
  enabled: boolean;
  one_off: boolean;
  repeat: Repeat;
  nudge_style?: NudgeStyle; // missing: the integration uses your default
  ignore_quiet_hours?: boolean;
  notes?: string;
  questions?: ChoreQuestion[];
  keeps_going?: boolean;
  steps: {
    id?: string;
    title: string;
    wait_minutes: number;
    triggers?: Trigger[];
    wait_for?: Trigger[];
    size?: StepSize;
    group?: string;
    only_if?: string;
    image?: string;
  }[];
}

/** A question the AI wants answered before it splits a task. */
export interface AiQuestion {
  text: string;
  options: string[];
  multiple: boolean;
}

export interface AiAnswer {
  question: string;
  answer: string;
}

/** A step as the AI suggests it. */
export interface AiStep {
  title: string;
  group: string;
  size: StepSize;
  wait_minutes: number;
  only_if?: string; // id of a question the AI wrote for this chore
}

/** One entity state as Home Assistant gives it to the panel. */
export interface HassState {
  state: string;
  attributes: Record<string, unknown>;
}

/** The slice of Home Assistant's `hass` object that the panel uses. */
export interface Hass {
  user?: { name?: string };
  states: Record<string, HassState>;
  services: Record<string, Record<string, unknown>>;
  callWS<T = unknown>(msg: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      subscribeMessage: Record<string, unknown>
    ): Promise<() => void>;
    subscribeEvents<T>(
      callback: (event: T) => void,
      eventType?: string
    ): Promise<() => void>;
  };
}

/** The built-in AI and chat prompts, to show and to reset to. */
export interface PromptDefaults {
  questions_prompt: string;
  steps_prompt: string;
  chat_room_prompt: string;
  chat_home_prompt: string;
}
