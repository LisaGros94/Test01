import { NextResponse } from 'next/server';
import { getStore } from '@/lib/data';
import { runScheduled } from '@/lib/notifications/schedule';

// Vercel Cron hits this hourly (see vercel.json). It evaluates every scheduled
// trigger and fires per-user digests when a user's local clock hits their slot.
// Protected by CRON_SECRET so it can't be triggered by the public.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  const result = await runScheduled(getStore(), new Date());
  return NextResponse.json({ ok: true, ...result });
}
