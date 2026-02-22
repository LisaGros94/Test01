'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import type { AdvisorMessage } from '@/types';

const SUGGESTED_PROMPTS = [
  'What\'s my biggest financial risk right now?',
  'How can I reduce my tax bill before year-end?',
  'Walk me through my mortgage renewal options',
  'Am I on track to retire at 58?',
  'What would happen if I sold my Bitcoin today?',
  'Explain my property concentration risk',
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
  const [micActive, setMicActive] = useState(false);
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

      // Voice synthesis
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
    } catch (err) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Clarity Advisor</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Full portfolio context · Claude Opus</div>
        </div>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          title={voiceEnabled ? 'Disable voice' : 'Enable voice (ElevenLabs)'}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: voiceEnabled ? 'rgba(56,189,248,0.15)' : 'rgba(0,0,0,0.05)',
            border: voiceEnabled ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(0,0,0,0.08)',
            cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '82%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? '#0F172A' : 'rgba(255,255,255,0.85)',
                border: msg.role === 'assistant' ? '1px solid rgba(0,0,0,0.07)' : 'none',
                backdropFilter: msg.role === 'assistant' ? 'blur(16px)' : 'none',
                color: msg.role === 'user' ? '#FFFFFF' : '#0F172A',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content || (
                <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  <ThinkingDots />
                </span>
              )}
              {msg.audioUrl && (
                <button
                  onClick={() => playAudio(msg.audioUrl!)}
                  style={{ display: 'block', marginTop: 8, background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', fontSize: 12, padding: 0 }}
                >
                  ▶ Play again
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Suggested prompts — show only at start */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#475569',
                  cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.15s',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(241,245,249,0.8)', borderRadius: 14, padding: '8px 12px 8px 16px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your finances…"
            disabled={streaming}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, color: '#0F172A',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: input.trim() && !streaming ? '#0F172A' : '#E2E8F0',
              border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, transition: 'all 0.15s', flexShrink: 0,
              color: input.trim() && !streaming ? '#FFFFFF' : '#94A3B8',
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <span>Thinking{dots}</span>;
}
