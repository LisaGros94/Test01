// The one impure seam: takes intents, loads history/prefs from the store, asks
// the pure engine for a delivery plan, performs the Slack/email I/O, and records
// what was sent. Everything upstream (triggers, digest, engine) stays pure.

import type { NotificationIntent } from '../types';
import type { Store } from '../data/store';
import { planDeliveries, type Delivery } from './engine';
import { sendSlack } from './slack';
import { sendEmail } from './email';

export interface DeliverResult {
  delivered: number;
  dropped: number;
}

export async function deliver(
  store: Store,
  intents: NotificationIntent[],
  now: Date = new Date(),
): Promise<DeliverResult> {
  if (intents.length === 0) return { delivered: 0, dropped: 0 };

  const [users, prefs, sent] = await Promise.all([
    store.allUsers(),
    store.allPrefs(),
    store.allSent(),
  ]);

  const plan = planDeliveries({ now, intents, users, prefs, sent });
  const userById = new Map(users.map((u) => [u.id, u]));

  await Promise.all(
    plan.deliveries.map((d: Delivery) => {
      const user = userById.get(d.recipientId);
      if (!user) return Promise.resolve();
      if (d.channel === 'slack' && user.slackUserId) {
        return sendSlack(d, user.slackUserId).catch((e) =>
          console.error('slack send failed', e),
        );
      }
      if (d.channel === 'email' && user.email) {
        return sendEmail(d, user.email).catch((e) =>
          console.error('email send failed', e),
        );
      }
      return Promise.resolve();
    }),
  );

  if (plan.newSent.length) await store.putSent(plan.newSent);

  return { delivered: plan.deliveries.length, dropped: plan.dropped.length };
}
