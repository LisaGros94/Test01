'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import ActionCard from '@/components/ActionCard';
import { archetypeGreeting, frameNetWorth } from '@/lib/archetype';

const CLASS_ICONS: Record<string, string> = {
  real_estate: '🏛', stocks: '📈', pension: '◎', private_equity: '◈',
  cars: '🚗', watches: '⌚', cash: '◻', bonds: '⊞', crypto: '◆', art: '◈', commodities: '◎',
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

  const archetype = profile?.archetype.primary ?? 'optimizer';
  const greeting = archetypeGreeting(profile?.name, archetype);
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

        {/* Greeting */}
        <div style={{ marginBottom: 'var(--sp-lg)', paddingTop: 'var(--sp-sm)' }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 26, fontWeight: 500,
            color: 'var(--color-text-1)',
            margin: 0, lineHeight: 1.3,
          }}>
            {greeting}
          </h1>
        </div>

        {/* Balance Card — brand blue hero */}
        {netWorthFrame && portfolio && (
          <div style={{
            background: 'var(--color-accent)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-lg) var(--sp-lg)',
            marginBottom: 'var(--sp-sm)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.9, fontWeight: 600 }}>
                {netWorthFrame.label}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 42, color: '#FFFFFF', fontWeight: 500, lineHeight: 1, marginBottom: 6 }}>
                {fmt(portfolio.netWorth, true)}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{netWorthFrame.sublabel}</div>

              {/* Change row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-lg)', marginTop: 'var(--sp-lg)', paddingTop: 'var(--sp-lg)', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>This month</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: portfolio.monthChange >= 0 ? '#A7F3D0' : '#FCA5A5' }}>
                    {portfolio.monthChange >= 0 ? '+' : ''}{fmt(portfolio.monthChange, true)} ({portfolio.monthChangePct.toFixed(1)}%)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>This year</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#A7F3D0' }}>
                    +{fmt(portfolio.yearChange, true)} ({portfolio.yearChangePct.toFixed(1)}%)
                  </div>
                </div>
                {/* Sparkline */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 2, height: 28 }}>
                  {portfolio.sparkline.slice(-8).map((v, i, arr) => {
                    const min = Math.min(...arr);
                    const max = Math.max(...arr);
                    const h = max === min ? 12 : 4 + ((v - min) / (max - min)) * 20;
                    return (
                      <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: i === arr.length - 1 ? '#FFFFFF' : 'rgba(255,255,255,0.30)' }} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liquidity pills */}
        {portfolio && (
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-lg)' }}>
            {[
              { label: 'Liquid',       value: portfolio.liquidAssets,    color: 'var(--color-text-1)' },
              { label: 'Illiquid',     value: portfolio.illiquidAssets,  color: 'var(--color-text-1)' },
              { label: 'Liabilities',  value: portfolio.totalLiabilities, color: 'var(--color-negative)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, background: 'var(--color-card)', backdropFilter: 'blur(16px)', border: '1px solid var(--color-border)', borderRadius: 'var(--r-lg)', padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color }}>{fmt(value, true)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Priority Signal */}
        {topSignal && (
          <div style={{ marginBottom: 'var(--sp-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 700 }}>
              Priority action
            </div>
            <ActionCard signal={topSignal} />
          </div>
        )}

        {/* Other Signals */}
        {otherSignals.length > 0 && (
          <div style={{ marginBottom: 'var(--sp-lg)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 700 }}>
              Also on your radar
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {otherSignals.map((s) => (
                <ActionCard key={s.id} signal={s} compact />
              ))}
            </div>
          </div>
        )}

        {/* Top Assets */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 700 }}>
            Your assets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            {assets.slice(0, 5).map((asset) => {
              const gain = asset.unrealizedGain;
              return (
                <div key={asset.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--color-card)', backdropFilter: 'blur(16px)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--r-lg)', padding: '12px var(--sp-md)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--r-md)',
                    background: 'var(--color-accent-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {CLASS_ICONS[asset.class] ?? '◆'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 }}>
                      {asset.source === 'tink' ? '⟳ Bank sync' : asset.source === 'photo' ? '📷 Photo' : 'Manual'}
                      {asset.country ? ` · ${asset.country}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-1)' }}>
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: asset.currency, maximumFractionDigits: 0, notation: 'compact' }).format(asset.value)}
                    </div>
                    {gain && (
                      <div style={{ fontSize: 11, color: gain > 0 ? 'var(--color-positive)' : 'var(--color-negative)', marginTop: 1, fontWeight: 600 }}>
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
          marginTop: 'var(--sp-lg)',
          background: 'var(--color-accent-bg)',
          border: '1px solid rgba(26,86,219,0.20)',
          borderRadius: 'var(--r-xl)',
          padding: '16px var(--sp-lg)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 24 }}>◷</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 2 }}>Ask your advisor</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-2)' }}>Voice-enabled · Full portfolio context</div>
          </div>
          <a href="/advisor" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '10px 18px', height: 44,
            background: 'var(--color-accent)',
            color: '#FFF', borderRadius: 'var(--r-pill)',
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
            flexShrink: 0,
          }}>
            Talk →
          </a>
        </div>

      </div>
    </div>
  );
}
