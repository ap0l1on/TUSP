import { istanbulISODate, istanbulMinutes, istanbulParts, parseHM, weekdayOfISO } from './time';
import type { BellsData, BellSlot, CalEvent, ChangesData, EventsData, TimetableData } from './types';
import { eventOnDay } from './announcements';

export interface MergedRow {
  key: string;
  kind: 'lesson' | 'break' | 'lunch' | 'event';
  n?: number;
  start: string;
  end: string;
  subject?: string;
  teacher?: string;
  room?: string;
  oldRoom?: string;
  status?: 'cancelled' | 'substitute' | 'room' | 'moved' | 'extra' | 'event';
  note?: string;
  eventTitle?: string;
  place?: string;
}

export function dayTypeFor(bells: BellsData, weekday: number): string {
  return bells.weekdayMap[String(weekday)] ?? 'mon_thu';
}

export function bellsForDate(bells: BellsData, iso: string): BellSlot[] {
  const wd = weekdayOfISO(iso);
  if (wd === 0 || wd === 6) return [];
  return bells.dayTypes[dayTypeFor(bells, wd)] ?? [];
}

export function holidayFor(iso: string, events: EventsData): CalEvent | null {
  for (const e of events.events) {
    if (e.kind === 'holiday' && eventOnDay(e, iso)) return e;
  }
  return null;
}

export function mergeDay(
  iso: string, classId: string,
  bells: BellsData, tt: TimetableData, changes: ChangesData, events: EventsData,
): { rows: MergedRow[]; chips: CalEvent[]; holiday: CalEvent | null; hasTimetable: boolean } {
  const slots = bellsForDate(bells, iso);
  const wd = weekdayOfISO(iso);
  const dayTT = tt.classes[classId]?.[String(wd)] ?? [];
  const hasTimetable = dayTT.length > 0;
  const byP = new Map(dayTT.map((e) => [e.p, e]));
  const todaysChanges = changes.changes.filter(
    (c) => c.date === iso && (c.class === classId || c.class === 'all'),
  );
  // class-specific wins over "all"
  const changeByP = new Map<number, (typeof todaysChanges)[number]>();
  for (const c of todaysChanges.filter((c) => c.class === 'all')) changeByP.set(c.p, c);
  for (const c of todaysChanges.filter((c) => c.class === classId)) changeByP.set(c.p, c);

  const todaysEvents = events.events.filter(
    (e) => eventOnDay(e, iso) && (!e.audience || e.audience.includes('all') || e.audience.includes(classId) || e.audience.some((a) => a.startsWith('grade:'))),
  );
  const holiday = holidayFor(iso, events);
  // audience filter for chips: keep all + class; grade:N needs grade lookup — caller filters further; keep here permissive
  const replacing = todaysEvents.find((e) => e.replacesPeriods && e.replacesPeriods.length > 0);
  const replaced = new Set(replacing?.replacesPeriods ?? []);
  const chips = todaysEvents.filter((e) => e !== replacing);

  const rows: MergedRow[] = [];
  let eventInserted = false;
  for (const s of slots) {
    if (s.kind === 'lesson' && s.n != null && replaced.has(s.n)) {
      if (!eventInserted && replacing) {
        rows.push({
          key: `event-${replacing.id}`, kind: 'event', status: 'event',
          start: replacing.start ?? s.start, end: replacing.end ?? s.end,
          eventTitle: replacing.title, place: replacing.place, note: replacing.title,
        });
        eventInserted = true;
      }
      continue;
    }
    if (s.kind !== 'lesson') {
      rows.push({ key: `${s.kind}-${s.start}`, kind: s.kind, start: s.start, end: s.end });
      continue;
    }
    const n = s.n ?? 0;
    const entry = byP.get(n);
    const ch = changeByP.get(n);
    if (!entry) {
      rows.push({ key: `p-${n}`, kind: 'lesson', n, start: s.start, end: s.end, subject: '', teacher: '', room: '' });
      continue;
    }
    if (!ch) {
      rows.push({ key: `p-${n}`, kind: 'lesson', n, start: s.start, end: s.end, subject: entry.subject, teacher: entry.teacher, room: entry.room });
    } else if (ch.type === 'cancelled') {
      rows.push({ key: `p-${n}`, kind: 'lesson', n, start: s.start, end: s.end, subject: entry.subject, teacher: entry.teacher, room: entry.room, status: 'cancelled', note: ch.note });
    } else if (ch.type === 'substitute') {
      rows.push({ key: `p-${n}`, kind: 'lesson', n, start: s.start, end: s.end, subject: entry.subject, teacher: ch.teacher ?? entry.teacher, room: entry.room, status: 'substitute', note: ch.note });
    } else if (ch.type === 'room') {
      rows.push({ key: `p-${n}`, kind: 'lesson', n, start: s.start, end: s.end, subject: entry.subject, teacher: entry.teacher, room: ch.room ?? entry.room, oldRoom: entry.room, status: 'room', note: ch.note });
    } else {
      rows.push({ key: `p-${n}`, kind: 'lesson', n, start: s.start, end: s.end, subject: entry.subject, teacher: entry.teacher, room: entry.room, status: ch.type, note: ch.note ?? (ch.type === 'moved' ? ch.note : undefined) });
    }
  }
  return { rows, chips, holiday, hasTimetable };
}

