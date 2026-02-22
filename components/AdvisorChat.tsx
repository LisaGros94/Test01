'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import type { AdvisorMessage } from '@/types';

const SUGGESTED_PROMPTS = [
  { icon: '◬', text: "What's my biggest financial risk right now?" },
  { icon: '⊛', text: 'How can I reduce my tax bill before year-end?' },
  { icon: '⟳', text: 'Am I on track to retire at 58?' },
  { icon: '◈', text: 'What would happen if I sold my Bitcoin today?' },
  { icon: '⊞', text: 'Walk me through my mortgage renewal options' },
  { icon: '◷', text: 'Explain my property concentration risk' },
];

function playAudio(audioUrl: string) {
  const audio = new Audio(audioUrl);
  audio.play().catch(() => {});
}

export default function AdvisorChat() {
  const { profile, assets, portfolio, voiceEnabled, setVoiceEnabled } = useStore();
  const [messages, setMessages] = useState<AdvisorMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello${profile?.name ? ` ${profile.name}` : ''}. I'm your Clarity advisor. I have full context on your portfolio — €${portfolio ? Math.round(portfolio.netWorth / 1000) + 'k' : '—'} net worth across ${assets.length} assets. What would you like to explore?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildPortfolioContext = useCallback(() => {
    if (!portfolio) return null;
    return {
      netWorth: portfolio.netWorth,
      totalAssets: portfolio.totalAssets,
      totalLiabilities: portfolio.totalLiabilities,
      liquidAssets: portfolio.liquidAssets,
      allocation: portfolio.allocationPct,
      monthChangePct: portfolio.monthChangePct,
      yearChangePct: portfolio.yearChangePct,
      userName: profile?.name,
      country: profile?.country,
      retirementAge: profile?.retirementAge,
      retirementIncome: profile?.retirementIncome,
      topAssets: assets.slice(0, 6).map((a) => ({
        name: a.name,
        class: a.class,
        value: a.value,
        currency: a.currency,
        unrealizedGain: a.unrealizedGain,
        metadata: {
          mortgageBalance: a.metadata?.mortgageBalance,
          mortgageExpiry: a.metadata?.mortgageExpiry,
          mortgageRate: a.metadata?.mortgageRate,
        },
      })),
    };
  }, [portfolio, profile, assets]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: AdvisorMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantId = `a-${Date.now()}`;
    const assistantMsg: AdvisorMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    try {
      const historyForAPI = [...messages, userMsg]
        .filter((m) => m.id !== 'welcome')
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForAPI,
          portfolioContext: buildPortfolioContext(),
          voiceMode: voiceEnabled,
        }),
      });

      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
        );
      }

      if (voiceEnabled && fullText) {
        try {
          const voiceRes = await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fullText }),
          });
          if (voiceRes.ok) {
            const blob = await voiceRes.blob();
            const url = URL.createObjectURL(blob);
            playAudio(url);
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, audioUrl: url } : m))
            );
          }
        } catch {}
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'I encountered an issue. Please try again.' }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const showSuggestions = messages.length <= 1;
  const netWorthFmt = portfolio
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(portfolio.netWorth)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: 'var(--color-bg)' }}>

      {/* ── Premium Header ─────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-accent)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          {/* Advisor avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, flexShrink: 0,
          }}>
            ◷
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', lineHeight: 1.2 }}>Clarity Advisor</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#A7F3D0' }} />
              {netWorthFmt ? `${netWorthFmt} · ${assets.length} assets loaded` : 'Loading context…'}
            </div>
          </div>
        </div>

        {/* Voice toggle */}
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: voiceEnabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)',
            border: '1.5px solid',
            borderColor: voiceEnabled ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.20)',
            cursor: 'pointer', fontSize: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, position: 'relative', zIndex: 1,
            transition: 'all 0.2s ease',
          }}
        >
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* ── Message feed ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}
            >
              {/* Advisor avatar on assistant messages */}
              {!isUser && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#FFF', flexShrink: 0, marginBottom: 2,
                }}>
                  ◷
                </div>
              )}

              <div
                style={{
                  maxWidth: '78%',
                  padding: '12px 16px',
                  borderRadius: isUser
                    ? 'var(--r-lg) var(--r-lg) var(--r-sm) var(--r-lg)'
                    : 'var(--r-lg) var(--r-lg) var(--r-lg) var(--r-sm)',
                  background: isUser ? 'var(--color-accent)' : 'var(--color-card)',
                  border: isUser ? 'none' : '1px solid var(--color-border)',
                  backdropFilter: isUser ? 'none' : 'blur(16px)',
                  color: isUser ? '#FFFFFF' : 'var(--color-text-1)',
                  fontSize: 14,
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  fontFamily: !isUser ? 'var(--font-sans)' : 'inherit',
                }}
              >
                {msg.content || (
                  <span style={{ color: 'var(--color-text-3)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ThinkingDots />
                  </span>
                )}
                {msg.audioUrl && (
                  <button
                    onClick={() => playAudio(msg.audioUrl!)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: 12, padding: 0, fontWeight: 600 }}
                  >
                    ▶ Play again
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* ── Suggested prompts — empty state ── */}
        {showSuggestions && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 700, marginBottom: 10 }}>
              Try asking
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.text}
                  onClick={() => sendMessage(p.text)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', width: '100%', textAlign: 'left',
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--r-lg)',
                    cursor: 'pointer',
                    backdropFilter: 'blur(12px)',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: 15, color: 'var(--color-accent)', flexShrink: 0 }}>{p.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-2)', fontWeight: 500, lineHeight: 1.4 }}>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ─────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px 10px',
        borderTop: '1px solid var(--color-border)',
        background: 'rgba(248,250,252,0.95)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--color-card)',
          borderRadius: 'var(--r-pill)',
          padding: '4px 4px 4px 18px',
          border: `1.5px solid ${streaming ? 'var(--color-accent)' : 'var(--color-border-md)'}`,
          transition: 'border-color 0.2s ease',
          boxShadow: streaming ? '0 0 0 3px rgba(26,86,219,0.10)' : 'none',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={streaming ? 'Advisor is responding…' : 'Ask anything about your finances…'}
            disabled={streaming}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--color-text-1)',
              fontFamily: 'inherit', height: 44,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            aria-label="Send message"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: input.trim() && !streaming ? 'var(--color-accent)' : '#E2E8F0',
              border: 'none',
              cursor: input.trim() && !streaming ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'background 0.2s ease', flexShrink: 0,
              color: input.trim() && !streaming ? '#FFFFFF' : 'var(--color-text-3)',
            }}
          >
            ↑
          </button>
        </div>

        {/* Subtle footer note */}
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-3)', marginTop: 8 }}>
          Clarity Advisor · Powered by Claude · Not financial advice
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d >= 3 ? 1 : d + 1)), 450);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i < dots ? 'var(--color-accent)' : 'var(--color-border-md)',
            transition: 'background 0.2s ease',
            display: 'inline-block',
          }}
        />
      ))}
    </span>
  );
}
