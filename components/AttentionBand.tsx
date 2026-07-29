'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/client/store';
import type { Task } from '@/lib/client/types';
import { daysUntil } from '@/lib/client/format';
import { daysSince } from '@/lib/client/filter';

/**
 * "Needs you" — the zero-click answer to what to do next. Everything here is
 * actionable in one click: complete an overdue task, chase an external party,
 * or open a stuck one. If nothing needs attention, it says so and gets out of
 * the way.
 */
export function AttentionBand() {
  const { tasks, currentUserId, patchTask, chase, openTask } = useApp();

  const groups = useMemo(() => {
    const mine = tasks.filter((t) => t.leadId === currentUserId);
    const overdue = mine
      .filter((t) => t.deadline && t.status !== 'Done' && daysUntil(t.deadline) < 0)
      .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1));
    const toChase = mine.filter(
      (t) => t.status === 'Waiting on external' && daysSince(t.lastChasedAt ?? t.statusChangedAt) >= 5,
    );
    const drifting = mine.filter((t) => t.status === 'In progress' && daysSince(t.lastTouched) >= 14);
    const blockedOnYou = tasks.filter(
      (t) => t.leadId !== currentUserId && t.collaboratorIds.includes(currentUserId) && (t.status === 'Blocked' || t.status === 'Waiting on external'),
    );
    return { overdue, toChase, drifting, blockedOnYou };
  }, [tasks, currentUserId]);

  const total = groups.overdue.length + groups.toChase.length + groups.drifting.length + groups.blockedOnYou.length;

  if (total === 0) {
    return (
      <div className="mx-4 mb-3 mt-1 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-[13px] text-[var(--color-ink-2)] shadow-[var(--shadow-card)]">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-green-bg)] text-[var(--color-green)]">✓</span>
        You’re caught up — nothing overdue, stuck, or waiting on a chase.
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 mt-1 grid grid-cols-1 gap-2.5 md:grid-cols-2">
      <Card
        show={groups.overdue.length > 0}
        tone="alert"
        icon="!"
        title="Overdue"
        count={groups.overdue.length}
        items={groups.overdue}
        onOpen={openTask}
        action={{ label: 'Done', run: (t) => patchTask(t.id, { status: 'Done' }) }}
        subtitle={(t) => `${-daysUntil(t.deadline!)}d late`}
      />
      <Card
        show={groups.toChase.length > 0}
        tone="amber"
        icon="↻"
        title="Waiting — time to chase"
        count={groups.toChase.length}
        items={groups.toChase}
        onOpen={openTask}
        action={{ label: 'Chased', run: (t) => chase(t.id) }}
        subtitle={(t) => `${t.waitingOn} · ${daysSince(t.lastChasedAt ?? t.statusChangedAt)}d`}
      />
      <Card
        show={groups.blockedOnYou.length > 0}
        tone="brand"
        icon="⛔"
        title="Blocked on you"
        count={groups.blockedOnYou.length}
        items={groups.blockedOnYou}
        onOpen={openTask}
        subtitle={(t) => t.blockedBy ?? t.waitingOn ?? ''}
      />
      <Card
        show={groups.drifting.length > 0}
        tone="gray"
        icon="~"
        title="Drifting (14d+ idle)"
        count={groups.drifting.length}
        items={groups.drifting}
        onOpen={openTask}
        subtitle={(t) => `${daysSince(t.lastTouched)}d untouched`}
      />
    </div>
  );
}

const TONES: Record<string, { border: string; icon: string }> = {
  alert: { border: 'var(--color-alert)', icon: 'var(--color-alert)' },
  amber: { border: 'var(--color-amber)', icon: 'var(--color-amber)' },
  brand: { border: 'var(--color-brand)', icon: 'var(--color-brand)' },
  gray: { border: 'var(--color-border-strong)', icon: 'var(--color-ink-3)' },
};

function Card({
  show,
  tone,
  icon,
  title,
  count,
  items,
  onOpen,
  action,
  subtitle,
}: {
  show: boolean;
  tone: keyof typeof TONES | string;
  icon: string;
  title: string;
  count: number;
  items: Task[];
  onOpen: (id: string) => void;
  action?: { label: string; run: (t: Task) => void };
  subtitle: (t: Task) => string;
}) {
  if (!show) return null;
  const t = TONES[tone] ?? TONES.gray;
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]" style={{ boxShadow: `inset 3px 0 0 ${t.border}, var(--shadow-card)` }}>
      <div className="flex items-center gap-2 px-3.5 py-2">
        <span className="text-[13px] font-semibold" style={{ color: t.icon }}>{icon}</span>
        <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-ink-2)]">{title}</span>
        <span className="ml-auto rounded-full bg-[var(--color-surface-2)] px-2 text-[11px] font-semibold text-[var(--color-ink-2)]">{count}</span>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {items.slice(0, 3).map((task) => (
          <div key={task.id} className="group flex items-center gap-2 px-3.5 py-1.5 hover:bg-[var(--color-surface-2)]">
            <button onClick={() => onOpen(task.id)} className="min-w-0 flex-1 text-left">
              <div className="truncate text-[13px]">{task.title}</div>
              <div className="truncate text-[11px] text-[var(--color-ink-3)]">{subtitle(task)}</div>
            </button>
            {action && (
              <button
                onClick={() => action.run(task)}
                className="shrink-0 rounded-md border border-[var(--color-border-strong)] bg-white px-2 py-0.5 text-[11px] font-medium opacity-0 transition group-hover:opacity-100 hover:bg-[var(--color-surface-2)]"
              >
                {action.label}
              </button>
            )}
          </div>
        ))}
        {items.length > 3 && <div className="px-3.5 py-1.5 text-[11px] text-[var(--color-ink-3)]">+{items.length - 3} more</div>}
      </div>
    </div>
  );
}
