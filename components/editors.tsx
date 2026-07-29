'use client';

import { useState } from 'react';
import { useApp } from '@/lib/client/store';
import { CATEGORIES, PRIORITIES, STATUSES, type Task } from '@/lib/client/types';
import { STATUS_TINT, PRIORITY_COLOR } from '@/lib/client/format';
import { Dropdown, MenuItem, Avatar } from './ui';

export function StatusPill({ status }: { status: Task['status'] }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_TINT[status]}`}>
      {status}
    </span>
  );
}

/**
 * Inline status changer. You cannot move a task to Blocked or Waiting on
 * external without saying what's blocking it — the menu captures the reason
 * inline (no modal) before committing.
 */
export function StatusMenu({ task }: { task: Task }) {
  const patchTask = useApp((s) => s.patchTask);
  const [pending, setPending] = useState<null | 'Blocked' | 'Waiting on external'>(null);
  const [reason, setReason] = useState('');

  return (
    <Dropdown width={220} trigger={() => <StatusPill status={task.status} />}>
      {(close) => {
        if (pending) {
          const label = pending === 'Blocked' ? 'What is blocking it?' : 'Who are you waiting on?';
          const commit = async () => {
            if (!reason.trim()) return;
            const patch =
              pending === 'Blocked'
                ? { status: pending, blockedBy: reason.trim() }
                : { status: pending, waitingOn: reason.trim() };
            const ok = await patchTask(task.id, patch);
            if (ok) {
              setPending(null);
              setReason('');
              close();
            }
          };
          return (
            <div className="p-1.5">
              <p className="mb-1.5 px-1 text-[12px] text-[var(--color-ink-2)]">{label}</p>
              <input
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setPending(null);
                }}
                placeholder={pending === 'Blocked' ? 'e.g. Legal review' : 'e.g. Companies House'}
                className="w-full rounded-md border border-[var(--color-border-strong)] px-2 py-1 text-[13px] outline-none focus:border-[var(--color-ink-3)]"
              />
              <div className="mt-1.5 flex justify-end gap-1">
                <button className="rounded px-2 py-1 text-[12px] text-[var(--color-ink-2)]" onClick={() => setPending(null)}>
                  Cancel
                </button>
                <button className="rounded bg-[var(--color-ink)] px-2 py-1 text-[12px] text-white" onClick={commit}>
                  Set
                </button>
              </div>
            </div>
          );
        }
        return (
          <>
            {STATUSES.map((s) => (
              <MenuItem
                key={s}
                active={s === task.status}
                onClick={() => {
                  if (s === 'Blocked' || s === 'Waiting on external') {
                    setPending(s);
                    setReason(s === 'Blocked' ? task.blockedBy ?? '' : task.waitingOn ?? '');
                  } else {
                    patchTask(task.id, { status: s });
                    close();
                  }
                }}
              >
                <StatusPill status={s} />
              </MenuItem>
            ))}
          </>
        );
      }}
    </Dropdown>
  );
}

export function LeadPicker({ task }: { task: Task }) {
  const { users, patchTask, userById } = useApp();
  const lead = userById(task.leadId);
  return (
    <Dropdown
      width={200}
      trigger={() => (
        <span className="inline-flex items-center gap-1.5" title={`Lead: ${lead?.name ?? '—'}`}>
          {lead ? <Avatar name={lead.name} /> : <span className="text-[var(--color-alert)]">No lead</span>}
        </span>
      )}
    >
      {(close) => (
        <>
          <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-[var(--color-ink-3)]">Lead (accountable)</p>
          {users.map((u) => (
            <MenuItem
              key={u.id}
              active={u.id === task.leadId}
              onClick={() => {
                patchTask(task.id, { leadId: u.id });
                close();
              }}
            >
              <Avatar name={u.name} />
              <span>{u.name}</span>
            </MenuItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}

export function CategoryPicker({ task }: { task: Task }) {
  const patchTask = useApp((s) => s.patchTask);
  return (
    <Dropdown
      width={200}
      trigger={() => (
        <span className="text-[12px] text-[var(--color-ink-2)] hover:text-[var(--color-ink)]">{task.category}</span>
      )}
    >
      {(close) => (
        <>
          {CATEGORIES.map((c) => (
            <MenuItem
              key={c}
              active={c === task.category}
              onClick={() => {
                patchTask(task.id, { category: c });
                close();
              }}
            >
              {c}
            </MenuItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}

export function PriorityBadge({ task }: { task: Task }) {
  const patchTask = useApp((s) => s.patchTask);
  return (
    <Dropdown
      width={120}
      trigger={() => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: PRIORITY_COLOR[task.priority] }} title={`Priority ${task.priority}`}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_COLOR[task.priority] }} />
          {task.priority}
        </span>
      )}
    >
      {(close) => (
        <>
          {PRIORITIES.map((p) => (
            <MenuItem
              key={p}
              active={p === task.priority}
              onClick={() => {
                patchTask(task.id, { priority: p });
                close();
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_COLOR[p] }} />
              {p}
            </MenuItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}

export function DeadlineEditor({ task }: { task: Task }) {
  const patchTask = useApp((s) => s.patchTask);
  return (
    <input
      type="date"
      value={task.deadline ?? ''}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => patchTask(task.id, { deadline: e.target.value || null })}
      className="rounded border border-transparent bg-transparent px-1 py-0.5 text-[12px] text-[var(--color-ink-2)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-ink-3)] focus:outline-none"
    />
  );
}
