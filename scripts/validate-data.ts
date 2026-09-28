import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const map: Record<string, string> = {
  'classes.json': 'classes.schema.json',
  'bells.json': 'bells.schema.json',
  'timetable.json': 'timetable.schema.json',
  'changes.json': 'changes.schema.json',
  'events.json': 'events.schema.json',
  'announcements.json': 'announcements.schema.json',
  'menu.json': 'menu.schema.json',
  'feedback.json': 'feedback.schema.json',
};

export function validateAll(dataDir = join(root, 'public/data'), schemaDir = join(root, 'schemas')): string[] {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const errors: string[] = [];
  for (const [file, schemaFile] of Object.entries(map)) {
    const p = join(dataDir, file);
    if (!existsSync(p)) { errors.push(`${file}: missing`); continue; }
    const data = JSON.parse(readFileSync(p, 'utf8'));
    const schema = JSON.parse(readFileSync(join(schemaDir, schemaFile), 'utf8'));
    const validate = ajv.compile(schema);
    const ok = validate(data);
    if (!ok) {
      for (const e of validate.errors ?? []) errors.push(`${file}${e.instancePath}: ${e.message} (${JSON.stringify(e.params)})`);
    }
  }
  return errors;
}

if (process.argv[1]?.endsWith('validate-data.ts') || process.argv[1]?.endsWith('validate-data.js')) {
  const errs = validateAll();
  if (errs.length > 0) {
    console.error('Data validation failed:');
    for (const e of errs) console.error(' -', e);
    process.exit(1);
  }
  console.log('All data files valid.');
}
void readdirSync;
