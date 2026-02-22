'use client';

import React, { useState } from 'react';
import type { Signal } from '@/types';
import { useStore } from '@/lib/store';

const URGENCY_COLORS: Record<string, string> = {
  critical: 'var(--color-negative)',
  high:     'var(--color-neutral)',
  medium:   'var(--color-accent)',
  low:      'var(--color-text-3)',
};

const TYPE_ICONS: Record<string, string> = {
  tax:         '⊛',
  risk:        '◬',
  opportunity: '◈',
  deadline:    '◷',
  rebalance:   '⟳',
  compliance:  '◻',
};

interface ActionCardProps {
  signal: Signal;
  compact?: boolean;
}

export default function ActionCard({ signal, compact = false }: ActionCardProps) {
  const { signalState, setSignalState, dismissSignal } = useStore();
  const state = signalState[signal.id] ?? 'signal';
  const [confirming, setConfirming] = useState(false);

  if (state === 'dismissed' || state === 'done') return null;

  const urgencyColor = URGENCY_COLORS[signal.urgency] ?? 'var(--color-text-3)';
  const typeIcon = TYPE_ICONS[signal.type] ?? '◆';

  function handleAction() {
    if (state === 'signal' && signal.draftAction) {
      setSignalState(signal.id, 'action');
    } else if (state === 'action') {
      setSignalState(signal.id, 'confirming');
      setConfirming(true);
      setTimeout(() => {
        setSignalState(signal.id, 'done');
        setConfirming(false);
      }, 1400);
    } else {
      setSignalState(signal.id, 'dismissed');
    }
  }

  function handleBack() {
    setSignalState(signal.id, 'signal');
  }

  // ── DONE STATE ──
  if ((state as string) === 'done') {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(16,185,129,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            ✓
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-positive)' }}>Noted</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 2 }}>{signal.title}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTION / DRAFT STATE ──
  if (state === 'action' && signal.draftAction) {
    const draft = signal.draftAction;
    return (
      <div style={{ ...cardStyle, borderColor: urgencyColor + '30' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--sp-md)' }}>
          <button
            onClick={handleBack}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: 13, padding: '4px 0', minHeight: 44 }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: urgencyColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Draft ready
          </span>
        </div>

        {/* Draft content */}
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 500, color: 'var(--color-text-1)', marginBottom: 8, lineHeight: 1.35 }}>
          {draft.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 'var(--sp-md)' }}>
          {draft.description}
        </div>

        {/* Impact badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-accent-bg)', borderRadius: 'var(--r-sm)', padding: '6px 12px', marginBottom: 'var(--sp-md)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent)' }}>{draft.impact}</span>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 'var(--sp-lg)' }}>
          {draft.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: 'var(--color-accent-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'var(--color-accent)', flexShrink: 0, marginTop: 2, fontWeight: 700,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5 }}>{step}</div>
            </div>
          ))}
        </div>

        {/* CTA — pill */}
        <button
          onClick={handleAction}
          disabled={confirming}
          style={{
            width: '100%', height: 52,
            background: confirming ? 'var(--color-positive)' : 'var(--color-accent)',
            color: '#FFFFFF',
            border: 'none', borderRadius: 'var(--r-pill)',
            fontSize: 14, fontWeight: 700,
            cursor: confirming ? 'default' : 'pointer',
            transition: 'background 0.3s ease',
            letterSpacing: 0.2,
          }}
        >
          {confirming ? '✓ Done' : draft.requiresAuth ? 'Approve & Connect' : 'Approve'}
        </button>
      </div>
    );
  }

  // ── SIGNAL STATE (default) ──
  return (
    <div
      style={{
        ...cardStyle,
        borderLeft: `3px solid ${urgencyColor}`,
        ...(compact ? { padding: '14px 16px' } : {}),
      }}
    >
      {/* Type + urgency */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 8 : 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, color: urgencyColor }}>{typeIcon}</span>
          <span style={{ fontSize: 11, color: urgencyColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {signal.type.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
          {signal.deadline && (
            <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
              {new Date(signal.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <button
            onClick={() => dismissSignal(signal.id)}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-3)', cursor: 'pointer', fontSize: 18, padding: 4, lineHeight: 1, minWidth: 30, minHeight: 30 }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: compact ? 15 : 17,
        fontWeight: 500,
        color: 'var(--color-text-1)',
        marginBottom: compact ? 4 : 8,
        lineHeight: 1.35,
      }}>
        {signal.title}
      </div>

      {/* Body */}
      {!compact && (
        <div style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 'var(--sp-md)' }}>
          {signal.body}
        </div>
      )}

      {/* Impact + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: compact ? 8 : 0 }}>
        {signal.impact && (
          <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: 'var(--color-accent)' }}>
            {signal.impact}
          </span>
        )}
        <button
          onClick={handleAction}
          style={{
            padding: compact ? '0 14px' : '0 18px',
            height: 44,
            background: 'var(--color-accent)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--r-pill)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: 0.2,
            marginLeft: 'auto',
          }}
        >
          {signal.actionLabel} →
        </button>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-card)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--r-xl)',
  padding: 'var(--sp-lg)',
  transition: 'all 0.2s ease',
};
