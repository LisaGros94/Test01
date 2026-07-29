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

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="fade-in py-24 text-center">
      <div className="label-lg text-ink">{title}</div>
      <p className="mx-auto mt-3 max-w-md text-mid">{hint}</p>
    </div>
  );
}
