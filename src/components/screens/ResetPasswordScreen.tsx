"use client";

// Spec §3.3 "Quên mật khẩu" step 2: verifyRecoveryLink on mount → new password + repeat (Fitora vPassword:
// at least MIN_PASSWORD characters) → updatePassword → nav.finishRecovery() (straight into the app).
// Expired link → message + "Gửi lại liên kết" (back to step 1).
import { Check, LoaderCircle, RotateCw, Unlink, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AuthLayout } from "@/src/components/auth/AuthLayout";
import { newPasswordError, OFFLINE_DETAIL } from "@/src/components/auth/auth-form";
import { FormNotice } from "@/src/components/auth/FormNotice";
import { useNav } from "@/src/components/app/nav";
import { useToast } from "@/src/components/app/toast";
import { GlassButton, Skeleton, TextField } from "@/src/components/f1";
import { useAuth } from "@/src/hooks/use-auth";
import { ERROR_MESSAGES } from "@/src/lib/data";
import { MIN_PASSWORD } from "@/src/lib/fitora";
import type { RecoveryParams, Result } from "@/src/types/gym";

export interface ResetPasswordScreenProps {
  recovery: RecoveryParams | null;
}

type LinkState = { kind: "checking" } | { kind: "ready"; email: string | null } | { kind: "expired" } | { kind: "offline"; message: string };

const NO_PARAMS: RecoveryParams = { tokenHash: null, type: null, code: null };

export function ResetPasswordScreen({ recovery }: ResetPasswordScreenProps) {
  const { status, verifyRecoveryLink, updatePassword } = useAuth();
  const nav = useNav();
  const toast = useToast();
  const [link, setLink] = useState<LinkState>({ kind: "checking" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    verifyRecoveryLink(recovery ?? NO_PARAMS).then((res) => {
      if (!alive) return;
      if (res.ok) setLink({ kind: "ready", email: res.data.email ?? null });
      else if (res.code === "network") setLink({ kind: "offline", message: res.message });
      else setLink({ kind: "expired" });
    });
    return () => {
      alive = false;
    };
  }, [recovery, verifyRecoveryLink, attempt]);

  const retry = () => {
    setLink({ kind: "checking" });
    setAttempt((n) => n + 1);
  };

  const done = () => {
    toast.show("Đã đổi mật khẩu", { tone: "success" });
    nav.finishRecovery();
  };

  // Leaving the link without saving: signed-in users go back to the app, others to the login.
  const leaveLabel = status === "signedIn" ? "Về ứng dụng" : "Về đăng nhập";

  return (
    <AuthLayout
      eyebrow="Đặt mật khẩu mới"
      title={["Mật khẩu", "mới"]}
      lead={
        link.kind === "ready" ? (
          <p className="flex items-center gap-2">
            <UserRound aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 truncate">
              <span className="sr-only">Tài khoản: </span>
              {link.email ?? "Tài khoản Fitora"}
            </span>
          </p>
        ) : link.kind === "checking" ? (
          <p>Đang kiểm tra liên kết trong email…</p>
        ) : null
      }
    >
      {link.kind === "checking" ? (
        <div aria-busy="true" className="flex flex-col gap-4">
          <p role="status" className="sr-only">
            Đang kiểm tra liên kết…
          </p>
          <Skeleton className="h-[84px]" />
          <Skeleton className="h-[84px]" />
          <Skeleton className="mt-2 h-14 rounded-full" />
        </div>
      ) : link.kind === "expired" ? (
        <div className="flex flex-col gap-4">
          <div role="alert" className="animate-fade-slide-up anim-delay-300 flex flex-col gap-3">
            <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full border border-danger/40 bg-danger/10 text-danger">
              <Unlink className="size-5" />
            </span>
            <p className="text-[24px] font-semibold leading-tight tracking-[-0.03em] text-fg">Liên kết đã hết hạn</p>
            <p className="text-[15px] leading-[1.5] text-fg-muted">
              Liên kết đặt lại chỉ dùng được một lần và có thời hạn. Hãy gửi liên kết mới rồi mở thư mới nhất.
            </p>
          </div>
          <div className="animate-fade-slide-up anim-delay-380 mt-2 flex flex-col gap-1">
            <GlassButton variant="primary" size="lg" block onClick={() => nav.navigate("forgot")}>
              Gửi lại liên kết
            </GlassButton>
            <GlassButton variant="ghost" size="md" onClick={nav.finishRecovery} className="self-center text-fg-muted hover:text-fg">
              {leaveLabel}
            </GlassButton>
          </div>
        </div>
      ) : link.kind === "offline" ? (
        <div className="flex flex-col gap-4">
          <FormNotice tone="offline" title={link.message}>
            {OFFLINE_DETAIL}
          </FormNotice>
          <div className="mt-2 flex flex-col gap-1">
            <GlassButton variant="primary" size="lg" block onClick={retry}>
              <RotateCw aria-hidden="true" className="size-[18px]" />
              Thử lại
            </GlassButton>
            <GlassButton variant="ghost" size="md" onClick={nav.finishRecovery} className="self-center text-fg-muted hover:text-fg">
              {leaveLabel}
            </GlassButton>
          </div>
        </div>
      ) : (
        <NewPasswordForm updatePassword={updatePassword} onDone={done} />
      )}
    </AuthLayout>
  );
}

