// Supabase WorkoutsAdapter (spec §6). Vyora's ONLY write path into the shared database:
// it inserts / deletes the user's own `fit_workouts` rows with source = 'gym'. Fitora then counts
// every status='done' row as burned kcal (fit_day_summary / fit_range_summary) — nothing else to sync.
//
// Offline-first: save() first puts the row in the outbox (localStorage `gym.outbox:<uid>`), then
// tries to send it. Sending is `INSERT … ON CONFLICT (user_id, client_ref) DO NOTHING`, so a retry
// after a lost response neither duplicates the session nor overwrites edits made later in Fitora.
// The outbox is flushed by list() (app open, sign-in, `online`) and by every save().
import type { SupabaseClient } from "@supabase/supabase-js";
import { ERROR_MESSAGES } from "@/src/lib/data/messages";
import type { WorkoutsAdapter } from "@/src/lib/data/types";
import { enqueue, flush, outboxKey, removeItem, type OutboxItem, type UpsertOutcome } from "@/src/lib/outbox";
import { readJson, writeJson } from "@/src/lib/storage";
import type { AuthUser, FitWorkoutRow, GymWorkout, Result } from "@/src/types/gym";
import { classifyDbError, DB_MESSAGES } from "./errors-db";

export const WORKOUT_COLS = "id, workout_on, start_time, category, activity, title, met, duration_min, kcal, status, notes, source, client_ref, created_at";
export const workoutsCacheKey = (userId: string) => `gym.workouts:${userId}`;

interface DbWorkout {
  id: string;
  workout_on: string;
  start_time: string | null;
  category: FitWorkoutRow["category"];
  activity: string;
  title: string;
  met: number | string;
  duration_min: number;
  kcal: number | string;
  status: string;
  notes: string | null;
  source: string;
  client_ref: string | null;
  created_at: string;
}

/** DB row → GymWorkout ('18:30:00' → '18:30', numeric strings → numbers). */
export function fromDb(r: DbWorkout): GymWorkout {
  return {
    id: r.id,
    workout_on: r.workout_on,
    start_time: (r.start_time ?? "").slice(0, 5),
    category: r.category,
    activity: r.activity,
    title: r.title,
    met: Number(r.met),
    duration_min: r.duration_min,
    kcal: Math.round(Number(r.kcal) || 0),
    status: "done",
    notes: r.notes ?? "",
    source: "gym",
    client_ref: r.client_ref ?? r.id,
    created_at: r.created_at,
    sync: "saved",
  };
}

function fromOutbox(item: OutboxItem): GymWorkout {
  return {
    ...item.row,
    id: item.row.client_ref,
    created_at: item.queuedAt,
    sync: item.status,
    ...(item.error ? { error: item.error } : {}),
  };
}

/** Server rows + outbox items not on the server yet; the server copy wins (it may have been edited in Fitora). */
export function mergeWithOutbox(server: GymWorkout[], outbox: OutboxItem[], since: string): GymWorkout[] {
  const onServer = new Set(server.map((w) => w.client_ref));
  const local = outbox.filter((i) => !onServer.has(i.row.client_ref) && i.row.workout_on >= since).map(fromOutbox);
  return [...server, ...local].sort(
    (a, b) => b.workout_on.localeCompare(a.workout_on) || (b.start_time ?? "").localeCompare(a.start_time ?? "") || b.created_at.localeCompare(a.created_at),
  );
}

export interface WorkoutsAdapterOptions {
  now?: () => Date;
}

