import { NextResponse } from 'next/server';
import { importTasks, type ImportRow } from '@/lib/service';
import { getCurrentUserId } from '@/lib/auth';

// Import from a Google Sheet exported as CSV/TSV, or as pre-parsed rows.
// Columns: Category | Task | Lead | Status | Deadline | Notes.
export async function POST(req: Request) {
  const actorId = await getCurrentUserId();
  const body = await req.json().catch(() => ({}));

  let rows: ImportRow[] = [];
  if (Array.isArray(body.rows)) {
    rows = body.rows;
  } else if (typeof body.csv === 'string') {
    rows = parseDelimited(body.csv);
  } else {
    return NextResponse.json({ error: 'Provide `rows` or `csv`.' }, { status: 400 });
  }

  const result = await importTasks(rows, actorId);
  return NextResponse.json(result);
}

/** Minimal CSV/TSV parser (handles quoted fields, comma or tab delimiter). */
function parseDelimited(text: string): ImportRow[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const delim = lines[0].includes('\t') ? '\t' : ',';
  const header = splitLine(lines[0], delim).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = splitLine(line, delim);
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
    return row as ImportRow;
  });
}

function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
