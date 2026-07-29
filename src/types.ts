export type Status =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "done"
  | "dropped";

export interface Person {
  id: string;
  name: string;
  initials: string;
  city: "London" | "Paris" | "Berlin";
}

export interface Workstream {
  id: string;
  name: string;
  ownerId: string;
  description: string;
  archived: boolean;
}

export interface Activity {
  at: string; // ISO UTC
  actorId: string;
  text: string;
}

export interface Comment {
  id: string;
  authorId: string;
  at: string;
  text: string;
}

export interface Commitment {
  id: string;
  workstreamId: string;
  title: string;
  description: string;
  ownerId: string | null; // single named owner, never shared
  contributorIds: string[];
  dueDate: string | null; // YYYY-MM-DD
  originalDueDate: string | null; // never mutated after creation
  status: Status;
  blockedBy: string | null; // commitment id
  labels: string[];
  createdAt: string;
  completedAt: string | null;
  activity: Activity[];
  comments: Comment[];
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  commitmentId: string;
  title: string;
  assigneeId: string | null;
  dueDate: string | null;
  status: Status;
  checklist: ChecklistItem[];
  estimate: string | null;
  createdAt: string;
  completedAt: string | null;
  activity: Activity[];
  comments: Comment[];
}

export interface State {
  people: Person[];
  meId: string;
  workstreams: Workstream[];
  commitments: Commitment[];
  tasks: Task[];
}

export const STATUSES: { value: Status; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
  { value: "dropped", label: "Dropped" },
];

export const STATUS_LABEL: Record<Status, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
  dropped: "Dropped",
};
