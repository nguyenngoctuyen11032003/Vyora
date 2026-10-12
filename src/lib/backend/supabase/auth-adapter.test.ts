import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { ERROR_MESSAGES } from "@/src/lib/data/messages";
import { createSupabaseAuthAdapter, linkFromParams, toFailure } from "./auth-adapter";
import { AUTH_STORAGE_KEY, createGymSupabaseClient } from "./client";
import { GymAuthError } from "./errors";

const USER = { id: "u-1", email: "a@b.co" };
const ok = (data: unknown = {}) => Promise.resolve({ data, error: null });
const fail = (error: unknown) => Promise.resolve({ data: null, error });
const REDIRECT = "https://me.github.io/gym-for-beginners/?flow=recovery";

function fake(over: Record<string, unknown> = {}, session: unknown = { user: USER }) {
  const auth = {
    getSession: vi.fn(() => Promise.resolve({ data: { session }, error: null })),
    signInWithPassword: vi.fn(() => ok({ user: USER, session: {} })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    resetPasswordForEmail: vi.fn(() => ok()),
    verifyOtp: vi.fn(() => ok({ user: USER })),
    exchangeCodeForSession: vi.fn(() => ok({ user: USER })),
    updateUser: vi.fn(() => ok({ user: USER })),
    ...over,
  };
  const client = { auth } as unknown as SupabaseClient;
  return { auth, adapter: createSupabaseAuthAdapter(client, { recoveryRedirectTo: () => REDIRECT }) };
}

describe("createGymSupabaseClient", () => {
  it("returns null without URL or anon key", () => {
    expect(createGymSupabaseClient(undefined, "k")).toBeNull();
    expect(createGymSupabaseClient("https://x.supabase.co", " ")).toBeNull();
  });
  it("persists the session under its own storage key", () => {
    expect(AUTH_STORAGE_KEY).toBe("gym.auth");
    expect(createGymSupabaseClient("https://x.supabase.co", "anon")).not.toBeNull();
  });
});

describe("AuthAdapter (Supabase)", () => {
  it("getUser restores the persisted session, null when signed out", async () => {
    expect(await fake().adapter.getUser()).toEqual(USER);
    expect(await fake({}, null).adapter.getUser()).toBeNull();
  });

  it("signIn returns the user; maps errors to the UI codes and copy", async () => {
    expect(await fake().adapter.signIn("A@B.co", "x")).toEqual({ ok: true, data: USER });
    const { adapter } = fake({ signInWithPassword: vi.fn(() => fail({ code: "invalid_credentials", message: "Invalid login credentials" })) });
    expect(await adapter.signIn("a@b.co", "x")).toEqual({ ok: false, code: "invalid_credentials", message: ERROR_MESSAGES.invalid_credentials });
    expect(await adapter.signIn("bad", "x")).toMatchObject({ ok: false, code: "invalid_email" });
    expect(await adapter.signIn("a@b.co", "")).toMatchObject({ ok: false, code: "missing_password" });
    const offline = fake({ signInWithPassword: vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))) }).adapter;
    expect(await offline.signIn("a@b.co", "x")).toMatchObject({ ok: false, code: "network" });
  });

  it("requestPasswordReset sends redirectTo ?flow=recovery and is ok for any well-formed email", async () => {
    const { adapter, auth } = fake();
    expect(await adapter.requestPasswordReset("someone@b.co")).toEqual({ ok: true, data: undefined });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("someone@b.co", { redirectTo: REDIRECT });
    expect(await adapter.requestPasswordReset("bad")).toMatchObject({ ok: false, code: "invalid_email" });
  });

  it("requestPasswordReset keeps the precise rate-limit message", async () => {
    const { adapter } = fake({ resetPasswordForEmail: vi.fn(() => fail({ code: "over_email_send_rate_limit", message: "email rate limit exceeded" })) });
    const r = await adapter.requestPasswordReset("a@b.co");
    expect(r).toMatchObject({ ok: false, code: "unknown" });
    expect(!r.ok && r.message).toMatch(/quá nhanh/);
  });

  it("verifyRecoveryLink spends token_hash or code and returns the recovered user", async () => {
    const a = fake();
    expect(await a.adapter.verifyRecoveryLink({ tokenHash: "h", type: "recovery", code: null })).toEqual({ ok: true, data: USER });
    expect(a.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "h", type: "recovery" });
    const b = fake();
    expect(await b.adapter.verifyRecoveryLink({ tokenHash: null, type: null, code: "c" })).toEqual({ ok: true, data: USER });
    expect(b.auth.exchangeCodeForSession).toHaveBeenCalledWith("c");
  });

  it("verifyRecoveryLink → expired_link for expired, wrong-type or empty links", async () => {
    const expired = fake({ verifyOtp: vi.fn(() => fail({ code: "otp_expired", message: "Token has expired or is invalid" })) }).adapter;
    expect(await expired.verifyRecoveryLink({ tokenHash: "h", type: "recovery", code: null })).toMatchObject({ ok: false, code: "expired_link" });
    const { adapter, auth } = fake();
    expect(await adapter.verifyRecoveryLink({ tokenHash: "h", type: "signup", code: null })).toMatchObject({ ok: false, code: "expired_link" });
    expect(await adapter.verifyRecoveryLink({ tokenHash: null, type: null, code: null })).toMatchObject({ ok: false, code: "expired_link" });
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("updatePassword: weak_password for short or same password, expired_link without a session", async () => {
    const { adapter, auth } = fake();
    expect(await adapter.updatePassword("1234567")).toMatchObject({ ok: false, code: "weak_password" });
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(await adapter.updatePassword("12345678")).toEqual({ ok: true, data: undefined });
    const same = fake({ updateUser: vi.fn(() => fail({ code: "same_password", message: "New password should be different from the old password." })) }).adapter;
    const r = await same.updatePassword("12345678");
    expect(r).toMatchObject({ ok: false, code: "weak_password" });
    expect(!r.ok && r.message).toBe("Mật khẩu mới phải khác mật khẩu cũ.");
    const gone = fake({ updateUser: vi.fn(() => fail({ message: "Auth session missing!" })) }).adapter;
    expect(await gone.updatePassword("12345678")).toMatchObject({ ok: false, code: "expired_link" });
  });

  it("without a client every call reports not_configured and getUser is null", async () => {
    const adapter = createSupabaseAuthAdapter(null);
    expect(await adapter.getUser()).toBeNull();
    expect(await adapter.signIn("a@b.co", "x")).toMatchObject({ ok: false, code: "not_configured" });
    await expect(adapter.signOut()).resolves.toBeUndefined();
  });
});

describe("helpers", () => {
  it("linkFromParams", () => {
    expect(linkFromParams({ tokenHash: "h", type: "recovery", code: "c" })).toEqual({ kind: "recovery_token", tokenHash: "h" });
    expect(linkFromParams({ tokenHash: null, type: null, code: "c" })).toEqual({ kind: "recovery_code", code: "c" });
  });
  it("toFailure maps password_mismatch", () => {
    expect(toFailure(new GymAuthError("password_mismatch", "x"))).toEqual({ ok: false, code: "password_mismatch", message: ERROR_MESSAGES.password_mismatch });
  });
});
