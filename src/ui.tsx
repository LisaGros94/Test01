import type { Status } from "./types";
import { STATUS_LABEL } from "./types";
import { isOverdue, relDue } from "./lib";

/** Status is a small filled dot plus a text label — never a colour block. */
const DOT: Record<Status, string> = {
  not_started: "border border-mid bg-transparent",
  in_progress: "bg-ink",
  blocked: "bg-mid",
  done: "bg-[#B9C3CB]",
  dropped: "border border-hairline bg-transparent",
};

export function StatusDot({ status }: { status: Status }) {
  return <span className={`inline-block h-[7px] w-[7px] shrink-0 ${DOT[status]}`} />;
}

export function StatusTag({ status }: { status: Status }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <StatusDot status={status} />
      <span className="label text-mid">{STATUS_LABEL[status]}</span>
    </span>
  );
}

export function DueTag({
  dueDate,
  status,
}: {
  dueDate: string | null;
  status: Status;
}) {
  const overdue = isOverdue({ dueDate, status });
  return (
    <span
      className={`label whitespace-nowrap ${overdue ? "text-oxblood" : "text-mid"}`}
    >
      {relDue(dueDate, status)}
    </span>
  );
}

export function LabelChip({ text }: { text: string }) {
  return (
    <span className="label whitespace-nowrap bg-[var(--tint)] px-2 py-[3px] text-ink">
      {text}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="label mb-4 text-mid">{children}</div>;
}

export function Avatar({ initials }: { initials: string }) {
  /* Plain squares, never circles. */
  return (
    <span className="label flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--tint)] text-[9px] text-ink">
      {initials}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="label border border-hairline px-[5px] py-[1px] text-[10px] text-mid">
      {children}
    </span>
  );
}

/** Twelve-week sparkline, nothing more elaborate. Ink line, square end point. */
export function Sparkline({
  values,
  width = 120,
  height = 26,
}: {
  values: (number | null)[];
  width?: number;
  height?: number;
}) {
  const pts = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v !== null);
  if (pts.length < 2)
    return <span className="label text-mid">—</span>;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const span = max - min || 1;
  const pad = 3;
  const x = (i: number) => (i / (values.length - 1)) * (width - 2 * pad) + pad;
  const y = (v: number) => height - pad - ((v - min) / span) * (height - 2 * pad);
  const path = pts.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden>
      <path d={path} fill="none" stroke="var(--ink)" strokeWidth="1" />
      <rect x={x(last.i) - 1.5} y={y(last.v) - 1.5} width="3" height="3" fill="var(--ink)" />
    </svg>
  );
}

export function KpiTile({
  name,
  value,
  delta,
  target,
  values,
  meta,
}: {
  name: string;
  value: string;
  delta: string | null;
  target: string | null;
  values: (number | null)[];
  meta?: string;
}) {
  return (
    <div className="hairline-t pt-5">
      <div className="label text-mid">{name}</div>
      <div className="mt-4 flex items-end justify-between gap-8">
        <span className="text-[42px] leading-none tracking-tight">{value}</span>
        <Sparkline values={values} width={180} height={40} />
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-6">
        <span className="text-mid">{delta ?? ""}</span>
        {target && <span className="label text-mid">{target}</span>}
      </div>
      {meta && <div className="label mt-1 text-mid">{meta}</div>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="fade-in py-24 text-center">
      <div className="label-lg text-ink">{title}</div>
      <p className="mx-auto mt-3 max-w-md text-mid">{hint}</p>
    </div>
  );
}
