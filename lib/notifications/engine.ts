// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY ENGINE — turns a pile of NotificationIntents into a concrete send
// plan, applying every anti-noise rule. Pure: give it intents + history + prefs
// + now, get back { deliveries, newSent }. The runner (runner.ts) performs I/O.
//
// Anti-noise rules enforced here, in order:
//   1. De-dupe        — an intent already sent (by dedupeKey) is dropped.
//   2. Self-suppress  — never notify a user about their own change.
//   3. Mute           — per-user, per-trigger mute toggle drops the intent.
//   4. Batch          — all of a user's intents in one run collapse into a
//                       single message per channel (so a cron tick is 1 DM max).
//   5. Slack 1/hour   — if we DM'd a user on Slack in the last hour, we skip
//                       Slack this run and fall back to email, which isn't
//                       rate-limited. The logical notification still lands.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Channel,
  NotificationIntent,
  NotificationPref,
  SentNotification,
  User,
} from '../types';
import { HOUR_MS } from '../time';

export interface Delivery {
  recipientId: string;
  channel: Channel;
  subject: string;
  /** Plain-text body (Slack mrkdwn / email text). */
  body: string;
  /** Primary deep link (first intent's link). */
  link: string;
  /** dedupeKeys folded into this delivery, for auditing. */
  intentKeys: string[];
  /** Task + trigger of the primary intent, so channels can add contextual
   *  actions (e.g. a one-click "I chased today" on a waiting-external DM). */
  taskId: string | null;
  trigger: string;
}

export interface EngineInput {
  now: Date;
  intents: NotificationIntent[];
  users: User[];
  prefs: NotificationPref[];
  /** Prior sends, for de-dupe + Slack rate-limiting. */
  sent: SentNotification[];
}

export interface EnginePlan {
  deliveries: Delivery[];
  /** Records to append to the sent log once deliveries succeed. */
  newSent: SentNotification[];
  /** Intents dropped and why — useful for tests + a debug view. */
  dropped: { key: string; reason: 'duplicate' | 'self' | 'muted' | 'no-recipient' }[];
}

export function planDeliveries(input: EngineInput): EnginePlan {
  const { now, intents, users, prefs, sent } = input;

  const userById = new Map(users.map((u) => [u.id, u]));
  const alreadySent = new Set(sent.map((s) => s.dedupeKey));
  const mutedSet = new Set(
    prefs.filter((p) => p.muted).map((p) => `${p.userId}:${p.trigger}`),
  );

  const dropped: EnginePlan['dropped'] = [];
  const kept: NotificationIntent[] = [];

  for (const it of intents) {
    if (alreadySent.has(it.dedupeKey)) {
      dropped.push({ key: it.dedupeKey, reason: 'duplicate' });
      continue;
    }
    if (it.actorId && it.actorId === it.recipientId) {
      dropped.push({ key: it.dedupeKey, reason: 'self' });
      continue;
    }
    if (mutedSet.has(`${it.recipientId}:${it.trigger}`)) {
      dropped.push({ key: it.dedupeKey, reason: 'muted' });
      continue;
    }
    if (!userById.has(it.recipientId)) {
      dropped.push({ key: it.dedupeKey, reason: 'no-recipient' });
      continue;
    }
    kept.push(it);
  }

  // Group surviving intents by recipient → one message per channel per user.
  const groups = new Map<string, NotificationIntent[]>();
  for (const it of kept) {
    const arr = groups.get(it.recipientId) ?? [];
    arr.push(it);
    groups.set(it.recipientId, arr);
  }

  const deliveries: Delivery[] = [];
  const newSent: SentNotification[] = [];

  for (const [recipientId, group] of groups) {
    const user = userById.get(recipientId)!;
    const { subject, body, link } = compose(group);
    const intentKeys = group.map((g) => g.dedupeKey);
    // Only surface a contextual action when there's a single, unambiguous intent.
    const primary = group.length === 1 ? group[0] : null;

    const channels: Channel[] = [];
    if (user.email) channels.push('email');
    if (user.slackUserId && slackAllowed(sent, recipientId, now)) {
      channels.push('slack');
    }
    // If neither channel is available (no email, Slack throttled), still record
    // email as the delivery target so we don't lose it silently.
    if (channels.length === 0) channels.push('email');

    for (const channel of channels) {
      deliveries.push({
        recipientId, channel, subject, body, link, intentKeys,
        taskId: primary?.taskId ?? null,
        trigger: primary?.trigger ?? 'batch',
      });
      for (const key of intentKeys) {
        newSent.push({
          dedupeKey: key,
          recipientId,
          trigger: group.find((g) => g.dedupeKey === key)!.trigger,
          channel,
          sentAt: now.toISOString(),
        });
      }
    }
  }

  return { deliveries, newSent, dropped };
}

/** True unless we've already sent this user a Slack DM within the last hour. */
function slackAllowed(sent: SentNotification[], recipientId: string, now: Date): boolean {
  const cutoff = now.getTime() - HOUR_MS;
  return !sent.some(
    (s) =>
      s.channel === 'slack' &&
      s.recipientId === recipientId &&
      new Date(s.sentAt).getTime() > cutoff,
  );
}

/** Fold one user's intents into a single message. One intent → clean single. */
function compose(group: NotificationIntent[]): {
  subject: string;
  body: string;
  link: string;
} {
  if (group.length === 1) {
    const [only] = group;
    return { subject: only.title, body: only.body, link: only.link };
  }
  const subject = `${group.length} updates`;
  const body = group
    .map((g) => `▸ ${g.title}\n${g.body}`)
    .join('\n\n');
  return { subject, body, link: group[0].link };
}
