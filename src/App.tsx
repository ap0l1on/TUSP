import { h } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { loadAll, type AllData } from './lib/data';
import { getClass, setClass, getLang, setLang } from './lib/storage';
import type { Lang } from './lib/i18n';
import { t } from './lib/i18n';
import { Header, Sidebar, TabBar, type Route } from './components/layout';
import { ClassPicker } from './components/ClassPicker';
import { TodayPage } from './pages/Today';
import { LunchPage } from './pages/Lunch';
import { AnnouncementsPage, AnnouncementDetail } from './pages/Announcements';
import { FeedbackPage } from './pages/Feedback';
import { nowUpdatedLabel } from './lib/time';

function parseHash(): { route: Route; id?: string } {
  const hsh = location.hash || '#/';
  if (hsh.startsWith('#/yemek')) return { route: 'lunch' };
  if (hsh.startsWith('#/duyuru/')) return { route: 'detail', id: hsh.slice('#/duyuru/'.length) };
  if (hsh.startsWith('#/duyurular')) return { route: 'ann' };
  if (hsh.startsWith('#/takvim')) return { route: 'calendar' };
  if (hsh.startsWith('#/geri-bildirim')) return { route: 'feedback' };
  return { route: 'today' };
}

export function App() {
  const [data, setData] = useState<AllData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLangState] = useState<Lang>(() => getLang());
  const [classId, setClassId] = useState<string | null>(() => getClass());
  const [picking, setPicking] = useState(false);
  const [route, setRoute] = useState(() => parseHash());
  const [now, setNow] = useState(() => new Date());
  const [offline, setOffline] = useState(() => !navigator.onLine);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await loadAll();
      setData(d);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    const onOn = () => setOffline(false);
    const onOff = () => setOffline(true);
    const tick = setInterval(() => setNow(new Date()), 30000);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    document.documentElement.lang = lang;
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
      clearInterval(tick);
    };
  }, [lang]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
    }
  }, []);

  const label = useMemo(() => {
    if (!classId || !data) return '9-B ▾';
    return (data.classes.classes.find((c) => c.id === classId)?.label ?? classId) + ' ▾';
  }, [classId, data]);

  const toggleLang = () => {
    const n = lang === 'tr' ? 'en' : 'tr';
    setLang(n); setLangState(n);
  };

  const needPicker = !classId;

  return (
    <div class="app-shell">
      <Header lang={lang} classLabel={classId ? label : t(lang, 'header.pickClass')} onPick={() => setPicking(true)} onLang={toggleLang} />
      <div class="layout">
        <Sidebar route={route.route} lang={lang} />
        <main class="content" id="main">
          {offline && data && <div class="offline-banner">{t(lang, 'state.offline', { time: nowUpdatedLabel(data.fetchedAt, lang) })}</div>}
          {!data && !error && (
            <div aria-busy="true"><div class="skeleton" /><div class="skeleton" /><div class="skeleton" /></div>
          )}
          {error && !data && (
            <div class="card error-card"><strong>{t(lang, 'state.error')}</strong>
              <div style={{ marginTop: 8 }}><button class="btn primary" onClick={() => void load()}>{t(lang, 'state.retry')}</button></div>
            </div>
          )}
          {data && (
            <>
              {(needPicker || picking) && (
                <ClassPicker
                  classes={data.classes} lang={lang} full={needPicker && !picking ? true : picking || needPicker}
                  onDone={(id) => { setClass(id); setClassId(id); setPicking(false); }}
                />
              )}
              {!needPicker && !picking && <RouteView data={data} lang={lang} classId={classId!} route={route} now={now} />}
              {picking && !needPicker && (
                <div class="card" style={{ marginTop: 12 }}>
                  <ClassPicker classes={data.classes} lang={lang} onDone={(id) => { setClass(id); setClassId(id); setPicking(false); }} />
                  <button class="btn" onClick={() => setPicking(false)}>✕</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <TabBar route={route.route} lang={lang} />
    </div>
  );
}

function RouteView({ data, lang, classId, route, now }: { data: AllData; lang: Lang; classId: string; route: { route: Route; id?: string }; now: Date }) {
  if (route.route === 'lunch') return <LunchPage data={data} lang={lang} now={now} />;
  if (route.route === 'ann') return <AnnouncementsPage data={data} lang={lang} classId={classId} now={now} sub="list" />;
  if (route.route === 'calendar') return <AnnouncementsPage data={data} lang={lang} classId={classId} now={now} sub="calendar" />;
  if (route.route === 'detail') return <AnnouncementDetail data={data} lang={lang} id={route.id ?? ''} now={now} />;
  if (route.route === 'feedback') return <FeedbackPage data={data} lang={lang} />;
  return <TodayPage data={data} lang={lang} classId={classId} now={now} />;
}
