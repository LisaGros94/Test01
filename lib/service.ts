// ─────────────────────────────────────────────────────────────────────────────
// Service layer — all task mutation logic in one place, on top of any Store.
//
// Responsibilities:
//   • Enforce the invariants the spec calls out (blocked/waiting need a reason;
//     lead is required; "Both" is impossible because leadId is a single id).
//   • Record immutable activity for every real change, and bump last_touched
//     only on a real change (never on read).
//   • Fire the event-driven notifications (assignment, handoff, watched-status,
//     @mention) through the pure trigger builders + the delivery runner.
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from 'node:crypto';
import type {
  Activity,
  ActivityKind,
  Category,
  Comment,
  NotificationIntent,
  Priority,
  Status,
  Task,
  User,
} from './types';
import { getStore } from './data';
import {
  onCollaboratorAdded,
  onHandoff,
  onMention,
  onWatchedStatusChange,
  type TriggerContext,
} from './notifications/triggers';
import { deliver } from './notifications/runner';

const store = getStore;

function now(): string {
  return new Date().toISOString();
}

async function triggerCtx(): Promise<TriggerContext> {
  const s = store();
  const [tasks, users, activity] = await Promise.all([
    s.allTasks(),
    s.allUsers(),
    s.allActivity(),
  ]);
  const activityByTask: Record<string, Activity[]> = {};
  for (const a of activity) (activityByTask[a.taskId] ??= []).push(a);
  return { now: new Date(), tasks, users, activityByTask };
}

async function record(taskId: string, actorId: string, kind: ActivityKind, summary: string, from: string | null, to: string | null): Promise<void> {
  await store().putActivity({
    id: randomUUID(),
    taskId,
    actorId,
    kind,
    summary,
    from,
    to,
    at: now(),
  });
}

// ── Create ───────────────────────────────────────────────────────────────────

/** Creating a task takes exactly one field: the title. Everything else later. */
export async function createTask(
  title: string,
  actorId: string,
  extras: Partial<Pick<Task, 'category' | 'leadId' | 'priority' | 'deadline'>> = {},
): Promise<Task> {
  const ts = now();
  const task: Task = {
    id: randomUUID(),
    title: title.trim(),
    category: extras.category ?? 'Ops',
    leadId: extras.leadId ?? actorId,
    collaboratorIds: [],
    status: 'Not started',
    deadline: extras.deadline ?? null,
    notes: '',
    blockedBy: null,
    waitingOn: null,
    priority: extras.priority ?? 'P1',
    lastTouched: ts,
    createdAt: ts,
    createdBy: actorId,
    lastChasedAt: null,
    statusChangedAt: ts,
  };
  await store().putTask(task);
  await record(task.id, actorId, 'created', 'created the task', null, null);

  // If someone assigns a lead other than themselves at creation, that's a handoff.
  if (task.leadId !== actorId) {
    const ctx = await triggerCtx();
    await deliver(store(), [onHandoff(ctx, task, task.leadId, actorId)]);
  }
  return task;
}

// ── Patch (inline edit) ──────────────────────────────────────────────────────

export interface TaskPatch {
  title?: string;
  category?: Category;
  leadId?: string;
  collaboratorIds?: string[];
  status?: Status;
  deadline?: string | null;
  notes?: string;
  blockedBy?: string | null;
  waitingOn?: string | null;
  priority?: Priority;
}

export class ValidationError extends Error {}

/**
 * Apply an inline edit. Validates invariants, records one activity row per
 * changed field, bumps last_touched only if something actually changed, and
 * fires event notifications for lead/collaborator/status changes.
 */
