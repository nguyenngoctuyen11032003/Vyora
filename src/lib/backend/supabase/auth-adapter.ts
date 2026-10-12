// Supabase implementation of AuthAdapter (src/lib/data/types.ts). Wraps the throwing helpers in ./auth
// and turns GymAuthError into the UI's Result codes + Vietnamese copy (src/lib/data/messages.ts).
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ERROR_MESSAGES, RESET_SENT_MESSAGE } from "@/src/lib/data/messages";
import type { AuthAdapter } from "@/src/lib/data/types";
import type { AuthErrorCode, AuthUser, RecoveryParams, Result } from "@/src/types/gym";
import {
  type AuthClientLike,
  type AuthLink,
  completeAuthLink,
  recoveryRedirectUrl,
  requestPasswordReset,
  signIn,
  signOut,
  updatePassword,
} from "./auth";
import { GymAuthError, LINK_EXPIRED_MSG, toGymAuthError } from "./errors";

export { RESET_SENT_MESSAGE };

function toUser(u: Pick<User, "id" | "email"> | null | undefined): AuthUser | null {
  return u?.id ? { id: u.id, email: u.email ?? "" } : null;
}

/** GymAuthError → Result failure. Codes the UI has no slot for keep their precise message under 'unknown'. */
export function toFailure<T = void>(err: unknown): Result<T> {
  const e = err instanceof GymAuthError ? err : toGymAuthError(err);
  const as = (code: AuthErrorCode, message = ERROR_MESSAGES[code]): Result<T> => ({ ok: false, code, message });
  switch (e.code) {
    case "missing_email":
    case "invalid_email":
      return as("invalid_email");
    case "missing_password":
      return as("missing_password");
    case "password_too_short":
      return as("weak_password");
    case "password_mismatch":
      return as("password_mismatch");
    case "invalid_credentials":
      return as("invalid_credentials");
    case "weak_password":
      return as("weak_password", e.message);
    case "same_password":
      return as("weak_password", e.message); // "Mật khẩu mới phải khác mật khẩu cũ."
    case "link_expired":
    case "session_expired":
      return as("expired_link");
    case "network":
      return as("network");
    case "not_configured":
      return as("not_configured");
    default:
      // rate_limited, email_not_confirmed, user_banned, email_not_authorized, unknown
      return as("unknown", e.message || ERROR_MESSAGES.unknown);
  }
}

async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return toFailure<T>(e);
  }
}

/** RecoveryParams (parsed by the UI from the URL) → the link shape ./auth understands. */
export function linkFromParams(p: RecoveryParams): AuthLink {
  if (p.tokenHash) {
    return p.type === "recovery"
      ? { kind: "recovery_token", tokenHash: p.tokenHash }
      : { kind: "error", error: new GymAuthError("link_expired", LINK_EXPIRED_MSG) };
  }
  if (p.code) return { kind: "recovery_code", code: p.code };
  return { kind: "error", error: new GymAuthError("link_expired", LINK_EXPIRED_MSG) };
}

export interface SupabaseAuthAdapterOptions {
  /** Defaults to <NEXT_PUBLIC_SITE_URL or current page>?flow=recovery. */
  recoveryRedirectTo?: () => string;
}

export function createSupabaseAuthAdapter(client: SupabaseClient | null, opts: SupabaseAuthAdapterOptions = {}): AuthAdapter {
  const c = client as unknown as AuthClientLike | null;
  const redirectTo = opts.recoveryRedirectTo ?? (() => recoveryRedirectUrl());

  async function currentUser(): Promise<AuthUser | null> {
    if (!client) return null;
    const { data } = await client.auth.getSession(); // local read; no network unless a refresh is due
    return toUser(data.session?.user);
  }

  return {
    async getUser() {
      try {
        return await currentUser();
      } catch {
        return null;
      }
    },

    signIn: (email, password) =>
      attempt(async () => {
        const data = (await signIn(c, email, password)) as { user?: User | null } | null;
        const user = toUser(data?.user) ?? (await currentUser());
        if (!user) throw new GymAuthError("unknown", ERROR_MESSAGES.unknown);
        return user;
      }),

    async signOut() {
      if (!client) return;
      await signOut(c); // falls back to a local sign-out; throws only if even that fails
    },

    requestPasswordReset: (email) => attempt(() => requestPasswordReset(c, email, redirectTo())),

    verifyRecoveryLink: (params) =>
      attempt(async () => {
        await completeAuthLink(c, linkFromParams(params));
        const user = await currentUser();
        if (!user) throw new GymAuthError("link_expired", LINK_EXPIRED_MSG);
        return user;
      }),

    updatePassword: (password) => attempt(() => updatePassword(c, password)),
  };
}
