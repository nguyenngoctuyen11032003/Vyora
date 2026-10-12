"use client";

import { Layers, Repeat2, StickyNote, X } from "lucide-react";
import { MuscleBadge } from "@/src/components/shared/muscle-badge";
import { DialogDescription, DialogTitle } from "@/src/components/ui/dialog";
import { DrawerDescription, DrawerTitle } from "@/src/components/ui/drawer";
import { ExerciseVideo } from "@/src/components/workout/exercise-video";
import { cn } from "@/src/lib/cn";
import type { Exercise } from "@/src/types/workout";

interface ExerciseDetailContentProps {
  exercise: Exercise;
  variant: "drawer" | "dialog";
  onClose: () => void;
}

export function ExerciseDetailContent({ exercise, variant, onClose }: ExerciseDetailContentProps) {
  const Title = variant === "dialog" ? DialogTitle : DrawerTitle;
  const Description = variant === "dialog" ? DialogDescription : DrawerDescription;
  const canSplit = variant === "dialog" && Boolean(exercise.video.embedUrl);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-3 md:px-8 md:pt-7">
        <div className="min-w-0 py-0.5">
          <p className="text-[13px] text-fg-muted">Chi tiết bài tập</p>
          <Title className="mt-1 text-[30px] font-semibold leading-[1] tracking-[-0.045em] text-fg md:text-[40px]">
            {exercise.name}
          </Title>
          <Description className="mt-2 text-[15px] leading-snug text-fg-muted">
            {exercise.vietnameseName ?? exercise.muscleGroups.join(", ")}
          </Description>
        </div>
        <button
          type="button"
          aria-label="Đóng chi tiết bài tập"
          onClick={onClose}
          className="glass flex size-11 shrink-0 items-center justify-center rounded-full text-fg"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </button>
      </div>

      <div
        className={cn(
          "pb-safe min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line px-5 pt-5 md:px-8 md:pt-6",
          canSplit && "md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscleGroups.map((group) => <MuscleBadge key={group} label={group} />)}
          </div>

          <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-2">
            <div className="stat-card min-w-[104px] px-4 py-4">
              <dt className="flex items-center gap-1.5 text-[13px] text-fg-muted">
                <Layers aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                Số set
              </dt>
              <dd className="num-display mt-3 text-[56px] text-fg">{exercise.sets}</dd>
            </div>
            <div className="stat-card min-w-0 px-4 py-4">
              <dt className="flex items-center gap-1.5 text-[13px] text-fg-muted">
                <Repeat2 aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                Số rep
              </dt>
              <dd className="tabular mt-3 text-[22px] font-semibold leading-[1.15] tracking-[-0.04em] text-fg [overflow-wrap:anywhere]">
                {exercise.reps}
              </dd>
            </div>
          </dl>

          {exercise.description && <p className="mt-6 text-[15px] leading-7 text-fg-muted">{exercise.description}</p>}

          {exercise.note && (
            <div className="mt-6 flex gap-3 rounded-[20px] bg-gold-soft p-4">
              <StickyNote aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gold">Ghi chú</p>
                <p className="mt-1 text-[15px] leading-6 text-fg">{exercise.note}</p>
              </div>
            </div>
          )}

          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[13px] text-fg-muted">Lưu ý kỹ thuật</h3>
              <ol className="mt-4">
                {exercise.instructions.map((instruction, index) => (
                  <li key={instruction} className="relative flex gap-4 pb-5 last:pb-0">
                    {index < exercise.instructions!.length - 1 && (
                      <span aria-hidden="true" className="absolute bottom-0 left-[15px] top-8 w-px bg-line-strong" />
                    )}
                    <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-full bg-stat text-[13px] font-semibold text-gold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="pt-1 text-[15px] leading-6 text-fg/90">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <section className={cn("mt-10 min-w-0 border-t border-line pb-6 pt-6", canSplit && "md:mt-0 md:border-t-0 md:pt-0")}>
          <h3 className="mb-4 flex items-center justify-between text-[13px] text-fg-muted">
            Video hướng dẫn
            <span className="tabular text-fg-subtle">{exercise.video.aspectRatio}</span>
          </h3>
          <ExerciseVideo video={exercise.video} />
        </section>
      </div>
    </div>
  );
}