export type NowState =
  | { kind: 'lesson'; n: number; subject: string; room: string; startMin: number; endMin: number }
  | { kind: 'break'; endMin: number; nextN?: number; nextSubject?: string }
  | { kind: 'lunch'; endMin: number; dish: string }
  | { kind: 'before'; firstStart: string; firstSubject: string }
  | { kind: 'after'; firstNext: string }
  | { kind: 'none'; reason: 'weekend' | 'holiday'; name?: string };

export function computeNow(
  now: Date, iso: string, rows: MergedRow[], holiday: CalEvent | null, mainDish: string,
): NowState {
  const wd = weekdayOfISO(iso);
  if (wd === 0 || wd === 6) return { kind: 'none', reason: 'weekend' };
  if (holiday) return { kind: 'none', reason: 'holiday', name: holiday.title };
  if (rows.length === 0) return { kind: 'none', reason: 'weekend' };
  const mins = istanbulMinutes(now);
  const first = rows[0];
  if (first && mins < parseHM(first.start)) {
    const firstLesson = rows.find((r) => r.kind === 'lesson');
    return { kind: 'before', firstStart: first.start, firstSubject: firstLesson?.subject ?? '' };
  }
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const s = parseHM(r.start);
    const e = parseHM(r.end);
    if (mins >= s && mins < e) {
      if (r.kind === 'lesson') {
        if (r.status === 'cancelled') {
          const nxt = rows.slice(i + 1).find((x) => x.kind === 'lesson' && x.status !== 'cancelled');
          return { kind: 'break', endMin: e, nextN: nxt?.n, nextSubject: nxt?.subject };
        }
        return { kind: 'lesson', n: r.n ?? 0, subject: r.subject ?? '', room: r.room ?? '', startMin: s, endMin: e };
      }
      if (r.kind === 'lunch') return { kind: 'lunch', endMin: e, dish: mainDish };
      const nxt = rows.slice(i + 1).find((x) => x.kind === 'lesson' && x.status !== 'cancelled');
      return { kind: 'break', endMin: e, nextN: nxt?.n, nextSubject: nxt?.subject };
    }
  }
  const last = rows[rows.length - 1];
  if (last && mins >= parseHM(last.end)) {
    return { kind: 'after', firstNext: '' };
  }
  return { kind: 'before', firstStart: first?.start ?? '08:00', firstSubject: '' };
}

export function todayISO(now: Date): string { return istanbulISODate(now); }
export function currentParts(now: Date) { return istanbulParts(now); }
