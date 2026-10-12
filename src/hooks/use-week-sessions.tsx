"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/src/hooks/use-auth";
import { useDataSource } from "@/src/hooks/use-data-source";
import { PLAN_ACTIVITY_KEY } from "@/src/lib/calories";
import { addDaysIso, toLocalDate, weekDates, weekStartIso } from "@/src/lib/format";
import type { FitWorkoutRow, GymWorkout, Result } from "@/src/types/gym";

/** How far back "Tuần này" and "Gần đây" read (spec §6: 8 weeks). */
export const HISTORY_WEEKS = 8;
export const RECENT_LIMIT = 20;
export const RECENT_ACTIVITY_LIMIT = 6;

export interface WeekSummary {
  /** Monday → Sunday of the current week ('YYYY-MM-DD'). */
  dates: string[];
  /** Number of sessions per date of the current week (0 when none). */
  countByDate: Record<string, number>;
  sessions: number;
  minutes: number;
  kcal: number;
}

export interface WeekSessionsApi {
  status: "idle" | "loading" | "ready";
  /** Every loaded gym session (8 weeks), newest first. */
  all: GymWorkout[];
  /** Newest 20 sessions for the "Gần đây" list. */
  recent: GymWorkout[];
  week: WeekSummary;
  /** Up to 6 distinct non-plan activity keys logged most recently (ActivitySheet "Gần đây"). */
  recentActivityKeys: string[];
  /** Rows not yet sent (logout must confirm when > 0). */
  pendingCount: number;
  save(row: FitWorkoutRow): Promise<GymWorkout>;
  remove(clientRef: string): Promise<Result>;
  reload(): Promise<void>;
}

const WeekContext = createContext<WeekSessionsApi | null>(null);

export function summarizeWeek(all: GymWorkout[], today: Date = new Date()): WeekSummary {
  const dates = weekDates(today);
  const countByDate: Record<string, number> = Object.fromEntries(dates.map((d) => [d, 0]));
  let sessions = 0;
  let minutes = 0;
  let kcal = 0;
  for (const w of all) {
    if (!(w.workout_on in countByDate)) continue;
    countByDate[w.workout_on] += 1;
    sessions += 1;
    minutes += w.duration_min;
    kcal += w.kcal;
  }
  return { dates, countByDate, sessions, minutes, kcal };
}

export function recentActivityKeysOf(all: GymWorkout[], limit = RECENT_ACTIVITY_LIMIT): string[] {
  const out: string[] = [];
  for (const w of all) {
    if (w.activity === PLAN_ACTIVITY_KEY || out.includes(w.activity)) continue;
    out.push(w.activity);
    if (out.length >= limit) break;
  }
  return out;
}

const newestFirst = (a: GymWorkout, b: GymWorkout) =>
  b.workout_on.localeCompare(a.workout_on) || (b.start_time ?? "").localeCompare(a.start_time ?? "") || b.created_at.localeCompare(a.created_at);

export function WeekSessionsProvider({ children }: { children: ReactNode }) {
  const data = useDataSource();
  const { user } = useAuth();
  const [all, setAll] = useState<GymWorkout[]>([]);
  const [status, setStatus] = useState<WeekSessionsApi["status"]>("idle");

  const reload = useCallback(async () => {
    if (!user) return;
    setStatus("loading");
    const since = addDaysIso(weekStartIso(toLocalDate(new Date())), -7 * (HISTORY_WEEKS - 1));
    const list = await data.workouts.list(user, since);
    setAll([...list].sort(newestFirst));
    setStatus("ready");
  }, [data, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!user) {
        setAll([]);
        setStatus("idle");
        return;
      }
      void reload();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user, reload]);

  // Back online → list() flushes the outbox (sessions saved offline) and refreshes from the server.
  useEffect(() => {
    if (!user) return;
    const onOnline = () => void reload();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [user, reload]);

  const save = useCallback(
    async (row: FitWorkoutRow) => {
      if (!user) throw new Error("Not signed in");
      const saved = await data.workouts.save(user, row);
      setAll((prev) => [saved, ...prev.filter((w) => w.client_ref !== saved.client_ref)].sort(newestFirst));
      return saved;
    },
    [data, user],
  );

  const remove = useCallback(
    async (clientRef: string): Promise<Result> => {
      if (!user) return { ok: false, code: "unknown", message: "Chưa đăng nhập" };
      const res = await data.workouts.remove(user, clientRef);
      if (res.ok) setAll((prev) => prev.filter((w) => w.client_ref !== clientRef));
      return res;
    },
    [data, user],
  );

  const value = useMemo<WeekSessionsApi>(() => {
    return {
      status,
      all,
      recent: all.slice(0, RECENT_LIMIT),
      week: summarizeWeek(all),
      recentActivityKeys: recentActivityKeysOf(all),
      pendingCount: all.filter((w) => w.sync !== "saved").length,
      save,
      remove,
      reload,
    };
  }, [status, all, save, remove, reload]);

  return <WeekContext.Provider value={value}>{children}</WeekContext.Provider>;
}

export function useWeekSessions(): WeekSessionsApi {
  const ctx = useContext(WeekContext);
  if (!ctx) throw new Error("useWeekSessions must be used inside <AppProviders>");
  return ctx;
}
