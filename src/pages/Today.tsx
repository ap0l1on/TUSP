import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import type { AllData } from '../lib/data';
import { gradeOf } from '../lib/data';
import { t, type Lang } from '../lib/i18n';
import { addDaysISO, formatTRDate, istanbulISODate, nowUpdatedLabel, parseHM } from '../lib/time';
import { bellsForDate, computeNow, holidayFor, mergeDay } from '../lib/today';
import { visibleAnnouncements } from '../lib/announcements';
import { plainPreview } from '../lib/markdown';
import { getDismissed, dismiss } from '../lib/storage';

export function TodayPage({ data, lang, classId, now }: { data: AllData; lang: Lang; classId: string; now: Date }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 30000);
    const onFocus = () => force((x) => x + 1);
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, []);
  const [showTomorrow, setShowTomorrow] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>(() => getDismissed());

  const iso = istanbulISODate(now);
  const tomorrowISO = addDaysISO(iso, 1);
  const merged = useMemo(
    () => mergeDay(iso, classId, data.bells, data.timetable, data.changes, data.events),
    [iso, classId, data],
  );
  const mergedTomorrow = useMemo(
    () => mergeDay(tomorrowISO, classId, data.bells, data.timetable, data.changes, data.events),
    [tomorrowISO, classId, data],
  );
  const g = gradeOf(data.classes, classId);
  const urgents = visibleAnnouncements(data.announcements, now, classId, (c) => gradeOf(data.classes, c)).filter(
    (a) => a.priority === 'urgent' && !dismissed.includes(a.id),
  );
  const dish = data.menu.days[iso]?.main ?? '';
  const state = computeNow(now, iso, merged.rows, merged.holiday, dish);

  const onDismiss = (id: string) => { dismiss(id); setDismissed(getDismissed()); };
  const classLabel = data.classes.classes.find((c) => c.id === classId)?.label ?? classId;

  return (
    <div class="fade">
      <div class="hero">
        <span class="hero-kicker">{classLabel}</span>
        <h1 class="hero-date"><time>{formatTRDate(iso, lang)}</time></h1>
        <div class="hero-sub">{lang === 'tr' ? 'İstanbul saatiyle · canlı' : 'Istanbul time · live'}</div>
      </div>

      {urgents.map((a) => (
        <div class="card urgent" key={a.id} role="alert">
          <div class="row"><span class="overline red">{a.priority === 'urgent' ? (lang === 'tr' ? 'Acil' : 'Urgent') : a.priority}</span>
            <span class="grow" />
            <button class="btn" onClick={() => onDismiss(a.id)} aria-label={t(lang, 'urgent.dismiss')}>✕</button>
          </div>
          <div class="now-big">{a.title}</div>
          <div class="muted" style={{ marginTop: 4 }}>{plainPreview(a.body)}</div>
          <div style={{ marginTop: 8 }}><a href={`#/duyuru/${a.id}`}>{lang === 'tr' ? 'Detay →' : 'Details →'}</a></div>
        </div>
      ))}

      <section class="card nowcard" aria-live="polite" aria-label={t(lang, 'today.now')}>
        <div class="nowcard-header"><span class="live-dot" aria-hidden="true" /><strong>{t(lang, 'today.now')}</strong></div>
        <div class="nowcard-body">
          <NowBody state={state} lang={lang} iso={iso} tomorrowISO={tomorrowISO} data={data} />
        </div>
      </section>

      <section class="card" aria-label={t(lang, 'today.timeline')}>
        <span class="overline">{t(lang, 'today.timeline')}</span>
        <h3 class="section">{formatTRDate(iso, lang)}</h3>
        {merged.holiday && <div class="tag red">{merged.holiday.title}</div>}
        {!merged.hasTimetable && merged.holiday == null && <div class="muted">{t(lang, 'today.noTimetable')}</div>}
        {merged.chips.map((e) => (
          <span class="tag blue" key={e.id} style={{ marginRight: 6 }}>{e.title}</span>
        ))}
        <Timeline iso={iso} now={now} rows={merged.rows} lang={lang} />
      </section>

      <section class="card">
        <button class="btn grow" style={{ width: '100%' }} onClick={() => setShowTomorrow((v) => !v)} aria-expanded={showTomorrow}>
          {t(lang, 'today.tomorrow')} · {formatTRDate(tomorrowISO, lang)} {showTomorrow ? '▴' : '▾'}
        </button>
        {showTomorrow && (
          <TomorrowBody iso={tomorrowISO} lang={lang} data={data} classId={classId} />
        )}
      </section>

      <div class="updated-note">{t(lang, 'state.updated', { time: nowUpdatedLabel(data.fetchedAt, lang) })}</div>
    </div>
  );
}

function NowBody({ state, lang, iso, tomorrowISO, data }: { state: ReturnType<typeof computeNow>; lang: Lang; iso: string; tomorrowISO: string; data: AllData }) {
  if (state.kind === 'lesson') {
    const left = state.endMin - (parseHM(nowUpdatedLabel(new Date(), lang) as string) || 0);
    void left; void iso;
    return <NowLesson state={state} lang={lang} />;
  }
  if (state.kind === 'break') {
    return (
      <div>
        <div><strong>{t(lang, 'today.break', { n: Math.max(0, state.endMin - currentMin()) })}</strong></div>
        {state.nextN != null && <div class="muted">{t(lang, 'today.next', { n: state.nextN, subject: state.nextSubject ?? '' })}</div>}
      </div>
    );
  }
  if (state.kind === 'lunch') {
    return (
      <div>
        <div><strong>{t(lang, 'today.lunch')}</strong></div>
        {state.dish && <div><a href="#/yemek">{state.dish}</a></div>}
      </div>
    );
  }
  if (state.kind === 'before') {
    return <div><strong>{t(lang, 'today.beforeSchool', { time: state.firstStart })}</strong>{state.firstSubject && <span class="muted"> · {state.firstSubject}</span>}</div>;
  }
  if (state.kind === 'after') {
    const firstT = firstLessonOf(data, tomorrowISO);
    return <div><strong>{t(lang, 'today.schoolDone')}</strong><div class="muted">{t(lang, 'today.tomorrowFirst')}{firstT ? ` · ${firstT}` : ''}</div></div>;
  }
  return <div><strong>{state.reason === 'holiday' ? state.name ?? t(lang, 'today.holiday') : t(lang, 'today.weekend')}</strong></div>;
}

