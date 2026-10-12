"use client";

import { Moon } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { weekdayShortOf } from "@/src/components/workout/day-summary";
import { cn } from "@/src/lib/cn";
import type { WorkoutDay } from "@/src/types/workout";

interface WeeklyDaySelectorProps {
  plan: WorkoutDay[];
  selectedDayId: string;
  todayId: string | null;
  onSelectDay: (dayId: string) => void;
  /** id of the panel the tabs control (the exercise list). */
  panelId?: string;
  className?: string;
}

/**
 * 7-day glass chip strip (T2 … CN). Tabs with roving focus (←/→/Home/End). Today carries a gold dot +
 * "Hôm nay" for screen readers; rest days a moon icon — never colour alone.
 */
export function WeeklyDaySelector({ plan, selectedDayId, todayId, onSelectDay, panelId, className }: WeeklyDaySelectorProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = plan.length - 1;
    const next =
      e.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : e.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    onSelectDay(plan[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div aria-label="Chọn ngày tập" role="tablist" className={cn("grid grid-cols-7 gap-1.5", className)}>
      {plan.map((day, index) => {
        const selected = day.id === selectedDayId;
        const isToday = day.id === todayId;
        return (
          <button
            key={day.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`day-tab-${day.id}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelectDay(day.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              // The ::before fills the 6 px gap so the touch target stays ≥ 44 px on 360 px phones (chip ≈ 41 px).
              "relative flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] before:absolute before:inset-y-0 before:-inset-x-[3px] before:content-[''] text-[15px] leading-none tracking-[-0.02em] transition-[background-color,color,transform] duration-150 active:scale-[0.96]",
              selected ? "bg-white font-semibold text-[#0a0e1c]" : "glass font-medium text-fg",
            )}
          >
            <span aria-hidden="true">{weekdayShortOf(day)}</span>
            <span className="sr-only">{day.fullLabel}</span>
            <span aria-hidden="true" className="flex h-2.5 items-center gap-1">
              {isToday && <span className={cn("size-1.5 rounded-full", selected ? "bg-[#0a0e1c]" : "bg-gold")} />}
              {day.isRestDay && <Moon className={cn("size-2.5", selected ? "text-[#0a0e1c]/70" : "text-fg-subtle")} strokeWidth={2.2} />}
            </span>
            {isToday && <span className="sr-only">, hôm nay</span>}
            {day.isRestDay && <span className="sr-only">, ngày nghỉ</span>}
          </button>
        );
      })}
    </div>
  );
}
