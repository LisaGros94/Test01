'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import type { AdvisorMessage } from '@/types';

// ── Agentic action block parsing ────────────────────────────────────
interface ActionBlock {
  id:          string;
  title:       string;
  description: string;
  impact:      string;
  risk:        'low' | 'medium' | 'high';
  cta:         string;
}

function parseActionBlock(raw: string): ActionBlock | null {
  try {
    const get = (key: string) => {
      const m = raw.match(new RegExp(`${key}:\\s*(.+)`));
      return m ? m[1].trim() : '';
    };
    const title = get('title');
    if (!title) return null;
    return {
      id:          `action-${Math.random().toString(36).slice(2)}`,
      title,
      description: get('description'),
      impact:      get('impact'),
      risk:        (get('risk') as ActionBlock['risk']) || 'low',
      cta:         get('cta') || 'Approve',
    };
  } catch {
    return null;
  }
}

// Splits message text into prose + action block segments
function splitContent(text: string): Array<{ type: 'text' | 'action'; content: string }> {
  const parts = text.split(/(::ACTION::[\s\S]*?::END::)/);
  return parts
    .map((part) => ({
      type:    part.startsWith('::ACTION::') ? 'action' : 'text',
      content: part,
    } as { type: 'text' | 'action'; content: string }))
    .filter((p) => p.content.trim());
}

// ── Suggested prompts ───────────────────────────────────────────────
const SUGGESTED = [
  { icon: '▭', text: 'Optimise my idle cash'                  },
  { icon: '⊛', text: 'Find my biggest tax saving right now'    },
  { icon: '◬', text: "What's my single biggest risk?"          },
  { icon: '⟳', text: 'Should I rebalance anything?'           },
  { icon: '◷', text: 'How do I retire 3 years earlier?'        },
  { icon: '▣', text: 'Walk me through my mortgage situation'   },
];

// ── Voice ───────────────────────────────────────────────────────────
function playAudioUrl(url: string): HTMLAudioElement {
  const audio = new Audio(url);
  audio.play().catch(() => {});
  return audio;
}

// ── AgentActionCard ─────────────────────────────────────────────────
function AgentActionCard({
  block, state, onApprove, onDismiss,
}: {
  block:     ActionBlock;
  state:     'pending' | 'approved' | 'dismissed';
  onApprove: (block: ActionBlock) => void;
  onDismiss: (id: string) => void;
}) {
  const riskColor = block.risk === 'high'
    ? 'var(--color-negative)'
    : block.risk === 'medium'
    ? 'var(--color-neutral)'
    : 'var(--color-positive)';

  if (state === 'approved') {
    return (
      <div style={{
        margin: '10px 0', padding: '11px 14px',
        background: 'rgba(52,211,153,0.05)',
        border: '1px solid rgba(52,211,153,0.18)',
        borderRadius: 'var(--r-lg)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ color: 'var(--color-positive)', fontSize: 13 }}>✓</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>Approved — {block.title}</span>
      </div>
    );
  }

  if (state === 'dismissed') return null;

  return (
    <div style={{
      margin: '10px 0',
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border-md)',
      borderLeft: `2.5px solid ${riskColor}`,
      borderRadius: 'var(--r-lg)',
    }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-1)', marginBottom: 5, lineHeight: 1.3 }}>
          {block.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-2)', lineHeight: 1.55, marginBottom: 10 }}>
          {block.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 'var(--r-pill)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)',
            color: 'var(--color-text-1)', fontWeight: 700, letterSpacing: 0.2,
          }}>
            {block.impact}
          </span>
          <span style={{
            fontSize: 10, color: riskColor, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.6,
          }}>
            {block.risk} risk
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onDismiss(block.id)}
            style={{
              height: 38, padding: '0 16px',
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: 'var(--r-pill)',
              fontSize: 12, color: 'var(--color-text-3)',
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            Dismiss
          </button>
          <button
            onClick={() => onApprove(block)}
            style={{
              height: 38, flex: 1,
              background: 'var(--color-accent)', border: 'none',
              borderRadius: 'var(--r-pill)',
              fontSize: 12, color: '#09090E',
              cursor: 'pointer', fontWeight: 700, letterSpacing: 0.2,
            }}
          >
            {block.cta} →
          </button>
        </div>
      </div>
    </div>
  );
}

function ThinkingDots() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => (n + 1) % 3), 480);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: '50%',
          background: i === tick ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.15)',
          display: 'inline-block', transition: 'background 0.25s ease',
        }} />
      ))}
    </span>
  );
}

