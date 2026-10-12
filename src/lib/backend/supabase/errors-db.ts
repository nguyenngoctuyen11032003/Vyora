// PostgREST / fetch errors of table reads & writes → what the app should do with them.
//   network  offline, timeout, 5xx, expired JWT — retry later (outbox keeps the row pending)
//   schema   backend not migrated yet (column/table/constraint missing) — retry after the deploy
//   invalid  the row itself is rejected (check / not-null / type) — retrying cannot help
//   unknown  anything else — treated like network by the outbox (never drops data)

export type DbErrorKind = "network" | "schema" | "invalid" | "unknown";

interface RawDbError {
  code?: string;
  message?: string;
  details?: string | null;
  status?: number;
  name?: string;
}

const NETWORK_RE = /failed to fetch|networkerror|network request failed|load failed|fetch failed|timed? ?out|aborted|err_internet_disconnected|err_network/i;

export function classifyDbError(err: unknown, status?: number): DbErrorKind {
  const e = (err ?? {}) as RawDbError;
  const code = e.code ?? "";
  const text = `${e.message ?? ""} ${e.details ?? ""}`;
  const st = status ?? e.status;
  if (NETWORK_RE.test(text) || st === 0 || (typeof st === "number" && st >= 500)) return "network";
  // PGRST301/302/303: JWT expired or invalid → token refresh, then retry.
  if (/^PGRST30\d$/.test(code) || /jwt/i.test(text)) return "network";
  // PGRST204 column not in schema cache · PGRST205 table missing · 42703 undefined column ·
  // 42P01 undefined table · 42P10 ON CONFLICT target has no matching unique constraint.
  if (code === "PGRST204" || code === "PGRST205" || code === "42703" || code === "42P01" || code === "42P10") return "schema";
  // Class 22 (data exception) and 23 (integrity constraint) — except 23505, which our
  // ignore-duplicates insert never raises for the client_ref key.
  if (/^2[23]/.test(code) && code !== "23505") return "invalid";
  return "unknown";
}

export const DB_MESSAGES: Record<DbErrorKind, string> = {
  network: "Không có kết nối mạng. Buổi tập đã lưu trên máy và sẽ tự gửi khi có mạng.",
  schema: "Máy chủ chưa được cập nhật để nhận buổi tập từ Vyora. Buổi tập vẫn lưu trên máy.",
  invalid: "Máy chủ từ chối dữ liệu buổi tập này. Hãy xoá và ghi lại.",
  unknown: "Chưa gửi được buổi tập. Vyora sẽ thử lại.",
};
