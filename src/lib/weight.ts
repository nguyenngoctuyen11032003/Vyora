// Weight used for kcal (spec §4): latest Fitora measurement → Fitora start weight → manual entry
// (localStorage `gym.weightKg`, never written to Fitora) → 65 kg fallback that must be confirmed.
import { FALLBACK_WEIGHT_KG, resolveWeight } from "@/src/lib/fitora";
import { formatDayMonth } from "@/src/lib/format";
import type { FitoraProfile, WeightInfo } from "@/src/types/gym";

export const MANUAL_WEIGHT_KEY = "gym.weightKg";
export const MIN_WEIGHT_KG = 25;
export const MAX_WEIGHT_KG = 300;

export function isValidWeight(kg: unknown): kg is number {
  return typeof kg === "number" && Number.isFinite(kg) && kg >= MIN_WEIGHT_KG && kg <= MAX_WEIGHT_KG;
}

export function resolveWeightInfo(profile: FitoraProfile | null, manualKg: number | null): WeightInfo {
  const r = resolveWeight(profile?.latestWeightKg, profile?.startWeightKg);
  if (r.source === "measured") {
    const on = profile?.latestMeasuredOn;
    return { kg: r.kg, source: "measured", label: on ? `Fitora · đo ${formatDayMonth(on)}` : "Fitora · lần đo gần nhất", needsConfirm: false };
  }
  if (r.source === "profile") return { kg: r.kg, source: "profile", label: "Fitora · hồ sơ", needsConfirm: false };
  if (isValidWeight(manualKg)) return { kg: manualKg, source: "manual", label: "nhập tay", needsConfirm: false };
  return { kg: FALLBACK_WEIGHT_KG, source: "fallback", label: "gợi ý, chưa xác nhận", needsConfirm: true };
}
