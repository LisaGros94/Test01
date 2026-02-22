'use client';

import React, { useCallback, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import type { PortfolioSummary, Asset, UserProfile } from '@/types';

const AGENT_ID = 'agent_8401kj2pjq5afxh8qh2nzagqv61g';

interface Props {
  portfolio:  PortfolioSummary | null;
  assets:     Asset[];
  profile:    UserProfile | null;
  onClose:    () => void;
}

// Build a concise portfolio brief to prime the agent
function buildBrief(portfolio: PortfolioSummary | null, assets: Asset[], profile: UserProfile | null): string {
  if (!portfolio) return 'Portfolio not yet loaded.';
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n);
  return [
    `Client: ${profile?.name ?? 'User'}. Country: ${profile?.country ?? 'DE'}.`,
    `Net worth: ${fmt(portfolio.netWorth)}. Assets: ${fmt(portfolio.totalAssets)}. Liabilities: ${fmt(portfolio.totalLiabilities)}.`,
    `Liquid: ${fmt(portfolio.liquidAssets)}. YTD: +${portfolio.yearChangePct.toFixed(1)}%.`,
    `Top holdings: ${assets.slice(0, 4).map(a => `${a.name} (${fmt(a.value)})`).join(', ')}.`,
    `Retirement target: age ${profile?.retirementAge ?? 60}, income ${fmt(profile?.retirementIncome ?? 100_000)}/yr.`,
    `You are their private wealth advisor. Be direct, calm, and authoritative. Reference specific numbers.`,
  ].join(' ');
}

export default function ConvaiAdvisor({ portfolio, assets, profile, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect:    () => { setError(null); },
    onDisconnect: () => {},
    onError:      (err) => {
      const msg = typeof err === 'string' ? err : (err as Error)?.message ?? 'Connection error';
      setError(msg);
    },
  });

  const startSession = useCallback(async () => {
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access denied. Please allow microphone in your browser settings.');
      return;
    }

    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'webrtc',
        overrides: {
          agent: {
            firstMessage: `Hello ${profile?.name?.split(' ')[0] ?? 'there'}. I have your full portfolio loaded. What would you like to discuss?`,
            prompt: {
              prompt: buildBrief(portfolio, assets, profile),
            },
          },
        },
      });
    } catch (err) {
      setError('Could not connect to voice service. Check your network and try again.');
      console.error(err);
    }
  }, [conversation, portfolio, assets, profile]);

  const endSession = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected    = conversation.status === 'connected';
  const isConnecting   = conversation.status === 'connecting';
  const isSpeaking     = conversation.isSpeaking;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--color-bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 70, left: 20,
          background: 'none', border: 'none',
          color: 'var(--color-text-3)', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, padding: 8,
        }}
      >
        ← Back
      </button>

      {/* Visual orb */}
      <div style={{
        width: 160, height: 160, borderRadius: '50%',
        marginBottom: 32, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Outer ring — pulses when connected */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1px solid ${isConnected
            ? (isSpeaking ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.2)')
            : 'rgba(255,255,255,0.08)'}`,
          transition: 'border-color 0.4s ease',
        }} />
        {/* Inner fill */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: isConnected
            ? (isSpeaking ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)')
            : 'var(--color-surface-1)',
          border: `1px solid ${isConnected ? 'rgba(255,255,255,0.12)' : 'var(--color-border)'}`,
          transition: 'all 0.4s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: isConnected ? 'var(--color-text-2)' : 'var(--color-text-3)',
        }}>
          ◷
        </div>
      </div>

      {/* Status text */}
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 22, fontWeight: 400,
        color: 'var(--color-text-1)', marginBottom: 8, textAlign: 'center',
      }}>
        {isConnecting ? 'Connecting…' : isConnected ? 'Clarity Advisor' : 'Voice Advisor'}
      </div>
      <div style={{
        fontSize: 13, color: 'var(--color-text-3)',
        marginBottom: 48, textAlign: 'center',
      }}>
        {isConnecting ? 'Starting secure voice session…'
          : isConnected
          ? (isSpeaking ? 'Speaking — listening after…' : 'Listening')
          : 'Tap to start a voice conversation'}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 'var(--r-lg)',
          padding: '12px 18px',
          fontSize: 13, color: 'var(--color-negative)',
          marginBottom: 28, textAlign: 'center', maxWidth: 320,
          lineHeight: 1.55,
        }}>
          {error}
        </div>
      )}

      {/* CTA */}
      {!isConnected && !isConnecting ? (
        <button
          onClick={startSession}
          style={{
            width: 200, height: 52,
            background: 'var(--color-accent)',
            border: 'none', borderRadius: 'var(--r-pill)',
            fontSize: 15, fontWeight: 700,
            color: '#09090E', cursor: 'pointer',
            letterSpacing: 0.2,
          }}
        >
          Start conversation
        </button>
      ) : (
        <button
          onClick={endSession}
          disabled={isConnecting}
          style={{
            width: 200, height: 52,
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--r-pill)',
            fontSize: 14, fontWeight: 600,
            color: 'var(--color-text-2)',
            cursor: isConnecting ? 'default' : 'pointer',
          }}
        >
          {isConnecting ? 'Connecting…' : 'End conversation'}
        </button>
      )}

      {/* Volume hint */}
      {isConnected && (
        <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 24, textAlign: 'center' }}>
          Powered by ElevenLabs · Speak naturally · Full portfolio context loaded
        </div>
      )}
    </div>
  );
}
