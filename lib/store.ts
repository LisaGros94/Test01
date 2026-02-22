'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Asset,
  Signal,
  PortfolioSummary,
  UserProfile,
  ArchetypeProfile,
  AssetClass,
  Currency,
} from '@/types';

// ─── MOCK SEED DATA ──────────────────────────────────────────────────────────
const SEED_ASSETS: Asset[] = [
  {
    id: 'a1',
    name: 'Primary Residence — Munich',
    class: 'real_estate',
    value: 1_850_000,
    currency: 'EUR',
    source: 'manual',
    country: 'DE',
    acquired: '2019-06-15',
    costBasis: 1_420_000,
    lastUpdated: new Date().toISOString(),
    metadata: {
      address: 'Maxvorstadt, Munich',
      mortgageBalance: 680_000,
      mortgageRate: 1.85,
      mortgageExpiry: '2026-09-30',
      annualCosts: 18_400,
    },
  },
  {
    id: 'a2',
    name: 'MSCI World ETF (IB)',
    class: 'stocks',
    value: 420_000,
    currency: 'EUR',
    source: 'manual',
    country: 'DE',
    costBasis: 310_000,
    unrealizedGain: 110_000,
    lastUpdated: new Date().toISOString(),
    institution: 'Interactive Brokers',
    metadata: { ticker: 'IWDA', quantity: 1680 },
  },
  {
    id: 'a3',
    name: 'SIPP — Vanguard',
    class: 'pension',
    value: 185_000,
    currency: 'GBP',
    source: 'manual',
    country: 'GB',
    lastUpdated: new Date().toISOString(),
    institution: 'Vanguard',
    metadata: {
      pensionType: 'sipp',
      contributionMonthly: 2_500,
      projectedAt67: 890_000,
    },
  },
  {
    id: 'a4',
    name: 'Series A — FinTech Startup',
    class: 'private_equity',
    value: 380_000,
    currency: 'EUR',
    source: 'manual',
    country: 'DE',
    costBasis: 150_000,
    lastUpdated: new Date().toISOString(),
    metadata: { ownershipPct: 4.2, stage: 'Series A', lastValuationDate: '2024-11-01' },
  },
  {
    id: 'a5',
    name: 'Rolex Daytona 116500LN',
    class: 'watches',
    value: 24_500,
    currency: 'EUR',
    source: 'photo',
    lastUpdated: new Date().toISOString(),
    metadata: { brand: 'Rolex', reference: '116500LN', hasBox: true, hasPapers: true, condition: 'excellent' },
  },
  {
    id: 'a6',
    name: 'Porsche 911 GT3 Touring',
    class: 'cars',
    value: 138_000,
    currency: 'EUR',
    source: 'manual',
    country: 'DE',
    acquired: '2023-03-01',
    costBasis: 155_000,
    lastUpdated: new Date().toISOString(),
    metadata: { make: 'Porsche', model: '911 GT3 Touring', year: 2023, mileage: 14_200, annualInsurance: 4_800 },
  },
  {
    id: 'a7',
    name: 'Cash — ING DiBa',
    class: 'cash',
    value: 65_000,
    currency: 'EUR',
    source: 'tink',
    country: 'DE',
    lastUpdated: new Date().toISOString(),
    institution: 'ING DiBa',
  },
  {
    id: 'a8',
    name: 'Bitcoin',
    class: 'crypto',
    value: 48_000,
    currency: 'EUR',
    source: 'manual',
    costBasis: 22_000,
    unrealizedGain: 26_000,
    lastUpdated: new Date().toISOString(),
    metadata: { ticker: 'BTC', quantity: 0.52 },
  },
];

