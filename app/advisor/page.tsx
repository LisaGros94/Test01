'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import AdvisorChat from '@/components/AdvisorChat';
import ConvaiAdvisor from '@/components/ConvaiAdvisor';

export default function AdvisorPage() {
  const { computePortfolio, portfolio, assets, profile } = useStore();
  const [voiceOpen, setVoiceOpen] = useState(false);

  useEffect(() => {
    if (!portfolio) computePortfolio();
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', paddingTop: 56, paddingBottom: 60, position: 'relative' }}>

      {/* Voice conversation overlay */}
      {voiceOpen && (
        <ConvaiAdvisor
          portfolio={portfolio}
          assets={assets}
          profile={profile}
          onClose={() => setVoiceOpen(false)}
        />
      )}

      {/* Voice entry — sits above the chat header */}
      {!voiceOpen && (
        <div style={{
          padding: '10px 16px 0',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setVoiceOpen(true)}
            style={{
              width: '100%', height: 48,
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--r-pill)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--color-text-3)' }}>◷</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)' }}>
              Start voice conversation
            </span>
            <span style={{
              fontSize: 10, color: 'var(--color-positive)', fontWeight: 700,
              background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)',
              padding: '2px 8px', borderRadius: 'var(--r-pill)', letterSpacing: 0.3,
            }}>
              LIVE
            </span>
          </button>
        </div>
      )}

      {/* Text chat */}
      {!voiceOpen && <AdvisorChat />}
    </div>
  );
}
