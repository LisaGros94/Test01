// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER LOGIC — the core of the product, and the thing that will change most.
//
// Everything here is PURE: it takes a snapshot of state + `now` and returns the
// notifications that *should* exist. No database, no Slack, no email, no clocks
// of its own. That makes every rule unit-testable in isolation (see
// triggers.test.ts) and lets the cron job and the event handlers share one
// definition of "when do we notify?".
//
// De-duplication, rate-limiting, batching, mutes and self-suppression are NOT
// here — they belong to the delivery engine. This module only answers the
// question "given the world as it is right now, who should hear about what?".
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Activity,
  NotificationIntent,
  SentNotification,
  Status,
  Task,
  User,
} from '../types';
import { daysBetween, daysUntilDeadline, localParts } from '../time';

export interface TriggerContext {
  now: Date;
  tasks: Task[];
  users: User[];
  /** All activity, keyed by task id, used for staleness + handoff history. */
  activityByTask: Record<string, Activity[]>;
}

const link = (taskId: string) => `/task/${taskId}`;

function userById(ctx: TriggerContext, id: string): User | undefined {
  return ctx.users.find((u) => u.id === id);
}

function founders(ctx: TriggerContext): User[] {
  return ctx.users.filter((u) => u.isFounder);
}

/** Latest moment anything actually happened on the task (edit OR comment). */
export function lastActivityAt(ctx: TriggerContext, task: Task): string {
  const acts = ctx.activityByTask[task.id] ?? [];
  const latest = acts.reduce<string>(
    (max, a) => (a.at > max ? a.at : max),
    task.lastTouched,
  );
  return latest;
}

/** In-progress and untouched for 14+ days → surfaced as "drifting" in digests. */
export function isDrifting(ctx: TriggerContext, task: Task): boolean {
  if (task.status !== 'In progress') return false;
  return daysBetween(ctx.now, lastActivityAt(ctx, task)) >= 14;
}

function intent(
  partial: Omit<NotificationIntent, 'createdAt' | 'link'> &
    Partial<Pick<NotificationIntent, 'link'>>,
  ctx: TriggerContext,
): NotificationIntent {
  return {
    link: partial.taskId ? link(partial.taskId) : '/',
    createdAt: ctx.now.toISOString(),
    ...partial,
  };
}

// ── Scheduled triggers (evaluated by the cron job) ───────────────────────────

/**
 * Deadline warnings: 7 days out, 2 days out, morning of, then daily once
 * overdue. Overdue tasks also notify the *other* founders after 3 days.
 */
function deadlineIntents(ctx: TriggerContext): NotificationIntent[] {
  const out: NotificationIntent[] = [];
  for (const task of ctx.tasks) {
    if (!task.deadline || task.status === 'Done') continue;
    const lead = userById(ctx, task.leadId);
    if (!lead) continue;

    const days = daysUntilDeadline(task.deadline, ctx.now, lead.timezone);
    const { dateKey } = localParts(ctx.now, lead.timezone);

    const push = (key: string, body: string, recipientId: string) =>
      out.push(
        intent(
          {
            dedupeKey: key,
            recipientId,
            trigger: 'deadline',
            taskId: task.id,
            title: `Deadline: ${task.title}`,
            body,
            immediate: false,
            actorId: null,
          },
          ctx,
        ),
      );

    if (days === 7) {
      push(`deadline:7:${task.id}`, `Due in 7 days (${task.deadline}).`, lead.id);
    } else if (days === 2) {
      push(`deadline:2:${task.id}`, `Due in 2 days (${task.deadline}).`, lead.id);
    } else if (days === 0) {
      push(`deadline:0:${task.id}`, `Due today.`, lead.id);
    } else if (days < 0) {
      const overdueBy = -days;
      // Daily nudge to the lead while overdue (once per calendar day).
      push(
        `deadline:overdue:${task.id}:${dateKey}`,
        `Overdue by ${overdueBy} day${overdueBy === 1 ? '' : 's'}.`,
        lead.id,
      );
      // After 3 days overdue, loop in the other founder(s).
      if (overdueBy >= 3) {
        for (const f of founders(ctx)) {
          if (f.id === lead.id) continue;
          push(
            `deadline:overdue-founder:${task.id}:${f.id}:${dateKey}`,
            `${lead.name}'s task is ${overdueBy} days overdue.`,
            f.id,
          );
        }
      }
    }
  }
  return out;
}

