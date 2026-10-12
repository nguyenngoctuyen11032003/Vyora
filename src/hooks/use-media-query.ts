"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string, defaultValue = false) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(query).matches,
    () => defaultValue,
  );
}

/** True when the user asked for reduced motion (count-ups jump to the final value, no entrances). */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false);
}

/** Layout breakpoint of the shell: ≥768px shows the three-phone F1 layout. */
export const DESKTOP_QUERY = "(min-width: 768px)";
