'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/lib/client/store';
import type { Activity, Comment, Task } from '@/lib/client/types';
import { ago } from '@/lib/client/format';
import { StatusMenu, LeadPicker, CategoryPicker, PriorityBadge, DeadlineEditor } from './editors';
import { Avatar, Dropdown, MenuItem } from './ui';

export function TaskDrawer() {
  const { openTaskId, openTask, tasks } = useApp();
  const task = tasks.find((t) => t.id === openTaskId) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openTaskId) openTask(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openTaskId, openTask]);

  if (!openTaskId) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/10" onClick={() => openTask(null)} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col border-l border-[var(--color-border-strong)] bg-white shadow-2xl">
        {task ? <DrawerBody task={task} /> : <div className="p-6 text-[13px] text-[var(--color-ink-3)]">Task not found.</div>}
      </aside>
    </>
  );
}

function DrawerBody({ task }: { task: Task }) {
  const { patchTask, chase, deleteTask, openTask, users, currentUserId } = useApp();
  const [detail, setDetail] = useState<{ activity: Activity[]; comments: Comment[] } | null>(null);
  const [notes, setNotes] = useState(task.notes);

  const loadDetail = useCallback(async () => {
    const res = await fetch(`/api/tasks/${task.id}`);
    if (res.ok) {
      const d = await res.json();
      setDetail({ activity: d.activity, comments: d.comments });
    }
  }, [task.id]);

  useEffect(() => {
    setNotes(task.notes);
    loadDetail();
  }, [task.id, loadDetail, task.notes]);

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] p-4">
        <input
          value={task.title}
          onChange={(e) => patchTask(task.id, { title: e.target.value })}
          className="w-full resize-none border-none bg-transparent text-[16px] font-semibold outline-none"
        />
        <button onClick={() => openTask(null)} className="shrink-0 rounded p-1 text-[var(--color-ink-3)] hover:bg-[var(--color-surface-2)]" title="Close (Esc)">
          ✕
        </button>
      </div>

      {/* Properties */}
      <div className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 border-b border-[var(--color-border)] p-4 text-[13px]">
        <Prop label="Status"><StatusMenu task={task} /></Prop>
        <Prop label="Priority"><PriorityBadge task={task} /></Prop>
        <Prop label="Category"><CategoryPicker task={task} /></Prop>
        <Prop label="Lead">
          <span className="inline-flex items-center gap-2"><LeadPicker task={task} /><span className="text-[var(--color-ink-2)]">{userName(task.leadId)}</span></span>
        </Prop>
        <Prop label="Deadline"><DeadlineEditor task={task} /></Prop>
        <Prop label="Collaborators"><Collaborators task={task} /></Prop>
        {task.status === 'Blocked' && (
          <Prop label="Blocked by"><ReasonEditor task={task} field="blockedBy" /></Prop>
        )}
        {task.status === 'Waiting on external' && (
          <Prop label="Waiting on">
            <div className="flex items-center gap-2">
              <ReasonEditor task={task} field="waitingOn" />
              <button onClick={() => chase(task.id)} className="rounded border border-[var(--color-border-strong)] px-2 py-0.5 text-[11px] hover:bg-[var(--color-surface-2)]">
                I chased today
              </button>
            </div>
          </Prop>
        )}
      </div>

      {/* Notes */}
      <div className="border-b border-[var(--color-border)] p-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-3)]">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== task.notes && patchTask(task.id, { notes })}
          placeholder="Add context, links, next steps…"
          rows={3}
          className="w-full resize-y rounded-md border border-[var(--color-border)] p-2 text-[13px] outline-none focus:border-[var(--color-ink-3)]"
        />
      </div>

      {/* Activity + comments */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-3)]">Activity</p>
        <ol className="space-y-1.5">
          {detail?.activity.map((a) => (
            <li key={a.id} className="flex items-baseline gap-2 text-[12px] text-[var(--color-ink-2)]">
              <Avatar name={userName(a.actorId)} size={16} />
              <span><span className="text-[var(--color-ink)]">{userName(a.actorId)}</span> {a.summary}</span>
              <span className="ml-auto shrink-0 text-[var(--color-ink-3)]">{ago(a.at)}</span>
            </li>
          ))}
          {detail && detail.activity.length === 0 && <li className="text-[12px] text-[var(--color-ink-3)]">No activity yet.</li>}
        </ol>

        <div className="mt-4 space-y-3">
          {detail?.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar name={userName(c.authorId)} size={22} />
              <div className="min-w-0">
                <div className="text-[12px]"><span className="font-medium">{userName(c.authorId)}</span> <span className="text-[var(--color-ink-3)]">{ago(c.at)}</span></div>
                <div className="whitespace-pre-wrap text-[13px]">{renderMentions(c.body)}</div>
              </div>
            </div>
          ))}
        </div>

        <CommentComposer taskId={task.id} onPosted={loadDetail} />
      </div>

      <div className="border-t border-[var(--color-border)] p-3">
        <button
          onClick={() => { if (confirm('Delete this task?')) { deleteTask(task.id); openTask(null); } }}
          className="text-[12px] text-[var(--color-ink-3)] hover:text-[var(--color-alert)]"
        >
          Delete task
        </button>
        <span className="ml-3 text-[11px] text-[var(--color-ink-3)]">Created by {userName(task.createdBy)} · touched {ago(task.lastTouched)} ago</span>
      </div>
    </>
  );
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="pt-0.5 text-[11px] uppercase tracking-wide text-[var(--color-ink-3)]">{label}</div>
      <div>{children}</div>
    </>
  );
}