/**
 * Staleness: In progress with no activity for 7 days → nudge lead. 14 days →
 * nudge lead again (and it also shows as "drifting" in the Friday digest).
 * Dedupe key is anchored to the last activity, so a fresh touch resets it.
 */
function stalenessIntents(ctx: TriggerContext): NotificationIntent[] {
  const out: NotificationIntent[] = [];
  for (const task of ctx.tasks) {
    if (task.status !== 'In progress') continue;
    const lead = userById(ctx, task.leadId);
    if (!lead) continue;

    const anchor = lastActivityAt(ctx, task);
    const idle = daysBetween(ctx.now, anchor);

    const nudge = (threshold: 7 | 14) =>
      out.push(
        intent(
          {
            dedupeKey: `staleness:${threshold}:${task.id}:${anchor}`,
            recipientId: lead.id,
            trigger: 'staleness',
            taskId: task.id,
            title: `Stale: ${task.title}`,
            body:
              threshold === 7
                ? `No movement in 7 days. Still on it, or should it change status?`
                : `Drifting — 14 days without a change. This is in Friday's digest.`,
            immediate: false,
            actorId: null,
          },
          ctx,
        ),
      );

    if (idle >= 14) nudge(14);
    else if (idle >= 7) nudge(7);
  }
  return out;
}

/** Blocked for 3+ days → notify BOTH founders, not just the lead. */
function blockedEscalationIntents(ctx: TriggerContext): NotificationIntent[] {
  const out: NotificationIntent[] = [];
  for (const task of ctx.tasks) {
    if (task.status !== 'Blocked') continue;
    const stuck = daysBetween(ctx.now, task.statusChangedAt);
    if (stuck < 3) continue;

    for (const f of founders(ctx)) {
      out.push(
        intent(
          {
            // Anchored to statusChangedAt so re-blocking starts a fresh clock.
            dedupeKey: `blocked_escalation:${task.id}:${task.statusChangedAt}:${f.id}`,
            recipientId: f.id,
            trigger: 'blocked_escalation',
            taskId: task.id,
            title: `Blocked ${stuck}d: ${task.title}`,
            body: `Stuck ${stuck} days. Blocked by: ${task.blockedBy ?? 'unspecified'}.`,
            immediate: false,
            actorId: null,
          },
          ctx,
        ),
      );
    }
  }
  return out;
}

/**
 * Waiting on external: every 5 days, prompt the lead to chase or change status.
 * The clock resets on an "I chased today" action (which sets lastChasedAt).
 */
function waitingExternalIntents(ctx: TriggerContext): NotificationIntent[] {
  const out: NotificationIntent[] = [];
  for (const task of ctx.tasks) {
    if (task.status !== 'Waiting on external') continue;
    const lead = userById(ctx, task.leadId);
    if (!lead) continue;

    const anchor = task.lastChasedAt ?? task.statusChangedAt;
    const idle = daysBetween(ctx.now, anchor);
    if (idle < 5) continue;

    const period = Math.floor(idle / 5); // 1 at day 5, 2 at day 10, …
    out.push(
      intent(
        {
          dedupeKey: `waiting_external:${task.id}:${anchor}:${period}`,
          recipientId: lead.id,
          trigger: 'waiting_external',
          taskId: task.id,
          title: `Still waiting: ${task.title}`,
          body: `Still waiting on ${task.waitingOn ?? 'external party'}? Chase or change status.`,
          immediate: false,
          actorId: null,
        },
        ctx,
      ),
    );
  }
  return out;
}

/**
 * Evaluate every scheduled (cron-driven) trigger against the current world.
 * Idempotent: repeated runs produce the same intents; the engine drops any
 * whose dedupeKey has already been sent.
 */
