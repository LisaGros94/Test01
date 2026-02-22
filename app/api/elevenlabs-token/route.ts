import { NextResponse } from 'next/server';

const AGENT_ID = 'agent_8401kj2pjq5afxh8qh2nzagqv61g';

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`,
      { headers: { 'xi-api-key': apiKey } },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('ElevenLabs token error:', res.status, text);
      return NextResponse.json({ error: 'Failed to get conversation token' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ token: data.token });
  } catch (err) {
    console.error('ElevenLabs token fetch failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
