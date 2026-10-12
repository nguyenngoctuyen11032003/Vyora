import { beforeEach, describe, expect, it } from "vitest";
import { pickDataSource } from "@/src/lib/data";
import { outboxKey } from "@/src/lib/outbox";
import { readJson } from "@/src/lib/storage";
import type { AuthUser, FitWorkoutRow } from "@/src/types/gym";
import { classifyDbError } from "./errors-db";
import { createFakeDb } from "./fake-client";
import { createSupabaseProfileAdapter } from "./profile-adapter";
import { createSupabaseWorkoutsAdapter, workoutsCacheKey } from "./workouts-adapter";

const USER: AuthUser = { id: "u-1", email: "a@b.co" };
const NOW = () => new Date(2026, 9, 12, 19, 0);

const row = (ref: string, over: Partial<FitWorkoutRow> = {}): FitWorkoutRow => ({
  workout_on: "2026-10-12",
  start_time: "18:00",
  category: "gym",
  activity: "weight_training",
  title: "Ngực, vai và tay sau",
  met: 3.5,
  duration_min: 60,
  kcal: 257,
  status: "done",
  notes: "6/6 bài · Gym app",
  source: "gym",
  client_ref: ref,
  ...over,
});

beforeEach(() => localStorage.clear());

describe("WorkoutsAdapter (Supabase)", () => {
  it("save inserts one gym row with ignore-duplicates on (user_id, client_ref) and returns it as saved", async () => {
    const db = createFakeDb();
    const w = createSupabaseWorkoutsAdapter(db.client, { now: NOW });
    const saved = await w.save(USER, row("r1"));
    expect(saved).toMatchObject({ client_ref: "r1", sync: "saved", start_time: "18:00", kcal: 257 });
    expect(saved.id).toMatch(/^srv-/);
    const up = db.calls.find((c) => c.op === "upsert");
    expect(up?.options).toEqual({ onConflict: "user_id,client_ref", ignoreDuplicates: true });
    expect(up?.payload).not.toHaveProperty("user_id"); // user_id = auth.uid() server-side
    expect(db.tables.fit_workouts).toHaveLength(1);
    expect(await w.pendingCount(USER)).toBe(0);
  });

  it("offline save stays pending in the outbox and is sent exactly once when list() runs again", async () => {
    const db = createFakeDb();
    const w = createSupabaseWorkoutsAdapter(db.client, { now: NOW });
    db.fail("fit_workouts", "throw");
    const pending = await w.save(USER, row("r1"));
    expect(pending.sync).toBe("pending");
    expect(await w.pendingCount(USER)).toBe(1);
    expect(db.tables.fit_workouts).toHaveLength(0);

    const list = await w.list(USER, "2026-10-01"); // back online
    expect(list.map((x) => [x.client_ref, x.sync])).toEqual([["r1", "saved"]]);
    expect(db.tables.fit_workouts).toHaveLength(1);
    expect(readJson(outboxKey(USER.id))).toBeNull();
    await w.list(USER, "2026-10-01");
    expect(db.tables.fit_workouts).toHaveLength(1);
  });

  it("a lost response (row reached the server) never duplicates and never overwrites a Fitora edit", async () => {
    const db = createFakeDb();
    const w = createSupabaseWorkoutsAdapter(db.client, { now: NOW });
    await w.save(USER, row("r1"));
    db.tables.fit_workouts[0].duration_min = 50; // edited in Fitora
    db.tables.fit_workouts[0].kcal = 214;
    await w.save(USER, row("r1")); // retry of the same session
    expect(db.tables.fit_workouts).toHaveLength(1);
    expect((await w.list(USER, "2026-10-01"))[0]).toMatchObject({ duration_min: 50, kcal: 214 });
  });

  it("schema not migrated → pending; invalid row → failed and kept, never retried", async () => {
    const db = createFakeDb();
    const w = createSupabaseWorkoutsAdapter(db.client, { now: NOW });
    db.fail("fit_workouts", { error: { code: "PGRST204", message: "Could not find the 'client_ref' column" } });
    expect((await w.save(USER, row("r1"))).sync).toBe("pending");
    await w.list(USER, "2026-10-01"); // backend migrated → r1 goes out
    expect(await w.pendingCount(USER)).toBe(0);

    db.fail("fit_workouts", { error: { code: "23514", message: 'violates check constraint "fit_workouts_met_check"' } });
    const bad = await w.save(USER, row("r2", { met: 99 }));
    expect(bad.sync).toBe("failed");
    expect(bad.error).toMatch(/từ chối/);

    await w.list(USER, "2026-10-01");
    expect(db.tables.fit_workouts.map((r) => r.client_ref)).toEqual(["r1"]);
    expect(db.calls.filter((c) => c.op === "upsert" && (c.payload as FitWorkoutRow).client_ref === "r2")).toHaveLength(1);
    expect(await w.pendingCount(USER)).toBe(1);
  });

  it("list shows only own done gym rows since the date, newest first, merged with the outbox", async () => {
    const db = createFakeDb("u-1", {
      fit_workouts: [
        { id: "f1", user_id: "u-1", source: "fitora", status: "done", workout_on: "2026-10-11", client_ref: null, start_time: "07:00:00", created_at: "x" },
        { id: "g0", user_id: "u-1", source: "gym", status: "done", workout_on: "2026-09-01", client_ref: "old", start_time: "07:00:00", created_at: "x" },
        { id: "g1", user_id: "u-1", source: "gym", status: "done", workout_on: "2026-10-10", client_ref: "a", start_time: "07:00:00", met: "6.0", kcal: "441.0", duration_min: 60, created_at: "x" },
        { id: "o1", user_id: "u-2", source: "gym", status: "done", workout_on: "2026-10-11", client_ref: "z", start_time: "07:00:00", created_at: "x" },
      ],
    });
    const w = createSupabaseWorkoutsAdapter(db.client, { now: NOW });
    db.fail("fit_workouts", "throw");
    await w.save(USER, row("b", { workout_on: "2026-10-12" }));
    const list = await w.list(USER, "2026-10-01");
    expect(list.map((x) => x.client_ref)).toEqual(["b", "a"]);
    expect(list[1]).toMatchObject({ met: 6, kcal: 441, start_time: "07:00", sync: "saved" });
  });

  it("offline list falls back to the cached server list plus the outbox", async () => {
    const db = createFakeDb();
    const w = createSupabaseWorkoutsAdapter(db.client, { now: NOW });
    await w.save(USER, row("a"));
    await w.list(USER, "2026-10-01");
    expect(readJson(workoutsCacheKey(USER.id))).toHaveLength(1);
    db.fail("fit_workouts", "throw", true);
    await w.save(USER, row("b"));
    const list = await w.list(USER, "2026-10-01");
    expect(list.map((x) => [x.client_ref, x.sync]).sort()).toEqual([["a", "saved"], ["b", "pending"]]);
  });

  it("remove deletes only the gym row on the server; failed rows are dropped locally", async () => {
    const db = createFakeDb("u-1", {
      fit_workouts: [{ id: "f1", user_id: "u-1", source: "fitora", status: "done", workout_on: "2026-10-12", client_ref: "same", created_at: "x" }],
    });
    const w = createSupabaseWorkoutsAdapter(db.client, { now: NOW });
    await w.save(USER, row("r1"));
    expect(await w.remove(USER, "r1")).toEqual({ ok: true, data: undefined });
    expect(await w.remove(USER, "same")).toEqual({ ok: true, data: undefined });
    expect(db.tables.fit_workouts.map((r) => r.id)).toEqual(["f1"]); // Fitora row untouched

    db.fail("fit_workouts", { error: { code: "23514", message: "check" } });
    await w.save(USER, row("bad"));
    db.fail("fit_workouts", "throw", true);
    expect(await w.remove(USER, "bad")).toEqual({ ok: true, data: undefined });
    expect(await w.pendingCount(USER)).toBe(0);
  });

  it("remove while offline reports network and keeps the pending row", async () => {
    const db = createFakeDb();
    const w = createSupabaseWorkoutsAdapter(db.client, { now: NOW });
    db.fail("fit_workouts", "throw", true);
    await w.save(USER, row("r1"));
    expect(await w.remove(USER, "r1")).toMatchObject({ ok: false, code: "network" });
    expect(await w.pendingCount(USER)).toBe(1);
  });

  it("the outbox is per user", async () => {
    const db = createFakeDb();
    const w = createSupabaseWorkoutsAdapter(db.client, { now: NOW });
    db.fail("fit_workouts", "throw");
    await w.save(USER, row("r1"));
    expect(await w.pendingCount({ id: "u-2", email: "c@d.co" })).toBe(0);
  });
});

