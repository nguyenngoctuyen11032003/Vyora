// Small helpers shared by the auth screens (UI only, no data access).
import { ERROR_MESSAGES, normalizeEmail } from "@/src/lib/data";
import { MIN_PASSWORD } from "@/src/lib/fitora";
import type { AuthErrorCode } from "@/src/types/gym";

const EMAIL_DRAFT_KEY = "vyora.auth.emailDraft";

/** The email typed on one auth screen pre-fills the next (login → forgot). Per tab, survives nothing else. */
export function readEmailDraft(): string {
  try {
    return typeof window === "undefined" ? "" : (window.sessionStorage.getItem(EMAIL_DRAFT_KEY) ?? "");
  } catch {
    return "";
  }
}

export function writeEmailDraft(email: string): void {
  try {
    if (typeof window === "undefined") return;
    if (email.trim()) window.sessionStorage.setItem(EMAIL_DRAFT_KEY, email.trim());
    else window.sessionStorage.removeItem(EMAIL_DRAFT_KEY);
  } catch {
    // Storage blocked: the field just starts empty.
  }
}

/** Client-side check of the email field (same rule as Fitora vEmail). */
export function emailError(email: string): string | null {
  if (!email.trim()) return "Hãy nhập email.";
  return normalizeEmail(email) ? null : ERROR_MESSAGES.invalid_email;
}

/** Fitora vPassword with strength: non-empty and at least MIN_PASSWORD characters. */
export function newPasswordError(password: string): string | null {
  if (!password) return ERROR_MESSAGES.missing_password;
  return password.length < MIN_PASSWORD ? ERROR_MESSAGES.weak_password : null;
}

/** Error codes that belong to a field rather than to the whole form. */
export const FIELD_CODES: ReadonlySet<AuthErrorCode> = new Set(["invalid_email", "missing_password", "weak_password", "password_mismatch"]);

export const OFFLINE_DETAIL = "Kiểm tra Wi-Fi hoặc dữ liệu di động rồi thử lại.";
