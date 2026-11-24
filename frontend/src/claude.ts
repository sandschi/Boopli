import type { Snapshot, Via } from "./types";
import { t } from "./i18n";

/** Is the Home Assistant AI agent switched on? */
export function agentOn(snapshot?: Snapshot): boolean {
  return !!snapshot?.settings.ai?.enabled;
}

/** Is "Ask Claude" switched on and set up (address, token and an address Claude can answer to)? */
export function claudeReady(snapshot?: Snapshot): boolean {
  const ai = snapshot?.settings.ai;
  return !!(ai?.claude_enabled && ai.claude_fire_url && snapshot?.claude?.token_set && snapshot.claude.callback_host);
}

/** Is any AI helper available? */
export function anyAi(snapshot?: Snapshot): boolean {
  return agentOn(snapshot) || claudeReady(snapshot);
}

/** The helper a plain "go" uses: the agent when it is on, else Claude. */
export function defaultVia(snapshot?: Snapshot): Via {
  return agentOn(snapshot) ? "agent" : "claude";
}

/** How long to wait, in seconds, for the helper that was asked. */
export function waitSeconds(snapshot: Snapshot | undefined, via: Via): number {
  return via === "claude" ? (snapshot?.claude?.wait_seconds ?? 120) : (snapshot?.ai_timeout ?? 180);
}

/**
 * The host name Claude's routine must be allowed to reach: where Home Assistant answers from
 * outside. An address typed in the settings wins; else the one Home Assistant itself reports
 * (its external URL), never the address this panel happens to be open on.
 */
export function routineHost(haUrl: string | undefined, snapshot?: Snapshot): string {
  if (haUrl?.trim()) {
    try {
      return new URL(haUrl.trim()).hostname;
    } catch {
      /* fall through to the address Home Assistant reports */
    }
  }
  return snapshot?.claude?.callback_host || "";
}

/** The text the person pastes into the routine as its instructions. */
export const ROUTINE_PROMPT = t("claude.you_are_the_answering_side_of");
