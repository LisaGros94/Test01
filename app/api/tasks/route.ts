import { NextResponse } from 'next/server';
import { createTask, listTasks, listUsers } from '@/lib/service';
import { getCurrentUserId } from '@/lib/auth';

export async function GET() {
  const [tasks, users] = await Promise.all([listTasks(), listUsers()]);
  return NextResponse.json({ tasks, users });
}

export async function POST(req: Request) {
  const actorId = await getCurrentUserId();
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return NextResponse.json({ error: 'A title is required.' }, { status: 400 });
  }
  const task = await createTask(title, actorId, {
    category: body.category,
    leadId: body.leadId,
    priority: body.priority,
    deadline: body.deadline ?? null,
  });
  return NextResponse.json({ task }, { status: 201 });
}