function NewPasswordForm({ updatePassword, onDone }: { updatePassword: (pw: string) => Promise<Result>; onDone: () => void }) {
  const ruleId = useId();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [repeatMsg, setRepeatMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<{ offline: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const repeatRef = useRef<HTMLInputElement>(null);

  const longEnough = password.length >= MIN_PASSWORD;
  const matches = repeat.length > 0 && repeat === password;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const pMsg = newPasswordError(password);
    const rMsg = pMsg ? null : !repeat ? "Hãy nhập lại mật khẩu." : repeat !== password ? ERROR_MESSAGES.password_mismatch : null;
    setPasswordMsg(pMsg);
    setRepeatMsg(rMsg);
    setFormError(null);
    if (pMsg || rMsg) {
      (pMsg ? passwordRef : repeatRef).current?.focus();
      return;
    }
    setBusy(true);
    const res = await updatePassword(password);
    if (res.ok) {
      onDone();
      return;
    }
    setBusy(false);
    if (res.code === "weak_password" || res.code === "missing_password") {
      setPasswordMsg(res.message);
      passwordRef.current?.focus();
    } else {
      setFormError({ offline: res.code === "network", message: res.message });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="animate-fade-slide-up anim-delay-300 flex flex-col gap-2">
        <TextField
          ref={passwordRef}
          label="Mật khẩu mới"
          type="password"
          name="new-password"
          autoComplete="new-password"
          enterKeyHint="next"
          value={password}
          error={passwordMsg}
          {...(passwordMsg ? {} : { "aria-describedby": ruleId })}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordMsg) setPasswordMsg(null);
          }}
        />
        {passwordMsg ? null : (
          <p id={ruleId} className={`flex items-center gap-1.5 text-[13px] leading-snug ${longEnough ? "text-success" : "text-fg-subtle"}`}>
            {longEnough ? (
              <Check aria-hidden="true" className="size-4 shrink-0" />
            ) : (
              <span aria-hidden="true" className="ml-1 mr-1 block size-1.5 shrink-0 rounded-full bg-current" />
            )}
            {longEnough ? `Đủ tối thiểu ${MIN_PASSWORD} ký tự` : `Tối thiểu ${MIN_PASSWORD} ký tự`}
          </p>
        )}
      </div>
      <TextField
        ref={repeatRef}
        className="animate-fade-slide-up anim-delay-380"
        label="Nhập lại mật khẩu mới"
        type="password"
        name="confirm-password"
        autoComplete="new-password"
        enterKeyHint="done"
        value={repeat}
        error={repeatMsg}
        hint={matches ? "Hai mật khẩu đã khớp" : undefined}
        onChange={(e) => {
          setRepeat(e.target.value);
          if (repeatMsg) setRepeatMsg(null);
        }}
      />

      {formError ? (
        <FormNotice tone={formError.offline ? "offline" : "error"} title={formError.message}>
          {formError.offline ? OFFLINE_DETAIL : null}
        </FormNotice>
      ) : null}

      <div className="animate-fade-slide-up anim-delay-450 mt-2">
        <GlassButton type="submit" variant="primary" size="lg" block aria-disabled={busy || undefined}>
          {busy ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" /> : null}
          {busy ? "Đang lưu…" : "Lưu mật khẩu"}
        </GlassButton>
      </div>
    </form>
  );
}
