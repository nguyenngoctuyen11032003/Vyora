// Re-runs the matching Fitora tests (src/features/workout/lib.test.ts, src/lib/energy.test.ts) against the
// copies, proving the copy keeps Fitora's behaviour.
import { describe, expect, it } from 'vitest';
import {
  ACTIVITIES,
  activitiesByCategory,
  buildTitle,
  findActivity,
  formatKm,
  isSpeedBased,
  joinDistanceNote,
  metKcal,
  normalizeVi,
  resolveWeight,
  searchActivities,
  WORKOUT_CATEGORIES,
} from '@/src/lib/fitora';

describe('fitora copy', () => {
  it('normalizeVi strips diacritics', () => {
    expect(normalizeVi('  Đạp   Xe ')).toBe('dap xe');
  });

  it('searchActivities is diacritic-insensitive', () => {
    expect(searchActivities('cau long')[0].key).toBe('badminton');
    expect(searchActivities('cau long')[0].name).toBe('Cầu lông');
    expect(searchActivities('bơi').map((a) => a.key)).toContain('swim_freestyle');
    expect(searchActivities('zumba').map((a) => a.key)).toContain('dance');
    expect(searchActivities('chay', 'running').every((a) => a.category === 'running')).toBe(true);
    expect(searchActivities('', 'yoga').length).toBe(ACTIVITIES.filter((a) => a.category === 'yoga').length);
    expect(searchActivities('xyzxyz')).toEqual([]);
    expect(searchActivities('chạy bộ')[0].key).toBe('running');
    expect(searchActivities('gym')[0].key).toBe('weight_training');
    expect(searchActivities('ĐÁ BÓNG')[0].key).toBe('football');
    expect(searchActivities('the thao doi').every((a) => a.category === 'team_sport')).toBe(true);
  });

  it('buildTitle omits the label of single-variant activities', () => {
    const run = findActivity('running')!;
    expect(buildTitle(run, run.variants[1])).toBe('Chạy bộ · 8 km/h');
    const pil = findActivity('pilates')!;
    expect(buildTitle(pil, pil.variants[0])).toBe('Pilates');
  });

  it('resolveWeight: measured → profile → fallback, 25–300 kg only', () => {
    expect(resolveWeight(70.5, 80)).toEqual({ kg: 70.5, source: 'measured' });
    expect(resolveWeight(null, 80)).toEqual({ kg: 80, source: 'profile' });
    expect(resolveWeight(undefined, null).source).toBe('fallback');
    expect(resolveWeight(7, 68)).toEqual({ kg: 68, source: 'profile' });
    expect(resolveWeight(320, 70)).toEqual({ kg: 70, source: 'profile' });
    expect(resolveWeight(25, null)).toEqual({ kg: 25, source: 'measured' });
    expect(resolveWeight(300, null)).toEqual({ kg: 300, source: 'measured' });
  });

  it('distance note + km format', () => {
    expect(joinDistanceNote(null, '  ')).toBeNull();
    expect(joinDistanceNote(0, 'x')).toBe('x');
    expect(joinDistanceNote(3, '')).toBe('Quãng đường 3 km');
    expect(joinDistanceNote(5.24, 'Gym app')).toBe('Quãng đường 5,2 km\nGym app');
    expect(joinDistanceNote(5, 'a'.repeat(2000))!.length).toBe(1000);
    expect(formatKm(5)).toBe('5');
    expect(formatKm(5.25)).toBe('5,3');
    expect(isSpeedBased('running')).toBe(true);
    expect(isSpeedBased('badminton')).toBe(false);
  });

  it('metKcal = MET·3.5·kg/200·min', () => {
    expect(metKcal(8, 70, 30)).toBe(294);
    expect(metKcal(8.3, 70, 30)).toBe(305);
    expect(metKcal(8, 70, 0)).toBe(0);
  });

  it('every category has activities', () => {
    for (const c of WORKOUT_CATEGORIES) expect(activitiesByCategory(c).length).toBeGreaterThan(0);
  });
});
