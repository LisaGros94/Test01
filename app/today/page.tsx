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
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: 24, paddingTop: 8 }}>
          <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 500, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
            {greeting}
          </h1>
        </div>

        {/* Net Worth Card */}
        {netWorthFrame && portfolio && (
          <div style={{
            background: '#0F172A',
            borderRadius: 22,
            padding: '24px 24px',
            marginBottom: 16,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Background decoration */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(56,189,248,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(56,189,248,0.04)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {netWorthFrame.label}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 40, color: '#FFFFFF', fontWeight: 500, lineHeight: 1, marginBottom: 6 }}>
                {fmt(portfolio.netWorth, true)}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{netWorthFrame.sublabel}</div>

              {/* Month change */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>This month</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: portfolio.monthChange >= 0 ? '#34D399' : '#F87171' }}>
                    {portfolio.monthChange >= 0 ? '+' : ''}{fmt(portfolio.monthChange, true)} ({portfolio.monthChangePct.toFixed(1)}%)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>This year</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: portfolio.yearChange >= 0 ? '#34D399' : '#F87171' }}>
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
                      <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: i === arr.length - 1 ? '#38BDF8' : 'rgba(255,255,255,0.2)' }} />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liquidity pills */}
        {portfolio && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Liquid</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{fmt(portfolio.liquidAssets, true)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Illiquid</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{fmt(portfolio.illiquidAssets, true)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Liabilities</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#EF4444' }}>{fmt(portfolio.totalLiabilities, true)}</div>
            </div>
          </div>
        )}

        {/* Priority Signal */}
        {topSignal && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>
              Priority action
            </div>
            <ActionCard signal={topSignal} />
          </div>
        )}

        {/* Other Signals */}
        {otherSignals.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>
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
          <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, fontWeight: 600 }}>
            Your assets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assets.slice(0, 5).map((asset) => {
              const gain = asset.unrealizedGain;
              return (
                <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '12px 16px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(56,189,248,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {CLASS_ICONS[asset.class] ?? '◆'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                      {asset.source === 'tink' ? '⟳ Bank sync' : asset.source === 'photo' ? '📷 Photo' : 'Manual'}
                      {asset.country ? ` · ${asset.country}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: asset.currency, maximumFractionDigits: 0, notation: 'compact' }).format(asset.value)}
                    </div>
                    {gain && (
                      <div style={{ fontSize: 11, color: gain > 0 ? '#10B981' : '#EF4444', marginTop: 1, fontWeight: 500 }}>
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
        <div style={{ marginTop: 24, background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(14,165,233,0.08))', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 24 }}>◷</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>Ask your advisor</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Voice-enabled · Full portfolio context</div>
          </div>
          <a href="/advisor" style={{ padding: '8px 16px', background: '#0F172A', color: '#FFF', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            Talk →
          </a>
        </div>
      </div>
    </div>
  );
}