export async function patchTask(id: string, patch: TaskPatch, actorId: string): Promise<Task> {
  const s = store();
  const prev = await s.getTask(id);
  if (!prev) throw new ValidationError('Task not found');

  const next: Task = { ...prev };
  const activities: { kind: ActivityKind; summary: string; from: string | null; to: string | null }[] = [];

  // Determine the resulting status first so blocker/waiting validation is coherent.
  const resultingStatus = patch.status ?? prev.status;
  const resultingBlockedBy = patch.blockedBy !== undefined ? patch.blockedBy : prev.blockedBy;
  const resultingWaitingOn = patch.waitingOn !== undefined ? patch.waitingOn : prev.waitingOn;

  if (resultingStatus === 'Blocked' && !resultingBlockedBy) {
    throw new ValidationError('A blocked task needs a blocker — say what is blocking it.');
  }
  if (resultingStatus === 'Waiting on external' && !resultingWaitingOn) {
    throw new ValidationError('A waiting task needs the name of the external party.');
  }

  if (patch.title !== undefined && patch.title.trim() && patch.title !== prev.title) {
    next.title = patch.title.trim();
    activities.push({ kind: 'title', summary: `renamed the task`, from: prev.title, to: next.title });
  }
  if (patch.category !== undefined && patch.category !== prev.category) {
    next.category = patch.category;
    activities.push({ kind: 'category', summary: `moved to ${patch.category}`, from: prev.category, to: patch.category });
  }
  if (patch.priority !== undefined && patch.priority !== prev.priority) {
    next.priority = patch.priority;
    activities.push({ kind: 'priority', summary: `set priority ${patch.priority}`, from: prev.priority, to: patch.priority });
  }
  if (patch.deadline !== undefined && patch.deadline !== prev.deadline) {
    next.deadline = patch.deadline;
    activities.push({ kind: 'deadline', summary: patch.deadline ? `set deadline ${patch.deadline}` : 'cleared the deadline', from: prev.deadline, to: patch.deadline });
  }
  if (patch.notes !== undefined && patch.notes !== prev.notes) {
    next.notes = patch.notes;
    activities.push({ kind: 'notes', summary: 'updated the notes', from: null, to: null });
  }

  // Lead change → handoff.
  let handoffTo: string | null = null;
  if (patch.leadId !== undefined && patch.leadId !== prev.leadId) {
    next.leadId = patch.leadId;
    handoffTo = patch.leadId;
    activities.push({ kind: 'lead', summary: `handed lead to ${patch.leadId}`, from: prev.leadId, to: patch.leadId });
  }

  // Collaborators change → assignment for newly added ones.
  let addedCollaborators: string[] = [];
  if (patch.collaboratorIds !== undefined) {
    const before = new Set(prev.collaboratorIds);
    addedCollaborators = patch.collaboratorIds.filter((c) => !before.has(c));
    if (JSON.stringify(patch.collaboratorIds) !== JSON.stringify(prev.collaboratorIds)) {
      next.collaboratorIds = patch.collaboratorIds;
      activities.push({ kind: 'collaborators', summary: 'updated collaborators', from: prev.collaboratorIds.join(','), to: patch.collaboratorIds.join(',') });
    }
  }

  // Blocker / waiting reason changes (recorded even without a status change).
  if (patch.blockedBy !== undefined && patch.blockedBy !== prev.blockedBy) {
    next.blockedBy = patch.blockedBy;
    activities.push({ kind: 'blocked_by', summary: patch.blockedBy ? `blocker: ${patch.blockedBy}` : 'cleared blocker', from: prev.blockedBy, to: patch.blockedBy });
  }
  if (patch.waitingOn !== undefined && patch.waitingOn !== prev.waitingOn) {
    next.waitingOn = patch.waitingOn;
    activities.push({ kind: 'waiting_on', summary: patch.waitingOn ? `waiting on: ${patch.waitingOn}` : 'cleared waiting-on', from: prev.waitingOn, to: patch.waitingOn });
  }

  // Status change → statusChangedAt reset + watched-status notification.
  let statusChange: { from: Status; to: Status } | null = null;
  if (patch.status !== undefined && patch.status !== prev.status) {
    next.status = patch.status;
    next.statusChangedAt = now();
    // Entering "waiting on external" starts the chase clock fresh.
    if (patch.status === 'Waiting on external') next.lastChasedAt = now();
    statusChange = { from: prev.status, to: patch.status };
    activities.push({ kind: 'status', summary: `${prev.status} → ${patch.status}`, from: prev.status, to: patch.status });
  }

  if (activities.length === 0) return prev; // nothing really changed — don't bump last_touched

  next.lastTouched = now();
  await s.putTask(next);
  for (const a of activities) await record(id, actorId, a.kind, a.summary, a.from, a.to);

  // Fire event notifications.
  const ctx = await triggerCtx();
  const intents: NotificationIntent[] = [];
  if (handoffTo) intents.push(onHandoff(ctx, next, handoffTo, actorId));
  for (const c of addedCollaborators) intents.push(onCollaboratorAdded(ctx, next, c, actorId));
  if (statusChange) intents.push(...onWatchedStatusChange(ctx, next, statusChange.from, statusChange.to, actorId));
  await deliver(s, intents);

  return next;
}

