// Outbox (spec §6) — typed, pure helpers. The UI phase uses the mock adapter, which saves instantly;
// the Supabase adapter (backend phase) will persist this list in localStorage `gym.outbox:<user_id>`
// and call `flush` on app open, on `online` and after sign-in.
import type { FitWorkoutRow } from "@/src/types/gym";

export const outboxKey = (userId: string) => `gym.outbox:${userId}`;

export interface OutboxItem {
  row: FitWorkoutRow;
  status: "pending" | "failed";
  /** Vietnamese reason for a failed item. */
  error?: string;
  queuedAt: string;
}

export type UpsertOutcome = { ok: true } | { ok: false; kind: "network" | "invalid" | "schema"; message: string };

/** Adds or replaces (by client_ref) a row; a re-queued row is pending again. */
export function enqueue(items: OutboxItem[], row: FitWorkoutRow, now: Date = new Date()): OutboxItem[] {
  const rest = items.filter((i) => i.row.client_ref !== row.client_ref);
  return [...rest, { row, status: "pending", queuedAt: now.toISOString() }];
}

export function removeItem(items: OutboxItem[], clientRef: string): OutboxItem[] {
  return items.filter((i) => i.row.client_ref !== clientRef);
}

/**
 * Sends every item through `upsert` (idempotent on client_ref). Sent items are dropped, network/schema
 * errors stay pending, invalid-data errors are marked failed. Returns the remaining list.
 */
export async function flush(items: OutboxItem[], upsert: (row: FitWorkoutRow) => Promise<UpsertOutcome>): Promise<OutboxItem[]> {
  const out: OutboxItem[] = [];
  for (const item of items) {
    if (item.status === "failed") {
      out.push(item);
      continue;
    }
    const res = await upsert(item.row);
    if (res.ok) continue;
    out.push(res.kind === "invalid" ? { ...item, status: "failed", error: res.message } : { ...item, error: res.message });
  }
  return out;
}
