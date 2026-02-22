'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import type { AssetClass } from '@/types';

const CLASS_ICONS: Record<string, string> = {
  real_estate:    '△',
  stocks:         '↗',
  pension:        '◎',
  private_equity: '◇',
  cars:           '▷',
  watches:        '◉',
  cash:           '▭',
  bonds:          '▣',
  crypto:         '◆',
  art:            '⬡',
  commodities:    '○',
};

export default function AssetsPage() {
  const { assets, deleteAsset } = useStore();
  const [filter, setFilter] = useState<AssetClass | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = filter === 'all' ? assets : assets.filter((a) => a.class === filter);
  const usedClasses = [...new Set(assets.map((a) => a.class))];

  const fmt = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

  const totalValue = filtered.reduce((s, a) => {
    const FX: Record<string, number> = { EUR: 1, GBP: 1.17, USD: 0.92, CHF: 1.04 };
    return s + a.value * (FX[a.currency] ?? 1);
  }, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--sp-md)' }}>

        {/* Header */}
        <div style={{ paddingTop: 12, marginBottom: 'var(--sp-lg)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--color-text-1)', margin: 0 }}>
              Assets
            </h1>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>
              {filtered.length} items · {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 0 }).format(totalValue)}
            </div>
          </div>
          <Link
            href="/assets/add"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0 20px', height: 44,
              background: 'var(--color-accent)',
              color: '#08090D', borderRadius: 'var(--r-pill)',
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
              letterSpacing: 0.2,
            }}
          >
            + Add
          </Link>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 'var(--sp-lg)', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {(['all', ...usedClasses] as (AssetClass | 'all')[]).map((cls) => {
            const active = filter === cls;
            return (
              <button
                key={cls}
                onClick={() => setFilter(cls)}
                style={{
                  padding: '0 14px', height: 34,
                  borderRadius: 'var(--r-pill)',
                  border: '1px solid',
                  borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
                  background: active ? 'var(--color-accent)' : 'var(--color-surface-1)',
                  color: active ? '#08090D' : 'var(--color-text-2)',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {cls === 'all' ? 'All' : cls.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            );
          })}
        </div>

        {/* Asset list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
          {filtered.map((asset) => (
            <div
              key={asset.id}
              style={{
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--r-xl)',
                padding: '16px 18px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--r-md)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: 'var(--color-accent)', flexShrink: 0,
                }}>
                  {CLASS_ICONS[asset.class] ?? '◆'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 3 }}>{asset.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
                    {asset.class.replace('_', ' ')}
                    {asset.country ? ` · ${asset.country}` : ''}
                    {asset.institution ? ` · ${asset.institution}` : ''}
                  </div>
                  {/* Source badge */}
                  <div style={{ marginTop: 7 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 'var(--r-sm)',
                      background: asset.source === 'tink' ? 'rgba(52,211,153,0.10)' : 'var(--color-surface-2)',
                      color: asset.source === 'tink' ? 'var(--color-positive)' : 'var(--color-text-3)',
                      fontWeight: 600, letterSpacing: 0.3,
                    }}>
                      {asset.source === 'tink' ? 'Synced' : asset.source === 'photo' ? 'Photo' : asset.source === 'document_ai' ? 'Scanned' : 'Manual'}
                    </span>
                    {asset.metadata?.mortgageExpiry && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--r-sm)', background: 'rgba(245,158,11,0.10)', color: 'var(--color-neutral)', fontWeight: 600, marginLeft: 6 }}>
                        Mortgage {new Date(asset.metadata.mortgageExpiry).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-1)' }}>
                    {fmt(asset.value, asset.currency)}
                  </div>
                  {asset.unrealizedGain !== undefined && (
                    <div style={{ fontSize: 12, color: asset.unrealizedGain >= 0 ? 'var(--color-positive)' : 'var(--color-negative)', marginTop: 3, fontWeight: 600 }}>
                      {asset.unrealizedGain >= 0 ? '+' : ''}{fmt(asset.unrealizedGain, asset.currency)}
                    </div>
                  )}
                  {asset.costBasis && (
                    <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 2 }}>
                      cost {fmt(asset.costBasis, asset.currency)}
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              {asset.metadata && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {asset.metadata.mortgageBalance && (
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-3)' }}>Mortgage: </span>
                      <span style={{ color: 'var(--color-negative)', fontWeight: 600 }}>{fmt(asset.metadata.mortgageBalance, asset.currency)}</span>
                    </div>
                  )}
                  {asset.metadata.mortgageRate && (
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-3)' }}>Rate: </span>
                      <span style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>{asset.metadata.mortgageRate}%</span>
                    </div>
                  )}
                  {asset.metadata.make && (
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-3)' }}>Vehicle: </span>
                      <span style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>{asset.metadata.make} {asset.metadata.model} {asset.metadata.year}</span>
                    </div>
                  )}
                  {asset.metadata.brand && (
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-3)' }}>Watch: </span>
                      <span style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>{asset.metadata.brand} {asset.metadata.reference}</span>
                    </div>
                  )}
                  {asset.metadata.hasPapers !== undefined && (
                    <div style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-3)' }}>Papers: </span>
                      <span style={{ color: asset.metadata.hasPapers ? 'var(--color-positive)' : 'var(--color-negative)', fontWeight: 600 }}>{asset.metadata.hasPapers ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Delete confirm */}
              {confirmDelete === asset.id ? (
                <div style={{ marginTop: 12, display: 'flex', gap: 'var(--sp-sm)' }}>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{ flex: 1, height: 44, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--r-md)', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-2)', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { deleteAsset(asset.id); setConfirmDelete(null); }}
                    style={{ flex: 1, height: 44, background: 'var(--color-negative)', border: 'none', borderRadius: 'var(--r-md)', fontSize: 13, cursor: 'pointer', color: '#fff', fontWeight: 700 }}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(asset.id)}
                  aria-label="Delete asset"
                  style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-3)' }}>
            <div style={{ fontSize: 24, marginBottom: 12, letterSpacing: 2 }}>◆</div>
            <div style={{ fontSize: 14 }}>No assets in this category</div>
          </div>
        )}
      </div>
    </div>
  );
}
