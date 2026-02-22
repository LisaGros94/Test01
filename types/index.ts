// ─── ASSET CLASSES ────────────────────────────────────────────────────────────
export type AssetClass =
  | 'cash'
  | 'stocks'
  | 'bonds'
  | 'crypto'
  | 'real_estate'
  | 'private_equity'
  | 'cars'
  | 'watches'
  | 'art'
  | 'commodities'
  | 'pension';

export type DataSource = 'manual' | 'photo' | 'tink' | 'document_ai';
export type Currency = 'EUR' | 'GBP' | 'USD' | 'CHF';

// ─── ASSET ───────────────────────────────────────────────────────────────────
export interface Asset {
  id: string;
  name: string;
  class: AssetClass;
  value: number;          // current value in base currency
  currency: Currency;
  source: DataSource;
  country?: string;       // jurisdiction
  institution?: string;   // bank, broker, fund name
  acquired?: string;      // ISO date
  costBasis?: number;     // for CGT/gain calculation
  unrealizedGain?: number;
  metadata?: AssetMetadata;
  linkedDebt?: string;    // asset id of associated liability
  lastUpdated: string;    // ISO
  notes?: string;
}

export interface AssetMetadata {
  // Real estate
  address?: string;
  postcode?: string;
  bedrooms?: number;
  rentalIncome?: number;
  mortgageBalance?: number;
  mortgageRate?: number;
  mortgageExpiry?: string;
  annualCosts?: number;   // insurance, service charge, etc.

  // Vehicles
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  plateNumber?: string;
  financeBalance?: number;
  financeExpiry?: string;
  annualInsurance?: number;

  // Watches / collectibles
  brand?: string;
  reference?: string;
  hasBox?: boolean;
  hasPapers?: boolean;
  condition?: 'mint' | 'excellent' | 'good' | 'fair';

  // Stocks / funds
  ticker?: string;
  quantity?: number;
  pricePerUnit?: number;
  isin?: string;

  // Pension / retirement
  provider?: string;
  pensionType?: 'sipp' | 'workplace' | 'db' | 'isa' | 'pea' | '401k';
  contributionMonthly?: number;
  projectedAt67?: number;

  // Business / PE
  entity?: string;
  ownershipPct?: number;
  lastValuationDate?: string;
  stage?: string;

  // Art
  artist?: string;
  title?: string;
  medium?: string;
  certificateOfAuthenticity?: boolean;
}

// ─── SIGNAL / ACTION CARD ────────────────────────────────────────────────────
export type SignalType = 'tax' | 'risk' | 'opportunity' | 'deadline' | 'rebalance' | 'compliance';
export type SignalUrgency = 'critical' | 'high' | 'medium' | 'low';
export type SignalState = 'signal' | 'action' | 'confirming' | 'done' | 'dismissed';

export interface Signal {
  id: string;
  type: SignalType;
  urgency: SignalUrgency;
  title: string;
  body: string;
  impact?: string;       // e.g. "Save €4,200"
  impactValue?: number;  // numeric value for sorting
  deadline?: string;     // ISO date
  actionLabel: string;   // "Review now" / "Approve" / "Explore"
  actionPayload?: Record<string, unknown>;
  relatedAssetId?: string;
  draftAction?: DraftAction;
  createdAt: string;
  expiresAt?: string;
}

export interface DraftAction {
  title: string;         // "Pension top-up of €15,000"
  description: string;   // 2-3 sentence explanation
  impact: string;        // specific £/€ figure
  steps: string[];       // what will happen on confirm
  requiresAuth: boolean; // whether we need user to auth to execute
}

// ─── ARCHETYPE ───────────────────────────────────────────────────────────────
export type Archetype =
  | 'optimizer'       // checks daily, wants numbers, IRR etc.
  | 'anxious_saver'   // logs in after drops, needs reassurance
  | 'delegator'       // acts on push, hates complexity
  | 'curious_learner' // taps "why?" on everything
  | 'goal_seeker';    // goal-framed, tracks progress %

export interface ArchetypeProfile {
  primary: Archetype;
  confidence: number;   // 0–1
  signals: {
    sessionFrequency: number;    // sessions/week
    avgSessionLength: number;    // seconds
    detailTaps: number;          // how often they tap "why?"
    goalCheckFrequency: number;  // how often they view goals
    actionCompletionRate: number;// % of action cards completed
    loginAfterDrops: boolean;
  };
}

// ─── PORTFOLIO SUMMARY ───────────────────────────────────────────────────────
export interface PortfolioSummary {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidAssets: number;         // cash + public markets
  illiquidAssets: number;       // RE, PE, collectibles
  monthChange: number;          // absolute
  monthChangePct: number;       // %
  yearChange: number;
  yearChangePct: number;
  allocationByClass: Record<AssetClass, number>;  // values
  allocationPct: Record<AssetClass, number>;      // percentages
  sparkline: number[];          // last 12 months net worth
  currency: Currency;
  lastUpdated: string;
}

// ─── TAX ANALYSIS ────────────────────────────────────────────────────────────
export interface TaxAnalysis {
  jurisdiction: string;
  taxYear: string;
  unrealizedGainsTotal: number;
  realizedGainsTotal: number;
  taxLiabilityEstimate: number;
  taxLossHarvestingOpportunity: number;
  pensionHeadroom: number;
  isaHeadroom: number;
  deadlines: TaxDeadline[];
  optimizations: TaxOptimization[];
}

export interface TaxDeadline {
  label: string;
  date: string;
  amount?: number;
  actionRequired: string;
}

export interface TaxOptimization {
  title: string;
  saving: number;
  description: string;
  difficulty: 'easy' | 'medium' | 'complex';
}

// ─── AI ADVISOR ──────────────────────────────────────────────────────────────
export interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioUrl?: string;
}

// ─── USER PROFILE ────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  country: string;
  baseCurrency: Currency;
  retirementAge: number;
  retirementIncome: number;
  archetype: ArchetypeProfile;
  onboardingComplete: boolean;
  createdAt: string;
}
