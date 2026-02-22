'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import type { PortfolioSummary, Asset, UserProfile } from '@/types';

interface Props {
  portfolio:  PortfolioSummary | null;
  assets:     Asset[];
  profile:    UserProfile | null;
}

// Build a concise portfolio brief sent post-connect via sendContextualUpdate
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

export default function ConvaiAdvisor({ portfolio, assets, profile }: Props) {
  const [error, setError]           = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const briefSentRef                = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      setError(null);
      setIsStarting(false);
      briefSentRef.current = false;
    },
    onDisconnect: () => {
      setIsStarting(false);
      briefSentRef.current = false;
    },
    onError: (err) => {
      const msg = typeof err === 'string' ? err : (err as Error)?.message ?? 'Connection error';
      setError(msg);
      setIsStarting(false);
    },
  });

  // Inject portfolio context once connected
  useEffect(() => {
    if (conversation.status === 'connected' && !briefSentRef.current && portfolio) {
      briefSentRef.current = true;
      const brief = buildBrief(portfolio, assets, profile);
      try {
        // sendContextualUpdate injects context without it appearing in the conversation
        (conversation as any).sendContextualUpdate?.(brief);
      } catch {
        // Not all SDK versions expose this — silently skip
      }
    }
  }, [conversation.status, portfolio, assets, profile]);

  const startSession = useCallback(async () => {
    setError(null);
    setIsStarting(true);

    // 1. Microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Microphone access denied. Please allow microphone in your browser settings.');
      setIsStarting(false);
      return;
    }

    // 2. Get signed token from our server
    let token: string | null = null;
    try {
      const res = await fetch('/api/elevenlabs-token');
      if (res.ok) {
        const data = await res.json();
        token = data.token ?? null;
      }
    } catch {
      // Token fetch failed — will fall back to public agent_id
    }

    // 3. Start session (token preferred; agent_id fallback for public agents)
    try {
      const sessionOpts: Record<string, unknown> = {
        connectionType: 'webrtc',
      };

      if (token) {
        sessionOpts.conversationToken = token;
      } else {
        sessionOpts.agentId = 'agent_8401kj2pjq5afxh8qh2nzagqv61g';
      }

      await conversation.startSession(sessionOpts as Parameters<typeof conversation.startSession>[0]);
    } catch (err) {
      console.error('Voice session failed:', err);
      setError('Could not connect to voice service. Check your network and try again.');
      setIsStarting(false);
    }
  }, [conversation, portfolio, assets, profile]);

  const endSession = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected  = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting' || isStarting;
  const isSpeaking   = conversation.isSpeaking;
  const firstName    = profile?.name?.split(' ')[0] ?? 'there';

  return (
    <div style={{
      flex: 1,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 32px 40px',
    }}>

      {/* Visual orb */}
      <div style={{
        width: 160, height: 160, borderRadius: '50%',
        marginBottom: 36, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1px solid ${isConnected
            ? (isSpeaking ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.18)')
            : 'rgba(255,255,255,0.06)'}`,
          transition: 'border-color 0.5s ease',
        }} />
        {/* Pulse ring — only when speaking */}
        {isSpeaking && (
          <div style={{
            position: 'absolute', inset: -10, borderRadius: '50%',
            border: '1px solid rgba(52,211,153,0.2)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        )}
        {/* Inner fill */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: isConnected
            ? (isSpeaking ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)')
            : 'var(--color-surface-1)',
          border: `1px solid ${isConnected ? 'rgba(255,255,255,0.10)' : 'var(--color-border)'}`,
          transition: 'all 0.5s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, color: isConnected ? 'var(--color-text-2)' : 'var(--color-text-3)',
        }}>
          ◷
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 24, fontWeight: 400,
        color: 'var(--color-text-1)', marginBottom: 8, textAlign: 'center',
      }}>
        {isConnecting ? 'Connecting…' : isConnected ? `Clarity Advisor` : 'Voice Advisor'}
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: 13, color: 'var(--color-text-3)',
        marginBottom: 52, textAlign: 'center', lineHeight: 1.5,
      }}>
        {isConnecting
          ? 'Starting secure voice session…'
          : isConnected
          ? (isSpeaking ? 'Speaking — listening after…' : `Listening, ${firstName}`)
          : 'Your portfolio is loaded. Tap to begin.'}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.20)',
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
            width: 220, height: 54,
            background: 'var(--color-accent)',
            border: 'none', borderRadius: 'var(--r-pill)',
            fontSize: 15, fontWeight: 700,
            color: '#08090D', cursor: 'pointer',
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
            width: 220, height: 54,
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--r-pill)',
            fontSize: 14, fontWeight: 600,
            color: 'var(--color-text-2)',
            cursor: isConnecting ? 'default' : 'pointer',
            opacity: isConnecting ? 0.5 : 1,
          }}
        >
          {isConnecting ? 'Connecting…' : 'End conversation'}
        </button>
      )}

      {/* Footer hint */}
      {isConnected && (
        <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 28, textAlign: 'center' }}>
          Powered by ElevenLabs · Full portfolio context loaded
        </div>
      )}

      {!isConnected && !isConnecting && !error && (
        <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 20, textAlign: 'center' }}>
          Powered by ElevenLabs · Speak naturally
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
