'use client';

import { create } from 'zustand';
import type { Task, User, TaskPatchInput } from './types';

interface AppState {
  tasks: Task[];
  users: User[];
  currentUserId: string;
  demoMode: boolean;
  loaded: boolean;

  // UI
  selection: Set<string>;
  query: string;
  toast: { kind: 'error' | 'ok'; text: string } | null;
  openTaskId: string | null;

  load: () => Promise<void>;
  setCurrentUser: (userId: string) => Promise<void>;

  createTask: (title: string) => Promise<Task | null>;
  patchTask: (id: string, patch: TaskPatchInput) => Promise<boolean>;
  bulkPatch: (patch: { category?: string; leadId?: string; status?: string }) => Promise<void>;
  chase: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setQuery: (q: string) => void;
  flash: (kind: 'error' | 'ok', text: string) => void;
  userById: (id: string) => User | undefined;
  openTask: (id: string | null) => void;
  /** If a blocker reason is actually a task-id reference, show that task's title. */
  refLabel: (ref: string | null) => string | null;
}

export const useApp = create<AppState>((set, get) => ({
  tasks: [],
  users: [],
  currentUserId: 'lisa',
  demoMode: true,
  loaded: false,
  selection: new Set(),
  query: '',
  toast: null,
  openTaskId: null,

  async load() {
    const [tasksRes, sessionRes] = await Promise.all([
      fetch('/api/tasks').then((r) => r.json()),
      fetch('/api/session').then((r) => r.json()),
    ]);
    set({
      tasks: tasksRes.tasks,
      users: sessionRes.users,
      currentUserId: sessionRes.currentUserId,
      demoMode: sessionRes.demoMode,
      loaded: true,
    });
  },

  async setCurrentUser(userId) {
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    set({ currentUserId: userId });
  },

  async createTask(title) {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      get().flash('error', 'Could not create task');
      return null;
    }
    const { task } = await res.json();
    set((s) => ({ tasks: [task, ...s.tasks] }));
    return task;
  },

  async patchTask(id, patch) {
    const prev = get().tasks;
    // Optimistic update.
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } as Task : t)) }));
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Update failed' }));
      set({ tasks: prev }); // rollback
      get().flash('error', error ?? 'Update failed');
      return false;
    }
    const { task } = await res.json();
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
    return true;
  },

  async bulkPatch(patch) {
    const ids = [...get().selection];
    if (!ids.length) return;
    const res = await fetch('/api/tasks/bulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids, ...patch }),
    });
    if (res.ok) {
      const { updated, count } = await res.json();
      const map = new Map<string, Task>(updated.map((t: Task) => [t.id, t]));
      set((s) => ({
        tasks: s.tasks.map((t) => map.get(t.id) ?? t),
        selection: new Set(),
      }));
      get().flash('ok', `Updated ${count} task${count === 1 ? '' : 's'}`);
    } else {
      get().flash('error', 'Bulk update failed');
    }
  },

  async chase(id) {
    const res = await fetch(`/api/tasks/${id}/chase`, { method: 'POST' });
    if (res.ok) {
      const { task } = await res.json();
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
      get().flash('ok', 'Marked as chased today — clock reset');
    }
  },

  async deleteTask(id) {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  toggleSelect(id) {
    set((s) => {
      const next = new Set(s.selection);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selection: next };
    });
  },
  clearSelection() {
    set({ selection: new Set() });
  },
  setQuery(q) {
    set({ query: q });
  },
  flash(kind, text) {
    set({ toast: { kind, text } });
    setTimeout(() => set({ toast: null }), 3200);
  },
  userById(id) {
    return get().users.find((u) => u.id === id);
  },
  openTask(id) {
    set({ openTaskId: id });
  },
  refLabel(ref) {
    if (!ref) return ref;
    const t = get().tasks.find((x) => x.id === ref);
    return t ? `↳ ${t.title}` : ref;
  },
}));
