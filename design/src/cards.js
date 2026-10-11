// Vector cards that sit under the hero. All share the dark graphite tile, Inter type and chrome accents.
// Cards use a 1200-unit width so text stays readable when GitHub scales them to its ~900px column.
// Entrance animations use CSS with `both` fill, so if animation is unsupported the final state shows.
import * as si from 'simple-icons';
import { textPath, digitCell, glyphPath, tile, svg, F, EASE } from './svgkit.js';

const W = 1200;
const PAD = 64;
const GRAY = '#8e939b';
const DIM = '#6b7079';
const SOFT = '#c9cdd3';

const baseCSS = `
  .fu{animation:fu .9s ${EASE} both}
  @keyframes fu{from{opacity:0;transform:translateY(14px)}}
  .fi{animation:fi 1.2s ${EASE} both}
  @keyframes fi{from{opacity:0}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

const delay = (s) => `style="animation-delay:${s.toFixed(2)}s"`;

function eyebrow(str, x, y, anchor = 'start') {
  return `<path d="${textPath(str.toUpperCase(), { file: F.textMedium, size: 15, x, y, anchor, tracking: 0.3 }).d}" fill="${GRAY}"/>`;
}

function wrap(str, { file, size, maxWidth }) {
  const lines = [];
  let line = '';
  for (const w of str.split(' ')) {
    const next = line ? `${line} ${w}` : w;
    if (textPath(next, { file, size }).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function para(str, { file = F.text, size = 19, x, y, maxWidth, lh = 1.5, fill = GRAY }) {
  const lines = wrap(str, { file, size, maxWidth });
  return {
    svg: lines.map((l, i) => `<path d="${textPath(l, { file, size, x, y: y + i * size * lh }).d}" fill="${fill}"/>`).join(''),
    height: lines.length * size * lh,
  };
}

// ---------- By the numbers: rolling digit counters ----------
export function statsCard(stats) {
  const H = 330;
  const t = tile({ w: W, h: H, id: 's' });
  const items = [
    [stats.mergedPRs, 'Merged pull requests'],
    [stats.contributions, 'Contributions · 12 months'],
    [stats.filesChanged, 'Files changed in PRs'],
    [stats.activeDays, 'Active days · 12 months'],
  ];
  const size = 80;
  const base = 222;
  const L = size * 1.3;
  const cell = digitCell(F.display, size);
  // Columns are sized to their content, with equal gaps and a hairline centred in each gap.
  const widths = items.map(([value, label]) => {
    const str = value.toLocaleString('en-US');
    const num = [...str].reduce((a, ch) => a + (/\d/.test(ch) ? cell : textPath(ch, { file: F.display, size }).width), 0);
    return Math.max(num, textPath(label, { file: F.text, size: 18 }).width);
  });
  const gapW = (W - PAD * 2 - widths.reduce((a, b) => a + b, 0)) / (items.length - 1);
  const starts = widths.map((_, i) => PAD + widths.slice(0, i).reduce((a, b) => a + b, 0) + gapW * i);
  const defs = `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".14" stop-color="#fff"/>
      <stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="win" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <rect x="0" y="${base - size * 0.9}" width="${W}" height="${size * 1.02}" fill="url(#fade)"/></mask>`;
  let body = '';
  let css = '';
  let n = 0;
  items.forEach(([value, label], i) => {
    const x0 = starts[i];
    const str = value.toLocaleString('en-US');
    const digitsTotal = str.replace(/\D/g, '').length;
    let x = x0;
    let digitIndex = 0;
    for (const ch of str) {
      if (/\d/.test(ch)) {
        const target = Number(ch);
        const fromRight = digitsTotal - 1 - digitIndex;
        const cycles = fromRight === 0 ? 2 : fromRight === 1 ? 1 : 0;
        const len = cycles * 10 + target;
        let strip = '';
        for (let k = 0; k <= len; k++) {
          const g = glyphPath(String(k % 10), { file: F.display, size, x: 0, y: 0 });
          strip += `<path transform="translate(${(x + (cell - g.width) / 2).toFixed(2)} ${(base - (len - k) * L).toFixed(2)})" d="${g.d}" fill="url(#chrome)"/>`;
        }
        const cls = `r${n++}`;
        css += `.${cls}{animation:${cls} ${(1.7 + fromRight * 0.15).toFixed(2)}s cubic-bezier(.16,1,.3,1) both;animation-delay:${(0.25 + i * 0.12).toFixed(2)}s}
  @keyframes ${cls}{from{transform:translateY(${(len * L).toFixed(1)}px)}}\n`;
        body += `<g mask="url(#win)"><g class="${cls}">${strip}</g></g>`;
        x += cell;
        digitIndex++;
      } else {
        const g = textPath(ch, { file: F.display, size, x, y: base });
        body += `<path d="${g.d}" fill="url(#chrome)" class="fi" ${delay(0.4 + i * 0.12)}/>`;
        x += g.width;
      }
    }
    body += `<path class="fu" ${delay(0.55 + i * 0.12)} d="${textPath(label, { file: F.text, size: 18, x: x0, y: base + 44 }).d}" fill="${GRAY}"/>`;
    if (i > 0) {
      const lx = (x0 - gapW / 2).toFixed(1);
      body += `<line x1="${lx}" y1="${base - 76}" x2="${lx}" y2="${base + 52}" stroke="#fff" stroke-opacity=".08"/>`;
    }
  });
  const updated = 'Live from GitHub · refreshed daily';
  const inner = `<defs>${t.defs}${defs}</defs>
