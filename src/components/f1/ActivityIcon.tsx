import { createElement } from "react";
import {
  Activity,
  Bike,
  Dumbbell,
  Flame,
  Flower2,
  Footprints,
  HeartPulse,
  House,
  Mountain,
  Music,
  PersonStanding,
  Sailboat,
  Sprout,
  Swords,
  Target,
  Timer,
  Trophy,
  Volleyball,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { findActivity, type ActivityIconKey, type WorkoutCategory } from "@/src/lib/fitora";
import { cn } from "@/src/lib/cn";

// Same icon mapping as Fitora src/features/workout/ActivityIcon.tsx.
const ICONS: Record<ActivityIconKey, LucideIcon> = {
  dumbbell: Dumbbell,
  flame: Flame,
  heart: HeartPulse,
  zap: Zap,
  flower: Flower2,
  wind: Wind,
  run: PersonStanding,
  footprints: Footprints,
  waves: Waves,
  bike: Bike,
  trophy: Trophy,
  volleyball: Volleyball,
  target: Target,
  mountain: Mountain,
  music: Music,
  swords: Swords,
  sprout: Sprout,
  home: House,
  sailboat: Sailboat,
  timer: Timer,
  activity: Activity,
};

export const CATEGORY_ICON: Record<WorkoutCategory, LucideIcon> = {
  gym: Dumbbell,
  cardio: HeartPulse,
  yoga: Flower2,
  running: PersonStanding,
  swimming: Waves,
  cycling: Bike,
  team_sport: Trophy,
  walking: Footprints,
  other: Activity,
};

/** Lucide icon of a catalogue activity, else of its category, else a generic one (old data). */
export function iconFor(activity: string | null | undefined, category?: WorkoutCategory | null): LucideIcon {
  const a = findActivity(activity);
  if (a) return ICONS[a.icon];
  return (category && CATEGORY_ICON[category]) || Activity;
}

export interface ActivityIconProps {
  activity?: string | null;
  category?: WorkoutCategory | null;
  className?: string;
  strokeWidth?: number;
}

/** Decorative activity icon (aria-hidden; put the activity name in text next to it). */
export function ActivityIcon({ activity, category, className, strokeWidth = 1.8 }: ActivityIconProps) {
  // createElement: the icon is a static lucide component picked from a table, not created here.
  return createElement(iconFor(activity, category), { "aria-hidden": true, className: cn("size-5", className), strokeWidth });
}
