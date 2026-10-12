// Pure conversion of a finished session into the `fit_workouts` row of spec §6.
import { buildTitle, findActivity, isSpeedBased, joinDistanceNote, metKcal } from "@/src/lib/fitora";
import { toLocalDate, toLocalTime } from "@/src/lib/format";
import { clampMinutes } from "@/src/lib/session";
import type { ActiveSession, FitWorkoutRow } from "@/src/types/gym";

export const NOTE_SUFFIX = "Gym app";
export const MAX_TITLE = 80;
export const MAX_NOTES = 1000;

export interface FinishInput {
  session: ActiveSession;
  /** Minutes confirmed in FinishSheet (clamped to 1–300). */
  durationMin: number;
  /** Variant id chosen in FinishSheet (defaults to the session's). */
  variant?: string;
  /** Weight confirmed in FinishSheet (defaults to the session's locked weight). */
  weightKg?: number;
  /** Distance in km (speed-based activities only, optional). */
  km?: number | null;
  /** Number of exercises of the plan day (for "5/6 bài"). */
  totalExercises?: number;
}

export function toWorkoutRow(input: FinishInput): FitWorkoutRow {
  const { session } = input;
  const activity = findActivity(session.activity);
  const variantId = input.variant ?? session.variant;
  const variant = activity?.variants.find((v) => v.id === variantId);
  const met = variant?.met ?? session.met;
  const weightKg = input.weightKg ?? session.weightKg;
  const duration = clampMinutes(input.durationMin);

  let title: string;
  if (session.kind === "plan" || !activity) title = session.title || activity?.name || session.activity;
  else title = buildTitle(activity, variant);

  let notes: string;
  if (session.kind === "plan") {
    const total = input.totalExercises ?? session.checked.length;
    notes = `${session.checked.length}/${total} bài · ${NOTE_SUFFIX}`;
  } else if (input.km && input.km > 0 && isSpeedBased(session.activity)) {
    notes = joinDistanceNote(input.km, NOTE_SUFFIX) ?? NOTE_SUFFIX;
  } else {
    notes = NOTE_SUFFIX;
  }

  return {
    workout_on: toLocalDate(session.startedAt),
    start_time: toLocalTime(session.startedAt),
    category: activity?.category ?? session.category,
    activity: activity?.key ?? session.activity,
    title: title.slice(0, MAX_TITLE),
    met,
    duration_min: duration,
    kcal: metKcal(met, weightKg, duration),
    status: "done",
    notes: notes.slice(0, MAX_NOTES),
    source: "gym",
    client_ref: session.id,
  };
}
