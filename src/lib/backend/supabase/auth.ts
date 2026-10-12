// Supabase Auth for the gym app: sign in, sign out and the forgot-password flow.
// No sign-up on purpose — the account is the shared Note_mytasks / Fitora one.
//
// Recovery e-mail flow (same as Fitora src/services/auth.ts):
//   1. requestPasswordReset(email) → resetPasswordForEmail(…, { redirectTo: <site>?flow=recovery })
//   2. The e-mail template appends '&token_hash=…&type=recovery' to {{ .RedirectTo }}
//      (legacy PKCE links append '&code=…' instead). readAuthLink() parses either.
//   3. completeAuthLink(link) spends the link (verifyOtp / exchangeCodeForSession) → session.
//   4. updatePassword(newPassword) → updateUser({ password }).
//
// The functions take the client as a narrow structural type so this file does not import
// @supabase/supabase-js — a real SupabaseClient satisfies it.
import { GymAuthError, LINK_EXPIRED_MSG, toGymAuthError } from "./errors";

/** Matches minimum_password_length in Note_mytasks/supabase/config.toml and Fitora MIN_PASSWORD. */
export const MIN_PASSWORD = 8;

type AuthResult<T = unknown> = Promise<{ data: T; error: unknown }>;

export interface AuthClientLike {
  auth: {
    signInWithPassword(c: { email: string; password: string }): AuthResult;
    signOut(o?: { scope?: "global" | "local" | "others" }): Promise<{ error: unknown }>;
    resetPasswordForEmail(email: string, o: { redirectTo: string }): AuthResult;
    verifyOtp(p: { token_hash: string; type: "recovery" }): AuthResult;
    exchangeCodeForSession(code: string): AuthResult;
    updateUser(a: { password: string }): AuthResult;
  };
}

function client(c: AuthClientLike | null): AuthClientLike {
  if (!c) throw new GymAuthError("not_configured", "Ứng dụng chưa được cấu hình máy chủ.");
  return c;
}

async function run<T>(p: AuthResult<T>, fallback?: string): Promise<T> {
  let res: Awaited<AuthResult<T>>;
  try {
    res = await p;
  } catch (e) {
    throw toGymAuthError(e, fallback);
  }
  if (res.error) throw toGymAuthError(res.error, fallback);
  return res.data;
}

