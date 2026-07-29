import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { statusLog, useStore } from "../store";
import { isOpen, isOverdue, todayISO } from "../lib";
import { DueTag, EmptyState, SectionLabel, StatusTag } from "../ui";
import CommitmentPanel from "../CommitmentPanel";

/** Everything assigned to you, sorted by due date, one screen. */
export default function Mine() {
  const { state, updateTask } = useStore();
  const [params, setParams] = useSearchParams();
  const openId = params.get("open");

  const mine = useMemo(() => {
    const commitments = state.commitments
      .filter((c) => c.ownerId === state.meId && isOpen(c.status))
      .map((c) => ({ kind: "commitment" as const, id: c.id, title: c.title, dueDate: c.dueDate, status: c.status, commitmentId: c.id }));
    const tasks = state.tasks
      .filter((t) => t.assigneeId === state.meId && isOpen(t.status))
      .map((t) => ({ kind: "task" as const, id: t.id, title: t.title, dueDate: t.dueDate, status: t.status, commitmentId: t.commitmentId }));
    return [...commitments, ...tasks].sort((a, b) =>
      (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1
    );
  }, [state]);

  const today = todayISO();
  const groups = [
    { name: "Overdue", items: mine.filter((m) => m.dueDate && m.dueDate < today) },
    { name: "Today", items: mine.filter((m) => m.dueDate === today) },
    { name: "Upcoming", items: mine.filter((m) => m.dueDate && m.dueDate > today) },
    { name: "No date", items: mine.filter((m) => !m.dueDate) },
  ];

  return (
    <div className="fade-in mx-auto max-w-3xl">
      <header className="mb-12">
        <h1 className="label-lg">Mine</h1>
        <p className="mt-2 text-mid">
          Everything assigned to you, sorted by due date. One screen, no excuses.
        </p>
      </header>

      {mine.length === 0 && (
        <EmptyState title="Nothing on your plate" hint="Either you are done, or nothing has an owner. Check Unowned." />
      )}

      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.name} className="mb-12">
              <SectionLabel>
                <span className={g.name === "Overdue" ? "text-oxblood" : undefined}>
                  {g.name} — {g.items.length}
                </span>
              </SectionLabel>
              {g.items.map((m) => (
                <div
                  key={m.id}
                  className="hairline-b hover-tint flex cursor-pointer items-center gap-5 py-4"
                  onClick={() => setParams({ open: m.commitmentId })}
                >
                  {m.kind === "task" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTask(m.id, { status: "done" }, statusLog("done"));
                      }}
                      aria-label="mark done"
                      className="h-[15px] w-[15px] shrink-0 border border-mid transition-colors duration-150 hover:border-ink hover:bg-ink"
                    />
                  ) : (
                    <StatusTag status={m.status} />
                  )}
                  <span className={`min-w-0 flex-1 truncate ${isOverdue(m) ? "text-oxblood" : ""}`}>
                    {m.title}
                  </span>
                  <span className="label text-mid">{m.kind}</span>
                  <span className="w-32 text-right">
                    <DueTag dueDate={m.dueDate} status={m.status} />
                  </span>
                </div>
              ))}
            </section>
          )
      )}

      {openId && <CommitmentPanel id={openId} onClose={() => setParams({})} />}
    </div>
  );
}
