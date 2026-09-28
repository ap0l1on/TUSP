import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// Weekly prune: drop changes older than 30 days, expired announcements older than 60 days.
export function prune(
  changes: { version: number; changes: { date: string }[] },
  announcements: { version: number; announcements: { expires: string }[] },
  now = new Date(),
): { changes: typeof changes; announcements: typeof announcements; removedChanges: number; removedAnn: number } {
  const day = 86400000;
  const cCut = now.getTime() - 30 * day;
  const aCut = now.getTime() - 60 * day;
  const keptC = changes.changes.filter((c) => Date.parse(c.date + 'T00:00:00+03:00') >= cCut);
  const keptA = announcements.announcements.filter((a) => Date.parse(a.expires) >= aCut);
  return {
    changes: { ...changes, changes: keptC },
    announcements: { ...announcements, announcements: keptA },
    removedChanges: changes.changes.length - keptC.length,
    removedAnn: announcements.announcements.length - keptA.length,
  };
}

if (process.argv[1]?.includes('prune')) {
  const root = join(here, '..', 'public', 'data');
  const cp = join(root, 'changes.json');
  const ap = join(root, 'announcements.json');
  const c = JSON.parse(readFileSync(cp, 'utf8'));
  const a = JSON.parse(readFileSync(ap, 'utf8'));
  const r = prune(c, a, new Date());
  writeFileSync(cp, JSON.stringify(r.changes, null, 2) + '\n');
  writeFileSync(ap, JSON.stringify(r.announcements, null, 2) + '\n');
  console.log(`Pruned ${r.removedChanges} changes, ${r.removedAnn} announcements`);
}
