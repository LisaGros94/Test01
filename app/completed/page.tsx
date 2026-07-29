'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/client/store';
import { TaskList } from '@/components/TaskList';
import { matchesQuery, daysSince } from '@/lib/client/filter';

// Recently completed — last 14 days, for momentum and the weekly update.
export default function CompletedPage() {
  const { tasks, users, query } = useApp();
  const done = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'Done' && daysSince(t.statusChangedAt) <= 14)
        .filter((t) => matchesQuery(t, query, users))
        .sort((a, b) => b.statusChangedAt.localeCompare(a.statusChangedAt)),
    [tasks, users, query],
  );

  return (
    <div>
      <div className="flex items-baseline justify-between px-4 py-3">
        <h1 className="text-[15px] font-semibold">Recently completed</h1>
        <span className="text-[12px] text-[var(--color-ink-3)]">{done.length} in the last 14 days</span>
      </div>
      <TaskList tasks={done} groupBy="none" emptyLabel="Nothing completed in the last 14 days yet." />
    </div>
  );
}
