"use client";

// Spec §3.3 "Đang tập" (F1 Screen 2): empty state with two actions, or the running session: title + icon,
// 110 px clock (gold while running, soft white gradient when paused), live gold kcal + caption, plan
// checklist or MET/intensity card, "Tạm dừng"/"Tiếp tục" + "Kết thúc" (FinishSheet). Keeps the screen on.
import { Flag, Info, Pause, Play } from "lucide-react";
import { useState } from "react";
import { KCAL_MARGIN } from "@/src/components/session/copy";
import { useNav } from "@/src/components/app/nav";
import { ActivityIcon, GlassButton, ScreenBackground } from "@/src/components/f1";
import { ActivitySheet } from "@/src/components/screens/ActivitySheet";
import { FinishSheet } from "@/src/components/screens/FinishSheet";
import { IntensityCard } from "@/src/components/session/IntensityCard";
import { PlanChecklist } from "@/src/components/session/PlanChecklist";
import { SessionEmpty } from "@/src/components/session/SessionEmpty";
import { useActiveSession } from "@/src/hooks/use-active-session";
import { useWakeLock } from "@/src/hooks/use-wake-lock";
import { useWeight } from "@/src/hooks/use-weight";
import { PLAN_ACTIVITY_KEY, estimateCaption, kcalLabel } from "@/src/lib/calories";
import { cn } from "@/src/lib/cn";
import { getCurrentWorkoutDay, getDayHeroImage } from "@/src/lib/day-utils";
import { WORKOUT_CATEGORY_LABELS } from "@/src/lib/fitora";
import { formatClock, toLocalTime } from "@/src/lib/format";
import type { StartSessionInput } from "@/src/types/gym";
import type { WorkoutDay } from "@/src/types/workout";

export interface SessionScreenProps {
  plan: WorkoutDay[];
}

export function SessionScreen({ plan }: SessionScreenProps) {
  const nav = useNav();
  const s = useActiveSession();
  const { weight } = useWeight();
  const [finishOpen, setFinishOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  useWakeLock(s.running);

  // Screens only render on the client after the session is restored, so "today" is the device's today.
  const today = getCurrentWorkoutDay(plan);

  const begin = (input: StartSessionInput) => {
    s.start(input);
    setPickerOpen(false);
  };

  const session = s.session;
  const heroDay = session ? s.day : today && !today.isRestDay ? today : null;

  return (
    <div
      className={cn(
        "relative flex min-h-full flex-col px-5 pt-[var(--app-top)]",
        session ? "pb-0" : "pb-[calc(var(--app-bottom)+24px)]",
      )}
    >
      <ScreenBackground
        src={getDayHeroImage(heroDay)}
        className="bottom-auto h-[540px] [mask-image:linear-gradient(to_bottom,black_45%,transparent)]"
        overlayClassName="bg-gradient-to-b from-black/70 via-bg/85 to-bg"
      />

      {!session ? (
        <SessionEmpty
          today={today}
          weightKg={weight.kg}
          onStartPlan={(day) => begin({ kind: "plan", dayId: day.id, activity: PLAN_ACTIVITY_KEY, variant: day.defaultVariant })}
          onOtherActivity={() => setPickerOpen(true)}
          onOpenToday={() => nav.navigate("today")}
        />
      ) : (
        <>
          <div className="relative z-10 mt-4">
            <p className="animate-fade-slide-up anim-delay-200 flex items-center gap-2 text-[16px] text-fg-muted">
              <ActivityIcon activity={session.activity} category={session.category} className="size-5" />
              <span>
                {session.kind === "plan" ? "Theo giáo án" : WORKOUT_CATEGORY_LABELS[session.category] ?? "Hoạt động"} · bắt đầu{" "}
                {toLocalTime(session.startedAt)}
              </span>
            </p>
            <h2 className="animate-fade-slide-up anim-delay-300 mt-2 text-[40px] font-normal leading-[0.95] tracking-[-0.05em]">
              {session.title}
            </h2>
          </div>

          <div className="animate-fade-slide-up anim-delay-500 relative z-10 mt-9">
            <p className={cn("flex items-center gap-2 text-[14px] font-medium", s.running ? "text-gold" : "text-fg-muted")}>
              {s.running ? (
                <span aria-hidden="true" className="size-2 rounded-full bg-gold" />
              ) : (
                <Pause aria-hidden="true" className="size-4" fill="currentColor" strokeWidth={0} />
              )}
              <span aria-live="polite">{s.running ? "Đang chạy" : "Đã tạm dừng"}</span>
            </p>
            <p
              role="timer"
              aria-live="off"
              aria-label={`Thời gian tập ${formatClock(s.elapsedMs)}`}
              className={cn(
                "num-display -ml-1 mt-3 whitespace-nowrap pb-2 transition-colors duration-500",
                formatClock(s.elapsedMs).length > 5 ? "text-[84px]" : "text-[110px]",
                s.running ? "text-gold" : "text-fade-soft",
              )}
            >
              {formatClock(s.elapsedMs)}
            </p>
            <p className="tabular mt-3 text-[34px] font-semibold leading-none tracking-[-0.04em] text-gold">{kcalLabel(s.kcal)}</p>
            <p className="mt-2 text-[14px] text-fg-muted">{estimateCaption(session.weightKg, s.variant?.label)}</p>
            <p className="mt-1 flex items-start gap-1.5 text-[12px] leading-snug text-fg-subtle">
              <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" strokeWidth={1.8} />
              {KCAL_MARGIN}
            </p>
          </div>

          <div className="animate-fade-slide-up anim-delay-700 relative z-10 mt-8">
            {session.kind === "plan" && s.day ? (
              <PlanChecklist day={s.day} checked={session.checked} onToggle={s.toggleChecked} />
            ) : (
              <IntensityCard session={session} activity={s.activity} onVariant={s.setVariant} />
            )}
          </div>

          <div className="sticky bottom-0 z-20 -mx-5 mt-auto grid grid-cols-2 gap-2.5 bg-gradient-to-t from-bg from-70% to-transparent px-5 pb-[calc(var(--app-bottom)+12px)] pt-10">
            <GlassButton
              size="lg"
              onClick={s.paused ? s.resume : s.pause}
              className="whitespace-nowrap bg-bg/60 px-4"
            >
              {s.paused ? (
                <Play aria-hidden="true" className="size-5" fill="currentColor" strokeWidth={0} />
              ) : (
                <Pause aria-hidden="true" className="size-5" fill="currentColor" strokeWidth={0} />
              )}
              {s.paused ? "Tiếp tục" : "Tạm dừng"}
            </GlassButton>
            <GlassButton variant="primary" size="lg" className="whitespace-nowrap px-4" onClick={() => setFinishOpen(true)}>
              <Flag aria-hidden="true" className="size-5" strokeWidth={2} />
              Kết thúc
            </GlassButton>
          </div>
        </>
      )}

      <FinishSheet
        open={finishOpen}
        onOpenChange={setFinishOpen}
        onDone={(saved) => nav.navigate(saved ? "week" : "today")}
      />
      <ActivitySheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        plannedDay={today && !today.isRestDay ? today : null}
        onStart={begin}
      />
    </div>
  );
}
