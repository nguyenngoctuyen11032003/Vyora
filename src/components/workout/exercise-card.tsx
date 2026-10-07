"use client";

import { ArrowUpRight, Layers, CirclePlay, Repeat2, VideoOff } from "lucide-react";
import { MuscleBadge } from "@/src/components/shared/muscle-badge";
import { cn } from "@/src/lib/cn";
import { isValidYouTubeEmbedUrl } from "@/src/lib/video-utils";
import type { Exercise } from "@/src/types/workout";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onSelect: (exerciseId: string) => void;
}

export function ExerciseCard({ exercise, index, onSelect }: ExerciseCardProps) {
  const hasVideo = Boolean(exercise.video.embedUrl && isValidYouTubeEmbedUrl(exercise.video.embedUrl));

  return (
    <button
      aria-label={`Xem hướng dẫn ${exercise.name}`}
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-[20px] border border-border bg-card/85 text-left transition-[border-color,background-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-border-strong hover:bg-card-elevated hover:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.8)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={() => onSelect(exercise.id)}
      type="button"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
      />

      <div className="flex w-full flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3.5 sm:gap-4">
          <span className="tabular shrink-0 border-r border-border-strong pr-3.5 font-display text-[38px] font-semibold leading-[0.85] text-subtle-foreground transition-colors duration-300 group-hover:text-accent sm:pr-4 sm:text-[44px]">
            {String(index).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.015em] text-foreground sm:text-lg">
              {exercise.name}
            </h3>
            {exercise.vietnameseName && (
              <p className="mt-0.5 text-sm text-muted-foreground">{exercise.vietnameseName}</p>
            )}
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] font-medium",
              hasVideo ? "border-accent/30 bg-accent-soft text-accent" : "border-border text-subtle-foreground",
            )}
          >
            {hasVideo ? (
              <CirclePlay aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
            ) : (
              <VideoOff aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
            )}
            <span className="sr-only sm:not-sr-only">{hasVideo ? "Có video" : "Chưa có video"}</span>
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">

          <div className="mt-3 flex flex-wrap gap-1.5">
            {exercise.muscleGroups.map((group) => <MuscleBadge key={group} label={group} />)}
          </div>

          <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-background/50">
            <div className="flex items-center gap-3 border-r border-border px-3.5 py-2.5">
              <Layers aria-hidden="true" className="size-4 shrink-0 text-subtle-foreground" strokeWidth={1.5} />
              <div>
                <dt className="label-mono text-subtle-foreground">Set</dt>
                <dd className="tabular mt-0.5 whitespace-nowrap font-display text-2xl font-semibold leading-none text-foreground">
                  {exercise.sets} <span className="font-sans text-xs font-medium text-muted-foreground">set</span>
                </dd>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 px-3.5 py-2.5">
              <Repeat2 aria-hidden="true" className="size-4 shrink-0 text-subtle-foreground" strokeWidth={1.5} />
              <div className="min-w-0">
                <dt className="label-mono text-subtle-foreground">Rep</dt>
                <dd className="tabular mt-0.5 font-display text-xl font-semibold leading-tight [overflow-wrap:anywhere] tracking-[0.01em] text-foreground">
                  {exercise.reps}
                </dd>
              </div>
            </div>
          </dl>

          {exercise.note && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{exercise.note}</p>}

          <span className="mt-auto flex w-full items-center justify-between pt-4 text-sm font-medium text-foreground">
            Xem hướng dẫn
            <span className="flex size-8 items-center justify-center rounded-full border border-border-strong text-muted-foreground transition-[background-color,border-color,color,transform] duration-300 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground">
              <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}
