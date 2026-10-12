// Tiny in-memory stand-in for the parts of supabase-js the adapters use (tests only).
// Supports from(table).select/eq/gte/lte/not/order/limit/maybeSingle, upsert(…, ignoreDuplicates), delete.
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;
type Filter = (r: Row) => boolean;
export type Fault = { error: { code?: string; message: string }; status?: number } | "throw";

export interface FakeDb {
  client: SupabaseClient;
  tables: Record<string, Row[]>;
  /** Next call on `table` (any op) fails with this fault; cleared after use unless sticky. */
  fail(table: string, fault: Fault, sticky?: boolean): void;
  heal(table: string): void;
  calls: Array<{ table: string; op: string; payload?: unknown; options?: unknown }>;
  userId: string;
}

export function createFakeDb(userId = "u-1", seed: Record<string, Row[]> = {}): FakeDb {
  const tables: Record<string, Row[]> = { fit_workouts: [], profiles: [], fit_profiles: [], fit_body_measurements: [], ...seed };
  const faults = new Map<string, { fault: Fault; sticky: boolean }>();
  const calls: FakeDb["calls"] = [];
  let seq = 0;

  function takeFault(table: string): Fault | null {
    const f = faults.get(table);
    if (!f) return null;
    if (!f.sticky) faults.delete(table);
    return f.fault;
  }

  function builder(table: string) {
    const filters: Filter[] = [];
    let op: "select" | "upsert" | "delete" = "select";
    let payload: Row | null = null;
    let options: { ignoreDuplicates?: boolean } = {};
    let single = false;
    let limit = Infinity;
    const orders: Array<{ col: string; asc: boolean }> = [];

    const own = (r: Row) => (table === "profiles" ? r.id === userId : r.user_id === userId); // RLS

    function run() {
      calls.push({ table, op, payload: payload ?? undefined, options });
      const fault = takeFault(table);
      if (fault === "throw") return Promise.reject(new TypeError("Failed to fetch"));
      if (fault) return Promise.resolve({ data: null, error: fault.error, status: fault.status ?? 400 });
      const rows = (tables[table] ??= []);
      if (op === "upsert" && payload) {
        const row: Row = { user_id: userId, ...(payload as Row) };
        const dup = rows.find((r) => r.user_id === row.user_id && r.client_ref === row.client_ref);
        if (!dup) rows.push({ id: `srv-${++seq}`, created_at: new Date(2026, 9, 12, 10, seq).toISOString(), ...row, start_time: `${row.start_time}:00` });
        else if (!options.ignoreDuplicates) Object.assign(dup, row);
        return Promise.resolve({ data: null, error: null, status: 201 });
      }
      if (op === "delete") {
        const keep = rows.filter((r) => !(own(r) && filters.every((f) => f(r))));
        tables[table] = keep;
        return Promise.resolve({ data: null, error: null, status: 204 });
      }
      let out = rows.filter((r) => own(r) && filters.every((f) => f(r)));
      for (const o of [...orders].reverse()) {
        out = [...out].sort((a, b) => String(a[o.col] ?? "").localeCompare(String(b[o.col] ?? "")) * (o.asc ? 1 : -1));
      }
      out = out.slice(0, limit);
      return Promise.resolve({ data: single ? (out[0] ?? null) : out, error: null, status: 200 });
    }

    const b = {
      select() {
        return b;
      },
      eq(col: string, v: unknown) {
        filters.push((r) => r[col] === v);
        return b;
      },
      gte(col: string, v: string) {
        filters.push((r) => String(r[col]) >= v);
        return b;
      },
      lte(col: string, v: string) {
        filters.push((r) => String(r[col]) <= v);
        return b;
      },
      not(col: string) {
        filters.push((r) => r[col] !== null && r[col] !== undefined);
        return b;
      },
      order(col: string, o?: { ascending?: boolean }) {
        orders.push({ col, asc: o?.ascending !== false });
        return b;
      },
      limit(n: number) {
        limit = n;
        return b;
      },
      maybeSingle() {
        single = true;
        return run();
      },
      upsert(row: Row, o: { ignoreDuplicates?: boolean }) {
        op = "upsert";
        payload = row;
        options = o;
        return run();
      },
      delete() {
        op = "delete";
        return b;
      },
      then<T>(res: (v: unknown) => T, rej?: (e: unknown) => T) {
        return run().then(res, rej);
      },
    };
    return b;
  }

  return {
    client: { from: (t: string) => builder(t) } as unknown as SupabaseClient,
    tables,
    calls,
    userId,
    fail(table, fault, sticky = false) {
      faults.set(table, { fault, sticky });
    },
    heal(table) {
      faults.delete(table);
    },
  };
}
