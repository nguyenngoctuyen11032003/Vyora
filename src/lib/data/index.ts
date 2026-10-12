// Entry point of the data layer.
//   Supabase (default): real account, Fitora profile, fit_workouts — needs NEXT_PUBLIC_SUPABASE_URL/ANON_KEY.
//     Without them a production build still uses Supabase adapters, which answer "Chưa cấu hình máy chủ".
//   Mock (localStorage, no network): NEXT_PUBLIC_DATA_SOURCE=mock, or `next dev` / tests without Supabase env.
import { createSupabaseDataSource, getSupabaseClient } from "@/src/lib/backend/supabase";
import { createMockDataSource } from "./mock";
import type { DataSource } from "./types";

export type { AuthAdapter, DataSource, ProfileAdapter, WorkoutsAdapter } from "./types";
export { createMockDataSource } from "./mock";
export { ERROR_MESSAGES, RESET_SENT_MESSAGE, normalizeEmail } from "./messages";

export type DataSourceKind = DataSource["kind"];

/** Which data source a build uses (exported for tests). */
export function pickDataSource(env: { mode?: string; nodeEnv?: string; configured: boolean }): DataSourceKind {
  if (env.mode === "mock") return "mock";
  if (env.mode === "supabase") return "supabase";
  if (env.configured) return "supabase";
  return env.nodeEnv === "production" ? "supabase" : "mock";
}

export function createDataSource(): DataSource {
  const client = getSupabaseClient();
  const kind = pickDataSource({
    mode: process.env.NEXT_PUBLIC_DATA_SOURCE,
    nodeEnv: process.env.NODE_ENV,
    configured: client !== null,
  });
  return kind === "mock" ? createMockDataSource() : createSupabaseDataSource(client);
}
