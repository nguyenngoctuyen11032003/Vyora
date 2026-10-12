"use client";

import { Check } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Selected state → aria-pressed, solid white + check icon (never colour alone). */
  selected?: boolean;
  /** Show the check icon when selected (default true). */
  showCheck?: boolean;
}

/** Glass chip (day strip, category row, intensity variants). Min 44 px tall. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected, showCheck = true, className, children, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-pressed={selected ?? false}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-[15px] leading-none transition-[background-color,color,transform] duration-150 active:scale-[0.97]",
        selected ? "bg-white font-semibold text-[#0a0e1c]" : "glass font-medium text-fg",
        className,
      )}
      {...props}
    >
      {selected && showCheck ? <Check aria-hidden="true" className="-ml-0.5 size-4" strokeWidth={2.4} /> : null}
      {children}
    </button>
  );
});
