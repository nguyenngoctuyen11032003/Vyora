import { describe, expect, it } from "vitest";
import { start, toggleChecked, type StartParams } from "@/src/lib/session";
import { toWorkoutRow } from "@/src/lib/workout-row";

// Local time (the test runner's timezone): 18:05 on 12/10/2026.
const T0 = new Date(2026, 9, 12, 18, 5, 30).getTime();

const plan: StartParams = {
  kind: "plan",
  dayId: "monday",
  activity: "weight_training",
  category: "gym",
  variant: "moderate",
  met: 3.5,
  title: "Ngực, vai và tay sau",
  weightKg: 70,
  weightSource: "measured",
};

describe("toWorkoutRow (spec §6)", () => {
  it("plan session → gym / weight_training row with local date/time and checklist note", () => {
    let s = start(plan, T0, "11111111-1111-4111-8111-111111111111");
    s = toggleChecked(toggleChecked(s, "a"), "b");
    const row = toWorkoutRow({ session: s, durationMin: 60, totalExercises: 7 });
    expect(row).toEqual({
      workout_on: "2026-10-12",
      start_time: "18:05",
      category: "gym",
      activity: "weight_training",
      title: "Ngực, vai và tay sau",
      met: 3.5,
      duration_min: 60,
      kcal: 257,
      status: "done",
      notes: "2/7 bài · Gym app",
      source: "gym",
      client_ref: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("uses the local date even late at night", () => {
    const late = new Date(2026, 9, 12, 23, 59).getTime();
    const row = toWorkoutRow({ session: start(plan, late), durationMin: 30, totalExercises: 7 });
    expect(row.workout_on).toBe("2026-10-12");
    expect(row.start_time).toBe("23:59");
  });

  it("activity session → Fitora buildTitle, chosen variant MET", () => {
    const s = start({ ...plan, kind: "activity", dayId: null, activity: "badminton", category: "team_sport", variant: "social", met: 5.5, title: "Cầu lông · Giao lưu" }, T0);
    const row = toWorkoutRow({ session: s, durationMin: 60, variant: "competitive" });
    expect(row).toMatchObject({ category: "team_sport", activity: "badminton", title: "Cầu lông · Thi đấu", met: 7, kcal: 515, notes: "Gym app" });
  });

  it("speed-based activity with km → joinDistanceNote; km ignored for others", () => {
    const run = start({ ...plan, kind: "activity", dayId: null, activity: "running", category: "running", variant: "8kmh", met: 8.3, title: "" }, T0);
    expect(toWorkoutRow({ session: run, durationMin: 40, km: 5.24 }).notes).toBe("Quãng đường 5,2 km\nGym app");
    const bad = start({ ...plan, kind: "activity", dayId: null, activity: "badminton", category: "team_sport", variant: "social", met: 5.5, title: "" }, T0);
    expect(toWorkoutRow({ session: bad, durationMin: 40, km: 5 }).notes).toBe("Gym app");
  });

  it("truncates the title to 80 chars and clamps minutes to 1–300", () => {
    const s = start({ ...plan, title: "x".repeat(200) }, T0);
    const row = toWorkoutRow({ session: s, durationMin: 999, totalExercises: 7 });
    expect(row.title).toHaveLength(80);
    expect(row.duration_min).toBe(300);
    expect(toWorkoutRow({ session: s, durationMin: 0 }).duration_min).toBe(1);
  });

  it("uses the confirmed weight", () => {
    const row = toWorkoutRow({ session: start(plan, T0), durationMin: 60, weightKg: 80, totalExercises: 7 });
    expect(row.kcal).toBe(294);
  });
});
