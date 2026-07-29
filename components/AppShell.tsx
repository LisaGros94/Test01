'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/client/store';
import { CATEGORIES, STATUSES, type Status } from '@/lib/client/types';
import { Avatar, Dropdown, MenuItem, Toast } from './ui';
import { TaskDrawer } from './TaskDrawer';
import { StatusPill } from './editors';

const NAV = [
  { href: '/', label: 'My tasks', hint: 'Your open work' },
  { href: '/board', label: 'Board', hint: 'Kanban by status' },
  { href: '/blocked', label: 'Blocked', hint: 'Everything stuck' },
  { href: '/category', label: 'By category', hint: 'All eight areas' },
  { href: '/completed', label: 'Recently completed', hint: 'Last 14 days' },
  { href: '/settings', label: 'Settings', hint: 'Mutes & digests' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { load, loaded, query, setQuery, toast, selection } = useApp();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  // Global shortcuts: C = new task, / = search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (typing) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        createRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar pathname={pathname} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-4 py-2.5">
          <NewTaskInput inputRef={createRef} />
          <div className="relative ml-auto w-64 max-w-[40vw]">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--color-ink-3)]"
            />
            {!query && <kbd className="absolute right-2 top-1/2 -translate-y-1/2">/</kbd>}
          </div>
          <ActAsSwitcher />
        </header>

        {selection.size > 0 && <BulkBar />}

        <main className="min-h-0 flex-1 overflow-y-auto">
          {loaded ? children : <div className="p-8 text-[13px] text-[var(--color-ink-3)]">Loading…</div>}
        </main>
      </div>

      <TaskDrawer />
      <Toast toast={toast} />
    </div>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:flex">
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-ink)] text-[13px] font-bold text-white">B</div>
        <div className="text-[14px] font-semibold tracking-tight">Blanche</div>
      </div>
      <div className="space-y-0.5">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`block rounded-md px-2.5 py-1.5 text-[13px] ${
                active ? 'bg-[var(--color-surface-2)] font-medium text-[var(--color-ink)]' : 'text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto space-y-2 px-2 pt-4 text-[11px] text-[var(--color-ink-3)]">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span><kbd>C</kbd> new</span>
          <span><kbd>/</kbd> search</span>
          <span><kbd>E</kbd> edit</span>
          <span><kbd>↑↓</kbd> move</span>
        </div>
      </div>
    </nav>
  );
}

function NewTaskInput({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const createTask = useApp((s) => s.createTask);
  const openTask = useApp((s) => s.openTask);
  return (
    <input
      ref={inputRef}
      placeholder="+ New task (just a title)…"
      onKeyDown={async (e) => {
        if (e.key === 'Enter') {
          const el = e.currentTarget;
          const title = el.value.trim();
          if (!title) return;
          el.value = '';
          const task = await createTask(title);
          if (task) openTask(task.id);
        }
      }}
      className="w-72 max-w-[40vw] rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--color-ink-3)]"
    />
  );
}

function ActAsSwitcher() {
  const { users, currentUserId, setCurrentUser, demoMode } = useApp();
  const me = users.find((u) => u.id === currentUserId);
  return (
    <Dropdown
      align="right"
      width={220}
      trigger={() => (
        <span className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-[12px] hover:bg-[var(--color-surface-2)]">
          {me && <Avatar name={me.name} />}
          <span className="hidden md:inline">{me?.name ?? '—'}</span>
        </span>
      )}
    >
      {(close) => (
        <>
          <p className="px-2 py-1 text-[11px] text-[var(--color-ink-3)]">{demoMode ? 'Acting as (demo)' : 'Signed in'}</p>
          {users.map((u) => (
            <MenuItem key={u.id} active={u.id === currentUserId} onClick={() => { if (demoMode) setCurrentUser(u.id); close(); }}>
              <Avatar name={u.name} /> <span>{u.name}</span>
              {u.isFounder && <span className="ml-auto text-[10px] text-[var(--color-ink-3)]">founder</span>}
            </MenuItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}

function BulkBar() {
  const { selection, clearSelection, bulkPatch, users } = useApp();
  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-[12px]">
      <span className="font-medium">{selection.size} selected</span>
      <Dropdown width={200} trigger={() => <span className="rounded border border-[var(--color-border-strong)] bg-white px-2 py-1">Set status ▾</span>}>
        {(close) => (<>{STATUSES.filter((s) => s !== 'Blocked' && s !== 'Waiting on external').map((s: Status) => (
          <MenuItem key={s} onClick={() => { bulkPatch({ status: s }); close(); }}><StatusPill status={s} /></MenuItem>
        ))}<p className="px-2 pt-1 text-[10px] text-[var(--color-ink-3)]">Blocked / Waiting need a reason — set those on the task.</p></>)}
      </Dropdown>
      <Dropdown width={200} trigger={() => <span className="rounded border border-[var(--color-border-strong)] bg-white px-2 py-1">Set category ▾</span>}>
        {(close) => (<>{CATEGORIES.map((c) => (<MenuItem key={c} onClick={() => { bulkPatch({ category: c }); close(); }}>{c}</MenuItem>))}</>)}
      </Dropdown>
      <Dropdown width={200} trigger={() => <span className="rounded border border-[var(--color-border-strong)] bg-white px-2 py-1">Set lead ▾</span>}>
        {(close) => (<>{users.map((u) => (<MenuItem key={u.id} onClick={() => { bulkPatch({ leadId: u.id }); close(); }}><Avatar name={u.name} /> {u.name}</MenuItem>))}</>)}
      </Dropdown>
      <button onClick={clearSelection} className="ml-auto text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">Clear</button>
    </div>
  );
}
