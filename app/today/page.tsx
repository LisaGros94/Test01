'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import ActionCard from '@/components/ActionCard';
import { archetypeGreeting, frameNetWorth } from '@/lib/archetype';

// No emojis — geometric unicode only
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

export default function TodayPage() {
  const { signals, signalState, assets, profile, computePortfolio, portfolio } = useStore();

  useEffect(() => {
    if (!portfolio) computePortfolio();
  }, []);

  const activeSignals = signals.filter((s) => {
    const state = signalState[s.id] ?? 'signal';
    return state !== 'dismissed' && state !== 'done';
  });

  const archetype  = profile?.archetype.primary ?? 'optimizer';
  const greeting   = archetypeGreeting(profile?.name, archetype);
  const netWorthFrame = portfolio ? frameNetWorth(portfolio.netWorth, archetype) : null;

  const fmt = (n: number, compact = false) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
      ...(compact ? { notation: 'compact' } : {}),
    }).format(n);

  const topSignal = activeSignals.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.urgency] - order[b.urgency];
  })[0];

  const otherSignals = activeSignals.filter((s) => s.id !== topSignal?.id).slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--sp-md)' }}>

        {/* Date + Greeting */}
        <div style={{ marginBottom: 'var(--sp-lg)', paddingTop: 'var(--sp-sm)' }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 6, letterSpacing: 0.5 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 26, fontWeight: 400,
            color: 'var(--color-text-1)',
            margin: 0, lineHeight: 1.25,
          }}>
            {greeting}
          </h1>
        </div>

        {/* ── Net Worth Card — dark luxury ── */}
        {netWorthFrame && portfolio && (
          <div style={{
            background: 'linear-gradient(150deg, #131926 0%, #0A0D18 100%)',
            borderRadius: 'var(--r-xl)',
            border: '1px solid rgba(255,255,255,0.09)',
            padding: 'var(--sp-lg)',
            marginBottom: 'var(--sp-sm)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle gold glow top-right */}
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(200,169,110,0.05)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Label in gold */}
              <div style={{ fontSize: 10, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: 700, marginBottom: 10, opacity: 0.75 }}>
                {netWorthFrame.label}
              </div>

              {/* The number — commanding */}
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 46, fontWeight: 400,
                color: 'var(--color-text-1)',
                lineHeight: 1, marginBottom: 6,
                letterSpacing: -1,
              }}>
                {fmt(portfolio.netWorth, true)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 20 }}>
                {netWorthFrame.sublabel}
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', gap: 'var(--sp-xl)' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Month</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: portfolio.monthChange >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                    {portfolio.monthChange >= 0 ? '+' : ''}{fmt(portfolio.monthChange, true)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Year</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-positive)' }}>
                    +{portfolio.yearChangePct.toFixed(1)}%
                  </div>
                </div>
                {/* Sparkline */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 2.5, height: 28 }}>
                  {portfolio.sparkline.slice(-10).map((v, i, arr) => {
                    const min = Math.min(...arr);
                    const max = Math.max(...arr);
                    const h = max === min ? 10 : 4 + ((v - min) / (max - min)) * 22;
                    const isLast = i === arr.length - 1;
                    return (
                      <div key={i} style={{
                        width: 2.5, height: h, borderRadius: 2,
                        background: isLast ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                      }} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liquidity strip */}
        {portfolio && (
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-lg)' }}>
            {[
              { label: 'Liquid',      value: portfolio.liquidAssets,     color: 'var(--color-text-1)' },
              { label: 'Illiquid',    value: portfolio.illiquidAssets,   color: 'var(--color-text-1)' },
              { label: 'Liabilities', value: portfolio.totalLiabilities, color: 'var(--color-negative)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                flex: 1, background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--r-lg)', padding: '12px 14px',
              }}>
                <div style={{ fontSize: 9, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontWeight: 600 }}>
                  {label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color }}>{fmt(value, true)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Priority Signal */}
        {topSignal && (
          <div style={{ marginBottom: 'var(--sp-md)' }}>
            <SectionLabel>Priority action</SectionLabel>
            <ActionCard signal={topSignal} />
          </div>
        )}

        {/* Other Signals */}
        {otherSignals.length > 0 && (
          <div style={{ marginBottom: 'var(--sp-lg)' }}>
            <SectionLabel>Also on your radar</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              {otherSignals.map((s) => <ActionCard key={s.id} signal={s} compact />)}
            </div>
          </div>
        )}

        {/* Top Assets */}
        <div style={{ marginBottom: 'var(--sp-lg)' }}>
          <SectionLabel>Your assets</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            {assets.slice(0, 5).map((asset) => {
              const gain = asset.unrealizedGain;
              return (
                <div key={asset.id} style={assetRow}>
                  <div style={iconCell}>
                    {CLASS_ICONS[asset.class] ?? '◆'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 }}>
                      {asset.class.replace('_', ' ')}
                      {asset.country ? ` · ${asset.country}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-1)' }}>
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: asset.currency, maximumFractionDigits: 0, notation: 'compact' }).format(asset.value)}
                    </div>
                    {gain != null && (
                      <div style={{ fontSize: 11, color: gain > 0 ? 'var(--color-positive)' : 'var(--color-negative)', marginTop: 2, fontWeight: 600 }}>
                        {gain > 0 ? '+' : ''}{new Intl.NumberFormat('de-DE', { style: 'currency', currency: asset.currency, maximumFractionDigits: 0, notation: 'compact' }).format(gain)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advisor CTA */}
        <div style={{
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--r-xl)',
          padding: '16px var(--sp-lg)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 3 }}>Ask your advisor</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Voice · Full portfolio context</div>
          </div>
          <a href="/advisor" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0 20px', height: 44,
            background: 'var(--color-accent)',
            color: '#08090D', borderRadius: 'var(--r-pill)',
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
            letterSpacing: 0.2, flexShrink: 0,
          }}>
            Talk
          </a>
        </div>

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

const assetRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  background: 'var(--color-surface-1)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--r-lg)', padding: '12px var(--sp-md)',
};

const iconCell: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 'var(--r-md)',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 14, color: 'var(--color-accent)', flexShrink: 0,
};