export function normalizeEmail(email: string): string {
  const e = typeof email === "string" ? email.trim() : "";
  if (!e) throw new GymAuthError("invalid_input", "Hãy nhập email.", "email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new GymAuthError("invalid_input", "Địa chỉ email không hợp lệ.", "email");
  return e.toLowerCase();
}

function checkPassword(password: string, strength: boolean): string {
  if (typeof password !== "string" || password === "") throw new GymAuthError("invalid_input", "Hãy nhập mật khẩu.", "password");
  if (strength && password.length < MIN_PASSWORD) {
    throw new GymAuthError("invalid_input", `Mật khẩu tối thiểu ${MIN_PASSWORD} ký tự.`, "password");
  }
  return password;
}

/**
 * Base URL of the deployed app with its GitHub Pages sub-path (/gym-for-beginners/), no query/hash.
 * NEXT_PUBLIC_SITE_URL wins when set; location.origin alone would drop the sub-path.
 */
export function siteBaseUrl(siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL, href?: string): string {
  const base = siteUrl?.trim() || href || (typeof window !== "undefined" ? window.location.href : "");
  if (!base) throw new GymAuthError("not_configured", "Ứng dụng chưa được cấu hình địa chỉ trang.");
  const u = new URL(siteUrl?.trim() ? base : "./", base);
  if (!u.pathname.endsWith("/")) u.pathname += "/";
  u.search = "";
  u.hash = "";
  return u.href;
}

export function recoveryRedirectUrl(base = siteBaseUrl()): string {
  return `${base}?flow=recovery`;
}

export async function signIn(c: AuthClientLike | null, email: string, password: string) {
  const e = normalizeEmail(email);
  const p = checkPassword(password, false);
  return run(client(c).auth.signInWithPassword({ email: e, password: p }));
}

/**
 * Global sign-out first; when the server can't be reached supabase-js keeps the local session,
 * so fall back to a local sign-out (otherwise the next reload logs the user straight back in).
 */
export async function signOut(c: AuthClientLike | null): Promise<void> {
  const auth = client(c).auth;
  let failed = false;
  try {
    const res = await auth.signOut();
    const err = res?.error as { message?: string; code?: string } | null | undefined;
    failed = Boolean(err) && !/session missing|session_not_found/i.test(`${err?.message} ${err?.code}`);
  } catch {
    failed = true;
  }
  if (!failed) return;
  try {
    const res = await auth.signOut({ scope: "local" });
    if (res?.error) throw res.error;
  } catch (e) {
    throw toGymAuthError(e, "Không đăng xuất được. Vui lòng thử lại.");
  }
}

/**
 * Sends the reset e-mail. Supabase answers OK for unknown addresses too, so the UI must show
 * the same neutral message either way ("Nếu email tồn tại…") — never reveal whether an account exists.
 */
export async function requestPasswordReset(c: AuthClientLike | null, email: string, redirectTo = recoveryRedirectUrl()): Promise<void> {
  const e = normalizeEmail(email);
  await run(client(c).auth.resetPasswordForEmail(e, { redirectTo }));
}

export type AuthLink =
  | { kind: "recovery_token"; tokenHash: string }
  | { kind: "recovery_code"; code: string }
  | { kind: "error"; error: GymAuthError };

/**
 * Reads a recovery link from the current URL. Returns null when the URL carries no auth link.
 * Supabase reports failed links as error/error_code/error_description in the query or the hash.
 */
export function readAuthLink(href: string): AuthLink | null {
  const u = new URL(href);
  const q = u.searchParams;
  const h = new URLSearchParams(u.hash.replace(/^#/, ""));
  const get = (k: string) => q.get(k) ?? h.get(k);

  const errorCode = get("error_code") ?? get("error");
  if (errorCode) {
    const desc = get("error_description") ?? "";
    const err = toGymAuthError({ code: errorCode, message: desc }, LINK_EXPIRED_MSG);
    return { kind: "error", error: err.code === "unknown" ? new GymAuthError("link_expired", LINK_EXPIRED_MSG) : err };
  }

  const tokenHash = get("token_hash");
  const type = get("type");
  if (tokenHash) {
    if (type !== "recovery") return { kind: "error", error: new GymAuthError("link_expired", LINK_EXPIRED_MSG) };
    return { kind: "recovery_token", tokenHash };
  }

  const code = q.get("code");
  if (code && q.get("flow") === "recovery") return { kind: "recovery_code", code };

  if (q.get("flow") === "recovery") return { kind: "error", error: new GymAuthError("link_expired", LINK_EXPIRED_MSG) };
  return null;
}

/** The URL without auth parameters — pass to history.replaceState so a reload can't re-spend the link. */
export function stripAuthParams(href: string): string {
  const u = new URL(href);
  for (const k of ["flow", "token_hash", "type", "code", "error", "error_code", "error_description"]) u.searchParams.delete(k);
  const h = new URLSearchParams(u.hash.replace(/^#/, ""));
  if (h.has("error") || h.has("error_code") || h.has("access_token")) u.hash = "";
  return u.href;
}

/** Spends a recovery link; afterwards the user has a session and can set a new password. */
export async function completeAuthLink(c: AuthClientLike | null, link: AuthLink): Promise<void> {
  if (link.kind === "error") throw link.error;
  const auth = client(c).auth;
  if (link.kind === "recovery_token") {
    await run(auth.verifyOtp({ token_hash: link.tokenHash, type: "recovery" }), LINK_EXPIRED_MSG);
  } else {
    await run(auth.exchangeCodeForSession(link.code), LINK_EXPIRED_MSG);
  }
}

export async function updatePassword(c: AuthClientLike | null, password: string, confirm?: string): Promise<void> {
  const p = checkPassword(password, true);
  if (confirm !== undefined && confirm !== password) {
    throw new GymAuthError("invalid_input", "Mật khẩu nhập lại không khớp.", "password");
  }
  await run(client(c).auth.updateUser({ password: p }));
}
