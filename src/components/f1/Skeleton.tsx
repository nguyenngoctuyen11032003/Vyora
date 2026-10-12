import { cn } from "@/src/lib/cn";

/** Pulse placeholder (respects reduced motion through globals.css). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-2xl bg-white/[0.07]", className)} />;
}
