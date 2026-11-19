/* Shared by the three City World Model concepts: brief copy, frame fit, SVG helpers, the play loop.
   Copy is the short brief in English, nothing added: Axion typefaces carry no Cyrillic. */
(function () {
  const layers = [
    { n: '01', id: 'capture', name: 'Capture',
      what: 'The city is filmed by our own cameras and the driver fleet.',
      ex: 'One pass down a street is a stream of frames.' },
    { n: '02', id: 'gate', name: 'Quality gate',
      what: 'The server rejects useless frames and passes the rest on.',
      ex: 'A black, blurred or sky frame is sifted out.' },
    { n: '03', id: 'detection', name: 'Detection',
      what: 'Violations are found in the frames.',
      ex: 'A damaged fence or lamp post, illegal advertising, graffiti, a pothole.' },
    { n: '04', id: 'registry', name: 'Asset registry',
      what: 'A base of assets is built, sorted by violation category.',
      ex: 'Every lamp post, fence and billboard is one record.' },
    { n: '05', id: 'case', name: 'Case',
      what: 'A case is built: the story of one violation in the city.',
      ex: 'What is broken, where, since which day, photos as evidence.' },
    { n: '06', id: 'twin', name: 'Digital twin',
      what: 'The whole city in one model, with widgets on its state.',
      ex: 'A map of open violations, counters by category, what was fixed this week.' },
  ];
  const loop = {
    tag: 'Reupdated', title: 'A cycle, not a layer',
    text: 'The city changes every day, so the model is never finished. A pothole is patched, the next pass sees it and the case closes.',
  };

  const NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function h(tag, cls, html, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function rng(seed) { // mulberry32: the same picture on every load
    return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  const still = navigator.webdriver || /[?&]still\b/.test(location.search);
  if (still) document.documentElement.classList.add('still');
  function fit() {
    const box = document.querySelector('.fitbox'); if (!box || still) return;
    const vp = document.querySelector('.viewport').getBoundingClientRect();
    box.style.transform = 'translate(-50%, -50%) scale(' + Math.min(vp.width / 1920, vp.height / 1080) + ')';
  }
  addEventListener('resize', fit);
  addEventListener('DOMContentLoaded', fit);

  /* rows of the six layers, top layer first when `topFirst` */
  function rows(parent, opts) {
    const list = [];
    layers.forEach(function (L, i) {
      const r = h('div', 'row', '<span class="n">' + L.n + '</span><span class="name">' + L.name + '</span><span class="what">' + L.what + '</span><span class="ex">' + L.ex + '</span>', parent);
      r.dataset.i = i;
      r.addEventListener('mouseenter', function () { opts.onFocus(i); });
      r.addEventListener('mouseleave', function () { opts.onFocus(null); });
      r.addEventListener('click', function () { opts.onPick(i); });
      list.push(r);
    });
    return list;
  }

  /* play: steps through the six layers, then the loop; `onStep(k)` with k 0…5 a layer, 6 the loop */
  function player(onStep, ms) {
    let timer = null, k = -1;
    const btn = document.querySelector('[data-play]');
    function tick() { k = (k + 1) % 7; onStep(k); timer = setTimeout(tick, k === 6 ? ms * 2 : ms); }
    function set(on) {
      clearTimeout(timer); timer = null;
      if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) tick(); else { k = -1; onStep(null); }
    }
    if (btn) btn.addEventListener('click', function () { set(!timer); });
    return { stop: function () { if (timer) set(false); }, on: function () { return !!timer; } };
  }

  /* a frame from the pass: a street with a horizon, a road, and what is on the road */
  function street(g, x, y, w, hh, o) {
    o = o || {};
    if (o.bad) {
      s('rect', { class: o.out ? 'fr bad out' : 'fr bad', x: x, y: y, width: w, height: hh }, g);
      if (o.bad === 'blur') for (let m = 1; m <= 4; m++) s('line', { class: 'mark', x1: x + w * 0.14, y1: y + hh * m / 5, x2: x + w * 0.86, y2: y + hh * m / 5, 'stroke-dasharray': '1 4' }, g);
      if (o.bad === 'sky') { s('circle', { class: 'mark', cx: x + w * 0.68, cy: y + hh * 0.36, r: hh * 0.14 }, g); s('line', { class: 'mark', x1: x + w * 0.16, y1: y + hh * 0.66, x2: x + w * 0.5, y2: y + hh * 0.66 }, g); }
      return null;
    }
    const y0 = y + hh * 0.42, px = x + w * 0.41, py = y + hh * 0.8;
    s('rect', { class: o.lime ? 'fr p' : o.sel ? 'fr sel' : 'fr', x: x, y: y, width: w, height: hh }, g);
    s('polygon', { class: 'roadway', points: [[x + w * 0.14, y + hh], [x + w * 0.86, y + hh], [x + w * 0.55, y0], [x + w * 0.45, y0]].map(function (p) { return p.join(','); }).join(' ') }, g);
    s('line', { class: 'mark', x1: x, y1: y0, x2: x + w, y2: y0 }, g);
    s('line', { class: 'mark', x1: x + w * 0.5, y1: y0 + 2, x2: x + w * 0.5, y2: y + hh, 'stroke-dasharray': '4 4' }, g);
    s('rect', { class: 'mark', x: x + w * 0.06, y: y + hh * 0.16, width: w * 0.2, height: hh * 0.26 }, g);
    s('rect', { class: 'mark', x: x + w * 0.7, y: y + hh * 0.24, width: w * 0.16, height: hh * 0.18 }, g);
    if (o.lamp) { s('line', { class: 'find', x1: x + w * 0.9, y1: y + hh * 0.2, x2: x + w * 0.94, y2: y + hh * 0.74 }, g); }
    if (o.hole) s('ellipse', { class: 'p-fill', cx: px, cy: py, rx: w * 0.075, ry: hh * 0.05 }, g);
    if (o.patch) s('rect', { class: 'find', x: px - w * 0.1, y: py - hh * 0.075, width: w * 0.2, height: hh * 0.15, 'stroke-dasharray': '3 3' }, g);
    return [px, py];
  }

  function ready() { document.documentElement.dataset.ready = '1'; }

  window.CWM = { layers: layers, loop: loop, s: s, h: h, rng: rng, fit: fit, rows: rows, player: player, ready: ready, still: still, street: street };
})();
