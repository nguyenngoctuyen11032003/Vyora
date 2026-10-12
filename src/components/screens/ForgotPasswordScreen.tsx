"use client";

// Spec §3.3 "Quên mật khẩu" step 1: email → requestPasswordReset. Always the neutral message (never reveals
// whether the account exists); the send button is locked for 60 s after every send.
import { LoaderCircle, Send } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { AuthLayout } from "@/src/components/auth/AuthLayout";
import { emailError, OFFLINE_DETAIL, readEmailDraft, writeEmailDraft } from "@/src/components/auth/auth-form";
import { FormNotice } from "@/src/components/auth/FormNotice";
import { useNav } from "@/src/components/app/nav";
import { GlassButton, TextField } from "@/src/components/f1";
import { useAuth } from "@/src/hooks/use-auth";
import { useCooldown } from "@/src/hooks/use-cooldown";
import { RESET_SENT_MESSAGE } from "@/src/lib/data";

export const RESEND_COOLDOWN_S = 60;

export function ForgotPasswordScreen() {
  const { requestPasswordReset } = useAuth();
  const nav = useNav();
  const cooldown = useCooldown(RESEND_COOLDOWN_S);
  const [email, setEmail] = useState(readEmailDraft);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [offline, setOffline] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const locked = busy || cooldown.active;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;
    const msg = emailError(email);
    setEmailMsg(msg);
    setOffline(null);
    if (msg) {
      emailRef.current?.focus();
      return;
    }
    setBusy(true);
    const res = await requestPasswordReset(email);
    setBusy(false);
    if (res.ok) {
      writeEmailDraft(email);
      setSent(true);
      cooldown.start();
    } else if (res.code === "invalid_email") {
      setEmailMsg(res.message);
      emailRef.current?.focus();
    } else {
      setOffline(res.message);
    }
  };

  const back = () => {
    writeEmailDraft(email);
    nav.back();
  };

  let label: string;
  if (busy) label = "Đang gửi…";
  else if (cooldown.active) label = `Gửi lại sau ${cooldown.remaining} giây`;
  else label = sent ? "Gửi lại liên kết" : "Gửi liên kết";

  return (
    <AuthLayout
      eyebrow="Quên mật khẩu"
      title={["Đặt lại", "mật khẩu"]}
      lead={<p>Nhập email tài khoản Fitora. Liên kết đặt mật khẩu mới sẽ được gửi vào hộp thư của bạn.</p>}
    >
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
          enterKeyHint="send"
          placeholder="ten@email.com"
          value={email}
          error={emailMsg}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailMsg) setEmailMsg(null);
          }}
        />

        {offline ? (
          <FormNotice tone="offline" title={offline}>
            {OFFLINE_DETAIL}
          </FormNotice>
        ) : sent ? (
          <FormNotice tone="success" title={RESET_SENT_MESSAGE}>
            Mở thư trên điện thoại này rồi bấm vào liên kết. Không thấy thư? Xem thêm mục Spam hoặc Quảng cáo.
          </FormNotice>
        ) : null}

        <div className="animate-fade-slide-up anim-delay-380 mt-2 flex flex-col gap-1">
          <GlassButton
            type="submit"
            variant={sent ? "glass" : "primary"}
            size="lg"
            block
            aria-disabled={locked || undefined}
            className={locked ? "cursor-not-allowed opacity-60" : undefined}
          >
            {busy ? (
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            ) : cooldown.active ? null : (
              <Send aria-hidden="true" className="size-[18px]" />
            )}
            <span className="tabular">{label}</span>
          </GlassButton>
          {cooldown.active ? (
            <div aria-hidden="true" className="mx-auto mt-2 h-[3px] w-24 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gold/80 transition-[width] duration-300 ease-linear"
                style={{ width: `${(cooldown.remaining / RESEND_COOLDOWN_S) * 100}%` }}
              />
            </div>
          ) : null}
          <GlassButton variant="ghost" size="md" onClick={back} className="mt-1 self-center text-fg-muted hover:text-fg">
            Quay lại đăng nhập
          </GlassButton>
        </div>
      </form>
    </AuthLayout>
  );
}
