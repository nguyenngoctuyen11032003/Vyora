// Password-recovery link parsing (spec §3.3 "Quên mật khẩu").
import type { RecoveryParams } from "@/src/types/gym";

/** Reads `?flow=recovery&token_hash=…&type=recovery` (or a legacy PKCE `?code=`); null when absent. */
export function readRecoveryParams(search: string): RecoveryParams | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const tokenHash = q.get("token_hash");
  const code = q.get("code");
  const type = q.get("type");
  if (q.get("flow") !== "recovery" && type !== "recovery" && !tokenHash && !code) return null;
  return { tokenHash, code, type };
}

/** Removes the recovery params from the address bar (history.replaceState, no reload). */
export function clearRecoveryParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const k of ["flow", "token_hash", "type", "code"]) url.searchParams.delete(k);
  window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
}
