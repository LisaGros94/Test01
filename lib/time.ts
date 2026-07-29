import { toZonedTime } from 'date-fns-tz';
import type { Timezone } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;

/** Whole days between two ISO instants (a - b), floored. Never negative-rounds. */
export function daysBetween(a: string | Date, b: string | Date): number {
  const ms = new Date(a).getTime() - new Date(b).getTime();
  return Math.floor(ms / DAY_MS);
}

export function hoursBetween(a: string | Date, b: string | Date): number {
  const ms = new Date(a).getTime() - new Date(b).getTime();
  return Math.floor(ms / HOUR_MS);
}

/**
 * Whole calendar-days from `now` until a yyyy-mm-dd deadline, evaluated in the
 * user's timezone so "2 days out" and "morning of" line up with their day.
 * Positive = deadline in the future, 0 = today, negative = overdue.
 */
export function daysUntilDeadline(
  deadline: string,
  now: Date,
  tz: Timezone,
): number {
  const today = toZonedTime(now, tz);
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const todayMidnight = Date.UTC(y, m, d);

  const [dy, dm, dd] = deadline.split('-').map(Number);
  const deadlineMidnight = Date.UTC(dy, dm - 1, dd);

  return Math.round((deadlineMidnight - todayMidnight) / DAY_MS);
}

/** Local wall-clock parts for a user's timezone at instant `now`. */
export function localParts(now: Date, tz: Timezone) {
  const z = toZonedTime(now, tz);
  return {
    weekday: z.getDay(), // 0 = Sun … 1 = Mon … 5 = Fri
    hour: z.getHours(),
    minute: z.getMinutes(),
    dateKey: `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, '0')}-${String(
      z.getDate(),
    ).padStart(2, '0')}`,
  };
}

/** Short, humane "how long stuck" label, e.g. "3d", "5h", "just now". */
export function ageLabel(from: string, now: Date): string {
  const ms = now.getTime() - new Date(from).getTime();
  if (ms < HOUR_MS) return 'just now';
  if (ms < DAY_MS) return `${Math.floor(ms / HOUR_MS)}h`;
  return `${Math.floor(ms / DAY_MS)}d`;
}
