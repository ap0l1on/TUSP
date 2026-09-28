import { h } from 'preact';
import { t, type Lang } from '../lib/i18n';
import { Icon } from './icons';

export type Route = 'today' | 'lunch' | 'ann' | 'feedback' | 'detail' | 'calendar';

function hideBroken(e: Event): void {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}

export function Logo({ size = 38 }: { size?: number }) {
  return (
    <img
      class="brand-logo"
      src={`${import.meta.env.BASE_URL}logo.png`}
      alt="TED Üsküdar Koleji logosu"
      width={size}
      height={size}
      onError={hideBroken}
    />
  );
}

export function Header({ lang, classLabel, onPick, onLang }: {
  lang: Lang; classLabel: string; onPick: () => void; onLang: (l: Lang) => void;
}) {
  return (
    <header class="header">
      <div class="header-inner">
        <a class="brand" href="#/" aria-label="TUSP">
          <Logo />
          <span class="wordmark">TUSP</span>
        </a>
        <div class="header-spacer" />
        <button class="class-chip" onClick={onPick} aria-label={t(lang, 'header.pickClass')}>
          {classLabel} ▾
        </button>
        <div class="lang-seg" role="group" aria-label="TR/EN">
          <button aria-pressed={lang === 'tr'} onClick={() => onLang('tr')}>TR</button>
          <button aria-pressed={lang === 'en'} onClick={() => onLang('en')}>EN</button>
        </div>
      </div>
    </header>
  );
}

const NAV: { r: Route; href: string; key: string; icon: string }[] = [
  { r: 'today', href: '#/', key: 'nav.today', icon: 'today' },
  { r: 'lunch', href: '#/yemek', key: 'nav.lunch', icon: 'lunch' },
  { r: 'ann', href: '#/duyurular', key: 'nav.announcements', icon: 'bell' },
  { r: 'feedback', href: '#/geri-bildirim', key: 'nav.feedback', icon: 'chat' },
];

function isActive(route: Route, item: Route): boolean {
  if (route === item) return true;
  if (item === 'ann' && (route === 'detail' || route === 'calendar')) return true;
  return false;
}

export function TopNav({ route, lang }: { route: Route; lang: Lang }) {
  return (
    <nav class="topnav" aria-label="nav">
      <div class="topnav-inner">
        {NAV.map((it) => (
          <a key={it.r} href={it.href} class={isActive(route, it.r) ? 'active' : ''}>
            <Icon name={it.icon} />{t(lang, it.key)}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function TabBar({ route, lang }: { route: Route; lang: Lang }) {
  return (
    <nav class="tabbar" aria-label="nav">
      {NAV.map((it) => (
        <a key={it.r} href={it.href} class={isActive(route, it.r) ? 'active' : ''}>
          <Icon name={it.icon} />{t(lang, it.key)}
        </a>
      ))}
    </nav>
  );
}
