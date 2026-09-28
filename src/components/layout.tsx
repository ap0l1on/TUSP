import { h } from 'preact';
import { t, type Lang } from '../lib/i18n';
import { Icon } from './icons';

export type Route = 'today' | 'lunch' | 'ann' | 'feedback' | 'detail' | 'calendar';

export function Header({ lang, classLabel, onPick, onLang }: {
  lang: Lang; classLabel: string; onPick: () => void; onLang: () => void;
}) {
  return (
    <header class="header">
      <a class="wordmark" href="#/" aria-label="TUSP">TUSP</a>
      <div class="header-spacer" />
      <button class="class-chip" onClick={onPick} aria-label={t(lang, 'header.pickClass')}>
        {classLabel} ▾
      </button>
      <button class="lang-toggle" onClick={onLang} aria-label="TR/EN">
        {lang === 'tr' ? 'EN' : 'TR'}
      </button>
    </header>
  );
}

export function TabBar({ route, lang }: { route: Route; lang: Lang }) {
  const items: { r: Route; href: string; label: string; icon: string }[] = [
    { r: 'today', href: '#/', label: t(lang, 'nav.today'), icon: 'today' },
    { r: 'lunch', href: '#/yemek', label: t(lang, 'nav.lunch'), icon: 'lunch' },
    { r: 'ann', href: '#/duyurular', label: t(lang, 'nav.announcements'), icon: 'bell' },
    { r: 'feedback', href: '#/geri-bildirim', label: t(lang, 'nav.feedback'), icon: 'chat' },
  ];
  return (
    <nav class="tabbar" aria-label="nav">
      {items.map((it) => (
        <a key={it.r} href={it.href} class={route === it.r || (it.r === 'ann' && (route === 'detail' || route === 'calendar')) ? 'active' : ''}>
          <Icon name={it.icon} />{it.label}
        </a>
      ))}
    </nav>
  );
}

export function Sidebar({ route, lang }: { route: Route; lang: Lang }) {
  const items = [
    { r: 'today', href: '#/', label: t(lang, 'nav.today') },
    { r: 'lunch', href: '#/yemek', label: t(lang, 'nav.lunch') },
    { r: 'ann', href: '#/duyurular', label: t(lang, 'nav.announcements') },
    { r: 'feedback', href: '#/geri-bildirim', label: t(lang, 'nav.feedback') },
  ];
  return (
    <nav class="sidebar" aria-label="nav">
      {items.map((it) => (
        <a key={it.r} href={it.href} class={route === it.r ? 'active' : ''}>{it.label}</a>
      ))}
    </nav>
  );
}
