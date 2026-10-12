import { WEEKDAY_LONG, WEEKDAY_SHORT } from "@/src/lib/format";
import type { WorkoutDay } from "@/src/types/workout";

/** Rough time per working set (≈ 45 s of work + 90 s rest) and a warm-up block, in minutes. */
const MINUTES_PER_SET = 2.25;
const WARM_UP_MINUTES = 5;

/** Estimated session length rounded to 5 minutes ("~60 phút"); 0 for a rest day. */
export function estimateDayMinutes(day: Pick<WorkoutDay, "exercises" | "isRestDay">): number {
  if (day.isRestDay || day.exercises.length === 0) return 0;
  const sets = day.exercises.reduce((sum, x) => sum + x.sets, 0);
  return Math.max(5, Math.round((sets * MINUTES_PER_SET + WARM_UP_MINUTES) / 5) * 5);
}

/** "Thứ Hai", "Chủ nhật" from the JS weekday number of a plan day. */
export function weekdayLong(day: Pick<WorkoutDay, "dayNumber">): string {
  return WEEKDAY_LONG[day.dayNumber] ?? "";
}

/** "T2" … "CN" (day strip). */
export function weekdayShortOf(day: Pick<WorkoutDay, "dayNumber">): string {
  return WEEKDAY_SHORT[day.dayNumber] ?? "";
}

/** Today label: "Thứ Hai · 7 bài · ~60 phút", or "Thứ Bảy · Nghỉ phục hồi". */
export function dayCaption(day: WorkoutDay): string {
  const name = weekdayLong(day);
  if (day.isRestDay) return `${name} · Nghỉ phục hồi`;
  return `${name} · ${day.exercises.length} bài · ~${estimateDayMinutes(day)} phút`;
}

/**
 * Splits a title into two balanced lines like the template ("Silverstone" / "England"):
 * "Ngực, vai và tay sau" → ["Ngực, vai", "và tay sau"]. Breaks before " và ", after the first comma, else at the most balanced space.
 */
export function splitTitle(title: string): [string, string] | [string] {
  const and = title.indexOf(" và ");
  if (and > 0) return [title.slice(0, and), title.slice(and + 1)];
  const comma = title.indexOf(", ");
  if (comma > 0) return [title.slice(0, comma + 1), title.slice(comma + 2)];
  const words = title.split(" ");
  if (words.length < 3) return [title];
  // Balanced break: the split whose longer line is shortest ("Ngày nghỉ" / "phục hồi").
  let best = 1;
  let bestLen = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const len = Math.max(words.slice(0, i).join(" ").length, words.slice(i).join(" ").length);
    if (len < bestLen) {
      bestLen = len;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}
