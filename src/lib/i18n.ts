import tr from '../i18n/tr.json';
import en from '../i18n/en.json';

export type Lang = 'tr' | 'en';
type Dict = Record<string, string>;

const dicts: Record<Lang, Dict> = { tr: tr as Dict, en: en as Dict };

export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const d = dicts[lang] ?? dicts.tr;
  let s = d[key] ?? (dicts.tr[key] ?? key);
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function allKeys(): string[] { return Object.keys(tr); }

export function missingKeys(): { missingInEn: string[]; missingInTr: string[] } {
  const tk = new Set(Object.keys(tr));
  const ek = new Set(Object.keys(en));
  return {
    missingInEn: [...tk].filter((k) => !ek.has(k)),
    missingInTr: [...ek].filter((k) => !tk.has(k)),
  };
}
