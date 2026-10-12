"use client";

import type { ReactNode } from "react";
import { ScreenBackground } from "@/src/components/f1";
import { cn } from "@/src/lib/cn";

export interface AuthLayoutProps {
  /** Small label above the title (text-fg-muted 16 px, template "location" line). */
  eyebrow: string;
  /** Title lines; each line enters with its own speedReveal. */
  title: [string, string?];
  /** "brand" = 64 px semibold (login), "page" = 48 px regular (forgot / reset). */
  titleSize?: "brand" | "page";
  /** Sub line under the title. */
  lead?: ReactNode;
  /** Bottom block (form, status, actions). */
  children: ReactNode;
}

/**
 * Shared frame of the three auth screens (spec §3.3): F1 background with a dark overlay fading into
 * --bg, header block at the top (eyebrow, speedReveal title, gold race line, lead), content pinned to
 * the bottom where the thumb is. Designed for a 390 px box (no viewport breakpoints).
 */
export function AuthLayout({ eyebrow, title, titleSize = "page", lead, children }: AuthLayoutProps) {
  const brand = titleSize === "brand";
  return (
    <div className="relative flex min-h-full flex-col px-5 pb-[calc(var(--app-bottom)+24px)] pt-[var(--app-top)]">
      <ScreenBackground overlayClassName="bg-gradient-to-b from-black/50 via-black/70 via-45% to-bg to-80%" />

      <div className="relative z-10 mt-3">
        <p className="animate-fade-slide-up anim-delay-100 flex items-center gap-2 text-[16px] text-fg-muted">
          <span aria-hidden="true" className="block size-1.5 rounded-full bg-gold" />
          {eyebrow}
        </p>
        <h2
          className={cn(
            "mt-2 text-fg",
            brand
              ? "text-[64px] font-semibold leading-[0.86] tracking-[-0.05em]"
              : "text-[48px] font-normal leading-[0.98] tracking-[-0.05em]",
          )}
        >
          <span className="animate-speed-reveal anim-delay-150 block">{title[0]}</span>
          {title[1] ? <span className="animate-speed-reveal anim-delay-250 block">{title[1]}</span> : null}
        </h2>
        <span aria-hidden="true" className="animate-race-line anim-delay-500 mt-4 block h-[3px] w-12 rounded-full bg-gold" />
        {lead ? <div className="animate-fade-slide-up anim-delay-350 mt-4 max-w-[34ch] text-[16px] leading-[1.45] text-fg-muted">{lead}</div> : null}
      </div>

      <div className="relative z-10 mt-auto pt-10">{children}</div>
    </div>
  );
}
