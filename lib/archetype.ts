import type { Archetype, ArchetypeProfile } from '@/types';

// ─── ARCHETYPE ENGINE ─────────────────────────────────────────────────────────
// Continuously inferred from behavioral signals — never asked directly.

export function inferArchetype(signals: ArchetypeProfile['signals']): Archetype {
  const scores: Record<Archetype, number> = {
    optimizer: 0,
    anxious_saver: 0,
    delegator: 0,
    curious_learner: 0,
    goal_seeker: 0,
  };

  // High session frequency + long sessions + many detail taps → Optimizer
  if (signals.sessionFrequency > 5) scores.optimizer += 2;
  if (signals.avgSessionLength > 240) scores.optimizer += 1;
  if (signals.detailTaps > 10) scores.optimizer += 2;
  if (signals.actionCompletionRate > 0.7) scores.optimizer += 1;

  // Logs in after drops → Anxious Saver
  if (signals.loginAfterDrops) scores.anxious_saver += 3;
  if (signals.sessionFrequency > 7) scores.anxious_saver += 1; // checks too often
  if (signals.avgSessionLength < 60) scores.anxious_saver += 1; // short panic checks

  // Low frequency, high completion when nudged → Delegator
  if (signals.sessionFrequency < 2) scores.delegator += 2;
  if (signals.actionCompletionRate > 0.8 && signals.sessionFrequency < 3) scores.delegator += 2;
  if (signals.avgSessionLength < 90) scores.delegator += 1;

  // Many detail taps → Curious Learner
  if (signals.detailTaps > 15) scores.curious_learner += 3;
  if (signals.avgSessionLength > 300) scores.curious_learner += 1;

  // High goal check frequency → Goal Seeker
  if (signals.goalCheckFrequency > 5) scores.goal_seeker += 3;
  if (signals.goalCheckFrequency > 2) scores.goal_seeker += 1;

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  return sorted[0][0] as Archetype;
}

// ─── LANGUAGE ADAPTER ────────────────────────────────────────────────────────
// Same data, different framing for each archetype.

export interface FramedValue {
  label: string;
  value: string;
  sublabel?: string;
}

export function frameNetWorth(amount: number, archetype: Archetype): FramedValue {
  const fmt = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  switch (archetype) {
    case 'optimizer':
      return { label: 'Net Worth', value: fmt(amount), sublabel: 'IRR 11.8% YTD' };
    case 'anxious_saver':
      return { label: 'Total Wealth', value: fmt(amount), sublabel: "You're in a strong position" };
    case 'delegator':
      return { label: 'Your Money', value: fmt(amount), sublabel: 'Growing steadily' };
    case 'curious_learner':
      return { label: 'Net Worth', value: fmt(amount), sublabel: 'Tap to see how this breaks down' };
    case 'goal_seeker':
      return { label: 'Progress', value: fmt(amount), sublabel: '73% to financial independence target' };
  }
}

export function frameSignalTitle(
  title: string,
  impact: string | undefined,
  archetype: Archetype
): string {
  switch (archetype) {
    case 'optimizer':
      return impact ? `${title} — ${impact}` : title;
    case 'anxious_saver':
      return title.replace('risk', 'to review').replace('concentration', 'to understand');
    case 'delegator':
      return `Action needed: ${title}`;
    case 'curious_learner':
      return `${title} — here's why this matters`;
    case 'goal_seeker':
      return impact ? `${title} helps reach your goal faster` : title;
    default:
      return title;
  }
}

export function archetypeColor(archetype: Archetype): string {
  return '#38BDF8'; // always ice blue — archetype affects language, not brand color
}

export function archetypeGreeting(name: string | undefined, archetype: Archetype): string {
  const n = name ? `, ${name}` : '';
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  switch (archetype) {
    case 'optimizer':
      return `Good ${time}${n}. Here's what moved today.`;
    case 'anxious_saver':
      return `Good ${time}${n}. Everything looks stable.`;
    case 'delegator':
      return `Good ${time}${n}. One thing needs your attention.`;
    case 'curious_learner':
      return `Good ${time}${n}. Let's explore your wealth picture.`;
    case 'goal_seeker':
      return `Good ${time}${n}. You're on track for your goals.`;
  }
}
