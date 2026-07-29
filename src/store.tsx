import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Commitment, KnowledgeLink, State, Status, Task } from "./types";
import { seed } from "./seed";
import { todayISO, uid, weekOf } from "./lib";
import { STATUS_LABEL } from "./types";

const KEY = "blanche-hq-v1";

interface Store {
  state: State;
  updateCommitment: (id: string, patch: Partial<Commitment>, log?: string) => void;
  updateTask: (id: string, patch: Partial<Task>, log?: string) => void;
  createCommitment: (input: { title: string; workstreamId: string; ownerId: string | null; dueDate: string | null; labels: string[] }) => string;
  createTask: (input: { title: string; commitmentId: string; assigneeId: string | null; dueDate: string | null }) => void;
  addComment: (kind: "commitment" | "task", id: string, text: string) => void;
  bulkUpdate: (ids: string[], patch: Partial<Commitment>, log: string) => void;
  addKnowledgeLink: (input: Omit<KnowledgeLink, "id">) => void;
  removeKnowledgeLink: (id: string) => void;
  recordMetric: (id: string, value: number) => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      // Migrate stores saved before newer modules existed
      const fresh = seed();
      if (!parsed.knowledgeLinks) parsed.knowledgeLinks = fresh.knowledgeLinks;
      if (!parsed.metrics) parsed.metrics = fresh.metrics;
      parsed.metrics = parsed.metrics.map((m) =>
        m.id === "m1" || m.id === "m2" ? { ...m, focus: true } : m
      );
      for (const c of fresh.commitments) {
        if (!parsed.commitments.some((x) => x.id === c.id) && c.status === "done") {
          parsed.commitments.push(c); // backfill trend history
        }
      }
      return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  return seed();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const store = useMemo<Store>(() => {
    const stamp = (log: string) => ({
      at: new Date().toISOString(),
      actorId: state.meId,
      text: log,
    });

    const withStatusSideEffects = <T extends Commitment | Task>(item: T, patch: Partial<T>): Partial<T> => {
      const p = { ...patch };
      if (p.status && p.status !== item.status) {
        (p as { completedAt?: string | null }).completedAt =
          p.status === "done" ? new Date().toISOString() : null;
      }
      return p;
    };

    return {
      state,
      updateCommitment: (id, patch, log) =>
        setState((s) => ({
          ...s,
          commitments: s.commitments.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...withStatusSideEffects(c, patch),
                  activity: log ? [...c.activity, stamp(log)] : c.activity,
                }
              : c
          ),
        })),
      updateTask: (id, patch, log) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...withStatusSideEffects(t, patch),
                  activity: log ? [...t.activity, stamp(log)] : t.activity,
                }
              : t
          ),
        })),
      createCommitment: (input) => {
        const id = uid("c");
        const item: Commitment = {
          id,
          workstreamId: input.workstreamId,
          title: input.title,
          description: "",
          ownerId: input.ownerId,
          contributorIds: [],
          dueDate: input.dueDate,
          originalDueDate: input.dueDate, // frozen at creation — on-time % measures against this
          status: "not_started",
          blockedBy: null,
          labels: input.labels,
          createdAt: new Date().toISOString(),
          completedAt: null,
          activity: [{ at: new Date().toISOString(), actorId: state.meId, text: "created this commitment" }],
          comments: [],
        };
        setState((s) => ({ ...s, commitments: [item, ...s.commitments] }));
        return id;
      },
      createTask: (input) => {
        const item: Task = {
          id: uid("t"),
          commitmentId: input.commitmentId,
          title: input.title,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate,
          status: "not_started",
          checklist: [],
          estimate: null,
          createdAt: new Date().toISOString(),
          completedAt: null,
          activity: [{ at: new Date().toISOString(), actorId: state.meId, text: "created this task" }],
          comments: [],
        };
        setState((s) => ({ ...s, tasks: [...s.tasks, item] }));
      },
      addComment: (kind, id, text) => {
        const comment = { id: uid("cm"), authorId: state.meId, at: new Date().toISOString(), text };
        setState((s) =>
          kind === "commitment"
            ? { ...s, commitments: s.commitments.map((c) => (c.id === id ? { ...c, comments: [...c.comments, comment] } : c)) }
            : { ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, comments: [...t.comments, comment] } : t)) }
        );
      },
      bulkUpdate: (ids, patch, log) =>
        setState((s) => ({
          ...s,
          commitments: s.commitments.map((c) =>
            ids.includes(c.id)
              ? { ...c, ...patch, activity: [...c.activity, stamp(log)] }
              : c
          ),
        })),
      addKnowledgeLink: (input) =>
        setState((s) => ({
          ...s,
          knowledgeLinks: [...s.knowledgeLinks, { ...input, id: uid("k") }],
        })),
      removeKnowledgeLink: (id) =>
        setState((s) => ({
          ...s,
          knowledgeLinks: s.knowledgeLinks.filter((k) => k.id !== id),
        })),
      recordMetric: (id, value) =>
        setState((s) => ({
          ...s,
          metrics: s.metrics.map((m) => {
            if (m.id !== id) return m;
            const wk = weekOf(new Date());
            const history = m.history.some((h) => h.weekOf === wk)
              ? m.history.map((h) => (h.weekOf === wk ? { ...h, value } : h))
              : [...m.history.slice(-11), { weekOf: wk, value }];
            return { ...m, history, updatedAt: new Date().toISOString() };
          }),
        })),
      resetDemo: () => {
        localStorage.removeItem(KEY);
        setState(seed());
      },
    };
  }, [state]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

export function statusLog(to: Status): string {
  return `set status to ${STATUS_LABEL[to]}`;
}

export function isDueSoon(due: string | null): boolean {
  if (!due) return false;
  const today = todayISO();
  const in3 = new Date();
  in3.setDate(in3.getDate() + 3);
  return due >= today && due <= in3.toISOString().slice(0, 10);
}
