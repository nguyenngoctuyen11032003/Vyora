"use client";

// Spec §3.3 "Sheet Chọn hoạt động": 90 % bottom sheet with a diacritic-insensitive search (Fitora
// searchActivities), "Theo lịch: …" card, "Gần đây" (non-plan activities of the history), Fitora
// category chips + activity grid, intensity chips (Fitora variants, default preselected), the
// "≈ 7,0 MET · ~490 kcal/giờ với 70 kg" line and a gold "Bắt đầu".
import { Check, Dumbbell, Search, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { ActivityIcon, Chip, GlassButton, Sheet } from "@/src/components/f1";
import { useWeekSessions } from "@/src/hooks/use-week-sessions";
import { useWeight } from "@/src/hooks/use-weight";
import { cn } from "@/src/lib/cn";
import { PLAN_ACTIVITY_KEY, metLine, planVariant } from "@/src/lib/calories";
import {
  ACTIVITIES,
  WORKOUT_CATEGORIES,
  WORKOUT_CATEGORY_LABELS,
  activitiesByCategory,
  defaultVariant,
  findActivity,
  searchActivities,
  type ActivityDef,
  type WorkoutCategory,
} from "@/src/lib/fitora";
import type { StartSessionInput } from "@/src/types/gym";
import type { WorkoutDay } from "@/src/types/workout";

export interface ActivitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Plan day offered as the first card ("Theo lịch: …"); null on rest days without a fallback. */
  plannedDay: WorkoutDay | null;
  /** Called with the choice; the parent starts the session and navigates to 'session'. */
  onStart: (input: StartSessionInput) => void;
}

interface Selection {
  key: string;
  variant: string;
}

