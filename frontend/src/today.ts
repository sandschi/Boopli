import type { Chore, Run, Snapshot, StepRun, StepStatus } from "./types";
import { fmtMinutes, isToday, untilLabel } from "./time";

/** The one step shown big on the Today screen. */
export interface NowItem {
  run: Run;
  step: StepRun;
  done: number; // steps of this run already finished
  total: number; // steps in this run
}

/** A remaining step of a run, shown small and dimmed. */
export interface UpcomingStep {
  title: string;
  status: StepStatus;
  hint: string;
}

export interface RunGroup {
  run: Run;
  steps: UpcomingStep[];
}

/** A chore that comes due later today. */
export interface DueItem {
  chore: Chore;
  at: string;
}

export interface TodayModel {
  now: NowItem | null;
  groups: RunGroup[];
  dueToday: DueItem[];
}

/**
 * Work out what the Today screen shows.
 *
 * - Now: the active step that has waited longest.
 * - Groups: what is left of every run in progress (dimmed).
 * - Due today: chores that come due later today and are not running yet.
 */
export function buildToday(snapshot: Snapshot, nowMs: number): TodayModel {
  const tz = snapshot.time_zone;

  const active: NowItem[] = snapshot.runs
    .flatMap((run) =>
      run.steps
        .filter((s) => s.status === "active")
        .map((step) => ({
          run,
          step,
          done: run.steps.filter((s) => s.status === "done").length,
          total: run.steps.length,
        }))
    )
    .sort((a, b) => {
      const ta = a.step.active_at ? Date.parse(a.step.active_at) : Infinity;
      const tb = b.step.active_at ? Date.parse(b.step.active_at) : Infinity;
      return ta - tb;
    });
  const now = active[0] ?? null;

  const groups: RunGroup[] = [...snapshot.runs]
    .sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at))
    .map((run) => ({
      run,
      steps: run.steps
        .filter(
          (s) =>
            s.status !== "done" &&
            !(now && now.run.id === run.id && now.step.step_id === s.step_id)
        )
        .map((s): UpcomingStep => {
          let hint = "";
          if (s.status === "active") hint = "ready now";
          else if (s.status === "waiting" && s.active_at)
            hint = untilLabel(s.active_at, nowMs);
          else if (s.status === "waiting" && (s.wait_for ?? []).length > 0)
            hint = "waits for something to happen";
          else if (s.wait_minutes > 0)
            hint = `${fmtMinutes(s.wait_minutes)} after the step before`;
          return { title: s.title, status: s.status, hint };
        }),
    }))
    .filter((g) => g.steps.length > 0);

  const running = new Set(snapshot.runs.map((r) => r.chore_id));
  const dueToday: DueItem[] = snapshot.chores
    .filter(
      (c) =>
        c.enabled &&
        c.next_due !== null &&
        !running.has(c.id) &&
        isToday(c.next_due, nowMs, tz)
    )
    .map((chore) => ({ chore, at: chore.next_due as string }))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  return { now, groups, dueToday };
}
