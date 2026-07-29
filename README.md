# Blanche — Task Tracker

A collaborative task tracker for [Blanche Wealth](https://blanche.xyz). Built around
one idea: **the owner finds out before someone has to ask them.** It is a chase
engine with a task list attached, not a task list with reminders bolted on.

Restrained, dense, keyboard-first — closer to Linear than Trello.

## Quick start (demo mode, no setup)

```bash
npm install
npm run dev        # → http://localhost:3000
```

With no `DATABASE_URL` the app runs against a **seeded in-memory store**: ~20
realistic tasks across all eight categories, six teammates in three timezones.
Every view is populated on first run. Use the avatar switcher (top-right) to
**act as** any teammate and watch self-suppression, handoffs and mentions behave.

To watch the notification engine, open **Settings → Run the notification engine
now**, then read the server console — Slack/email sends are printed there in demo
mode.

```bash
npm test           # 25 unit tests over the trigger + anti-noise logic
```

## Architecture

The whole product lives in `lib/`, with the UI as a thin client over a small API.

```
lib/
  types.ts                     Domain model — the shared vocabulary.
  time.ts                      Timezone-aware date math (digests, deadlines).
  service.ts                   All task mutations: validation, activity log,
                               and firing the event-driven notifications.
  data/
    store.ts                   Storage interface (primitive get/put/list).
    memory.ts                  Seeded in-memory backend (demo default).
    postgres.ts                Postgres backend (Supabase / Neon).
    seed.ts                    ~20 sample tasks + the team.
  notifications/               ← THE CORE. Kept in one place; it changes often.
    triggers.ts                PURE trigger evaluation. All 8 triggers.
    digest.ts                  PURE Monday / Friday digest builders.
    engine.ts                  PURE anti-noise: dedupe, self-suppress, mute,
                               batch, Slack 1/hour.
    schedule.ts                Cron entry: scheduled triggers + local-time digests.
    runner.ts                  The one impure seam: plan → Slack/email → record.
    slack.ts / email.ts        Channel adapters (Slack primary, Resend fallback).
    *.test.ts                  Unit tests.
```

### Why the notification logic is split this way

The brief says trigger logic *"will change often — keep it in one testable
module."* So `triggers.ts`, `digest.ts` and `engine.ts` are **pure functions**:
give them a snapshot of the world plus `now`, get back the notifications that
*should* exist. No database, no clock, no Slack. Every rule is unit-tested in
isolation. The only I/O lives in `runner.ts`.

### The eight triggers (`lib/notifications/triggers.ts`)

| # | Trigger | Rule | Recipient |
|---|---------|------|-----------|
| 1 | Assignment | immediate | new collaborator |
| 2 | Deadline | 7d, 2d, morning-of, then daily overdue; **+other founders after 3d overdue** | lead (+founders) |
| 3 | Staleness | In-progress idle 7d → nudge; 14d → nudge + "drifting" in digest | lead |
| 4 | Blocked escalation | Blocked 3+ days → **both founders** | founders |
| 5 | Waiting on external | every 5 days: "chase or change status"; one-click reset | lead |
| 6 | Handoff | lead change → new lead gets **full task history** | new lead |
| 7 | @mention | immediate | mentioned users |
| 8 | Watched status | status change on a watched task → **batched** | collaborators |

### Anti-noise (`lib/notifications/engine.ts`)

1. **De-dupe** — a stable `dedupeKey` per trigger means repeated cron runs never
   re-send. (Verify: run the engine twice — the second run delivers 0.)
2. **Self-suppression** — never notified about your own change.
3. **Mutes** — per-user, per-trigger toggles (Settings).
4. **Batch** — all of a user's notifications in one run collapse to a single
   message per channel.
5. **Slack ≤ 1 DM/user/hour** — if throttled, it falls back to email (which
   isn't rate-limited) so the notification still lands.
6. **Empty digests are suppressed entirely.**

## Production setup

1. **Database** — set `DATABASE_URL` (Supabase or Neon), then:
   ```bash
   npm run db:migrate     # applies db/schema.sql (with invariant CHECK constraints)
   npm run db:seed        # ~20 sample tasks
   ```
2. **Auth** — Google Workspace SSO restricted to `@blanche`. Set
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; sign-in is gated to the domain in
   `lib/auth.ts`. (Unset → demo mode with the act-as switcher.)
3. **Slack** (primary) — a Slack app with `chat:write` + `im:write`. Set
   `SLACK_BOT_TOKEN`. Point **Interactivity** at `/api/slack/interactivity` for
   the one-click *"I chased today"* button. Set `SLACK_SIGNING_SECRET`.
4. **Email** (secondary) — `RESEND_API_KEY`.
5. **Cron** — `vercel.json` runs `/api/cron/notifications` hourly; that one job
   drives every scheduled trigger and fires each user's digest when their local
   clock hits Monday 08:00 / Friday 16:00.

See `.env.example` for the full list.

## Views

- **My tasks** (landing) — grouped by status, deadline-sorted.
- **Board** — kanban by status, filterable by category and lead.
- **Blocked** — the founders' Monday view: everything stuck, oldest first,
  reason visible without clicking in.
- **By category** — collapsible sections.
- **Recently completed** — last 14 days.

Every view is keyboard-first: `C` new task, `/` search, `E` edit inline,
`↑`/`↓` move, `Enter` open, `X` select. Inline editing everywhere — no modal to
change a status. Bulk-select to change category / lead / status at once. Mobile
web supports status changes and comments; full editing is desktop-first.

Import from a Google Sheet (`Category | Task | Lead | Status | Deadline | Notes`)
via `POST /api/import` (`csv` string or parsed `rows`).

## Out of scope for v1

No time tracking, Gantt, subtasks, file attachments, guest access, custom fields
or recurring tasks — and no hooks left for them.
