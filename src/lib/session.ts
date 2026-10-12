// Pure timer logic (spec §5). State is timestamps, never a counter, so it survives screen lock, tab
// switches, reloads and closed browsers. Every function takes `now` so tests can fake time.
import type { ActiveSession, SessionKind, WeightSource, WorkoutCategory } from "@/src/types/gym";

/** Sessions longer than this probably forgot "Kết thúc" (FinishSheet warns and pre-fills 60 min). */
export const FORGOTTEN_AFTER_MS = 4 * 60 * 60 * 1000;
export const FORGOTTEN_PREFILL_MIN = 60;
export const MIN_SAVE_MINUTES = 1;
export const MAX_SAVE_MINUTES = 300;

export const ACTIVE_SESSION_KEY = "gym.activeSession";

type Now = Date | number;
const ms = (t: Now) => (typeof t === "number" ? t : t.getTime());

export interface StartParams {
  kind: SessionKind;
  dayId: string | null;
  activity: string;
  category: WorkoutCategory;
  variant: string;
  met: number;
  title: string;
  weightKg: number;
  weightSource: WeightSource;
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // RFC 4122 v4 fallback for old browsers / test envs.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function start(params: StartParams, now: Now, id: string = newSessionId()): ActiveSession {
  return {
    id,
    ...params,
    startedAt: new Date(ms(now)).toISOString(),
    pausedAt: null,
    pausedMs: 0,
    checked: [],
  };
}

export function isPaused(s: ActiveSession): boolean {
  return s.pausedAt !== null;
}

export function pause(s: ActiveSession, now: Now): ActiveSession {
  if (s.pausedAt) return s;
  return { ...s, pausedAt: new Date(ms(now)).toISOString() };
}

export function resume(s: ActiveSession, now: Now): ActiveSession {
  if (!s.pausedAt) return s;
  const paused = Math.max(0, ms(now) - Date.parse(s.pausedAt));
  return { ...s, pausedAt: null, pausedMs: s.pausedMs + paused };
}

/** (pausedAt ?? now) − startedAt − pausedMs, never negative. */
export function elapsedMs(s: ActiveSession, now: Now): number {
  const end = s.pausedAt ? Date.parse(s.pausedAt) : ms(now);
  return Math.max(0, end - Date.parse(s.startedAt) - s.pausedMs);
}

export function toggleChecked(s: ActiveSession, exerciseId: string): ActiveSession {
  const checked = s.checked.includes(exerciseId)
    ? s.checked.filter((id) => id !== exerciseId)
    : [...s.checked, exerciseId];
  return { ...s, checked };
}

export interface FinishSummary {
  elapsedMs: number;
  /** Elapsed time rounded to whole minutes, clamped to 0–300. */
  minutes: number;
  /** Ran longer than 4 h: show "Có thể bạn quên bấm kết thúc". */
  forgotten: boolean;
  /** Value to pre-fill in FinishSheet (60 when forgotten). */
  suggestedMinutes: number;
  /** Under one minute: only "Huỷ buổi tập" is allowed. */
  canSave: boolean;
}

export function finish(s: ActiveSession, now: Now): FinishSummary {
  const e = elapsedMs(s, now);
  const minutes = clampMinutes(Math.round(e / 60000), 0);
  const forgotten = e > FORGOTTEN_AFTER_MS;
  return {
    elapsedMs: e,
    minutes,
    forgotten,
    suggestedMinutes: forgotten ? FORGOTTEN_PREFILL_MIN : minutes,
    canSave: forgotten || minutes >= MIN_SAVE_MINUTES,
  };
}

/** Clamp a minutes value to [min, 300]. */
export function clampMinutes(n: number, min = MIN_SAVE_MINUTES): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(MAX_SAVE_MINUTES, Math.max(min, Math.round(n)));
}

export function serializeSession(s: ActiveSession): string {
  return JSON.stringify(s);
}

/** Parses a stored session; null when missing or malformed. */
export function parseSession(raw: string | null | undefined): ActiveSession | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<ActiveSession>;
    const okStr = (x: unknown) => typeof x === "string" && x.length > 0;
    if (
      !okStr(v.id) ||
      (v.kind !== "plan" && v.kind !== "activity") ||
      !okStr(v.activity) ||
      !okStr(v.variant) ||
      typeof v.met !== "number" ||
      typeof v.weightKg !== "number" ||
      !okStr(v.startedAt) ||
      Number.isNaN(Date.parse(v.startedAt as string))
    ) {
      return null;
    }
    return {
      id: v.id as string,
      kind: v.kind,
      dayId: typeof v.dayId === "string" ? v.dayId : null,
      activity: v.activity as string,
      category: (v.category ?? "gym") as WorkoutCategory,
      variant: v.variant as string,
      met: v.met,
      title: typeof v.title === "string" ? v.title : "",
      weightKg: v.weightKg,
      weightSource: (v.weightSource ?? "fallback") as WeightSource,
      startedAt: v.startedAt as string,
      pausedAt: typeof v.pausedAt === "string" ? v.pausedAt : null,
      pausedMs: typeof v.pausedMs === "number" && v.pausedMs >= 0 ? v.pausedMs : 0,
      checked: Array.isArray(v.checked) ? v.checked.filter((x): x is string => typeof x === "string") : [],
    };
  } catch {
    return null;
  }
}
