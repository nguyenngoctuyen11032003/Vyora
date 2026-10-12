"use client";

import { CircleAlert, CircleCheck, Clock3, Trash2 } from "lucide-react";
import { ActivityIcon } from "@/src/components/f1";
import { cn } from "@/src/lib/cn";
import { formatDayMonth, formatInt, weekdayShort } from "@/src/lib/format";
import type { GymWorkout, SyncStatus } from "@/src/types/gym";

const SYNC: Record<SyncStatus, { label: string; icon: typeof CircleCheck; className: string }> = {
  saved: { label: "Đã lưu", icon: CircleCheck, className: "text-success" },
  pending: { label: "Chờ gửi", icon: Clock3, className: "text-fg-muted" },
  failed: { label: "Lỗi gửi", icon: CircleAlert, className: "text-danger" },
};

export function SyncBadge({ status }: { status: SyncStatus }) {
  const { label, icon: Icon, className } = SYNC[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px] font-medium", className)}>
      <Icon aria-hidden="true" className="size-3.5" strokeWidth={2} />
      {label}
    </span>
  );
}

export interface RecentListProps {
  items: GymWorkout[];
  onDelete(item: GymWorkout): void;
}

/** "Gần đây": up to 20 sessions with date, title, minutes, kcal, sync state and a delete button. */
export function RecentList({ items, onDelete }: RecentListProps) {
  return (
    <ul className="glass-card overflow-hidden rounded-card">
      {items.map((w, i) => {
        const when = `${weekdayShort(w.workout_on)} ${formatDayMonth(w.workout_on)}`;
        return (
          <li key={w.client_ref} className={cn("flex items-center gap-3 py-3 pl-4 pr-1.5", i > 0 && "border-t border-line")}>
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-fg-muted">
              <ActivityIcon activity={w.activity} category={w.category} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-medium leading-snug">{w.title}</p>
              <p className="tabular mt-0.5 text-[13px] text-fg-muted">
                {when}
                {w.start_time ? ` · ${w.start_time}` : ""} · {w.duration_min} phút
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="tabular text-[14px] font-semibold text-gold">≈ {formatInt(w.kcal)} kcal</span>
                <SyncBadge status={w.sync} />
              </p>
              {w.sync === "failed" && w.error ? <p className="mt-1 text-[13px] text-danger">{w.error}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => onDelete(w)}
              aria-label={`Xoá buổi ${w.title}, ${when}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-white/[0.06] hover:text-danger"
            >
              <Trash2 aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
