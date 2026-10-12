"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFitoraProfile } from "@/src/hooks/use-fitora-profile";
import { useNow } from "@/src/hooks/use-now";
import { useWeekSessions } from "@/src/hooks/use-week-sessions";
import { PLAN_ACTIVITY_KEY, liveKcal, planVariant } from "@/src/lib/calories";
import { workoutPlan } from "@/src/data/workout-plan";
import { buildTitle, defaultVariant, findActivity, type ActivityDef, type ActivityVariant } from "@/src/lib/fitora";
import * as S from "@/src/lib/session";
import { readStorage, writeStorage } from "@/src/lib/storage";
import { toWorkoutRow, type FinishInput } from "@/src/lib/workout-row";
import type { ActiveSession, GymWorkout, StartSessionInput } from "@/src/types/gym";
import type { WorkoutDay } from "@/src/types/workout";

/** Everything FinishSheet confirms (the session itself is implied). */
export type CompleteInput = Omit<FinishInput, "session" | "totalExercises">;

interface SessionStore {
  session: ActiveSession | null;
  /** Starts a session; when one is already active it is returned unchanged (one session at a time). */
  start(input: StartSessionInput): ActiveSession;
  pause(): void;
  resume(): void;
  toggleChecked(exerciseId: string): void;
  /** Changes the intensity of the running session (MET + title follow). */
  setVariant(variantId: string): void;
  /** Saves the session (fit_workouts row via useWeekSessions().save) and clears it. */
  complete(input: CompleteInput): Promise<GymWorkout>;
  /** Drops the session without saving ("Huỷ buổi tập"). */
  discard(): void;
}

const SessionContext = createContext<SessionStore | null>(null);

function persist(s: ActiveSession | null) {
  writeStorage(S.ACTIVE_SESSION_KEY, s ? S.serializeSession(s) : null);
}

export function findPlanDay(dayId: string | null | undefined): WorkoutDay | null {
  return workoutPlan.find((d) => d.id === dayId) ?? null;
}

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const { weight } = useFitoraProfile();
  const week = useWeekSessions();
  const [session, setSession] = useState<ActiveSession | null>(null);

  // Restore after mount (never during SSR/static export) and follow other tabs.
  useEffect(() => {
    const timer = window.setTimeout(() => setSession(S.parseSession(readStorage(S.ACTIVE_SESSION_KEY))), 0);
    const onStorage = (e: StorageEvent) => {
      if (e.key === S.ACTIVE_SESSION_KEY) setSession(S.parseSession(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = useCallback((fn: (s: ActiveSession) => ActiveSession | null) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const start = useCallback(
    (input: StartSessionInput): ActiveSession => {
      const current = S.parseSession(readStorage(S.ACTIVE_SESSION_KEY));
      if (current) {
        setSession(current);
        return current;
      }
      let params: S.StartParams;
      if (input.kind === "plan") {
        const day = findPlanDay(input.dayId);
        const v = planVariant(input.variant === "vigorous" || input.variant === "moderate" ? input.variant : day ?? "moderate");
        params = {
          kind: "plan",
          dayId: day?.id ?? input.dayId,
          activity: PLAN_ACTIVITY_KEY,
          category: "gym",
          variant: v.id,
          met: v.met,
          title: day?.title ?? "Buổi tập theo giáo án",
          weightKg: weight.kg,
          weightSource: weight.source,
        };
      } else {
        const a = findActivity(input.activity);
        if (!a) throw new Error(`Unknown activity ${input.activity}`);
        const v = a.variants.find((x) => x.id === input.variant) ?? defaultVariant(a);
        params = {
          kind: "activity",
          dayId: null,
          activity: a.key,
          category: a.category,
          variant: v.id,
          met: v.met,
          title: buildTitle(a, v),
          weightKg: weight.kg,
          weightSource: weight.source,
        };
      }
      const s = S.start(params, Date.now());
      persist(s);
      setSession(s);
      return s;
    },
    [weight],
  );

  const pause = useCallback(() => update((s) => S.pause(s, Date.now())), [update]);
  const resume = useCallback(() => update((s) => S.resume(s, Date.now())), [update]);
  const toggleChecked = useCallback((id: string) => update((s) => S.toggleChecked(s, id)), [update]);
  const setVariant = useCallback(
    (variantId: string) =>
      update((s) => {
        const a = findActivity(s.activity);
        const v = a?.variants.find((x) => x.id === variantId);
        if (!a || !v) return s;
        return { ...s, variant: v.id, met: v.met, title: s.kind === "plan" ? s.title : buildTitle(a, v) };
      }),
    [update],
  );

  const discard = useCallback(() => {
    persist(null);
    setSession(null);
  }, []);

  const complete = useCallback(
    async (input: CompleteInput) => {
      const s = S.parseSession(readStorage(S.ACTIVE_SESSION_KEY)) ?? session;
      if (!s) throw new Error("No active session");
      const day = findPlanDay(s.dayId);
      const row = toWorkoutRow({ ...input, session: s, totalExercises: day?.exercises.length });
      // Spec §6: the session is cleared as soon as the row is queued; the save never throws.
      persist(null);
      setSession(null);
      return week.save(row);
    },
    [session, week],
  );

  const value = useMemo<SessionStore>(
    () => ({ session, start, pause, resume, toggleChecked, setVariant, complete, discard }),
    [session, start, pause, resume, toggleChecked, setVariant, complete, discard],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export interface ActiveSessionApi extends SessionStore {
  /** Session is running (not paused). */
  running: boolean;
  paused: boolean;
  /** Elapsed ms, re-rendered every second while running. */
  elapsedMs: number;
  /** Live kcal estimate for elapsedMs. */
  kcal: number;
  activity: ActivityDef | null;
  variant: ActivityVariant | null;
  /** Plan day of a plan session, else null. */
  day: WorkoutDay | null;
  /** finish() of the session at the current tick (minutes, forgotten > 4 h, canSave), null without session. */
  finishSummary: S.FinishSummary | null;
}

/** The single active session + live clock. Every caller ticks on its own (cheap). */
export function useActiveSession(): ActiveSessionApi {
  const store = useContext(SessionContext);
  if (!store) throw new Error("useActiveSession must be used inside <AppProviders>");
  const { session } = store;
  const running = !!session && !session.pausedAt;
  const now = useNow(running);
  const nowMs = session ? Math.max(now, Date.parse(session.startedAt)) : now;
  const elapsedMs = session ? S.elapsedMs(session, nowMs) : 0;
  const activity = session ? findActivity(session.activity) ?? null : null;
  const variant = activity?.variants.find((v) => v.id === session?.variant) ?? null;
  return {
    ...store,
    running,
    paused: !!session?.pausedAt,
    elapsedMs,
    kcal: session ? liveKcal(session.met, session.weightKg, elapsedMs) : 0,
    activity,
    variant,
    day: findPlanDay(session?.dayId),
    finishSummary: session ? S.finish(session, nowMs) : null,
  };
}
