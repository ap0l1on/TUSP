import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// CSV: class,weekday,p,subject,teacher,room
// weekday 1-5, header required
export function timetableCsvToJson(csv: string): { json: { version: number; classes: Record<string, Record<string, { p: number; subject: string; teacher: string; room: string }[]>> }; errors: string[] } {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const errors: string[] = [];
  if (lines.length === 0) return { json: { version: 1, classes: {} }, errors: ['empty csv'] };
  const header = (lines[0] ?? '').split(',').map((s) => s.trim().toLowerCase());
  const expected = ['class', 'weekday', 'p', 'subject', 'teacher', 'room'];
  if (header.join(',') !== expected.join(',')) errors.push(`bad header: expected ${expected.join(',')}, got ${lines[0]}`);
  const classes: Record<string, Record<string, { p: number; subject: string; teacher: string; room: string }[]>> = {};
  lines.slice(1).forEach((line, idx) => {
    const rowNo = idx + 2;
    // naive CSV split (no quoted commas in template)
    const cols = line.split(',').map((s) => s.trim());
    if (cols.length !== 6) { errors.push(`row ${rowNo}: expected 6 cols, got ${cols.length}`); return; }
    const [cls, wd, pStr, subject, teacher, room] = cols as [string, string, string, string, string, string];
    if (!cls) { errors.push(`row ${rowNo}: empty class`); return; }
    const w = Number(wd);
    const p = Number(pStr);
    if (!Number.isInteger(w) || w < 1 || w > 5) { errors.push(`row ${rowNo}: bad weekday ${wd}`); return; }
    if (!Number.isInteger(p) || p < 1 || p > 12) { errors.push(`row ${rowNo}: bad period ${pStr}`); return; }
    if (!subject) { errors.push(`row ${rowNo}: empty subject`); return; }
    classes[cls] ??= {};
    classes[cls][String(w)] ??= [];
    classes[cls][String(w)]?.push({ p, subject, teacher: teacher ?? '', room: room ?? '' });
  });
  for (const cls of Object.keys(classes)) {
    for (const w of Object.keys(classes[cls] ?? {})) {
      classes[cls]?.[w]?.sort((a, b) => a.p - b.p);
    }
  }
  return { json: { version: 1, classes }, errors };
}

if (process.argv[1]?.includes('timetable-csv-to-json')) {
  const src = process.argv[2] ?? join(here, '..', 'data-src', 'timetable.csv');
  const out = process.argv[3] ?? join(here, '..', 'public', 'data', 'timetable.json');
  try {
    const csv = readFileSync(src, 'utf8');
    const { json, errors } = timetableCsvToJson(csv);
    if (errors.length > 0) {
      console.error('CSV errors:');
      for (const e of errors) console.error(' -', e);
      process.exit(1);
    }
    writeFileSync(out, JSON.stringify(json, null, 2) + '\n');
    console.log(`Wrote ${out}`);
  } catch (e) {
    console.error(String(e));
    process.exit(1);
  }
}
