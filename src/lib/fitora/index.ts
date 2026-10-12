// Public surface of the Fitora copies. Import from "@/src/lib/fitora", never from the files directly.
export {
  ACTIVITIES,
  ACTIVITY_BY_KEY,
  CATEGORY_DEFAULT_MET,
  activitiesByCategory,
  findActivity,
  type ActivityDef,
  type ActivityIconKey,
  type ActivityVariant,
} from './activities';
export {
  FALLBACK_WEIGHT_KG,
  buildTitle,
  defaultVariant,
  formatKm,
  isSpeedBased,
  joinDistanceNote,
  metKcal,
  normalizeVi,
  resolveWeight,
  searchActivities,
  splitDistanceNote,
  variantForMet,
} from './lib';
export * from './types';
