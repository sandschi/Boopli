import type {
  AlarmDeviceCfg,
  ChoreDraft,
  Hass,
  LightCfg,
  PhoneCfg,
  Settings,
  SpeakerCfg,
  SpeakerLevel,
  Snapshot,
} from "./types";

export interface TestResult {
  ok: boolean;
  mode?: string;
  note: string;
}

export function saveSettings(hass: Hass, settings: Settings): Promise<void> {
  return hass.callWS({ type: "boopli/settings_save", settings });
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

export function testLight(hass: Hass, light: LightCfg): Promise<TestResult> {
  return hass.callWS({ type: "boopli/test_channel", kind: "light", light });
}

export function testPhone(hass: Hass, phone: PhoneCfg): Promise<TestResult> {
  return hass.callWS({ type: "boopli/test_channel", kind: "phone", phone });
}

export function testSpeaker(
  hass: Hass,
  speaker: SpeakerCfg,
  level: SpeakerLevel
): Promise<TestResult> {
  return hass.callWS({ type: "boopli/test_channel", kind: "speaker", speaker, level });
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

export function startChore(hass: Hass, choreId: string): Promise<{ run_id: string }> {
  return hass.callWS({ type: "boopli/chore_start", chore_id: choreId });
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
