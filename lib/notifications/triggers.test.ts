import { describe, it, expect } from 'vitest';
import type { Activity, Task, User } from '../types';
import {
  evaluateScheduled,
  onHandoff,
  onMention,
  onWatchedStatusChange,
  onCollaboratorAdded,
  isDrifting,
  type TriggerContext,
} from './triggers';
import { DAY_MS } from '../time';

const NOW = new Date('2026-07-29T09:00:00.000Z'); // a Wednesday

const lisa: User = {
  id: 'lisa',
  email: 'lisa@blanche.xyz',
  name: 'Lisa',
  slackUserId: 'U-LISA',
  timezone: 'Europe/London',
  isFounder: true,
};
const max: User = {
  id: 'max',
  email: 'max@blanche.xyz',
  name: 'Max',
  slackUserId: 'U-MAX',
  timezone: 'Europe/Berlin',
  isFounder: true,
};
const nina: User = {
  id: 'nina',
  email: 'nina@blanche.xyz',
  name: 'Nina',
  slackUserId: 'U-NINA',
  timezone: 'Europe/Paris',
  isFounder: false,
};

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * DAY_MS).toISOString();
}
function inDays(n: number): string {
  return new Date(NOW.getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

function makeTask(over: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Test task',
    category: 'Ops',
    leadId: 'nina',
    collaboratorIds: [],
    status: 'In progress',
    deadline: null,
    notes: '',
    blockedBy: null,
    waitingOn: null,
    priority: 'P1',
    lastTouched: daysAgo(0),
    createdAt: daysAgo(30),
    createdBy: 'lisa',
    lastChasedAt: null,
    statusChangedAt: daysAgo(0),
    ...over,
  };
}

function ctx(tasks: Task[], activity: Record<string, Activity[]> = {}): TriggerContext {
  return { now: NOW, tasks, users: [lisa, max, nina], activityByTask: activity };
}

describe('deadline triggers', () => {
  it('fires exactly at 7 days out', () => {
    const t = makeTask({ deadline: inDays(7) });
    const out = evaluateScheduled(ctx([t]));
    const d = out.filter((i) => i.trigger === 'deadline');
    expect(d).toHaveLength(1);
    expect(d[0].recipientId).toBe('nina');
    expect(d[0].dedupeKey).toBe('deadline:7:t1');
  });

  it('does not fire at 6 or 5 days out', () => {
    expect(evaluateScheduled(ctx([makeTask({ deadline: inDays(6) })]))).toHaveLength(0);
    expect(evaluateScheduled(ctx([makeTask({ deadline: inDays(5) })]))).toHaveLength(0);
  });

  it('fires morning-of at 0 days', () => {
    const out = evaluateScheduled(ctx([makeTask({ deadline: inDays(0) })]));
    expect(out.map((i) => i.dedupeKey)).toContain('deadline:0:t1');
  });

  it('nudges the lead daily once overdue', () => {
    const out = evaluateScheduled(ctx([makeTask({ deadline: inDays(-1) })]));
    const lead = out.filter((i) => i.recipientId === 'nina');
    expect(lead).toHaveLength(1);
    expect(lead[0].dedupeKey).toContain('deadline:overdue:t1');
  });

  it('loops in the other founders after 3 days overdue', () => {
    const out = evaluateScheduled(ctx([makeTask({ deadline: inDays(-3), leadId: 'lisa' })]));
    // lead (lisa) + other founder (max) — nina is not a founder
    const recips = new Set(out.map((i) => i.recipientId));
    expect(recips.has('lisa')).toBe(true);
    expect(recips.has('max')).toBe(true);
    expect(recips.has('nina')).toBe(false);
  });

  it('does not nag deadlines on Done tasks', () => {
    const out = evaluateScheduled(ctx([makeTask({ deadline: inDays(-5), status: 'Done' })]));
    expect(out).toHaveLength(0);
  });
});

describe('staleness triggers', () => {
  it('nudges the lead at 7 idle days', () => {
    const t = makeTask({ status: 'In progress', lastTouched: daysAgo(8) });
    const out = evaluateScheduled(ctx([t])).filter((i) => i.trigger === 'staleness');
    expect(out).toHaveLength(1);
    expect(out[0].dedupeKey).toContain('staleness:7:t1');
  });

  it('escalates to a 14-day drifting nudge', () => {
    const t = makeTask({ status: 'In progress', lastTouched: daysAgo(15) });
    const out = evaluateScheduled(ctx([t])).filter((i) => i.trigger === 'staleness');
    expect(out).toHaveLength(1);
    expect(out[0].dedupeKey).toContain('staleness:14:t1');
    expect(isDrifting(ctx([t]), t)).toBe(true);
  });

  it('resets when a later activity exists', () => {
    const t = makeTask({ status: 'In progress', lastTouched: daysAgo(10) });
    const activity: Record<string, Activity[]> = {
      t1: [
        {
          id: 'a1',
          taskId: 't1',
          actorId: 'nina',
          kind: 'comment',
          summary: 'commented',
          from: null,
          to: null,
          at: daysAgo(1),
        },
      ],
    };
    const out = evaluateScheduled(ctx([t], activity)).filter((i) => i.trigger === 'staleness');
    expect(out).toHaveLength(0);
  });

  it('ignores tasks that are not In progress', () => {
    const t = makeTask({ status: 'Not started', lastTouched: daysAgo(30) });
    expect(evaluateScheduled(ctx([t])).filter((i) => i.trigger === 'staleness')).toHaveLength(0);
  });
});

describe('blocked escalation', () => {
  it('notifies both founders after 3 days blocked', () => {
    const t = makeTask({ status: 'Blocked', blockedBy: 'Legal review', statusChangedAt: daysAgo(3) });
    const out = evaluateScheduled(ctx([t])).filter((i) => i.trigger === 'blocked_escalation');
    const recips = new Set(out.map((i) => i.recipientId));
    expect(recips).toEqual(new Set(['lisa', 'max']));
  });

  it('does not escalate before 3 days', () => {
    const t = makeTask({ status: 'Blocked', blockedBy: 'x', statusChangedAt: daysAgo(2) });
    expect(evaluateScheduled(ctx([t])).filter((i) => i.trigger === 'blocked_escalation')).toHaveLength(0);
  });
});

describe('waiting on external', () => {
  it('prompts the lead every 5 days', () => {
    const t = makeTask({ status: 'Waiting on external', waitingOn: 'Companies House', statusChangedAt: daysAgo(5) });
    const out = evaluateScheduled(ctx([t])).filter((i) => i.trigger === 'waiting_external');
    expect(out).toHaveLength(1);
    expect(out[0].recipientId).toBe('nina');
    expect(out[0].body).toContain('Companies House');
  });

  it('resets when chased', () => {
    const t = makeTask({
      status: 'Waiting on external',
      waitingOn: 'Federico',
      statusChangedAt: daysAgo(9),
      lastChasedAt: daysAgo(1),
    });
    expect(evaluateScheduled(ctx([t])).filter((i) => i.trigger === 'waiting_external')).toHaveLength(0);
  });

  it('uses distinct dedupe keys across 5-day periods', () => {
    const t5 = makeTask({ status: 'Waiting on external', waitingOn: 'x', statusChangedAt: daysAgo(5) });
    const t10 = makeTask({ status: 'Waiting on external', waitingOn: 'x', statusChangedAt: daysAgo(10) });
    const k5 = evaluateScheduled(ctx([t5]))[0].dedupeKey;
    const k10 = evaluateScheduled(ctx([t10]))[0].dedupeKey;
    expect(k5).not.toBe(k10);
  });
});

describe('event triggers', () => {
  it('handoff carries the full history to the new lead', () => {
    const activity: Record<string, Activity[]> = {
      t1: [
        { id: 'a1', taskId: 't1', actorId: 'lisa', kind: 'created', summary: 'created task', from: null, to: null, at: daysAgo(5) },
        { id: 'a2', taskId: 't1', actorId: 'lisa', kind: 'status', summary: 'Not started → In progress', from: 'Not started', to: 'In progress', at: daysAgo(2) },
      ],
    };
    const t = makeTask();
    const i = onHandoff(ctx([t], activity), t, 'max', 'lisa');
    expect(i.recipientId).toBe('max');
    expect(i.immediate).toBe(true);
    expect(i.body).toContain('created task');
    expect(i.body).toContain('Not started → In progress');
  });

  it('mention notifies mentioned users but not the author', () => {
    const t = makeTask();
    const out = onMention(ctx([t]), t, 'c1', 'lisa', ['max', 'lisa', 'nina']);
    expect(out.map((i) => i.recipientId).sort()).toEqual(['max', 'nina']);
    expect(out.every((i) => i.immediate)).toBe(true);
  });

  it('watched status change is batched (never immediate) and skips the actor', () => {
    const t = makeTask({ collaboratorIds: ['lisa', 'max'] });
    const out = onWatchedStatusChange(ctx([t]), t, 'In progress', 'Blocked', 'lisa');
    expect(out.map((i) => i.recipientId)).toEqual(['max']);
    expect(out[0].immediate).toBe(false);
  });

  it('collaborator-added is immediate', () => {
    const t = makeTask();
    const i = onCollaboratorAdded(ctx([t]), t, 'max', 'lisa');
    expect(i.immediate).toBe(true);
    expect(i.recipientId).toBe('max');
  });
});
