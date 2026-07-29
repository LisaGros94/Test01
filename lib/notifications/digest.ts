// ─────────────────────────────────────────────────────────────────────────────
// DIGESTS — also pure. Produce a single composed notification per recipient, or
// null when there's nothing to report (digests suppress entirely when empty).
//
//  • Monday 08:00 local, everyone: open tasks by deadline, overdue, blocked-on-you.
//  • Friday 16:00, founders only: completed / slipped this week, blocked w/ age,
//    and anything with no movement in 14+ days.
//
// Scheduling (which user, at what local hour) is decided by the engine using the
// user's timezone; this module only builds the content.
// ─────────────────────────────────────────────────────────────────────────────

import type { NotificationIntent, Task, User } from '../types';
import { ageLabel, daysBetween, daysUntilDeadline } from '../time';
import {
  isDrifting,
  isOverdue,
  isStuck,
  lastActivityAt,
  type TriggerContext,
} from './triggers';

function byDeadline(a: Task, b: Task): number {
  if (!a.deadline && !b.deadline) return 0;
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return a.deadline.localeCompare(b.deadline);
}

const section = (heading: string, lines: string[]): string | null =>
  lines.length ? `${heading}\n${lines.map((l) => `  • ${l}`).join('\n')}` : null;

function taskLine(t: Task): string {
  const bits = [t.title];
  if (t.deadline) bits.push(`(due ${t.deadline})`);
  return bits.join(' ');
}

/**
 * Monday digest for one user. Returns null if the user has nothing open,
 * overdue, or blocked-on-them — no empty digest is ever sent.
 */
export function buildMondayDigest(
  ctx: TriggerContext,
  user: User,
): NotificationIntent | null {
  const mine = ctx.tasks.filter(
    (t) => t.leadId === user.id && t.status !== 'Done',
  );
  const open = mine.slice().sort(byDeadline);
  const overdue = mine.filter((t) => isOverdue(ctx, t, user.timezone));

  // "Blocked on you by someone else": tasks led by others, currently stuck,
  // where this user is a collaborator and could plausibly unblock it.
  const blockedOnYou = ctx.tasks.filter(
    (t) =>
      t.leadId !== user.id &&
      isStuck(t) &&
      t.collaboratorIds.includes(user.id),
  );

  const sections = [
    section(
      `Your open tasks (${open.length})`,
      open.map((t) => `${t.priority} ${taskLine(t)} — ${t.status}`),
    ),
    section(
      `⚠ Overdue (${overdue.length})`,
      overdue.map(
        (t) => `${taskLine(t)} — ${-daysUntilDeadline(t.deadline!, ctx.now, user.timezone)}d late`,
      ),
    ),
    section(
      `Blocked on you (${blockedOnYou.length})`,
      blockedOnYou.map(
        (t) => `${t.title} — ${t.blockedBy ?? t.waitingOn ?? 'stuck'} (${ageLabel(t.statusChangedAt, ctx.now)})`,
      ),
    ),
  ].filter(Boolean) as string[];

  if (sections.length === 0) return null;

  return {
    dedupeKey: `digest_monday:${user.id}:${weekKey(ctx.now)}`,
    recipientId: user.id,
    trigger: 'digest_monday',
    taskId: null,
    title: 'Your week — Monday digest',
    body: sections.join('\n\n'),
    link: '/',
    immediate: false,
    actorId: null,
    createdAt: ctx.now.toISOString(),
  };
}

/**
 * Friday digest for a founder. Returns null if there is genuinely nothing to
 * report this week.
 */
export function buildFridayDigest(
  ctx: TriggerContext,
  founder: User,
): NotificationIntent | null {
  const completed = ctx.tasks.filter(
    (t) => t.status === 'Done' && daysBetween(ctx.now, t.statusChangedAt) < 7,
  );

  // "Slipped": a deadline fell in the last 7 days and the task still isn't done.
  const slipped = ctx.tasks.filter((t) => {
    if (!t.deadline || t.status === 'Done') return false;
    const d = daysUntilDeadline(t.deadline, ctx.now, founder.timezone);
    return d < 0 && d >= -7;
  });

  const blocked = ctx.tasks
    .filter(isStuck)
    .sort((a, b) => a.statusChangedAt.localeCompare(b.statusChangedAt));

  const drifting = ctx.tasks.filter((t) => isDrifting(ctx, t));

  const sections = [
    section(`✓ Completed this week (${completed.length})`, completed.map((t) => t.title)),
    section(`↓ Slipped this week (${slipped.length})`, slipped.map(taskLine)),
    section(
      `⛔ Blocked / waiting (${blocked.length})`,
      blocked.map(
        (t) =>
          `${t.title} — ${ageLabel(t.statusChangedAt, ctx.now)} — ${t.blockedBy ?? t.waitingOn ?? ''}`,
      ),
    ),
    section(
      `No movement 14+ days (${drifting.length})`,
      drifting.map((t) => `${t.title} — ${ageLabel(lastActivityAt(ctx, t), ctx.now)} idle`),
    ),
  ].filter(Boolean) as string[];

  if (sections.length === 0) return null;

  return {
    dedupeKey: `digest_friday:${founder.id}:${weekKey(ctx.now)}`,
    recipientId: founder.id,
    trigger: 'digest_friday',
    taskId: null,
    title: 'Founders’ Friday digest',
    body: sections.join('\n\n'),
    link: '/blocked',
    immediate: false,
    actorId: null,
    createdAt: ctx.now.toISOString(),
  };
}

/** ISO-ish year+week key so a digest fires at most once per calendar week. */
export function weekKey(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
