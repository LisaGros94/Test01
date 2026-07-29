// Postgres-backed Store (Supabase / Neon). Loaded only when DATABASE_URL is set.
// Maps snake_case rows ↔ the camelCase domain types. Timestamps are normalised
// to ISO strings and deadlines to yyyy-mm-dd so the rest of the app never sees a
// Date object it didn't create.

import postgres from 'postgres';
import type {
  Activity,
  Comment,
  NotificationPref,
  SentNotification,
  Task,
  User,
} from '../types';
import type { Store } from './store';

let sql: ReturnType<typeof postgres> | null = null;
function db() {
  if (!sql) sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  return sql;
}

const iso = (v: unknown): string => (v instanceof Date ? v.toISOString() : String(v));
const isoOrNull = (v: unknown): string | null => (v == null ? null : iso(v));
const dateOrNull = (v: unknown): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);

/* eslint-disable @typescript-eslint/no-explicit-any */
function toTask(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    leadId: r.lead_id,
    collaboratorIds: r.collaborator_ids ?? [],
    status: r.status,
    deadline: dateOrNull(r.deadline),
    notes: r.notes ?? '',
    blockedBy: r.blocked_by ?? null,
    waitingOn: r.waiting_on ?? null,
    priority: r.priority,
    lastTouched: iso(r.last_touched),
    createdAt: iso(r.created_at),
    createdBy: r.created_by,
    lastChasedAt: isoOrNull(r.last_chased_at),
    statusChangedAt: iso(r.status_changed_at),
  };
}
const toActivity = (r: any): Activity => ({
  id: r.id, taskId: r.task_id, actorId: r.actor_id, kind: r.kind,
  summary: r.summary, from: r.from_val ?? null, to: r.to_val ?? null, at: iso(r.at),
});
const toComment = (r: any): Comment => ({
  id: r.id, taskId: r.task_id, authorId: r.author_id, body: r.body,
  mentionIds: r.mention_ids ?? [], at: iso(r.at),
});
const toUser = (r: any): User => ({
  id: r.id, email: r.email, name: r.name, slackUserId: r.slack_user_id ?? undefined,
  timezone: r.timezone, isFounder: r.is_founder,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export function postgresStore(): Store {
  return {
    async allTasks() {
      return (await db()`select * from tasks order by created_at desc`).map(toTask);
    },
    async getTask(id) {
      const rows = await db()`select * from tasks where id = ${id}`;
      return rows.length ? toTask(rows[0]) : null;
    },
    async putTask(t) {
      await db()`
        insert into tasks
          (id, title, category, lead_id, collaborator_ids, status, deadline, notes,
           blocked_by, waiting_on, priority, last_touched, created_at, created_by,
           last_chased_at, status_changed_at)
        values
          (${t.id}, ${t.title}, ${t.category}, ${t.leadId}, ${db().array(t.collaboratorIds)},
           ${t.status}, ${t.deadline}, ${t.notes}, ${t.blockedBy}, ${t.waitingOn},
           ${t.priority}, ${t.lastTouched}, ${t.createdAt}, ${t.createdBy},
           ${t.lastChasedAt}, ${t.statusChangedAt})
        on conflict (id) do update set
          title = excluded.title, category = excluded.category, lead_id = excluded.lead_id,
          collaborator_ids = excluded.collaborator_ids, status = excluded.status,
          deadline = excluded.deadline, notes = excluded.notes, blocked_by = excluded.blocked_by,
          waiting_on = excluded.waiting_on, priority = excluded.priority,
          last_touched = excluded.last_touched, last_chased_at = excluded.last_chased_at,
          status_changed_at = excluded.status_changed_at`;
    },
    async deleteTask(id) {
      await db()`delete from tasks where id = ${id}`;
    },

    async allActivity() {
      return (await db()`select * from activity order by at asc`).map(toActivity);
    },
    async activityForTask(id) {
      return (await db()`select * from activity where task_id = ${id} order by at asc`).map(toActivity);
    },
    async putActivity(a) {
      await db()`
        insert into activity (id, task_id, actor_id, kind, summary, from_val, to_val, at)
        values (${a.id}, ${a.taskId}, ${a.actorId}, ${a.kind}, ${a.summary}, ${a.from}, ${a.to}, ${a.at})`;
    },

    async commentsForTask(id) {
      return (await db()`select * from comments where task_id = ${id} order by at asc`).map(toComment);
    },
    async putComment(c) {
      await db()`
        insert into comments (id, task_id, author_id, body, mention_ids, at)
        values (${c.id}, ${c.taskId}, ${c.authorId}, ${c.body}, ${db().array(c.mentionIds)}, ${c.at})`;
    },

    async allUsers() {
      return (await db()`select * from users order by is_founder desc, name asc`).map(toUser);
    },
    async getUser(id) {
      const rows = await db()`select * from users where id = ${id}`;
      return rows.length ? toUser(rows[0]) : null;
    },

    async allPrefs() {
      return (await db()`select * from notification_prefs`).map(
        (r): NotificationPref => ({ userId: r.user_id, trigger: r.trigger, muted: r.muted }),
      );
    },
    async putPref(p) {
      await db()`
        insert into notification_prefs (user_id, trigger, muted)
        values (${p.userId}, ${p.trigger}, ${p.muted})
        on conflict (user_id, trigger) do update set muted = excluded.muted`;
    },

    async allSent() {
      return (await db()`select * from sent_notifications`).map(
        (r): SentNotification => ({
          dedupeKey: r.dedupe_key, recipientId: r.recipient_id,
          trigger: r.trigger, channel: r.channel, sentAt: iso(r.sent_at),
        }),
      );
    },
    async putSent(rows) {
      if (!rows.length) return;
      await db()`
        insert into sent_notifications ${db()(
          rows.map((r) => ({
            dedupe_key: r.dedupeKey, recipient_id: r.recipientId,
            trigger: r.trigger, channel: r.channel, sent_at: r.sentAt,
          })),
        )}`;
    },
  };
}
