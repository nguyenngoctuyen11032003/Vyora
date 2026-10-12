"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/src/hooks/use-media-query";
import { formatInt } from "@/src/lib/format";

export interface CountUpProps {
  value: number;
  /** Default 2200 ms (F1 template). */
  durationMs?: number;
  /** Wait before counting (match the element's anim-delay-*). */
  delayMs?: number;
  /** Default formatInt → "1.850". */
  format?: (n: number) => string;
  className?: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animated number (cubic ease-out). Counts from the previous value (0 on mount). Under
 * prefers-reduced-motion it shows the final value at once. Screen readers only get the final value.
 */
export function CountUp({ value, durationMs = 2200, delayMs = 0, format = formatInt, className }: CountUpProps) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (reduced) {
      from.current = value;
      return;
    }
    let raf = 0;
    const startValue = from.current;
    let startTime = 0;
    const step = (t: number) => {
      if (!startTime) startTime = t;
      const p = Math.min(1, (t - startTime) / durationMs);
      const v = startValue + (value - startValue) * easeOutCubic(p);
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, durationMs, delayMs, reduced]);

  const shown = reduced ? value : display;
  return (
    <span className={className}>
      <span aria-hidden="true">{format(Math.round(shown))}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