<style>${baseCSS}
  ${css}</style>
${t.body}
${eyebrow('By the numbers', PAD, 84)}
<path d="${textPath(updated, { file: F.text, size: 15, x: W - PAD, y: 84, anchor: 'end' }).d}" fill="${DIM}"/>
${body}`;
  return svg(W, H, inner, `By the numbers: ${items.map(([v, l]) => `${v.toLocaleString('en-US')} ${l}`).join(', ')}`);
}

// ---------- Experience timeline ----------
export function experienceCard(roles) {
  const lineX = 300;
  const textX = 344;
  const maxW = W - textX - PAD;
  const top = 150;
  let y = top;
  let rows = '';
  const dots = [];
  roles.forEach((r, i) => {
    const d = 0.35 + i * 0.22;
    const note = r.note ? para(r.note, { size: 18, x: textX, y: y + 100, maxWidth: maxW }) : { svg: '', height: 0 };
    rows += `<g class="fu" ${delay(d)}>
  <path d="${textPath(r.dates, { file: F.textMedium, size: 18, x: PAD, y: y + 30 }).d}" fill="${SOFT}"/>
  <path d="${textPath(r.type, { file: F.text, size: 16, x: PAD, y: y + 58 }).d}" fill="${DIM}"/>
  <path d="${textPath(r.role, { file: F.display, size: 34, x: textX, y: y + 32 }).d}" fill="url(#chrome)"/>
  <path d="${textPath(r.org, { file: F.textMedium, size: 18, x: textX, y: y + 64 }).d}" fill="${SOFT}"/>
  ${note.svg}
</g>`;
    dots.push(y + 21);
    rows += `<circle cx="${lineX}" cy="${y + 21}" r="6" fill="${i === 0 ? '#f5f7fa' : '#5d636b'}" class="fi" ${delay(d)}/>`;
    y += 64 + (note.height ? note.height + 28 : 0) + 56;
  });
  const H = y - 20;
  const t = tile({ w: W, h: H, id: 'e' });
  const first = dots[0];
  const last = dots[dots.length - 1];
  const len = last - first;
  const inner = `<defs>${t.defs}
  <linearGradient id="rail" gradientUnits="userSpaceOnUse" x1="0" y1="${first}" x2="0" y2="${last}">
    <stop offset="0" stop-color="#e9edf2" stop-opacity=".9"/><stop offset="1" stop-color="#e9edf2" stop-opacity=".12"/></linearGradient></defs>
<style>${baseCSS}
  .rail{stroke-dasharray:${len.toFixed(1)};animation:rail 1.6s ${EASE} .3s both}
  @keyframes rail{from{stroke-dashoffset:${len.toFixed(1)}}}
  .pulse{transform-origin:${lineX}px ${first}px;animation:pulse 2.4s ease-out 1.2s infinite both}
  @keyframes pulse{0%{transform:scale(1);opacity:.6}80%,100%{transform:scale(3.2);opacity:0}}</style>
