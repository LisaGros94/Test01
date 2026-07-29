// Picks the storage backend. Postgres when DATABASE_URL is set (production /
// Supabase / Neon), otherwise the seeded in-memory store so the app runs and
// every view is populated on first clone with zero setup.

import type { Store } from './store';
import { memoryStore } from './memory';

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  if (process.env.DATABASE_URL) {
    // Lazily require so the pg client is never loaded in the demo path.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { postgresStore } = require('./postgres') as typeof import('./postgres');
    cached = postgresStore();
  } else {
    cached = memoryStore;
  }
  return cached;
}
