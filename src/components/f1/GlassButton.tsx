"use client";

import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

export type GlassButtonVariant = "glass" | "primary" | "white" | "nav" | "ghost" | "danger";
export type GlassButtonSize = "sm" | "md" | "lg" | "icon" | "circle" | "nav";

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * glass   — coffee liquid glass (secondary actions)
   * primary — gold #EDB40B with dark text (one main action per screen)
   * white   — solid white with dark text (menu "Đăng xuất", profile nav button)
   * nav     — F1 square nav glass (white 15 % + blur 12)
   * ghost   — text only, glass on hover
   * danger  — glass with red text (destructive confirmations)
   */
  variant?: GlassButtonVariant;
  /** sm 44px · md 48px · lg 56px (pill) · icon 44×44 · circle 58×44 (coffee) · nav 56×56 square. */
  size?: GlassButtonSize;
  /** Stretch to the container width. */
  block?: boolean;
  /** Render the child element (e.g. an <a>) with the button styles. */
  asChild?: boolean;
}

const VARIANTS: Record<GlassButtonVariant, string> = {
  glass: "glass text-fg",
  primary:
    "bg-gold text-gold-ink font-semibold shadow-[0_10px_30px_-12px_rgb(237_180_11/0.6)] hover:bg-[#f5c330] active:scale-[0.97]",
  white: "bg-white text-[#0a0e1c] font-semibold hover:bg-white/90 active:scale-[0.97]",
  nav: "glass-nav text-fg hover:bg-white/25 active:scale-[0.96]",
  ghost: "bg-transparent text-fg hover:bg-white/8 active:scale-[0.97]",
  danger: "glass text-danger",
};

const SIZES: Record<GlassButtonSize, string> = {
  sm: "min-h-11 px-4 text-[15px] rounded-full gap-2",
  md: "min-h-12 px-5 text-[16px] rounded-full gap-2",
  lg: "min-h-14 px-6 text-[17px] rounded-full gap-2.5",
  icon: "size-11 rounded-full",
  circle: "h-11 w-[58px] rounded-[22px]",
  nav: "size-14 rounded-none",
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { variant = "glass", size = "md", block, asChild, className, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center font-medium leading-none tracking-[-0.01em] transition-[transform,background-color,opacity] duration-150 disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
});