function currentMin(): number {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hour12: false });
  const s = fmt.format(d);
  const [h, m] = s.split(':').map(Number);
  return ((h ?? 0) % 24) * 60 + (m ?? 0);
}

function firstLessonOf(data: AllData, iso: string): string {
  const slots = bellsForDate(data.bells, iso);
  const first = slots.find((s) => s.kind === 'lesson');
  if (!first?.n) return '';
  return String(first.n);
}

import type { MergedRow } from '../lib/today';
function fmtMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
function NowLesson({ state, lang }: { state: Extract<ReturnType<typeof computeNow>, { kind: 'lesson' }>; lang: Lang }) {
  const total = Math.max(1, state.endMin - state.startMin);
  const left = Math.max(0, state.endMin - currentMin());
  const pct = Math.min(100, Math.max(0, ((total - left) / total) * 100));
  return (
    <div>
      <div class="now-big">{state.n}. ders · {state.subject}</div>
      {state.room && <div style={{ marginTop: 4 }}><span class="room-chip">📍 {state.room}</span></div>}
      <div class="muted" style={{ marginTop: 6 }}>{t(lang, 'today.minLeft', { n: left })} · <time>{fmtMin(state.startMin)}–{fmtMin(state.endMin)}</time></div>
      <div class="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Timeline({ iso, now, rows, lang }: { iso: string; now: Date; rows: MergedRow[]; lang: Lang }) {
  void iso;
  const mins = currentMin();
  let currentIdx = -1;
  rows.forEach((r, i) => { if (mins >= parseHM(r.start) && mins < parseHM(r.end)) currentIdx = i; });
  if (rows.length === 0) return <div class="muted">{t(lang, 'today.weekend')}</div>;
  return (
    <div>
      {rows.map((r, i) => {
        const past = parseHM(r.end) <= mins;
        const cls = `timeline-item${past ? ' dim' : ''}${i === currentIdx ? ' current' : ''}`;
        if (r.kind === 'break') return <div key={r.key} class={cls}><span class="ptime">{r.start}–{r.end}</span><span class="muted">☕ {t(lang, 'today.break', { n: parseHM(r.end) - parseHM(r.start) }).split('·')[0]}</span></div>;
        if (r.kind === 'lunch') return <div key={r.key} class={cls}><span class="ptime">{r.start}–{r.end}</span><span><strong>🍽 {t(lang, 'today.lunch')}</strong></span></div>;
        if (r.kind === 'event') return <div key={r.key} class="timeline-item current"><span class="ptime">{r.start}–{r.end}</span><span><strong>🎤 {r.eventTitle}</strong>{r.place ? <span class="muted"> · {r.place}</span> : null}</span></div>;
        return (
          <div key={r.key} class={cls}>
            <span class="pnum">{r.n}</span>
            <span class="ptime">{r.start}–{r.end}</span>
            <span class={r.status === 'cancelled' ? 'strike' : ''}>
              <strong>{r.subject}</strong>
              {r.room ? <> <span class="room-chip">{r.status === 'room' && r.oldRoom ? <><span class="strike muted">{r.oldRoom}</span> → <strong>{r.room}</strong></> : r.room}</span></> : null}
              <br />
              {r.status === 'cancelled' && <span class="tag red">{t(lang, 'today.cancelled')}</span>}
              {r.status === 'substitute' && <span class="tag blue">{t(lang, 'today.substitute', { teacher: r.teacher ?? '' })}</span>}
              {(r.status === 'moved' || r.status === 'extra') && r.note ? <span class="tag green">{r.note}</span> : null}
              {r.teacher && !r.status ? <span class="muted"> · {r.teacher}</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TomorrowBody({ iso, lang, data, classId }: { iso: string; lang: Lang; data: AllData; classId: string }) {
  const m = mergeDay(iso, classId, data.bells, data.timetable, data.changes, data.events);
  const first = m.rows.find((r) => r.kind === 'lesson');
  const dress = data.events.events.find((e) => e.kind === 'dress_code' && (e.date === iso || (e.from && e.to && e.from <= iso && iso <= e.to)));
  const dish = data.menu.days[iso]?.main ?? '';
  const hol = holidayFor(iso, data.events);
  return (
    <div style={{ marginTop: 12 }}>
      {hol && <div class="tag red">{hol.title}</div>}
      {first ? <div><strong>{first.n}. ders · {first.subject}</strong>{first.room ? ` · ${first.room}` : ''}</div> : <div class="muted">{t(lang, 'today.noTimetable')}</div>}
      {dress && <div>👕 {t(lang, 'today.tomorrowDress', { title: dress.title })}</div>}
      {m.chips.map((e) => <div class="tag blue" key={e.id} style={{ marginRight: 6 }}>{e.title}</div>)}
      {dish && <div>🍽 {dish} (<a href="#/yemek">{t(lang, 'nav.lunch')}</a>)</div>}
    </div>
  );
}
