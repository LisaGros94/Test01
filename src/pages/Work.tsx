import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { statusLog, useStore } from "../store";
import type { Commitment, Status } from "../types";
import { STATUSES } from "../types";
import { allLabels, isOverdue, openTaskCount, personName } from "../lib";
import { Avatar, DueTag, EmptyState, LabelChip, StatusTag } from "../ui";
import CommitmentPanel from "../CommitmentPanel";

type View = "list" | "board";

export default function Work() {
  const { state, updateCommitment, bulkUpdate } = useStore();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>("list");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [wsFilter, setWsFilter] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const openId = params.get("open");

  const items = useMemo(() => {
    let cs = state.commitments.filter((c) => c.status !== "dropped");
    if (labelFilter) cs = cs.filter((c) => c.labels.includes(labelFilter));
    if (wsFilter) cs = cs.filter((c) => c.workstreamId === wsFilter);
    return [...cs].sort((a, b) => {
      const openA = a.status !== "done" ? 0 : 1;
      const openB = b.status !== "done" ? 0 : 1;
      if (openA !== openB) return openA - openB;
      return (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1;
    });
  }, [state.commitments, labelFilter, wsFilter]);

  // Keyboard: j/k move, x select, enter open, esc clear
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        openId
      )
        return;
      if (e.key === "j") setCursor((c) => Math.min(c + 1, items.length - 1));
      if (e.key === "k") setCursor((c) => Math.max(c - 1, 0));
      if (e.key === "x") {
        const id = items[cursor]?.id;
        if (!id) return;
        setSelected((s) => {
          const next = new Set(s);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        });
      }
      if (e.key === "Enter" && items[cursor]) {
        setParams({ open: items[cursor].id });
      }
      if (e.key === "Escape") setSelected(new Set());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, cursor, openId, setParams]);

  const open = (id: string) => setParams({ open: id });
  const close = () => setParams({});

  const boardCols: Status[] = ["not_started", "in_progress", "blocked", "done"];

  return (
    <div className="fade-in mx-auto max-w-5xl">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="label-lg">Work</h1>
          <p className="mt-2 text-mid">
            Commitments across every workstream. J K to move, X to select, Enter to open.
          </p>
        </div>
        <div className="flex items-center gap-6">
          {(["list", "board"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`label transition-opacity duration-150 ${
                view === v ? "text-ink" : "text-mid hover:text-ink"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="label text-mid">Filter</span>
        <select
          value={wsFilter ?? ""}
          onChange={(e) => setWsFilter(e.target.value || null)}
          className="label appearance-none border-b border-hairline py-1 text-ink"
        >
          <option value="">All workstreams</option>
          {state.workstreams.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        {allLabels(state).map((l) => (
          <button
            key={l}
            onClick={() => setLabelFilter(labelFilter === l ? null : l)}
            className={`label transition-opacity duration-150 ${
              labelFilter === l ? "text-ink underline underline-offset-4" : "text-mid hover:text-ink"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <EmptyState
          title="No commitments here"
          hint="A commitment is a dated outcome with a single named owner. Press C to make the first one."
        />
      )}

      {view === "list" ? (
        <div>
          {items.map((c, i) => (
            <Row
              key={c.id}
              c={c}
              active={i === cursor}
              checked={selected.has(c.id)}
              onOpen={() => open(c.id)}
              onToggle={() =>
                setSelected((s) => {
                  const next = new Set(s);
                  next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                  return next;
                })
              }
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {boardCols.map((col) => {
            const colItems = items.filter((c) => c.status === col);
            return (
              <div
                key={col}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) updateCommitment(id, { status: col }, statusLog(col));
                }}
              >
                <div className="label hairline-b mb-4 flex items-center justify-between pb-3 text-mid">
                  <StatusTag status={col} />
                  <span>{colItems.length}</span>
                </div>
                <div className="flex flex-col gap-5">
                  {colItems.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                      onClick={() => open(c.id)}
                      className="hover-tint cursor-pointer py-1"
                    >
                      <div className={isOverdue(c) ? "text-oxblood" : ""}>{c.title}</div>
                      <div className="mt-1 flex items-center gap-3">
                        {c.ownerId ? (
                          <span className="label text-mid">{personName(state, c.ownerId)}</span>
                        ) : (
                          <span className="label text-mid">Unowned</span>
                        )}
                        <DueTag dueDate={c.dueDate} status={c.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected.size > 0 && (
        <div
          className="fade-in fixed bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-center gap-6 bg-paper px-8 py-4"
          style={{ border: "1px solid var(--ink)" }}
        >
          <span className="label">{selected.size} selected</span>
          <select
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              bulkUpdate([...selected], { ownerId: e.target.value }, `reassigned to ${personName(state, e.target.value)}`);
              setSelected(new Set());
            }}
            className="label appearance-none border-b border-hairline py-1"
          >
            <option value="">Reassign to…</option>
            {state.people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="date"
            onChange={(e) => {
              if (!e.target.value) return;
              bulkUpdate([...selected], { dueDate: e.target.value }, "rescheduled");
              setSelected(new Set());
            }}
            className="label border-b border-hairline py-1"
          />
          <select
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              bulkUpdate([...selected], { status: e.target.value as Status }, statusLog(e.target.value as Status));
              setSelected(new Set());
            }}
            className="label appearance-none border-b border-hairline py-1"
          >
            <option value="">Set status…</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button onClick={() => setSelected(new Set())} className="label text-mid hover:text-ink">
            Clear
          </button>
        </div>
      )}

      {openId && <CommitmentPanel id={openId} onClose={close} />}
    </div>
  );
}

function Row({
  c,
  active,
  checked,
  onOpen,
  onToggle,
}: {
  c: Commitment;
  active: boolean;
  checked: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const { state } = useStore();
  const ws = state.workstreams.find((w) => w.id === c.workstreamId);
  const tc = openTaskCount(state, c.id);
  return (
    <div
      className={`hairline-b hover-tint flex cursor-pointer items-center gap-5 py-4 ${
        active ? "bg-[var(--tint-soft)]" : ""
      }`}
      style={active ? { background: "var(--tint-soft)" } : undefined}
      onClick={onOpen}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label="select"
        className={`h-[13px] w-[13px] shrink-0 border transition-colors duration-150 ${
          checked ? "border-ink bg-ink" : "border-hairline hover:border-mid"
        }`}
      />
      <StatusTag status={c.status} />
      <span className={`min-w-0 flex-1 truncate ${isOverdue(c) ? "text-oxblood" : ""}`}>
        {c.title}
      </span>
      <span className="label hidden text-mid lg:inline">{ws?.name}</span>
      {tc.total > 0 && (
        <span className="label hidden text-mid md:inline">
          {tc.total - tc.open}/{tc.total}
        </span>
      )}
      <span className="hidden items-center gap-2 md:flex">
        {c.labels.slice(0, 2).map((l) => (
          <LabelChip key={l} text={l} />
        ))}
      </span>
      {c.ownerId ? (
        <Avatar initials={state.people.find((p) => p.id === c.ownerId)?.initials ?? "?"} />
      ) : (
        <span className="label text-oxblood">Unowned</span>
      )}
      <span className="w-32 text-right">
        <DueTag dueDate={c.dueDate} status={c.status} />
      </span>
    </div>
  );
}
