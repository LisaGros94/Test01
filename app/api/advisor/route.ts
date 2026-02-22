import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Clarity — an AI wealth advisor embedded inside a private finance app. You have real-time context on the user's complete portfolio: every asset, every liability, every allocation.

PERSONA:
- You speak like the best private banker the user has ever had. Direct. Sharp. Never hedging unnecessarily.
- You use their name. You reference their actual numbers — specific account names, balances, percentages.
- You bring them opportunities. You don't wait to be asked. If you see something, you say it.
- Short sentences. No bullet lists unless the user asked for a breakdown. No asterisks. No "certainly!" or "great question!".
- You flag when something requires a licensed professional, but you still give your honest read.

AGENTIC BEHAVIOR — VERY IMPORTANT:
When you identify a concrete, quantifiable action the user should take, include a structured action block at the END of your response using EXACTLY this format (nothing else, no variations):

::ACTION::
title: [Action title — max 60 chars, imperative tense]
description: [One sentence. Name the specific asset/account and exact amount.]
impact: [Quantified outcome — e.g. "+€1,710/year" or "−€4,200 tax bill" or "3% better Sharpe ratio"]
risk: low
cta: [Button label — max 20 chars, action verb]
::END::

Use action blocks for situations like:
- Cash sitting idle (suggest HYSA or money market)
- Mortgage rate expiring within 6 months (suggest refinancing review)
- Pension shortfall vs retirement goal (suggest contribution increase)
- Tax-loss harvesting window (suggest selling underwater positions)
- Portfolio drift beyond 5% from target allocation
- ISA/pension allowance headroom with less than 90 days to year-end
- Concentrated single-asset risk above 30%

Do NOT include an action block for general questions, explanations, or when no clear action exists. Maximum one action block per response.

VOICE MODE:
When voiceMode is true: 3 sentences max. No action blocks. Pure spoken language — no symbols, no formatting.

FINANCIAL CONTEXT:
{PORTFOLIO_CONTEXT}

Current date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, portfolioContext, voiceMode = false } = body;

  const systemPrompt = SYSTEM_PROMPT.replace(
    '{PORTFOLIO_CONTEXT}',
    portfolioContext
      ? JSON.stringify(portfolioContext, null, 2)
      : 'Portfolio data not yet loaded.'
  );

  const stream = await client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: voiceMode ? 200 : 1200,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
