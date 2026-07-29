'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/client/store';
import { CATEGORIES, STATUSES, type Task } from '@/lib/client/types';
import { matchesQuery, byDeadline } from '@/lib/client/filter';
import { deadlineLabel, isUrgent } from '@/lib/client/format';
import { Avatar } from '@/components/ui';
import { PriorityBadge, StatusPill } from '@/components/editors';

export default function BoardPage() {
  const { tasks, users, query, openTask } = useApp();
  const [category, setCategory] = useState('');
  const [lead, setLead] = useState('');

  const filtered = useMemo(
    () =>
      tasks
        .filter((t) => matchesQuery(t, query, users))
        .filter((t) => (category ? t.category === category : true))
        .filter((t) => (lead ? t.leadId === lead : true))
        .sort(byDeadline),
    [tasks, users, query, category, lead],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <h1 className="text-[15px] font-semibold">Board</h1>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[12px]">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={lead} onChange={(e) => setLead(e.target.value)} className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[12px]">
          <option value="">All leads</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <span className="ml-auto text-[12px] text-[var(--color-ink-3)]">{filtered.length} tasks</span>
      </div>

      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 pb-4">
        {STATUSES.map((status) => {
          const col = filtered.filter((t) => t.status === status);
          return (
            <div key={status} className="flex w-[260px] shrink-0 flex-col rounded-lg bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold">
                <StatusPill status={status} />
                <span className="text-[var(--color-ink-3)]">{col.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {col.map((t) => <BoardCard key={t.id} task={t} onOpen={() => openTask(t.id)} users={users} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({ task, onOpen, users }: { task: Task; onOpen: () => void; users: { id: string; name: string }[] }) {
  const dl = deadlineLabel(task.deadline);
  const lead = users.find((u) => u.id === task.leadId);
  return (
    <div
      onClick={onOpen}
      className={`cursor-pointer rounded-md border border-[var(--color-border)] bg-white p-2.5 shadow-sm hover:border-[var(--color-border-strong)] ${isUrgent(task) ? 'row-urgent' : ''}`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <div onClick={(e) => e.stopPropagation()}><PriorityBadge task={task} /></div>
        {lead && <Avatar name={lead.name} size={18} />}
      </div>
      <p className="text-[13px] leading-snug">{task.title}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-ink-3)]">
        <span>{task.category}</span>
        {task.deadline && <span className={dl.overdue ? 'font-semibold text-[var(--color-alert)]' : ''}>{dl.text}</span>}
      </div>
      {(task.blockedBy || task.waitingOn) && (
        <p className="mt-1 truncate text-[11px] text-[var(--color-amber)]">· {task.blockedBy ?? task.waitingOn}</p>
      )}
    </div>
  );
}
