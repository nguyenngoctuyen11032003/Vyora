import { beforeEach, describe, expect, it } from "vitest";
import { createMockDataSource, nameFromEmail } from "@/src/lib/data/mock";
import type { FitWorkoutRow } from "@/src/types/gym";

const NOW = new Date(2026, 9, 14, 9, 0); // Wednesday 14/10/2026
const data = createMockDataSource({ latencyMs: 0, now: () => NOW });

beforeEach(() => localStorage.clear());

describe("mock auth", () => {
  it("valid email + 8 chars signs in and persists", async () => {
    const res = await data.auth.signIn(" Minh.Anh@Example.com ", "matkhau123");
    expect(res.ok).toBe(true);
    expect(await data.auth.getUser()).toMatchObject({ email: "minh.anh@example.com" });
    await data.auth.signOut();
    expect(await data.auth.getUser()).toBeNull();
  });

  it("magic emails and validation produce Vietnamese errors", async () => {
    expect(await data.auth.signIn("sai@example.com", "matkhau123")).toEqual({ ok: false, code: "invalid_credentials", message: "Email hoặc mật khẩu không đúng" });
    expect(await data.auth.signIn("offline@example.com", "matkhau123")).toMatchObject({ code: "network", message: "Không có kết nối mạng" });
    expect(await data.auth.signIn("not-an-email", "matkhau123")).toMatchObject({ code: "invalid_email" });
    expect(await data.auth.signIn("a@b.vn", "")).toMatchObject({ code: "missing_password" });
  });

  it("password reset always succeeds for a valid email; recovery token 'demo' only", async () => {
    expect(await data.auth.requestPasswordReset("khong-ton-tai@example.com")).toEqual({ ok: true, data: undefined });
    expect((await data.auth.verifyRecoveryLink({ tokenHash: "demo", type: "recovery", code: null })).ok).toBe(true);
    expect(await data.auth.verifyRecoveryLink({ tokenHash: "het-han", type: "recovery", code: null })).toMatchObject({ code: "expired_link" });
    expect(await data.auth.updatePassword("ngan")).toMatchObject({ code: "weak_password" });
    expect((await data.auth.updatePassword("matkhaumoi1")).ok).toBe(true);
  });
});

describe("mock profile", () => {
  it("default user has the review profile (172 cm, 70 kg measured 2 days ago, 31 y)", async () => {
    const res = await data.profile.load({ id: "u1", email: "minh.anh@example.com" });
    expect(res.ok && res.data).toMatchObject({
      displayName: "Minh Anh",
      hasFitProfile: true,
      sex: "male",
      age: 31,
      heightCm: 172,
      latestWeightKg: 70,
      latestMeasuredOn: "2026-10-12",
      activityLevel: "moderate",
      goal: "lose",
      calorieTarget: 1850,
      targetWeightKg: 66,
    });
    expect(res.ok && res.data.avatarUrl?.startsWith("data:image/svg+xml")).toBe(true);
  });

  it("'moi' emails have no Fitora profile", async () => {
    const res = await data.profile.load({ id: "u2", email: "nguoi.moi@example.com" });
    expect(res.ok && res.data.hasFitProfile).toBe(false);
  });

  it("nameFromEmail", () => {
    expect(nameFromEmail("tuyen.nguyen@x.vn")).toBe("Tuyen Nguyen");
  });
});

describe("mock workouts", () => {
  const user = { id: "u1", email: "minh.anh@example.com" };
  const row: FitWorkoutRow = {
    workout_on: "2026-10-14",
    start_time: "08:00",
    category: "gym",
    activity: "weight_training",
    title: "Lưng, xô và tay trước",
    met: 3.5,
    duration_min: 60,
    kcal: 257,
    status: "done",
    notes: "7/7 bài · Gym app",
    source: "gym",
    client_ref: "ref-1",
  };

  it("seeds demo history once, then saves idempotently and removes", async () => {
    const seeded = await data.workouts.list(user, "2026-01-01");
    expect(seeded.length).toBeGreaterThan(0);
    await data.workouts.save(user, row);
    await data.workouts.save(user, { ...row, duration_min: 61 });
    const after = await data.workouts.list(user, "2026-01-01");
    expect(after.filter((w) => w.client_ref === "ref-1")).toHaveLength(1);
    expect(after[0]).toMatchObject({ client_ref: "ref-1", duration_min: 61, sync: "saved" });
    await data.workouts.remove(user, "ref-1");
    expect((await data.workouts.list(user, "2026-01-01")).some((w) => w.client_ref === "ref-1")).toBe(false);
  });

  it("new users start empty", async () => {
    expect(await data.workouts.list({ id: "u3", email: "moi@example.com" }, "2026-01-01")).toEqual([]);
  });
});
