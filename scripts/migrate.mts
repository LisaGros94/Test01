// Applies db/schema.sql to $DATABASE_URL. Usage: npm run db:migrate
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import postgres from 'postgres';

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = postgres(url, { prepare: false });
const schema = readFileSync(join(here, '..', 'db', 'schema.sql'), 'utf8');

try {
  await sql.unsafe(schema);
  console.log('✓ schema applied');
} finally {
  await sql.end();
}
