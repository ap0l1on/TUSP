const K_CLASS = 'tusp.class';
const K_LANG = 'tusp.lang';
const K_DISMISSED = 'tusp.dismissed';

function safeGet(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function safeSet(k: string, v: string): void {
  try { localStorage.setItem(k, v); } catch { /* storage unavailable: ask each visit */ }
}

export function getClass(): string | null { return safeGet(K_CLASS); }
export function setClass(id: string): void { safeSet(K_CLASS, id); }
export function getLang(): 'tr' | 'en' {
  const v = safeGet(K_LANG);
  return v === 'en' ? 'en' : 'tr';
}
export function setLang(l: 'tr' | 'en'): void { safeSet(K_LANG, l); }
export function getDismissed(): string[] {
  try { return JSON.parse(safeGet(K_DISMISSED) ?? '[]') as string[]; } catch { return []; }
}
export function dismiss(id: string): void {
  const cur = new Set(getDismissed());
  cur.add(id);
  safeSet(K_DISMISSED, JSON.stringify([...cur]));
}
