// Seeds ~20 realistic tasks + the team into $DATABASE_URL. Usage: npm run db:seed
// Idempotent-ish: upserts users/tasks, clears + reinserts activity & comments.
import postgres from 'postgres';
import { buildSeed } from '../lib/data/seed.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = postgres(url, { prepare: false });
const { users, tasks, activity, comments } = buildSeed(new Date());

try {
  for (const u of users) {
    await sql`
      insert into users (id, email, name, slack_user_id, timezone, is_founder)
      values (${u.id}, ${u.email}, ${u.name}, ${u.slackUserId ?? null}, ${u.timezone}, ${u.isFounder})
      on conflict (id) do update set
        email = excluded.email, name = excluded.name, slack_user_id = excluded.slack_user_id,
        timezone = excluded.timezone, is_founder = excluded.is_founder`;
  }

  for (const t of tasks) {
    await sql`
      insert into tasks
        (id, title, category, lead_id, collaborator_ids, status, deadline, notes,
         blocked_by, waiting_on, priority, last_touched, created_at, created_by,
         last_chased_at, status_changed_at)
      values
        (${t.id}, ${t.title}, ${t.category}, ${t.leadId}, ${sql.array(t.collaboratorIds)},
         ${t.status}, ${t.deadline}, ${t.notes}, ${t.blockedBy}, ${t.waitingOn},
         ${t.priority}, ${t.lastTouched}, ${t.createdAt}, ${t.createdBy},
         ${t.lastChasedAt}, ${t.statusChangedAt})
      on conflict (id) do nothing`;
  }

  await sql`delete from activity`;
  for (const a of activity) {
    await sql`
      insert into activity (id, task_id, actor_id, kind, summary, from_val, to_val, at)
      values (${a.id}, ${a.taskId}, ${a.actorId}, ${a.kind}, ${a.summary}, ${a.from}, ${a.to}, ${a.at})`;
  }

  await sql`delete from comments`;
  for (const c of comments) {
    await sql`
      insert into comments (id, task_id, author_id, body, mention_ids, at)
      values (${c.id}, ${c.taskId}, ${c.authorId}, ${c.body}, ${sql.array(c.mentionIds)}, ${c.at})`;
  }

  console.log(`✓ seeded ${users.length} users, ${tasks.length} tasks`);
} finally {
  await sql.end();
}
