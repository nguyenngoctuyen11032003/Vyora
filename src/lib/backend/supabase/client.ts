// The one Supabase client of the gym app (shared Note_mytasks project → same auth.users as Fitora).
// storageKey 'vyora.auth' differs from Fitora ('fitora.auth') and Note_mytasks ('nm.auth'): the apps share
// the *.github.io origin, and signing out of one must not sign out of the others.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const AUTH_STORAGE_KEY = "vyora.auth";

let cached: SupabaseClient | null | undefined;

/** Builds a client, or null when the URL / anon key are missing (→ "Chưa cấu hình máy chủ"). */
export function createGymSupabaseClient(url: string | undefined, anonKey: string | undefined): SupabaseClient | null {
  if (!url?.trim() || !anonKey?.trim()) return null;
  return createClient(url.trim(), anonKey.trim(), {
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      // Recovery links are parsed by readAuthLink() and spent explicitly (verifyOtp / exchangeCodeForSession).
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });
}

/** Lazily created singleton. NEXT_PUBLIC_* must be referenced literally so Next inlines them at build time. */
export function getSupabaseClient(): SupabaseClient | null {
  if (cached === undefined) {
    cached = createGymSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return cached;
}
