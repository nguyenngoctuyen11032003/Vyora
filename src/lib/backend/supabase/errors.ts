// Supabase Auth errors → { code, Vietnamese message }. Same wording and codes as
// Fitora (src/services/errors.ts) so the shared account behaves identically in both apps.

export type GymAuthErrorCode =
  | "invalid_input"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "same_password"
  | "weak_password"
  | "rate_limited"
  | "invalid_email"
  | "session_expired"
  | "link_expired"
  | "email_not_authorized"
  | "user_banned"
  | "network"
  | "not_configured"
  | "unknown";

export class GymAuthError extends Error {
  readonly code: GymAuthErrorCode;
  /** Form field the message belongs to, when there is one. */
  readonly field?: "email" | "password";

  constructor(code: GymAuthErrorCode, message: string, field?: "email" | "password") {
    super(message);
    this.name = "GymAuthError";
    this.code = code;
    this.field = field;
  }
}

const SESSION_MSG = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";
export const LINK_EXPIRED_MSG = "Liên kết đã hết hạn hoặc đã được dùng. Hãy yêu cầu liên kết mới.";

const AUTH_MESSAGES: Array<[RegExp, GymAuthErrorCode, string]> = [
  [/invalid login credentials|invalid_credentials/i, "invalid_credentials", "Email hoặc mật khẩu không đúng."],
  [/email not confirmed|email_not_confirmed/i, "email_not_confirmed", "Email chưa được xác nhận. Hãy mở liên kết trong hộp thư của bạn."],
  // Before weak_password: "New password should be different from the old password." also contains "password should be".
  [/same_password|should be different/i, "same_password", "Mật khẩu mới phải khác mật khẩu cũ."],
  [/password should|weak_password|weak password|pwned/i, "weak_password", "Mật khẩu quá yếu. Hãy dùng ít nhất 8 ký tự, khó đoán hơn."],
  [/rate limit|over_email_send_rate_limit|over_request_rate_limit|too many/i, "rate_limited", "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút."],
  [/email_address_invalid|email address .* is invalid|unable to validate email/i, "invalid_email", "Địa chỉ email không hợp lệ."],
  // Session / refresh-token problems before the generic "invalid … token" (e-mail link) rule.
  [/session.*(missing|not.?found|expired)|jwt expired|invalid jwt|bad_jwt|refresh.?token/i, "session_expired", SESSION_MSG],
  [/otp_expired|token has expired|invalid.*(token|link)|flow_state|code verifier/i, "link_expired", LINK_EXPIRED_MSG],
  [/email_address_not_authorized|email address not authorized/i, "email_not_authorized", "Máy chủ chưa được phép gửi email tới địa chỉ này. Hãy liên hệ quản trị viên."],
  [/user_banned|user is banned/i, "user_banned", "Tài khoản này đang bị khóa."],
];

const NETWORK_RE = /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet_disconnected|err_network/i;

interface RawError {
  code?: string;
  message?: string;
  status?: number;
  name?: string;
}

export function toGymAuthError(err: unknown, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại."): GymAuthError {
  if (err instanceof GymAuthError) return err;
  const e = (err ?? {}) as RawError;
  const text = `${e.message ?? ""} ${e.code ?? ""}`;
  if (NETWORK_RE.test(text) || e.name === "AuthRetryableFetchError") {
    return new GymAuthError("network", "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.");
  }
  for (const [re, code, message] of AUTH_MESSAGES) {
    if (re.test(text)) return new GymAuthError(code, message);
  }
  return new GymAuthError("unknown", fallback);
}
