import { NextRequest, NextResponse } from 'next/server';
import type { Asset, AssetClass } from '@/types';

// In production: replace with Prisma/Supabase. Tink would add assets via webhook.
const store: Asset[] = [];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cls = searchParams.get('class') as AssetClass | null;
  const filtered = cls ? store.filter((a) => a.class === cls) : store;
  return NextResponse.json({ assets: filtered, total: filtered.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const asset: Asset = {
    ...body,
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    lastUpdated: new Date().toISOString(),
  };
  store.push(asset);
  return NextResponse.json(asset, { status: 201 });
}
