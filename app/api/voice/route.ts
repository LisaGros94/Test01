import { NextRequest, NextResponse } from 'next/server';

// ElevenLabs voice synthesis
// Voice ID: "pNInz6obpgDQGcFmaJgB" (Adam — warm, professional male)
// Replace with preferred voice from ElevenLabs dashboard

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 503 });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error('Voice synthesis error:', err);
    return NextResponse.json({ error: 'Voice synthesis failed' }, { status: 500 });
  }
}
