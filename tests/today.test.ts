import { describe, it, expect } from 'vitest';
import bells from '../public/data/bells.json';
import tt from '../public/data/timetable.json';
import changes from '../public/data/changes.json';
import events from '../public/data/events.json';
import { mergeDay, computeNow, bellsForDate } from '../src/lib/today';
import type { BellsData, ChangesData, EventsData, TimetableData } from '../src/lib/types';

// Helper: Istanbul 2026-09-28 is Monday. Build Date at given Istanbul HH:MM via offset (+03:00, no DST in TR).
function at(iso: string, hm: string): Date {
  return new Date(`${iso}T${hm}:00+03:00`);
}

const B = bells as unknown as BellsData;
const TT = tt as unknown as TimetableData;

describe('now logic', () => {
  it('before 08:00', () => {
    const iso = '2026-09-28';
    const m = mergeDay(iso, '9A', B, TT, { version: 1, changes: [] }, { version: 1, events: [] });
    const s = computeNow(at(iso, '07:30'), iso, m.rows, null, '');
    expect(s.kind).toBe('before');
  });
  it('mid-lesson', () => {
    const iso = '2026-09-28';
    const m = mergeDay(iso, '9A', B, TT, { version: 1, changes: [] }, { version: 1, events: [] });
    const s = computeNow(at(iso, '08:10'), iso, m.rows, null, '');
    expect(s.kind).toBe('lesson');
    if (s.kind === 'lesson') expect(s.n).toBe(1);
  });
  it('break', () => {
    const iso = '2026-09-28';
    const m = mergeDay(iso, '9A', B, TT, { version: 1, changes: [] }, { version: 1, events: [] });
    const s = computeNow(at(iso, '08:45'), iso, m.rows, null, '');
    expect(s.kind).toBe('break');
  });
  it('lunch shows dish', () => {
    const iso = '2026-09-28';
    const m = mergeDay(iso, '9A', B, TT, { version: 1, changes: [] }, { version: 1, events: [] });
    const s = computeNow(at(iso, '12:00'), iso, m.rows, null, 'Tavuk');
    expect(s.kind).toBe('lunch');
  });
  it('after school', () => {
    const iso = '2026-09-28'; // Mon ends 13:10
    const m = mergeDay(iso, '9A', B, TT, { version: 1, changes: [] }, { version: 1, events: [] });
    const s = computeNow(at(iso, '15:00'), iso, m.rows, null, '');
    expect(s.kind).toBe('after');
  });
  it('Friday periods 7-9 exist', () => {
    const rows = bellsForDate(B, '2026-10-02'); // Friday
    const ns = rows.filter((r) => r.kind === 'lesson').map((r) => r.n);
    expect(ns).toContain(7);
    expect(ns).toContain(9);
  });
  it('weekend', () => {
    const iso = '2026-10-04'; // Sunday
    const m = mergeDay(iso, '9A', B, TT, { version: 1, changes: [] }, { version: 1, events: [] });
    const s = computeNow(at(iso, '10:00'), iso, m.rows, null, '');
    expect(s.kind).toBe('none');
  });
  it('holiday range', () => {
    const iso = '2026-11-10';
    const EV = events as unknown as EventsData;
    const m = mergeDay(iso, '9A', B, TT, { version: 1, changes: [] }, EV);
    expect(m.holiday?.title).toBe('Ara tatil');
    const s = computeNow(at(iso, '10:00'), iso, m.rows, m.holiday, '');
    expect(s.kind).toBe('none');
    if (s.kind === 'none') expect(s.reason).toBe('holiday');
  });
  it('device in different TZ still Istanbul time', () => {
    // 05:00 UTC = 08:00 Istanbul → first lesson started
    const d = new Date('2026-09-28T05:05:00Z');
    const iso = '2026-09-28';
    const m = mergeDay(iso, '9A', B, TT, { version: 1, changes: [] }, { version: 1, events: [] });
    const s = computeNow(d, iso, m.rows, null, '');
    expect(s.kind).toBe('lesson');
  });
});

describe('today merge', () => {
  it('cancelled + substitute + room + all + event replaces 5-6 + grade audience', () => {
    const CH = changes as unknown as ChangesData;
    const EV = events as unknown as EventsData;
    // 2026-10-13 is Tuesday: cancelled p3, substitute p4 for 9A, moved p5 all
    const m = mergeDay('2026-10-13', '9A', B, TT, CH, { version: 1, events: [] });
    const p3 = m.rows.find((r) => r.n === 3);
    const p4 = m.rows.find((r) => r.n === 4);
    const p5 = m.rows.find((r) => r.n === 5);
    expect(p3?.status).toBe('cancelled');
    expect(p4?.status).toBe('substitute');
    expect(p5?.status).toBe('moved');
    // room change sample on 2026-09-28 p2
    const m2 = mergeDay('2026-09-28', '9A', B, TT, CH, { version: 1, events: [] });
    const r2 = m2.rows.find((r) => r.n === 2);
    expect(r2?.status).toBe('room');
    expect(r2?.room).toBe('Lab-2');
    expect(r2?.oldRoom).toBe('B-204');
    // conference replacing 5-6 for grades 11-12 (IB1A grade 11)
    const m3 = mergeDay('2026-10-20', 'IB1A', B, TT, { version: 1, changes: [] }, EV);
    expect(m3.rows.some((r) => r.kind === 'event' && r.eventTitle?.includes('Konferans'))).toBe(true);
    expect(m3.rows.some((r) => r.n === 5 || r.n === 6)).toBe(false);
  });
});
