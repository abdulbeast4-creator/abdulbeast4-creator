// Inlines the Inter / Inter Display font files as @font-face rules (data URIs), so headless renders
// never depend on locally installed fonts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fonts');

const FACES = [
  ['Inter Display', 400, 'InterDisplay-Regular.otf'],
  ['Inter Display', 600, 'InterDisplay-SemiBold.otf'],
  ['Inter', 400, 'Inter-Regular.otf'],
  ['Inter', 500, 'Inter-Medium.otf'],
];

export function fontFaceCSS() {
  return FACES.map(([family, weight, file]) => {
    const b64 = fs.readFileSync(path.join(DIR, file)).toString('base64');
    return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/otf;base64,${b64}) format('opentype');}`;
  }).join('\n');
}

export const FONT_DIR = DIR;
