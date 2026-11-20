/** Types shared by the panel. They mirror what the integration sends. */

export type StepStatus = "pending" | "waiting" | "active" | "done";
export type RepeatType = "none" | "daily" | "weekly" | "every_n_days";
export type Where = "home" | "anywhere";

export interface Step {
  id: string;
  title: string;
  wait_minutes: number;
  resolve: string;
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
}

export interface StepRun {
  step_id: string;
  title: string;
  wait_minutes: number;
  status: StepStatus;
  active_at: string | null;
  done_at: string | null;
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
}

export interface Snapshot {
  now: string;
  time_zone: string;
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
  steps: { id?: string; title: string; wait_minutes: number }[];
}

/** The slice of Home Assistant's `hass` object that the panel uses. */
export interface Hass {
  user?: { name?: string };
  states: Record<string, unknown>;
  callWS<T = unknown>(msg: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(
      callback: (message: T) => void,
      subscribeMessage: Record<string, unknown>
    ): Promise<() => void>;
  };
}
