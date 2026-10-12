import { describe, expect, it, vi } from "vitest";
import {
  type AuthClientLike,
  completeAuthLink,
  readAuthLink,
  recoveryRedirectUrl,
  requestPasswordReset,
  signIn,
  signOut,
  siteBaseUrl,
  stripAuthParams,
  updatePassword,
} from "./auth";
import { GymAuthError, toGymAuthError } from "./errors";

const ok = (data: unknown = {}) => Promise.resolve({ data, error: null });
const fail = (error: unknown) => Promise.resolve({ data: null, error });

function fakeClient(over: Partial<AuthClientLike["auth"]> = {}) {
  const auth = {
    signInWithPassword: vi.fn(() => ok({ session: {} })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    resetPasswordForEmail: vi.fn(() => ok()),
    verifyOtp: vi.fn(() => ok({ session: {} })),
    exchangeCodeForSession: vi.fn(() => ok({ session: {} })),
    updateUser: vi.fn(() => ok({ user: {} })),
    ...over,
  };
  return { auth } as AuthClientLike & { auth: typeof auth };
}

async function rejects(p: Promise<unknown>, code: string, field?: string) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(GymAuthError);
  expect((err as GymAuthError).code).toBe(code);
  if (field) expect((err as GymAuthError).field).toBe(field);
  return err as GymAuthError;
}

const SITE = "https://me.github.io/Vyora/";

describe("siteBaseUrl / recoveryRedirectUrl", () => {
  it("keeps the GitHub Pages sub-path and drops query/hash", () => {
    expect(siteBaseUrl(undefined, `${SITE}?flow=recovery&token_hash=x#top`)).toBe(SITE);
  });
  it("prefers NEXT_PUBLIC_SITE_URL and adds a trailing slash", () => {
    expect(siteBaseUrl("https://me.github.io/Vyora", "http://localhost:3000/")).toBe(SITE);
  });
  it("builds <base>?flow=recovery (query form, no hash route)", () => {
    expect(recoveryRedirectUrl(SITE)).toBe(`${SITE}?flow=recovery`);
  });
});

describe("signIn", () => {
  it("normalises the email and does not apply the strength rule to the login password", async () => {
    const c = fakeClient();
    await signIn(c, "  Some.User@Example.TEST ", "short");
    expect(c.auth.signInWithPassword).toHaveBeenCalledWith({ email: "some.user@example.test", password: "short" });
  });
  it("validates input before calling the server", async () => {
    const c = fakeClient();
    await rejects(signIn(c, "", "x"), "missing_email", "email");
    await rejects(signIn(c, "not-an-email", "x"), "invalid_email", "email");
    await rejects(signIn(c, "a@b.co", ""), "missing_password", "password");
    expect(c.auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("maps wrong credentials to a Vietnamese message", async () => {
    const c = fakeClient({ signInWithPassword: vi.fn(() => fail({ message: "Invalid login credentials", code: "invalid_credentials" })) });
    const e = await rejects(signIn(c, "a@b.co", "secret123"), "invalid_credentials");
    expect(e.message).toBe("Email hoặc mật khẩu không đúng.");
  });
  it("maps network failures (thrown or returned)", async () => {
    const thrown = fakeClient({ signInWithPassword: vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))) });
    await rejects(signIn(thrown, "a@b.co", "secret123"), "network");
    const returned = fakeClient({ signInWithPassword: vi.fn(() => fail({ name: "AuthRetryableFetchError", message: "" })) });
    await rejects(signIn(returned, "a@b.co", "secret123"), "network");
  });
  it("reports a missing client as not_configured", async () => {
    await rejects(signIn(null, "a@b.co", "secret123"), "not_configured");
  });
});

describe("signOut", () => {
  it("falls back to a local sign-out when the global one fails", async () => {
    const c = fakeClient({
      signOut: vi.fn((o?: { scope?: string }) => Promise.resolve({ error: o?.scope === "local" ? null : { message: "Failed to fetch" } })),
    });
    await signOut(c);
    expect(c.auth.signOut).toHaveBeenNthCalledWith(2, { scope: "local" });
  });
  it("treats an already-missing session as signed out", async () => {
    const c = fakeClient({ signOut: vi.fn(() => Promise.resolve({ error: { message: "Auth session missing!" } })) });
    await signOut(c);
    expect(c.auth.signOut).toHaveBeenCalledTimes(1);
  });
});

