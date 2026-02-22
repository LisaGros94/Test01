import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VISION_PROMPT = `You are a financial asset identification engine. Analyse this image and extract structured data.

Identify the asset type and extract all visible information. Return ONLY valid JSON — no markdown, no preamble.

Schema:
{
  "detected": true|false,
  "class": "cash|stocks|bonds|crypto|real_estate|private_equity|cars|watches|art|commodities|pension",
  "confidence": 0.0-1.0,
  "name": "descriptive asset name",
  "estimatedValue": number or null,
  "currency": "EUR|GBP|USD|CHF",
  "metadata": {
    // watches: brand, reference, hasBox, hasPapers, condition
    // cars: make, model, year, plateNumber
    // real_estate: address, type (apartment/house/commercial)
    // stocks/bonds: ticker, isin, quantity, pricePerUnit
    // documents: documentType, institution, amount, date, expiryDate
  },
  "notes": "any additional observations"
}

For documents (bank statements, pension letters, insurance policies, share certificates):
- Extract the institution name, account number (masked), balance/value, and date.
- Flag if it looks like a tax document, contract, or insurance policy.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = (file.type || 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp';

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: VISION_PROMPT },
          ],
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Vision API error:', err);
    return NextResponse.json({ error: 'Image analysis failed' }, { status: 500 });
  }
}
