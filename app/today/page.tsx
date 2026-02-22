'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import ActionCard from '@/components/ActionCard';
import type { Asset, PortfolioSummary } from '@/types';

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

// ── Net Asset Score engine ────────────────────────────────────────
function computeScore(assets: Asset[], portfolio: PortfolioSummary | null) {
  if (!portfolio || !assets.length) return { score: 0, label: 'LOADING' };

  let score = 65;

  // Liquidity runway (est. lifestyle burn €7,800/mo)
  const runway = portfolio.liquidAssets / 7_800;
  if      (runway >= 24) score += 12;
  else if (runway >= 12) score += 6;
  else if (runway <  6)  score -= 15;
  else                   score -= 8;

  // Concentration — largest single asset % of total
  const top = [...assets].sort((a, b) => b.value - a.value)[0];
  if (top && portfolio.totalAssets > 0) {
    const pct = (top.value / portfolio.totalAssets) * 100;
    if      (pct < 30) score += 10;
    else if (pct > 55) score -= 12;
    else if (pct > 40) score -= 6;
  }

  // Year-to-date performance
  if      (portfolio.yearChangePct >= 10) score += 10;
  else if (portfolio.yearChangePct >=  5) score += 5;
  else if (portfolio.yearChangePct <   0) score -= 10;

  // Debt ratio
  if (portfolio.totalAssets > 0) {
    const dr = portfolio.totalLiabilities / portfolio.totalAssets;
    if      (dr < 0.20) score += 8;
    else if (dr < 0.35) score += 3;
    else if (dr > 0.60) score -= 10;
  }

  score = Math.max(10, Math.min(97, Math.round(score)));

  const label =
    score >= 90 ? 'EXCEPTIONAL' :
    score >= 76 ? 'STABLE'      :
    score >= 60 ? 'GROWING'     :
    score >= 45 ? 'CAUTION'     : 'AT RISK';

  return { score, label };
}

