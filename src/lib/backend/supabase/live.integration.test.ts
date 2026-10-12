// End-to-end check of Vyora's data layer against a REAL Supabase (local stack of Note_mytasks):
// real Auth (sign-in, recovery e-mail via Mailpit), RLS, the 20261012000500 migration, and the
// Fitora summary RPC that turns Vyora sessions into "calo đã đốt".
//
// Skipped unless the env is set, e.g. (values from `npx supabase status` in Note_mytasks):
//   VYORA_LIVE_SUPABASE_URL=http://127.0.0.1:54321 VYORA_LIVE_ANON_KEY=… VYORA_LIVE_SERVICE_KEY=… \
//   VYORA_LIVE_MAILPIT_URL=http://127.0.0.1:54324 npx vitest run src/lib/backend/supabase/live.integration.test.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { metKcal } from "@/src/lib/fitora";
import { toLocalDate } from "@/src/lib/format";
import { toWorkoutRow } from "@/src/lib/workout-row";
import type { ActiveSession, AuthUser } from "@/src/types/gym";
import { createSupabaseAuthAdapter } from "./auth-adapter";
import { readAuthLink } from "./auth";
import { createGymSupabaseClient } from "./client";
import { createSupabaseProfileAdapter } from "./profile-adapter";
import { createSupabaseWorkoutsAdapter } from "./workouts-adapter";

const URL_ = process.env.VYORA_LIVE_SUPABASE_URL;
const ANON = process.env.VYORA_LIVE_ANON_KEY;
const SERVICE = process.env.VYORA_LIVE_SERVICE_KEY;
const MAILPIT = process.env.VYORA_LIVE_MAILPIT_URL;
const live = Boolean(URL_ && ANON && SERVICE);

/** Fitora's own select list (Fitora src/services/workouts.ts COLS) — must keep working on gym rows. */
const FITORA_COLS = "id, user_id, workout_on, start_time, category, activity, title, met, duration_min, kcal, status, template_id, notes, created_at, updated_at";

