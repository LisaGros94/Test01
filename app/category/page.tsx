'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/client/store';
import { TaskList } from '@/components/TaskList';
import { matchesQuery } from '@/lib/client/filter';

export default function CategoryPage() {
  const { tasks, users, query } = useApp();
  const filtered = useMemo(() => tasks.filter((t) => matchesQuery(t, query, users)), [tasks, users, query]);

  return (
    <div>
      <div className="flex items-baseline justify-between px-4 py-3">
        <h1 className="text-[15px] font-semibold">By category</h1>
        <span className="text-[12px] text-[var(--color-ink-3)]">Click a heading to collapse</span>
      </div>
      <TaskList tasks={filtered} groupBy="category" />
    </div>
  );
}