function ReasonEditor({ task, field }: { task: Task; field: 'blockedBy' | 'waitingOn' }) {
  const patchTask = useApp((s) => s.patchTask);
  const [v, setV] = useState(task[field] ?? '');
  useEffect(() => setV(task[field] ?? ''), [task, field]);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v.trim() && v !== task[field] && patchTask(task.id, { [field]: v.trim() })}
      className="w-full rounded border border-transparent px-1 py-0.5 text-[13px] hover:border-[var(--color-border-strong)] focus:border-[var(--color-ink-3)] focus:outline-none"
    />
  );
}

function Collaborators({ task }: { task: Task }) {
  const { users, patchTask } = useApp();
  const set = new Set(task.collaboratorIds);
  return (
    <div className="flex items-center gap-1">
      {task.collaboratorIds.map((id) => (
        <Avatar key={id} name={users.find((u) => u.id === id)?.name ?? id} />
      ))}
      <Dropdown width={200} trigger={() => <span className="rounded border border-dashed border-[var(--color-border-strong)] px-1.5 text-[12px] text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">+ add</span>}>
        {() => (
          <>
            {users.filter((u) => u.id !== task.leadId).map((u) => (
              <MenuItem
                key={u.id}
                active={set.has(u.id)}
                onClick={() => {
                  const next = set.has(u.id) ? task.collaboratorIds.filter((c) => c !== u.id) : [...task.collaboratorIds, u.id];
                  patchTask(task.id, { collaboratorIds: next });
                }}
              >
                <Avatar name={u.name} /> {u.name} {set.has(u.id) && <span className="ml-auto">✓</span>}
              </MenuItem>
            ))}
          </>
        )}
      </Dropdown>
    </div>
  );
}

function CommentComposer({ taskId, onPosted }: { taskId: string; onPosted: () => void }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
    });
    setBody('');
    setBusy(false);
    onPosted();
  };
  return (
    <div className="mt-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
        placeholder="Comment… use @name to mention (⌘↵ to send)"
        rows={2}
        className="w-full resize-y rounded-md border border-[var(--color-border)] p-2 text-[13px] outline-none focus:border-[var(--color-ink-3)]"
      />
      <div className="mt-1 flex justify-end">
        <button onClick={submit} disabled={busy || !body.trim()} className="rounded-md bg-[var(--color-ink)] px-3 py-1 text-[12px] text-white disabled:opacity-40">
          Comment
        </button>
      </div>
    </div>
  );
}

function renderMentions(body: string) {
  return body.split(/(@[a-z0-9._-]+)/gi).map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="rounded bg-[var(--color-blue-bg)] px-1 font-medium text-[var(--color-blue)]">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
