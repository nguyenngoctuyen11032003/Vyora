"use client";

import { ArrowRight, BedDouble, Droplets, Footprints } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { findNextWorkoutDay } from "@/src/lib/day-utils";
import type { WorkoutDay } from "@/src/types/workout";

interface RestDayCardProps {
  day: WorkoutDay;
  plan: WorkoutDay[];
  onSelectDay: (dayId: string) => void;
}

const recoveryTips = [
  { icon: Footprints, text: "Đi bộ nhẹ hoặc giãn cơ 15–20 phút" },
  { icon: BedDouble, text: "Ngủ đủ giấc để cơ phục hồi" },
  { icon: Droplets, text: "Uống đủ nước trong ngày" },
];

export function RestDayCard({ day, plan, onSelectDay }: RestDayCardProps) {
  const nextWorkoutDay = findNextWorkoutDay(day.id, plan);
  const actionLabel = day.id === "sunday" ? "Xem trước lịch Thứ 2" : "Xem lịch ngày tập tiếp theo";

  return (
    <section
      key={day.id}
      className="crop-marks reveal-in relative mt-6 overflow-hidden rounded-[24px] border border-border bg-card/80 p-5 sm:p-8"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 -right-2 select-none font-display text-[clamp(7rem,30vw,14rem)] font-bold uppercase leading-none text-transparent [-webkit-text-stroke:1px_var(--border-strong)]"
      >
        Nghỉ
      </span>

      <div className="relative">
        <p className="label-mono text-subtle-foreground">Hướng dẫn phục hồi</p>
        <h3 className="mt-2 font-display text-[28px] font-semibold uppercase leading-none text-foreground sm:text-[32px]">
          Phục hồi để tập tốt hơn
        </h3>
        <p className="mt-3 max-w-[52ch] text-sm leading-6 text-muted-foreground">
          Cơ bắp phát triển trong lúc nghỉ. Hôm nay không cần tập nặng, hãy để cơ thể sẵn sàng cho buổi tiếp theo.
        </p>

        <ol className="mt-6 grid gap-2 sm:grid-cols-3 sm:gap-3">
          {recoveryTips.map(({ icon: Icon, text }, index) => (
            <li
              key={text}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-3.5 py-3 text-sm text-foreground backdrop-blur-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-strong text-accent">
                <Icon aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </span>
              <span className="min-w-0">
                <span className="label-mono tabular block text-subtle-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span className="mt-0.5 block leading-snug">{text}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Button
            className="h-12 rounded-xl bg-accent px-5 font-semibold text-accent-foreground shadow-[0_12px_32px_-14px_rgb(194_236_107/0.55)] transition-[background-color,transform] duration-200 hover:bg-accent/90 active:scale-[0.98]"
            disabled={!nextWorkoutDay}
            onClick={() => nextWorkoutDay && onSelectDay(nextWorkoutDay.id)}
            type="button"
          >
            {actionLabel}
            <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </Button>
          {nextWorkoutDay && (
            <p className="text-sm text-muted-foreground">
              Buổi kế tiếp: <span className="font-medium text-foreground">{nextWorkoutDay.title}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
