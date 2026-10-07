"use client";

import { ExerciseCard } from "@/src/components/workout/exercise-card";
import type { Exercise } from "@/src/types/workout";

interface ExerciseGridProps {
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
}

export function ExerciseGrid({ exercises, onSelectExercise }: ExerciseGridProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2" data-testid="exercise-grid">
      {exercises.map((exercise, index) => (
        <div key={exercise.id} className="reveal-in min-w-0" style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}>
          <ExerciseCard exercise={exercise} index={index + 1} onSelect={onSelectExercise} />
        </div>
      ))}
    </div>
  );
}
