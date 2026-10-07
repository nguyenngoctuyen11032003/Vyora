"use client";

import { useEffect, useState } from "react";
import { ExerciseGrid } from "@/src/components/workout/exercise-grid";
import { ExerciseDetailDialog } from "@/src/components/workout/exercise-detail-dialog";
import { RestDayCard } from "@/src/components/workout/rest-day-card";
import { WeeklyDaySelector } from "@/src/components/workout/weekly-day-selector";
import { WorkoutDayHeader } from "@/src/components/workout/workout-day-header";
import { getCurrentWorkoutDay } from "@/src/lib/day-utils";
import type { WorkoutDay } from "@/src/types/workout";

interface WorkoutPlannerProps {
  plan: WorkoutDay[];
  initialDayId: string;
  initialTodayId: string;
}

export function WorkoutPlanner({ plan, initialDayId, initialTodayId }: WorkoutPlannerProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [todayId, setTodayId] = useState(initialTodayId);
  const [selectedDayId, setSelectedDayId] = useState(initialDayId);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const selectedDay = plan.find((day) => day.id === selectedDayId) ?? plan[0];
  const selectedExercise = selectedDay.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const localToday = getCurrentWorkoutDay(plan);

      if (localToday) {
        setTodayId(localToday.id);
        setSelectedDayId(localToday.id);
      }

      setHasMounted(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [plan]);

  const selectDay = (dayId: string) => {
    setDetailOpen(false);
    setSelectedExerciseId(null);
    setSelectedDayId(dayId);
  };

  const selectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setDetailOpen(true);
  };

  if (!hasMounted) {
    return (
      <section aria-busy="true" aria-label="Đang xác định lịch hôm nay" className="pt-8 sm:pt-10">
        <div className="flex gap-2 overflow-hidden lg:grid lg:grid-cols-7">
          {plan.map((day) => (
            <div key={day.id} className="h-[112px] min-w-[118px] animate-pulse rounded-[18px] bg-card lg:min-w-0" />
          ))}
        </div>
        <div className="mt-14 h-12 w-72 max-w-full animate-pulse rounded-xl bg-card" />
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <div className="h-60 animate-pulse rounded-[20px] bg-card" />
          <div className="hidden h-60 animate-pulse rounded-[20px] bg-card lg:block" />
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 sm:pt-10">
      <WeeklyDaySelector onSelectDay={selectDay} plan={plan} selectedDayId={selectedDay.id} todayId={todayId} />
      <WorkoutDayHeader day={selectedDay} />
      {!selectedDay.isRestDay && (
        <ExerciseGrid exercises={selectedDay.exercises} onSelectExercise={selectExercise} />
      )}
      {selectedDay.isRestDay && (
        <RestDayCard day={selectedDay} onSelectDay={selectDay} plan={plan} />
      )}
      <ExerciseDetailDialog exercise={selectedExercise} onOpenChange={setDetailOpen} open={detailOpen} />
    </section>
  );
}
