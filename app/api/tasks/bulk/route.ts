import { NextResponse } from 'next/server';
import { bulkPatch } from '@/lib/service';
import { getCurrentUserId } from '@/lib/auth';

// Bulk edit — change category / lead / status across many tasks at once.
export async function POST(req: Request) {
  const actorId = await getCurrentUserId();
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  if (!ids.length) return NextResponse.json({ error: 'No tasks selected' }, { status: 400 });
  const patch = {
    category: body.category,
    leadId: body.leadId,
    status: body.status,
  };
  const updated = await bulkPatch(ids, patch, actorId);
  return NextResponse.json({ updated, count: updated.length });
}
