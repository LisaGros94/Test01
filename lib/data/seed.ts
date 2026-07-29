// ─────────────────────────────────────────────────────────────────────────────
// Seed data — the Blanche Wealth team and ~20 realistic tasks across every
// category, with a spread of statuses, deadlines, blockers and staleness so
// every view is populated and the notification triggers have something to fire
// on the first cron run.
//
// Dates are generated relative to `now` so the demo always looks current
// (things overdue stay overdue, blockers keep ageing). The SQL seed script
// materialises this against a fixed clock.
// ─────────────────────────────────────────────────────────────────────────────

import type { Activity, Comment, NotificationPref, Task, User } from '../types';
import { DAY_MS } from '../time';

export const SEED_USERS: User[] = [
  { id: 'lisa', email: 'lisa@blanche.xyz', name: 'Lisa Sorg', slackUserId: 'U0LISA', timezone: 'Europe/London', isFounder: true },
  { id: 'max', email: 'max@blanche.xyz', name: 'Max Berger', slackUserId: 'U0MAX', timezone: 'Europe/Berlin', isFounder: true },
  { id: 'nina', email: 'nina@blanche.xyz', name: 'Nina Laurent', slackUserId: 'U0NINA', timezone: 'Europe/Paris', isFounder: false },
  { id: 'tomas', email: 'tomas@blanche.xyz', name: 'Tomás Weber', slackUserId: 'U0TOMAS', timezone: 'Europe/Berlin', isFounder: false },
  { id: 'priya', email: 'priya@blanche.xyz', name: 'Priya Shah', slackUserId: 'U0PRIYA', timezone: 'Europe/London', isFounder: false },
  { id: 'felix', email: 'felix@blanche.xyz', name: 'Felix Marchand', slackUserId: 'U0FELIX', timezone: 'Europe/Paris', isFounder: false },
];

export const SEED_PREFS: NotificationPref[] = [];

interface Spec {
  id: string;
  title: string;
  category: Task['category'];
  leadId: string;
  collaboratorIds?: string[];
  status: Task['status'];
  /** Deadline as day-offset from now (negative = past). */
  deadlineIn?: number;
  priority?: Task['priority'];
  blockedBy?: string;
  waitingOn?: string;
  /** Days since last real change (drives staleness). */
  touchedDaysAgo?: number;
  /** Days the task has been in its current status (drives blocked/waiting age). */
  statusAgeDays?: number;
  chasedDaysAgo?: number;
  notes?: string;
}

