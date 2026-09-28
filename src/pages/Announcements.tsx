import { h } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import type { AllData } from '../lib/data';
import { gradeOf } from '../lib/data';
import { t, type Lang } from '../lib/i18n';
import { relativeTime, visibleAnnouncements, eventOnDay } from '../lib/announcements';
import { renderMarkdown, plainPreview } from '../lib/markdown';
import { announcementICS, downloadICS } from '../lib/ics';
import { istanbulISODate, weekdayOfISO, addDaysISO } from '../lib/time';

export type AnnFilter = 'all' | 'mine' | 'event' | 'holiday' | 'exam';

export function AnnouncementsPage({ data, lang, classId, now, sub }: {
  data: AllData; lang: Lang; classId: string; now: Date; sub: 'list' | 'calendar';
}) {
  const [filter, setFilter] = useState<AnnFilter>('all');
  const list = useMemo(() => {
    let v = visibleAnnouncements(data.announcements, now, classId, (c) => gradeOf(data.classes, c));
    if (filter === 'mine') v = v.filter((a) => a.audience.includes('all') || a.audience.includes(classId) || a.audience.some((x) => x === `grade:${gradeOf(data.classes, classId)}`));
    if (filter === 'event') v = v.filter((a) => a.eventId);
    if (filter === 'holiday') v = v.filter((a) => a.eventId && data.events.events.find((e) => e.id === a.eventId)?.kind === 'holiday');
    if (filter === 'exam') v = v.filter((a) => a.eventId && data.events.events.find((e) => e.id === a.eventId)?.kind === 'exam');
    return v;
  }, [data, now, classId, filter]);

  return (
    <div class="fade">
      <div class="row wrap" style={{ marginBottom: 12 }}>
        <a class={`chip${sub === 'list' ? ' selected' : ''}`} href="#/duyurular">{t(lang, 'nav.announcements')}</a>
        <a class={`chip${sub === 'calendar' ? ' selected' : ''}`} href="#/takvim">{t(lang, 'nav.calendar')}</a>
      </div>
      {sub === 'calendar' ? (
        <Calendar data={data} lang={lang} now={now} />
      ) : (
        <div>
          <div class="row wrap" style={{ marginBottom: 12 }}>
            {(['all', 'mine', 'event', 'holiday', 'exam'] as AnnFilter[]).map((f) => (
              <button key={f} class={`chip${filter === f ? ' selected' : ''}`} onClick={() => setFilter(f)}>
                {t(lang, f === 'all' ? 'ann.filterAll' : f === 'mine' ? 'ann.filterMine' : f === 'event' ? 'ann.filterEvent' : f === 'holiday' ? 'ann.filterHoliday' : 'ann.filterExam')}
              </button>
            ))}
          </div>
          {list.length === 0 && <div class="card">{t(lang, 'ann.empty')}</div>}
          {list.map((a) => (
            <a key={a.id} href={`#/duyuru/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article class={`card ann-card pri-stripe ${a.priority === 'urgent' ? 'urgent-p' : a.priority === 'normal' ? 'normal-p' : ''}`}>
                <div class="row"><span class={`tag${a.priority === 'urgent' ? ' red' : a.priority === 'normal' ? ' blue' : ''}`}>{a.priority === 'urgent' ? (lang === 'tr' ? 'Acil' : 'Urgent') : a.priority === 'normal' ? (lang === 'tr' ? 'Duyuru' : 'Notice') : (lang === 'tr' ? 'Bilgi' : 'Info')}</span>
                  <span class="muted grow" style={{ fontSize: 12 }}><time>{relativeTime(a.publish, now, lang)}</time></span>
                  {a.pinned && <span class="tag">📌 {lang === 'tr' ? 'Sabit' : 'Pinned'}</span>}
                </div>
                <h3 style={{ margin: '8px 0 4px' }}>{a.title}</h3>
                <p class="muted" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{plainPreview(a.body)}</p>
              </article>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnnouncementDetail({ data, lang, id, now }: { data: AllData; lang: Lang; id: string; now: Date }) {
  const a = data.announcements.announcements.find((x) => x.id === id);
  const [copied, setCopied] = useState(false);
  if (!a) return <div class="card">{t(lang, 'ann.empty')}</div>;
  const ev = a.eventId ? data.events.events.find((e) => e.id === a.eventId) : undefined;
  const html = renderMarkdown(a.body);
  const onICS = () => downloadICS(`${a.id}.ics`, announcementICS(a, ev));
  const onShare = async () => {
    const url = `${location.origin}${location.pathname}#/duyuru/${a.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: a.title, url }); return; }
      throw new Error('no share');
    } catch {
      try { await navigator.clipboard.writeText(url); setCopied(true); } catch { /* ignore */ }
    }
  };
  return (
    <div class="fade">
      <article class="card">
        <h2 style={{ marginTop: 0 }}>{a.title}</h2>
        <div class="muted" style={{ fontSize: 13 }}>{relativeTime(a.publish, now, lang)}</div>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {ev && <div class="card secondary"><strong>{ev.title}</strong>{ev.place ? <div class="muted">{ev.place}</div> : null}</div>}
        <div class="row wrap" style={{ marginTop: 12 }}>
          <button class="btn primary" onClick={onICS}>{t(lang, 'ann.addToCalendar')}</button>
          <button class="btn" onClick={onShare}>{t(lang, 'ann.share')}</button>
        </div>
        {copied && <div class="muted">{t(lang, 'ann.linkCopied')}</div>}
      </article>
    </div>
  );
}

const KIND_COLORS: Record<string, string> = {
  holiday: '#9E1B32', dress_code: '#B54708', conference: '#2F6FED', exam: '#7A3FF2',
  trip: '#1E8E5A', ceremony: '#6B7280', early_dismissal: '#B54708', other: '#5B6B8C',
};

export function Calendar({ data, lang, now }: { data: AllData; lang: Lang; now: Date }) {
  const todayISO = istanbulISODate(now);
  const [ym, setYm] = useState(() => todayISO.slice(0, 7));
  const [sel, setSel] = useState(todayISO);
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const first = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, 1, 9));
  const startWd = (first.getUTCDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(Date.UTC(y ?? 2000, m ?? 1, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array<string | null>(startWd).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${ym}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const selEvents = data.events.events.filter((e) => eventOnDay(e, sel));

  return (
    <div>
      <div class="card">
        <div class="row">
          <button class="btn" onClick={() => setYm(prevMonth(ym))} aria-label="prev">‹</button>
          <strong class="grow" style={{ textAlign: 'center' }}>{ym}</strong>
          <button class="btn" onClick={() => setYm(nextMonth(ym))} aria-label="next">›</button>
        </div>
        <div class="cal-grid" style={{ marginTop: 12 }}>
          {cells.map((iso, i) => {
            if (!iso) return <span key={i} />;
            const evs = data.events.events.filter((e) => eventOnDay(e, iso));
            const isHol = evs.some((e) => e.kind === 'holiday');
            const wd = weekdayOfISO(iso);
            const isWk = wd === 0 || wd === 6;
            void isWk;
            return (
              <button key={iso} class={`cal-cell${isHol ? ' holiday' : ''}${iso === todayISO ? ' today' : ''}`} onClick={() => setSel(iso)} aria-label={iso}>
                <span>{Number(iso.slice(8, 10))}</span>
                <span class="dots">{evs.slice(0, 3).map((e) => <span key={e.id} class="dot" style={{ background: KIND_COLORS[e.kind] ?? '#888' }} />)}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div class="card">
        <strong>{sel}</strong>
        {selEvents.length === 0 && <div class="muted">{t(lang, 'ann.empty')}</div>}
        {selEvents.map((e) => (
          <div key={e.id} class="row"><span class="dot" style={{ background: KIND_COLORS[e.kind] }} /><span>{e.title}</span></div>
        ))}
      </div>
    </div>
  );
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
void addDaysISO;