export function evaluateScheduled(ctx: TriggerContext): NotificationIntent[] {
  return [
    ...deadlineIntents(ctx),
    ...stalenessIntents(ctx),
    ...blockedEscalationIntents(ctx),
    ...waitingExternalIntents(ctx),
  ];
}

// ── Event triggers (fired inline at mutation time) ───────────────────────────

/** You were added as a collaborator. Immediate. */
export function onCollaboratorAdded(
  ctx: TriggerContext,
  task: Task,
  collaboratorId: string,
  actorId: string,
): NotificationIntent {
  return intent(
    {
      dedupeKey: `assignment:collab:${task.id}:${collaboratorId}:${ctx.now.toISOString()}`,
      recipientId: collaboratorId,
      trigger: 'assignment',
      taskId: task.id,
      title: `Added to: ${task.title}`,
      body: `You're now a collaborator on "${task.title}".`,
      immediate: true,
      actorId,
    },
    ctx,
  );
}

/**
 * The lead changed (handoff). The new lead gets the full task history so they
 * don't have to reconstruct context. This subsumes the plain assignment notice.
 */
export function onHandoff(
  ctx: TriggerContext,
  task: Task,
  newLeadId: string,
  actorId: string,
): NotificationIntent {
  const history = (ctx.activityByTask[task.id] ?? [])
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((a) => `• ${a.at.slice(0, 10)} — ${a.summary}`)
    .join('\n');

  return intent(
    {
      dedupeKey: `handoff:${task.id}:${newLeadId}:${ctx.now.toISOString()}`,
      recipientId: newLeadId,
      trigger: 'handoff',
      taskId: task.id,
      title: `You now lead: ${task.title}`,
      body:
        `You're the new lead on "${task.title}".\n\n` +
        `Status: ${task.status}${task.deadline ? ` · Due ${task.deadline}` : ''}\n\n` +
        `History:\n${history || '• (no prior activity)'}`,
      immediate: true,
      actorId,
    },
    ctx,
  );
}

/** @mention in a comment. Immediate, one per mentioned user (never the author). */
export function onMention(
  ctx: TriggerContext,
  task: Task,
  commentId: string,
  authorId: string,
  mentionIds: string[],
): NotificationIntent[] {
  const author = userById(ctx, authorId);
  return mentionIds
    .filter((id) => id !== authorId)
    .map((id) =>
      intent(
        {
          dedupeKey: `mention:${commentId}:${id}`,
          recipientId: id,
          trigger: 'mention',
          taskId: task.id,
          title: `${author?.name ?? 'Someone'} mentioned you`,
          body: `on "${task.title}".`,
          immediate: true,
          actorId: authorId,
        },
        ctx,
      ),
    );
}

/** Status changed on a task you watch (you're a collaborator). Batched. */
export function onWatchedStatusChange(
  ctx: TriggerContext,
  task: Task,
  from: Status,
  to: Status,
  actorId: string,
): NotificationIntent[] {
  const watchers = new Set(task.collaboratorIds);
  watchers.delete(actorId);
  return [...watchers].map((id) =>
    intent(
      {
        dedupeKey: `watched_status:${task.id}:${from}->${to}:${ctx.now.toISOString()}`,
        recipientId: id,
        trigger: 'watched_status',
        taskId: task.id,
        title: `${task.title}: ${from} → ${to}`,
        body: `Status changed on a task you're watching.`,
        immediate: false, // batched — never immediate
        actorId,
      },
      ctx,
    ),
  );
}

// ── Convenience filters used by digests + the Blocked view ───────────────────

export function isOverdue(ctx: TriggerContext, task: Task, tz: User['timezone'] = 'Europe/London'): boolean {
  if (!task.deadline || task.status === 'Done') return false;
  return daysUntilDeadline(task.deadline, ctx.now, tz) < 0;
}

export const isStuck = (t: Task): boolean =>
  t.status === 'Blocked' || t.status === 'Waiting on external';

export function sentKeys(sent: SentNotification[]): Set<string> {
  return new Set(sent.map((s) => s.dedupeKey));
}
