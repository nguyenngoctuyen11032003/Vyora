// Vietnamese copy for every error code (spec §8). Adapters fill Result.message from here.
import { MIN_PASSWORD } from "@/src/lib/fitora";
import type { AuthErrorCode, Result } from "@/src/types/gym";

export const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_email: "Địa chỉ email không hợp lệ.",
  missing_password: "Hãy nhập mật khẩu.",
  invalid_credentials: "Email hoặc mật khẩu không đúng",
  weak_password: `Mật khẩu tối thiểu ${MIN_PASSWORD} ký tự.`,
  password_mismatch: "Hai mật khẩu chưa khớp.",
  expired_link: "Liên kết đã hết hạn hoặc đã được dùng.",
  network: "Không có kết nối mạng",
  not_configured: "Chưa cấu hình máy chủ",
  unknown: "Đã có lỗi, hãy thử lại.",
};

/** Message after requesting a reset email — identical whether or not the account exists. */
export const RESET_SENT_MESSAGE = "Nếu email tồn tại, liên kết đặt lại đã được gửi";

export function fail<T = void>(code: AuthErrorCode, message = ERROR_MESSAGES[code]): Result<T> {
  return { ok: false, code, message };
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fitora's vEmail: trimmed + lower-cased, or null when malformed. */
export function normalizeEmail(email: string): string | null {
  const e = (email ?? "").trim();
  return EMAIL_PATTERN.test(e) ? e.toLowerCase() : null;
}
