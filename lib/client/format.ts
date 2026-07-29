// Small, browser-safe view helpers: status tints, deadline framing, ages.
import type { Status, Task } from './types';

export const STATUS_TINT: Record<Status, string> = {
  'Not started': 'tint-notstarted',
  'In progress': 'tint-inprogress',
  Blocked: 'tint-blocked',
  'Waiting on external': 'tint-waiting',
  Done: 'tint-done',
};

export const STATUS_ORDER: Status[] = [
  'Blocked',
  'Waiting on external',
  'In progress',
  'Not started',
  'Done',
];

export const PRIORITY_COLOR: Record<string, string> = {
  P0: 'var(--color-alert)',
  P1: 'var(--color-ink-2)',
  P2: 'var(--color-ink-3)',
};

const DAY = 86400000;

/** Whole days until a yyyy-mm-dd date in the viewer's local timezone. */
export function daysUntil(deadline: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = deadline.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - today) / DAY);
}

export function isOverdue(t: Task): boolean {
  return !!t.deadline && t.status !== 'Done' && daysUntil(t.deadline) < 0;
}

export function isUrgent(t: Task): boolean {
  return isOverdue(t) || t.status === 'Blocked';
}

export function deadlineLabel(deadline: string | null): { text: string; overdue: boolean; soon: boolean } {
  if (!deadline) return { text: '—', overdue: false, soon: false };
  const d = daysUntil(deadline);
  if (d < 0) return { text: `${-d}d overdue`, overdue: true, soon: false };
  if (d === 0) return { text: 'Today', overdue: false, soon: true };
  if (d === 1) return { text: 'Tomorrow', overdue: false, soon: true };
  if (d <= 7) return { text: `${d}d`, overdue: false, soon: true };
  return { text: deadline.slice(5), overdue: false, soon: false };
}

/** "3d", "5h", "just now" since an ISO instant. */
export function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 3600000) return 'just now';
  if (ms < DAY) return `${Math.floor(ms / 3600000)}h`;
  return `${Math.floor(ms / DAY)}d`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** How long a stuck task has been stuck, for the Blocked view sort/label. */
export function stuckDays(t: Task): number {
  return Math.floor((Date.now() - new Date(t.statusChangedAt).getTime()) / DAY);
}
