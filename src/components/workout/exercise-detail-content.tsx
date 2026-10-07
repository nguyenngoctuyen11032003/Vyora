"use client";

import { Layers, Repeat2, StickyNote, X } from "lucide-react";
import { MuscleBadge } from "@/src/components/shared/muscle-badge";
import { Button } from "@/src/components/ui/button";
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
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 pb-4 pt-3 sm:px-7 sm:pt-6">
        <div className="min-w-0 py-0.5">
          <p className="label-mono flex items-center gap-2 text-accent">
            <span aria-hidden="true" className="size-1.5 rotate-45 bg-accent" />
            Chi tiết bài tập
          </p>
          <Title className="mt-2 truncate font-display text-[26px] font-semibold uppercase leading-none tracking-[0.005em] text-foreground sm:text-[32px]">
            {exercise.name}
          </Title>
          <Description className="mt-1.5 truncate text-sm text-muted-foreground">
            {exercise.vietnameseName ?? exercise.muscleGroups.join(", ")}
          </Description>
        </div>
        <Button
          aria-label="Đóng chi tiết bài tập"
          className="size-11 shrink-0 rounded-full border border-border-strong bg-transparent p-0 text-foreground shadow-none transition-[background-color,border-color,transform] duration-200 hover:border-accent hover:bg-accent hover:text-accent-foreground active:scale-[0.94]"
          onClick={onClose}
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </Button>
      </div>

      <div
        className={cn(
          "pb-safe min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-5 sm:px-7 sm:pt-6",
          canSplit && "md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscleGroups.map((group) => <MuscleBadge key={group} label={group} />)}
          </div>

          <dl className="crop-marks mt-5 grid grid-cols-[auto_minmax(0,1fr)] divide-x divide-border rounded-2xl border border-border bg-card">
            <div className="px-4 py-4 sm:px-5">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers aria-hidden="true" className="size-3.5 text-accent" strokeWidth={1.5} />
                Số set
              </dt>
              <dd className="tabular mt-2 font-display text-[40px] font-semibold leading-none text-foreground">{exercise.sets}</dd>
            </div>
            <div className="min-w-0 px-4 py-4 sm:px-5">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Repeat2 aria-hidden="true" className="size-3.5 text-accent" strokeWidth={1.5} />
                Số rep
              </dt>
              <dd className="tabular mt-2 font-display text-[26px] font-semibold leading-tight tracking-[0.01em] text-foreground">
                {exercise.reps}
              </dd>
            </div>
          </dl>

          {exercise.description && <p className="mt-6 text-[15px] leading-7 text-muted-foreground">{exercise.description}</p>}

          {exercise.note && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-accent/25 bg-accent-soft p-4">
              <StickyNote aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="label-mono text-accent">Ghi chú</p>
                <p className="mt-1 text-sm leading-6 text-foreground/90">{exercise.note}</p>
              </div>
            </div>
          )}

          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="mt-8">
              <h3 className="label-mono text-subtle-foreground">Lưu ý kỹ thuật</h3>
              <ol className="mt-4">
                {exercise.instructions.map((instruction, index) => (
                  <li key={instruction} className="relative flex gap-4 pb-5 last:pb-0">
                    {index < exercise.instructions!.length - 1 && (
                      <span aria-hidden="true" className="absolute bottom-0 left-[15px] top-8 w-px bg-border-strong" />
                    )}
                    <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-full border border-border-strong bg-card font-display text-sm font-semibold text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="pt-1 text-sm leading-6 text-foreground/85">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <section
          className={cn(
            "mt-10 min-w-0 border-t border-border pb-6 pt-6",
            canSplit && "md:mt-0 md:border-t-0 md:pt-0",
          )}
        >
          <h3 className="label-mono mb-4 flex items-center justify-between text-subtle-foreground">
            Video hướng dẫn
            <span className="text-subtle-foreground/70">{exercise.video.aspectRatio}</span>
          </h3>
          <ExerciseVideo video={exercise.video} />
        </section>
      </div>
    </div>
  );
}
