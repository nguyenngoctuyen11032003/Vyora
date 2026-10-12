import { Check } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { parseLocalDate, toLocalDate, weekdayShort } from "@/src/lib/format";

export interface WeekStripProps {
  /** Monday → Sunday ('YYYY-MM-DD'). */
  dates: string[];
  countByDate: Record<string, number>;
}

/** T2–CN of the current week. Trained days: gold dot AND "✓" (never colour alone). */
export function WeekStrip({ dates, countByDate }: WeekStripProps) {
  const today = toLocalDate(new Date());
  return (
    <ol aria-label="Các ngày trong tuần" className="grid grid-cols-7 gap-1.5">
      {dates.map((iso) => {
        const count = countByDate[iso] ?? 0;
        const isToday = iso === today;
        const day = parseLocalDate(iso).getDate();
        const label = `${weekdayShort(iso)} ${day}/${parseLocalDate(iso).getMonth() + 1}${isToday ? ", hôm nay" : ""}: ${
          count ? `${count} buổi tập` : "chưa tập"
        }`;
        return (
          <li
            key={iso}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl py-2.5",
              count ? "bg-gold-soft" : "bg-stat",
              isToday && "ring-1 ring-white/50",
            )}
          >
            <span className="sr-only">{label}</span>
            <span aria-hidden="true" className={cn("text-[12px] font-medium", isToday ? "text-fg" : "text-fg-muted")}>
              {weekdayShort(iso)}
            </span>
            <span aria-hidden="true" className="tabular text-[17px] font-semibold leading-none">
              {day}
            </span>
            <span aria-hidden="true" className="flex h-5 items-center justify-center">
              {count ? (
                <span className="flex items-center gap-0.5 text-gold">
                  <span className="size-1.5 rounded-full bg-gold" />
                  <Check className="size-3.5" strokeWidth={3} />
                  {count > 1 ? <span className="tabular text-[11px] font-semibold">{count}</span> : null}
                </span>
              ) : (
                <span className="size-1 rounded-full bg-white/20" />
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
