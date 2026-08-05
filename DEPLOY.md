# Deploying Blanche HQ

Everything needed to get this live. Read the first section before choosing a route.

---

## Which route to take

| Route | Time | Cost | Use when |
|---|---|---|---|
| **A — Lovable via GitHub** | ~10 min | Paid Lovable plan | You want Lovable's preview URLs and visual editing |
| **B — Static host** (Netlify / Cloudflare Pages / Vercel) | ~2 min | Free | You just want it live today |

Both serve the same app. Route B is a drag-and-drop of the `dist/` folder — no account wrangling, no plan required. Route A is the one the project was designed around and gives Lovable's editor on top.

---

## Route A — Lovable via GitHub

Lovable builds and serves a Vite React SPA and **syncs only the repository's default branch**. That single fact drives every step below.

### 1. Confirm `main` is the default branch

The repo's default branch must be `main`, which holds the app. To check or change:

**GitHub → repo → Settings → General → Default branch → pencil icon → `main` → Update**

If the default branch is still an older `claude/...` branch, Lovable will build that instead and the deploy will fail. This is a repo-admin setting and the single most common reason the first deploy breaks.

### 2. Connect Lovable

1. Sign in at [lovable.dev](https://lovable.dev)
2. Create a project → **Connect to GitHub**
3. Authorise the Lovable GitHub App and grant it access to this repository
4. Import the repository

GitHub sync requires a paid Lovable plan. The repo is already Lovable-shaped — standard Vite layout, `src/`, no monorepo, no custom build steps beyond `vite build` — so no configuration should be needed.

### 3. Publish

Lovable builds and gives a preview URL. Hit **Publish** for the shareable link. A custom domain can be attached in Lovable's settings.

### 4. Share with the team

Send the URL. There is no login — see **Access** below.

### Working with Lovable afterwards

- Every push to `main` triggers a Lovable rebuild automatically.
- Sync is two-way: edits made in Lovable's editor come back to the repo.
- Avoid editing the same files in Lovable and in the repo in the same session. The sync merges, but conflicts are real.
- Lovable cannot deploy or test Supabase Edge Functions. Those deploy separately with the Supabase CLI (`supabase functions deploy <name>`), which matters once the backend lands.

---

## Route B — Any static host

The app is a static SPA. A production build is in `dist/`.

**Netlify:** open [app.netlify.com/drop](https://app.netlify.com/drop) and drag the `dist` folder onto the page. Live in about thirty seconds.

**Cloudflare Pages / Vercel / GitHub Pages:** point them at this repo with:
- Build command: `npm run build`
- Output directory: `dist`
- No environment variables required

To rebuild `dist` yourself:

```bash
npm install
npm run build
```

### One caveat for static hosts

Routing uses `HashRouter`, so URLs look like `example.com/#/work`. This is deliberate: it means no server-side rewrite rules are needed and the app works on any host, including a bare file drop.

---

## Access

**There is no login.** Anyone with the URL can open the app.

That is acceptable only because the app contains no real company data — the content is seeded examples, and nothing a teammate types is stored anywhere but their own browser. Treat the deployed URL as public and do not put anything confidential into it.

If the link needs to stay private before real authentication lands, use hosting-level protection rather than anything in the app:

- **Netlify:** Site settings → Access control → password protection (paid feature)
- **Cloudflare Pages:** Cloudflare Access in front of the deployment
- **Vercel:** Deployment Protection

These run at the edge, before the app loads, so they cannot be bypassed by reading the client-side JavaScript.

Proper access control is Google Workspace SSO restricted to the company domain, which arrives with Supabase. That is what makes the app safe to hold anything real.

---

## What is in this build

| Area | Contents |
|---|---|
| **Today** | On-time delivery rate against original due dates with an eight-week trend, focus KPI tiles, workstream health table, overdue and upcoming lists, shipped this week, hygiene checks |
| **Work** | Workstreams → commitments → tasks. List and kanban views, drag between statuses, label filters, bulk edit, keyboard navigation |
| **Mine** | Everything assigned to you, grouped by urgency |
| **Unowned** | Commitments missing an owner or a date, with one-click claim |
| **Numbers** | Eight metrics with definitions, targets, owners, twelve-week sparklines, inline weekly entry, staleness flags |
| **Knowledge** | Curated links out to handbook, directory, policies, payroll by jurisdiction, equity, legal — each with a named owner |

Keyboard: `⌘K` search · `c` create · `j`/`k` move · `x` select · `Enter` open · `g` then `h`/`w`/`m`/`u`/`n`/`k` to navigate.

---

## Known limitations

Be explicit about these when sharing the link.

1. **Data is per-browser.** State lives in `localStorage`. Every person sees the same seeded example content, and their edits stay on their own machine. Nothing syncs between teammates. This is a demo of the workflows, not yet a shared system of record.
2. **There is no login.** Anyone with the URL can open it. See **Access** above.
3. **No Slack, Drive, Calendar or Granola integrations yet.** No digests, no nudges, no meeting agenda.
4. **Seeded content is illustrative.** Workstreams, commitments and metrics are realistic examples, not real company data. Reset from the sidebar to restore them.

All four are resolved by the same next step.

---

## Next step: Supabase

The store in `src/store.tsx` is a single seam. Every read and write in the app goes through it, and no component touches storage directly — so swapping `localStorage` for Supabase does not require changing the UI.

That work delivers, in order:

1. Postgres with Row Level Security on every table, plus migrations checked into `supabase/migrations/`
2. Google auth restricted to the company Workspace domain, giving the app real access control for the first time
3. Shared state, so assignments actually reach the person they are assigned to
4. Edge Functions for Slack: `/hq` capture, batched daily DMs, the Monday digest

Until then, treat the deployed app as a working prototype for deciding whether the workflows are right.
