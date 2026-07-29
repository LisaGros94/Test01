// Storage interface. Deliberately dumb: primitive get/put/list only. All
// business logic (diffing a change into activity, deciding what fires a
// notification) lives in one place — lib/service.ts — on top of this, so it is
// written once and shared by both the in-memory and Postgres backends.

import type {
  Activity,
  Comment,
  NotificationPref,
  SentNotification,
  Task,
  User,
} from '../types';

export interface Store {
  allTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  putTask(t: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;

  allActivity(): Promise<Activity[]>;
  activityForTask(id: string): Promise<Activity[]>;
  putActivity(a: Activity): Promise<void>;

  commentsForTask(id: string): Promise<Comment[]>;
  putComment(c: Comment): Promise<void>;

  allUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | null>;

  allPrefs(): Promise<NotificationPref[]>;
  putPref(p: NotificationPref): Promise<void>;

  allSent(): Promise<SentNotification[]>;
  putSent(rows: SentNotification[]): Promise<void>;
}
