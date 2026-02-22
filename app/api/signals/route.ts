import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SIGNAL_PROMPT = `You are a proactive wealth intelligence engine. Given a portfolio snapshot, generate 2-4 high-priority, actionable signals.

Each signal must:
- Reference specific numbers from the portfolio
- Have a concrete, calculable impact in €/£
- Be actionable within 3 taps
- Be ranked by urgency (critical > high > medium > low)

Return ONLY valid JSON array. No markdown. No preamble.

Schema per signal:
{
  "id": "unique-string",
  "type": "tax|risk|opportunity|deadline|rebalance|compliance",
  "urgency": "critical|high|medium|low",
  "title": "max 8 words",
  "body": "2-3 sentences specific to their numbers",
  "impact": "£/€ figure as string, e.g. 'Save €4,200'",
  "impactValue": number,
  "deadline": "ISO date or null",
  "actionLabel": "3-5 word CTA",
  "draftAction": {
    "title": "what we'll do",
    "description": "2 sentences",
    "impact": "specific figure",
    "steps": ["step1", "step2", "step3"],
    "requiresAuth": boolean
  }
}`;

export async function POST(req: NextRequest) {
  try {
    const { portfolio, assets, profile } = await req.json();

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: SIGNAL_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Portfolio: ${JSON.stringify({ portfolio, assets: assets?.slice(0, 10), profile }, null, 2)}\n\nGenerate signals. Current date: ${new Date().toISOString()}.`,
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const clean = raw.replace(/```json|```/g, '').trim();
    const signals = JSON.parse(clean);

    return NextResponse.json({ signals });
  } catch (err) {
    console.error('Signals API error:', err);
    return NextResponse.json({ error: 'Signal generation failed' }, { status: 500 });
  }
}
