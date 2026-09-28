import { h } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import type { ClassesData } from '../lib/types';
import { t, type Lang } from '../lib/i18n';

function gradeLabel(g: number, lang: Lang): string {
  if (lang === 'en') {
    if (g === 11) return 'IB DP1 / 11';
    if (g === 12) return 'IB DP2 / 12';
    return `Grade ${g}`;
  }
  if (g === 11) return 'IB DP1 / 11';
  if (g === 12) return 'IB DP2 / 12';
  return `${g}. sınıf`;
}

export function ClassPicker({ classes, lang, onDone, full }: {
  classes: ClassesData; lang: Lang; onDone: (id: string) => void; full?: boolean;
}) {
  const grades = useMemo(() => [...new Set(classes.classes.map((c) => c.grade))].sort((a, b) => a - b), [classes]);
  const [g, setG] = useState<number | null>(null);
  const list = g == null ? [] : classes.classes.filter((c) => c.grade === g);
  const body = (
    <div class={full ? 'picker-card' : 'card'}>
      <div class="row" style={{ marginBottom: 4 }}>
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={44} height={44} style={{ borderRadius: '50%', background: '#fff', objectFit: 'cover' }} />
        <h2 style={{ margin: 0 }}>{t(lang, 'classPicker.title')}</h2>
      </div>
      <div class="muted">{t(lang, 'classPicker.subtitle')}</div>
      <div class="muted" style={{ marginTop: 12 }}>{t(lang, 'classPicker.grades')}</div>
      <div class="grade-grid">
        {grades.map((gr) => (
          <button key={gr} class={`chip${g === gr ? ' selected' : ''}`} onClick={() => setG(gr)}>{gradeLabel(gr, lang)}</button>
        ))}
      </div>
      {g != null && (
        <div class="class-grid">
          {list.map((c) => (
            <button key={c.id} class="chip" onClick={() => onDone(c.id)}>{c.label}</button>
          ))}
        </div>
      )}
    </div>
  );
  if (full) return <div class="picker-overlay"><div class="fade" style={{ width: '100%', maxWidth: 520 }}>{body}</div></div>;
  return body;
}
