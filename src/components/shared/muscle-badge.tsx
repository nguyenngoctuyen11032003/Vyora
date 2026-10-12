import { cn } from "@/src/lib/cn";

/** Muscle-group tag (static, not a button). */
export function MuscleBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full bg-stat px-3 text-[13px] font-medium text-fg-muted",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1 rounded-full bg-gold" />
      {label}
    </span>
  );
}
