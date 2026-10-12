"use client";

import { ExerciseCard } from "@/src/components/workout/exercise-card";
import { cn } from "@/src/lib/cn";
import type { Exercise } from "@/src/types/workout";

interface ExerciseGridProps {
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
  /** Exercise ids ticked in the running session. */
  doneIds?: readonly string[];
  /** Delay (ms) of the first row's entrance; rows stagger by 60 ms. */
  baseDelayMs?: number;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
}

/** The day's exercises as one glass panel of rows (no card-in-card), staggered entrance. */
export function ExerciseGrid({ exercises, onSelectExercise, doneIds = [], baseDelayMs = 0, className, ...rest }: ExerciseGridProps) {
  return (
    <ol
      {...rest}
      data-testid="exercise-grid"
      className={cn("glass-card divide-y divide-line overflow-hidden rounded-card", className)}
    >
      {exercises.map((exercise, index) => (
        <li
          key={exercise.id}
          className="animate-fade-slide-up"
          style={{ animationDelay: `${baseDelayMs + Math.min(index, 8) * 60}ms` }}
        >
          <ExerciseCard exercise={exercise} index={index + 1} onSelect={onSelectExercise} done={doneIds.includes(exercise.id)} />
        </li>
      ))}
    </ol>
  );
}
