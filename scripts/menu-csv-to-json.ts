import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// CSV: date,soup,main,side,veg,dessert,salad,kcal,allergens,note
// allergens separated by |, salad true/false
export function menuCsvToJson(csv: string): { json: { version: number; days: Record<string, unknown> }; errors: string[] } {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const errors: string[] = [];
  if (lines.length === 0) return { json: { version: 1, days: {} }, errors: ['empty csv'] };
  const header = (lines[0] ?? '').split(',').map((s) => s.trim().toLowerCase());
  const expected = ['date', 'soup', 'main', 'side', 'veg', 'dessert', 'salad', 'kcal', 'allergens', 'note'];
  if (header.join(',') !== expected.join(',')) errors.push(`bad header: expected ${expected.join(',')}, got ${lines[0]}`);
  const days: Record<string, unknown> = {};
  lines.slice(1).forEach((line, idx) => {
    const rowNo = idx + 2;
    const cols = line.split(',').map((s) => s.trim());
    if (cols.length !== 10) { errors.push(`row ${rowNo}: expected 10 cols, got ${cols.length}`); return; }
    const [date, soup, main, side, veg, dessert, saladStr, kcalStr, allergensStr, note] = cols as string[];
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date ?? '')) { errors.push(`row ${rowNo}: bad date ${date}`); return; }
    if (!main) { errors.push(`row ${rowNo}: empty main`); return; }
    const salad = (saladStr ?? '').toLowerCase();
    if (salad !== 'true' && salad !== 'false') { errors.push(`row ${rowNo}: salad must be true/false`); return; }
    let kcal: number | undefined;
    if (kcalStr) {
      kcal = Number(kcalStr);
      if (!Number.isInteger(kcal) || kcal < 0) { errors.push(`row ${rowNo}: bad kcal ${kcalStr}`); return; }
    }
    const allergens = (allergensStr ?? '').split('|').map((s) => s.trim()).filter(Boolean);
    days[date as string] = {
      soup: soup ?? '', main, side: side ?? '', veg: veg ?? '', dessert: dessert ?? '',
      salad: salad === 'true', ...(kcal != null ? { kcal } : {}), allergens, note: note ?? '',
    };
  });
  return { json: { version: 1, days }, errors };
}

if (process.argv[1]?.includes('menu-csv-to-json')) {
  const src = process.argv[2] ?? join(here, '..', 'data-src', 'menu.csv');
  const out = process.argv[3] ?? join(here, '..', 'public', 'data', 'menu.json');
  try {
    const csv = readFileSync(src, 'utf8');
    const { json, errors } = menuCsvToJson(csv);
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
