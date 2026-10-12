"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  /** Vietnamese error under the field (sets aria-invalid). */
  error?: string | null;
  /** Helper line under the field when there is no error. */
  hint?: string;
  /** type="password" gets a 44 px show/hide toggle. */
  type?: "text" | "email" | "password" | "number";
}

/** Glass text input with label, hint/error and an optional password visibility toggle. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, type = "text", className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className="text-[14px] font-medium text-fg-muted">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? msgId : undefined}
          className={cn(
            "h-14 w-full rounded-2xl border bg-white/[0.06] px-4 text-[17px] text-fg outline-none transition-[border-color,background-color] duration-150 placeholder:text-fg-subtle focus:border-white/40 focus:bg-white/[0.09] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
            error ? "border-danger/80" : "border-white/12",
            isPassword && "pr-14",
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={visible}
            aria-controls={inputId}
            className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-fg-muted hover:text-fg"
          >
            {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={msgId} role="alert" className="flex items-start gap-1.5 text-[14px] leading-snug text-danger">
          <AlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-[13px] leading-snug text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
