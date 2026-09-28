import type { Announcement, CalEvent } from './types';

export function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsDate(dateISO: string, hm?: string): string {
  // Floating time in Europe/Istanbul — use TZID param at usage site; here return local format
  const d = dateISO.replaceAll('-', '');
  if (!hm) return d;
  return `${d}T${hm.replace(':', '')}00`;
}

export function announcementICS(a: Announcement, ev?: CalEvent): string {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  let dtstart = '', dtend = '';
  if (ev?.date && ev?.start) {
    dtstart = `DTSTART;TZID=Europe/Istanbul:${icsDate(ev.date, ev.start)}`;
    dtend = ev.end ? `DTEND;TZID=Europe/Istanbul:${icsDate(ev.date, ev.end)}` : '';
  } else if (ev?.from) {
    dtstart = `DTSTART;VALUE=DATE:${icsDate(ev.from)}`;
    dtend = ev.to ? `DTEND;VALUE=DATE:${icsDate(ev.to)}` : '';
  } else {
    const d = a.publish.slice(0, 10).replaceAll('-', '');
    dtstart = `DTSTART;VALUE=DATE:${d}`;
  }
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TUSP//TR',
    'BEGIN:VEVENT',
    `UID:${icsEscape(a.id)}@tusp`,
    `DTSTAMP:${dtstamp}`,
    dtstart,
    ...(dtend ? [dtend] : []),
    `SUMMARY:${icsEscape(a.title)}`,
    `DESCRIPTION:${icsEscape(a.body.slice(0, 500))}`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadICS(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const aEl = document.createElement('a');
  aEl.href = url;
  aEl.download = filename;
  document.body.appendChild(aEl);
  aEl.click();
  aEl.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
