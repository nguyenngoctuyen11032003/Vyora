"use client";

import { useId } from "react";
import { Gauge } from "lucide-react";
import { Chip } from "@/src/components/f1";
import { metLine } from "@/src/lib/calories";
import { WORKOUT_CATEGORY_LABELS, type ActivityDef } from "@/src/lib/fitora";
import type { ActiveSession } from "@/src/types/gym";

export interface IntensityCardProps {
  session: ActiveSession;
  activity: ActivityDef | null;
  onVariant(id: string): void;
}

/** MET + intensity of a non-plan activity (replaces the checklist). */
export function IntensityCard({ session, activity, onVariant }: IntensityCardProps) {
  const titleId = useId();
  const variants = activity?.variants ?? [];
  return (
    <section aria-labelledby={titleId} className="glass-card rounded-card p-4">
      <div className="flex items-center gap-2 text-fg-muted">
        <Gauge aria-hidden="true" className="size-4" strokeWidth={1.8} />
        <h3 id={titleId} className="text-[14px] font-medium">
          Cường độ · {WORKOUT_CATEGORY_LABELS[session.category] ?? "Khác"}
        </h3>
      </div>
      {variants.length > 1 ? (
        <div role="group" aria-label="Chọn cường độ" className="mt-3 flex flex-wrap gap-2">
          {variants.map((v) => (
            <Chip key={v.id} selected={v.id === session.variant} onClick={() => onVariant(v.id)}>
              {v.label}
            </Chip>
          ))}
        </div>
      ) : variants[0] ? (
        <p className="mt-2 text-[17px] font-medium">{variants[0].label}</p>
      ) : null}
      <p className="tabular mt-3 text-[14px] leading-snug text-fg-muted">{metLine(session.met, session.weightKg)}</p>
    </section>
  );
}
