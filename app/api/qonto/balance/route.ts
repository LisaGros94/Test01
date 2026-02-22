import { NextResponse } from 'next/server';

// Qonto credentials — set these in Vercel env vars:
//   QONTO_LOGIN       → from Organization Settings → Integrations (API)
//   QONTO_SECRET_KEY  → from Organization Settings → Integrations (API)
//   QONTO_SLUG        → your org slug, visible in Qonto URL (e.g. "acme-corp-1111")

export async function GET() {
  const login     = process.env.QONTO_LOGIN;
  const secretKey = process.env.QONTO_SECRET_KEY;
  const slug      = process.env.QONTO_SLUG;

  if (!login || !secretKey || !slug) {
    return NextResponse.json(
      { error: 'Qonto not configured', configured: false },
      { status: 200 }, // 200 so client can check `configured` flag
    );
  }

  try {
    const res = await fetch(
      `https://thirdparty.qonto.com/v2/organizations/${slug}`,
      {
        headers: {
          Authorization: `${login}:${secretKey}`,
          Accept: 'application/json',
        },
        next: { revalidate: 300 },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('Qonto API error:', res.status, text);
      return NextResponse.json({ error: 'Qonto API error', configured: true }, { status: 502 });
    }

    const data = await res.json();
    const org  = data.organization;

    // bank_accounts is an array; sum all EUR balances
    const accounts: { balance_cents: number; balance_currency: string; name: string; iban: string }[] =
      org.bank_accounts ?? [];

    const totalBalanceEur = accounts
      .filter((a) => a.balance_currency === 'EUR')
      .reduce((sum, a) => sum + a.balance_cents / 100, 0);

    return NextResponse.json({
      configured: true,
      totalBalanceEur,
      accounts: accounts.map((a) => ({
        name: a.name,
        iban: a.iban,
        balanceEur: a.balance_currency === 'EUR' ? a.balance_cents / 100 : null,
        currency: a.balance_currency,
      })),
      orgName: org.legal_name ?? org.name,
    });
  } catch (err) {
    console.error('Qonto fetch failed:', err);
    return NextResponse.json({ error: 'Network error', configured: true }, { status: 500 });
  }
}
