import { cn } from "@/src/lib/cn";

export function MuscleBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-background/40 px-2 py-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1 rotate-45 bg-accent/80" />
      {label}
    </span>
  );
}
