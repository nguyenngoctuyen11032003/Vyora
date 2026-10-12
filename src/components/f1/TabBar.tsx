"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export interface TabBarItem<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
  /** Extra line under the label, e.g. the running clock "12:34" (gold). */
  badge?: ReactNode;
}

export interface TabBarProps<T extends string = string> {
  items: TabBarItem<T>[];
  active: T | null;
  onSelect: (id: T) => void;
  className?: string;
}

/** Floating glass tab bar (phone layout only). Active tab: white label + gold bar, not colour alone. */
export function TabBar<T extends string>({ items, active, onSelect, className }: TabBarProps<T>) {
  return (
    <nav
      aria-label="Điều hướng chính"
      className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))]", className)}
    >
      <ul className="glass-card pointer-events-auto mx-auto flex max-w-[420px] items-stretch rounded-[26px] p-1.5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.8)]">
        {items.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[58px] w-full flex-col items-center justify-center gap-1 rounded-[20px] px-1 pb-2 pt-3 text-[12px] leading-none transition-colors duration-200",
                  isActive ? "bg-white/10 font-semibold text-fg" : "font-medium text-fg-muted hover:text-fg",
                )}
              >
                <Icon aria-hidden="true" className="size-[21px]" strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
                {item.badge ? <span className="tabular text-[11px] font-semibold text-gold">{item.badge}</span> : null}
                {isActive && <span aria-hidden="true" className="absolute top-1 h-[3px] w-5 rounded-full bg-gold" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
