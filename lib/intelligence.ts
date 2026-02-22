import type { Asset, PortfolioSummary } from '@/types';

export type InsightCategory = 'concentration' | 'liquidity' | 'tax' | 'rates' | 'cash_drag';

export interface Insight {
  id:           string;
  severity:     1 | 2 | 3 | 4 | 5;
  category:     InsightCategory;
  summary:      string;      // declarative, authoritative statement
  explanation:  string;      // why it matters — 1-2 sentences
  action:       string;      // exact next step
  cta:          string;      // button label
  simulatorKey?: 'mortgage_refi';
  data?:        Record<string, number | string>;
}

// Estimated lifestyle burn for this persona tier (€1m–€5m NW)
const MONTHLY_BURN_ESTIMATE = 7_800;

export function computeInsights(
  assets: Asset[],
  portfolio: PortfolioSummary,
): { insights: Insight[]; monthlyBurn: number; runwayMonths: number } {
  const monthlyBurn   = MONTHLY_BURN_ESTIMATE;
  const runwayMonths  = Math.floor(portfolio.liquidAssets / monthlyBurn);
  const candidates: Insight[] = [];

  // ── 1. Concentration ──────────────────────────────────────────────
  const byValue = [...assets].sort((a, b) => b.value - a.value);
  const largest = byValue[0];
  if (largest && portfolio.totalAssets > 0) {
    const pct = (largest.value / portfolio.totalAssets) * 100;
    if (pct >= 35) {
      const assetLabel = largest.name.split('—')[0].split('·')[0].trim();
      candidates.push({
        id:          'concentration',
        severity:    pct >= 50 ? 4 : 3,
        category:    'concentration',
        summary:     `${assetLabel} represents ${pct.toFixed(0)}% of total assets.`,
        explanation: `Concentration above 40% creates correlated downside risk. A 20% correction in ${largest.class === 'real_estate' ? 'European property' : 'this asset class'} would reduce net worth by €${(largest.value * 0.2 / 1000).toFixed(0)}k — unhedged.`,
        action:      'Discuss a gradual diversification strategy. No forced sale required.',
        cta:         'Review with advisor',
      });
    }
  }

  // ── 2. Mortgage / rate sensitivity ───────────────────────────────
  for (const asset of assets) {
    const { mortgageBalance, mortgageExpiry, mortgageRate } = asset.metadata ?? {};
    if (!mortgageBalance || !mortgageExpiry) continue;

    const expiry     = new Date(mortgageExpiry);
    const now        = new Date();
    const monthsDiff = (now.getTime() - expiry.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const curRate    = mortgageRate ?? 2.3;
    const varRate    = 4.8;
    const fixedRate  = 4.0;
    const annualSaving = mortgageBalance * (varRate - fixedRate) / 100;
    const assetLabel = asset.name.split('—')[0].split('·')[0].trim();

    if (monthsDiff > 0) {
      candidates.push({
        id:           'mortgage_expired',
        severity:     4,
        category:     'rates',
        summary:      `${assetLabel} mortgage has been on variable rate for ${Math.floor(monthsDiff)} months.`,
        explanation:  `The ${curRate}% fixed rate expired ${Math.floor(monthsDiff)} months ago. At current variable of ${varRate}%, annual interest is €${Math.round(mortgageBalance * varRate / 100).toLocaleString('de-DE')}. Locking in ${fixedRate}% fixed saves €${Math.round(annualSaving).toLocaleString('de-DE')}/year.`,
        action:       'Initiate refinancing now. Lenders require 4–6 weeks to process.',
        cta:          'See analysis',
        simulatorKey: 'mortgage_refi',
        data: { balance: mortgageBalance, varRate, fixedRate, annualSaving, monthsOverdue: Math.floor(monthsDiff), assetName: assetLabel },
      });
    } else if (-monthsDiff <= 6) {
      candidates.push({
        id:           'mortgage_expiring',
        severity:     3,
        category:     'rates',
        summary:      `${assetLabel} mortgage expires in ${Math.ceil(-monthsDiff)} months.`,
        explanation:  `At expiry, the rate reverts to standard variable (~${varRate}%). Beginning negotiations now secures current fixed-rate offers before they move.`,
        action:       'Contact lender this month to lock in a competitive fixed rate.',
        cta:          'See analysis',
        simulatorKey: 'mortgage_refi',
        data: { balance: mortgageBalance, varRate, fixedRate, annualSaving, assetName: assetLabel },
      });
    }
  }

  // ── 3. Liquidity ─────────────────────────────────────────────────
  if (runwayMonths < 12) {
    candidates.push({
      id:          'liquidity',
      severity:    runwayMonths < 6 ? 4 : 2,
      category:    'liquidity',
      summary:     `Liquid runway is ${runwayMonths} months at estimated burn.`,
      explanation: `€${(portfolio.liquidAssets / 1000).toFixed(0)}k liquid against ~€${(monthlyBurn / 1000).toFixed(1)}k/month. A prolonged income gap could require selling illiquid assets at unfavourable prices.`,
      action:      'Build liquid reserves to 12+ months minimum before the next asset purchase.',
      cta:         'Review liquidity',
    });
  }

  // ── 4. Cash drag ─────────────────────────────────────────────────
  const cashTotal = assets.filter((a) => a.class === 'cash').reduce((s, a) => s + a.value, 0);
  if (cashTotal > 15_000) {
    const annualOpCost = Math.round(cashTotal * 0.038);
    candidates.push({
      id:          'cash_drag',
      severity:    2,
      category:    'cash_drag',
      summary:     `€${(cashTotal / 1000).toFixed(0)}k in current account earning 0%.`,
      explanation: `A high-yield savings account at 3.8% AER generates €${annualOpCost.toLocaleString('de-DE')}/year with instant access. No lock-in, no risk.`,
      action:      'Transfer to HYSA. Marcus, Monzo Flex, or Trade Republic qualify.',
      cta:         'Optimise cash',
    });
  }

  // ── 5. Tax-loss harvesting ────────────────────────────────────────
  const lossAssets = assets.filter(
    (a) => (a.unrealizedGain ?? 0) < -5_000 && ['crypto', 'stocks'].includes(a.class)
  );
  if (lossAssets.length > 0) {
    const totalLoss    = lossAssets.reduce((s, a) => s + (a.unrealizedGain ?? 0), 0);
    const taxSaving    = Math.round(Math.abs(totalLoss) * 0.26);
    candidates.push({
      id:          'tax_harvest',
      severity:    3,
      category:    'tax',
      summary:     `€${(Math.abs(totalLoss) / 1000).toFixed(0)}k in unrealised losses eligible for harvesting.`,
      explanation: `Crystallising before 31 December offsets realised gains. Estimated tax saving: €${taxSaving.toLocaleString('de-DE')} at 26% effective rate.`,
      action:      'Sell positions before year-end. Repurchase after 30-day wash window.',
      cta:         'Review positions',
    });
  }

  const insights = candidates.sort((a, b) => b.severity - a.severity).slice(0, 3);
  return { insights, monthlyBurn, runwayMonths };
}

// Generates the top-line briefing sentence
export function briefingLine(insights: Insight[]): string {
  if (insights.length === 0) return 'Your financial position is in good shape.';
  const highest = insights[0].severity;
  const n       = insights.length;
  if (highest >= 4) return `${n === 1 ? 'One area requires' : `${n} areas require`} immediate attention.`;
  if (highest >= 3) return `Your structure is stable. ${n === 1 ? 'One area needs' : `${n} areas need`} review.`;
  return `Your finances are in good shape. ${n} item${n > 1 ? 's' : ''} to monitor.`;
}
