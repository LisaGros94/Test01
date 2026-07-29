'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/client/store';
import { CATEGORIES, STATUSES, type Status } from '@/lib/client/types';
import { daysSince } from '@/lib/client/filter';
import { Avatar, Dropdown, MenuItem, Toast } from './ui';
import { TaskDrawer } from './TaskDrawer';
import { CommandPalette } from './CommandPalette';
import { StatusPill } from './editors';

const NAV = [
  { href: '/', label: 'My tasks', glyph: '◎' },
  { href: '/board', label: 'Board', glyph: '▦' },
  { href: '/blocked', label: 'Blocked', glyph: '⛔' },
  { href: '/category', label: 'By category', glyph: '≡' },
  { href: '/completed', label: 'Completed', glyph: '✓' },
  { href: '/settings', label: 'Settings', glyph: '⚙' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { load, loaded, query, setQuery, toast, selection, tasks, currentUserId } = useApp();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); createRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const counts = useMemo(() => {
    const mineOpen = tasks.filter((t) => (t.leadId === currentUserId || t.collaboratorIds.includes(currentUserId)) && t.status !== 'Done').length;
    const stuck = tasks.filter((t) => t.status === 'Blocked' || t.status === 'Waiting on external').length;
    const done14 = tasks.filter((t) => t.status === 'Done' && daysSince(t.statusChangedAt) <= 14).length;
    const open = tasks.filter((t) => t.status !== 'Done').length;
    return { '/': mineOpen, '/board': open, '/blocked': stuck, '/category': tasks.length, '/completed': done14 } as Record<string, number>;
  }, [tasks, currentUserId]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar pathname={pathname} counts={counts} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 sm:px-4">
          <NewTaskInput inputRef={createRef} />
          <div className="relative ml-auto w-40 sm:w-64 sm:max-w-[40vw]">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter…"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-[13px] outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
            />
            {!query && <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 sm:block">/</kbd>}
          </div>
          <CmdKButton />
          <ActAsSwitcher />
        </header>

        {selection.size > 0 && <BulkBar />}

        <main className="min-h-0 flex-1 overflow-y-auto pb-16 sm:pb-0">
          {loaded ? children : <LoadingState />}
        </main>

        <MobileNav pathname={pathname} counts={counts} />
      </div>

      <TaskDrawer />
      <CommandPalette />
      <Toast toast={toast} />
    </div>
  );
}

function Sidebar({ pathname, counts }: { pathname: string; counts: Record<string, number> }) {
  return (
    <nav className="hidden w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:flex">
      <div className="mb-5 flex items-center gap-2 px-2 pt-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-ink)] text-[13px] font-bold text-white">B</div>
        <div className="text-[14px] font-semibold tracking-tight">Blanche</div>
      </div>
      <div className="space-y-0.5">
        {NAV.map((n) => {
          const active = pathname === n.href;
          const count = counts[n.href];
          const danger = n.href === '/blocked' && count > 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] ${
                active ? 'bg-[var(--color-brand-bg)] font-medium text-[var(--color-brand)]' : 'text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              <span className={`w-4 text-center text-[13px] ${active ? '' : 'text-[var(--color-ink-3)]'}`}>{n.glyph}</span>
              <span className="flex-1">{n.label}</span>
              {count > 0 && (
                <span className={`rounded-full px-1.5 text-[11px] font-semibold ${danger ? 'bg-[var(--color-alert-bg)] text-[var(--color-alert)]' : 'text-[var(--color-ink-3)]'}`}>{count}</span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto space-y-2 px-2 pt-4 text-[11px] text-[var(--color-ink-3)]">
        <div className="grid grid-cols-2 gap-y-1">
          <span><kbd>C</kbd> new</span>
          <span><kbd>⌘K</kbd> jump</span>
          <span><kbd>/</kbd> filter</span>
          <span><kbd>E</kbd> edit</span>
        </div>
      </div>
    </nav>
  );
}

function MobileNav({ pathname, counts }: { pathname: string; counts: Record<string, number> }) {
  const items = NAV.filter((n) => n.href !== '/category');
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-[var(--color-border)] bg-[var(--color-surface)] sm:hidden">
      {items.map((n) => {
        const active = pathname === n.href;
        const count = counts[n.href];
        return (
          <Link key={n.href} href={n.href} className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${active ? 'text-[var(--color-brand)]' : 'text-[var(--color-ink-3)]'}`}>
            <span className="text-[15px]">{n.glyph}</span>
            {n.label.split(' ')[0]}
            {n.href === '/blocked' && count > 0 && <span className="absolute right-[22%] top-1 h-1.5 w-1.5 rounded-full bg-[var(--color-alert)]" />}
          </Link>
        );
      })}
    </nav>
  );
}

function CmdKButton() {
  const dispatch = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  return (
    <button onClick={dispatch} title="Command palette" className="hidden items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-[12px] text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)] sm:flex">
      <kbd>⌘K</kbd>
    </button>
  );
}

function NewTaskInput({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const createTask = useApp((s) => s.createTask);
  const openTask = useApp((s) => s.openTask);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--color-ink-3)]">+</span>
      <input
        ref={inputRef}
        placeholder="New task…"
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
        className="w-44 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-1.5 pl-7 pr-2.5 text-[13px] outline-none transition focus:w-64 focus:border-[var(--color-brand)] focus:bg-white sm:w-56"
      />
    </div>
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
        <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-1.5 py-1 text-[12px] hover:bg-[var(--color-surface-2)]">
          {me && <Avatar name={me.name} size={22} />}
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
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-brand-bg)] px-4 py-2 text-[12px] anim-fade">
      <span className="font-medium text-[var(--color-brand)]">{selection.size} selected</span>
      <Dropdown width={200} trigger={() => <span className="rounded-md border border-[var(--color-border-strong)] bg-white px-2 py-1">Status ▾</span>}>
        {(close) => (<>{STATUSES.filter((s) => s !== 'Blocked' && s !== 'Waiting on external').map((s: Status) => (
          <MenuItem key={s} onClick={() => { bulkPatch({ status: s }); close(); }}><StatusPill status={s} /></MenuItem>
        ))}<p className="px-2 pt-1 text-[10px] text-[var(--color-ink-3)]">Blocked / Waiting need a reason — set on the task.</p></>)}
      </Dropdown>
      <Dropdown width={200} trigger={() => <span className="rounded-md border border-[var(--color-border-strong)] bg-white px-2 py-1">Category ▾</span>}>
        {(close) => (<>{CATEGORIES.map((c) => (<MenuItem key={c} onClick={() => { bulkPatch({ category: c }); close(); }}>{c}</MenuItem>))}</>)}
      </Dropdown>
      <Dropdown width={200} trigger={() => <span className="rounded-md border border-[var(--color-border-strong)] bg-white px-2 py-1">Lead ▾</span>}>
        {(close) => (<>{users.map((u) => (<MenuItem key={u.id} onClick={() => { bulkPatch({ leadId: u.id }); close(); }}><Avatar name={u.name} /> {u.name}</MenuItem>))}</>)}
      </Dropdown>
      <button onClick={clearSelection} className="ml-auto text-[var(--color-ink-2)] hover:text-[var(--color-ink)]">Clear</button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-[var(--color-surface-2)]" style={{ opacity: 1 - i * 0.13 }} />
      ))}
    </div>
  );
}
