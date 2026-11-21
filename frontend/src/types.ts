/** Types shared by the panel. They mirror what the integration sends. */

export type StepStatus = "pending" | "waiting" | "active" | "done";
export type RepeatType = "none" | "daily" | "weekly" | "every_n_days";
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

export interface Step {
  id: string;
  title: string;
  wait_minutes: number;
  resolve: string;
  triggers: Trigger[];
}

export interface Repeat {
  type: RepeatType;
  time: string; // HH:MM, local time
  weekdays: number[]; // 0 = Monday
  every_n_days: number;
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
  triggers?: Trigger[];
  done_by?: "manual" | "auto" | null;
  done_reason?: string | null;
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
}

export type SetupStatus = "new" | "in_progress" | "skipped" | "done";

export interface Setup {
  status: SetupStatus;
  step: string; // id of the wizard step to resume at
}

export interface Snapshot {
  now: string;
  time_zone: string;
  is_home: boolean;
  pet: Pet;
  setup: Setup;
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
  steps: { id?: string; title: string; wait_minutes: number; triggers?: Trigger[] }[];
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
