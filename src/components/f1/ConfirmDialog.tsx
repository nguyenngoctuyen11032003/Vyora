"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, type ReactNode } from "react";
import { GlassButton } from "@/src/components/f1/GlassButton";
import { useViewport } from "@/src/components/f1/viewport";
import { cn } from "@/src/lib/cn";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button (delete, cancel session, sign out with pending rows). */
  destructive?: boolean;
  /** May be async; the button shows a busy state and the dialog closes when it resolves. */
  onConfirm: () => void | Promise<void>;
}

/** Centered confirmation (role="alertdialog") rendered inside the current viewport. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel = "Không", destructive, onConfirm }: ConfirmDialogProps) {
  const { host } = useViewport();
  const [busy, setBusy] = useState(false);
  const pos = host ? "absolute" : "fixed";

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <Dialog.Portal container={host ?? undefined}>
        <Dialog.Overlay className={cn(pos, "overlay-fade pointer-events-auto inset-0 z-50 bg-black/70")} />
        <Dialog.Content
          role="alertdialog"
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            pos,
            "overlay-fade glass-card pointer-events-auto left-1/2 top-1/2 z-50 w-[calc(100%-40px)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-[28px] p-5 text-fg outline-none",
          )}
        >
          <Dialog.Title className="text-[20px] font-semibold leading-tight tracking-[-0.02em]">{title}</Dialog.Title>
          {description ? <Dialog.Description className="mt-2 text-[15px] leading-relaxed text-fg-muted">{description}</Dialog.Description> : null}
          <div className="mt-5 flex flex-col gap-2">
            <GlassButton
              variant={destructive ? "danger" : "primary"}
              size="md"
              block
              onClick={confirm}
              disabled={busy}
              aria-busy={busy}
              className={destructive ? "font-semibold" : undefined}
            >
              {confirmLabel}
            </GlassButton>
            <Dialog.Close asChild>
              <GlassButton variant="ghost" size="md" block disabled={busy}>
                {cancelLabel}
              </GlassButton>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
