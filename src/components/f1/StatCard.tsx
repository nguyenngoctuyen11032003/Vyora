import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export interface StatCardProps {
  label: string;
  /** The number (string or a <CountUp/>). */
  value: ReactNode;
  /** Unit after the number ("cm", "kg"). */
  unit?: string;
  icon?: ReactNode;
  /** Gold number (kcal). */
  accent?: boolean;
  className?: string;
}

/** Coffee-template stat card: white 6 %, radius 24, number 25–28 px, muted label 13 px. */
export function StatCard({ label, value, unit, icon, accent, className }: StatCardProps) {
  return (
    <div className={cn("stat-card flex min-w-0 flex-col justify-between gap-3 p-4", className)}>
      {icon ? <div className="text-fg-muted">{icon}</div> : null}
      <div className="min-w-0">
        <p className={cn("tabular text-[26px] font-medium leading-none tracking-[-0.03em]", accent ? "text-gold" : "text-fg")}>
          {value}
          {unit ? <span className="ml-1 text-[15px] font-normal tracking-normal text-fg-muted">{unit}</span> : null}
        </p>
        <p className="mt-1.5 text-[13px] leading-tight text-fg-muted">{label}</p>
      </div>
    </div>
  );
}
