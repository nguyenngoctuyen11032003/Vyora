// LOCAL MOCK data source for the UI review phase (no network, everything in localStorage).
//
// Magic emails (any domain):
//   contains "sai"     → sign-in fails "Email hoặc mật khẩu không đúng"
//   contains "offline" → every call fails "Không có kết nối mạng"
//   contains "moi"     → signed-in user without a Fitora profile and without history
// Any other valid email + password ≥ 8 chars signs in. Recovery link: ?flow=recovery&token_hash=demo
// (token_hash=het-han or anything else → "Liên kết đã hết hạn").
import { buildTitle, findActivity, metKcal, MIN_PASSWORD } from "@/src/lib/fitora";
import { addDaysIso, toLocalDate, weekStartIso } from "@/src/lib/format";
import { readJson, writeJson } from "@/src/lib/storage";
import type { AuthUser, FitoraProfile, FitWorkoutRow, GymWorkout, RecoveryParams, Result } from "@/src/types/gym";
import { fail, normalizeEmail, ok } from "./messages";
import type { DataSource } from "./types";

export const MOCK_USER_KEY = "gym.mock.user";
export const mockWorkoutsKey = (userId: string) => `gym.mock.workouts:${userId}`;

export interface MockOptions {
  /** Simulated latency in ms (0 in tests). */
  latencyMs?: number;
  /** Clock used for seeds and the profile (tests pass a fixed date). */
  now?: () => Date;
}

const sleep = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const userFor = (email: string): AuthUser => ({ id: `mock-${hash(email)}`, email });
const isOffline = (email: string) => email.includes("offline");

/** "minh.anh@x.vn" → "Minh Anh". */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return (
    local
      .split(/[._\-+0-9]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || email
  );
}

