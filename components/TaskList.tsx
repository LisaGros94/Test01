'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/client/store';
import { CATEGORIES, type Category, type Status, type Task } from '@/lib/client/types';
import { STATUS_ORDER } from '@/lib/client/format';
import { byDeadline } from '@/lib/client/filter';
import { TaskRow } from './TaskRow';

type GroupBy = 'status' | 'category' | 'none';

/**
 * The workhorse list: grouped, deadline-sorted, keyboard-first.
 *   ↑ / ↓  move focus     E  edit title inline     Enter  open     X  select
 * Category groups are collapsible; a single keyboard handler walks only the
 * rows that are actually visible.
 */
export function TaskList({
  tasks,
  groupBy = 'status',
  emptyLabel = 'Nothing here.',
}: {
  tasks: Task[];
  groupBy?: GroupBy;
  emptyLabel?: string;
}) {
  const openTask = useApp((s) => s.openTask);
  const toggleSelect = useApp((s) => s.toggleSelect);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Build the ordered groups, then the flat list of *visible* tasks for nav.
  const { sections, visible } = useMemo(() => {
    const sections: { key: string; label: string; items: Task[] }[] = [];
    if (groupBy === 'none') {
      sections.push({ key: 'all', label: '', items: tasks });
    } else if (groupBy === 'status') {
      for (const s of STATUS_ORDER) {
        const items = tasks.filter((t) => t.status === s);
        if (items.length) sections.push({ key: s, label: s, items });
      }
    } else {
      for (const c of CATEGORIES) {
        const items = tasks.filter((t) => t.category === c).sort(byDeadline);
        sections.push({ key: c, label: c, items });
      }
    }
    const visible = sections.filter((s) => !collapsed.has(s.key)).flatMap((s) => s.items);
    return { sections, visible };
  }, [tasks, groupBy, collapsed]);

  useEffect(() => {
    if (focus > visible.length - 1) setFocus(Math.max(0, visible.length - 1));
  }, [visible.length, focus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editingId) return;
      const t = visible[focus];
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => Math.min(visible.length - 1, f + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => Math.max(0, f - 1)); }
      else if ((e.key === 'e' || e.key === 'E') && t) { e.preventDefault(); setEditingId(t.id); }
      else if (e.key === 'Enter' && t) { e.preventDefault(); openTask(t.id); }
      else if ((e.key === 'x' || e.key === 'X') && t) { e.preventDefault(); toggleSelect(t.id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, focus, editingId, openTask, toggleSelect]);

  if (tasks.length === 0) {
    return <div className="px-3 py-10 text-center text-[13px] text-[var(--color-ink-3)]">{emptyLabel}</div>;
  }

  const row = (t: Task) => {
    const idx = visible.indexOf(t);
    return (
      <TaskRow
        key={t.id}
        task={t}
        focused={idx === focus && idx >= 0}
        editing={editingId === t.id}
        onOpen={openTask}
        onEditDone={() => setEditingId(null)}
        showCategory={groupBy !== 'category'}
      />
    );
  };

  if (groupBy === 'none') return <div>{visible.map(row)}</div>;

  const toggle = (key: string) =>
    setCollapsed((c) => {
      const n = new Set(c);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  return (
    <div>
      {sections.map((sec) => {
        const isCollapsed = collapsed.has(sec.key);
        return (
          <section key={sec.key}>
            <button
              onClick={() => groupBy === 'category' && toggle(sec.key)}
              className={`sticky top-0 z-10 flex w-full items-center gap-2 bg-[var(--color-bg)]/95 px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-2)] backdrop-blur ${groupBy === 'category' ? 'hover:text-[var(--color-ink)]' : ''}`}
            >
              {groupBy === 'category' && <span className="text-[var(--color-ink-3)]">{isCollapsed ? '▸' : '▾'}</span>}
              {sec.label as Status | Category}
              <span className="text-[var(--color-ink-3)]">{sec.items.length}</span>
            </button>
            {!isCollapsed && sec.items.map(row)}
          </section>
        );
      })}
    </div>
  );
}
