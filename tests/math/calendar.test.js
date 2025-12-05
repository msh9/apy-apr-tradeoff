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

  it('preserves day of month when adding months, falling back to month end', () => {
    const jan31 = normalizeDate('2024-01-31');
    const februaryDueDate = addMonthsPreserveDay(jan31, 1);
    const marchDueDate = addMonthsPreserveDay(jan31, 2);

    expect(isSameDay(februaryDueDate, normalizeDate('2024-02-29'))).toBe(true);
    expect(isSameDay(marchDueDate, normalizeDate('2024-03-31'))).toBe(true);
  });

  it('computes day spans using real calendar intervals', () => {
    const start = normalizeDate('2024-01-15');
    const end = normalizeDate('2024-02-15');

    expect(daysBetween(start, end)).toBe(31);
    expect(isSameDay(addDays(start, 31), end)).toBe(true);
    expect(lastDayOfMonth(start).getUTCDate()).toBe(31);
  });
});
