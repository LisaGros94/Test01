'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/client/store';
import { matchesQuery } from '@/lib/client/filter';
import { StatusPill } from './editors';
import { Avatar } from './ui';

type Cmd = { id: string; label: string; hint?: string; run: () => void; kind: 'action' | 'task' | 'nav' };

/**
 * ⌘K / Ctrl-K from anywhere. Search every task and jump straight to it, or run
 * a quick action — new task, switch view, act as a teammate. The "couple of
 * clicks" path is actually zero: type and hit ↵.
 */
export function CommandPalette() {
  const router = useRouter();
  const { tasks, users, openTask, createTask, setCurrentUser, demoMode, userById } = useApp();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const commands = useMemo<Cmd[]>(() => {
    const nav: Cmd[] = [
      { id: 'n-home', kind: 'nav', label: 'Go to My tasks', run: () => router.push('/') },
      { id: 'n-board', kind: 'nav', label: 'Go to Board', run: () => router.push('/board') },
      { id: 'n-blocked', kind: 'nav', label: 'Go to Blocked & waiting', run: () => router.push('/blocked') },
      { id: 'n-cat', kind: 'nav', label: 'Go to By category', run: () => router.push('/category') },
      { id: 'n-done', kind: 'nav', label: 'Go to Recently completed', run: () => router.push('/completed') },
      { id: 'n-settings', kind: 'nav', label: 'Go to Settings', run: () => router.push('/settings') },
    ];
    const actions: Cmd[] = [];
    if (q.trim()) {
      actions.push({
        id: 'a-create',
        kind: 'action',
        label: `Create task “${q.trim()}”`,
        hint: '↵',
        run: async () => {
          const t = await createTask(q.trim());
          if (t) openTask(t.id);
        },
      });
    }
    const people: Cmd[] = demoMode
      ? users.map((u) => ({ id: `p-${u.id}`, kind: 'action' as const, label: `Act as ${u.name}`, run: () => setCurrentUser(u.id) }))
      : [];
    const taskCmds: Cmd[] = tasks
      .filter((t) => matchesQuery(t, q, users))
      .slice(0, 8)
      .map((t) => ({
        id: `t-${t.id}`,
        kind: 'task' as const,
        label: t.title,
        hint: userById(t.leadId)?.name,
        run: () => openTask(t.id),
      }));

    const all = [...actions, ...taskCmds];
    if (!q.trim()) all.push(...nav);
    else all.push(...people.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())), ...nav.filter((n) => n.label.toLowerCase().includes(q.toLowerCase())));
    return all;
  }, [q, tasks, users, demoMode, router, createTask, openTask, setCurrentUser, userById]);

  useEffect(() => {
    if (active > commands.length - 1) setActive(Math.max(0, commands.length - 1));
  }, [commands.length, active]);

  if (!open) return null;

  const choose = (c: Cmd) => {
    c.run();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/20 pt-[12vh] anim-fade" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-white shadow-[var(--shadow-pop)] anim-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(commands.length - 1, a + 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            else if (e.key === 'Enter' && commands[active]) { e.preventDefault(); choose(commands[active]); }
          }}
          placeholder="Search tasks or type a command…"
          className="w-full border-b border-[var(--color-border)] px-4 py-3 text-[14px] outline-none placeholder:text-[var(--color-ink-3)]"
        />
        <div className="max-h-[52vh] overflow-y-auto p-1.5">
          {commands.length === 0 && <div className="px-3 py-6 text-center text-[13px] text-[var(--color-ink-3)]">No matches.</div>}
          {commands.map((c, i) => {
            const t = c.kind === 'task' ? tasks.find((x) => `t-${x.id}` === c.id) : null;
            return (
              <button
                key={c.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(c)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] ${i === active ? 'bg-[var(--color-surface-2)]' : ''}`}
              >
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[11px] ${c.kind === 'action' ? 'bg-[var(--color-brand-bg)] text-[var(--color-brand)]' : 'text-[var(--color-ink-3)]'}`}>
                  {c.kind === 'action' ? '+' : c.kind === 'nav' ? '→' : '#'}
                </span>
                <span className="min-w-0 flex-1 truncate">{c.label}</span>
                {t && <StatusPill status={t.status} />}
                {c.hint && <span className="shrink-0 text-[11px] text-[var(--color-ink-3)]">{c.hint}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 border-t border-[var(--color-border)] px-3 py-1.5 text-[11px] text-[var(--color-ink-3)]">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
