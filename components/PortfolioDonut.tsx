'use client';

import React, { useState } from 'react';
import type { AssetClass } from '@/types';

const CLASS_COLORS: Record<AssetClass, string> = {
  real_estate:    '#0284C7',
  stocks:         '#38BDF8',
  pension:        '#7DD3FC',
  private_equity: '#0EA5E9',
  cars:           '#BAE6FD',
  watches:        '#E0F2FE',
  cash:           '#64748B',
  bonds:          '#94A3B8',
  crypto:         '#CBD5E1',
  art:            '#475569',
  commodities:    '#334155',
};

const CLASS_LABELS: Record<AssetClass, string> = {
  real_estate:    'Real Estate',
  stocks:         'Stocks & ETFs',
  pension:        'Pension',
  private_equity: 'Private Equity',
  cars:           'Cars',
  watches:        'Watches',
  cash:           'Cash',
  bonds:          'Bonds',
  crypto:         'Crypto',
  art:            'Art',
  commodities:    'Commodities',
};

interface PortfolioDonutProps {
  allocation: Record<AssetClass, number>;
  allocationPct: Record<AssetClass, number>;
  size?: number;
}

export default function PortfolioDonut({ allocation, allocationPct, size = 180 }: PortfolioDonutProps) {
  const [hovered, setHovered] = useState<AssetClass | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 6;
  const innerR = size / 2 - 30;

  const entries = Object.entries(allocationPct)
    .filter(([, v]) => v > 0.5)
    .sort(([, a], [, b]) => b - a) as [AssetClass, number][];

  const total = entries.reduce((s, [, v]) => s + v, 0);

  // Build SVG arc paths
  let cumAngle = -90; // start at top
  const arcs = entries.map(([cls, pct]) => {
    const sweep = (pct / total) * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + sweep - 1; // 1° gap
    cumAngle += sweep;

    const start = polarToCartesian(cx, cy, outerR, startAngle);
    const end = polarToCartesian(cx, cy, outerR, endAngle);
    const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
    const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
    const largeArc = sweep > 180 ? 1 : 0;

    const d = [
      `M ${start.x} ${start.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ');

    return { cls, pct, d };
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, notation: 'compact' }).format(n);

  const hoveredEntry = hovered ? entries.find(([cls]) => cls === hovered) : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      {/* Donut */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size}>
          {arcs.map(({ cls, d }) => (
            <path
              key={cls}
              d={d}
              fill={CLASS_COLORS[cls]}
              opacity={hovered && hovered !== cls ? 0.3 : 1}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHovered(cls)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        {/* Center label */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
          {hovered && hoveredEntry ? (
            <>
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}>{CLASS_LABELS[hovered]}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{hoveredEntry[1].toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{fmt(allocation[hovered])}</div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Allocation</div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {arcs.slice(0, 6).map(({ cls, pct }) => (
          <div
            key={cls}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: hovered && hovered !== cls ? 0.4 : 1, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(cls)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 10, height: 10, borderRadius: 3, background: CLASS_COLORS[cls], flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: '#475569' }}>{CLASS_LABELS[cls]}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', marginLeft: 'auto' }}>{pct.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180 + Math.PI / 2;
  return {
    x: cx + r * Math.cos((angleDeg * Math.PI) / 180 - Math.PI / 2),
    y: cy + r * Math.sin((angleDeg * Math.PI) / 180 - Math.PI / 2),
  };
}
