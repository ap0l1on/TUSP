import DOMPurify from 'dompurify';

// Minimal markdown: bold, italic, lists, links only. Everything else escaped.
export function renderMarkdown(src: string): string {
  const esc = (s: string) =>
    s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const lines = src.split('\n');
  let html = '';
  let inList = false;
  const inline = (s: string): string => {
    let o = esc(s);
    o = o.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
    o = o.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    o = o.replace(/(^|\W)\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return o;
  };
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s+(.*)$/);
    if (m) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(m[1] ?? '')}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (line.trim() === '') continue;
      html += `<p>${inline(line)}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return sanitize(html);
}

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'ul', 'li', 'strong', 'em', 'a'], ALLOWED_ATTR: ['href', 'rel'] });
}

// Plain-text preview for cards/banners: strip markdown syntax.
export function plainPreview(src: string, max = 140): string {
  const first = src.split('\n')[0] ?? '';
  return first
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|\W)\*([^*\n]+)\*/g, '$1$2')
    .replace(/^#+\s*/, '')
    .trim()
    .slice(0, max);
}
