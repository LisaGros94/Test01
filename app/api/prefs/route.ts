import { NextResponse } from 'next/server';
import { setMute } from '@/lib/service';
import { getStore } from '@/lib/data';
import { getCurrentUserId } from '@/lib/auth';
import type { TriggerType } from '@/lib/types';

// Per-user, per-trigger mute toggles.
export async function GET() {
  const userId = await getCurrentUserId();
  const prefs = (await getStore().allPrefs()).filter((p) => p.userId === userId);
  return NextResponse.json({ prefs });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  const body = await req.json().catch(() => ({}));
  const trigger = body.trigger as TriggerType;
  const muted = !!body.muted;
  if (!trigger) return NextResponse.json({ error: 'trigger required' }, { status: 400 });
  await setMute(userId, trigger, muted);
  return NextResponse.json({ ok: true });
}
