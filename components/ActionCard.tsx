'use client';

import React, { useState } from 'react';
import type { Signal } from '@/types';
import { useStore } from '@/lib/store';

const URGENCY_COLORS = {
  critical: '#EF4444',
  high:     '#F59E0B',
  medium:   '#38BDF8',
  low:      '#94A3B8',
};

const TYPE_ICONS: Record<string, string> = {
  tax:        '⊛',
  risk:       '◬',
  opportunity:'◈',
  deadline:   '◷',
  rebalance:  '⟳',
  compliance: '◻',
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

  const urgencyColor = URGENCY_COLORS[signal.urgency];
  const typeIcon = TYPE_ICONS[signal.type] ?? '◆';

  function handleAction() {
    if (state === 'signal' && signal.draftAction) {
      setSignalState(signal.id, 'action');
    } else if (state === 'action') {
      setSignalState(signal.id, 'confirming');
      setConfirming(true);
      // Simulate confirm delay
      setTimeout(() => {
        setSignalState(signal.id, 'done');
        setConfirming(false);
      }, 1400);
    } else {
      // No draft action — navigate or open advisor
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
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            ✓
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Noted</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{signal.title}</div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 13, padding: 0 }}>
            ← Back
          </button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: urgencyColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Draft ready
          </span>
        </div>

        {/* Draft content */}
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 500, color: '#0F172A', marginBottom: 8, lineHeight: 1.3 }}>
          {draft.title}
        </div>
        <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
          {draft.description}
        </div>

        {/* Impact badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(56,189,248,0.1)', borderRadius: 8, padding: '6px 12px', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0284C7' }}>{draft.impact}</span>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 20 }}>
          {draft.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#64748B', flexShrink: 0, marginTop: 1, fontWeight: 600 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{step}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleAction}
          disabled={confirming}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: confirming ? '#10B981' : '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            cursor: confirming ? 'default' : 'pointer',
            transition: 'all 0.3s ease',
            letterSpacing: 0.3,
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
          <span style={{ fontSize: 11, color: urgencyColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {signal.type.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {signal.deadline && (
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              {new Date(signal.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <button
            onClick={() => dismissSignal(signal.id)}
            style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
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
        color: '#0F172A',
        marginBottom: compact ? 4 : 8,
        lineHeight: 1.3,
      }}>
        {signal.title}
      </div>

      {/* Body */}
      {!compact && (
        <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
          {signal.body}
        </div>
      )}

      {/* Impact + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: compact ? 8 : 0 }}>
        {signal.impact && (
          <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: '#0284C7' }}>
            {signal.impact}
          </span>
        )}
        <button
          onClick={handleAction}
          style={{
            padding: compact ? '7px 14px' : '10px 18px',
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: 0.3,
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
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 18,
  padding: '20px 20px',
  transition: 'all 0.2s ease',
};
