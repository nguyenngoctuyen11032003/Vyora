// Domain types shared by the UI, the pure logic in src/lib and the data adapters in src/lib/data.
// Shapes follow docs/superpowers/specs/2026-10-12-gym-f1-redesign-design.md (§4 profile, §5 timer, §6 row).
import type { ActivityLevel, Goal, Sex, WorkoutCategory } from "@/src/lib/fitora/types";

export type { ActivityLevel, Goal, Sex, WorkoutCategory };

/** Every screen the app can show. Navigation is state-based (no routes). */
export type ScreenId = "login" | "forgot" | "reset" | "today" | "session" | "week" | "profile";

/* ------------------------------------------------------------------ auth */

export interface AuthUser {
  id: string;
  email: string;
}

export type AuthErrorCode =
  | "invalid_email"
  | "missing_password"
  | "invalid_credentials"
  | "weak_password"
  | "password_mismatch"
  | "expired_link"
  | "network"
  | "not_configured"
  | "unknown";

/** Result of an adapter call. `message` is ready-to-show Vietnamese copy. */
export type Result<T = void> = { ok: true; data: T } | { ok: false; code: AuthErrorCode; message: string };

/** Parameters of a password-recovery link (`?flow=recovery&token_hash=…&type=recovery` or legacy `?code=`). */
export interface RecoveryParams {
  tokenHash: string | null;
  type: string | null;
  code: string | null;
}

/* --------------------------------------------------------------- profile */

/** Read-only snapshot of the user's Fitora data (profiles + fit_profiles + latest fit_body_measurements). */
export interface FitoraProfile {
  userId: string;
  email: string;
  /** profiles.display_name (null → show the email). */
  displayName: string | null;
  /** Ready-to-use image URL (signed URL / data URI), or null. */
  avatarUrl: string | null;
  /** False when the user never finished Fitora onboarding (no fit_profiles row). */
  hasFitProfile: boolean;
  sex: Sex | null;
  birthDate: string | null;
  /** Whole years, computed from birthDate. */
  age: number | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  /** kcal/day target from Fitora. */
  calorieTarget: number | null;
  targetWeightKg: number | null;
  startWeightKg: number | null;
  /** Latest measured weight (fit_body_measurements, measured_on ≤ today). */
  latestWeightKg: number | null;
  /** 'YYYY-MM-DD' of latestWeightKg. */
  latestMeasuredOn: string | null;
  /** ISO time the snapshot was fetched (shown as "dữ liệu lúc …" when offline). */
  fetchedAt: string;
}

export type WeightSource = "measured" | "profile" | "manual" | "fallback";

/** The weight used for kcal maths and where it came from. */
export interface WeightInfo {
  kg: number;
  source: WeightSource;
  /** "Fitora · đo 10/10", "Fitora · hồ sơ", "nhập tay" or "mặc định". */
  label: string;
  /** True when the value is the 65 kg fallback the user has not confirmed yet (FinishSheet must ask). */
  needsConfirm: boolean;
}

/* --------------------------------------------------------------- session */

export type SessionKind = "plan" | "activity";

/** Running/paused session, persisted in localStorage `gym.activeSession` (spec §5). */
export interface ActiveSession {
  /** uuid, becomes `client_ref` of the saved row. */
  id: string;
  kind: SessionKind;
  /** WorkoutDay.id for plan sessions, null for other activities. */
  dayId: string | null;
  /** Fitora catalogue key ('weight_training' for plan sessions). */
  activity: string;
  category: WorkoutCategory;
  /** Variant id of the activity ('moderate', 'competitive', …). */
  variant: string;
  met: number;
  /** Title shown on the session screen and stored as the row title (day title or buildTitle()). */
  title: string;
  /** Weight locked in when the session started. */
  weightKg: number;
  weightSource: WeightSource;
  startedAt: string;
  pausedAt: string | null;
  pausedMs: number;
  /** Exercise ids ticked in the plan checklist (tracking only, no kcal effect). */
  checked: string[];
}

/** What a screen passes to start a session. */
export interface StartSessionInput {
  kind: SessionKind;
  dayId: string | null;
  activity: string;
  variant: string;
}

/* --------------------------------------------------------------- workouts */

/** Insert/upsert payload for `fit_workouts` (spec §6). */
export interface FitWorkoutRow {
  workout_on: string;
  start_time: string;
  category: WorkoutCategory;
  activity: string;
  title: string;
  met: number;
  duration_min: number;
  kcal: number;
  status: "done";
  notes: string;
  source: "gym";
  client_ref: string;
}

export type SyncStatus = "saved" | "pending" | "failed";

/** A gym session as listed in "Tuần này": the row plus local sync state. */
export interface GymWorkout extends FitWorkoutRow {
  /** Server id when saved; equals client_ref while pending. */
  id: string;
  created_at: string;
  sync: SyncStatus;
  /** Vietnamese reason when sync === 'failed'. */
  error?: string;
}
