'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { initials } from '@/lib/client/format';

export function Avatar({ name, size = 20, title }: { name: string; size?: number; title?: string }) {
  // Deterministic muted tint from the name — no cartoon colours.
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      title={title ?? name}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `hsl(${hue} 30% 90%)`,
        color: `hsl(${hue} 35% 32%)`,
      }}
      className="inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none"
    >
      {initials(name)}
    </span>
  );
}

/** Lightweight controlled dropdown with click-outside + Esc close. */
export function Dropdown({
  trigger,
  children,
  align = 'left',
  width = 200,
}: {
  trigger: (open: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center"
      >
        {trigger(open)}
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ width, [align]: 0 } as React.CSSProperties}
          className="absolute z-40 mt-1 rounded-lg border border-[var(--color-border-strong)] bg-white p-1 shadow-lg"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-[var(--color-surface-2)] ${
        active ? 'bg-[var(--color-surface-2)]' : ''
      }`}
    >
      {children}
    </button>
  );
}

export function Toast({ toast }: { toast: { kind: 'error' | 'ok'; text: string } | null }) {
  if (!toast) return null;
  return (
    <div
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-2 text-[13px] shadow-lg"
      style={{
        background: toast.kind === 'error' ? 'var(--color-alert-bg)' : '#fff',
        borderColor: toast.kind === 'error' ? 'var(--color-alert)' : 'var(--color-border-strong)',
        color: toast.kind === 'error' ? 'var(--color-alert)' : 'var(--color-ink)',
      }}
    >
      {toast.text}
    </div>
  );
}
