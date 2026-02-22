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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#94A3B8' }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        <div style={{ paddingTop: 12, marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 500, color: '#0F172A', margin: 0 }}>
            Portfolio
          </h1>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
            {assets.length} assets · {profile?.country ?? 'DE'} · Updated now
          </div>
        </div>

        {/* Net Worth Banner */}
        <div style={{ background: '#0F172A', borderRadius: 22, padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Total Net Worth</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: '#FFF', marginBottom: 12 }}>{fmt(portfolio.netWorth)}</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Assets</div>
              <div style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{fmt(portfolio.totalAssets, true)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Liabilities</div>
              <div style={{ fontSize: 14, color: '#F87171', fontWeight: 600 }}>−{fmt(portfolio.totalLiabilities, true)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>YTD</div>
              <div style={{ fontSize: 14, color: '#34D399', fontWeight: 600 }}>+{portfolio.yearChangePct.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Allocation Donut */}
        <div style={card}>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16 }}>Allocation</div>
          <PortfolioDonut
            allocation={portfolio.allocationByClass}
            allocationPct={portfolio.allocationPct}
            size={160}
          />
        </div>

        {/* Tax Engine */}
        {tax && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>Tax intelligence</div>
              <button onClick={() => setShowTax(!showTax)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#38BDF8', cursor: 'pointer', fontWeight: 600 }}>
                {showTax ? 'Less' : 'Expand'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: showTax ? 16 : 0 }}>
              <div style={{ flex: 1, background: 'rgba(239,68,68,0.07)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>Unrealised gain</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{fmt(tax.unrealizedGainsTotal, true)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(16,185,129,0.07)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>Harvest saving</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>{fmt(tax.taxLossHarvestingOpportunity, true)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(56,189,248,0.07)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>Pension room</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0284C7' }}>{fmt(tax.pensionHeadroom, true)}</div>
              </div>
            </div>

            {showTax && (
              <>
                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Optimisations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tax.optimizations.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(0,0,0,0.02)', borderRadius: 12 }}>
                      <div style={{ fontSize: 12, width: 40, height: 18, borderRadius: 6, background: opt.difficulty === 'easy' ? '#D1FAE5' : opt.difficulty === 'medium' ? '#FEF3C7' : '#FEE2E2', color: opt.difficulty === 'easy' ? '#059669' : opt.difficulty === 'medium' ? '#D97706' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                        {fmt(opt.saving, true)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{opt.title}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>{opt.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Deadlines</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tax.deadlines.slice(0, 3).map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#475569' }}>{d.label}</span>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>
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
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>By class</div>
          {Object.entries(portfolio.allocationByClass)
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([cls, value]) => {
              const pct = portfolio.allocationPct[cls as AssetClass];
              return (
                <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#475569', width: 96, flexShrink: 0 }}>
                    {cls.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                  <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#38BDF8', borderRadius: 2, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 600, width: 60, textAlign: 'right', flexShrink: 0 }}>
                    {fmt(value, true)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', width: 36, textAlign: 'right', flexShrink: 0 }}>
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
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 20,
  padding: '18px 20px',
};
