"use client";

import { useCallback, useEffect, useState } from "react";

/** Countdown for "Gửi lại" buttons: `start()` locks for `seconds`; `remaining` counts down to 0. */
export function useCooldown(seconds: number): { remaining: number; active: boolean; start: () => void } {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (until === 0) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= until) setUntil(0);
    }, 250);
    return () => window.clearInterval(id);
  }, [until]);

  const start = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setUntil(t + seconds * 1000);
  }, [seconds]);

  const remaining = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
  return { remaining, active: remaining > 0, start };
}
