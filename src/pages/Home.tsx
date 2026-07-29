import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../store";
import { daysFromNow, isOpen, isOverdue, onTimeRate, personName, todayISO } from "../lib";
import { DueTag, SectionLabel, StatusTag } from "../ui";
import CommitmentPanel from "../CommitmentPanel";

export default function Home() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const openId = params.get("open");

  const rate = onTimeRate(state.commitments);
  const today = todayISO();
  const weekAhead = daysFromNow(7);

  const overdue = useMemo(
    () => state.commitments.filter((c) => isOpen(c.status) && isOverdue(c)),
    [state.commitments]
  );
  const dueThisWeek = useMemo(
    () =>
      state.commitments.filter(
        (c) => isOpen(c.status) && c.dueDate && c.dueDate >= today && c.dueDate <= weekAhead
      ),
    [state.commitments, today, weekAhead]
  );
  const shipped = useMemo(
    () =>
      state.commitments.filter(
        (c) => c.status === "done" && c.completedAt && c.completedAt.slice(0, 10) >= daysFromNow(-7)
      ),
    [state.commitments]
  );
  const unownedCount = state.commitments.filter(
    (c) => isOpen(c.status) && (!c.ownerId || !c.dueDate)
  ).length;

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="fade-in mx-auto max-w-4xl">
      <header className="mb-16">
        <div className="label mb-2 text-mid">{dateLabel}</div>
        <h1 className="label-lg">Today</h1>
      </header>

      {/* The one number. Team-wide only — never per person. */}
      <section className="mb-16">
        <div className="flex items-baseline gap-6">
          <span className="text-[64px] leading-none tracking-tight">
            {rate.pct === null ? "—" : `${rate.pct}%`}
          </span>
          <div className="max-w-xs">
            <div className="label text-mid">Delivered on the original date</div>
            <div className="mt-1 text-mid">
              Trailing eight weeks, team-wide. {rate.n} commitment{rate.n === 1 ? "" : "s"} closed.
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-x-16 gap-y-14 md:grid-cols-2">
        <section>
          <SectionLabel>
            <span className={overdue.length ? "text-oxblood" : undefined}>
              Overdue — {overdue.length}
            </span>
          </SectionLabel>
          {overdue.length === 0 && <p className="text-mid">Nothing overdue. Keep it that way.</p>}
          {overdue.map((c) => (
            <ItemRow key={c.id} id={c.id} title={c.title} owner={personName(state, c.ownerId)} dueDate={c.dueDate} status={c.status} onOpen={() => setParams({ open: c.id })} />
          ))}
        </section>

        <section>
          <SectionLabel>Due in the next 7 days — {dueThisWeek.length}</SectionLabel>
          {dueThisWeek.length === 0 && <p className="text-mid">A quiet week ahead, on paper.</p>}
          {dueThisWeek.map((c) => (
            <ItemRow key={c.id} id={c.id} title={c.title} owner={personName(state, c.ownerId)} dueDate={c.dueDate} status={c.status} onOpen={() => setParams({ open: c.id })} />
          ))}
        </section>

        <section>
          <SectionLabel>Shipped this week — {shipped.length}</SectionLabel>
          {shipped.length === 0 && <p className="text-mid">Nothing closed yet this week.</p>}
          {shipped.map((c) => (
            <div key={c.id} className="hairline-b flex items-center gap-4 py-3">
              <StatusTag status={c.status} />
              <span className="min-w-0 flex-1 truncate text-mid">{c.title}</span>
              <span className="label text-mid">{personName(state, c.ownerId)}</span>
            </div>
          ))}
        </section>

        <section>
          <SectionLabel>Hygiene</SectionLabel>
          <Link to="/unowned" className="hairline-b hover-tint flex items-center justify-between py-3">
            <span className={unownedCount ? "" : "text-mid"}>
              {unownedCount} commitment{unownedCount === 1 ? "" : "s"} without an owner or a date
            </span>
            <span className="label text-mid">Unowned →</span>
          </Link>
          <div className="hairline-b flex items-center justify-between py-3">
            <span className="text-mid">Workstreams active</span>
            <span>{state.workstreams.filter((w) => !w.archived).length}</span>
          </div>
          <div className="hairline-b flex items-center justify-between py-3">
            <span className="text-mid">Open commitments</span>
            <span>{state.commitments.filter((c) => isOpen(c.status)).length}</span>
          </div>
        </section>
      </div>

      {openId && <CommitmentPanel id={openId} onClose={() => setParams({})} />}
    </div>
  );
}

function ItemRow({
  id,
  title,
  owner,
  dueDate,
  status,
  onOpen,
}: {
  id: string;
  title: string;
  owner: string;
  dueDate: string | null;
  status: import("../types").Status;
  onOpen: () => void;
}) {
  return (
    <div className="hairline-b hover-tint flex cursor-pointer items-center gap-4 py-3" onClick={onOpen}>
      <span className={`min-w-0 flex-1 truncate ${isOverdue({ dueDate, status }) ? "text-oxblood" : ""}`}>
        {title}
      </span>
      <span className="label text-mid">{owner}</span>
      <DueTag dueDate={dueDate} status={status} />
    </div>
  );
}
