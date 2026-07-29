// Slack adapter — the primary channel. A first-class integration: real Block
// Kit DMs with a button back to the task. Falls back to a console log when
// SLACK_BOT_TOKEN is absent so the app is fully runnable in demo/dev.

import { WebClient } from '@slack/web-api';
import type { Delivery } from './engine';

const token = process.env.SLACK_BOT_TOKEN;
const client = token ? new WebClient(token) : null;

function appUrl(path: string): string {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  return `${base}${path}`;
}

export async function sendSlack(d: Delivery, slackUserId: string): Promise<void> {
  if (!client) {
    console.log(`[slack:dev] → ${slackUserId}: ${d.subject}\n${d.body}\n${appUrl(d.link)}`);
    return;
  }

  // DMs go to the user's own channel; open a conversation to get the channel id.
  const im = await client.conversations.open({ users: slackUserId });
  const channel = im.channel?.id;
  if (!channel) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = [
    {
      type: 'button',
      text: { type: 'plain_text', text: 'Open task' },
      url: appUrl(d.link),
      style: 'primary',
    },
  ];
  // One-click "I chased today" straight from the Slack DM, for the recurring
  // waiting-on-external prompt. Handled by /api/slack/interactivity.
  if (d.trigger === 'waiting_external' && d.taskId) {
    elements.push({
      type: 'button',
      text: { type: 'plain_text', text: 'I chased today' },
      action_id: 'chase',
      value: d.taskId,
    });
  }

  await client.chat.postMessage({
    channel,
    text: d.subject, // notification fallback text
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `*${d.subject}*\n${d.body}` } },
      { type: 'actions', elements },
    ],
  });
}
