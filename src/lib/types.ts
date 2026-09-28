export interface ClassInfo { id: string; label: string; grade: number }
export interface ClassesData { version: number; classes: ClassInfo[] }
export type BellKind = 'lesson' | 'break' | 'lunch';
export interface BellSlot { n?: number; start: string; end: string; kind: BellKind }
export interface BellsData { version: number; dayTypes: Record<string, BellSlot[]>; weekdayMap: Record<string, string> }
export interface TimetableEntry { p: number; subject: string; teacher: string; room: string }
export interface TimetableData { version: number; classes: Record<string, Record<string, TimetableEntry[]>> }
export type ChangeType = 'cancelled' | 'substitute' | 'room' | 'moved' | 'extra';
export interface ChangeEntry { date: string; class: string; p: number; type: ChangeType; teacher?: string; room?: string; note?: string }
export interface ChangesData { version: number; changes: ChangeEntry[] }
export type EventKind = 'holiday' | 'dress_code' | 'conference' | 'exam' | 'trip' | 'ceremony' | 'early_dismissal' | 'other';
export interface CalEvent {
  id: string; kind: EventKind; title: string;
  date?: string; from?: string; to?: string;
  start?: string; end?: string; replacesPeriods?: number[];
  place?: string; audience?: string[];
}
export interface EventsData { version: number; events: CalEvent[] }
export type Priority = 'urgent' | 'normal' | 'info';
export interface Announcement {
  id: string; title: string; body: string; priority: Priority;
  audience: string[]; publish: string; expires: string; pinned: boolean; eventId?: string;
}
export interface AnnouncementsData { version: number; announcements: Announcement[] }
export interface MenuDay { soup: string; main: string; side: string; veg: string; dessert: string; salad: boolean; kcal?: number; allergens: string[]; note: string }
export interface MenuData { version: number; days: Record<string, MenuDay> }
export interface FeedbackData { version: number; formUrl: string; embed: boolean }
