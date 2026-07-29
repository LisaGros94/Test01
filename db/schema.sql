-- Blanche Wealth task tracker — Postgres schema (Supabase / Neon).
-- Run with:  psql "$DATABASE_URL" -f db/schema.sql   (or `npm run db:migrate`)

create table if not exists users (
  id            text primary key,
  email         text not null unique,
  name          text not null,
  slack_user_id text,
  timezone      text not null default 'Europe/London',
  is_founder    boolean not null default false
);

create table if not exists tasks (
  id               text primary key,
  title            text not null,
  category         text not null,
  lead_id          text not null references users(id),
  collaborator_ids text[] not null default '{}',
  status           text not null default 'Not started',
  deadline         date,
  notes            text not null default '',
  blocked_by       text,
  waiting_on       text,
  priority         text not null default 'P1',
  last_touched     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  created_by       text not null references users(id),
  last_chased_at   timestamptz,
  status_changed_at timestamptz not null default now(),
  -- Enforce the "you can't be Blocked/Waiting without a reason" invariant at
  -- the database level too, not just in the service layer.
  constraint blocked_needs_reason
    check (status <> 'Blocked' or blocked_by is not null),
  constraint waiting_needs_party
    check (status <> 'Waiting on external' or waiting_on is not null)
);

create index if not exists tasks_lead_idx   on tasks(lead_id);
create index if not exists tasks_status_idx on tasks(status);

create table if not exists activity (
  id       text primary key,
  task_id  text not null references tasks(id) on delete cascade,
  actor_id text not null references users(id),
  kind     text not null,
  summary  text not null,
  from_val text,
  to_val   text,
  at       timestamptz not null default now()
);
create index if not exists activity_task_idx on activity(task_id, at);

create table if not exists comments (
  id          text primary key,
  task_id     text not null references tasks(id) on delete cascade,
  author_id   text not null references users(id),
  body        text not null,
  mention_ids text[] not null default '{}',
  at          timestamptz not null default now()
);
create index if not exists comments_task_idx on comments(task_id, at);

create table if not exists notification_prefs (
  user_id text not null references users(id),
  trigger text not null,
  muted   boolean not null default false,
  primary key (user_id, trigger)
);

create table if not exists sent_notifications (
  id           bigserial primary key,
  dedupe_key   text not null,
  recipient_id text not null references users(id),
  trigger      text not null,
  channel      text not null,
  sent_at      timestamptz not null default now()
);
-- Rate-limiting + dedupe lookups hit these constantly.
create index if not exists sent_dedupe_idx on sent_notifications(dedupe_key);
create index if not exists sent_recipient_idx on sent_notifications(recipient_id, channel, sent_at);
