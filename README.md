# Blanche HQ

Internal operating system for Blanche. Work module v1 — commitments, tasks, and the discipline around them.

## What's here (V1, Work module)

- **Today** — the one number (% delivered on the *original* due date, trailing 8 weeks, team-wide only, never per person), overdue, due this week, shipped this week, hygiene.
- **Work** — commitments across workstreams. List and board views, drag between statuses, free-form label filters, bulk edit (reassign / reschedule / set status).
- **Mine** — everything assigned to you, sorted by due date, one screen.
- **Unowned** — anything without an owner or a date. Visible and slightly embarrassing, with a one-click Claim.
- **Commitment panel** — tasks with one-key done, comments, full activity trail, original-due-date tracking.
- **Keyboard-first** — `⌘K` search, `c` create, `/` search, `j`/`k` move, `x` select, `Enter` open, `g` then `w`/`m`/`u`/`h` to navigate.

## Design

Byredo-quiet: Jost, paper white `#FAFAFA`, ink `#141414`, one grey-blue tint, hairline rules, no shadows, no radius above 2px, no accent colour. Overdue is the only exception — muted oxblood, used nowhere else. The typeface and palette live as CSS variables in `src/index.css`.

## Run

```
npm install
npm run dev
```

Vite + React + TypeScript + Tailwind. No server.

## Current state and next steps

Data is client-side (localStorage) with seeded example content so the team can feel the workflows immediately — the store in `src/store.tsx` is a single seam, designed to be swapped for Supabase (Postgres + RLS + Google-domain SSO) without touching the UI. Next per the build order: Supabase persistence and auth, then Slack (`/hq` commands, batched DMs, Monday digest).
