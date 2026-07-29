// ─────────────────────────────────────────────────────────────────────────────
// Domain model for the Blanche Wealth task tracker.
// These types are the single source of truth shared by the data layer, the
// notification engine, and the UI. Keep them free of framework/IO concerns.
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  'Fundraising',
  'Incorporation',
  'Legal & Compliance',
  'Team',
  'Ops',
  'Culture',
  'PR',
  'Product',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = [
  'Not started',
  'In progress',
  'Blocked',
  'Waiting on external',
  'Done',
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['P0', 'P1', 'P2'] as const;
export type Priority = (typeof PRIORITIES)[number];

/** IANA timezones we support for per-user digest scheduling. */
export type Timezone = 'Europe/London' | 'Europe/Berlin' | 'Europe/Paris';

export interface User {
  id: string;
  /** Must be an @blanche.xyz Google Workspace address. */
  email: string;
  name: string;
  /** Slack member id (Uxxxx) for DM delivery. */
  slackUserId?: string;
  timezone: Timezone;
  /** Founders receive escalations and the Friday digest. */
  isFounder: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  /** Exactly one accountable person. Never "Both". */
  leadId: string;
  /** Notified, not accountable. */
  collaboratorIds: string[];
  status: Status;
  /** ISO date (yyyy-mm-dd), optional. */
  deadline: string | null;
  /** Rich text stored as HTML/markdown string. */
  notes: string;
  /** Required when status === 'Blocked'. Task id reference or free text. */
  blockedBy: string | null;
  /** Required when status === 'Waiting on external'. Name of external party. */
  waitingOn: string | null;
  priority: Priority;
  /** Auto timestamp — updates only on a real content change, never on view. */
  lastTouched: string; // ISO datetime
  createdAt: string;
  createdBy: string;
  /**
   * When the "waiting on external" clock was last reset by an "I chased today"
   * action (or when the status was first set). Drives the 5-day chase prompt.
   */
  lastChasedAt: string | null;
  /** When the task entered the current status (drives blocked-age + staleness). */
  statusChangedAt: string;
}

/** Immutable per-task activity record. */
export interface Activity {
  id: string;
  taskId: string;
  actorId: string;
  /** Machine verb: created | status | lead | collaborators | deadline | ... */
  kind: ActivityKind;
  /** Human-readable summary, e.g. "changed status In progress → Blocked". */
  summary: string;
  /** Structured before/after for auditing. */
  from: string | null;
  to: string | null;
  at: string; // ISO datetime
}

export type ActivityKind =
  | 'created'
  | 'title'
  | 'category'
  | 'status'
  | 'lead'
  | 'collaborators'
  | 'deadline'
  | 'priority'
  | 'notes'
  | 'blocked_by'
  | 'waiting_on'
  | 'chased'
  | 'comment';

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  /** User ids extracted from @mentions in the body. */
  mentionIds: string[];
  at: string;
}

// ── Notifications ────────────────────────────────────────────────────────────

export const TRIGGER_TYPES = [
  'assignment',
  'deadline',
  'staleness',
  'blocked_escalation',
  'waiting_external',
  'handoff',
  'mention',
  'watched_status',
  'digest_monday',
  'digest_friday',
] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];

export const CHANNELS = ['slack', 'email'] as const;
export type Channel = (typeof CHANNELS)[number];

/**
 * A notification the engine *wants* to send. Produced by the pure trigger
 * evaluator. Delivery, batching, and anti-noise rules are applied afterwards.
 */
export interface NotificationIntent {
  /** Stable key used to de-duplicate a given trigger over repeated cron runs. */
  dedupeKey: string;
  recipientId: string;
  trigger: TriggerType;
  taskId: string | null;
  title: string;
  body: string;
  /** Deep link back to the task (relative). */
  link: string;
  /** Immediate triggers bypass the batch window; scheduled ones may batch. */
  immediate: boolean;
  /** Who caused this, so we can suppress self-notifications. */
  actorId: string | null;
  createdAt: string;
}

/** A record of a notification already sent, for de-duplication + rate limiting. */
export interface SentNotification {
  dedupeKey: string;
  recipientId: string;
  trigger: TriggerType;
  channel: Channel;
  sentAt: string;
}

/** Per-user, per-trigger mute toggles. Absent entry === not muted. */
export interface NotificationPref {
  userId: string;
  trigger: TriggerType;
  muted: boolean;
}

/** Records the last time each recurring digest fired, to avoid double-send. */
export interface DigestState {
  userId: string;
  kind: 'digest_monday' | 'digest_friday';
  lastSentAt: string;
}
