/* @vitest-environment jsdom */

import {
  CURRENT_QUARTER_ADVANCE_DAYS,
  getCurrentAcademicSeason,
  getSelectableAcademicSeasons,
  isValidAcademicSeason,
} from '@/utils/currentQuarter';

describe('currentQuarter helpers', () => {
  test('returns season that matches the official date ranges', () => {
    const season = getCurrentAcademicSeason({
      now: new Date('2026-04-01T12:00:00Z'),
      advanceDays: 0,
    });

    expect(season).toBe('2026:1');
  });

  test('applies offset to anticipate the next quarter during recess windows', () => {
    const season = getCurrentAcademicSeason({
      now: new Date('2026-05-10T12:00:00Z'),
      advanceDays: CURRENT_QUARTER_ADVANCE_DAYS,
    });

    expect(season).toBe('2026:2');
  });

  test('falls back to newest known season for dates after configured ranges', () => {
    const season = getCurrentAcademicSeason({
      now: new Date('2030-01-01T12:00:00Z'),
      advanceDays: 0,
    });

    expect(season).toBe('2026:3');
  });

  test('falls back to oldest known season for dates before configured ranges', () => {
    const season = getCurrentAcademicSeason({
      now: new Date('2019-01-01T12:00:00Z'),
      advanceDays: 0,
    });

    expect(season).toBe('2021:1');
  });

  test('returns only current + previous seasons for selector options', () => {
    expect(getSelectableAcademicSeasons('2026:2')).toEqual([
      '2026:2',
      '2026:1',
      '2025:3',
      '2025:2',
      '2025:1',
      '2024:3',
      '2024:2',
      '2024:1',
      '2023:3',
      '2023:2',
      '2023:1',
      '2022:3',
      '2022:2',
      '2022:1',
      '2021:3',
      '2021:2',
      '2021:1',
    ]);
  });

  test('validates seasons based on configured official ranges', () => {
    expect(isValidAcademicSeason('2026:3')).toBe(true);
    expect(isValidAcademicSeason('2027:1')).toBe(false);
  });
});
