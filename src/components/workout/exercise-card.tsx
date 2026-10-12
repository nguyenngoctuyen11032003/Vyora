"use client";

import { Check, Play, VideoOff } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { isValidYouTubeEmbedUrl } from "@/src/lib/video-utils";
import type { Exercise } from "@/src/types/workout";

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onSelect: (exerciseId: string) => void;
  /** Ticked in the running session's checklist (shown with an icon + text). */
  done?: boolean;
}

/**
 * One exercise row of the Today list: number, name, Vietnamese name, sets × reps, muscle group, and a
 * video marker. The whole row opens the detail dialog/drawer; its accessible name repeats the row content
 * ("Xem hướng dẫn Bench Press, Đẩy ngực thanh đòn, 5 set × …, Ngực, có video").
 */
export function ExerciseCard({ exercise, index, onSelect, done }: ExerciseCardProps) {
  const hasVideo = Boolean(exercise.video.embedUrl && isValidYouTubeEmbedUrl(exercise.video.embedUrl));
  const label = [
    `Xem hướng dẫn ${exercise.name}`,
    exercise.vietnameseName,
    `${exercise.sets} set × ${exercise.reps}`,
    exercise.muscleGroups.join(", "),
    hasVideo ? "có video" : "chưa có video",
    done ? "đã xong" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onSelect(exercise.id)}
      className="group flex min-h-[76px] w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-white/[0.04] active:bg-white/[0.07]"
    >
      <span
        aria-hidden="true"
        className="tabular w-6 shrink-0 self-start pt-[3px] text-[13px] font-medium text-fg-subtle transition-colors group-hover:text-gold"
      >
        {String(index).padStart(2, "0")}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold leading-snug tracking-[-0.02em] text-fg">
          {exercise.name}
        </span>
        {exercise.vietnameseName && (
          <span className="block text-[14px] leading-snug text-fg-muted">
            {exercise.vietnameseName}
          </span>
        )}
        <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[14px] leading-snug">
          <span className="tabular font-semibold text-fg">
            {exercise.sets} set <span className="font-normal text-fg-subtle">×</span> {exercise.reps}
          </span>
          <span className="text-fg-subtle">
            {exercise.muscleGroups.join(", ")}
          </span>
        </span>
        {done && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium text-success">
            <Check aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
            Đã xong
          </span>
        )}
      </span>

      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color] duration-150",
          hasVideo ? "glass text-fg group-hover:bg-gold group-hover:text-gold-ink" : "text-fg-subtle",
        )}
      >
        {hasVideo ? (
          <Play aria-hidden="true" className="ml-0.5 size-4" strokeWidth={2} fill="currentColor" />
        ) : (
          <VideoOff aria-hidden="true" className="size-4" strokeWidth={1.6} />
        )}
      </span>
    </button>
  );
}
