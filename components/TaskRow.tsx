'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/client/store';
import type { Task } from '@/lib/client/types';
import { deadlineLabel, isUrgent, stuckDays } from '@/lib/client/format';
import { StatusMenu, LeadPicker, CategoryPicker, PriorityBadge, DeadlineEditor } from './editors';

export function TaskRow({
  task,
  focused,
  editing,
  onOpen,
  onEditDone,
  showCategory = true,
}: {
  task: Task;
  focused?: boolean;
  editing?: boolean;
  onOpen: (id: string) => void;
  onEditDone?: () => void;
  showCategory?: boolean;
}) {
  const { selection, toggleSelect, patchTask, refLabel } = useApp();
  const selected = selection.has(task.id);
  const urgent = isUrgent(task);
  // Done tasks never read as overdue, even if their deadline is in the past.
  const dl = task.status === 'Done'
    ? { text: task.deadline ? task.deadline.slice(5) : '—', overdue: false, soon: false }
    : deadlineLabel(task.deadline);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focused) rowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [focused]);

  const [draft, setDraft] = useState(task.title);
  useEffect(() => setDraft(task.title), [task.title]);

  const reason =
    task.status === 'Blocked' ? refLabel(task.blockedBy) : task.status === 'Waiting on external' ? task.waitingOn : null;

  return (
    <div
      ref={rowRef}
      onClick={() => onOpen(task.id)}
      className={`group flex items-center gap-3 border-b border-[var(--color-border)] px-3 py-2 cursor-pointer hover:bg-[var(--color-surface-2)] ${
        focused ? 'focus-row' : ''
      } ${urgent ? 'row-urgent' : ''}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => toggleSelect(task.id)}
        className={`h-3.5 w-3.5 shrink-0 accent-[var(--color-ink)] ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />

      {/* One-click complete / reopen. */}
      <button
        title={task.status === 'Done' ? 'Reopen' : 'Mark done'}
        onClick={(e) => { e.stopPropagation(); patchTask(task.id, { status: task.status === 'Done' ? 'In progress' : 'Done' }); }}
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] transition ${
          task.status === 'Done'
            ? 'border-[var(--color-green)] bg-[var(--color-green)] text-white'
            : 'border-[var(--color-border-strong)] text-transparent hover:border-[var(--color-green)] hover:text-[var(--color-green)]'
        }`}
      >
        ✓
      </button>

      <div onClick={(e) => e.stopPropagation()}>
        <PriorityBadge task={task} />
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => {
              if (draft.trim() && draft !== task.title) patchTask(task.id, { title: draft.trim() });
              onEditDone?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (draft.trim() && draft !== task.title) patchTask(task.id, { title: draft.trim() });
                onEditDone?.();
              }
              if (e.key === 'Escape') {
                setDraft(task.title);
                onEditDone?.();
              }
            }}
            className="w-full rounded border border-[var(--color-ink-3)] px-1.5 py-0.5 text-[13.5px] outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className={`truncate ${task.status === 'Done' ? 'text-[var(--color-ink-3)] line-through' : ''}`}>
              {task.title}
            </span>
            {reason && (
              <span className="truncate text-[11px] text-[var(--color-ink-3)]" title={reason}>
                · {reason}
                {task.status !== 'In progress' && ` (${stuckDays(task)}d)`}
              </span>
            )}
          </div>
        )}
      </div>

      {showCategory && (
        <div className="hidden shrink-0 sm:block" onClick={(e) => e.stopPropagation()}>
          <CategoryPicker task={task} />
        </div>
      )}

      <div className="hidden w-16 shrink-0 text-right sm:block" onClick={(e) => e.stopPropagation()}>
        <span className={`text-[12px] ${dl.overdue ? 'font-semibold text-[var(--color-alert)]' : dl.soon ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-3)]'}`}>
          {dl.text}
        </span>
      </div>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <LeadPicker task={task} />
      </div>

      <div className="w-[132px] shrink-0" onClick={(e) => e.stopPropagation()}>
        <StatusMenu task={task} />
      </div>
    </div>
  );
}

export function DeadlineCell({ task }: { task: Task }) {
  return <DeadlineEditor task={task} />;
}
