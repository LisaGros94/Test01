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

Send the URL and the password (see **Password** below).

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

## Password

The app sits behind a single shared password.

**Current password: `blanche`**

To change it:

1. Open a browser console and run, substituting the new password:

   ```js
   crypto.subtle.digest("SHA-256", new TextEncoder().encode("new-password"))
     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("")))
   ```

2. Paste the resulting hash into `PASSWORD_HASH` in `src/Gate.tsx`
3. Commit, push, redeploy

**This is a speed bump, not security.** The check runs in the browser, so anyone who inspects the deployed JavaScript can bypass it. It keeps casual visitors out of a demo URL. It is not adequate for anything sensitive, and it is not a substitute for authentication. Google Workspace SSO via Supabase is what replaces it.

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
2. **The password is client-side.** See above.
3. **No Slack, Drive, Calendar or Granola integrations yet.** No digests, no nudges, no meeting agenda.
4. **Seeded content is illustrative.** Workstreams, commitments and metrics are realistic examples, not real company data. Reset from the sidebar to restore them.

All four are resolved by the same next step.

---

## Next step: Supabase

The store in `src/store.tsx` is a single seam. Every read and write in the app goes through it, and no component touches storage directly — so swapping `localStorage` for Supabase does not require changing the UI.

That work delivers, in order:

1. Postgres with Row Level Security on every table, plus migrations checked into `supabase/migrations/`
2. Google auth restricted to the company Workspace domain, which removes the shared password entirely
3. Shared state, so assignments actually reach the person they are assigned to
4. Edge Functions for Slack: `/hq` capture, batched daily DMs, the Monday digest

Until then, treat the deployed app as a working prototype for deciding whether the workflows are right.
