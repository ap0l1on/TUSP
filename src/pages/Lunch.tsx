import { h } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import type { AllData } from '../lib/data';
import { t, type Lang } from '../lib/i18n';
import { addDaysISO, istanbulISODate, weekdayOfISO } from '../lib/time';
import { holidayFor } from '../lib/today';
import { eventOnDay } from '../lib/announcements';

function mondayOf(iso: string): string {
  const wd = weekdayOfISO(iso); // 0 Sun..6 Sat
  const delta = wd === 0 ? -6 : 1 - wd;
  return addDaysISO(iso, delta);
}

export function LunchPage({ data, lang, now }: { data: AllData; lang: Lang; now: Date }) {
  const todayISO = istanbulISODate(now);
  const tomorrowISO = addDaysISO(todayISO, 1);
  const [sel, setSel] = useState<string>(todayISO);
  const [weekStart, setWeekStart] = useState<string>(() => mondayOf(todayISO));
  const week = useMemo(() => [0, 1, 2, 3, 4].map((i) => addDaysISO(weekStart, i)), [weekStart]);

  return (
    <div class="fade">
      <div class="card notice-red"><strong>{t(lang, 'lunch.notice')}</strong></div>
      <div class="row wrap" style={{ marginBottom: 12 }}>
        <button class={`chip${sel === todayISO ? ' selected' : ''}`} onClick={() => { setSel(todayISO); setWeekStart(mondayOf(todayISO)); }}>{t(lang, 'lunch.today')}</button>
        <button class={`chip${sel === tomorrowISO ? ' selected' : ''}`} onClick={() => { setSel(tomorrowISO); setWeekStart(mondayOf(tomorrowISO)); }}>{t(lang, 'lunch.tomorrow')}</button>
      </div>
      <div class="card">
        <div class="weekstrip">
          <button class="btn" aria-label="prev" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}>‹</button>
          <div class="row grow" style={{ gap: 6, overflowX: 'auto' }}>
            {week.map((d) => (
              <button key={d} class={`daybtn${sel === d ? ' selected' : ''}`} onClick={() => setSel(d)}>
                {dayShort(d, lang)}<br /><small>{d.slice(8, 10)}</small>
              </button>
            ))}
          </div>
          <button class="btn" aria-label="next" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>›</button>
        </div>
      </div>
      <DayCard iso={sel} data={data} lang={lang} />
    </div>
  );
}

function dayShort(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1, 9));
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { timeZone: 'Europe/Istanbul', weekday: 'short' }).format(dt);
}

function DayCard({ iso, data, lang }: { iso: string; data: AllData; lang: Lang }) {
  const wd = weekdayOfISO(iso);
  if (wd === 0 || wd === 6) return <div class="card">{t(lang, 'lunch.weekend')}</div>;
  const hol = holidayFor(iso, data.events);
  if (hol) return <div class="card">{t(lang, 'lunch.holiday', { name: hol.title })}</div>;
  const day = data.menu.days[iso];
  if (!day) return <div class="card">{t(lang, 'lunch.missing')}</div>;
  void eventOnDay;
  return (
    <div class="card">
      <span class="overline">🍽 {t(lang, 'lunch.title')}</span>
      <h3 class="section"><time>{iso}</time></h3>
      <ul class="menu-list">
        <li><span class="menu-ico">🍲</span><span><strong>{t(lang, 'lunch.soup')}</strong><br />{day.soup}</span></li>
        <li><span class="menu-ico">🍛</span><span><strong>{t(lang, 'lunch.main')}</strong><br />{day.main}</span></li>
        <li><span class="menu-ico">🥗</span><span><strong>{t(lang, 'lunch.side')}</strong><br />{day.side}</span></li>
        <li><span class="menu-ico">🌱</span><span><strong>{t(lang, 'lunch.veg')}</strong><br />{day.veg}</span></li>
        <li><span class="menu-ico">🍮</span><span><strong>{t(lang, 'lunch.dessert')}</strong><br />{day.dessert}</span></li>
      </ul>
      {day.salad && <span class="tag">{t(lang, 'lunch.salad')}</span>}
      <div style={{ marginTop: 8 }}>
        {day.allergens.map((a) => (
          <span class="allergen" key={a}>⚠ {a}</span>
        ))}
      </div>
      {day.kcal != null && <div class="muted">{t(lang, 'lunch.kcal', { n: day.kcal })}</div>}
      {day.note && <div class="muted">{day.note}</div>}
    </div>
  );
}
