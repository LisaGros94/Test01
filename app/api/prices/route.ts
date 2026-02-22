import { NextRequest, NextResponse } from 'next/server';

// Ticker → CoinGecko coin ID
const CRYPTO_IDS: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  SOL:  'solana',
  BNB:  'binancecoin',
  USDC: 'usd-coin',
  XRP:  'ripple',
};

// For European ETFs / stocks: try exchange suffixes in order
const EU_SUFFIXES = ['.AS', '.DE', '.MI', '.PA', '.L'];

async function fetchCryptoPrices(tickers: string[]): Promise<Record<string, number | null>> {
  const ids = tickers.map((t) => CRYPTO_IDS[t]).join(',');
  const prices: Record<string, number | null> = {};

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();

    for (const ticker of tickers) {
      const coinId = CRYPTO_IDS[ticker];
      prices[ticker] = data[coinId]?.eur ?? null;
    }
  } catch (err) {
    console.error('CoinGecko fetch failed:', err);
    for (const t of tickers) prices[t] = null;
  }

  return prices;
}

async function fetchYahooPrice(ticker: string): Promise<number | null> {
  // If already has exchange suffix, use as-is
  const symbols = ticker.includes('.')
    ? [ticker]
    : EU_SUFFIXES.map((s) => ticker + s);

  for (const symbol of symbols) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } },
      );
      if (!res.ok) continue;
      const data = await res.json();
      const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price) return price;
    } catch {
      continue;
    }
  }

  // Last resort: try NYSE/NASDAQ (no suffix)
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } },
    );
    if (res.ok) {
      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        // Convert USD → EUR if needed
        const price = meta.regularMarketPrice;
        const currency: string = meta.currency ?? 'USD';
        if (currency === 'USD') return Math.round(price * 0.92 * 100) / 100;
        return price;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

// GET /api/prices?tickers=BTC,IWDA,ETH
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('tickers') ?? '';
  const tickers = raw.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);

  if (!tickers.length) {
    return NextResponse.json({});
  }

  const cryptoTickers = tickers.filter((t) => CRYPTO_IDS[t]);
  const stockTickers  = tickers.filter((t) => !CRYPTO_IDS[t]);

  const prices: Record<string, number | null> = {};

  // Fetch in parallel
  const [cryptoPrices, ...stockPrices] = await Promise.all([
    cryptoTickers.length ? fetchCryptoPrices(cryptoTickers) : Promise.resolve({}),
    ...stockTickers.map((t) => fetchYahooPrice(t).then((p) => ({ ticker: t, price: p }))),
  ]);

  Object.assign(prices, cryptoPrices);
  for (const { ticker, price } of stockPrices as { ticker: string; price: number | null }[]) {
    prices[ticker] = price;
  }

  return NextResponse.json(prices, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
