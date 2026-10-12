// Entry point of the data layer. UI phase: always the local mock. The backend phase replaces the body
// of `createDataSource` with the Supabase adapter (and the "Chưa cấu hình máy chủ" fallback) — nothing
// else in the UI changes.
import { createMockDataSource } from "./mock";
import type { DataSource } from "./types";

export type { AuthAdapter, DataSource, ProfileAdapter, WorkoutsAdapter } from "./types";
export { createMockDataSource } from "./mock";
export { ERROR_MESSAGES, RESET_SENT_MESSAGE, normalizeEmail } from "./messages";

export function createDataSource(): DataSource {
  return createMockDataSource();
}
