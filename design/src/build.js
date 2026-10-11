// Builds the visual assets into ../assets (the profile repo root).
// Usage: node src/build.js [hero|cards]
//   cards: vector cards only (fast, runs in GitHub Actions daily to refresh the numbers)
//   hero:  animated liquid-chrome hero (needs Chrome + ffmpeg-static; run locally)
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { profile, roles, shipped, stack, project, footerLine } from './profile.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT_DIR || path.join(ROOT, '..', 'assets');
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2];

if (!only || only === 'cards') {
  const { fetchStats } = await import('./stats.js');
  const cards = await import('./cards.js');
  const stats = await fetchStats(profile.login, path.join(ROOT, 'data', 'stats.json'));
  const files = {
    'stats.svg': cards.statsCard(stats),
    'experience.svg': cards.experienceCard(roles),
    'shipped.svg': cards.shippedCard(shipped.areas, shipped.headline),
    'stack.svg': cards.stackCard(stack),
    'project.svg': cards.projectCard(project),
    'btn-linkedin.svg': cards.button('Connect on LinkedIn'),
    'btn-prs.svg': cards.button('Browse merged PRs'),
    'footer.svg': cards.footer(footerLine),
  };
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), content);
  console.log(`cards: ${Object.keys(files).length} files, stats ${JSON.stringify(stats)}`);
}

if (!only || only === 'hero') {
  const { createRequire } = await import('node:module');
  const { buildHero } = await import('./hero.js');
  const require = createRequire(import.meta.url);
  const t = Date.now();
  const file = await buildHero(OUT, {
    framesDir: path.join(os.tmpdir(), 'profile-hero-frames'),
    ffmpeg: require('ffmpeg-static'),
  });
  console.log(`hero: ${file} ${(fs.statSync(file).size / 1024).toFixed(0)} KB in ${((Date.now() - t) / 1000).toFixed(1)}s`);
}
