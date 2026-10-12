"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/src/hooks/use-auth";
import { useDataSource } from "@/src/hooks/use-data-source";
import { readJson, readStorage, writeJson, writeStorage } from "@/src/lib/storage";
import { MANUAL_WEIGHT_KEY, isValidWeight, resolveWeightInfo } from "@/src/lib/weight";
import type { FitoraProfile, WeightInfo } from "@/src/types/gym";

export const profileCacheKey = (userId: string) => `gym.fitoraProfile:${userId}`;

/** 'cached' = the fetch failed and a cached snapshot is shown ("dữ liệu lúc …"). */
export type ProfileStatus = "idle" | "loading" | "ready" | "cached" | "error";

export interface FitoraProfileApi {
  profile: FitoraProfile | null;
  status: ProfileStatus;
  /** Vietnamese error of the last failed fetch, if any. */
  error: string | null;
  reload(): Promise<void>;
  /** Weight used for kcal right now (see src/lib/weight.ts). */
  weight: WeightInfo;
  /** Saves the manual weight (only used when Fitora has none). Ignored outside 25–300 kg. */
  setManualWeight(kg: number): void;
}

const ProfileContext = createContext<FitoraProfileApi | null>(null);

function readManual(): number | null {
  const n = Number(readStorage(MANUAL_WEIGHT_KEY));
  return isValidWeight(n) ? n : null;
}

export function FitoraProfileProvider({ children }: { children: ReactNode }) {
  const data = useDataSource();
  const { user } = useAuth();
  const [profile, setProfile] = useState<FitoraProfile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [manualKg, setManualKg] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setStatus("loading");
    const res = await data.profile.load(user);
    if (res.ok) {
      setProfile(res.data);
      setStatus("ready");
      setError(null);
      writeJson(profileCacheKey(user.id), res.data);
    } else {
      const cached = readJson<FitoraProfile>(profileCacheKey(user.id));
      setProfile(cached);
      setStatus(cached ? "cached" : "error");
      setError(res.message);
    }
  }, [data, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setManualKg(readManual());
      if (!user) {
        setProfile(null);
        setStatus("idle");
        return;
      }
      setProfile(readJson<FitoraProfile>(profileCacheKey(user.id)));
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user, load]);

  const setManualWeight = useCallback((kg: number) => {
    if (!isValidWeight(kg)) return;
    writeStorage(MANUAL_WEIGHT_KEY, String(kg));
    setManualKg(kg);
  }, []);

  const weight = useMemo(() => resolveWeightInfo(profile, manualKg), [profile, manualKg]);

  const value = useMemo<FitoraProfileApi>(
    () => ({ profile, status, error, reload: load, weight, setManualWeight }),
    [profile, status, error, load, weight, setManualWeight],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useFitoraProfile(): FitoraProfileApi {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useFitoraProfile must be used inside <AppProviders>");
  return ctx;
}
