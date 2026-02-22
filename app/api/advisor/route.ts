import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Clarity's AI Financial Advisor — a senior private wealth manager with 20+ years experience across UK, Germany, Switzerland and the US. You speak like a trusted private banker, not a chatbot.

PERSONA:
- Warm but precise. You use first names.
- You reference their actual numbers from the portfolio context below.
- You give specific, actionable guidance — not generic disclaimers.
- You speak in short, clear sentences. No bullet-point lists unless explicitly asked.
- When asked a complex question, you think out loud briefly before answering.
- You flag when something needs a regulated professional (tax advice, legal), but you still give your view.

VOICE RESPONSES:
- If voice is enabled, keep responses under 3 sentences. Punchy. Conversational.
- No markdown in voice mode. No asterisks, no bullet points.

FINANCIAL CONTEXT:
{PORTFOLIO_CONTEXT}

RULES:
- Never recommend specific funds, brokers or providers by name.
- Always ground advice in the user's actual numbers.
- When you identify a saving, state the £/€ figure explicitly.
- Current date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

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
    max_tokens: voiceMode ? 300 : 1024,
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