// ── Main ────────────────────────────────────────────────────────────
export default function AdvisorChat() {
  const { profile, assets, portfolio, voiceEnabled, setVoiceEnabled } = useStore();

  const netFmt = portfolio
    ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(portfolio.netWorth)
    : null;
  const welcomeBody = `Hello${profile?.name ? `, ${profile.name}` : ''}. I have your full portfolio — ${netFmt ?? '—'} net worth across ${assets.length} assets. What would you like to look at?`;

  const [messages, setMessages]         = useState<AdvisorMessage[]>([
    { id: 'welcome', role: 'assistant', content: welcomeBody, timestamp: new Date().toISOString() },
  ]);
  const [input, setInput]               = useState('');
  const [streaming, setStreaming]       = useState(false);
  const [speaking, setSpeaking]         = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, 'pending' | 'approved' | 'dismissed'>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const audioRef  = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!streaming) inputRef.current?.focus();
  }, [streaming]);

  const buildContext = useCallback(() => {
    if (!portfolio) return null;
    return {
      netWorth:          portfolio.netWorth,
      totalAssets:       portfolio.totalAssets,
      totalLiabilities:  portfolio.totalLiabilities,
      liquidAssets:      portfolio.liquidAssets,
      allocation:        portfolio.allocationPct,
      monthChangePct:    portfolio.monthChangePct,
      yearChangePct:     portfolio.yearChangePct,
      userName:          profile?.name,
      country:           profile?.country,
      retirementAge:     profile?.retirementAge,
      retirementIncome:  profile?.retirementIncome,
      topAssets: assets.slice(0, 8).map((a) => ({
        name: a.name, class: a.class, value: a.value, currency: a.currency,
        costBasis: a.costBasis, unrealizedGain: a.unrealizedGain,
        institution: a.institution,
        metadata: {
          mortgageBalance: a.metadata?.mortgageBalance,
          mortgageExpiry:  a.metadata?.mortgageExpiry,
          mortgageRate:    a.metadata?.mortgageRate,
          contributionMonthly: a.metadata?.contributionMonthly,
        },
      })),
    };
  }, [portfolio, profile, assets]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const uId  = `u-${Date.now()}`;
    const aId  = `a-${Date.now() + 1}`;
    const userMsg: AdvisorMessage = { id: uId, role: 'user', content: trimmed, timestamp: new Date().toISOString() };
    const aMsg:    AdvisorMessage = { id: aId, role: 'assistant', content: '', timestamp: new Date().toISOString() };

    setMessages((prev) => [...prev, userMsg, aMsg]);
    setInput('');
    setStreaming(true);

    try {
      const historyForAPI = [...messages, userMsg]
        .filter((m) => m.id !== 'welcome')
        .slice(-14)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/advisor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForAPI, portfolioContext: buildContext(), voiceMode: voiceEnabled }),
      });

      if (!res.body) throw new Error('No stream');
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, content: full } : m));
      }

      // ElevenLabs voice — strip action blocks from spoken text
      if (voiceEnabled && full) {
        const spokenText = full.replace(/::ACTION::[\s\S]*?::END::/g, '').trim();
        if (spokenText) {
          try {
            setSpeaking(true);
            const vRes = await fetch('/api/voice', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: spokenText }),
            });
            if (vRes.ok) {
              const blob = await vRes.blob();
              const url  = URL.createObjectURL(blob);
              setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, audioUrl: url } : m));
              if (audioRef.current) audioRef.current.pause();
              const audio = playAudioUrl(url);
              audioRef.current = audio;
              audio.onended = () => setSpeaking(false);
            } else {
              setSpeaking(false);
            }
          } catch {
            setSpeaking(false);
          }
        }
      }
    } catch {
      setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, content: 'Something went wrong. Try again.' } : m));
    } finally {
      setStreaming(false);
    }
  }

  function handleApprove(block: ActionBlock) {
    setActionStates((prev) => ({ ...prev, [block.id]: 'approved' }));
    sendMessage(`I want to proceed with: "${block.title}". What are the exact next steps?`);
  }

  function handleDismiss(id: string) {
    setActionStates((prev) => ({ ...prev, [id]: 'dismissed' }));
  }

  function toggleVoice() {
    if (speaking) { audioRef.current?.pause(); setSpeaking(false); }
    setVoiceEnabled(!voiceEnabled);
  }

  const showSuggestions = messages.length <= 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg)' }}>

      {/* Header */}
      <div style={{
        padding: '12px 18px', borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-1)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: (streaming || speaking) ? 'rgba(255,255,255,0.08)' : 'var(--color-surface-2)',
          border: `1px solid ${(streaming || speaking) ? 'rgba(255,255,255,0.25)' : 'var(--color-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: 'var(--color-text-2)', flexShrink: 0,
          transition: 'all 0.3s ease',
        }}>
          ◷
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-1)', lineHeight: 1 }}>Clarity Advisor</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              background: streaming ? 'var(--color-neutral)' : speaking ? 'var(--color-positive)' : 'var(--color-positive)',
              display: 'inline-block',
            }} />
            {speaking ? 'Speaking…' : streaming ? 'Thinking…' : `${assets.length} assets · portfolio loaded`}
          </div>
        </div>

        {/* Voice toggle */}
        <button
          onClick={toggleVoice}
          title={voiceEnabled ? 'Voice on — tap to silence' : 'Voice off — tap to enable (ElevenLabs)'}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: voiceEnabled ? 'rgba(255,255,255,0.08)' : 'var(--color-surface-2)',
            border: `1px solid ${voiceEnabled ? 'rgba(255,255,255,0.22)' : 'var(--color-border)'}`,
            cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: voiceEnabled ? 'var(--color-text-1)' : 'var(--color-text-3)',
            transition: 'all 0.2s ease',
          }}
        >
          {speaking ? '■' : voiceEnabled ? '▶' : '◌'}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {messages.map((msg) => {
          const isUser   = msg.role === 'user';
          const segments = isUser ? null : splitContent(msg.content);

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
              {isUser ? (
                <div style={{
                  maxWidth: '80%',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '14px 14px 4px 14px',
                  padding: '10px 14px',
                  fontSize: 14, color: 'var(--color-text-1)',
                  lineHeight: 1.55, fontWeight: 500,
                }}>
                  {msg.content}
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  {(segments && segments.length > 0) ? (
                    segments.map((seg, i) => {
                      if (seg.type === 'text') {
                        const prose = seg.content.trim();
                        if (!prose) return null;
                        return (
                          <p key={i} style={{
                            fontSize: 15, color: 'var(--color-text-1)',
                            lineHeight: 1.72, margin: '0 0 8px 0', whiteSpace: 'pre-wrap',
                          }}>
                            {prose}
                          </p>
                        );
                      } else {
                        const block = parseActionBlock(seg.content);
                        if (!block) return null;
                        return (
                          <AgentActionCard
                            key={`${msg.id}-${i}`}
                            block={block}
                            state={actionStates[block.id] ?? 'pending'}
                            onApprove={handleApprove}
                            onDismiss={handleDismiss}
                          />
                        );
                      }
                    })
                  ) : (
                    <p style={{ fontSize: 15, color: 'var(--color-text-1)', lineHeight: 1.72, margin: 0 }}>
                      {msg.content || <ThinkingDots />}
                    </p>
                  )}
                  {msg.audioUrl && !streaming && (
                    <button
                      onClick={() => playAudioUrl(msg.audioUrl!)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 6, background: 'none', border: 'none',
                        color: 'var(--color-text-3)', cursor: 'pointer',
                        fontSize: 10, padding: 0, fontWeight: 600, letterSpacing: 0.4,
                      }}
                    >
                      ▶ PLAY AGAIN
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Suggested prompts */}
        {showSuggestions && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 1.0, fontWeight: 700, marginBottom: 10 }}>
              Things I can do for you
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {SUGGESTED.map((p) => (
                <button key={p.text} onClick={() => sendMessage(p.text)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', width: '100%', textAlign: 'left',
                  background: 'none', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--r-lg)', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)', flexShrink: 0, width: 14, textAlign: 'center' }}>{p.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-2)', fontWeight: 500 }}>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {voiceEnabled && messages.length > 1 && !streaming && !speaking && (
          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-3)', letterSpacing: 0.3 }}>
            Voice on · ElevenLabs · responses read aloud
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '10px 16px 14px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface-1)', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface-2)', borderRadius: 'var(--r-pill)',
          padding: '4px 4px 4px 18px',
          border: `1px solid ${streaming ? 'rgba(255,255,255,0.18)' : 'var(--color-border-md)'}`,
          transition: 'border-color 0.2s ease',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder={streaming ? 'Thinking…' : 'Ask anything about your portfolio…'}
            disabled={streaming}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--color-text-1)', fontFamily: 'inherit', height: 44 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            aria-label="Send"
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: (input.trim() && !streaming) ? 'var(--color-accent)' : 'var(--color-surface-3)',
              border: 'none', cursor: (input.trim() && !streaming) ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, color: (input.trim() && !streaming) ? '#09090E' : 'var(--color-text-3)',
              fontWeight: 700, transition: 'all 0.15s ease', flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-text-3)', marginTop: 8, letterSpacing: 0.2 }}>
          Clarity · Claude + ElevenLabs · Not financial advice
        </div>
      </div>
    </div>
  );
}
