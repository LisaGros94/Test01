import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { chase } from '@/lib/service';

// Slack interactive components endpoint. Handles the one-click "I chased today"
// button on waiting-on-external DMs. Verifies Slack's request signature.
export async function POST(req: Request) {
  const raw = await req.text();

  if (!verifySlackSignature(req, raw)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  // Slack sends application/x-www-form-urlencoded with a `payload` field.
  const params = new URLSearchParams(raw);
  const payload = JSON.parse(params.get('payload') ?? '{}');
  const action = payload.actions?.[0];

  if (action?.action_id === 'chase' && action.value) {
    const userId = payload.user?.id ?? 'unknown';
    await chase(action.value, userId);
    return NextResponse.json({
      text: '✅ Marked as chased today — the 5-day clock has been reset.',
      replace_original: false,
    });
  }

  return NextResponse.json({ ok: true });
}

function verifySlackSignature(req: Request, body: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return true; // dev: no secret configured, don't block.
  const ts = req.headers.get('x-slack-request-timestamp');
  const sig = req.headers.get('x-slack-signature');
  if (!ts || !sig) return false;
  // Reject requests older than 5 minutes (replay protection).
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const base = `v0:${ts}:${body}`;
  const hmac = 'v0=' + crypto.createHmac('sha256', secret).update(base).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(sig));
  } catch {
    return false;
  }
}
