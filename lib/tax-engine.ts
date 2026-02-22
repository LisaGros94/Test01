import type { Asset, TaxAnalysis, TaxDeadline, TaxOptimization } from '@/types';

// ─── TAX ENGINE ───────────────────────────────────────────────────────────────
// Real-time tax simulation. Jurisdiction-aware. Runs client-side for privacy.

interface TaxConfig {
  country: string;
  cgtRate: number;        // Capital Gains Tax rate
  incomeTaxRate: number;
  pensionAllowance: number;
  isaAllowance: number;
  annualCgtExemption: number;
  dividendAllowance?: number;
}

const TAX_CONFIGS: Record<string, TaxConfig> = {
  GB: {
    country: 'United Kingdom',
    cgtRate: 0.24,         // higher rate 2024/25
    incomeTaxRate: 0.45,   // additional rate
    pensionAllowance: 60_000,
    isaAllowance: 20_000,
    annualCgtExemption: 3_000,
    dividendAllowance: 500,
  },
  DE: {
    country: 'Germany',
    cgtRate: 0.2781,       // 25% + soli + church (avg)
    incomeTaxRate: 0.42,
    pensionAllowance: 27_566,  // 2024 max deductible
    isaAllowance: 0,           // no ISA equivalent
    annualCgtExemption: 1_000, // Sparerpauschbetrag
  },
  CH: {
    country: 'Switzerland',
    cgtRate: 0,            // no CGT on private assets
    incomeTaxRate: 0.22,
    pensionAllowance: 7_056,  // 3a pillar 2024
    isaAllowance: 0,
    annualCgtExemption: 999_999,
  },
  US: {
    country: 'United States',
    cgtRate: 0.238,        // 20% + NIIT 3.8%
    incomeTaxRate: 0.37,
    pensionAllowance: 23_000, // 401k 2024
    isaAllowance: 7_000,      // Roth IRA
    annualCgtExemption: 0,
  },
};

function getConfig(country: string): TaxConfig {
  return TAX_CONFIGS[country] ?? TAX_CONFIGS.DE;
}