describe.skipIf(!live)("Vyora ↔ Supabase (live)", () => {
  const email = `vyora-live-${Date.now()}@example.test`;
  const password = "Vyora-test-1234";
  let admin: SupabaseClient;
  let client: SupabaseClient;
  let user: AuthUser;
  const today = toLocalDate(new Date());

  beforeAll(async () => {
    admin = createClient(URL_!, SERVICE!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: "Vyora Live" } });
    if (error) throw error;
    user = { id: data.user.id, email };
    client = createGymSupabaseClient(URL_, ANON)!;
  });

  afterAll(async () => {
    if (user) await admin.auth.admin.deleteUser(user.id); // cascades to fit_* rows
  });

  it("signs in with the shared account (no sign-up in Vyora)", async () => {
    const auth = createSupabaseAuthAdapter(client);
    expect(await auth.signIn(email, "wrong-password")).toMatchObject({ ok: false, code: "invalid_credentials" });
    expect(await auth.signIn(email, password)).toEqual({ ok: true, data: user });
    expect(await auth.getUser()).toEqual(user);
  });

  it("reads the Fitora profile and latest weight (read-only)", async () => {
    // What Fitora writes during onboarding + a body measurement.
    const fp = await client.from("fit_profiles").insert({
      sex: "male", birth_date: "1995-03-14", height_cm: 172, activity_level: "moderate", goal: "lose",
      start_weight_kg: 74, calorie_target: 1850, protein_g: 140, carbs_g: 180, fat_g: 55,
    });
    expect(fp.error).toBeNull();
    expect((await client.from("fit_body_measurements").insert({ measured_on: today, weight_kg: 70 })).error).toBeNull();

    const res = await createSupabaseProfileAdapter(client).load(user);
    expect(res).toMatchObject({ ok: true, data: { displayName: "Vyora Live", hasFitProfile: true, heightCm: 172, latestWeightKg: 70, startWeightKg: 74, calorieTarget: 1850 } });
  });

  it("a 60-minute plan session at 70 kg is saved once and shows up as Fitora's burned kcal", async () => {
    const workouts = createSupabaseWorkoutsAdapter(client);
    const startedAt = new Date();
    startedAt.setHours(7, 0, 0, 0);
    const session: ActiveSession = {
      id: randomUUID(), kind: "plan", dayId: "monday", activity: "weight_training", category: "gym", variant: "moderate", met: 3.5,
      title: "Ngực, vai và tay sau", weightKg: 70, weightSource: "measured", startedAt: startedAt.toISOString(), pausedAt: null, pausedMs: 0,
      checked: ["a", "b", "c", "d", "e"],
    };
    const row = toWorkoutRow({ session, durationMin: 60, totalExercises: 6 });
    expect(row.kcal).toBe(metKcal(3.5, 70, 60));
    expect(row.kcal).toBe(257);

    const saved = await workouts.save(user, row);
    expect(saved).toMatchObject({ sync: "saved", kcal: 257, duration_min: 60, source: "gym", start_time: "07:00" });
    await workouts.save(user, row); // retry after a "lost response"
    const { data: rows } = await client.from("fit_workouts").select("id").eq("client_ref", session.id);
    expect(rows).toHaveLength(1);

    // Fitora's Today / Reports read these RPCs.
    const { data: day, error } = await client.rpc("fit_day_summary", { p_date: row.workout_on });
    expect(error).toBeNull();
    expect(Number(day.workout_kcal)).toBe(257);
    const { data: range } = await client.rpc("fit_range_summary", { p_from: row.workout_on, p_to: row.workout_on });
    expect(Number(range[0].workout_kcal)).toBe(257);

    // Fitora's workout list query still works on the gym row (it is an ordinary fit_workouts row).
    const { data: fitoraView, error: fe } = await client.from("fit_workouts").select(`${FITORA_COLS}, source`).eq("workout_on", row.workout_on);
    expect(fe).toBeNull();
    expect(fitoraView).toEqual([expect.objectContaining({ activity: "weight_training", title: "Ngực, vai và tay sau", met: 3.5, duration_min: 60, kcal: 257, status: "done", source: "gym", notes: "5/6 bài · Gym app" })]);
  });

  it("other activities from the Fitora catalogue are stored with Fitora's keys", async () => {
    const workouts = createSupabaseWorkoutsAdapter(client);
    const session: ActiveSession = {
      id: randomUUID(), kind: "activity", dayId: null, activity: "badminton", category: "team_sport", variant: "competitive", met: 7,
      title: "", weightKg: 70, weightSource: "measured", startedAt: new Date().toISOString(), pausedAt: null, pausedMs: 0, checked: [],
    };
    const row = toWorkoutRow({ session, durationMin: 45 });
    const saved = await workouts.save(user, row);
    expect(saved).toMatchObject({ sync: "saved", category: "team_sport", activity: "badminton" });
    const list = await workouts.list(user, today);
    expect(list.map((w) => w.activity).sort()).toEqual(["badminton", "weight_training"]);
  });

  it("deleting a session in Vyora removes it from Fitora's totals", async () => {
    const workouts = createSupabaseWorkoutsAdapter(client);
    const list = await workouts.list(user, today);
    for (const w of list) expect(await workouts.remove(user, w.client_ref)).toEqual({ ok: true, data: undefined });
    const { data: day } = await client.rpc("fit_day_summary", { p_date: today });
    expect(Number(day.workout_kcal)).toBe(0);
  });

  it.skipIf(!MAILPIT)("forgot password: e-mail link → new password → sign in", async () => {
    const auth = createSupabaseAuthAdapter(client, { recoveryRedirectTo: () => "http://localhost:3000/?flow=recovery" });
    await auth.signOut();
    expect(await auth.requestPasswordReset(email)).toEqual({ ok: true, data: undefined });

    let link: string | null = null;
    for (let i = 0; i < 20 && !link; i++) {
      const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
      const { messages } = (await res.json()) as { messages: Array<{ ID: string }> };
      if (messages?.length) {
        const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { HTML: string; Text: string };
        link = /href="([^"]*token_hash=[^"]+)"/.exec(msg.HTML)?.[1]?.replace(/&amp;/g, "&") ?? null;
      }
      if (!link) await new Promise((r) => setTimeout(r, 500));
    }
    expect(link).toBeTruthy();
    const parsed = readAuthLink(link!);
    expect(parsed?.kind).toBe("recovery_token");
    const tokenHash = parsed?.kind === "recovery_token" ? parsed.tokenHash : null;

    expect(await auth.verifyRecoveryLink({ tokenHash, type: "recovery", code: null })).toEqual({ ok: true, data: user });
    expect(await auth.updatePassword("short")).toMatchObject({ ok: false, code: "weak_password" });
    expect(await auth.updatePassword("Vyora-new-5678")).toEqual({ ok: true, data: undefined });
    // the link is single-use
    expect(await auth.verifyRecoveryLink({ tokenHash, type: "recovery", code: null })).toMatchObject({ ok: false, code: "expired_link" });

    await auth.signOut();
    expect(await auth.signIn(email, password)).toMatchObject({ ok: false, code: "invalid_credentials" });
    expect(await auth.signIn(email, "Vyora-new-5678")).toEqual({ ok: true, data: user });
  });
});
