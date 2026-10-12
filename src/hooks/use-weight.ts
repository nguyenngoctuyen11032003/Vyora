"use client";

import { useFitoraProfile } from "@/src/hooks/use-fitora-profile";
import type { WeightInfo } from "@/src/types/gym";

/** Weight for kcal maths + setter for the manual fallback. Thin view over useFitoraProfile(). */
export function useWeight(): { weight: WeightInfo; setManualWeight: (kg: number) => void } {
  const { weight, setManualWeight } = useFitoraProfile();
  return { weight, setManualWeight };
}
