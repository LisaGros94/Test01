// In-memory Store — the default backend when DATABASE_URL is not set. Seeded
// from lib/data/seed so every view is populated on first run and the demo is
// fully interactive without a database. State lives for the life of the server
// process (module singleton), which is exactly what a local demo wants.

import type {
  Activity,
  Comment,
  NotificationPref,
  SentNotification,
  Task,
  User,
} from '../types';
import { buildSeed } from './seed';
import type { Store } from './store';

interface Db {
  tasks: Map<string, Task>;
  activity: Activity[];
  comments: Comment[];
  users: Map<string, User>;
  prefs: NotificationPref[];
  sent: SentNotification[];
}

// Persist across Next.js hot reloads in dev via globalThis.
const g = globalThis as unknown as { __blancheDb?: Db };

function init(): Db {
  const seed = buildSeed(new Date());
  return {
    tasks: new Map(seed.tasks.map((t) => [t.id, t])),
    activity: seed.activity,
    comments: seed.comments,
    users: new Map(seed.users.map((u) => [u.id, u])),
    prefs: seed.prefs,
    sent: [],
  };
}

function db(): Db {
  if (!g.__blancheDb) g.__blancheDb = init();
  return g.__blancheDb;
}

const clone = <T>(v: T): T => (v == null ? v : JSON.parse(JSON.stringify(v)));

export const memoryStore: Store = {
  async allTasks() {
    return clone([...db().tasks.values()]);
  },
  async getTask(id) {
    return clone(db().tasks.get(id) ?? null);
  },
  async putTask(t) {
    db().tasks.set(t.id, clone(t));
  },
  async deleteTask(id) {
    db().tasks.delete(id);
  },

  async allActivity() {
    return clone(db().activity);
  },
  async activityForTask(id) {
    return clone(db().activity.filter((a) => a.taskId === id));
  },
  async putActivity(a) {
    db().activity.push(clone(a));
  },

  async commentsForTask(id) {
    return clone(db().comments.filter((c) => c.taskId === id));
  },
  async putComment(c) {
    db().comments.push(clone(c));
  },

  async allUsers() {
    return clone([...db().users.values()]);
  },
  async getUser(id) {
    return clone(db().users.get(id) ?? null);
  },

  async allPrefs() {
    return clone(db().prefs);
  },
  async putPref(p) {
    const list = db().prefs;
    const i = list.findIndex((x) => x.userId === p.userId && x.trigger === p.trigger);
    if (i >= 0) list[i] = clone(p);
    else list.push(clone(p));
  },

  async allSent() {
    return clone(db().sent);
  },
  async putSent(rows) {
    db().sent.push(...clone(rows));
  },
};
