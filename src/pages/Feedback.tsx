import { h } from 'preact';
import type { AllData } from '../lib/data';
import { t, type Lang } from '../lib/i18n';

export function FeedbackPage({ data, lang }: { data: AllData; lang: Lang }) {
  const url = data.feedback.formUrl?.trim() ?? '';
  return (
    <div class="fade">
      <div class="hero">
        <span class="hero-kicker">💬 {t(lang, 'fb.title')}</span>
        <h1 class="hero-date">{t(lang, 'fb.title')}</h1>
        <div class="hero-sub">{t(lang, 'fb.intro')}</div>
      </div>
      <div class="card">
        <span class="overline">{t(lang, 'fb.rulesTitle')}</span>
        <ul>
          <li>{t(lang, 'fb.rule1')}</li>
          <li>{t(lang, 'fb.rule2')}</li>
          <li>{t(lang, 'fb.rule3')}</li>
        </ul>
        <p class="muted">{t(lang, 'fb.privacy')}</p>
      </div>
      {!url ? (
        <div class="card">{t(lang, 'fb.soon')}</div>
      ) : (
        <div class="card">
          {data.feedback.embed ? (
            <iframe class="fb" title="feedback" src={toEmbed(url)} loading="lazy" />
          ) : null}
          <div style={{ marginTop: 12 }}>
            <a class="btn primary" href={url} target="_blank" rel="noopener noreferrer">{t(lang, 'fb.open')}</a>
          </div>
        </div>
      )}
    </div>
  );
}

function toEmbed(url: string): string {
  // Google Forms: ensure embedded view
  if (url.includes('docs.google.com/forms') && !url.includes('embedded=true')) {
    return url.includes('?') ? `${url}&embedded=true` : `${url}?embedded=true`;
  }
  return url;
}
