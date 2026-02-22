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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-3)', fontSize: 13 }}>
        Loading
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--sp-md)' }}>

        {/* Header */}
        <div style={{ paddingTop: 12, marginBottom: 'var(--sp-lg)' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--color-text-1)', margin: 0 }}>
            Portfolio
          </h1>
          <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4, letterSpacing: 0.3 }}>
            {assets.length} assets · {profile?.country ?? 'DE'}
          </div>
        </div>

        {/* ── Net Worth Banner — dark gradient ── */}
        <div style={{
          background: 'linear-gradient(150deg, #131926 0%, #0A0D18 100%)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid rgba(255,255,255,0.09)',
          padding: 'var(--sp-lg)',
          marginBottom: 'var(--sp-sm)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: 700, marginBottom: 10 }}>
            Total Net Worth
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 40, color: 'var(--color-text-1)', fontWeight: 400, marginBottom: 18, letterSpacing: -0.5 }}>
            {fmt(portfolio.netWorth)}
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-xl)', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Assets</div>
              <div style={{ fontSize: 14, color: 'var(--color-text-1)', fontWeight: 600 }}>{fmt(portfolio.totalAssets, true)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Liabilities</div>
              <div style={{ fontSize: 14, color: 'var(--color-negative)', fontWeight: 600 }}>−{fmt(portfolio.totalLiabilities, true)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>YTD</div>
              <div style={{ fontSize: 14, color: 'var(--color-positive)', fontWeight: 600 }}>+{portfolio.yearChangePct.toFixed(1)}%</div>
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
              {[
                { label: 'Unrealised gain', value: tax.unrealizedGainsTotal, color: 'var(--color-text-1)' },
                { label: 'Harvest saving',  value: tax.taxLossHarvestingOpportunity, color: 'var(--color-positive)' },
                { label: 'Pension room',    value: tax.pensionHeadroom, color: 'var(--color-accent)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, background: 'var(--color-surface-2)', borderRadius: 'var(--r-md)', padding: '10px 12px' }}>
                  <div style={{ ...sectionLabel, marginBottom: 4, fontSize: 9 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color }}>{fmt(value, true)}</div>
                </div>
              ))}
            </div>

            {showTax && (
              <>
                <div style={{ ...sectionLabel, marginBottom: 10 }}>Optimisations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                  {tax.optimizations.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--r-md)' }}>
                      <div style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 'var(--r-sm)',
                        background: opt.difficulty === 'easy' ? 'rgba(52,211,153,0.12)' : opt.difficulty === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(248,113,113,0.12)',
                        color: opt.difficulty === 'easy' ? 'var(--color-positive)' : opt.difficulty === 'medium' ? 'var(--color-neutral)' : 'var(--color-negative)',
                        fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  <div style={{ flex: 1, height: 2, background: 'var(--color-surface-2)', borderRadius: 2 }}>
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
  background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--r-xl)',
  padding: '18px var(--sp-lg)',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-3)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1.0,
};
