"use client";

// Spec §3.3 "Tuần này" (F1 Screen 3 + coffee stat grid): gold count-up kcal, sessions / minutes / days
// cards, T2–CN strip (gold dot + "✓"), recent sessions (≤ 20) with sync state and confirmed delete.
import { CalendarDays, Flame, Play } from "lucide-react";
import { useId, useState } from "react";
import { useNav } from "@/src/components/app/nav";
import { useToast } from "@/src/components/app/toast";
import { ConfirmDialog, CountUp, GlassButton, ScreenBackground, Skeleton, StatCard } from "@/src/components/f1";
import { RecentList } from "@/src/components/week/RecentList";
import { WeekStrip } from "@/src/components/week/WeekStrip";
import { useWeekSessions } from "@/src/hooks/use-week-sessions";
import { KCAL_DISCLAIMER } from "@/src/lib/calories";
import { cn } from "@/src/lib/cn";
import { formatDayMonth, formatInt, weekdayShort } from "@/src/lib/format";
import type { GymWorkout } from "@/src/types/gym";

export function WeekScreen() {
  const nav = useNav();
  const toast = useToast();
  const { status, all, recent, week, remove } = useWeekSessions();
  const [toDelete, setToDelete] = useState<GymWorkout | null>(null);
  const recentId = useId();

  const loading = status !== "ready" && all.length === 0;
  const trainedDays = week.dates.filter((d) => (week.countByDate[d] ?? 0) > 0).length;
  const range = `${formatDayMonth(week.dates[0])} – ${formatDayMonth(week.dates[6])}`;

  const confirmDelete = async () => {
    if (!toDelete) return;
    const res = await remove(toDelete.client_ref);
    if (res.ok) toast.show("Đã xoá buổi tập");
    else toast.show(res.message, { tone: "warning" });
  };

  return (
    <div className="relative flex min-h-full flex-col px-5 pb-[calc(var(--app-bottom)+24px)] pt-[var(--app-top)]">
      <ScreenBackground
        className="bottom-auto h-[460px] [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"
        overlayClassName="bg-gradient-to-b from-black/70 via-bg/85 to-bg"
      />

      <div className="relative z-10 mt-4">
        <p className="animate-fade-slide-up anim-delay-200 flex items-center gap-2 text-[15px] text-fg-muted">
          <CalendarDays aria-hidden="true" className="size-5" strokeWidth={1.8} />
          <span>
            Tuần này · <span className="tabular">{range}</span>
          </span>
        </p>
        <h2 className="animate-fade-slide-up anim-delay-300 mt-2 text-[52px] font-normal leading-[0.83] tracking-[-0.08em]">
          Tiến độ
        </h2>
      </div>

      {/* Chassis block of the template: one gold display number. */}
      <section aria-label="Calo đã đốt tuần này" className="animate-fade-slide-up anim-delay-500 relative z-10 mt-10">
        <p className="flex items-center gap-2 text-[15px] text-fg-muted">
          <Flame aria-hidden="true" className="size-5" strokeWidth={1.8} />
          Calo đã đốt
        </p>
        {loading ? (
          <Skeleton className="mt-4 h-[92px] w-56 rounded-2xl" />
        ) : (
          <p className="mt-4 flex items-baseline gap-2 text-gold">
            <CountUp
              value={week.kcal}
              delayMs={500}
              className={cn("num-display pb-1", formatInt(week.kcal).length > 5 ? "text-[92px]" : "text-[120px]")}
            />
            <span className="text-[20px] font-medium tracking-[-0.02em]">kcal</span>
          </p>
        )}
      </section>

      <div className="relative z-10 mt-8 grid grid-cols-3 gap-3">
        {[
          { label: "buổi tập", value: week.sessions, delay: "anim-delay-700", ms: 700 },
          { label: "phút", value: week.minutes, delay: "anim-delay-800", ms: 800 },
          { label: "ngày tập", value: trainedDays, unit: "/7", delay: "anim-delay-900", ms: 900 },
        ].map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            unit={c.unit}
            className={cn("animate-fade-rise", c.delay)}
            value={loading ? <span aria-hidden="true" className="inline-block h-[26px] w-12 animate-pulse rounded-md bg-white/[0.07] align-middle" /> : <CountUp value={c.value} delayMs={c.ms} />}
          />
        ))}
      </div>

      <div className="animate-fade-slide-up anim-delay-1000 relative z-10 mt-4">
        <WeekStrip dates={week.dates} countByDate={week.countByDate} />
        {!loading && week.sessions === 0 && recent.length > 0 ? (
          <p className="mt-3 text-[14px] text-fg-muted">Tuần này chưa có buổi nào. Buổi bạn lưu sẽ được đánh dấu ✓ ở đây.</p>
        ) : null}
      </div>

      <section aria-labelledby={recentId} className="animate-fade-slide-up anim-delay-1100 relative z-10 mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 id={recentId} className="text-[20px] font-medium tracking-[-0.02em]">
            Gần đây
          </h3>
          {recent.length ? <p className="text-[14px] text-fg-muted">{recent.length} buổi</p> : null}
        </div>
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-[84px] rounded-card" />
            <Skeleton className="h-[84px] rounded-card" />
          </div>
        ) : recent.length ? (
          <RecentList items={recent} onDelete={setToDelete} />
        ) : (
          <div className="stat-card p-5">
            <p className="text-[17px] font-medium">Chưa có buổi tập nào</p>
            <p className="mt-1 text-[15px] leading-relaxed text-fg-muted">
              Các buổi bạn lưu sẽ hiện ở đây và được tính vào calo đã đốt trong Fitora.
            </p>
            <GlassButton variant="primary" size="lg" block className="mt-4" onClick={() => nav.navigate("today")}>
              <Play aria-hidden="true" className="size-5" fill="currentColor" strokeWidth={0} />
              Bắt đầu buổi tập
            </GlassButton>
          </div>
        )}
        <p className="mt-4 text-[12px] leading-snug text-fg-subtle">Calo: {KCAL_DISCLAIMER.toLowerCase()}</p>
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Xoá buổi tập?"
        description={
          toDelete
            ? `${toDelete.title} · ${weekdayShort(toDelete.workout_on)} ${formatDayMonth(toDelete.workout_on)}. Fitora sẽ không tính buổi này vào calo đã đốt nữa.`
            : undefined
        }
        confirmLabel="Xoá buổi tập"
        cancelLabel="Giữ lại"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