export function ActivitySheet({ open, onOpenChange, plannedDay, onStart }: ActivitySheetProps) {
  const { weight } = useWeight();
  const { recentActivityKeys } = useWeekSessions();
  const uid = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<WorkoutCategory>("gym");
  const [selection, setSelection] = useState<Selection | null>(null);

  const searching = query.trim().length > 0;
  const results = useMemo(
    () => (searching ? searchActivities(query, "all", ACTIVITIES, recentActivityKeys) : []),
    [query, searching, recentActivityKeys],
  );
  const recent = useMemo(
    () => recentActivityKeys.map((k) => findActivity(k)).filter((a): a is ActivityDef => Boolean(a)),
    [recentActivityKeys],
  );

  const selected = selection ? findActivity(selection.key) : undefined;
  const variant = selected ? (selected.variants.find((v) => v.id === selection?.variant) ?? defaultVariant(selected)) : undefined;

  const reset = () => {
    setQuery("");
    setSelection(null);
  };

  const changeOpen = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const choose = (a: ActivityDef) => {
    setSelection((cur) => (cur?.key === a.key ? cur : { key: a.key, variant: defaultVariant(a).id }));
  };

  const start = (input: StartSessionInput) => {
    reset();
    onStart(input);
  };

  const search = (
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-fg-muted" strokeWidth={1.8} />
      <input
        type="search"
        aria-label="Tìm hoạt động"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm: cầu lông, bơi, đạp xe…"
        autoComplete="off"
        enterKeyHint="search"
        className="h-12 w-full rounded-full border border-glass-border bg-white/[0.06] pl-12 pr-12 text-[16px] text-fg placeholder:text-fg-subtle focus-visible:border-white/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <button
          type="button"
          aria-label="Xoá tìm kiếm"
          onClick={() => setQuery("")}
          className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted hover:text-fg"
        >
          <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </button>
      ) : null}
    </div>
  );

  const footer = (
    <div className="flex flex-col gap-3">
      {selected && variant ? (
        <>
          <p className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.02em]">
            <ActivityIcon activity={selected.key} className="size-5 text-gold" />
            {selected.name}
          </p>
          {selected.variants.length > 1 && (
            <div role="group" aria-label="Cường độ" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5">
              {selected.variants.map((v) => (
                <Chip key={v.id} selected={v.id === variant.id} onClick={() => setSelection({ key: selected.key, variant: v.id })}>
                  {v.label}
                </Chip>
              ))}
            </div>
          )}
          <p className="tabular text-[14px] text-fg-muted" aria-live="polite">
            {metLine(variant.met, weight.kg)}
          </p>
        </>
      ) : (
        <p className="text-[14px] text-fg-muted">Chọn một hoạt động để xem cường độ và kcal ước tính.</p>
      )}
      <GlassButton
        variant="primary"
        size="lg"
        block
        disabled={!selected || !variant}
        onClick={() => selected && variant && start({ kind: "activity", dayId: null, activity: selected.key, variant: variant.id })}
      >
        Bắt đầu
      </GlassButton>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={changeOpen} title="Chọn hoạt động" height="tall" header={search} footer={footer}>
      {searching ? (
        <section aria-labelledby={`${uid}-results`}>
          <h3 id={`${uid}-results`} className="mb-3 mt-1 text-[13px] font-medium text-fg-muted" aria-live="polite">
            {results.length > 0 ? `${results.length} kết quả` : "Không có kết quả"}
          </h3>
          {results.length > 0 ? (
            <ActivityGrid activities={results} selectedKey={selection?.key} onChoose={choose} />
          ) : (
            <p className="stat-card px-5 py-6 text-[15px] leading-6 text-fg-muted">
              Không tìm thấy “{query.trim()}”. Thử từ khác, ví dụ: bơi, cầu lông, chạy bộ.
            </p>
          )}
        </section>
      ) : (
        <div className="flex flex-col gap-6 pt-1">
          {plannedDay && !plannedDay.isRestDay && (
            <button
              type="button"
              onClick={() => start({ kind: "plan", dayId: plannedDay.id, activity: PLAN_ACTIVITY_KEY, variant: plannedDay.defaultVariant })}
              className="glass-card flex min-h-[72px] w-full items-center gap-3.5 rounded-[20px] px-4 py-3 text-left transition-colors hover:bg-white/[0.06] active:scale-[0.99]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-gold-ink">
                <Dumbbell aria-hidden="true" className="size-5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold leading-snug tracking-[-0.02em]">Theo lịch: {plannedDay.title}</span>
                <span className="block text-[14px] leading-snug text-fg-muted">
                  Tập tạ · {planVariant(plannedDay).label} · {plannedDay.exercises.length} bài · bắt đầu ngay
                </span>
              </span>
            </button>
          )}

          {recent.length > 0 && (
            <section aria-labelledby={`${uid}-recent`}>
              <h3 id={`${uid}-recent`} className="mb-3 text-[13px] font-medium text-fg-muted">
                Gần đây
              </h3>
              <div className="flex flex-wrap gap-2">
                {recent.map((a) => (
                  <Chip key={a.key} selected={selection?.key === a.key} onClick={() => choose(a)}>
                    {selection?.key === a.key ? null : <ActivityIcon activity={a.key} className="-ml-1 size-4" />}
                    {a.name}
                  </Chip>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby={`${uid}-all`}>
            <h3 id={`${uid}-all`} className="mb-3 text-[13px] font-medium text-fg-muted">
              Nhóm hoạt động
            </h3>
            <div role="group" aria-label="Nhóm hoạt động" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {WORKOUT_CATEGORIES.map((c) => (
                <Chip key={c} selected={c === category} showCheck={false} onClick={() => setCategory(c)}>
                  {WORKOUT_CATEGORY_LABELS[c]}
                </Chip>
              ))}
            </div>
            <ActivityGrid key={category} className="mt-4" activities={activitiesByCategory(category)} selectedKey={selection?.key} onChoose={choose} />
          </section>
        </div>
      )}
    </Sheet>
  );
}

function ActivityGrid({
  activities,
  selectedKey,
  onChoose,
  className,
}: {
  activities: ActivityDef[];
  selectedKey?: string;
  onChoose: (a: ActivityDef) => void;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-2", className)}>
      {activities.map((a, i) => {
        const selected = a.key === selectedKey;
        return (
          <li key={a.key} className="animate-fade-rise" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onChoose(a)}
              className={cn(
                "flex h-full min-h-16 w-full items-center gap-3 rounded-[20px] px-3.5 py-3 text-left transition-[background-color,color,transform] duration-150 active:scale-[0.98]",
                selected ? "bg-white text-[#0a0e1c]" : "stat-card text-fg hover:bg-white/[0.09]",
              )}
            >
              {selected ? (
                <Check aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.4} />
              ) : (
                <ActivityIcon activity={a.key} className="size-5 shrink-0 text-gold" />
              )}
              <span className="min-w-0 text-[15px] font-medium leading-tight tracking-[-0.01em]">{a.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
