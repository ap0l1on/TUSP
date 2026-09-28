import { describe, it, expect } from 'vitest';
import ann from '../public/data/announcements.json';
import classes from '../public/data/classes.json';
import { visibleAnnouncements } from '../src/lib/announcements';
import type { AnnouncementsData, ClassesData } from '../src/lib/types';
import { gradeOf } from '../src/lib/data';

const A = ann as unknown as AnnouncementsData;
const C = classes as unknown as ClassesData;
const g = (c: string) => gradeOf(C, c);
const NOW = new Date('2026-09-28T10:00:00+03:00');

describe('announcements', () => {
  it('future publish hidden, expired hidden, pinned/urgent order, audience', () => {
    const v = visibleAnnouncements(A, NOW, '9A', g);
    expect(v.some((a) => a.id === 'a-future-1')).toBe(false);
    expect(v.some((a) => a.id === 'a-expired-1')).toBe(false);
    expect(v.some((a) => a.id === 'a-acil-1')).toBe(true);
    // pinned first
    expect(v[0]?.pinned).toBe(true);
  });
  it('grade audience respected', () => {
    const data: AnnouncementsData = {
      version: 1,
      announcements: [
        { id: 'x1', title: 't', body: 'b', priority: 'normal', audience: ['grade:9'], publish: '2026-01-01T00:00:00+03:00', expires: '2027-01-01T00:00:00+03:00', pinned: false },
      ],
    };
    expect(visibleAnnouncements(data, NOW, '9A', g).length).toBe(1);
    expect(visibleAnnouncements(data, NOW, '10A', g).length).toBe(0);
  });
});
