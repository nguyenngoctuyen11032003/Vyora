// Test helpers for the session / finish tests (not imported by the app).
import { ACTIVE_SESSION_KEY } from "@/src/lib/session";
import type { ActiveSession } from "@/src/types/gym";

/** Stores an active session that started `minutesAgo` minutes ago (restored by the provider on mount). */
export function storeSession(minutesAgo: number, overrides: Partial<ActiveSession> = {}): ActiveSession {
  const s: ActiveSession = {
    id: "11111111-2222-4333-8444-555555555555",
    kind: "plan",
    dayId: "monday",
    activity: "weight_training",
    category: "gym",
    variant: "moderate",
    met: 3.5,
    title: "Ngực, vai và tay sau",
    weightKg: 70,
    weightSource: "measured",
    startedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    pausedAt: null,
    pausedMs: 0,
    checked: [],
    ...overrides,
  };
  localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(s));
  return s;
}

/** A running session of a non-plan activity (badminton competitive, or running 8 km/h). */
export function storeActivity(minutesAgo: number, key: "badminton" | "running" = "badminton"): ActiveSession {
  return key === "badminton"
    ? storeSession(minutesAgo, { kind: "activity", dayId: null, activity: "badminton", category: "team_sport", variant: "competitive", met: 7, title: "Cầu lông · Thi đấu" })
    : storeSession(minutesAgo, { kind: "activity", dayId: null, activity: "running", category: "running", variant: "8kmh", met: 8.3, title: "Chạy bộ · 8 km/h" });
}
