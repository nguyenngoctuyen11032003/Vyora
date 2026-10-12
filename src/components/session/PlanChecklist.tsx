"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/src/lib/cn";
import type { WorkoutDay } from "@/src/types/workout";

export interface PlanChecklistProps {
  day: WorkoutDay;
  checked: string[];
  onToggle(exerciseId: string): void;
}

/** Exercises of a plan session, tap to tick (tracking only, no kcal effect). */
export function PlanChecklist({ day, checked, onToggle }: PlanChecklistProps) {
  const titleId = useId();
  const done = day.exercises.filter((x) => checked.includes(x.id)).length;
  return (
    <section aria-labelledby={titleId}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 id={titleId} className="text-[20px] font-medium tracking-[-0.02em]">
          Bài tập
        </h3>
        <p className="tabular text-[15px] text-fg-muted">
          Xong {done}/{day.exercises.length}
        </p>
      </div>
      <ul className="glass-card overflow-hidden rounded-card">
        {day.exercises.map((x, i) => {
          const isDone = checked.includes(x.id);
          return (
            <li key={x.id} className={cn(i > 0 && "border-t border-line")}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                onClick={() => onToggle(x.id)}
                className="flex min-h-16 w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isDone ? "border-gold bg-gold text-gold-ink" : "border-line-strong text-transparent",
                  )}
                >
                  <Check className="size-4" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[16px] font-medium leading-snug", isDone && "text-fg-muted line-through decoration-white/40")}>
                    {x.name}
                  </span>
                  <span className="tabular mt-0.5 block text-[15px] text-fg-muted">
                    {x.sets} × {x.reps}
                  </span>
                  {x.vietnameseName ? <span className="block truncate text-[13px] text-fg-subtle">{x.vietnameseName}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
