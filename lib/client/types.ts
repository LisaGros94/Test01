// Client-safe re-exports + view helpers. lib/types.ts is pure types/consts with
// no server imports, so it's safe in the browser bundle.
export type {
  Task,
  User,
  Category,
  Status,
  Priority,
  Activity,
  Comment,
  TriggerType,
} from '../types';
export { CATEGORIES, STATUSES, PRIORITIES, TRIGGER_TYPES } from '../types';

export interface TaskPatchInput {
  title?: string;
  category?: string;
  leadId?: string;
  collaboratorIds?: string[];
  status?: string;
  deadline?: string | null;
  notes?: string;
  blockedBy?: string | null;
  waitingOn?: string | null;
  priority?: string;
}
