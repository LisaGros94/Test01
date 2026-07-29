import type { Task, User } from './types';

/** Free-text match across title, notes, category, blocker/waiting reason, lead. */
export function matchesQuery(task: Task, query: string, users: User[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const lead = users.find((u) => u.id === task.leadId);
  const hay = [
    task.title,
    task.notes,
    task.category,
    task.status,
    task.blockedBy ?? '',
    task.waitingOn ?? '',
    lead?.name ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function byDeadline(a: Task, b: Task): number {
  if (!a.deadline && !b.deadline) return 0;
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return a.deadline.localeCompare(b.deadline);
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
