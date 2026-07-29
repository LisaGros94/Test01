import { useState } from "react";
import { statusLog, useStore } from "./store";
import type { Status } from "./types";
import { STATUSES } from "./types";
import { fmtDateTime, personName } from "./lib";
import { Avatar, DueTag, LabelChip, SectionLabel, StatusDot } from "./ui";

export default function CommitmentPanel({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { state, updateCommitment, updateTask, createTask, addComment } = useStore();
  const [comment, setComment] = useState("");
  const [newTask, setNewTask] = useState("");

  const c = state.commitments.find((x) => x.id === id);
  if (!c) return null;
  const tasks = state.tasks.filter((t) => t.commitmentId === id);
  const ws = state.workstreams.find((w) => w.id === c.workstreamId);
  const blocker = c.blockedBy ? state.commitments.find((x) => x.id === c.blockedBy) : null;

  const setStatus = (s: Status) => updateCommitment(id, { status: s }, statusLog(s));

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/10" onClick={onClose}>
      <div
        className="slide-in flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-paper px-10 py-10"
        style={{ borderLeft: "1px solid var(--hairline)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start justify-between gap-6">
          <div className="label text-mid">{ws?.name}</div>
          <button onClick={onClose} className="label text-mid transition-opacity hover:text-ink">
            Close
          </button>
        </div>
        <h1 className="text-[19px] leading-snug">{c.title}</h1>
        {c.description && <p className="mt-3 text-mid">{c.description}</p>}

        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <SectionLabel>Status</SectionLabel>
            <div className="-mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`label flex items-center gap-2 py-1 transition-opacity duration-150 ${
                    c.status === s.value ? "text-ink" : "text-mid opacity-60 hover:opacity-100"
                  }`}
                >
                  <StatusDot status={s.value} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>Owner</SectionLabel>
            <select
              value={c.ownerId ?? ""}
              onChange={(e) =>
                updateCommitment(
                  id,
                  { ownerId: e.target.value || null },
                  `reassigned to ${personName(state, e.target.value || null)}`
                )
              }
              className="hairline-b -mt-2 w-full appearance-none py-2"
            >
              <option value="">Unowned</option>
              {state.people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <SectionLabel>Due</SectionLabel>
            <div className="-mt-2 flex items-center gap-4">
              <input
                type="date"
                value={c.dueDate ?? ""}
                onChange={(e) =>
                  updateCommitment(id, { dueDate: e.target.value || null }, "rescheduled")
                }
                className="hairline-b py-2"
              />
              <DueTag dueDate={c.dueDate} status={c.status} />
            </div>
            {c.originalDueDate && c.dueDate !== c.originalDueDate && (
              <div className="label mt-2 text-mid">
                Originally {c.originalDueDate} — on-time % holds you to this
              </div>
            )}
          </div>
          <div>
            <SectionLabel>Labels</SectionLabel>
            <div className="-mt-2 flex flex-wrap gap-2 py-1">
              {c.labels.map((l) => <LabelChip key={l} text={l} />)}
              {c.labels.length === 0 && <span className="label text-mid">None</span>}
            </div>
          </div>
        </div>

        {blocker && (
          <div className="mt-6">
            <SectionLabel>Blocked by</SectionLabel>
            <div className="-mt-2 flex items-center gap-3">
              <StatusDot status={blocker.status} />
              <span>{blocker.title}</span>
            </div>
          </div>
        )}

        <div className="mt-10">
          <SectionLabel>Tasks — {tasks.filter((t) => t.status === "done").length}/{tasks.length} done</SectionLabel>
          <div>
            {tasks.map((t) => (
              <div key={t.id} className="hairline-b flex items-center gap-4 py-3">
                <button
                  onClick={() =>
                    updateTask(
                      t.id,
                      { status: t.status === "done" ? "not_started" : "done" },
                      statusLog(t.status === "done" ? "not_started" : "done")
                    )
                  }
                  className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center border transition-colors duration-150 ${
                    t.status === "done" ? "border-ink bg-ink" : "border-mid"
                  }`}
                  aria-label="toggle done"
                >
                  {t.status === "done" && <span className="text-[9px] leading-none text-paper">×</span>}
                </button>
                <span className={`min-w-0 flex-1 truncate ${t.status === "done" ? "text-mid line-through" : ""}`}>
                  {t.title}
                </span>
                {t.assigneeId && (
                  <Avatar initials={state.people.find((p) => p.id === t.assigneeId)?.initials ?? "?"} />
                )}
                <DueTag dueDate={t.dueDate} status={t.status} />
              </div>
            ))}
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTask.trim()) {
                  createTask({ title: newTask.trim(), commitmentId: id, assigneeId: state.meId, dueDate: null });
                  setNewTask("");
                }
              }}
              placeholder="Add a task and press Enter"
              className="w-full py-3 text-[15px]"
            />
          </div>
        </div>

        <div className="mt-10">
          <SectionLabel>Comments</SectionLabel>
          {c.comments.map((cm) => (
            <div key={cm.id} className="mb-5">
              <div className="label mb-1 text-mid">
                {personName(state, cm.authorId)} · {fmtDateTime(cm.at)}
              </div>
              <p>{cm.text}</p>
            </div>
          ))}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && comment.trim()) {
                e.preventDefault();
                addComment("commitment", id, comment.trim());
                setComment("");
              }
            }}
            placeholder="Comment — Enter to post"
            rows={2}
            className="hairline-b w-full resize-none py-2"
          />
        </div>

        <div className="mt-10 pb-6">
          <SectionLabel>Activity</SectionLabel>
          {[...c.activity].reverse().map((a, i) => (
            <div key={i} className="mb-2 flex items-baseline gap-3">
              <span className="label shrink-0 text-mid">{fmtDateTime(a.at)}</span>
              <span className="text-mid">
                {personName(state, a.actorId)} {a.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
