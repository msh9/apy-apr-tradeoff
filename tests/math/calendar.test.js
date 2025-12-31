import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonthsPreserveDay,
  daysBetween,
  isSameDay,
  lastDayOfMonth,
  normalizeDate,
} from '../../src/math/calendar.js';

describe('calendar utilities', () => {
  it('normalizes iso date strings to utc midnight', () => {
    const date = normalizeDate('2024-01-15');

    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBe(15);
  });

  it('computes the last day of the month', () => {
    const lastDay = lastDayOfMonth(new Date('2025-01-15'));
    expect(lastDay.getUTCDate()).toBe(31);
    expect(lastDay.getMonth()).toBe(0);
  });

  describe('when comparing dates', () => {
    it('correctly compares two equivalent dates', () => {
      expect(isSameDay(new Date(2025, 4, 23), new Date(2025, 4, 23))).toBeTruthy();
    });
    it('ignores timestamps', () => {
      expect(
        isSameDay(new Date('2025-04-23T12:12:12Z'), new Date('2025-04-23T12:14:14Z')),
      ).toBeTruthy();
    });
    it('correctly compares two non-equivalent dates', () => {
      expect(isSameDay(new Date(2025, 3, 1), new Date(2025, 3, 2))).toBeFalsy();
    });
  });

  describe('when normalizing dates', () => {
    it('parses and forces time to beginning of date', () => {
      const parsed = normalizeDate('2025-04-01T12:12:12');
      expect(parsed.getTime()).toBe(new Date('2025-04-01T00:00:00Z').getTime());
    });
    it('coerces date objects to be UTC beginning of day', () => {
      const normalized = normalizeDate(new Date('2025-11-30T01:00:01+02:00'));
      expect(normalized.getTime()).toBe(new Date('2025-11-29').getTime());
    });
  });

  describe('when adding months', () => {
    it('preserves day of month when adding months, falling back to month end', () => {
      const jan31 = normalizeDate('2024-01-31');
      const februaryDueDate = addMonthsPreserveDay(jan31, 1);
      const marchDueDate = addMonthsPreserveDay(jan31, 2);

      expect(isSameDay(februaryDueDate, normalizeDate('2024-02-29'))).toBe(true);
      expect(isSameDay(marchDueDate, normalizeDate('2024-03-31'))).toBe(true);
    });
    it('preserves day of month across year end boundary', () => {
      const dec30 = normalizeDate('2025-12-30');
      const jan30 = addMonthsPreserveDay(dec30, 1);

      expect(isSameDay(jan30, normalizeDate('2026-01-30'))).toBeTruthy();
    });
  });

  it('computes day spans using real calendar intervals', () => {
    const start = normalizeDate('2024-01-15');
    const end = normalizeDate('2024-02-15');

    expect(daysBetween(start, end)).toBe(31);
    expect(isSameDay(addDays(start, 31), end)).toBe(true);
    expect(lastDayOfMonth(start).getUTCDate()).toBe(31);
  });

  it('computes day spans across year end', () => {
    const start = normalizeDate('2025-12-30');
    const end = normalizeDate('2026-01-10');

    expect(daysBetween(start, end)).toBe(11);
    expect(lastDayOfMonth(start).getUTCDate()).toBe(31);
  });
});
