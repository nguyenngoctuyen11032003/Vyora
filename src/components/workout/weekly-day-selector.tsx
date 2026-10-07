"use client";

import { Dumbbell, Moon } from "lucide-react";
import { cn } from "@/src/lib/cn";
import type { WorkoutDay } from "@/src/types/workout";

interface WeeklyDaySelectorProps {
  plan: WorkoutDay[];
  selectedDayId: string;
  todayId: string;
  onSelectDay: (dayId: string) => void;
}

export function WeeklyDaySelector({ plan, selectedDayId, todayId, onSelectDay }: WeeklyDaySelectorProps) {
  return (
    <div
      aria-label="Chọn ngày tập luyện"
      className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0"
      role="tablist"
    >
      {plan.map((day, index) => {
        const isSelected = day.id === selectedDayId;
        const isToday = day.id === todayId;
        const DayIcon = day.isRestDay ? Moon : Dumbbell;

        return (
          <button
            key={day.id}
            aria-selected={isSelected}
            className={cn(
              "group relative flex min-h-[112px] min-w-[118px] snap-start flex-col overflow-hidden rounded-[18px] border px-3.5 pb-3 pt-3 text-left transition-[background-color,border-color,color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] lg:min-w-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isSelected
                ? "border-accent bg-accent text-accent-foreground shadow-[0_12px_32px_-12px_rgb(194_236_107/0.45)]"
                : "border-border bg-card/80 text-foreground hover:-translate-y-0.5 hover:border-border-strong hover:bg-card-elevated",
              day.isRestDay && !isSelected && "border-dashed bg-transparent",
            )}
            onClick={() => onSelectDay(day.id)}
            role="tab"
            type="button"
          >
            <span className="flex w-full items-center justify-between">
              <span
                className={cn(
                  "label-mono tabular",
                  isSelected ? "text-accent-foreground/60" : "text-subtle-foreground",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <DayIcon
                aria-hidden="true"
                className={cn(
                  "size-3.5",
                  isSelected ? "text-accent-foreground/70" : "text-subtle-foreground group-hover:text-muted-foreground",
                )}
                strokeWidth={1.5}
              />
            </span>

            <span className="mt-2 whitespace-nowrap font-display text-[22px] font-semibold uppercase leading-none tracking-[0.01em]">
              {day.shortLabel}
            </span>
            <span
              className={cn(
                "mt-1.5 line-clamp-2 text-xs leading-[1.4]",
                isSelected ? "text-accent-foreground/75" : "text-muted-foreground",
              )}
            >
              {day.isRestDay ? "Ngày nghỉ" : day.muscleGroups.join(", ")}
            </span>

            {isToday && (
              <span
                className={cn(
                  "mt-auto inline-flex w-fit items-center gap-1.5 whitespace-nowrap pt-2 text-[11px] font-semibold",
                  isSelected ? "text-accent-foreground" : "text-accent",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 rounded-full", isSelected ? "bg-accent-foreground" : "bg-accent")}
                />
                Hôm nay
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
