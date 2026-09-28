import type { AnnouncementsData, BellsData, ChangesData, ClassesData, EventsData, FeedbackData, MenuData, TimetableData } from './types';

export interface AllData {
  classes: ClassesData;
  bells: BellsData;
  timetable: TimetableData;
  changes: ChangesData;
  events: EventsData;
  announcements: AnnouncementsData;
  menu: MenuData;
  feedback: FeedbackData;
  fetchedAt: Date;
}

const BASE = import.meta.env.BASE_URL || '/tusp/';

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}data/${path}`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function loadAll(): Promise<AllData> {
  const [classes, bells, timetable, changes, events, announcements, menu, feedback] = await Promise.all([
    getJSON<ClassesData>('classes.json'),
    getJSON<BellsData>('bells.json'),
    getJSON<TimetableData>('timetable.json'),
    getJSON<ChangesData>('changes.json'),
    getJSON<EventsData>('events.json'),
    getJSON<AnnouncementsData>('announcements.json'),
    getJSON<MenuData>('menu.json'),
    getJSON<FeedbackData>('feedback.json'),
  ]);
  return { classes, bells, timetable, changes, events, announcements, menu, feedback, fetchedAt: new Date() };
}

export function gradeOf(classes: ClassesData, classId: string): number | null {
  return classes.classes.find((c) => c.id === classId)?.grade ?? null;
}