/** ui-avatars style initials avatar as an SVG data URI (F1 red gradient). */
export function initialsAvatar(name: string): string {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "?";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B0000"/><stop offset="1" stop-color="#E10600"/></linearGradient></defs>` +
    `<rect width="160" height="160" fill="url(#g)"/>` +
    `<text x="80" y="80" dy=".35em" text-anchor="middle" font-family="Albert Sans, Arial, sans-serif" font-size="64" font-weight="600" fill="#fff">${initials}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createMockDataSource(options: MockOptions = {}): DataSource {
  const latency = options.latencyMs ?? 450;
  const now = options.now ?? (() => new Date());

  const readWorkouts = (user: AuthUser): GymWorkout[] | null => readJson<GymWorkout[]>(mockWorkoutsKey(user.id));
  const writeWorkouts = (user: AuthUser, list: GymWorkout[]) => writeJson(mockWorkoutsKey(user.id), list);

  function seedRow(dateIso: string, time: string, activityKey: string, variantId: string, minutes: number, title: string | null, notes: string, sync: GymWorkout["sync"]): GymWorkout {
    const a = findActivity(activityKey)!;
    const v = a.variants.find((x) => x.id === variantId) ?? a.variants[0];
    const ref = `seed-${dateIso}-${activityKey}`;
    return {
      id: ref,
      client_ref: ref,
      workout_on: dateIso,
      start_time: time,
      category: a.category,
      activity: a.key,
      title: title ?? buildTitle(a, v),
      met: v.met,
      duration_min: minutes,
      kcal: metKcal(v.met, 70, minutes),
      status: "done",
      notes,
      source: "gym",
      created_at: `${dateIso}T${time}:00`,
      sync,
    };
  }

  /** Demo history so "Tuần này" is reviewable: up to two sessions earlier this week + one last week. */
  function seed(): GymWorkout[] {
    const today = toLocalDate(now());
    const monday = weekStartIso(today);
    const rows: GymWorkout[] = [];
    if (monday < today) rows.push(seedRow(monday, "18:30", "weight_training", "moderate", 62, "Ngực, vai và tay sau", "6/7 bài · Gym app", "saved"));
    const wed = addDaysIso(monday, 2);
    if (wed < today) rows.push(seedRow(wed, "07:10", "badminton", "competitive", 45, null, "Gym app", "pending"));
    rows.push(seedRow(addDaysIso(monday, -4), "18:00", "weight_training", "vigorous", 70, "Deadlift và chân", "7/7 bài · Gym app", "saved"));
    return rows.sort((a, b) => b.workout_on.localeCompare(a.workout_on));
  }

  return {
    kind: "mock",

    auth: {
      async getUser() {
        await sleep(Math.min(latency, 300));
        return readJson<AuthUser>(MOCK_USER_KEY);
      },

      async signIn(email, password): Promise<Result<AuthUser>> {
        const e = normalizeEmail(email);
        if (!e) return fail("invalid_email");
        if (!password) return fail("missing_password");
        await sleep(latency);
        if (isOffline(e)) return fail("network");
        if (e.includes("sai") || password.length < MIN_PASSWORD) return fail("invalid_credentials");
        const user = userFor(e);
        writeJson(MOCK_USER_KEY, user);
        return ok(user);
      },

      async signOut() {
        await sleep(Math.min(latency, 200));
        writeJson(MOCK_USER_KEY, null);
      },

      async requestPasswordReset(email): Promise<Result> {
        const e = normalizeEmail(email);
        if (!e) return fail("invalid_email");
        await sleep(latency);
        if (isOffline(e)) return fail("network");
        return ok(undefined);
      },

      async verifyRecoveryLink(params: RecoveryParams): Promise<Result<AuthUser>> {
        await sleep(latency);
        const token = params.tokenHash ?? params.code;
        if (token !== "demo") return fail("expired_link");
        const user = readJson<AuthUser>(MOCK_USER_KEY) ?? userFor("ban.tap@example.com");
        return ok(user);
      },

      async updatePassword(password): Promise<Result> {
        if (!password || password.length < MIN_PASSWORD) return fail("weak_password");
        await sleep(latency);
        const user = readJson<AuthUser>(MOCK_USER_KEY) ?? userFor("ban.tap@example.com");
        writeJson(MOCK_USER_KEY, user);
        return ok(undefined);
      },
    },

    profile: {
      async load(user): Promise<Result<FitoraProfile>> {
        await sleep(latency);
        if (isOffline(user.email)) return fail("network");
        const today = now();
        const displayName = nameFromEmail(user.email);
        const base = {
          userId: user.id,
          email: user.email,
          displayName,
          avatarUrl: initialsAvatar(displayName),
          fetchedAt: today.toISOString(),
        };
        if (user.email.includes("moi")) {
          return ok({
            ...base,
            hasFitProfile: false,
            sex: null,
            birthDate: null,
            age: null,
            heightCm: null,
            activityLevel: null,
            goal: null,
            calorieTarget: null,
            targetWeightKg: null,
            startWeightKg: null,
            latestWeightKg: null,
            latestMeasuredOn: null,
          });
        }
        // 31 years old today, measured 2 days ago.
        const birth = new Date(today.getFullYear() - 31, 2, 14);
        if (birth > new Date(today.getFullYear() - 31, today.getMonth(), today.getDate())) birth.setFullYear(birth.getFullYear() - 1);
        return ok({
          ...base,
          hasFitProfile: true,
          sex: "male",
          birthDate: toLocalDate(birth),
          age: 31,
          heightCm: 172,
          activityLevel: "moderate",
          goal: "lose",
          calorieTarget: 1850,
          targetWeightKg: 66,
          startWeightKg: 74,
          latestWeightKg: 70,
          latestMeasuredOn: addDaysIso(toLocalDate(today), -2),
        });
      },
    },

    workouts: {
      async list(user, since) {
        await sleep(Math.min(latency, 300));
        let list = readWorkouts(user);
        if (!list) {
          list = user.email.includes("moi") ? [] : seed();
          writeWorkouts(user, list);
        }
        return list
          .filter((w) => w.workout_on >= since)
          .sort((a, b) => b.workout_on.localeCompare(a.workout_on) || b.created_at.localeCompare(a.created_at));
      },

      async save(user, row: FitWorkoutRow) {
        await sleep(latency);
        const list = readWorkouts(user) ?? [];
        const saved: GymWorkout = { ...row, id: row.client_ref, created_at: now().toISOString(), sync: "saved" };
        writeWorkouts(user, [saved, ...list.filter((w) => w.client_ref !== row.client_ref)]);
        return saved;
      },

      async remove(user, clientRef) {
        await sleep(Math.min(latency, 300));
        if (isOffline(user.email)) return fail("network");
        const list = readWorkouts(user) ?? [];
        writeWorkouts(user, list.filter((w) => w.client_ref !== clientRef));
        return ok(undefined);
      },

      async pendingCount(user) {
        return (readWorkouts(user) ?? []).filter((w) => w.sync !== "saved").length;
      },
    },
  };
}
