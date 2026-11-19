#!/usr/bin/env node
/**
 * KSA glass towers for the Digital twin layer, built in code on isomap's landmark-kit.
 *
 *   node models/ksa-towers.mjs        # → models/glb/<name>.glb + <name>.model.json
 *
 * Silhouettes, not surveys: each tower keeps the one thing it is recognised by.
 *   kingdom     Kingdom Centre, Riyadh: lens plan, parabolic opening in the upper third, sky bridge
 *   faisaliah   Al Faisaliah Tower, Riyadh: square pyramid, four beams to a point, glass globe
 *   pif         PIF Tower, KAFD: crystalline shaft of triangular facets
 *   majdoul     Majdoul Tower, Riyadh: square shaft twisting a quarter turn
 *   slab-a/b    plain glass slabs, to make a business district around them
 *
 * Axes as in the kit: x east, y north, z up, metres. Materials are names, the palette comes from the
 * render (render-towers.mjs): Glass, Spandrel, Cap, Frame, Globe, Stone, StoneTop.
 */
import { Model, rect, ngon } from '/Users/alexander/isomap/.claude/skills/metro-passage-style/scripts/landmark-kit.mjs';

const out = (name) => new URL('./glb/' + name + '.glb', import.meta.url);

/** A glazed shaft: tall glass bands with thin spandrels between them. `ringAt(z)` gives the plan at a height. */
function shaft(m, ringAt, z0, z1, bands, { spandrel = 2.4, cap = 'Cap' } = {}) {
  const step = (z1 - z0) / bands;
  for (let k = 0; k < bands; k++) {
    const a = z0 + k * step, b = a + step - spandrel, c = a + step, last = k === bands - 1;
    m.frustum(ringAt(a), ringAt(b), a, b, { side: 'Glass', top: null });
    m.frustum(ringAt(b), ringAt(c), b, c, { side: 'Spandrel', top: last ? cap : null });
  }
}

/* ---- Kingdom Centre ---- */
{
  const m = new Model('kingdom');
  const L = 74, W = 44, E = L / 2 - 0.7, N = 9, Z = 190, TOP = 292;
  const half = (x) => (W / 2) * (1 - (2 * x / L) ** 2);
  /** The lens plan between x = xa and x = xb, counter-clockwise, always 2(N+1) points. */
  const lens = (xa, xb) => {
    const p = [];
    for (let i = 0; i <= N; i++) { const x = xa + ((xb - xa) * i) / N; p.push([x, -half(x)]); }
    for (let i = N; i >= 0; i--) { const x = xa + ((xb - xa) * i) / N; p.push([x, half(x)]); }
    return p;
  };
  m.box(0, 0, 150, 96, 0, 10, { rot: 30, wall: 'Stone', top: 'StoneTop' });   // podiums are turned back so they sit square on the city grid
  m.box(0, 0, 100, 64, 10, 18, { rot: 30, wall: 'Stone', top: 'StoneTop' });
  shaft(m, () => lens(-E, E), 18, Z, 9, { cap: null });
  const gap = (z) => (L / 2 - 8) * Math.sqrt(Math.max(0, (z - Z) / (TOP - Z)));   // half-width of the opening
  const S = 8;
  for (let k = 0; k < S; k++) {
    const a = Z + ((TOP - Z) * k) / S, b = Z + ((TOP - Z) * (k + 1)) / S;
    m.frustum(lens(gap(a), E), lens(gap(b), E), a, b, { side: 'Glass', top: k === S - 1 ? 'Cap' : null });
    m.frustum(lens(-E, -gap(a)), lens(-E, -gap(b)), a, b, { side: 'Glass', top: k === S - 1 ? 'Cap' : null });
  }
  m.prism(lens(-E, E), TOP, TOP + 9, { wall: 'Spandrel', top: 'Cap', bottom: 'Spandrel' });
  m.write(out('kingdom'));
}

/* ---- Al Faisaliah ---- */
{
  const m = new Model('faisaliah');
  const w = (z) => 58 - (58 - 24) * (z / 186);
  m.box(0, 0, 96, 96, 0, 8, { wall: 'Stone', top: 'StoneTop' });
  shaft(m, (z) => rect(0, 0, w(z), w(z)), 8, 186, 7, { cap: 'Cap' });
  for (const [sx, sy] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) m.frustum(rect(sx * 10.5, sy * 10.5, 3, 3), rect(sx * 0.6, sy * 0.6, 1.2, 1.2), 186, 250, { side: 'Frame', top: null });
  const R = 12, zc = 204, prof = [];
  for (let i = 0; i <= 10; i++) { const t = -Math.PI / 2 + (Math.PI * i) / 10; prof.push([i === 0 || i === 10 ? 0 : R * Math.cos(t), zc + R * Math.sin(t)]); }
  m.lathe(0, 0, prof, { seg: 18, mat: 'Globe' });
  m.cone(0, 0, 1.8, 248, 20, { mat: 'Frame', seg: 8 });
  m.write(out('faisaliah'));
}

/* ---- PIF Tower ---- */
{
  const m = new Model('pif');
  const tiers = [[0, 40, 0], [92, 36, 45], [188, 39, 0], [286, 30, 45], [385, 9, 0]];
  m.box(0, 0, 110, 110, 0, 6, { rot: 20, wall: 'Stone', top: 'StoneTop' });
  for (let k = 0; k + 1 < tiers.length; k++) {
    const [z0, r0, a0] = tiers[k], [z1, r1, a1] = tiers[k + 1];
    m.frustum(ngon(0, 0, r0, 4, a0), ngon(0, 0, r1, 4, a1), Math.max(6, z0), z1, { side: 'Glass', top: k === tiers.length - 2 ? 'Cap' : null });
  }
  m.write(out('pif'));
}

/* ---- Majdoul Tower ---- */
{
  const m = new Model('majdoul');
  const H = 232, S = 14;
  m.box(0, 0, 80, 80, 0, 6, { wall: 'Stone', top: 'StoneTop' });
  for (let k = 0; k < S; k++) {
    const a = 6 + ((H - 6) * k) / S, b = 6 + ((H - 6) * (k + 1)) / S, sp = b - 2.2;
    const ring = (z) => ngon(0, 0, 31 - 5 * (z / H), 4, 45 + 90 * (z / H));
    m.frustum(ring(a), ring(sp), a, sp, { side: 'Glass', top: null });
    m.frustum(ring(sp), ring(b), sp, b, { side: 'Spandrel', top: k === S - 1 ? 'Cap' : null });
  }
  m.write(out('majdoul'));
}

/* ---- plain glass slabs ---- */
for (const [name, w, d, h, bands] of [['slab-a', 52, 28, 150, 8], ['slab-b', 34, 34, 104, 6]]) {
  const m = new Model(name);
  const c = 5, ring = [[-w / 2 + c, -d / 2], [w / 2 - c, -d / 2], [w / 2, -d / 2 + c], [w / 2, d / 2 - c], [w / 2 - c, d / 2], [-w / 2 + c, d / 2], [-w / 2, d / 2 - c], [-w / 2, -d / 2 + c]];
  m.box(0, 0, w + 26, d + 26, 0, 7, { rot: name === 'slab-a' ? 60 : 0, wall: 'Stone', top: 'StoneTop' });
  shaft(m, () => ring, 7, h, bands);
  m.write(out(name));
}
