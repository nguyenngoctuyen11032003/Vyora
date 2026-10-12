"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useViewport } from "@/src/components/f1/viewport";
import { cn } from "@/src/lib/cn";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Visible title (also the dialog's accessible name). */
  title: ReactNode;
  /** Optional sub line under the title (accessible description). */
  description?: ReactNode;
  /** 'tall' = 90 % of the viewport (ActivitySheet), 'auto' = fits content up to 90 % (FinishSheet). */
  height?: "tall" | "auto";
  /** Sticky footer (main actions), stays above the safe area. */
  footer?: ReactNode;
  /** Content above the scroll area that must not scroll (e.g. a search field). */
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Bottom sheet primitive (Radix Dialog): focus trap, Escape, focus return, aria-modal. Renders inside
 * the current viewport (the phone on desktop) via useViewport().host.
 */
export function Sheet({ open, onOpenChange, title, description, height = "auto", footer, header, children, className }: SheetProps) {
  const { host } = useViewport();
  const pos = host ? "absolute" : "fixed";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={host ?? undefined}>
        <Dialog.Overlay className={cn(pos, "overlay-fade pointer-events-auto inset-0 z-40 bg-black/60")} />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            pos,
            "sheet-content pointer-events-auto inset-x-0 bottom-0 z-40 flex max-h-[90%] flex-col rounded-t-[28px] border border-b-0 border-glass-border bg-[#11162a]/95 text-fg shadow-[0_-24px_60px_-20px_rgb(0_0_0/0.8)] outline-none backdrop-blur-xl",
            height === "tall" && "h-[90%]",
            className,
          )}
        >
          <div aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/25" />
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-3">
            <div className="min-w-0">
              <Dialog.Title className="text-[24px] font-semibold leading-tight tracking-[-0.03em]">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-[14px] leading-snug text-fg-muted">{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Đóng"
              className="glass -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-fg"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </Dialog.Close>
          </div>
          {header ? <div className="shrink-0 px-5 pb-3">{header}</div> : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
          {footer ? (
            <div className="shrink-0 border-t border-line px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">{footer}</div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
