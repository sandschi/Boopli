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

/** A chore that comes due later (today, or on a later day). */
export interface DueItem {
  chore: Chore;
  at: string;
}

export interface TodayModel {
  now: NowItem | null;
  /** Other steps that are your turn right now (the big one is `now`). */
  ready: RunGroup[];
  /** What is left of the tasks in progress: steps that wait or come later. */
  groups: RunGroup[];
  /** Chores that come due later today. */
  dueToday: DueItem[];
  /** Scheduled chores that come on a later day, soonest first. */
  upcoming: DueItem[];
}

/**
 * Work out what the Today screen shows, top to bottom:
 *
 * - Now: the active step that has waited longest (big).
 * - Ready: other steps that are your turn right now.
 * - Groups and due today: the rest of what is going on today.
 * - Upcoming: scheduled chores on later days.
 * Parked parts are not in these lists: they have their own card.
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

  const sortedRuns = [...snapshot.runs].sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at));
  const notNow = (run: Run, s: StepRun) => !(now && now.run.id === run.id && now.step.step_id === s.step_id);
  const describe = (s: StepRun): UpcomingStep => {
    let hint = "";
    if (s.status === "active") hint = "ready now";
    else if (s.status === "waiting" && s.active_at) hint = untilLabel(s.active_at, nowMs);
    else if (s.status === "waiting" && (s.wait_for ?? []).length > 0) hint = "waits for something to happen";
    else if (s.wait_minutes > 0) hint = `${fmtMinutes(s.wait_minutes)} after the step before`;
    return { title: s.title, status: s.status, hint };
  };

  const ready: RunGroup[] = sortedRuns
    .map((run) => ({
      run,
      steps: run.steps.filter((s) => s.status === "active" && notNow(run, s)).map(describe),
    }))
    .filter((g) => g.steps.length > 0);

  const groups: RunGroup[] = sortedRuns
    .map((run) => ({
      run,
      steps: run.steps.filter((s) => s.status !== "done" && s.status !== "active").map(describe),
    }))
    .filter((g) => g.steps.length > 0);

  const running = new Set(snapshot.runs.map((r) => r.chore_id));
  const scheduled = snapshot.chores
    .filter((c) => c.enabled && !c.parked && c.next_due !== null && !running.has(c.id))
    .map((chore) => ({ chore, at: chore.next_due as string }))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const dueToday: DueItem[] = scheduled.filter((d) => isToday(d.at, nowMs, tz));
  const upcoming: DueItem[] = scheduled.filter((d) => !isToday(d.at, nowMs, tz) && Date.parse(d.at) > nowMs);

  return { now, ready, groups, dueToday, upcoming };
}
