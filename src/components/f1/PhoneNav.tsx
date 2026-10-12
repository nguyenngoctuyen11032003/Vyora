"use client";

import { UserRound } from "lucide-react";
import { asset, LOGO_SRC } from "@/src/lib/env";
import { cn } from "@/src/lib/cn";

export interface PhoneNavProps {
  onProfile?: () => void;
  onMenu?: () => void;
  /** Profile screen is showing (aria-current). */
  profileActive?: boolean;
  menuOpen?: boolean;
  /** Content scrolled under the nav: adds a dark fade so the logo stays readable. */
  scrolled?: boolean;
  /** Hide the two buttons (auth screens). */
  minimal?: boolean;
  className?: string;
}

/** Top bar of every screen: logo left, white profile square + glass menu square right (F1 template). */
export function PhoneNav({ onProfile, onMenu, profileActive, menuOpen, scrolled, minimal, className }: PhoneNavProps) {
  return (
    <header
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-30 pt-[calc(env(safe-area-inset-top)+20px)] transition-[background-color] duration-300",
        // Solid behind the bar, then a short fade: scrolled text never shows through the logo or buttons.
        scrolled && "bg-[linear-gradient(to_bottom,var(--bg)_0,var(--bg)_calc(100%-28px),transparent)] pb-7",
        className,
      )}
    >
      <div className="flex h-14 items-center justify-between px-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, tiny logo */}
        <img src={asset(LOGO_SRC)} alt="Vyora" className="pointer-events-auto size-12 object-contain" />
        {!minimal && (
          <div className="pointer-events-auto flex items-center">
            <button
              type="button"
              onClick={onProfile}
              aria-label="Hồ sơ"
              aria-current={profileActive ? "page" : undefined}
              className="flex size-14 items-center justify-center bg-white text-[#0a0e1c] transition-transform duration-150 hover:bg-white/90 active:scale-[0.96]"
            >
              <UserRound aria-hidden="true" className="size-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={onMenu}
              aria-label="Mở menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen ?? false}
              className="glass-nav flex size-14 flex-col items-center justify-center gap-[5px] transition-[transform,background-color] duration-150 hover:bg-white/25 active:scale-[0.96]"
            >
              <span aria-hidden="true" className="block h-[2px] w-[21px] rounded-full bg-white" />
              <span aria-hidden="true" className="block h-[2px] w-[10px] translate-x-[-5.5px] rounded-full bg-white" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