const SEED_SIGNALS: Signal[] = [
  {
    id: 's1',
    type: 'deadline',
    urgency: 'critical',
    title: 'Mortgage renewal in 47 days',
    body: 'Your Maxvorstadt property mortgage (€680k at 1.85%) expires Sep 30. Rates have moved—acting now could lock in a better deal.',
    impact: 'Save up to €23,400/yr',
    impactValue: 23_400,
    deadline: '2026-09-30',
    actionLabel: 'Compare rates',
    draftAction: {
      title: 'Refinancing analysis prepared',
      description: 'Based on current ECB rates and your LTV of 37%, you qualify for rates between 3.8%–4.2%. I\'ve modelled 3 scenarios over 10 years.',
      impact: 'Save €23,400/yr vs rolling onto SVR',
      steps: ['Review the 3 scenarios', 'Choose preferred term', 'I\'ll draft lender applications'],
      requiresAuth: false,
    },
    relatedAssetId: 'a1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 's2',
    type: 'tax',
    urgency: 'high',
    title: 'Tax-loss harvest opportunity',
    body: 'Your Porsche has fallen €17k below cost basis. Disposing before Dec 31 creates a €17k loss you can offset against your €26k Bitcoin gain.',
    impact: 'Save ~€4,760 in CGT',
    impactValue: 4_760,
    deadline: '2026-12-31',
    actionLabel: 'See the analysis',
    draftAction: {
      title: 'Harvest €17k loss on Porsche disposal',
      description: 'Sell the Porsche before Dec 31, realising a €17,000 loss. This offsets your Bitcoin unrealised gain, reducing your German CGT liability by ~€4,760 at the 28% rate.',
      impact: 'Save €4,760 this tax year',
      steps: ['Review disposal calculation', 'Confirm you want to sell', 'Connect with recommended broker'],
      requiresAuth: false,
    },
    relatedAssetId: 'a6',
    createdAt: new Date().toISOString(),
  },
  {
    id: 's3',
    type: 'opportunity',
    urgency: 'medium',
    title: 'Pension allowance: €34,600 unused',
    body: 'You\'ve contributed €25,400 of your £60,000 annual SIPP allowance. Topping up before April 5 reduces your income tax bill.',
    impact: 'Save up to £15,640 in income tax',
    impactValue: 15_640,
    deadline: '2027-04-05',
    actionLabel: 'Calculate top-up',
    draftAction: {
      title: 'Contribute £34,600 to your Vanguard SIPP',
      description: 'A £34,600 pension top-up (within your annual allowance) would attract 45% tax relief, costing you £19,030 net and adding £34,600 to your pension pot.',
      impact: 'Effective cost £19,030 for £34,600 of pension savings',
      steps: ['Confirm contribution amount', 'Initiate transfer from ING DiBa', 'HMRC will credit relief within 6 weeks'],
      requiresAuth: true,
    },
    relatedAssetId: 'a3',
    createdAt: new Date().toISOString(),
  },
  {
    id: 's4',
    type: 'risk',
    urgency: 'medium',
    title: 'Property concentration: 60% of net worth',
    body: 'Real estate represents 60% of your total assets. If Munich prices correct 10%, your net worth falls by €185k. Consider your liquidity runway.',
    impact: 'Concentration risk',
    impactValue: 0,
    actionLabel: 'Review allocation',
    relatedAssetId: 'a1',
    createdAt: new Date().toISOString(),
  },
];

// ─── STORE INTERFACE ─────────────────────────────────────────────────────────
interface ClarityStore {
  // Data
  assets: Asset[];
  signals: Signal[];
  portfolio: PortfolioSummary | null;
  profile: UserProfile | null;

  // UI State
  activeSignal: string | null;
  signalState: Record<string, 'signal' | 'action' | 'confirming' | 'done' | 'dismissed'>;
  voiceEnabled: boolean;

  // Actions
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  setSignals: (signals: Signal[]) => void;
  setSignalState: (id: string, state: 'signal' | 'action' | 'confirming' | 'done' | 'dismissed') => void;
  dismissSignal: (id: string) => void;

  setPortfolio: (portfolio: PortfolioSummary) => void;
  setProfile: (profile: UserProfile) => void;
  updateArchetype: (archetype: ArchetypeProfile) => void;

  setActiveSignal: (id: string | null) => void;
  setVoiceEnabled: (enabled: boolean) => void;

  // Computed
  computePortfolio: () => PortfolioSummary;
}

