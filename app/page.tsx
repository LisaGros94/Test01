'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/client/store';
import { TaskList } from '@/components/TaskList';
import { matchesQuery, byDeadline } from '@/lib/client/filter';

export default function MyTasksPage() {
  const { tasks, users, currentUserId, query } = useApp();

  const mine = useMemo(() => {
    return tasks
      .filter((t) => t.leadId === currentUserId || t.collaboratorIds.includes(currentUserId))
      .filter((t) => matchesQuery(t, query, users))
      .sort(byDeadline);
  }, [tasks, users, currentUserId, query]);

  return (
    <div>
      <div className="flex items-baseline justify-between px-4 py-3">
        <h1 className="text-[15px] font-semibold">My tasks</h1>
        <span className="text-[12px] text-[var(--color-ink-3)]">{mine.length} tasks · sorted by deadline</span>
      </div>
      <TaskList tasks={mine} groupBy="status" emptyLabel="You're all clear. Press C to add a task." />
    </div>
  );
}
