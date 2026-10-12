import { AlertCircle, CheckCircle2, WifiOff, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export type FormNoticeTone = "error" | "offline" | "success";

const ICONS: Record<FormNoticeTone, LucideIcon> = { error: AlertCircle, offline: WifiOff, success: CheckCircle2 };

export interface FormNoticeProps {
  tone: FormNoticeTone;
  title: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Form-level message (not tied to one field): icon + bold line + optional detail, never colour alone.
 * Errors use role="alert", success role="status".
 */
export function FormNotice({ tone, title, children, className }: FormNoticeProps) {
  const Icon = ICONS[tone];
  const success = tone === "success";
  return (
    <div
      role={success ? "status" : "alert"}
      className={cn(
        "animate-fade-slide-up flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-[15px] leading-snug backdrop-blur-md",
        success ? "border-success/35 bg-success/[0.08]" : "border-danger/40 bg-danger/[0.09]",
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn("mt-px size-5 shrink-0", success ? "text-success" : "text-danger")} />
      <div className="min-w-0">
        <p className="font-semibold text-fg">{title}</p>
        {children ? <div className="mt-1 text-fg-muted">{children}</div> : null}
      </div>
    </div>
  );
}
