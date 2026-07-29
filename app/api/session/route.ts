import { NextResponse } from 'next/server';
import { listUsers } from '@/lib/service';
import { getCurrentUserId, DEMO_COOKIE, DEMO_MODE } from '@/lib/auth';

// Who am I, and who could I act as (demo mode)?
export async function GET() {
  const [users, currentUserId] = await Promise.all([listUsers(), getCurrentUserId()]);
  return NextResponse.json({ users, currentUserId, demoMode: DEMO_MODE });
}

// Switch acting user (demo mode only) so you can see notifications from any seat.
export async function POST(req: Request) {
  if (!DEMO_MODE) return NextResponse.json({ error: 'Not available' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const uid = typeof body.userId === 'string' ? body.userId : '';
  if (!uid) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  const res = NextResponse.json({ ok: true, currentUserId: uid });
  res.cookies.set(DEMO_COOKIE, uid, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}