const SPECS: Spec[] = [
  // ── Fundraising ────────────────────────────────────────────────────────────
  { id: 'fr-seed', title: 'Close seed round — finalise SAFE terms with lead investor', category: 'Fundraising', leadId: 'max', collaboratorIds: ['lisa'], status: 'In progress', deadlineIn: 12, priority: 'P0', touchedDaysAgo: 1, notes: '€1.8M target. Lead: Northzone. Terms doc in review.' },
  { id: 'fr-datapack', title: 'Update investor data room — Q2 metrics + cap table', category: 'Fundraising', leadId: 'lisa', status: 'In progress', deadlineIn: 4, priority: 'P1', touchedDaysAgo: 9, notes: 'Notion data room. Needs updated MRR chart.' },
  { id: 'fr-angel', title: 'Follow up with angel (Federico) on EMI scheme sign-off', category: 'Fundraising', leadId: 'max', status: 'Waiting on external', waitingOn: 'Federico', statusAgeDays: 6, chasedDaysAgo: 6, priority: 'P1', notes: 'Committed €150k, pending paperwork.' },

  // ── Incorporation ───────────────────────────────────────────────────────────
  { id: 'inc-ukco', title: 'Register UK holding company with Companies House', category: 'Incorporation', leadId: 'lisa', status: 'Waiting on external', waitingOn: 'Companies House', statusAgeDays: 11, chasedDaysAgo: 5, priority: 'P0', notes: 'Filing submitted. Awaiting incorporation certificate.' },
  { id: 'inc-bank', title: 'Open business banking (Qonto) for the German entity', category: 'Incorporation', leadId: 'nina', status: 'Blocked', blockedBy: 'inc-ukco', statusAgeDays: 4, priority: 'P1', notes: 'Blocked until UK parent is incorporated.' },
  { id: 'inc-share', title: 'Issue founder shares + set up vesting schedule', category: 'Incorporation', leadId: 'max', collaboratorIds: ['lisa'], status: 'Not started', deadlineIn: 20, priority: 'P1' },

  // ── Legal & Compliance ──────────────────────────────────────────────────────
  { id: 'lc-fca', title: 'FCA authorisation — scope Appointed Representative route', category: 'Legal & Compliance', leadId: 'priya', collaboratorIds: ['lisa'], status: 'In progress', deadlineIn: 30, priority: 'P0', touchedDaysAgo: 3, notes: 'AR under a principal firm vs. direct authorisation.' },
  { id: 'lc-gdpr', title: 'Draft GDPR data processing policy + client privacy notice', category: 'Legal & Compliance', leadId: 'priya', status: 'In progress', deadlineIn: -2, priority: 'P1', touchedDaysAgo: 8, notes: 'Slipped past deadline — needs sign-off.' },
  { id: 'lc-terms', title: 'Client terms of business — external counsel review', category: 'Legal & Compliance', leadId: 'priya', status: 'Waiting on external', waitingOn: 'Sopher & Co', statusAgeDays: 8, chasedDaysAgo: 8, priority: 'P2' },

  // ── Team ─────────────────────────────────────────────────────────────────────
  { id: 'tm-hire-eng', title: 'Hire founding engineer — close candidate from final round', category: 'Team', leadId: 'max', collaboratorIds: ['tomas'], status: 'In progress', deadlineIn: 6, priority: 'P0', touchedDaysAgo: 2, notes: 'Offer out. Negotiating equity.' },
  { id: 'tm-onboard', title: 'Onboard Nina — accounts, payroll, equipment', category: 'Team', leadId: 'lisa', collaboratorIds: ['nina'], status: 'Done', deadlineIn: -3, priority: 'P2', touchedDaysAgo: 3, statusAgeDays: 3 },
  { id: 'tm-contract', title: 'Standardise contractor agreements across 3 jurisdictions', category: 'Team', leadId: 'nina', status: 'Blocked', blockedBy: 'Waiting on Priya for compliance input', statusAgeDays: 5, priority: 'P2' },

  // ── Ops ──────────────────────────────────────────────────────────────────────
  { id: 'ops-stack', title: 'Set up internal ops stack — Notion, Linear, Slack workspace', category: 'Ops', leadId: 'nina', status: 'In progress', deadlineIn: 2, priority: 'P1', touchedDaysAgo: 1 },
  { id: 'ops-insurance', title: 'Get PI + D&O insurance quotes', category: 'Ops', leadId: 'nina', status: 'Not started', deadlineIn: 15, priority: 'P2' },
  { id: 'ops-expenses', title: 'Roll out expense + reimbursement process (Pleo)', category: 'Ops', leadId: 'lisa', status: 'In progress', deadlineIn: 9, priority: 'P2', touchedDaysAgo: 16, notes: 'Drifting — no movement in over two weeks.' },

  // ── Culture ──────────────────────────────────────────────────────────────────
  { id: 'cul-values', title: 'Write founding values + ways-of-working doc', category: 'Culture', leadId: 'lisa', collaboratorIds: ['max', 'nina'], status: 'In progress', deadlineIn: 10, priority: 'P2', touchedDaysAgo: 4 },
  { id: 'cul-offsite', title: 'Plan Q3 team offsite (Berlin)', category: 'Culture', leadId: 'felix', status: 'Not started', deadlineIn: 25, priority: 'P2' },

  // ── PR ────────────────────────────────────────────────────────────────────────
  { id: 'pr-launch', title: 'Draft launch announcement + press outreach list', category: 'PR', leadId: 'felix', collaboratorIds: ['max'], status: 'In progress', deadlineIn: 18, priority: 'P1', touchedDaysAgo: 5 },
  { id: 'pr-brand', title: 'Finalise brand identity with design studio', category: 'PR', leadId: 'felix', status: 'Waiting on external', waitingOn: 'Studio Dumbar', statusAgeDays: 5, chasedDaysAgo: 5, priority: 'P2' },

  // ── Product ────────────────────────────────────────────────────────────────────
  { id: 'pd-mvp', title: 'Ship MVP client onboarding flow', category: 'Product', leadId: 'tomas', collaboratorIds: ['nina'], status: 'In progress', deadlineIn: 8, priority: 'P0', touchedDaysAgo: 1 },
  { id: 'pd-kyc', title: 'Integrate KYC/AML provider (Onfido) into onboarding', category: 'Product', leadId: 'tomas', status: 'Blocked', blockedBy: 'lc-fca', statusAgeDays: 3, priority: 'P1', notes: 'Blocked on FCA scope decision.' },
  { id: 'pd-dashboard', title: 'Client portfolio dashboard — v1 spec', category: 'Product', leadId: 'tomas', status: 'Not started', deadlineIn: 22, priority: 'P2' },
];