describe("requestPasswordReset", () => {
  it("sends the normalised email with redirectTo <base>?flow=recovery", async () => {
    const c = fakeClient();
    await requestPasswordReset(c, " A@B.Co ", `${SITE}?flow=recovery`);
    expect(c.auth.resetPasswordForEmail).toHaveBeenCalledWith("a@b.co", { redirectTo: `${SITE}?flow=recovery` });
  });
  it("rejects an invalid email without calling the server", async () => {
    const c = fakeClient();
    await rejects(requestPasswordReset(c, "nope", SITE), "invalid_email", "email");
    expect(c.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it("maps the e-mail rate limit", async () => {
    const c = fakeClient({ resetPasswordForEmail: vi.fn(() => fail({ code: "over_email_send_rate_limit", message: "email rate limit exceeded" })) });
    await rejects(requestPasswordReset(c, "a@b.co", SITE), "rate_limited");
  });
});

describe("readAuthLink", () => {
  it("reads a token_hash recovery link (template appends it to RedirectTo)", () => {
    expect(readAuthLink(`${SITE}?flow=recovery&token_hash=abc123&type=recovery`)).toEqual({ kind: "recovery_token", tokenHash: "abc123" });
  });
  it("reads a legacy PKCE recovery link", () => {
    expect(readAuthLink(`${SITE}?flow=recovery&code=xyz`)).toEqual({ kind: "recovery_code", code: "xyz" });
  });
  it("turns an expired link reported in the hash into link_expired", () => {
    const link = readAuthLink(`${SITE}?flow=recovery#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`);
    expect(link?.kind).toBe("error");
    expect(link?.kind === "error" && link.error.code).toBe("link_expired");
  });
  it("rejects a token_hash of another type", () => {
    const link = readAuthLink(`${SITE}?token_hash=abc&type=signup`);
    expect(link?.kind === "error" && link.error.code).toBe("link_expired");
  });
  it("treats ?flow=recovery without a token as an unusable link", () => {
    const link = readAuthLink(`${SITE}?flow=recovery`);
    expect(link?.kind === "error" && link.error.code).toBe("link_expired");
  });
  it("returns null for a normal URL (ignores a stray ?code= outside the recovery flow)", () => {
    expect(readAuthLink(SITE)).toBeNull();
    expect(readAuthLink(`${SITE}?code=abc`)).toBeNull();
  });
});

describe("stripAuthParams", () => {
  it("removes every auth parameter but keeps the rest", () => {
    expect(stripAuthParams(`${SITE}?flow=recovery&token_hash=a&type=recovery&tab=week`)).toBe(`${SITE}?tab=week`);
    expect(stripAuthParams(`${SITE}?flow=recovery#error=access_denied&error_code=otp_expired`)).toBe(SITE);
  });
});

describe("completeAuthLink", () => {
  it("spends a token_hash with verifyOtp type recovery", async () => {
    const c = fakeClient();
    await completeAuthLink(c, { kind: "recovery_token", tokenHash: "abc" });
    expect(c.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "abc", type: "recovery" });
  });
  it("spends a PKCE code with exchangeCodeForSession", async () => {
    const c = fakeClient();
    await completeAuthLink(c, { kind: "recovery_code", code: "xyz" });
    expect(c.auth.exchangeCodeForSession).toHaveBeenCalledWith("xyz");
  });
  it("maps an expired or reused token to link_expired", async () => {
    const c = fakeClient({ verifyOtp: vi.fn(() => fail({ code: "otp_expired", message: "Token has expired or is invalid" })) });
    await rejects(completeAuthLink(c, { kind: "recovery_token", tokenHash: "abc" }), "link_expired");
  });
  it("maps a PKCE link opened in another browser (no code verifier) to link_expired", async () => {
    const c = fakeClient({ exchangeCodeForSession: vi.fn(() => fail({ message: "invalid request: both auth code and code verifier should be non-empty" })) });
    await rejects(completeAuthLink(c, { kind: "recovery_code", code: "xyz" }), "link_expired");
  });
  it("rethrows the error carried by an error link", async () => {
    await rejects(completeAuthLink(fakeClient(), { kind: "error", error: new GymAuthError("link_expired", "x") }), "link_expired");
  });
});

describe("updatePassword", () => {
  it("enforces 8 characters and a matching confirmation before calling the server", async () => {
    const c = fakeClient();
    await rejects(updatePassword(c, "1234567"), "password_too_short", "password");
    await rejects(updatePassword(c, "12345678", "12345679"), "password_mismatch", "password");
    expect(c.auth.updateUser).not.toHaveBeenCalled();
    await updatePassword(c, "12345678", "12345678");
    expect(c.auth.updateUser).toHaveBeenCalledWith({ password: "12345678" });
  });
  it("maps same-password and weak-password errors (same before weak)", async () => {
    const same = fakeClient({ updateUser: vi.fn(() => fail({ code: "same_password", message: "New password should be different from the old password." })) });
    await rejects(updatePassword(same, "12345678"), "same_password");
    const weak = fakeClient({ updateUser: vi.fn(() => fail({ code: "weak_password", message: "Password should be at least 8 characters." })) });
    await rejects(updatePassword(weak, "12345678"), "weak_password");
  });
  it("maps an expired recovery session", async () => {
    const c = fakeClient({ updateUser: vi.fn(() => fail({ message: "Auth session missing!" })) });
    await rejects(updatePassword(c, "12345678"), "session_expired");
  });
});

describe("toGymAuthError", () => {
  it("keeps a GymAuthError and falls back to the given message", () => {
    const e = new GymAuthError("rate_limited", "x");
    expect(toGymAuthError(e)).toBe(e);
    expect(toGymAuthError({ message: "weird" }, "Thử lại").message).toBe("Thử lại");
  });
});