export function createSupabaseWorkoutsAdapter(client: SupabaseClient | null, opts: WorkoutsAdapterOptions = {}): WorkoutsAdapter {
  const now = opts.now ?? (() => new Date());
  const readOutbox = (u: AuthUser) => readJson<OutboxItem[]>(outboxKey(u.id)) ?? [];
  const writeOutbox = (u: AuthUser, items: OutboxItem[]) => writeJson(outboxKey(u.id), items.length ? items : null);
  /** Serialises flushes per user so two triggers (online + save) never send the same row twice at once. */
  const running = new Map<string, Promise<void>>();

  async function send(row: FitWorkoutRow): Promise<UpsertOutcome> {
    if (!client) return { ok: false, kind: "network", message: ERROR_MESSAGES.not_configured };
    try {
      const { error, status } = await client.from("fit_workouts").upsert(row, { onConflict: "user_id,client_ref", ignoreDuplicates: true });
      if (!error) return { ok: true };
      const kind = classifyDbError(error, status);
      return { ok: false, kind: kind === "unknown" ? "network" : kind, message: DB_MESSAGES[kind] };
    } catch (e) {
      const kind = classifyDbError(e);
      return { ok: false, kind: kind === "unknown" ? "network" : kind, message: DB_MESSAGES[kind] };
    }
  }

  function flushOutbox(user: AuthUser): Promise<void> {
    const prev = running.get(user.id) ?? Promise.resolve();
    const next = prev.then(async () => {
      const items = readOutbox(user);
      if (!items.some((i) => i.status === "pending")) return;
      const rest = await flush(items, send);
      // Rows queued while we were sending are kept (re-read, keep everything not just sent).
      const sent = new Set(items.filter((i) => !rest.some((r) => r.row.client_ref === i.row.client_ref)).map((i) => i.row.client_ref));
      const latest = readOutbox(user).filter((i) => !sent.has(i.row.client_ref));
      const updated = latest.map((i) => rest.find((r) => r.row.client_ref === i.row.client_ref && r.queuedAt === i.queuedAt) ?? i);
      writeOutbox(user, updated);
    });
    const guarded = next.catch(() => undefined);
    running.set(user.id, guarded);
    return guarded;
  }

  async function fetchOne(clientRef: string): Promise<GymWorkout | null> {
    if (!client) return null;
    try {
      const { data, error } = await client.from("fit_workouts").select(WORKOUT_COLS).eq("client_ref", clientRef).maybeSingle();
      return error || !data ? null : fromDb(data as DbWorkout);
    } catch {
      return null;
    }
  }

  return {
    async list(user, since) {
      await flushOutbox(user);
      const outbox = readOutbox(user);
      const cacheKey = workoutsCacheKey(user.id);
      let server: GymWorkout[] | null = null;
      if (client) {
        try {
          const { data, error } = await client
            .from("fit_workouts")
            .select(WORKOUT_COLS)
            .eq("source", "gym")
            .eq("status", "done")
            .gte("workout_on", since)
            .order("workout_on", { ascending: false })
            .order("start_time", { ascending: false, nullsFirst: false })
            .limit(500);
          if (!error && data) {
            server = (data as DbWorkout[]).map(fromDb);
            writeJson(cacheKey, server);
          }
        } catch {
          /* offline → cached list below */
        }
      }
      const base = server ?? (readJson<GymWorkout[]>(cacheKey) ?? []).filter((w) => w.workout_on >= since);
      return mergeWithOutbox(base, outbox, since);
    },

    async save(user, row) {
      writeOutbox(user, enqueue(readOutbox(user), row, now()));
      await flushOutbox(user);
      const item = readOutbox(user).find((i) => i.row.client_ref === row.client_ref);
      if (item) return fromOutbox(item);
      const saved = (await fetchOne(row.client_ref)) ?? { ...row, id: row.client_ref, created_at: now().toISOString(), sync: "saved" as const };
      const cached = readJson<GymWorkout[]>(workoutsCacheKey(user.id)) ?? [];
      writeJson(workoutsCacheKey(user.id), [saved, ...cached.filter((w) => w.client_ref !== saved.client_ref)]);
      return saved;
    },

    async remove(user, clientRef): Promise<Result> {
      const item = readOutbox(user).find((i) => i.row.client_ref === clientRef);
      // A rejected row never reached the server: dropping it locally is enough.
      if (item?.status === "failed") {
        writeOutbox(user, removeItem(readOutbox(user), clientRef));
        return { ok: true, data: undefined };
      }
      if (!client) return { ok: false, code: "not_configured", message: ERROR_MESSAGES.not_configured };
      // Pending rows may already be on the server (lost response) → always delete server-side too.
      try {
        const { error, status } = await client.from("fit_workouts").delete().eq("client_ref", clientRef).eq("source", "gym");
        if (error) {
          const kind = classifyDbError(error, status);
          return { ok: false, code: kind === "network" ? "network" : "unknown", message: kind === "network" ? ERROR_MESSAGES.network : "Không xoá được buổi tập." };
        }
      } catch {
        return { ok: false, code: "network", message: ERROR_MESSAGES.network };
      }
      writeOutbox(user, removeItem(readOutbox(user), clientRef));
      const cached = readJson<GymWorkout[]>(workoutsCacheKey(user.id)) ?? [];
      writeJson(workoutsCacheKey(user.id), cached.filter((w) => w.client_ref !== clientRef));
      return { ok: true, data: undefined };
    },

    async pendingCount(user) {
      return readOutbox(user).length;
    },
  };
}