export interface SeedBundle {
  users: User[];
  tasks: Task[];
  activity: Activity[];
  comments: Comment[];
  prefs: NotificationPref[];
}

export function buildSeed(now: Date): SeedBundle {
  const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY_MS).toISOString();
  const dateIn = (days: number) => new Date(now.getTime() + days * DAY_MS).toISOString().slice(0, 10);

  const tasks: Task[] = [];
  const activity: Activity[] = [];

  for (const s of SPECS) {
    const createdDaysAgo = 40;
    const touched = s.touchedDaysAgo ?? s.statusAgeDays ?? 1;
    const statusAge = s.statusAgeDays ?? touched;

    const task: Task = {
      id: s.id,
      title: s.title,
      category: s.category,
      leadId: s.leadId,
      collaboratorIds: s.collaboratorIds ?? [],
      status: s.status,
      deadline: s.deadlineIn === undefined ? null : dateIn(s.deadlineIn),
      notes: s.notes ?? '',
      blockedBy: s.blockedBy ?? null,
      waitingOn: s.waitingOn ?? null,
      priority: s.priority ?? 'P1',
      lastTouched: iso(touched),
      createdAt: iso(createdDaysAgo),
      createdBy: s.leadId,
      lastChasedAt: s.chasedDaysAgo === undefined ? null : iso(s.chasedDaysAgo),
      statusChangedAt: iso(statusAge),
    };
    tasks.push(task);

    activity.push({
      id: `${s.id}-a0`,
      taskId: s.id,
      actorId: s.leadId,
      kind: 'created',
      summary: 'created the task',
      from: null,
      to: null,
      at: iso(createdDaysAgo),
    });
    if (s.status !== 'Not started') {
      activity.push({
        id: `${s.id}-a1`,
        taskId: s.id,
        actorId: s.leadId,
        kind: 'status',
        summary: `set status to ${s.status}`,
        from: 'Not started',
        to: s.status,
        at: iso(statusAge),
      });
    }
  }

  const comments: Comment[] = [
    {
      id: 'c1',
      taskId: 'fr-seed',
      authorId: 'lisa',
      body: 'Term sheet looks good. @max can you confirm the valuation cap before we counter?',
      mentionIds: ['max'],
      at: iso(1),
    },
    {
      id: 'c2',
      taskId: 'inc-bank',
      authorId: 'nina',
      body: 'Qonto confirmed they can proceed the moment the UK parent is registered. @lisa any ETA from Companies House?',
      mentionIds: ['lisa'],
      at: iso(2),
    },
  ];

  return { users: SEED_USERS, tasks, activity, comments, prefs: SEED_PREFS };
}
