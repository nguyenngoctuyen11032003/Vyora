"use client";

// Spec §3.3 "Hôm nay" (F1 Screen 1): caption + 48px muscle-group title over the day's first video
// thumbnail (6 px blur mask), 7-day glass chip strip, exercise rows → existing ExerciseDetailDialog,
// bottom actions (gold "Bắt đầu buổi tập" + glass "Hoạt động khác", or "Đang tập · 12:34").
import { CalendarClock, Timer } from "lucide-react";
import { useId, useState } from "react";
import { useNav } from "@/src/components/app/nav";
import { GlassButton, HeroPhoto } from "@/src/components/f1";
import { ActivitySheet } from "@/src/components/screens/ActivitySheet";
import { dayCaption, splitTitle } from "@/src/components/workout/day-summary";
import { ExerciseDetailDialog } from "@/src/components/workout/exercise-detail-dialog";
import { ExerciseGrid } from "@/src/components/workout/exercise-grid";
import { RestDayCard } from "@/src/components/workout/rest-day-card";
import { WeeklyDaySelector } from "@/src/components/workout/weekly-day-selector";
import { useActiveSession } from "@/src/hooks/use-active-session";
import { PLAN_ACTIVITY_KEY } from "@/src/lib/calories";
import { findNextWorkoutDay, getCurrentWorkoutDay, getDayHeroImage } from "@/src/lib/day-utils";
import { cn } from "@/src/lib/cn";
import { formatClock } from "@/src/lib/format";
import type { StartSessionInput } from "@/src/types/gym";
import type { WorkoutDay } from "@/src/types/workout";

export interface TodayScreenProps {
  plan: WorkoutDay[];
}

const EMPTY: readonly string[] = [];

export function TodayScreen({ plan }: TodayScreenProps) {
  const nav = useNav();
  const active = useActiveSession();
  const panelId = useId();
  const listTitleId = useId();
  // Screens only render on the client after the session is restored, so the local date is safe here.
  const [todayId] = useState<string | null>(() => getCurrentWorkoutDay(plan)?.id ?? null);
  const [dayId, setDayId] = useState<string>(() => todayId ?? plan[0]?.id);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const day = plan.find((d) => d.id === dayId) ?? plan[0];
  const exercise = day.exercises.find((x) => x.id === exerciseId) ?? null;
  const title = splitTitle(day.title);
  const running = active.session;
  const doneIds = running && running.kind === "plan" && running.dayId === day.id ? running.checked : EMPTY;

  const selectDay = (id: string) => {
    setDetailOpen(false);
    setExerciseId(null);
    setDayId(id);
  };

  const openExercise = (id: string) => {
    setExerciseId(id);
    setDetailOpen(true);
  };

  const begin = (input: StartSessionInput) => {
    active.start(input);
    setSheetOpen(false);
    nav.navigate("session");
  };

  const startPlan = (d: WorkoutDay) =>
    begin({ kind: "plan", dayId: d.id, activity: PLAN_ACTIVITY_KEY, variant: d.defaultVariant });

  const nextWorkout = day.isRestDay ? findNextWorkoutDay(day.id, plan) : null;

  const runningButton = running ? (
    <GlassButton variant="primary" size="lg" block onClick={() => nav.navigate("session")}>
      <Timer aria-hidden="true" className="size-5" strokeWidth={2} />
      <span>
        Đang tập · <span className="tabular">{formatClock(active.elapsedMs)}</span>
      </span>
    </GlassButton>
  ) : null;

  return (
    <div className="relative flex min-h-full flex-col px-5 pb-[calc(var(--app-bottom)+24px)] pt-[var(--app-top)]">
      <HeroPhoto key={`hero-${day.id}`} src={getDayHeroImage(day)} className="h-[600px]" />

      <header key={`head-${day.id}`} className="relative z-10 mt-4">
        <p className="animate-fade-slide-up anim-delay-200 flex items-center gap-2 text-[16px] text-fg-muted">
          <CalendarClock aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          {dayCaption(day)}
          {day.id === todayId && <span className="sr-only">(hôm nay)</span>}
        </p>
        <h2 className="animate-fade-slide-up anim-delay-300 mt-2 text-[48px] font-normal leading-[0.95] tracking-[-0.05em] text-fg [text-wrap:initial]">
          {title[0]}
          {title[1] ? (
            <>
              <br />
              {title[1]}
            </>
          ) : null}
        </h2>
      </header>

      <WeeklyDaySelector
        plan={plan}
        selectedDayId={day.id}
        todayId={todayId}
        onSelectDay={selectDay}
        panelId={panelId}
        className={cn("animate-fade-slide-up anim-delay-500 relative z-10", day.isRestDay ? "mt-[96px]" : "mt-[168px]")}
      />

      <div
        key={`panel-${day.id}`}
        id={panelId}
        role="tabpanel"
        aria-labelledby={`day-tab-${day.id}`}
        className="relative z-10 mt-6 flex flex-1 flex-col"
      >
        {day.isRestDay ? (
          <RestDayCard
            day={day}
            plan={plan}
            className="animate-fade-slide-up anim-delay-600"
            actions={
              running ? null : (
                <>
                  <GlassButton variant="primary" size="lg" block onClick={() => setSheetOpen(true)}>
                    Hoạt động khác
                  </GlassButton>
                  {nextWorkout && (
                    <GlassButton size="lg" block onClick={() => selectDay(nextWorkout.id)}>
                      Vẫn tập theo giáo án
                    </GlassButton>
                  )}
                </>
              )
            }
          />
        ) : (
          <>
            <div className="animate-fade-slide-up anim-delay-600 mb-3 flex items-baseline justify-between gap-3">
              <h3 id={listTitleId} className="text-[13px] font-medium text-fg-muted">
                Bài tập
              </h3>
              <p className="text-[13px] text-fg-subtle">Chạm để xem video</p>
            </div>
            <ExerciseGrid
              aria-labelledby={listTitleId}
              exercises={day.exercises}
              onSelectExercise={openExercise}
              doneIds={doneIds}
              baseDelayMs={650}
            />
          </>
        )}
      </div>

      {(running || !day.isRestDay) && (
        <div className="sticky bottom-[calc(var(--app-bottom)+12px)] z-20 -mx-5 mt-6 px-5 pt-3">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-3 -top-8 bg-[linear-gradient(to_bottom,transparent,var(--bg)_36px)]" />
          <div className="animate-fade-slide-up anim-delay-700 relative flex gap-2">
            {runningButton ?? (
              <>
                <GlassButton variant="primary" size="lg" className="min-w-0 flex-1 px-4" onClick={() => startPlan(day)}>
                  Bắt đầu buổi tập
                </GlassButton>
                <GlassButton size="lg" className="px-4 text-[15px]" onClick={() => setSheetOpen(true)}>
                  Hoạt động khác
                </GlassButton>
              </>
            )}
          </div>
        </div>
      )}

      <ExerciseDetailDialog exercise={exercise} open={detailOpen} onOpenChange={setDetailOpen} />
      <ActivitySheet open={sheetOpen} onOpenChange={setSheetOpen} plannedDay={day.isRestDay ? null : day} onStart={begin} />
    </div>
  );
}
