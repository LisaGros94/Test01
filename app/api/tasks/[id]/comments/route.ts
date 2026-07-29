import { NextResponse } from 'next/server';
import { addComment } from '@/lib/service';
import { getCurrentUserId } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actorId = await getCurrentUserId();
  const body = await req.json().catch(() => ({}));
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return NextResponse.json({ error: 'Empty comment' }, { status: 400 });
  const comment = await addComment(id, actorId, text);
  return NextResponse.json({ comment }, { status: 201 });
}