// ── Bulk edit ─────────────────────────────────────────────────────────────────

export async function bulkPatch(
  ids: string[],
  patch: Pick<TaskPatch, 'category' | 'leadId' | 'status'>,
  actorId: string,
): Promise<Task[]> {
  const out: Task[] = [];
  for (const id of ids) {
    try {
      out.push(await patchTask(id, patch, actorId));
    } catch {
      // Skip tasks the bulk patch can't legally apply to (e.g. → Blocked
      // without a blocker); the caller reports partial success.
    }
  }
  return out;
}

// ── Delete ─────────────────────────────────────────────────────────────────────

export async function deleteTask(id: string): Promise<void> {
  await store().deleteTask(id);
}

// ── Comments + @mentions ───────────────────────────────────────────────────────

export async function addComment(taskId: string, authorId: string, body: string): Promise<Comment> {
  const s = store();
  const users = await s.allUsers();
  const mentionIds = parseMentions(body, users);
  const comment: Comment = {
    id: randomUUID(),
    taskId,
    authorId,
    body,
    mentionIds,
    at: now(),
  };
  await s.putComment(comment);
  await record(taskId, authorId, 'comment', 'commented', null, null);

  const task = await s.getTask(taskId);
  if (task && mentionIds.length) {
    const ctx = await triggerCtx();
    await deliver(s, onMention(ctx, task, comment.id, authorId, mentionIds));
  }
  return comment;
}

/** Match @handle against user id, first-name, or email local-part. */
export function parseMentions(body: string, users: User[]): string[] {
  const tokens = new Set((body.match(/@([a-z0-9._-]+)/gi) ?? []).map((t) => t.slice(1).toLowerCase()));
  const ids = new Set<string>();
  for (const u of users) {
    const handles = [u.id.toLowerCase(), u.name.split(' ')[0].toLowerCase(), u.email.split('@')[0].toLowerCase()];
    if (handles.some((h) => tokens.has(h))) ids.add(u.id);
  }
  return [...ids];
}

// ── "I chased today" ────────────────────────────────────────────────────────────

/** Resets the waiting-on-external 5-day chase clock. */
export async function chase(taskId: string, actorId: string): Promise<Task> {
  const s = store();
  const prev = await s.getTask(taskId);
  if (!prev) throw new ValidationError('Task not found');
  const next: Task = { ...prev, lastChasedAt: now(), lastTouched: now() };
  await s.putTask(next);
  await record(taskId, actorId, 'chased', `chased ${prev.waitingOn ?? 'external party'}`, null, null);
  return next;
}

// ── Mute prefs ──────────────────────────────────────────────────────────────────

export async function setMute(userId: string, trigger: import('./types').TriggerType, muted: boolean): Promise<void> {
  await store().putPref({ userId, trigger, muted });
}

// ── Reads ────────────────────────────────────────────────────────────────────────