// ─── MAIN ANALYSIS ───────────────────────────────────────────────────────────
export function computeTaxAnalysis(assets: Asset[], country: string = 'DE'): TaxAnalysis {
  const config = getConfig(country);
  const now = new Date();
  const taxYear = `${now.getFullYear()}/${now.getFullYear() + 1}`;

  // Unrealized gains
  let unrealizedGainsTotal = 0;
  let realizedGainsTotal = 0;
  let pensionContributed = 0;
  let isaContributed = 0;

  for (const asset of assets) {
    if (asset.unrealizedGain && asset.unrealizedGain > 0) {
      unrealizedGainsTotal += asset.unrealizedGain;
    }
    if (asset.class === 'pension' && asset.metadata?.contributionMonthly) {
      pensionContributed += asset.metadata.contributionMonthly * 12;
    }
    if (asset.class === 'stocks' && asset.metadata?.pensionType === 'isa') {
      isaContributed += asset.value * 0.1; // estimate
    }
  }

  // Estimated tax liability on unrealized gains (if sold today)
  const taxableGains = Math.max(0, unrealizedGainsTotal - config.annualCgtExemption);
  const taxLiabilityEstimate = taxableGains * config.cgtRate;

  // Tax-loss harvesting — find assets below cost basis
  const lossAssets = assets.filter(
    (a) => a.costBasis && a.value < a.costBasis && a.class !== 'pension' && a.class !== 'real_estate'
  );
  const totalLosses = lossAssets.reduce((s, a) => s + (a.costBasis! - a.value), 0);
  const harvestSaving = Math.min(totalLosses, unrealizedGainsTotal) * config.cgtRate;

  const pensionHeadroom = Math.max(0, config.pensionAllowance - pensionContributed);
  const isaHeadroom = Math.max(0, config.isaAllowance - isaContributed);

  // Deadlines
  const deadlines: TaxDeadline[] = [];
  const yr = now.getFullYear();

  if (country === 'GB') {
    deadlines.push(
      { label: 'ISA allowance deadline', date: `${yr + 1}-04-05`, amount: isaHeadroom, actionRequired: 'Top up ISA before tax year end' },
      { label: 'SIPP contribution deadline', date: `${yr + 1}-04-05`, amount: pensionHeadroom, actionRequired: 'Maximise pension contribution' },
      { label: 'Self-assessment filing', date: `${yr + 1}-01-31`, actionRequired: 'File self-assessment tax return' },
    );
  } else if (country === 'DE') {
    deadlines.push(
      { label: 'Einkommensteuererklärung', date: `${yr + 1}-07-31`, actionRequired: 'File income tax return' },
      { label: 'Freistellungsauftrag review', date: `${yr}-12-31`, amount: 1_000, actionRequired: 'Review Sparerpauschbetrag allocation across banks' },
      { label: 'Verlustverrechnung', date: `${yr}-12-31`, actionRequired: 'Offset capital losses before year-end' },
    );
  }

  // Optimizations
  const optimizations: TaxOptimization[] = [];

  if (harvestSaving > 500) {
    optimizations.push({
      title: 'Tax-loss harvesting',
      saving: Math.round(harvestSaving),
      description: `Disposing of loss-making assets before Dec 31 offsets your €${Math.round(unrealizedGainsTotal / 1000)}k gain, saving ~€${Math.round(harvestSaving / 1000)}k.`,
      difficulty: 'medium',
    });
  }

  if (pensionHeadroom > 5_000) {
    const pensionSaving = pensionHeadroom * config.incomeTaxRate;
    optimizations.push({
      title: country === 'GB' ? 'Max pension (SIPP)' : 'Pension contribution (§10)',
      saving: Math.round(pensionSaving),
      description: `Contributing €${Math.round(pensionHeadroom / 1000)}k more to your pension gets ${Math.round(config.incomeTaxRate * 100)}% tax relief.`,
      difficulty: 'easy',
    });
  }

  if (isaHeadroom > 1_000 && country === 'GB') {
    optimizations.push({
      title: 'Fill ISA allowance',
      saving: Math.round(isaHeadroom * 0.08 * config.cgtRate), // ~8% return, CGT saved
      description: `£${Math.round(isaHeadroom / 1000)}k of your ISA allowance remains. Future growth inside the ISA is completely tax-free.`,
      difficulty: 'easy',
    });
  }

  if (unrealizedGainsTotal > 100_000 && country !== 'CH') {
    optimizations.push({
      title: 'Bed-and-ISA / Bed-and-SIPP',
      saving: Math.round(unrealizedGainsTotal * config.cgtRate * 0.4),
      description: 'Systematically realise gains within your annual exemption and reinvest inside a tax-efficient wrapper over multiple years.',
      difficulty: 'complex',
    });
  }

  return {
    jurisdiction: config.country,
    taxYear,
    unrealizedGainsTotal: Math.round(unrealizedGainsTotal),
    realizedGainsTotal: Math.round(realizedGainsTotal),
    taxLiabilityEstimate: Math.round(taxLiabilityEstimate),
    taxLossHarvestingOpportunity: Math.round(harvestSaving),
    pensionHeadroom: Math.round(pensionHeadroom),
    isaHeadroom: Math.round(isaHeadroom),
    deadlines,
    optimizations,
  };
}

// ─── WHAT-IF SIMULATOR ────────────────────────────────────────────────────────
export function simulateSale(
  asset: Asset,
  country: string = 'DE'
): { taxDue: number; netProceeds: number; effectiveRate: number } {
  const config = getConfig(country);
  const gain = Math.max(0, asset.value - (asset.costBasis ?? asset.value));
  const taxableGain = Math.max(0, gain - config.annualCgtExemption);
  const taxDue = taxableGain * config.cgtRate;
  return {
    taxDue: Math.round(taxDue),
    netProceeds: Math.round(asset.value - taxDue),
    effectiveRate: gain > 0 ? taxDue / gain : 0,
  };
}
