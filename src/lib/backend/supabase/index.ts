// Supabase DataSource: real auth (shared Note_mytasks / Fitora account), read-only Fitora profile,
// and the user's source='gym' rows of fit_workouts.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DataSource } from "@/src/lib/data/types";
import { createSupabaseAuthAdapter } from "./auth-adapter";
import { getSupabaseClient } from "./client";
import { createSupabaseProfileAdapter } from "./profile-adapter";
import { createSupabaseWorkoutsAdapter } from "./workouts-adapter";

export { getSupabaseClient } from "./client";

export function createSupabaseDataSource(client: SupabaseClient | null = getSupabaseClient()): DataSource {
  return {
    kind: "supabase",
    auth: createSupabaseAuthAdapter(client),
    profile: createSupabaseProfileAdapter(client),
    workouts: createSupabaseWorkoutsAdapter(client),
  };
}
