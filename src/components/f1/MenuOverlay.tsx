"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, X } from "lucide-react";
import type { ReactNode } from "react";
import { useViewport } from "@/src/components/f1/viewport";
import { cn } from "@/src/lib/cn";

export interface MenuItem {
  id: string;
  label: string;
  /** Internal action (navigate). The menu closes before it runs. */
  onSelect?: () => void;
  /** External link (opens in a new tab, shows ↗). */
  href?: string;
  /** Current screen → aria-current + gold marker. */
  current?: boolean;
}

export interface MenuOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MenuItem[];
  /** Small line at the top (signed-in email). */
  caption?: ReactNode;
  /** Bottom area (white "Đăng xuất" button). */
  footer?: ReactNode;
}

/** Full-screen red F1 menu: stagger slide-in, hover gold, focus trap + Escape (Radix Dialog). */
export function MenuOverlay({ open, onOpenChange, items, caption, footer }: MenuOverlayProps) {
  const { host } = useViewport();
  const pos = host ? "absolute" : "fixed";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={host ?? undefined}>
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(pos, "overlay-fade f1-menu-bg pointer-events-auto inset-0 z-50 flex flex-col text-fg outline-none")}
        >
          <div className="shrink-0 pt-[calc(env(safe-area-inset-top)+20px)]">
            <div className="flex h-14 items-center justify-between pl-6">
              <Dialog.Title className="text-[15px] font-medium text-white/75">Menu</Dialog.Title>
              <Dialog.Close aria-label="Đóng menu" className="glass-nav flex size-14 items-center justify-center text-white">
                <X aria-hidden="true" className="size-6" strokeWidth={1.8} />
              </Dialog.Close>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-6">
            {caption ? <p className="menu-item-in mb-4 truncate text-[14px] text-white/70">{caption}</p> : null}
            <nav aria-label="Menu">
              <ul className="flex flex-col">
                {items.map((item, i) => {
                  const style = { animationDelay: `${0.1 + i * 0.08}s` };
                  const cls = cn(
                    "menu-item-in group flex min-h-14 w-full items-center gap-3 py-2 text-left text-[30px] font-bold leading-tight tracking-[-0.03em] transition-colors duration-200 hover:text-gold focus-visible:text-gold",
                    item.current && "text-gold",
                  );
                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noreferrer" className={cls} style={style}>
                          {item.label}
                          <ArrowUpRight aria-hidden="true" className="size-6 opacity-70" strokeWidth={2} />
                          <span className="sr-only">(mở tab mới)</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          className={cls}
                          style={style}
                          aria-current={item.current ? "page" : undefined}
                          onClick={() => {
                            onOpenChange(false);
                            item.onSelect?.();
                          }}
                        >
                          {item.current && <span aria-hidden="true" className="h-[3px] w-5 rounded-full bg-gold" />}
                          {item.label}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
            {footer ? (
              <div className="menu-item-in mt-auto pt-8" style={{ animationDelay: `${0.1 + items.length * 0.08}s` }}>
                {footer}
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
