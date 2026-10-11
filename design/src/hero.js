// Renders the animated hero: liquid chrome (WebGL) under a glass panel with Inter Display type.
// Output: assets/hero.webp, a seamless loop.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { FRAG } from './chrome.js';
import { fontFaceCSS } from './fonts.js';
import { profile } from './profile.js';

const W = 1600;
const H = 600;
const SECONDS = Number(process.env.HERO_SECONDS || 8);
const FPS = Number(process.env.HERO_FPS || 12);
const FRAMES = Number(process.env.HERO_FRAMES || SECONDS * FPS);
const SCALE = Number(process.env.HERO_SCALE || 0.8);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFaceCSS()}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent}
#hero{position:relative;width:${W}px;height:${H}px;border-radius:36px;overflow:hidden;background:#0b0c0e;
  font-family:'Inter Display','Inter',sans-serif;-webkit-font-smoothing:antialiased}
#bg{position:absolute;inset:0;width:100%;height:100%}
.vignette{position:absolute;inset:0;
  background:radial-gradient(120% 95% at 50% 50%,rgba(0,0,0,0) 35%,rgba(0,0,0,.55) 100%)}
.glass{position:absolute;left:50%;top:50%;width:1080px;height:392px;transform:translate(-50%,-50%);
  border-radius:44px;background:linear-gradient(180deg,rgba(18,20,24,.50),rgba(8,9,11,.62));
  backdrop-filter:blur(30px) saturate(135%);-webkit-backdrop-filter:blur(30px) saturate(135%);
  box-shadow:0 40px 90px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.30),inset 0 -1px 0 rgba(255,255,255,.06)}
.glass::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.5px;
  background:conic-gradient(from var(--ang),rgba(255,255,255,.06),rgba(255,255,255,.75) 8%,rgba(255,255,255,.06) 22%,
    rgba(255,255,255,.06) 50%,rgba(255,255,255,.45) 58%,rgba(255,255,255,.06) 72%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.glass::after{content:'';position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,0) 38%)}
.content{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2}
.eyebrow{font-family:'Inter';font-weight:500;font-size:20px;letter-spacing:.34em;text-transform:uppercase;
  color:rgba(235,238,242,.72);margin-bottom:18px}
.name{position:relative;font-weight:600;font-size:150px;line-height:1;letter-spacing:-.045em;padding:0 8px 14px}
.name span{display:block;background:linear-gradient(180deg,#fbfcfd 0%,#d9dde2 28%,#8a929c 50%,#5f666f 54%,#c9ced5 74%,#eef1f4 88%,#9ea5ae 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 18px rgba(0,0,0,.45))}
.name .sheen{position:absolute;inset:0;padding:0 8px 14px;
  background:linear-gradient(105deg,rgba(255,255,255,0) 40%,rgba(255,255,255,1) 50%,rgba(255,255,255,0) 60%);
  background-size:300% 100%;background-position:var(--sx) 0;-webkit-background-clip:text;background-clip:text;color:transparent;filter:none}
.tagline{font-weight:400;font-size:32px;letter-spacing:-.01em;color:rgba(226,230,236,.86);margin-top:6px}
.pill{margin-top:34px;display:flex;align-items:center;gap:12px;padding:11px 22px 11px 18px;border-radius:999px;
  font-family:'Inter';font-weight:500;font-size:18px;letter-spacing:.01em;color:rgba(240,242,246,.9);
  background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
.dot{width:10px;height:10px;border-radius:50%;background:#30d158;box-shadow:0 0 0 var(--pr) rgba(48,209,88,var(--pa)),0 0 12px rgba(48,209,88,.8)}
.sep{opacity:.4}
</style></head><body>
<div id="hero">
  <canvas id="bg" width="${W}" height="${H}"></canvas>
  <div class="vignette"></div>
  <div class="glass"></div>
  <div class="content">
    <div class="eyebrow">${profile.eyebrow}</div>
    <div class="name"><span>${profile.name}</span><span class="sheen">${profile.name}</span></div>
    <div class="tagline">${profile.tagline}</div>
    <div class="pill"><i class="dot"></i>${profile.status}<span class="sep">·</span>${profile.location}</div>
  </div>
</div>
<script>
const c=document.getElementById('bg');
const gl=c.getContext('webgl',{preserveDrawingBuffer:true,antialias:false});
const mk=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(x));return x};
const p=gl.createProgram();
gl.attachShader(p,mk(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
gl.attachShader(p,mk(gl.FRAGMENT_SHADER,${JSON.stringify(FRAG)}));
gl.linkProgram(p);gl.useProgram(p);
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
const a=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
window.setPhase=(ph)=>{
  gl.uniform2f(gl.getUniformLocation(p,'uRes'),c.width,c.height);
  gl.uniform1f(gl.getUniformLocation(p,'uT'),ph*Math.PI*2);
  gl.uniform1f(gl.getUniformLocation(p,'uSeed'),0.0);
  gl.uniform1f(gl.getUniformLocation(p,'uAmp'),${Number(process.env.HERO_AMP || 0.9)});
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  const s=document.getElementById('hero').style;
  // Glint crosses the name once, early in each loop; idle otherwise.
  const g=Math.min(Math.max((ph-0.06)/0.30,0),1);
  s.setProperty('--sx',(100-ease(g)*100)+'%');
  s.setProperty('--ang',(ph*360)+'deg');
  const pulse=(ph*4)%1;
  s.setProperty('--pr',(pulse*10).toFixed(2)+'px');
  s.setProperty('--pa',(0.45*(1-pulse)).toFixed(3));
};
</script></body></html>`;

export async function buildHero(outDir, { framesDir, ffmpeg }) {
  fs.mkdirSync(framesDir, { recursive: true });
  for (const f of fs.readdirSync(framesDir)) fs.unlinkSync(path.join(framesDir, f));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage();
  // Layout is authored at 1600x600 and captured at SCALE (supersampled), which keeps the file small.
  await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const el = await page.$('#hero');
  for (let i = 0; i < FRAMES; i++) {
    await page.evaluate((ph) => window.setPhase(ph), i / FRAMES);
    await el.screenshot({ path: path.join(framesDir, `f${String(i).padStart(4, '0')}.png`), omitBackground: true });
  }
  await browser.close();
  execFileSync(ffmpeg, [
    '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%04d.png'),
    '-c:v', 'libwebp_anim', '-lossless', '0', '-quality', String(process.env.HERO_Q || 72),
    '-compression_level', '6', '-loop', '0', '-pix_fmt', 'yuva420p', path.join(outDir, 'hero.webp'),
  ]);
  return path.join(outDir, 'hero.webp');
}
