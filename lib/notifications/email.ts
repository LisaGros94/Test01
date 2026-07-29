// Email adapter via Resend — the secondary channel and the Slack-throttle
// fallback. No-ops to a console log when RESEND_API_KEY is absent.

import { Resend } from 'resend';
import type { Delivery } from './engine';

const key = process.env.RESEND_API_KEY;
const resend = key ? new Resend(key) : null;
const FROM = process.env.EMAIL_FROM ?? 'Blanche Tracker <tracker@blanche.xyz>';

function appUrl(path: string): string {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  return `${base}${path}`;
}

export async function sendEmail(d: Delivery, to: string): Promise<void> {
  const url = appUrl(d.link);
  if (!resend) {
    console.log(`[email:dev] → ${to}: ${d.subject}\n${d.body}\n${url}`);
    return;
  }

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;max-width:520px">
      <h2 style="font-size:15px;font-weight:600;margin:0 0 12px">${escapeHtml(d.subject)}</h2>
      <div style="white-space:pre-wrap;color:#444">${escapeHtml(d.body)}</div>
      <p style="margin-top:20px">
        <a href="${url}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:8px 14px;border-radius:6px;font-size:13px">Open task →</a>
      </p>
    </div>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: d.subject,
    text: `${d.body}\n\n${url}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