export async function getTaskDetail(id: string): Promise<{ task: Task; activity: Activity[]; comments: Comment[] } | null> {
  const s = store();
  const task = await s.getTask(id);
  if (!task) return null;
  const [activity, comments] = await Promise.all([s.activityForTask(id), s.commentsForTask(id)]);
  activity.sort((a, b) => a.at.localeCompare(b.at));
  comments.sort((a, b) => a.at.localeCompare(b.at));
  return { task, activity, comments };
}

export async function listTasks(): Promise<Task[]> {
  return store().allTasks();
}

export async function listUsers(): Promise<User[]> {
  return store().allUsers();
}

// ── Import from a Google Sheet ──────────────────────────────────────────────────
// Columns: Category | Task | Lead | Status | Deadline | Notes. Rows write
// straight through the store (no per-row handoff spam on a bulk import), but
// still get a "created" activity row and satisfy the blocked/waiting invariant.

export interface ImportRow {
  Category?: string;
  Task?: string;
  Lead?: string;
  Status?: string;
  Deadline?: string;
  Notes?: string;
}

const CAT_ALIASES: Record<string, Category> = {
  fundraising: 'Fundraising', incorporation: 'Incorporation',
  'legal & compliance': 'Legal & Compliance', legal: 'Legal & Compliance',
  compliance: 'Legal & Compliance', team: 'Team', ops: 'Ops',
  operations: 'Ops', culture: 'Culture', pr: 'PR', product: 'Product',
};
const STATUS_ALIASES: Record<string, Status> = {
  'not started': 'Not started', todo: 'Not started', 'to do': 'Not started',
  'in progress': 'In progress', doing: 'In progress', wip: 'In progress',
  blocked: 'Blocked', 'waiting on external': 'Waiting on external',
  waiting: 'Waiting on external', done: 'Done', complete: 'Done', completed: 'Done',
};

function resolveLead(name: string | undefined, users: User[], fallback: string): string {
  if (!name) return fallback;
  const n = name.trim().toLowerCase();
  const u = users.find(
    (x) => x.name.toLowerCase() === n || x.name.split(' ')[0].toLowerCase() === n ||
      x.id.toLowerCase() === n || x.email.toLowerCase() === n,
  );
  return u?.id ?? fallback;
}

export async function importTasks(rows: ImportRow[], actorId: string): Promise<{ created: number; skipped: number }> {
  const s = store();
  const users = await s.allUsers();
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = (row.Task ?? '').trim();
    if (!title) { skipped++; continue; }

    const category = CAT_ALIASES[(row.Category ?? '').trim().toLowerCase()] ?? 'Ops';
    const status = STATUS_ALIASES[(row.Status ?? '').trim().toLowerCase()] ?? 'Not started';
    const leadId = resolveLead(row.Lead, users, actorId);
    const notes = (row.Notes ?? '').trim();
    const deadline = parseImportDate(row.Deadline);

    // Satisfy the invariant for imported blocked/waiting rows.
    const blockedBy = status === 'Blocked' ? (notes || 'Imported — blocker unspecified') : null;
    const waitingOn = status === 'Waiting on external' ? (notes || 'Imported — party unspecified') : null;

    const ts = now();
    const task: Task = {
      id: randomUUID(), title, category, leadId, collaboratorIds: [],
      status, deadline, notes, blockedBy, waitingOn, priority: 'P1',
      lastTouched: ts, createdAt: ts, createdBy: actorId,
      lastChasedAt: status === 'Waiting on external' ? ts : null, statusChangedAt: ts,
    };
    await s.putTask(task);
    await record(task.id, actorId, 'created', 'imported from Google Sheet', null, null);
    created++;
  }
  return { created, skipped };
}

function parseImportDate(v: string | undefined): string | null {
  if (!v || !v.trim()) return null;
  const t = v.trim();
  // Accept yyyy-mm-dd directly.
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  // Accept dd/mm/yyyy or mm/dd/yyyy → best-effort yyyy-mm-dd.
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, a, b, y] = m;
    const day = a.padStart(2, '0');
    const mon = b.padStart(2, '0');
    return `${y}-${mon}-${day}`;
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
