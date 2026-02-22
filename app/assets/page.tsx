'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import type { AssetClass } from '@/types';

const CLASS_ICONS: Record<string, string> = {
  real_estate: '🏛', stocks: '📈', pension: '◎', private_equity: '◈',
  cars: '🚗', watches: '⌚', cash: '◻', bonds: '⊞', crypto: '◆', art: '🎨', commodities: '◎',
};

const ALL_CLASSES: AssetClass[] = [
  'real_estate', 'stocks', 'pension', 'private_equity', 'cars',
  'watches', 'cash', 'bonds', 'crypto', 'art', 'commodities',
];

export default function AssetsPage() {
  const { assets, deleteAsset } = useStore();
  const [filter, setFilter] = useState<AssetClass | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = filter === 'all' ? assets : assets.filter((a) => a.class === filter);
  const usedClasses = [...new Set(assets.map((a) => a.class))];

  const fmt = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(n);

  const totalValue = filtered.reduce((s, a) => {
    const FX: Record<string, number> = { EUR: 1, GBP: 1.17, USD: 0.92, CHF: 1.04 };
    return s + a.value * (FX[a.currency] ?? 1);
  }, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* Header */}
        <div style={{ paddingTop: 12, marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 500, color: '#0F172A', margin: 0 }}>Assets</h1>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{filtered.length} items · {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 0 }).format(totalValue)}</div>
          </div>
          <Link
            href="/assets/add"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0F172A', color: '#FFF', borderRadius: 12, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            + Add
          </Link>
        </div>

        {/* Class Filter Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          {(['all', ...usedClasses] as (AssetClass | 'all')[]).map((cls) => (
            <button
              key={cls}
              onClick={() => setFilter(cls)}
              style={{
                padding: '7px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: filter === cls ? '#0F172A' : 'rgba(0,0,0,0.08)',
                background: filter === cls ? '#0F172A' : 'rgba(255,255,255,0.72)',
                color: filter === cls ? '#FFF' : '#64748B',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                backdropFilter: 'blur(12px)',
              }}
            >
              {cls === 'all' ? 'All' : cls.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Asset List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((asset) => (
            <div
              key={asset.id}
              style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: '16px 18px', position: 'relative' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(56,189,248,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {CLASS_ICONS[asset.class] ?? '◆'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{asset.name}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      {asset.class.replace('_', ' ')}
                      {asset.country ? ` · ${asset.country}` : ''}
                      {asset.institution ? ` · ${asset.institution}` : ''}
                    </span>
                  </div>
                  {/* Source badge */}
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: asset.source === 'tink' ? '#D1FAE5' : asset.source === 'photo' ? '#E0F2FE' : '#F1F5F9', color: asset.source === 'tink' ? '#059669' : asset.source === 'photo' ? '#0284C7' : '#64748B', fontWeight: 600 }}>
                      {asset.source === 'tink' ? '⟳ Synced' : asset.source === 'photo' ? '📷 Photo' : asset.source === 'document_ai' ? '📄 Scanned' : 'Manual'}
                    </span>
                    {asset.metadata?.mortgageExpiry && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>
                        Mortgage expires {new Date(asset.metadata.mortgageExpiry).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                    {fmt(asset.value, asset.currency)}
                  </div>
                  {asset.unrealizedGain !== undefined && (
                    <div style={{ fontSize: 12, color: asset.unrealizedGain >= 0 ? '#10B981' : '#EF4444', marginTop: 2, fontWeight: 600 }}>
                      {asset.unrealizedGain >= 0 ? '+' : ''}{fmt(asset.unrealizedGain, asset.currency)}
                    </div>
                  )}
                  {asset.costBasis && (
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                      cost {fmt(asset.costBasis, asset.currency)}
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata details */}
              {asset.metadata && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {asset.metadata.mortgageBalance && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: '#94A3B8' }}>Mortgage: </span>
                      <span style={{ color: '#EF4444', fontWeight: 600 }}>{fmt(asset.metadata.mortgageBalance, asset.currency)}</span>
                    </div>
                  )}
                  {asset.metadata.mortgageRate && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: '#94A3B8' }}>Rate: </span>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>{asset.metadata.mortgageRate}%</span>
                    </div>
                  )}
                  {asset.metadata.contributionMonthly && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: '#94A3B8' }}>Monthly: </span>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>{fmt(asset.metadata.contributionMonthly, asset.currency)}</span>
                    </div>
                  )}
                  {asset.metadata.make && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: '#94A3B8' }}>Vehicle: </span>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>{asset.metadata.make} {asset.metadata.model} {asset.metadata.year}</span>
                    </div>
                  )}
                  {asset.metadata.brand && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: '#94A3B8' }}>Watch: </span>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>{asset.metadata.brand} {asset.metadata.reference}</span>
                    </div>
                  )}
                  {asset.metadata.hasPapers !== undefined && (
                    <div style={{ fontSize: 11 }}>
                      <span style={{ color: '#94A3B8' }}>Papers: </span>
                      <span style={{ color: asset.metadata.hasPapers ? '#10B981' : '#EF4444', fontWeight: 600 }}>{asset.metadata.hasPapers ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Delete confirm */}
              {confirmDelete === asset.id ? (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontSize: 12, cursor: 'pointer', color: '#64748B', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button onClick={() => { deleteAsset(asset.id); setConfirmDelete(null); }} style={{ flex: 1, padding: '8px', background: '#EF4444', border: 'none', borderRadius: 10, fontSize: 12, cursor: 'pointer', color: '#FFF', fontWeight: 600 }}>
                    Delete
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(asset.id)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: 16, padding: 0 }}>
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⊟</div>
            <div style={{ fontSize: 14 }}>No assets in this category</div>
          </div>
        )}
      </div>
    </div>
  );
}
