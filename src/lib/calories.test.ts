import { describe, expect, it } from "vitest";
import { workoutPlan } from "@/src/data/workout-plan";
import { estimateCaption, kcalPerHour, liveKcal, metKcal, metLine, planActivity, planVariant, sessionKcal, variantOf } from "@/src/lib/calories";
import { findActivity } from "@/src/lib/fitora";

describe("calories (spec §4)", () => {
  it("plan days use weight_training Vừa 3.5 / Nặng 6.0", () => {
    expect(planVariant("moderate")).toMatchObject({ id: "moderate", label: "Vừa", met: 3.5 });
    expect(planVariant("vigorous")).toMatchObject({ id: "vigorous", label: "Nặng", met: 6.0 });
  });

  it("every plan day's defaultVariant exists in Fitora's weight_training", () => {
    const ids = planActivity().variants.map((v) => v.id);
    for (const day of workoutPlan) expect(ids).toContain(day.defaultVariant);
    const byId = Object.fromEntries(workoutPlan.map((d) => [d.id, d.defaultVariant]));
    expect(byId).toMatchObject({ monday: "moderate", tuesday: "vigorous", wednesday: "moderate", thursday: "vigorous", friday: "moderate" });
  });

  // The spec example said 245 / 420 (MET × kg × h). Fitora's real metKcal is MET · 3.5 · kg / 200 · min
  // (1.05 × that), and the gym app must store exactly what Fitora computes, so 70 kg · 60 min gives:
  it("70 kg · 60 min → Vừa 257, Nặng 441 (same as Fitora metKcal)", () => {
    expect(sessionKcal(planVariant("moderate").met, 70, 60)).toBe(257);
    expect(sessionKcal(planVariant("vigorous").met, 70, 60)).toBe(441);
    expect(sessionKcal(3.5, 70, 60)).toBe(metKcal(3.5, 70, 60));
  });

  it("badminton competitive · 60 min uses the catalogue MET", () => {
    const v = variantOf("badminton", "competitive")!;
    expect(v.met).toBe(7.0);
    expect(sessionKcal(v.met, 70, 60)).toBe(metKcal(7, 70, 60));
    expect(sessionKcal(v.met, 70, 60)).toBe(515);
  });

  it("weight bounds 25 and 300 kg compute; zero/negative input gives 0", () => {
    expect(sessionKcal(3.5, 25, 60)).toBe(92);
    expect(sessionKcal(3.5, 300, 60)).toBe(1103);
    expect(sessionKcal(3.5, 70, 0)).toBe(0);
    expect(sessionKcal(0, 70, 60)).toBe(0);
  });

  it("live kcal grows with elapsed ms", () => {
    expect(liveKcal(3.5, 70, 0)).toBe(0);
    expect(liveKcal(3.5, 70, 30 * 60000)).toBe(metKcal(3.5, 70, 30));
    expect(liveKcal(3.5, 70, 60 * 60000)).toBe(257);
  });

  it("labels use Vietnamese number formatting", () => {
    expect(kcalPerHour(7, 70)).toBe(515);
    expect(metLine(7, 70)).toBe("≈ 7,0 MET · ~515 kcal/giờ với 70 kg");
    expect(estimateCaption(70, "Vừa")).toBe("ước lượng · 70 kg · Vừa");
  });

  it("variantOf falls back to the default variant, undefined for unknown keys", () => {
    expect(variantOf("football")?.id).toBe(findActivity("football")!.variants[0].id);
    expect(variantOf("not_an_activity")).toBeUndefined();
  });
});
