"use client";

import { Moon, Play, Shapes } from "lucide-react";
import { GlassButton } from "@/src/components/f1";
import { kcalPerHour, planVariant } from "@/src/lib/calories";
import { formatInt } from "@/src/lib/format";
import type { WorkoutDay } from "@/src/types/workout";

export interface SessionEmptyProps {
  /** Plan day of today (may be a rest day), null when the plan has no entry for today. */
  today: WorkoutDay | null;
  weightKg: number;
  onStartPlan(day: WorkoutDay): void;
  onOtherActivity(): void;
  onOpenToday(): void;
}

/** "Đang tập" without a session: what to start, two big actions (spec §3.3). */
export function SessionEmpty({ today, weightKg, onStartPlan, onOtherActivity, onOpenToday }: SessionEmptyProps) {
  const workout = today && !today.isRestDay ? today : null;
  const variant = workout ? planVariant(workout) : null;

  return (
    <>
      <div className="relative z-10 mt-4">
        <p className="animate-fade-slide-up anim-delay-200 text-[16px] text-fg-muted">Đang tập</p>
        <h2 className="animate-fade-slide-up anim-delay-300 mt-1 text-[48px] font-normal leading-[0.95] tracking-[-0.05em]">
          Chưa có
          <br />
          buổi tập
        </h2>
      </div>

      {/* Decorative idle clock, the template's fading big number. */}
      <p aria-hidden="true" className="animate-scale-in anim-delay-500 text-fade num-display relative z-10 mt-10 text-[110px]">
        00:00
      </p>

      <div className="animate-fade-slide-up anim-delay-700 relative z-10 mt-auto pt-10">
        {workout && variant ? (
          <div className="mb-5">
            <p className="text-[14px] text-fg-muted">Lịch hôm nay · {workout.fullLabel}</p>
            <p className="mt-1 text-[22px] font-medium leading-tight tracking-[-0.02em]">{workout.title}</p>
            <p className="mt-1.5 text-[14px] text-fg-muted">
              {workout.exercises.length} bài · {variant.label} · ~{formatInt(kcalPerHour(variant.met, weightKg))} kcal/giờ
            </p>
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-3">
            <Moon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-muted" strokeWidth={1.8} />
            <p className="text-[15px] leading-snug text-fg-muted">
              Hôm nay là ngày nghỉ phục hồi. Một hoạt động nhẹ như đạp xe hay bơi vẫn là lựa chọn tốt.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {workout ? (
            <GlassButton variant="primary" size="lg" block onClick={() => onStartPlan(workout)}>
              <Play aria-hidden="true" className="size-5" fill="currentColor" strokeWidth={0} />
              Theo lịch hôm nay
            </GlassButton>
          ) : (
            <GlassButton size="lg" block onClick={onOpenToday}>
              Xem lịch hôm nay
            </GlassButton>
          )}
          <GlassButton variant={workout ? "glass" : "primary"} size="lg" block onClick={onOtherActivity}>
            <Shapes aria-hidden="true" className="size-5" strokeWidth={1.8} />
            Hoạt động khác
          </GlassButton>
        </div>
      </div>
    </>
  );
}
