// WCAG 2.2 AA contrast check for the design tokens (text pairs >= 4.5:1).
export function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0);
}
export function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const pairs: [string, string, string][] = [
  ['#0F1B33 on #FFFFFF', '#0F1B33', '#FFFFFF'],
  ['#FFFFFF on #16264A', '#FFFFFF', '#16264A'],
  ['#FFFFFF on #1D3160', '#FFFFFF', '#1D3160'],
  ['#5B6B8C on #FFFFFF', '#5B6B8C', '#FFFFFF'],
  ['#B7C3DD on #16264A', '#B7C3DD', '#16264A'],
  ['#FFFFFF on #9E1B32', '#FFFFFF', '#9E1B32'],
  ['#0F1B33 on #EEF2F9', '#0F1B33', '#EEF2F9'],
  ['#0F1B33 on #F7E3E7', '#0F1B33', '#F7E3E7'],
  ['#FFFFFF on #2F6FED', '#FFFFFF', '#2F6FED'],
  ['#FFFFFF on #147A4A', '#FFFFFF', '#147A4A'],
];

if (process.argv[1]?.includes('check-contrast')) {
  let fail = 0;
  for (const [name, fg, bg] of pairs) {
    const r = contrast(fg, bg);
    const ok = r >= 4.5;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${r.toFixed(2)}:1`);
    if (!ok) fail++;
  }
  if (fail > 0) process.exit(1);
}