function computePortfolioFromAssets(assets: Asset[]): PortfolioSummary {
  const FX: Record<Currency, number> = { EUR: 1, GBP: 1.17, USD: 0.92, CHF: 1.04 };

  const toEur = (v: number, c: Currency) => v * FX[c];

  const allocationByClass: Record<AssetClass, number> = {
    cash: 0, stocks: 0, bonds: 0, crypto: 0,
    real_estate: 0, private_equity: 0, cars: 0,
    watches: 0, art: 0, commodities: 0, pension: 0,
  };

  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const a of assets) {
    const val = toEur(a.value, a.currency);
    allocationByClass[a.class] = (allocationByClass[a.class] || 0) + val;
    totalAssets += val;
    if (a.metadata?.mortgageBalance) totalLiabilities += toEur(a.metadata.mortgageBalance, a.currency);
    if (a.metadata?.financeBalance) totalLiabilities += toEur(a.metadata.financeBalance, a.currency);
  }

  const netWorth = totalAssets - totalLiabilities;
  const liquidClasses: AssetClass[] = ['cash', 'stocks', 'bonds', 'crypto'];
  const liquidAssets = liquidClasses.reduce((s, c) => s + (allocationByClass[c] || 0), 0);

  const allocationPct: Record<AssetClass, number> = {} as Record<AssetClass, number>;
  for (const [k, v] of Object.entries(allocationByClass)) {
    allocationPct[k as AssetClass] = totalAssets > 0 ? (v / totalAssets) * 100 : 0;
  }

  // Simulated sparkline — last 12 months (mock growth)
  const sparkline = Array.from({ length: 12 }, (_, i) =>
    Math.round(netWorth * (0.88 + i * 0.01 + (Math.random() - 0.5) * 0.01))
  );

  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    liquidAssets,
    illiquidAssets: totalAssets - liquidAssets,
    monthChange: netWorth * 0.021,
    monthChangePct: 2.1,
    yearChange: netWorth * 0.118,
    yearChangePct: 11.8,
    allocationByClass,
    allocationPct,
    sparkline,
    currency: 'EUR',
    lastUpdated: new Date().toISOString(),
  };
}

// ─── ZUSTAND STORE ───────────────────────────────────────────────────────────
export const useStore = create<ClarityStore>()(
  persist(
    (set, get) => ({
      assets: SEED_ASSETS,
      signals: SEED_SIGNALS,
      portfolio: null,
      profile: {
        id: 'user-1',
        name: 'Alexander',
        country: 'DE',
        baseCurrency: 'EUR',
        retirementAge: 58,
        retirementIncome: 120_000,
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
        archetype: {
          primary: 'optimizer',
          confidence: 0.72,
          signals: {
            sessionFrequency: 4.2,
            avgSessionLength: 180,
            detailTaps: 12,
            goalCheckFrequency: 3,
            actionCompletionRate: 0.68,
            loginAfterDrops: false,
          },
        },
      },
      activeSignal: null,
      signalState: {},
      voiceEnabled: false,

      setAssets: (assets) => set({ assets }),
      addAsset: (asset) => set((s) => ({ assets: [...s.assets, asset] })),
      updateAsset: (id, updates) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)) })),
      deleteAsset: (id) => set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),

      setSignals: (signals) => set({ signals }),
      setSignalState: (id, state) =>
        set((s) => ({ signalState: { ...s.signalState, [id]: state } })),
      dismissSignal: (id) =>
        set((s) => ({ signalState: { ...s.signalState, [id]: 'dismissed' } })),

      setPortfolio: (portfolio) => set({ portfolio }),
      setProfile: (profile) => set({ profile }),
      updateArchetype: (archetype) =>
        set((s) => ({
          profile: s.profile ? { ...s.profile, archetype } : s.profile,
        })),

      setActiveSignal: (id) => set({ activeSignal: id }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),

      computePortfolio: () => {
        const p = computePortfolioFromAssets(get().assets);
        set({ portfolio: p });
        return p;
      },
    }),
    {
      name: 'clarity-store',
      partialize: (s) => ({
        assets: s.assets,
        signals: s.signals,
        profile: s.profile,
        signalState: s.signalState,
        voiceEnabled: s.voiceEnabled,
      }),
    }
  )
);
