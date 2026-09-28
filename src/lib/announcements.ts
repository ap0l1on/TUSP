import type { AnnouncementsData, Announcement, CalEvent } from './types';

export function audienceMatch(audience: string[] | undefined, classId: string, gradeOf: (c: string) => number | null): boolean {
  if (!audience || audience.length === 0) return true;
  if (audience.includes('all')) return true;
  if (audience.includes(classId)) return true;
  const g = gradeOf(classId);
  if (g != null && audience.includes(`grade:${g}`)) return true;
  return false;
}

export function visibleAnnouncements(
  data: AnnouncementsData, now: Date, classId: string, gradeOf: (c: string) => number | null,
): Announcement[] {
  const t = now.getTime();
  return data.announcements.filter((a) => {
    if (Date.parse(a.publish) > t) return false;
    if (Date.parse(a.expires) <= t) return false;
    return audienceMatch(a.audience, classId, gradeOf);
  }).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const pr = (p: string) => (p === 'urgent' ? 0 : p === 'normal' ? 1 : 2);
    if (pr(a.priority) !== pr(b.priority)) return pr(a.priority) - pr(b.priority);
    return Date.parse(b.publish) - Date.parse(a.publish);
  });
}

export function relativeTime(iso: string, now: Date, lang: 'tr' | 'en'): string {
  const diffMs = now.getTime() - Date.parse(iso);
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (lang === 'tr') {
    if (mins < 1) return 'az önce';
    if (mins < 60) return `${mins} dk önce`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h} saat önce`;
    return `${Math.floor(h / 24)} gün önce`;
  }
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function eventOnDay(e: CalEvent, iso: string): boolean {
  if (e.date) return e.date === iso;
  if (e.from && e.to) return e.from <= iso && iso <= e.to;
  return false;
}
