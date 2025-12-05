/**
 * Small helper utilities for working with calendar dates in simulations.
 * Dates are normalized to UTC midnight to avoid DST edge cases.
 * @module calendar
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeDate(input) {
  const parsed = parseDateInput(input);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

function parseDateInput(input) {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new Error('Invalid date value');
    }
    return input;
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    const isoOnlyDate = /^\d{4}-\d{2}-\d{2}$/;
    if (isoOnlyDate.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map((part) => Number.parseInt(part, 10));
      return new Date(Date.UTC(year, month - 1, day));
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid date value');
    }
    return parsed;
  }

  if (typeof input === 'number') {
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid date value');
    }
    return parsed;
  }

  throw new Error('Date input must be a Date, ISO string, or timestamp');
}

function addDays(date, days) {
  if (!Number.isInteger(days)) {
    throw new Error('Days must be an integer');
  }
  const normalized = normalizeDate(date);
  return new Date(normalized.getTime() + days * MS_PER_DAY);
}

function isSameDay(left, right) {
  const l = normalizeDate(left);
  const r = normalizeDate(right);
  return (
    l.getUTCFullYear() === r.getUTCFullYear() &&
    l.getUTCMonth() === r.getUTCMonth() &&
    l.getUTCDate() === r.getUTCDate()
  );
}

function lastDayOfMonth(date) {
  const normalized = normalizeDate(date);
  return new Date(Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth() + 1, 0));
}

function addMonthsPreserveDay(date, monthsToAdd) {
  if (!Number.isInteger(monthsToAdd)) {
    throw new Error('Months to add must be an integer');
  }

  const normalized = normalizeDate(date);
  const targetMonth = normalized.getUTCMonth() + monthsToAdd;
  const anchor = new Date(Date.UTC(normalized.getUTCFullYear(), targetMonth, 1));
  const lastDate = lastDayOfMonth(anchor).getUTCDate();
  const desiredDay = normalized.getUTCDate();
  const safeDay = Math.min(desiredDay, lastDate);
  return new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), safeDay));
}

function daysBetween(start, end) {
  const normalizedStart = normalizeDate(start);
  const normalizedEnd = normalizeDate(end);
  const diff = normalizedEnd.getTime() - normalizedStart.getTime();
  return Math.round(diff / MS_PER_DAY);
}

export { addDays, addMonthsPreserveDay, daysBetween, isSameDay, lastDayOfMonth, normalizeDate };
