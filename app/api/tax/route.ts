import { NextRequest, NextResponse } from 'next/server';
import { computeTaxAnalysis, simulateSale } from '@/lib/tax-engine';
import type { Asset } from '@/types';

export async function POST(req: NextRequest) {
  const { assets, country = 'DE', simulateAssetId } = await req.json();

  if (simulateAssetId) {
    const asset = (assets as Asset[]).find((a: Asset) => a.id === simulateAssetId);
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    const simulation = simulateSale(asset, country);
    return NextResponse.json({ simulation });
  }

  const analysis = computeTaxAnalysis(assets as Asset[], country);
  return NextResponse.json({ analysis });
}
