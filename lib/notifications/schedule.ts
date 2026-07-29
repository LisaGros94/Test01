// Cron entry point. Evaluates every scheduled trigger and, for each user whose
// local clock has just hit a digest slot, builds their digest. One hourly cron
// invocation drives all of it; the weekKey dedupe in the digest builders means
// a user gets at most one Monday and one Friday digest per week even if the
// cron fires several times within the hour.

import type { NotificationIntent } from '../types';
import type { Store } from '../data/store';
import { evaluateScheduled, type TriggerContext } from './triggers';
import { buildMondayDigest, buildFridayDigest } from './digest';
import { deliver } from './runner';
import { localParts } from '../time';
import type { Activity } from '../types';

export async function runScheduled(store: Store, now: Date = new Date()) {
  const [tasks, users, activityRows] = await Promise.all([
    store.allTasks(),
    store.allUsers(),
    store.allActivity(),
  ]);
  const activityByTask: Record<string, Activity[]> = {};
  for (const a of activityRows) (activityByTask[a.taskId] ??= []).push(a);
  const ctx: TriggerContext = { now, tasks, users, activityByTask };

  const intents: NotificationIntent[] = [...evaluateScheduled(ctx)];

  for (const user of users) {
    const { weekday, hour } = localParts(now, user.timezone);
    // Monday 08:00 local — everyone.
    if (weekday === 1 && hour === 8) {
      const d = buildMondayDigest(ctx, user);
      if (d) intents.push(d);
    }
    // Friday 16:00 local — founders only.
    if (weekday === 5 && hour === 16 && user.isFounder) {
      const d = buildFridayDigest(ctx, user);
      if (d) intents.push(d);
    }
  }

  const result = await deliver(store, intents, now);
  return { evaluated: intents.length, ...result };
}