${t.body}
${eyebrow('Experience', PAD, 84)}
<line class="rail" x1="${lineX}" y1="${first}" x2="${lineX}" y2="${last}" stroke="url(#rail)" stroke-width="2"/>
<circle class="pulse" cx="${lineX}" cy="${first}" r="6" fill="none" stroke="#f5f7fa" stroke-width="1.5"/>
${rows}`;
  return svg(W, H, inner, `Experience: ${roles.map((r) => `${r.role}, ${r.org}, ${r.type}, ${r.dates}`).join('; ')}`);
}

// ---------- What I've shipped ----------
export function shippedCard(areas, headline) {
  const cols = 3;
  const gap = 20;
  const cw = (W - PAD * 2 - gap * (cols - 1)) / cols;
  const top = 168;
  const bodies = areas.map((a) => para(a.body, { size: 17, x: 0, y: 0, maxWidth: cw - 56 }));
  const ch = 120 + Math.max(...bodies.map((b) => b.height));
  const rowsN = Math.ceil(areas.length / cols);
  const H = top + rowsN * ch + (rowsN - 1) * gap + PAD - 8;
  const t = tile({ w: W, h: H, id: 'w' });
  let cells = '';
  areas.forEach((a, i) => {
    const x = PAD + (i % cols) * (cw + gap);
    const y = top + Math.floor(i / cols) * (ch + gap);
    cells += `<g class="fu" ${delay(0.3 + i * 0.1)}>
  <rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="22" fill="#fff" fill-opacity=".028" stroke="#fff" stroke-opacity=".08"/>
  <path d="${textPath(a.kicker.toUpperCase(), { file: F.textMedium, size: 13, x: x + 28, y: y + 42, tracking: 0.26 }).d}" fill="${DIM}"/>
  <path d="${textPath(a.title, { file: F.display, size: 26, x: x + 28, y: y + 80 }).d}" fill="url(#chrome)"/>
  ${para(a.body, { size: 17, x: x + 28, y: y + 114, maxWidth: cw - 56 }).svg}
</g>`;
  });
  const inner = `<defs>${t.defs}</defs>
<style>${baseCSS}</style>
${t.body}
${eyebrow("What I've shipped", PAD, 84)}
<path class="fu" ${delay(0.15)} d="${textPath(headline, { file: F.display, size: 38, x: PAD, y: 136 }).d}" fill="#f2f4f7"/>
${cells}`;
  return svg(W, H, inner, `What I've shipped. ${headline} ${areas.map((a) => `${a.title}: ${a.body}`).join(' ')}`);
}

// ---------- Stack: monochrome icon grid ----------
export function stackCard(items) {
  const cols = 5;
  const gap = 16;
  const cw = (W - PAD * 2 - gap * (cols - 1)) / cols;
  const ch = 132;
  const top = 120;
  const rowsN = Math.ceil(items.length / cols);
  const H = top + rowsN * ch + (rowsN - 1) * gap + PAD - 8;
  const t = tile({ w: W, h: H, id: 'k' });
  const ICON = 36;
  let cells = '';
  items.forEach(([key, label], i) => {
    const icon = si[key];
    if (!icon) throw new Error(`missing icon ${key}`);
    const x = PAD + (i % cols) * (cw + gap);
    const y = top + Math.floor(i / cols) * (ch + gap);
    cells += `<g class="fu" ${delay(0.2 + i * 0.05)}>
  <rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="22" fill="#fff" fill-opacity=".028" stroke="#fff" stroke-opacity=".08"/>
  <path transform="translate(${(x + (cw - ICON) / 2).toFixed(2)} ${y + 30}) scale(${ICON / 24})" d="${icon.path}" fill="url(#ico)"/>
  <path d="${textPath(label, { file: F.textMedium, size: 17, x: x + cw / 2, y: y + 104, anchor: 'middle' }).d}" fill="${SOFT}"/>
</g>`;
  });
  const inner = `<defs>${t.defs}
  <linearGradient id="ico" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f9"/><stop offset="1" stop-color="#8f969f"/></linearGradient>
  <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <clipPath id="kc"><rect width="${W}" height="${H}" rx="36"/></clipPath></defs>
<style>${baseCSS}
  .gloss{animation:gloss 7s ease-in-out 1.5s infinite both}
  @keyframes gloss{0%{transform:translateX(-400px)}60%,100%{transform:translateX(${W + 300}px)}}</style>
${t.body}
${eyebrow('Stack', PAD, 84)}
${cells}
<g clip-path="url(#kc)"><g transform="skewX(-18)"><rect class="gloss" x="0" y="0" width="320" height="${H}" fill="url(#gloss)"/></g></g>`;
  return svg(W, H, inner, `Stack: ${items.map(([, l]) => l).join(', ')}`);
}

