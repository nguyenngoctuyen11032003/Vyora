"use client";

// Spec §3.3 "Đăng nhập": F1 background + overlay, "Vyora" 64 px speedReveal, email, password with
// show/hide, gold button, Vietnamese errors, no sign-up, skeleton while the session restores.
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { AuthLayout } from "@/src/components/auth/AuthLayout";
import { emailError, OFFLINE_DETAIL, readEmailDraft, writeEmailDraft } from "@/src/components/auth/auth-form";
import { FormNotice } from "@/src/components/auth/FormNotice";
import { useNav } from "@/src/components/app/nav";
import { GlassButton, Skeleton, TextField } from "@/src/components/f1";
import { useAuth } from "@/src/hooks/use-auth";
import { ERROR_MESSAGES } from "@/src/lib/data";
import type { AuthErrorCode } from "@/src/types/gym";

interface FormError {
  code: AuthErrorCode;
  message: string;
}

export function LoginScreen() {
  const { status, signIn } = useAuth();
  const nav = useNav();
  const [email, setEmail] = useState(readEmailDraft);
  const [password, setPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const eMsg = emailError(email);
    const pMsg = password ? null : ERROR_MESSAGES.missing_password;
    setEmailMsg(eMsg);
    setPasswordMsg(pMsg);
    setFormError(null);
    if (eMsg || pMsg) {
      (eMsg ? emailRef : passwordRef).current?.focus();
      return;
    }
    setBusy(true);
    const res = await signIn(email, password);
    // On success the shell swaps to the app by itself (this screen unmounts).
    if (res.ok) {
      writeEmailDraft("");
      return;
    }
    setBusy(false);
    if (res.code === "invalid_email") {
      setEmailMsg(res.message);
      emailRef.current?.focus();
    } else if (res.code === "missing_password") {
      setPasswordMsg(res.message);
      passwordRef.current?.focus();
    } else {
      setFormError({ code: res.code, message: res.message });
    }
  };

  const goForgot = () => {
    writeEmailDraft(email);
    nav.navigate("forgot");
  };

  const restoring = status === "loading";

  return (
    <AuthLayout
      eyebrow="Đăng nhập"
      title={["Vyora"]}
      titleSize="brand"
    >
      {restoring ? (
        <div aria-busy="true" className="flex flex-col gap-4">
          <p role="status" className="sr-only">
            Đang khôi phục phiên đăng nhập…
          </p>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-14" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-14" />
          </div>
          <Skeleton className="mt-2 h-14 rounded-full" />
          <Skeleton className="mx-auto h-5 w-32 rounded-md" />
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <TextField
            ref={emailRef}
            className="animate-fade-slide-up anim-delay-300"
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            placeholder="ten@email.com"
            value={email}
            error={emailMsg}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailMsg) setEmailMsg(null);
            }}
          />
          <TextField
            ref={passwordRef}
            className="animate-fade-slide-up anim-delay-380"
            label="Mật khẩu"
            type="password"
            name="password"
            autoComplete="current-password"
            enterKeyHint="go"
            value={password}
            error={passwordMsg}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordMsg) setPasswordMsg(null);
            }}
          />

          {formError ? (
            formError.code === "network" ? (
              <FormNotice tone="offline" title={formError.message}>
                {OFFLINE_DETAIL}
              </FormNotice>
            ) : formError.code === "invalid_credentials" ? (
              <FormNotice tone="error" title={formError.message}>
                Kiểm tra lại email và mật khẩu rồi thử lại.
              </FormNotice>
            ) : (
              <FormNotice tone="error" title={formError.message} />
            )
          ) : null}

          <div className="animate-fade-slide-up anim-delay-450 mt-2 flex flex-col gap-1">
            <GlassButton type="submit" variant="primary" size="lg" block aria-disabled={busy || undefined} className="justify-between pl-7 pr-5">
              {busy ? (
                <>
                  <span>Đang đăng nhập…</span>
                  <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight aria-hidden="true" className="size-5" />
                </>
              )}
            </GlassButton>
            <GlassButton variant="ghost" size="md" onClick={goForgot} className="self-center text-fg-muted hover:text-fg">
              Quên mật khẩu?
            </GlassButton>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
