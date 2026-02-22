import { NextRequest, NextResponse } from 'next/server';

const store: Record<string, Record<string, unknown>> = {};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = store[id];
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  store[id] = { ...(store[id] ?? {}), ...(body as Record<string, unknown>), id, lastUpdated: new Date().toISOString() };
  return NextResponse.json(store[id]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  delete store[id];
  return NextResponse.json({ success: true });
}
