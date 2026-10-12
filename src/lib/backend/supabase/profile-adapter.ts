// Supabase ProfileAdapter: READ-ONLY snapshot of the user's Fitora data (spec §4).
//   profiles               display_name, avatar_url (shared with Note_mytasks; avatars bucket is public)
//   fit_profiles           Fitora onboarding: sex, birth date, height, activity level, goal, targets
//   fit_body_measurements  latest weight_kg measured on or before today
// Vyora never writes any of these tables.
import type { SupabaseClient } from "@supabase/supabase-js";
import { ERROR_MESSAGES } from "@/src/lib/data/messages";
import type { ProfileAdapter } from "@/src/lib/data/types";
import { ageFrom, toLocalDate } from "@/src/lib/format";
import type { ActivityLevel, FitoraProfile, Goal, Result, Sex } from "@/src/types/gym";
import { classifyDbError } from "./errors-db";

const FIT_PROFILE_COLS = "sex, birth_date, height_cm, activity_level, goal, calorie_target, target_weight_kg, start_weight_kg";

/** numeric columns may arrive as strings; null/'' stay null. */
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

interface FitProfileRow {
  sex: Sex | null;
  birth_date: string | null;
  height_cm: number | string | null;
  activity_level: ActivityLevel | null;
  goal: Goal | null;
  calorie_target: number | string | null;
  target_weight_kg: number | string | null;
  start_weight_kg: number | string | null;
}

export function createSupabaseProfileAdapter(client: SupabaseClient | null, now: () => Date = () => new Date()): ProfileAdapter {
  return {
    async load(user): Promise<Result<FitoraProfile>> {
      if (!client) return { ok: false, code: "not_configured", message: ERROR_MESSAGES.not_configured };
      const today = now();
      try {
        const [shared, fit, weight] = await Promise.all([
          client.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle(),
          client.from("fit_profiles").select(FIT_PROFILE_COLS).eq("user_id", user.id).maybeSingle(),
          client
            .from("fit_body_measurements")
            .select("measured_on, weight_kg")
            .eq("user_id", user.id)
            .not("weight_kg", "is", null)
            .lte("measured_on", toLocalDate(today))
            .order("measured_on", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        const failed = [shared, fit, weight].find((r) => r.error);
        if (failed) {
          const kind = classifyDbError(failed.error, failed.status);
          return { ok: false, code: kind === "network" ? "network" : "unknown", message: kind === "network" ? ERROR_MESSAGES.network : "Không tải được hồ sơ Fitora." };
        }

        const p = shared.data as { display_name: string | null; avatar_url: string | null } | null;
        const f = fit.data as FitProfileRow | null;
        const m = weight.data as { measured_on: string; weight_kg: number | string } | null;
        const displayName = p?.display_name?.trim() || null;

        return {
          ok: true,
          data: {
            userId: user.id,
            email: user.email,
            displayName,
            avatarUrl: p?.avatar_url?.trim() || null,
            hasFitProfile: Boolean(f),
            sex: f?.sex ?? null,
            birthDate: f?.birth_date ?? null,
            age: ageFrom(f?.birth_date ?? null, today),
            heightCm: num(f?.height_cm),
            activityLevel: f?.activity_level ?? null,
            goal: f?.goal ?? null,
            calorieTarget: num(f?.calorie_target),
            targetWeightKg: num(f?.target_weight_kg),
            startWeightKg: num(f?.start_weight_kg),
            latestWeightKg: num(m?.weight_kg),
            latestMeasuredOn: m?.measured_on ?? null,
            fetchedAt: today.toISOString(),
          },
        };
      } catch (e) {
        const kind = classifyDbError(e);
        return { ok: false, code: kind === "network" ? "network" : "unknown", message: kind === "network" ? ERROR_MESSAGES.network : ERROR_MESSAGES.unknown };
      }
    },
  };
}
