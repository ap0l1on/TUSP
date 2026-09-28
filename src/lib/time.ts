// Istanbul-time helpers. All "now" logic uses Europe/Istanbul regardless of device TZ.
export const TZ = 'Europe/Istanbul';

export function istanbulParts(date: Date): { y: number; m: number; d: number; hh: number; mm: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const wdStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    y: Number(get('year')), m: Number(get('month')), d: Number(get('day')),
    hh: Number(get('hour')) % 24, mm: Number(get('minute')),
    weekday: wdMap[wdStr] ?? 1,
  };
}

export function toISODate(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

export function istanbulISODate(date: Date): string {
  const p = istanbulParts(date);
  return toISODate(p.y, p.m, p.d);
}

export function istanbulMinutes(date: Date): number {
  const p = istanbulParts(date);
  return p.hh * 60 + p.mm;
}

export function parseHM(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function addDaysISO(iso: string, delta: number): string {
  // interpret as Istanbul calendar day; use noon UTC to avoid DST edges
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1, 9, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return toISODate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function weekdayOfISO(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1, 9, 0, 0));
  return dt.getUTCDay();
}

export function formatTRDate(iso: string, lang: 'tr' | 'en'): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1, 9, 0, 0));
  const locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(dt);
}

export function formatHM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function nowUpdatedLabel(d: Date, lang: 'tr' | 'en'): string {
  const p = istanbulParts(d);
  return `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`;
}
