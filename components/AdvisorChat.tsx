'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import type { AdvisorMessage } from '@/types';

const SUGGESTED_PROMPTS = [
  { icon: '◬', text: "What's my biggest financial risk right now?" },
  { icon: '⊛', text: 'How can I reduce my tax bill before year-end?' },
  { icon: '⟳', text: 'Am I on track to retire at 58?' },
  { icon: '◈', text: 'What would happen if I sold my Bitcoin today?' },
  { icon: '▣', text: 'Walk me through my mortgage renewal options' },
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
      content: `Hello${profile?.name ? `, ${profile.name}` : ''}. I have full context on your portfolio — €${portfolio ? Math.round(portfolio.netWorth / 1000) + 'k' : '—'} net worth across ${assets.length} assets. What would you like to explore?`,
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
        name: a.name, class: a.class, value: a.value, currency: a.currency,
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
      id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date().toISOString(),
    };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: AdvisorMessage = {
      id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString(),
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
        body: JSON.stringify({ messages: historyForAPI, portfolioContext: buildPortfolioContext(), voiceMode: voiceEnabled }),
      });

      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m));
      }

      if (voiceEnabled && fullText) {
        try {
          const voiceRes = await fetch('/api/voice', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fullText }),
          });
          if (voiceRes.ok) {
            const blob = await voiceRes.blob();
            const url = URL.createObjectURL(blob);
            playAudio(url);
            setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, audioUrl: url } : m));
          }
        } catch {}
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: 'I encountered an issue. Please try again.' } : m)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg)' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Advisor mark */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-accent-bg)',
            border: '1px solid rgba(200,169,110,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--color-accent)', flexShrink: 0,
          }}>
            ◷
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-1)', lineHeight: 1.2 }}>
              Clarity Advisor
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-positive)', display: 'inline-block', flexShrink: 0 }} />
              {netWorthFmt ? `${netWorthFmt} · ${assets.length} assets loaded` : 'Loading context…'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: voiceEnabled ? 'var(--color-accent-bg)' : 'var(--color-surface-2)',
            border: `1px solid ${voiceEnabled ? 'rgba(200,169,110,0.4)' : 'var(--color-border)'}`,
            cursor: 'pointer', fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: voiceEnabled ? 'var(--color-accent)' : 'var(--color-text-3)',
            transition: 'all 0.2s ease',
          }}
        >
          {voiceEnabled ? '▶' : '◌'}
        </button>
      </div>

      {/* ── Message feed ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 10 }}>
              {!isUser && (
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--color-accent-bg)',
                  border: '1px solid rgba(200,169,110,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'var(--color-accent)', flexShrink: 0, marginBottom: 2,
                }}>
                  ◷
                </div>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '12px 16px',
                borderRadius: isUser
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px',
                background: isUser ? 'var(--color-accent)' : 'var(--color-surface-1)',
                border: isUser ? 'none' : '1px solid var(--color-border)',
                color: isUser ? '#08090D' : 'var(--color-text-1)',
                fontSize: 14,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                fontWeight: isUser ? 500 : 400,
              }}>
                {msg.content || <ThinkingDots />}
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

        {/* Suggested prompts */}
        {showSuggestions && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              fontSize: 10, color: 'var(--color-text-3)',
              textTransform: 'uppercase', letterSpacing: 1.0,
              fontWeight: 700, marginBottom: 10,
            }}>
              Try asking
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.text}
                  onClick={() => sendMessage(p.text)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', width: '100%', textAlign: 'left',
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--r-lg)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--color-accent)', flexShrink: 0 }}>{p.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-2)', fontWeight: 500, lineHeight: 1.35 }}>{p.text}</span>
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
        background: 'var(--color-surface-1)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--r-pill)',
          padding: '4px 4px 4px 18px',
          border: `1px solid ${streaming ? 'rgba(200,169,110,0.4)' : 'var(--color-border-md)'}`,
          transition: 'border-color 0.2s ease',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={streaming ? 'Responding…' : 'Ask anything about your portfolio…'}
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
            aria-label="Send"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: input.trim() && !streaming ? 'var(--color-accent)' : 'var(--color-surface-3)',
              border: 'none',
              cursor: input.trim() && !streaming ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'background 0.2s ease', flexShrink: 0,
              color: input.trim() && !streaming ? '#08090D' : 'var(--color-text-3)',
              fontWeight: 700,
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-3)', marginTop: 8, letterSpacing: 0.3 }}>
          Powered by Claude · Not financial advice
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((d) => (d + 1) % 3), 450);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: i === active ? 'var(--color-accent)' : 'var(--color-surface-3)',
          display: 'inline-block',
          transition: 'background 0.2s ease',
        }} />
      ))}
    </span>
  );
}
