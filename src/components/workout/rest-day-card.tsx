"use client";

import { BedDouble, Droplets, Footprints } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";
import { findNextWorkoutDay } from "@/src/lib/day-utils";
import type { WorkoutDay } from "@/src/types/workout";

interface RestDayCardProps {
  day: WorkoutDay;
  plan: WorkoutDay[];
  /** Action buttons ("Vẫn tập theo giáo án" / "Hoạt động khác"); omitted while a session is running. */
  actions?: ReactNode;
  className?: string;
}

const recoveryTips = [
  { icon: Footprints, text: "Đi bộ nhẹ hoặc giãn cơ 15–20 phút" },
  { icon: BedDouble, text: "Ngủ đủ giấc để cơ phục hồi" },
  { icon: Droplets, text: "Uống đủ nước trong ngày" },
];

/** Rest-day panel: why rest matters, three recovery tips, the next plan day and the actions. */
export function RestDayCard({ day, plan, actions, className }: RestDayCardProps) {
  const next = findNextWorkoutDay(day.id, plan);

  return (
    <section aria-labelledby={`rest-${day.id}`} className={cn("glass-card rounded-card p-5", className)}>
      <h3 id={`rest-${day.id}`} className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-fg">
        Phục hồi để tập tốt hơn
      </h3>
      <p className="mt-2 text-[15px] leading-6 text-fg-muted">
        Cơ bắp phát triển trong lúc nghỉ. Nếu vẫn muốn vận động, đạp xe nhẹ hoặc bơi là lựa chọn hợp lý.
      </p>

      {actions ? <div className="mt-5 flex flex-col gap-2">{actions}</div> : null}

      <ul className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
        {recoveryTips.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-[15px] text-fg">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stat text-gold">
              <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
            </span>
            {text}
          </li>
        ))}
      </ul>

      {next && (
        <p className="mt-5 text-[14px] text-fg-muted">
          Buổi kế tiếp: <span className="font-medium text-fg">{next.fullLabel} · {next.title}</span>
        </p>
      )}
    </section>
  );
}
