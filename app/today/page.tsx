'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { frameNetWorth } from '@/lib/archetype';
import { computeInsights, briefingLine, type Insight } from '@/lib/intelligence';

// ── Helpers ───────────────────────────────────────────────────────
function severityBorder(s: number): string {
  if (s >= 4) return '2px solid rgba(248,113,113,0.45)';
  if (s >= 3) return '2px solid rgba(245,158,11,0.45)';
  return '2px solid rgba(255,255,255,0.12)';
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    concentration: 'Concentration',
    rates:         'Rate exposure',
    liquidity:     'Liquidity',
    cash_drag:     'Cash drag',
    tax:           'Tax window',
  };
  return map[cat] ?? cat;
}

function categoryColor(s: number): string {
  if (s >= 4) return 'rgba(248,113,113,0.75)';
  if (s >= 3) return 'rgba(245,158,11,0.75)';
  return 'var(--color-text-3)';
}

// ── Mortgage refinancing simulator ────────────────────────────────
function MortgageSimulator({ data, onClose }: {
  data:    Record<string, number | string>;
  onClose: () => void;
}) {
  const balance      = Number(data.balance);
  const varRate      = Number(data.varRate);
  const fixedRate    = Number(data.fixedRate);
  const annualBefore = Math.round(balance * varRate / 100);
  const annualAfter  = Math.round(balance * fixedRate / 100);
  const saving5yr    = (annualBefore - annualAfter) * 5;

  const fmt = (n: number) => '€' + n.toLocaleString('de-DE');

  const rows: [string, string, string][] = [
    ['Rate',         `${varRate}% variable`,    `${fixedRate}% fixed · 5yr`],
    ['Annual cost',  fmt(annualBefore),          fmt(annualAfter)           ],
    ['5-year total', fmt(annualBefore * 5),      fmt(annualAfter * 5)       ],
    ['Net saving',   '—',                        fmt(saving5yr)             ],
  ];

  return (
    <div style={{
      background: 'var(--color-surface-1)',
      border: '1px solid var(--color-border-md)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      marginBottom: 'var(--sp-sm)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 1.0, fontWeight: 700, marginBottom: 4 }}>
            Refinancing analysis
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-1)' }}>
            {data.assetName} · €{(balance / 1000).toFixed(0)}k mortgage
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>
          ×
        </button>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ padding: '8px 18px' }} />
        <div style={{ padding: '8px 12px', fontSize: 9, color: 'var(--color-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Current</div>
        <div style={{ padding: '8px 12px', fontSize: 9, color: 'var(--color-positive)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>After refi</div>
      </div>

      {/* Rows */}
      {rows.map(([label, before, after], i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
          <div style={{ padding: '11px 18px', fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600 }}>{label}</div>
          <div style={{ padding: '11px 12px', fontSize: 13, color: 'var(--color-text-2)' }}>{before}</div>
          <div style={{ padding: '11px 12px', fontSize: 13, color: after === '—' ? 'var(--color-text-2)' : 'var(--color-positive)', fontWeight: after === '—' ? 400 : 700 }}>{after}</div>
        </div>
      ))}

      {/* CTA */}
      <div style={{ padding: '14px 18px', display: 'flex', gap: 10 }}>
        <button onClick={onClose} style={{ height: 42, padding: '0 18px', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--r-pill)', fontSize: 12, color: 'var(--color-text-3)', cursor: 'pointer', fontWeight: 600 }}>
          Dismiss
        </button>
        <Link href="/advisor" style={{ flex: 1, height: 42, background: 'var(--color-accent)', borderRadius: 'var(--r-pill)', fontSize: 13, color: '#09090E', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', letterSpacing: 0.2 }}>
          Discuss with advisor →
        </Link>
      </div>
    </div>
  );
}

// ── Single insight row inside Briefing card ───────────────────────
function InsightRow({ insight, onSimulate }: {
  insight:    Insight;
  onSimulate: (key: string, data: Record<string, number | string>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderLeft: severityBorder(insight.severity), paddingLeft: 14 }}>
      {/* Category */}
      <div style={{ fontSize: 9, color: categoryColor(insight.severity), fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.0, marginBottom: 5 }}>
        {categoryLabel(insight.category)}
      </div>

      {/* Summary — authoritative headline */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', lineHeight: 1.35 }}>
        {insight.summary}
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.65, marginBottom: 8 }}>
            {insight.explanation}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-3)', lineHeight: 1.55, marginBottom: 14, fontStyle: 'italic' }}>
            {insight.action}
          </div>
          {insight.simulatorKey && insight.data && (
            <button
              onClick={() => onSimulate(insight.simulatorKey!, insight.data!)}
              style={{ height: 36, padding: '0 16px', background: 'var(--color-accent)', border: 'none', borderRadius: 'var(--r-pill)', fontSize: 12, color: '#09090E', cursor: 'pointer', fontWeight: 700, letterSpacing: 0.2 }}
            >
              {insight.cta} →
            </button>
          )}
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--color-text-3)', cursor: 'pointer', padding: '7px 0 0 0', display: 'block', fontWeight: 600, letterSpacing: 0.2 }}
      >
        {open ? 'Close' : insight.cta + ' ↓'}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function TodayPage() {
  const { assets, profile, computePortfolio, portfolio } = useStore();

  useEffect(() => {
    if (!portfolio) computePortfolio();
  }, []);

  const { insights, monthlyBurn, runwayMonths } = useMemo(
    () => portfolio ? computeInsights(assets, portfolio) : { insights: [], monthlyBurn: 7_800, runwayMonths: 0 },
    [assets, portfolio],
  );

  const [activeSimulator, setActiveSimulator] = useState<{ key: string; data: Record<string, number | string> } | null>(null);

  const netWorthFrame = portfolio ? frameNetWorth(portfolio.netWorth, profile?.archetype.primary ?? 'optimizer') : null;
  const firstName     = profile?.name?.split(' ')[0];

  const timeGreeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const fmtCompact = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n);

  const runwayRisk = runwayMonths > 0 && runwayMonths < 12;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: 72, paddingBottom: 100 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 var(--sp-md)' }}>

        {/* Date */}
        <div style={{ paddingTop: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-3)', letterSpacing: 0.7, fontWeight: 600 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
          </div>
        </div>

        {/* ── Clarity Briefing ────────────────────────────────── */}
        <div style={{ marginBottom: 'var(--sp-sm)' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 1.3, fontWeight: 700, marginBottom: 8 }}>
              Clarity Briefing
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 21, fontWeight: 400, color: 'var(--color-text-1)', lineHeight: 1.35 }}>
              {timeGreeting}{firstName ? `, ${firstName}` : ''}. {briefingLine(insights)}
            </div>
          </div>

          {insights.length > 0 && (
            <div style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--r-xl)',
              padding: '20px',
              display: 'flex', flexDirection: 'column', gap: 22,
            }}>
              {insights.map((ins) => (
                <InsightRow
                  key={ins.id}
                  insight={ins}
                  onSimulate={(key, data) => setActiveSimulator({ key, data })}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Decision Simulator (inline, on demand) ───────────── */}
        {activeSimulator?.key === 'mortgage_refi' && (
          <MortgageSimulator
            data={activeSimulator.data}
            onClose={() => setActiveSimulator(null)}
          />
        )}

        {/* ── Financial Position ───────────────────────────────── */}
        {portfolio && (
          <div style={{
            background: 'linear-gradient(150deg, #131926 0%, #0A0D18 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--sp-lg)',
            marginBottom: 'var(--sp-sm)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginBottom: 10 }}>
              {netWorthFrame?.label ?? 'Net worth'}
            </div>

            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 44, fontWeight: 400, color: 'var(--color-text-1)', lineHeight: 1, marginBottom: 4, letterSpacing: -0.5 }}>
              {fmtCompact(portfolio.netWorth)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 16 }}>
              {netWorthFrame?.sublabel ?? ''}
            </div>

            {/* Month / Year */}
            <div style={{ display: 'flex', gap: 'var(--sp-xl)', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Month</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: portfolio.monthChange >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                  {portfolio.monthChange >= 0 ? '+' : ''}{fmtCompact(portfolio.monthChange)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Year</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-positive)' }}>
                  +{portfolio.yearChangePct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* ── Burn + Runway ── */}
            <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                Burn est. <span style={{ color: 'var(--color-text-2)', fontWeight: 600 }}>€{(monthlyBurn / 1000).toFixed(1)}k/mo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {runwayRisk && (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-neutral)', display: 'inline-block' }} />
                )}
                <span style={{ fontSize: 12, color: runwayRisk ? 'var(--color-neutral)' : 'var(--color-text-2)', fontWeight: 600 }}>
                  {runwayMonths}m runway
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Advisor entry — minimal ───────────────────────────── */}
        <Link href="/advisor" style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-md)',
          padding: '15px 18px',
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--r-xl)',
          textDecoration: 'none',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-1)', marginBottom: 3 }}>Ask your advisor</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>Full portfolio context · Voice available</div>
          </div>
          <span style={{ fontSize: 16, color: 'var(--color-text-3)' }}>→</span>
        </Link>

      </div>
    </div>
  );
}