// ---------- Project card ----------
export function projectCard(p) {
  const desc = para(p.body, { size: 19, x: PAD, y: 182, maxWidth: W - PAD * 2 - 40 });
  const tagY = 182 + desc.height + 6;
  const H = tagY + 40 + PAD - 8;
  const t = tile({ w: W, h: H, id: 'p' });
  let x = PAD;
  let tags = '';
  for (const tag of p.tags) {
    const tw = textPath(tag, { file: F.textMedium, size: 15 }).width + 32;
    tags += `<rect x="${x}" y="${tagY}" width="${tw}" height="36" rx="18" fill="#fff" fill-opacity=".06" stroke="#fff" stroke-opacity=".12"/>
  <path d="${textPath(tag, { file: F.textMedium, size: 15, x: x + 16, y: tagY + 23 }).d}" fill="${SOFT}"/>`;
    x += tw + 10;
  }
  const inner = `<defs>${t.defs}</defs>
<style>${baseCSS}</style>
${t.body}
${eyebrow('Project', PAD, 84)}
<path d="${textPath(p.credit, { file: F.text, size: 15, x: W - PAD, y: 84, anchor: 'end' }).d}" fill="${DIM}"/>
<g class="fu" ${delay(0.15)}><path d="${textPath(p.title, { file: F.display, size: 38, x: PAD, y: 136 }).d}" fill="url(#chrome)"/>
<path d="${textPath('↗', { file: F.textMedium, size: 28, x: W - PAD, y: 136, anchor: 'end' }).d}" fill="${GRAY}"/></g>
<g class="fu" ${delay(0.3)}>${desc.svg}</g>
<g class="fu" ${delay(0.45)}>${tags}</g>`;
  return svg(W, H, inner, `${p.title}. ${p.body} ${p.credit}`);
}

// ---------- Pill button ----------
export function button(label) {
  const size = 22;
  const tw = textPath(label, { file: F.textMedium, size }).width;
  const aw = textPath('↗', { file: F.textMedium, size }).width;
  const w = Math.ceil(tw + aw + 10 + 64);
  const h = 60;
  const inner = `<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#202328"/><stop offset="1" stop-color="#0e0f11"/></linearGradient>
  <linearGradient id="be" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient></defs>
<rect width="${w}" height="${h}" rx="${h / 2}" fill="url(#b)"/>
<rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="${h / 2 - 0.75}" fill="none" stroke="url(#be)" stroke-width="1.5"/>
<path d="${textPath(label, { file: F.textMedium, size, x: 32, y: h / 2 + 8 }).d}" fill="#f2f4f7"/>
<path d="${textPath('↗', { file: F.textMedium, size, x: 32 + tw + 10, y: h / 2 + 8 }).d}" fill="${GRAY}"/>`;
  return svg(w, h, inner, label);
}

// ---------- Footer ----------
export function footer(line) {
  const H = 120;
  const inner = `<defs><linearGradient id="fl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa1aa" stop-opacity="0"/>
  <stop offset=".5" stop-color="#9aa1aa" stop-opacity=".7"/><stop offset="1" stop-color="#9aa1aa" stop-opacity="0"/></linearGradient></defs>
<rect x="${W / 2 - 280}" y="30" width="560" height="1.5" fill="url(#fl)"/>
<path d="${textPath(line, { file: F.text, size: 18, x: W / 2, y: 80, anchor: 'middle' }).d}" fill="${GRAY}"/>`;
  return svg(W, H, inner, line);
}
