"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";
import { GlassButton } from "@/src/components/f1";
import { MAX_SAVE_MINUTES, MIN_SAVE_MINUTES } from "@/src/lib/session";

export interface MinutesStepperProps {
  /** Raw text of the input (lets the user clear it while typing). */
  value: string;
  /** Parsed, clamped minutes (1–300). */
  minutes: number;
  onChange(text: string): void;
  /** Normalises the text to `minutes` (on blur and after −/+). */
  onCommit(minutes: number): void;
}

/** − [ 60 ] phút + : 1–300 minutes, 44 px targets, numeric keypad. */
export function MinutesStepper({ value, minutes, onChange, onCommit }: MinutesStepperProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-[14px] font-medium text-fg-muted">
        Thời gian tập
      </label>
      <div className="mt-2 flex items-center gap-3">
        <GlassButton
          size="icon"
          className="size-12"
          aria-label="Bớt 1 phút"
          disabled={minutes <= MIN_SAVE_MINUTES}
          onClick={() => onCommit(minutes - 1)}
        >
          <Minus aria-hidden="true" className="size-5" strokeWidth={2} />
        </GlassButton>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-2">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            aria-describedby={`${id}-range`}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
            onBlur={() => onCommit(minutes)}
            style={{ width: `${Math.max(1, value.length) * 0.62 + 0.3}em` }}
            className="num-display rounded-xl bg-transparent text-center text-[64px] leading-none text-fg focus-visible:bg-white/[0.06]"
          />
          <span className="text-[17px] text-fg-muted">phút</span>
        </div>
        <GlassButton
          size="icon"
          className="size-12"
          aria-label="Thêm 1 phút"
          disabled={minutes >= MAX_SAVE_MINUTES}
          onClick={() => onCommit(minutes + 1)}
        >
          <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
        </GlassButton>
      </div>
      <p id={`${id}-range`} className="mt-1 text-center text-[12px] text-fg-subtle">
        Từ {MIN_SAVE_MINUTES} đến {MAX_SAVE_MINUTES} phút
      </p>
    </div>
  );
}
