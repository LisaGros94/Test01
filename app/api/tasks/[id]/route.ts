import { NextResponse } from 'next/server';
import { deleteTask, getTaskDetail, patchTask, ValidationError } from '@/lib/service';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getTaskDetail(id);
  if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actorId = await getCurrentUserId();
  const patch = await req.json().catch(() => ({}));
  try {
    const task = await patchTask(id, patch, actorId);
    return NextResponse.json({ task });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteTask(id);
  return NextResponse.json({ ok: true });
}
