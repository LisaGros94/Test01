import { describe, it, expect } from 'vitest';
import type { NotificationIntent, NotificationPref, SentNotification, User } from '../types';
import { planDeliveries } from './engine';
import { HOUR_MS } from '../time';

const NOW = new Date('2026-07-29T09:00:00.000Z');

const users: User[] = [
  { id: 'lisa', email: 'lisa@blanche.xyz', name: 'Lisa', slackUserId: 'U-LISA', timezone: 'Europe/London', isFounder: true },
  { id: 'max', email: 'max@blanche.xyz', name: 'Max', slackUserId: 'U-MAX', timezone: 'Europe/Berlin', isFounder: true },
];

function intent(over: Partial<NotificationIntent>): NotificationIntent {
  return {
    dedupeKey: 'k1',
    recipientId: 'lisa',
    trigger: 'deadline',
    taskId: 't1',
    title: 'Title',
    body: 'Body',
    link: '/task/t1',
    immediate: false,
    actorId: null,
    createdAt: NOW.toISOString(),
    ...over,
  };
}

describe('anti-noise: de-dupe', () => {
  it('drops an intent already sent', () => {
    const sent: SentNotification[] = [
      { dedupeKey: 'k1', recipientId: 'lisa', trigger: 'deadline', channel: 'slack', sentAt: new Date(NOW.getTime() - 2 * HOUR_MS).toISOString() },
    ];
    const plan = planDeliveries({ now: NOW, intents: [intent({})], users, prefs: [], sent });
    expect(plan.deliveries).toHaveLength(0);
    expect(plan.dropped[0].reason).toBe('duplicate');
  });
});

describe('anti-noise: self-suppression', () => {
  it('never notifies a user of their own change', () => {
    const plan = planDeliveries({
      now: NOW,
      intents: [intent({ recipientId: 'lisa', actorId: 'lisa' })],
      users,
      prefs: [],
      sent: [],
    });
    expect(plan.deliveries).toHaveLength(0);
    expect(plan.dropped[0].reason).toBe('self');
  });
});

describe('anti-noise: mutes', () => {
  it('drops a muted trigger type for that user only', () => {
    const prefs: NotificationPref[] = [{ userId: 'lisa', trigger: 'deadline', muted: true }];
    const plan = planDeliveries({
      now: NOW,
      intents: [intent({ recipientId: 'lisa' }), intent({ dedupeKey: 'k2', recipientId: 'max' })],
      users,
      prefs,
      sent: [],
    });
    const recips = plan.deliveries.map((d) => d.recipientId);
    expect(recips).not.toContain('lisa');
    expect(recips).toContain('max');
  });
});

describe('anti-noise: batching', () => {
  it('collapses multiple intents for one user into a single message per channel', () => {
    const intents = [
      intent({ dedupeKey: 'a', title: 'A' }),
      intent({ dedupeKey: 'b', title: 'B' }),
      intent({ dedupeKey: 'c', title: 'C' }),
    ];
    const plan = planDeliveries({ now: NOW, intents, users, prefs: [], sent: [] });
    const slack = plan.deliveries.filter((d) => d.channel === 'slack');
    expect(slack).toHaveLength(1);
    expect(slack[0].subject).toBe('3 updates');
    expect(slack[0].intentKeys).toEqual(['a', 'b', 'c']);
  });
});

describe('anti-noise: Slack 1/hour with email fallback', () => {
  it('skips Slack but still emails when a DM went out in the last hour', () => {
    const sent: SentNotification[] = [
      { dedupeKey: 'old', recipientId: 'lisa', trigger: 'mention', channel: 'slack', sentAt: new Date(NOW.getTime() - 30 * 60 * 1000).toISOString() },
    ];
    const plan = planDeliveries({ now: NOW, intents: [intent({ dedupeKey: 'new' })], users, prefs: [], sent });
    const channels = plan.deliveries.map((d) => d.channel);
    expect(channels).toContain('email');
    expect(channels).not.toContain('slack');
  });

  it('allows Slack again once an hour has passed', () => {
    const sent: SentNotification[] = [
      { dedupeKey: 'old', recipientId: 'lisa', trigger: 'mention', channel: 'slack', sentAt: new Date(NOW.getTime() - 61 * 60 * 1000).toISOString() },
    ];
    const plan = planDeliveries({ now: NOW, intents: [intent({ dedupeKey: 'new' })], users, prefs: [], sent });
    expect(plan.deliveries.map((d) => d.channel)).toContain('slack');
  });
});
