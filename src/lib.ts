import type { Commitment, State, Status, Task } from "./types";

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isOverdue(item: { dueDate: string | null; status: Status }): boolean {
  return (
    !!item.dueDate &&
    item.dueDate < todayISO() &&
    item.status !== "done" &&
    item.status !== "dropped"
  );
}

export function isOpen(s: Status): boolean {
  return s !== "done" && s !== "dropped";
}

/** Store UTC, display local, always labelled. */
export function tzLabel(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "No date";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
    ", " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

export function relDue(iso: string | null, status: Status): string {
  if (!iso) return "No date";
  const today = todayISO();
  if (status === "done" || status === "dropped") return fmtDate(iso);
  const ms = new Date(iso + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime();
  const days = Math.round(ms / 86400000);
  if (days < -1) return `${-days} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return fmtDate(iso);
}

/**
 * The one number on the homepage: % of commitments delivered by their
 * ORIGINAL due date, trailing eight weeks, team-wide only. Never per person.
 */
export function onTimeRate(commitments: Commitment[]): { pct: number | null; n: number } {
  const cutoff = daysFromNow(-56);
  const closed = commitments.filter(
    (c) => c.status === "done" && c.completedAt && c.completedAt.slice(0, 10) >= cutoff
  );
  if (closed.length === 0) return { pct: null, n: 0 };
  const onTime = closed.filter(
    (c) => !c.originalDueDate || c.completedAt!.slice(0, 10) <= c.originalDueDate
  );
  return { pct: Math.round((onTime.length / closed.length) * 100), n: closed.length };
}

export function personName(state: State, id: string | null): string {
  if (!id) return "Unowned";
  return state.people.find((p) => p.id === id)?.name ?? "Unknown";
}

export function allLabels(state: State): string[] {
  const set = new Set<string>();
  state.commitments.forEach((c) => c.labels.forEach((l) => set.add(l)));
  return [...set].sort();
}

export function openTaskCount(state: State, commitmentId: string): { open: number; total: number } {
  const ts = state.tasks.filter((t) => t.commitmentId === commitmentId);
  return { open: ts.filter((t) => isOpen(t.status)).length, total: ts.length };
}

export type SearchHit =
  | { type: "commitment"; item: Commitment }
  | { type: "task"; item: Task };

export function search(state: State, q: string): SearchHit[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const hits: SearchHit[] = [];
  for (const c of state.commitments) {
    if (
      c.title.toLowerCase().includes(needle) ||
      c.description.toLowerCase().includes(needle) ||
      c.labels.some((l) => l.toLowerCase().includes(needle))
    )
      hits.push({ type: "commitment", item: c });
  }
  for (const t of state.tasks) {
    if (t.title.toLowerCase().includes(needle)) hits.push({ type: "task", item: t });
  }
  return hits.slice(0, 12);
}
