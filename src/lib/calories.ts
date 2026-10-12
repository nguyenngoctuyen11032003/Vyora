// Calorie maths (spec §4). Always goes through Fitora's own `metKcal` so both apps store the same kcal.
//
// NOTE: Fitora's metKcal is MET · 3.5 · kg / 200 · min (the ACSM formula), i.e. 1.05 kcal per MET·kg·h.
// The spec's worked example ("70 kg · 60 min → 245 / 420") assumed 1 kcal per MET·kg·h; with the real
// Fitora formula the same session is 257 (Vừa) / 441 (Nặng). The code follows Fitora (the spec's goal
// is that both apps always agree); see calories.test.ts.
import { defaultVariant, findActivity, formatKm, metKcal, type ActivityDef, type ActivityVariant } from "@/src/lib/fitora";
import { formatDecimal, formatInt, formatKg } from "@/src/lib/format";
import type { PlanVariant, WorkoutDay } from "@/src/types/workout";

export { metKcal };

/** Fitora activity used for every plan (giáo án) session. */
export const PLAN_ACTIVITY_KEY = "weight_training";
export const PLAN_CATEGORY = "gym" as const;

/** Short disclaimer shown next to every kcal figure. */
export const KCAL_DISCLAIMER = "Ước lượng, sai số khoảng ±20%, đã gồm năng lượng nghỉ.";

export function planActivity(): ActivityDef {
  const a = findActivity(PLAN_ACTIVITY_KEY);
  if (!a) throw new Error("weight_training missing from the Fitora catalogue");
  return a;
}

/** The weight_training variant ('moderate' 3.5 / 'vigorous' 6.0) of a plan day. */
export function planVariant(day: Pick<WorkoutDay, "defaultVariant"> | PlanVariant): ActivityVariant {
  const id = typeof day === "string" ? day : day.defaultVariant;
  const a = planActivity();
  return a.variants.find((v) => v.id === id) ?? defaultVariant(a);
}

/** Variant of `activityKey` by id, falling back to the catalogue default. Undefined for unknown keys. */
export function variantOf(activityKey: string, variantId?: string | null): ActivityVariant | undefined {
  const a = findActivity(activityKey);
  if (!a) return undefined;
  return a.variants.find((v) => v.id === variantId) ?? defaultVariant(a);
}

/** kcal for a whole number of minutes (what gets stored). */
export function sessionKcal(met: number, weightKg: number, minutes: number): number {
  return metKcal(met, weightKg, minutes);
}

/** Live kcal for an elapsed time in ms (fractional minutes, so it grows every few seconds). */
export function liveKcal(met: number, weightKg: number, elapsedMs: number): number {
  return metKcal(met, weightKg, elapsedMs / 60000);
}

export function kcalPerHour(met: number, weightKg: number): number {
  return metKcal(met, weightKg, 60);
}

/** "≈ 7,0 MET · ~490 kcal/giờ với 70 kg" (ActivitySheet line under the intensity chips). */
export function metLine(met: number, weightKg: number): string {
  return `≈ ${formatDecimal(met, 1)} MET · ~${formatInt(kcalPerHour(met, weightKg))} kcal/giờ với ${formatKg(weightKg)} kg`;
}

/** "≈ 257 kcal". */
export function kcalLabel(kcal: number): string {
  return `≈ ${formatInt(kcal)} kcal`;
}

/** "ước lượng · 70 kg · Vừa" (small label under the live kcal). */
export function estimateCaption(weightKg: number, variantLabel?: string): string {
  return ["ước lượng", `${formatKg(weightKg)} kg`, variantLabel].filter(Boolean).join(" · ");
}

export { formatKm };