describe("ProfileAdapter (Supabase)", () => {
  it("reads profiles, fit_profiles and the latest past weight (numeric strings → numbers)", async () => {
    const db = createFakeDb("u-1", {
      profiles: [{ id: "u-1", display_name: " Tuyền ", avatar_url: "https://x/avatars/u-1.webp" }],
      fit_profiles: [
        { user_id: "u-1", sex: "male", birth_date: "1995-03-14", height_cm: "172.0", activity_level: "moderate", goal: "lose", calorie_target: 1850, target_weight_kg: "66.0", start_weight_kg: "74.0" },
      ],
      fit_body_measurements: [
        { user_id: "u-1", measured_on: "2026-10-01", weight_kg: "71.2" },
        { user_id: "u-1", measured_on: "2026-10-10", weight_kg: "70.4" },
        { user_id: "u-1", measured_on: "2026-10-11", weight_kg: null },
        { user_id: "u-1", measured_on: "2026-10-20", weight_kg: "69.0" },
        { user_id: "u-2", measured_on: "2026-10-11", weight_kg: "99" },
      ],
    });
    const res = await createSupabaseProfileAdapter(db.client, NOW).load(USER);
    expect(res).toMatchObject({
      ok: true,
      data: {
        displayName: "Tuyền",
        avatarUrl: "https://x/avatars/u-1.webp",
        hasFitProfile: true,
        age: 31,
        heightCm: 172,
        calorieTarget: 1850,
        targetWeightKg: 66,
        startWeightKg: 74,
        latestWeightKg: 70.4,
        latestMeasuredOn: "2026-10-10",
      },
    });
  });

  it("a user who never onboarded in Fitora gets hasFitProfile=false and no weight", async () => {
    const res = await createSupabaseProfileAdapter(createFakeDb().client, NOW).load(USER);
    expect(res).toMatchObject({ ok: true, data: { hasFitProfile: false, latestWeightKg: null, startWeightKg: null, displayName: null } });
  });

  it("offline → network error (the hook then shows the cached snapshot)", async () => {
    const db = createFakeDb();
    db.fail("fit_profiles", "throw");
    expect(await createSupabaseProfileAdapter(db.client, NOW).load(USER)).toMatchObject({ ok: false, code: "network" });
  });

  it("no client → not_configured", async () => {
    expect(await createSupabaseProfileAdapter(null).load(USER)).toMatchObject({ ok: false, code: "not_configured" });
  });
});

