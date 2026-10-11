// Small SVG toolkit: text is converted to vector paths with opentype.js, so every card renders with
// Inter / Inter Display everywhere (GitHub serves SVGs as images, which cannot load web fonts).
import opentype from 'opentype.js';
import path from 'node:path';
import fs from 'node:fs';
import { FONT_DIR } from './fonts.js';

const cache = new Map();
export function font(file) {
  if (!cache.has(file)) {
    const buf = fs.readFileSync(path.join(FONT_DIR, file));
    cache.set(file, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return cache.get(file);
}

export const F = {
  display: 'InterDisplay-SemiBold.otf',
  displayRegular: 'InterDisplay-Regular.otf',
  text: 'Inter-Regular.otf',
  textMedium: 'Inter-Medium.otf',
};

// Lays out a string glyph by glyph (kerning + tracking in em) and returns { d, width }.
export function textPath(str, { file = F.text, size = 24, x = 0, y = 0, anchor = 'start', tracking = 0 } = {}) {
  const f = font(file);
  const scale = size / f.unitsPerEm;
  const glyphs = Array.from(str).map((c) => f.charToGlyph(c));
  const advances = glyphs.map((g, i) => {
    const kern = i < glyphs.length - 1 ? f.getKerningValue(g, glyphs[i + 1]) : 0;
    return (g.advanceWidth + kern) * scale + (i < glyphs.length - 1 ? tracking * size : 0);
  });
  const width = advances.reduce((a, b) => a + b, 0);
  let cx = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  let d = '';
  glyphs.forEach((g, i) => {
    d += g.getPath(cx, y, size).toPathData(1);
    cx += advances[i];
  });
  return { d, width };
}

// Width of one glyph cell for tabular digits (widest digit), used by the rolling counters.
export function digitCell(file, size) {
  const f = font(file);
  const scale = size / f.unitsPerEm;
  return Math.max(...'0123456789'.split('').map((c) => f.charToGlyph(c).advanceWidth * scale));
}

export function glyphPath(ch, { file, size, x, y }) {
  const f = font(file);
  const g = f.charToGlyph(ch);
  const w = g.advanceWidth * (size / f.unitsPerEm);
  return { d: g.getPath(x, y, size).toPathData(1), width: w };
}

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Shared look: dark graphite tile with a hairline border and soft top light, matching the hero glass.
export function tile({ w, h, r = 36, id = 't' }) {
  return {
    defs: `
    <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#17191d"/><stop offset="1" stop-color="#0c0d0f"/>
    </linearGradient>
    <linearGradient id="${id}-edge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity=".07"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".04"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx=".5" cy="0" r=".9">
      <stop offset="0" stop-color="#9aa3ad" stop-opacity=".16"/><stop offset="1" stop-color="#9aa3ad" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".30" stop-color="#eef1f5"/><stop offset=".52" stop-color="#a7aeb8"/>
      <stop offset=".70" stop-color="#f7f9fb"/><stop offset="1" stop-color="#c2c8d0"/>
    </linearGradient>`,
    body: `
  <rect width="${w}" height="${h}" rx="${r}" fill="url(#${id}-bg)"/>
  <rect width="${w}" height="${h}" rx="${r}" fill="url(#${id}-glow)"/>
  <rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="${r - 0.75}" fill="none" stroke="url(#${id}-edge)" stroke-width="1.5"/>`,
  };
}

export const svg = (w, h, inner, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
${inner}
</svg>
`;

// Apple-style easing used across cards.
export const EASE = 'cubic-bezier(.22,1,.36,1)';
