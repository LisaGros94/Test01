'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { computeTaxAnalysis } from '@/lib/tax-engine';
import PortfolioDonut from '@/components/PortfolioDonut';
import type { TaxAnalysis, AssetClass } from '@/types';

export default function PortfolioPage() {
  const { assets, portfolio, computePortfolio, profile } = useStore();
  const [tax, setTax] = useState<TaxAnalysis | null>(null);
  const [showTax, setShowTax] = useState(false);

  useEffect(() => {
    if (!portfolio) computePortfolio();
  }, []);

  useEffect(() => {
    if (assets.length > 0) {
      setTax(computeTaxAnalysis(assets, profile?.country ?? 'DE'));
    }
  }, [assets, profile?.country]);

  const fmt = (n: number, compact = false) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
      ...(compact ? { notation: 'compact' } : {}),
    }).format(n);

  if (!portfolio) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-3)' }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--sp-md)' }}>

        {/* Header */}
        <div style={{ paddingTop: 12, marginBottom: 'var(--sp-lg)' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 500, color: 'var(--color-text-1)', margin: 0 }}>
            Portfolio
          </h1>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginTop: 4 }}>
            {assets.length} assets · {profile?.country ?? 'DE'} · Updated now
          </div>
        </div>

        {/* Net Worth Banner — brand blue */}
        <div style={{
          background: 'var(--color-accent)',
          borderRadius: 'var(--r-xl)',
          padding: 'var(--sp-lg) var(--sp-lg)',
          marginBottom: 'var(--sp-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 6, fontWeight: 600 }}>Total Net Worth</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: '#FFF', marginBottom: 14, fontWeight: 500 }}>{fmt(portfolio.netWorth)}</div>
          <div style={{ display: 'flex', gap: 'var(--sp-xl)', paddingTop: 'var(--sp-md)', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>Assets</div>
              <div style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{fmt(portfolio.totalAssets, true)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>Liabilities</div>
              <div style={{ fontSize: 14, color: '#FCA5A5', fontWeight: 600 }}>−{fmt(portfolio.totalLiabilities, true)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>YTD</div>
              <div style={{ fontSize: 14, color: '#A7F3D0', fontWeight: 600 }}>+{portfolio.yearChangePct.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Allocation Donut */}
        <div style={card}>
          <div style={sectionLabel}>Allocation</div>
          <PortfolioDonut
            allocation={portfolio.allocationByClass}
            allocationPct={portfolio.allocationPct}
            size={160}
          />
        </div>

        {/* Tax Engine */}
        {tax && (
          <div style={{ ...card, marginTop: 'var(--sp-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-md)' }}>
              <div style={sectionLabel}>Tax intelligence</div>
              <button
                onClick={() => setShowTax(!showTax)}
                style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 700, padding: '4px 0', minHeight: 44 }}
              >
                {showTax ? 'Less' : 'Expand'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginBottom: showTax ? 'var(--sp-md)' : 0 }}>
              <div style={{ flex: 1, background: 'rgba(239,68,68,0.07)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginBottom: 3, fontWeight: 600 }}>Unrealised gain</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-1)' }}>{fmt(tax.unrealizedGainsTotal, true)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(16,185,129,0.07)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginBottom: 3, fontWeight: 600 }}>Harvest saving</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-positive)' }}>{fmt(tax.taxLossHarvestingOpportunity, true)}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--color-accent-bg)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginBottom: 3, fontWeight: 600 }}>Pension room</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-accent)' }}>{fmt(tax.pensionHeadroom, true)}</div>
              </div>
            </div>

            {showTax && (
              <>
                <div style={{ ...sectionLabel, marginBottom: 10 }}>Optimisations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                  {tax.optimizations.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--r-md)' }}>
                      <div style={{
                        fontSize: 11, width: 44, height: 22, borderRadius: 'var(--r-sm)',
                        background: opt.difficulty === 'easy' ? '#D1FAE5' : opt.difficulty === 'medium' ? '#FEF3C7' : '#FEE2E2',
                        color: opt.difficulty === 'easy' ? '#059669' : opt.difficulty === 'medium' ? '#D97706' : '#DC2626',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, flexShrink: 0,
                      }}>
                        {fmt(opt.saving, true)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-1)' }}>{opt.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-2)', marginTop: 2, lineHeight: 1.4 }}>{opt.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ ...sectionLabel, marginTop: 'var(--sp-md)', marginBottom: 'var(--sp-sm)' }}>Deadlines</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tax.deadlines.slice(0, 3).map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-2)' }}>{d.label}</span>
                      <span style={{ color: 'var(--color-text-1)', fontWeight: 600 }}>
                        {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Asset class breakdown */}
        <div style={{ ...card, marginTop: 'var(--sp-sm)' }}>
          <div style={{ ...sectionLabel, marginBottom: 14 }}>By class</div>
          {Object.entries(portfolio.allocationByClass)
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([cls, value]) => {
              const pct = portfolio.allocationPct[cls as AssetClass];
              return (
                <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-2)', width: 96, flexShrink: 0 }}>
                    {cls.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                  <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-accent)', borderRadius: 2, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-1)', fontWeight: 600, width: 60, textAlign: 'right', flexShrink: 0 }}>
                    {fmt(value, true)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', width: 36, textAlign: 'right', flexShrink: 0 }}>
                    {pct.toFixed(0)}%
                  </div>
                </div>
              );
            })}
        </div>

      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'var(--color-card)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--r-xl)',
  padding: '18px var(--sp-lg)',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-3)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
};
