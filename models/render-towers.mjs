#!/usr/bin/env node
/**
 * Renders the KSA towers through isomap in the camera of concept A (the slab's own isometry)
 * and writes them as inline SVG groups for the page: concepts/towers.js.
 *
 *   node models/ksa-towers.mjs && node models/render-towers.mjs
 *
 * isomap draws each model as plain paths. Its colours are replaced here by classes that point at
 * Axion grey tokens, so the page carries no colour of its own.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const ISOMAP = '/Users/alexander/isomap';
const RATIO = 0.30;                                   // the slab: ground squashed to 0.30, as in a-core.html
const TILT = (Math.asin(RATIO) * 180) / Math.PI;      // isomap squashes the ground by sin(tilt)
const SCALE = Number(process.argv[2]) || 0.5;        // px per metre

const pal = (roof, light, mid, dark, line) => ({ roof, light, mid, dark, line });
const materials = {
  Glass: pal('#797979', '#5c5c5c', '#4a4a4a', '#333333', '#797979'),
  Spandrel: pal('#262626', '#262626', '#1a1a1a', '#1a1a1a', '#797979'),
  Cap: pal('#797979', '#5c5c5c', '#4a4a4a', '#333333', '#a8a8a8'),
  Frame: pal('#a8a8a8', '#a8a8a8', '#797979', '#5c5c5c', '#d9d9d9'),
  Globe: pal('#d9d9d9', '#d9d9d9', '#a8a8a8', '#797979', '#e8e8e8'),
  Stone: pal('#333333', '#333333', '#262626', '#1a1a1a', '#797979'),
  StoneTop: pal('#333333', '#333333', '#262626', '#1a1a1a', '#797979'),
};
/** name → compass bearing the model's +y turns to. The camera stands in the south-east. */
const towers = { kingdom: 300, faisaliah: 0, pif: 20, majdoul: 0, 'slab-a': 330, 'slab-b': 0 };

const greys = { 50: 0xfa, 100: 0xf5, 200: 0xe8, 300: 0xd9, 400: 0xa8, 500: 0x79, 600: 0x5c, 700: 0x4a, 800: 0x33, 900: 0x26, 950: 0x1a, 1000: 0x00 };
const nearest = (hex) => {
  const h = hex.replace('#', ''), f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const v = (parseInt(f.slice(0, 2), 16) * 0.299 + parseInt(f.slice(2, 4), 16) * 0.587 + parseInt(f.slice(4, 6), 16) * 0.114);
  let best = 1000, d = 1e9; for (const k in greys) { const e = Math.abs(greys[k] - v); if (e < d) { d = e; best = k; } }
  return best;
};

const dir = mkdtempSync(join(tmpdir(), 'cwm-towers-'));
writeFileSync(join(dir, 'osm-raw.json'), '{"version":0.6,"elements":[]}');
const lon0 = 46.6753, lat0 = 24.7136, result = {};
for (const [name, heading] of Object.entries(towers)) {
  const meta = JSON.parse(readFileSync(join(here, 'glb', name + '.model.json'), 'utf8'));
  const [sx, sy, sz] = meta.sizeM, diag = Math.hypot(sx, sy);
  const W = Math.ceil(diag * SCALE + 40), H = Math.ceil(sz * SCALE + diag * SCALE * RATIO + 40);
  const ax = W / 2, ay = H - 20 - (diag * SCALE * RATIO) / 2;
  copyFileSync(join(here, 'glb', name + '.glb'), join(dir, name + '.glb'));
  const spec = {
    title: name,
    view: { width: W, height: H, anchor: { geo: [lon0, lat0], px: [ax, ay] }, rotation: 45, tilt: TILT, scale: SCALE, verticalScale: 1 },
    data: { osm: './osm-raw.json' },
    style: { land: '#000000', building: { lineWidth: 0.6, lineWidthInner: 0.35 } },
    layers: { osmColours: false }, transit: false,
    labels: { streets: { auto: false }, parks: { auto: false }, pois: { auto: false } },
    stack: [{ type: 'buildings', mode: 'flat' }],
    buildings: [{ id: name, name, shadow: false, label: false,
      footprint: { circle: { center: [lon0, lat0], r: Math.max(2, diag / 2) } }, volumes: [{ height: 1 }],
      model: { src: name + '.glb', heading, at: [lon0, lat0], scale: 1, tint: 0, materials, edges: 24 } }],
  };
  const map = join(dir, name + '.json'), svgFile = join(dir, name + '.svg');
  writeFileSync(map, JSON.stringify(spec));
  const r = spawnSync(process.execPath, [join(ISOMAP, 'src/cli.ts'), 'render', map, '-o', svgFile], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }
  result[name] = { raw: readFileSync(svgFile, 'utf8'), W, H, ax, ay, heightPx: sz * SCALE * Math.cos((TILT * Math.PI) / 180) };
  mkdirSync(join(here, 'check'), { recursive: true });
  copyFileSync(svgFile, join(here, 'check', name + '.iso.svg'));
  console.error(`${name}: ${W}×${H}px, anchor ${ax.toFixed(1)},${ay.toFixed(1)}`);
}
if (process.argv.includes('--raw')) process.exit(0);

/* keep only the drawn shapes, swap colours for token classes */
const out = {};
for (const [name, t] of Object.entries(result)) {
  const shapes = t.raw.match(/<(path|polygon|polyline|line)\b[^>]*\/>/g) || [];
  const body = shapes.map((el) => {
    let cls = [];
    el = el.replace(/\sfill="(#[0-9a-fA-F]{3,6})"/, (_, c) => { cls.push('g' + nearest(c)); return ''; });
    el = el.replace(/\sstroke="(#[0-9a-fA-F]{3,6})"/, (_, c) => { cls.push('s' + nearest(c)); return ''; });
    el = el.replace(/\s(?:fill|stroke)-opacity="1"/g, '');
    return el.replace(/^<(\w+)/, '<$1 class="' + cls.join(' ') + '"');
  }).join('');
  out[name] = { w: t.W, h: t.H, ax: +t.ax.toFixed(2), ay: +t.ay.toFixed(2), top: +t.heightPx.toFixed(1), svg: body };
  console.error(`${name}: ${shapes.length} shapes, ${(body.length / 1024).toFixed(0)} KB`);
}
writeFileSync(join(here, '..', 'concepts', 'towers.js'),
  '/* Generated by models/render-towers.mjs from models/glb/*.glb. Do not edit by hand. */\nwindow.CWM_TOWERS = ' + JSON.stringify(out) + ';\n');