describe("classifyDbError", () => {
  it.each([
    [{ message: "TypeError: Failed to fetch" }, undefined, "network"],
    [{ code: "PGRST301", message: "JWT expired" }, 401, "network"],
    [{ code: "", message: "Bad gateway" }, 502, "network"],
    [{ code: "PGRST204", message: "column" }, 400, "schema"],
    [{ code: "42P10", message: "no unique or exclusion constraint matching the ON CONFLICT specification" }, 400, "schema"],
    [{ code: "23514", message: "check" }, 400, "invalid"],
    [{ code: "22P02", message: "invalid input syntax for type uuid" }, 400, "invalid"],
    [{ code: "42501", message: "new row violates row-level security policy" }, 403, "unknown"],
  ])("%o → %s", (err, status, kind) => {
    expect(classifyDbError(err, status)).toBe(kind);
  });
});

describe("pickDataSource", () => {
  it("uses Supabase when configured, mock only when forced or in dev/tests without env", () => {
    expect(pickDataSource({ configured: true, nodeEnv: "production" })).toBe("supabase");
    expect(pickDataSource({ configured: false, nodeEnv: "production" })).toBe("supabase");
    expect(pickDataSource({ configured: false, nodeEnv: "development" })).toBe("mock");
    expect(pickDataSource({ configured: true, mode: "mock" })).toBe("mock");
    expect(pickDataSource({ configured: false, mode: "supabase", nodeEnv: "test" })).toBe("supabase");
  });
});
