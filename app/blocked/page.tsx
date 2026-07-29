'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/client/store';
import { matchesQuery } from '@/lib/client/filter';
import { stuckDays } from '@/lib/client/format';
import { Avatar } from '@/components/ui';
import { StatusPill } from '@/components/editors';

// The founders' Monday view: everything stuck, oldest first, reason visible
// without clicking in.
export default function BlockedPage() {
  const { tasks, users, query, openTask, chase, refLabel } = useApp();

  const stuck = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'Blocked' || t.status === 'Waiting on external')
        .filter((t) => matchesQuery(t, query, users))
        .sort((a, b) => stuckDays(b) - stuckDays(a)),
    [tasks, users, query],
  );

  return (
    <div>
      <div className="flex items-baseline justify-between px-4 py-3">
        <h1 className="text-[15px] font-semibold">Blocked & waiting</h1>
        <span className="text-[12px] text-[var(--color-ink-3)]">{stuck.length} stuck · oldest first</span>
      </div>

      {stuck.length === 0 && <div className="px-4 py-10 text-center text-[13px] text-[var(--color-ink-3)]">Nothing is stuck. Rare and good.</div>}

      <div>
        {stuck.map((t) => {
          const days = stuckDays(t);
          const lead = users.find((u) => u.id === t.leadId);
          const escalated = days >= 3;
          return (
            <div
              key={t.id}
              onClick={() => openTask(t.id)}
              className={`flex cursor-pointer items-center gap-3 border-b border-[var(--color-border)] px-4 py-2.5 hover:bg-[var(--color-surface-2)] ${escalated ? 'row-urgent' : ''}`}
            >
              <div className="w-12 shrink-0 text-center">
                <div className={`text-[16px] font-semibold ${escalated ? 'text-[var(--color-alert)]' : 'text-[var(--color-ink-2)]'}`}>{days}d</div>
                <div className="text-[10px] uppercase text-[var(--color-ink-3)]">stuck</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{t.title}</span>
                  <StatusPill status={t.status} />
                </div>
                <p className="truncate text-[12px] text-[var(--color-ink-2)]">
                  {t.status === 'Blocked' ? 'Blocked by' : 'Waiting on'}: <span className="text-[var(--color-ink)]">{t.status === 'Blocked' ? refLabel(t.blockedBy) : t.waitingOn}</span>
                  <span className="text-[var(--color-ink-3)]"> · {t.category}</span>
                </p>
              </div>
              {t.status === 'Waiting on external' && (
                <button
                  onClick={(e) => { e.stopPropagation(); chase(t.id); }}
                  className="shrink-0 rounded border border-[var(--color-border-strong)] bg-white px-2 py-1 text-[11px] hover:bg-[var(--color-surface-2)]"
                >
                  I chased today
                </button>
              )}
              {lead && <Avatar name={lead.name} title={`Lead: ${lead.name}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
