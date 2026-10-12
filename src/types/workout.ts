export type VideoAspectRatio = "16:9" | "9:16";

/** Variant id of Fitora's `weight_training` activity used to estimate kcal for a plan day (spec §4). */
export type PlanVariant = "moderate" | "vigorous";

export interface ExerciseVideo {
  embedUrl: string | null;
  title?: string;
  aspectRatio: VideoAspectRatio;
}

export interface Exercise {
  id: string;
  name: string;
  vietnameseName?: string;
  muscleGroups: string[];
  sets: number;
  reps: string;
  note?: string;
  description?: string;
  instructions?: string[];
  video: ExerciseVideo;
}

export interface WorkoutDay {
  id: string;
  dayNumber: number;
  shortLabel: string;
  fullLabel: string;
  title: string;
  muscleGroups: string[];
  description?: string;
  isRestDay: boolean;
  /** Default intensity for kcal: "moderate" (3.5 MET) or "vigorous" (6.0 MET). */
  defaultVariant: PlanVariant;
  exercises: Exercise[];
}
