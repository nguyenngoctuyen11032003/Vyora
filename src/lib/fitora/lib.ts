// Copied verbatim from Fitora `src/features/workout/lib.ts` and `src/lib/energy.ts` (commit eded70e).
// Only the helpers the gym app needs are copied; the function bodies are unchanged. Imports point at
// the local copies (./activities, ./types). Do not edit by hand: re-copy from Fitora instead.
import { ACTIVITIES, findActivity, type ActivityDef, type ActivityVariant } from './activities';
import { WORKOUT_CATEGORY_LABELS, type WorkoutCategory } from './types';

// ---- from src/lib/energy.ts ------------------------------------------------

/** MET · 3.5 · kg / 200 · minutes, rounded. */
export function metKcal(met: number, weightKg: number, minutes: number): number {
  if (!(met > 0) || !(weightKg > 0) || !(minutes > 0)) return 0;
  return Math.round(((met * 3.5 * weightKg) / 200) * minutes);
}

// ---- from src/features/workout/lib.ts --------------------------------------

/** Weight used for calorie maths when nothing is known. */
export const FALLBACK_WEIGHT_KG = 65;

/** Latest measured weight → start weight from onboarding → fallback. */
export function resolveWeight(latest: number | string | null | undefined, startWeight: number | string | null | undefined): { kg: number; source: 'measured' | 'profile' | 'fallback' } {
  // numeric columns may arrive as strings; ignore implausible values (typos like 7 or 700 kg).
  // Bounds match METRIC_RANGES.weight_kg of the body feature (25–300 kg).
  const ok = (v: unknown) => {
    const n = Number(v);
    return v !== null && v !== undefined && v !== '' && Number.isFinite(n) && n >= 25 && n <= 300 ? n : null;
  };
  const m = ok(latest);
  if (m !== null) return { kg: m, source: 'measured' };
  const s = ok(startWeight);
  if (s !== null) return { kg: s, source: 'profile' };
  return { kg: FALLBACK_WEIGHT_KG, source: 'fallback' };
}

/** Lower-case, strip Vietnamese diacritics (đ → d), collapse spaces. */
export function normalizeVi(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Diacritic-insensitive activity search. Every query word must appear in the
 * name, category or aliases. Exact name, then name-prefix matches rank first.
 */
export function searchActivities(
  query: string,
  category: WorkoutCategory | 'all' = 'all',
  list: ActivityDef[] = ACTIVITIES,
  /** Activity keys the user logged recently (most recent first) — they rank first within a match tier. */
  recentKeys: readonly string[] = [],
): ActivityDef[] {
  const pool = category === 'all' ? list : list.filter((a) => a.category === category);
  const q = normalizeVi(query);
  if (!q) return pool;
  const words = q.split(' ');
  const recentRank = (key: string) => {
    const r = recentKeys.indexOf(key);
    return r < 0 ? Number.MAX_SAFE_INTEGER : r;
  };
  const scored: { a: ActivityDef; score: number; r: number; i: number }[] = [];
  pool.forEach((a, i) => {
    const hit = searchIndex(a);
    if (!words.every((w) => hit.hay.includes(w))) return;
    const { name, aliases } = hit;
    const score = name === q ? -1 : name.startsWith(q) ? 0 : aliases.includes(q) ? 0.5 : name.includes(q) ? 1 : 2;
    scored.push({ a, score, r: recentRank(a.key), i });
  });
  return scored.sort((x, y) => x.score - y.score || x.r - y.r || x.i - y.i).map((s) => s.a);
}

/** Normalised search fields per activity, built once (the catalogue is static). */
const SEARCH_INDEX = new WeakMap<ActivityDef, { name: string; aliases: string[]; hay: string }>();
function searchIndex(a: ActivityDef) {
  let hit = SEARCH_INDEX.get(a);
  if (!hit) {
    const name = normalizeVi(a.name);
    const aliases = (a.aliases ?? []).map(normalizeVi);
    const hay = `${name} ${normalizeVi(WORKOUT_CATEGORY_LABELS[a.category] ?? '')} ${a.category.replace('_', ' ')} ${aliases.join(' ')} ${a.variants.map((v) => normalizeVi(v.label)).join(' ')}`;
    hit = { name, aliases, hay };
    SEARCH_INDEX.set(a, hit);
  }
  return hit;
}

export function defaultVariant(a: ActivityDef): ActivityVariant {
  return a.variants[a.defaultVariant] ?? a.variants[0];
}

/** Variant whose MET matches (± 0.05), else undefined (= custom MET). */
export function variantForMet(a: ActivityDef | undefined, met: number): ActivityVariant | undefined {
  return a?.variants.find((v) => Math.abs(v.met - met) < 0.05);
}

/** "Chạy bộ · 8 km/h" — the variant label is omitted when the activity has a single variant. */
export function buildTitle(a: ActivityDef, v?: ActivityVariant): string {
  if (!v || a.variants.length < 2) return a.name;
  return `${a.name} · ${v.label}`.slice(0, 80);
}

// ---- distance remembered in notes ------------------------------------------
// fit_workouts has no distance column; the km the user entered is kept as the
// first line of `notes` ("Quãng đường 5,2 km") so editing / repeating restores it.

const DIST_LINE = /^\s*Quãng đường:?\s*(\d+(?:[.,]\d+)?)\s*km\s*(?:\n|$)/i;

/** Splits a stored note into its distance (km) and the user's own text. */
export function splitDistanceNote(notes: string | null | undefined): { km: number | null; rest: string } {
  const s = notes ?? '';
  const m = DIST_LINE.exec(s);
  if (!m) return { km: null, rest: s };
  const km = Number(m[1].replace(',', '.'));
  return { km: km > 0 && km <= 1000 ? km : null, rest: s.slice(m[0].length) };
}

/** Distance line + user's text (≤ 1000 chars, the DB limit); null when both are empty. */
export function joinDistanceNote(km: number | null | undefined, rest: string | null | undefined): string | null {
  const text = (rest ?? '').trim();
  const line = km && km > 0 ? `Quãng đường ${formatKm(km)} km` : '';
  const out = [line, text].filter(Boolean).join('\n').slice(0, 1000);
  return out || null;
}

/** "5,2" (1 decimal, Vietnamese comma, no trailing ",0"). */
export function formatKm(km: number): string {
  const r = Math.round(km * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ',');
}

/** Activity has speed-based variants (running, walking, road cycling) — distance ↔ pace makes sense. */
export function isSpeedBased(activity: string | null | undefined): boolean {
  return !!findActivity(activity)?.variants.some((v) => v.kmh);
}
