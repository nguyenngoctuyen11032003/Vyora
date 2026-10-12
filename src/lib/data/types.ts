// Data-access contracts. The UI only talks to these interfaces (through the hooks in src/hooks).
// UI phase: `createMockDataSource()` (localStorage). Backend phase: a Supabase implementation of the
// SAME interfaces (supabase-js, storageKey 'vyora.auth', RLS on fit_*), swapped in src/lib/data/index.ts.
import type { AuthUser, FitoraProfile, FitWorkoutRow, GymWorkout, RecoveryParams, Result } from "@/src/types/gym";

export interface AuthAdapter {
  /** Restores the persisted session (null when signed out). */
  getUser(): Promise<AuthUser | null>;
  /** Email + password. Errors: invalid_email, missing_password, invalid_credentials, network. */
  signIn(email: string, password: string): Promise<Result<AuthUser>>;
  signOut(): Promise<void>;
  /**
   * Sends the reset email (`redirectTo: <site>?flow=recovery`). Always resolves ok for a well-formed
   * email so the UI never reveals whether an account exists. Errors: invalid_email, network.
   */
  requestPasswordReset(email: string): Promise<Result>;
  /** verifyOtp({ token_hash, type: 'recovery' }) or exchangeCodeForSession(code). Errors: expired_link, network. */
  verifyRecoveryLink(params: RecoveryParams): Promise<Result<AuthUser>>;
  /** updateUser({ password }) for the recovered session. Errors: weak_password, expired_link, network. */
  updatePassword(password: string): Promise<Result>;
}

export interface ProfileAdapter {
  /** Reads profiles + fit_profiles + latest fit_body_measurements of `user` (read-only). */
  load(user: AuthUser): Promise<Result<FitoraProfile>>;
}

export interface WorkoutsAdapter {
  /** The user's `source='gym'` workouts with workout_on ≥ `since`, newest first (incl. outbox items). */
  list(user: AuthUser, since: string): Promise<GymWorkout[]>;
  /** Upsert on (user_id, client_ref). Never throws: a network failure returns the row as `pending`. */
  save(user: AuthUser, row: FitWorkoutRow): Promise<GymWorkout>;
  /** Deletes one gym row by client_ref (saved → delete, pending → drop from outbox). */
  remove(user: AuthUser, clientRef: string): Promise<Result>;
  /** Number of rows not yet sent (logout asks for confirmation when > 0). */
  pendingCount(user: AuthUser): Promise<number>;
}

export interface DataSource {
  kind: "mock" | "supabase";
  auth: AuthAdapter;
  profile: ProfileAdapter;
  workouts: WorkoutsAdapter;
}
