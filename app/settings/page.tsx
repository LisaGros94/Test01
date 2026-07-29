'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/client/store';
import { TRIGGER_TYPES, type TriggerType } from '@/lib/client/types';

const LABELS: Record<TriggerType, string> = {
  assignment: 'Assignment — made lead or added as collaborator',
  deadline: 'Deadline warnings (7d / 2d / morning of / overdue)',
  staleness: 'Staleness nudges (7 / 14 days idle)',
  blocked_escalation: 'Blocked escalation (3+ days)',
  waiting_external: 'Waiting-on-external chase prompts (every 5 days)',
  handoff: 'Handoff — you became the new lead',
  mention: '@mentions',
  watched_status: 'Status changes on tasks you watch',
  digest_monday: 'Monday digest',
  digest_friday: 'Friday founders’ digest',
};

export default function SettingsPage() {
  const { currentUserId, flash } = useApp();
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch('/api/prefs')
      .then((r) => r.json())
      .then((d) => setMuted(new Set(d.prefs.filter((p: { muted: boolean }) => p.muted).map((p: { trigger: string }) => p.trigger))));
  }, [currentUserId]);

  const toggle = async (trigger: TriggerType) => {
    const next = new Set(muted);
    const willMute = !next.has(trigger);
    if (willMute) next.add(trigger);
    else next.delete(trigger);
    setMuted(next);
    await fetch('/api/prefs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ trigger, muted: willMute }),
    });
  };

  const runEngine = async () => {
    setRunning(true);
    const res = await fetch('/api/cron/notifications');
    const data = await res.json().catch(() => ({}));
    setRunning(false);
    flash('ok', res.ok ? `Engine ran — ${data.delivered ?? 0} delivered, ${data.dropped ?? 0} suppressed` : 'Engine run failed');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-[15px] font-semibold">Notification settings</h1>
      <p className="mt-1 text-[13px] text-[var(--color-ink-2)]">
        Mute any trigger you don’t want. Everything defaults on. You’re never notified about your own changes, and
        Slack is capped at one DM per hour — collisions are batched.
      </p>

      <div className="mt-5 divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] bg-white">
        {TRIGGER_TYPES.map((t) => (
          <label key={t} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5">
            <span className="text-[13px]">{LABELS[t]}</span>
            <input
              type="checkbox"
              checked={!muted.has(t)}
              onChange={() => toggle(t)}
              className="h-4 w-4 accent-[var(--color-ink)]"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
        <p className="text-[13px] font-medium">Run the notification engine now</p>
        <p className="mt-0.5 text-[12px] text-[var(--color-ink-2)]">
          Normally Vercel Cron does this hourly. Trigger it manually to see the anti-noise rules in action (sends land
          in the server console in demo mode).
        </p>
        <button
          onClick={runEngine}
          disabled={running}
          className="mt-2 rounded-md bg-[var(--color-ink)] px-3 py-1.5 text-[12px] text-white disabled:opacity-40"
        >
          {running ? 'Running…' : 'Evaluate triggers & send'}
        </button>
      </div>
    </div>
  );
}