// ── Gauge SVG ─────────────────────────────────────────────────────
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const size = 168;
  const sw   = 2;
  const r    = size / 2 - sw - 4;
  const circ = 2 * Math.PI * r;

  // 270° arc (75% of circle) starting from bottom-left (rotate SVG by 135°)
  const gaugeArc  = circ * 0.75;
  const scoreFill = gaugeArc * (score / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg
        width={size} height={size}
        style={{ position: 'absolute', inset: 0, transform: 'rotate(135deg)' }}
      >
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.07)"
          strokeWidth={sw}
          strokeDasharray={`${gaugeArc} ${circ - gaugeArc}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.78)"
          strokeWidth={sw}
          strokeDasharray={`${scoreFill} ${circ - scoreFill}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 9, letterSpacing: 3, color: 'var(--color-text-3)',
          fontWeight: 700, textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function TodayPage() {
  const { signals, signalState, assets, profile, computePortfolio, portfolio, refreshLivePrices, refreshQontoBalance } = useStore();

  useEffect(() => {
    if (!portfolio) computePortfolio();
    // Refresh live prices (crypto + stocks) and Qonto balance in parallel
    refreshLivePrices();
    refreshQontoBalance();
  }, []);

  const { score, label: scoreLabel } = useMemo(
    () => computeScore(assets, portfolio),
    [assets, portfolio],
  );

  const activeSignals = signals.filter((s) => {
    const st = signalState[s.id] ?? 'signal';
    return st !== 'dismissed' && st !== 'done';
  });

  const topSignal = [...activeSignals].sort((a, b) => {
    const o: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return o[a.urgency] - o[b.urgency];
  })[0];
  const otherSignals = activeSignals.filter((s) => s.id !== topSignal?.id).slice(0, 2);

  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  const fmtCompact = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency', currency,
      notation: 'compact', maximumFractionDigits: 1,
    }).format(n);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--sp-md)' }}>

        {/* ── Hero zone ──────────────────────────────────────────── */}
        <div style={{ paddingTop: 28, paddingBottom: 32, textAlign: 'center' }}>

          {portfolio && <ScoreGauge score={score} label={scoreLabel} />}

          <div style={{
            fontSize: 15, color: 'var(--color-text-2)',
            fontWeight: 500, marginTop: 10, marginBottom: 8,
          }}>
            Hi {firstName}
          </div>

          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 46, fontWeight: 400,
            color: 'var(--color-text-1)',
            lineHeight: 1, letterSpacing: -1,
            marginBottom: 14,
          }}>
            {portfolio ? fmtCompact(portfolio.netWorth) : '—'}
          </div>

          {portfolio && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: portfolio.yearChangePct >= 0
                ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${portfolio.yearChangePct >= 0
                ? 'rgba(52,211,153,0.20)' : 'rgba(248,113,113,0.20)'}`,
              borderRadius: 'var(--r-pill)',
              padding: '5px 14px',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: portfolio.yearChangePct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)',
                display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: portfolio.yearChangePct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)',
              }}>
                {portfolio.yearChangePct >= 0 ? '+' : ''}{portfolio.yearChangePct.toFixed(1)}%
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>past 12 months</span>
            </div>
          )}
        </div>

        {/* ── Liquidity strip ───────────────────────────────────── */}
        {portfolio && (
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-md)' }}>
            {[
              { label: 'Liquid',      value: portfolio.liquidAssets,     color: 'var(--color-text-1)' },
              { label: 'Illiquid',    value: portfolio.illiquidAssets,   color: 'var(--color-text-1)' },
              { label: 'Liabilities', value: portfolio.totalLiabilities, color: 'var(--color-negative)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                flex: 1,
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--r-lg)',
                padding: '12px 14px',
              }}>
                <div style={{ fontSize: 9, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontWeight: 700 }}>
                  {label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color }}>{fmtCompact(value)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Priority signal ───────────────────────────────────── */}
        {topSignal && (
          <div style={{ marginBottom: 'var(--sp-md)' }}>
            <SectionLabel>Priority action</SectionLabel>
            <ActionCard signal={topSignal} />
          </div>
        )}

        {/* ── Other signals ─────────────────────────────────────── */}
        {otherSignals.length > 0 && (
          <div style={{ marginBottom: 'var(--sp-lg)' }}>
            <SectionLabel>On your radar</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              {otherSignals.map((s) => <ActionCard key={s.id} signal={s} compact />)}
            </div>
          </div>
        )}

        {/* ── Top assets ────────────────────────────────────────── */}
        <div style={{ marginBottom: 'var(--sp-lg)' }}>
          <SectionLabel>Assets</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            {assets.slice(0, 5).map((asset) => (
              <div key={asset.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--r-lg)',
                padding: '12px var(--sp-md)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 'var(--r-md)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: 'var(--color-text-2)', flexShrink: 0,
                }}>
                  {CLASS_ICONS[asset.class] ?? '◆'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {asset.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 }}>
                    {asset.class.replace('_', ' ')}{asset.country ? ` · ${asset.country}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-1)' }}>
                      {fmtCompact(asset.value, asset.currency)}
                    </div>
                    {asset.metadata?.pricePerUnit && (
                      <span style={{
                        fontSize: 9, color: 'var(--color-positive)', fontWeight: 700,
                        background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)',
                        padding: '1px 5px', borderRadius: 'var(--r-pill)', letterSpacing: 0.3,
                      }}>
                        LIVE
                      </span>
                    )}
                  </div>
                  {asset.unrealizedGain != null && (
                    <div style={{
                      fontSize: 11, fontWeight: 600, marginTop: 2,
                      color: asset.unrealizedGain >= 0 ? 'var(--color-positive)' : 'var(--color-negative)',
                    }}>
                      {asset.unrealizedGain >= 0 ? '+' : ''}{fmtCompact(asset.unrealizedGain, asset.currency)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Talk to advisor ───────────────────────────────────── */}
        <Link href="/advisor" style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '15px 18px',
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--r-xl)',
          textDecoration: 'none',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--color-text-3)', flexShrink: 0,
          }}>
            ◷
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 2 }}>
              Talk to your advisor
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
              Voice · Full portfolio context
            </div>
          </div>
          <span style={{ fontSize: 16, color: 'var(--color-text-3)' }}>→</span>
        </Link>

      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, color: 'var(--color-text-3)',
      textTransform: 'uppercase', letterSpacing: 1.0,
      marginBottom: 10, fontWeight: 700,
    }}>
      {children}
    </div>
  );
}
