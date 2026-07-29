import { NextResponse } from 'next/server';
import { chase, ValidationError } from '@/lib/service';
import { getCurrentUserId } from '@/lib/auth';

// "I chased today" — resets the waiting-on-external 5-day chase clock.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actorId = await getCurrentUserId();
  try {
    const task = await chase(id, actorId);
    return NextResponse.json({ task });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 422 });
    throw e;
  }
}
