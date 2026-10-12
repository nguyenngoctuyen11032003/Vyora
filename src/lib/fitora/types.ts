// Copied from Fitora `src/types/db.ts` (commit eded70e): the enums and Vietnamese labels the gym app
// shares with Fitora. Values must stay identical so rows written here read correctly in Fitora.

export type WorkoutCategory =
  | 'gym' | 'cardio' | 'yoga' | 'running' | 'swimming' | 'cycling' | 'team_sport' | 'walking' | 'other';
export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'gain' | 'maintain' | 'recomp';

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  'gym', 'cardio', 'yoga', 'running', 'swimming', 'cycling', 'team_sport', 'walking', 'other',
];

export const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Giảm cân',
  gain: 'Tăng cân',
  maintain: 'Giữ cân',
  recomp: 'Giảm mỡ tăng cơ',
};
export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Ít vận động',
  light: 'Vận động nhẹ',
  moderate: 'Vận động vừa',
  active: 'Năng động',
  very_active: 'Rất năng động',
};
export const WORKOUT_CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  gym: 'Gym',
  cardio: 'Cardio',
  yoga: 'Yoga',
  running: 'Chạy bộ',
  swimming: 'Bơi',
  cycling: 'Đạp xe',
  team_sport: 'Thể thao đồng đội',
  walking: 'Đi bộ',
  other: 'Khác',
};

/** Gym-app addition (not in Fitora's db.ts): label for `fit_profiles.sex`. */
export const SEX_LABELS: Record<Sex, string> = {
  male: 'Nam',
  female: 'Nữ',
};

/** Fitora `src/lib/config.ts` MIN_PASSWORD — length rule of `vPassword`. */
export const MIN_PASSWORD = 8;
