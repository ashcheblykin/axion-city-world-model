#!/usr/bin/env node
/**
 * Builds the public site for GitHub Pages into dist/.
 *
 *   node scripts/build-pages.mjs
 *
 * Only the concepts go public. What stays out, on purpose:
 *   - the Axion typefaces: their licence forbids public servers, so the site falls back to system fonts;
 *   - brief/, refs/, models/ sources: internal brief, meeting notes, other people's pictures;
 *   - comments of the design tokens: they carry internal decisions and order numbers.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..'), src = join(root, 'concepts'), out = join(root, 'dist');
const skill = join(src, 'axion');                                   // symlink to the axion-brand skill assets
const pages = ['a-core-3d.html', 'a-core.html', 'b-orbit.html', 'c-pothole.html', 'd-realism.html'];
const noComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n+/g, '\n');

rmSync(out, { recursive: true, force: true });
for (const d of ['', 'glb', 'realism', 'axion', 'axion/tokens', 'axion/fonts']) mkdirSync(join(out, d), { recursive: true });

for (const f of pages) {
  let html = readFileSync(join(src, f), 'utf8');
  html = html.replace(/<script src="axion\/axion-even\.js"><\/script>\n?/g, '').replace(/<!--[\s\S]*?-->\n?/, '');
  writeFileSync(join(out, f), html);
}
writeFileSync(join(out, 'index.html'), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=a-core-3d.html"><title>City World Model</title>\n');
for (const f of ['shared.js', 'towers.js']) copyFileSync(join(src, f), join(out, f));
writeFileSync(join(out, 'shared.css'), noComments(readFileSync(join(src, 'shared.css'), 'utf8')));
for (const f of readdirSync(join(src, 'glb'))) if (f.endsWith('.glb')) copyFileSync(join(src, 'glb', f), join(out, 'glb', f));
for (const f of readdirSync(join(src, 'realism'))) if (f.endsWith('.png')) copyFileSync(join(src, 'realism', f), join(out, 'realism', f));   // concept D: Sergei's six layers

writeFileSync(join(out, 'axion/axion.css'), noComments(readFileSync(join(skill, 'axion.css'), 'utf8')));
for (const f of readdirSync(join(skill, 'tokens'))) if (f.endsWith('.css')) writeFileSync(join(out, 'axion/tokens', f), noComments(readFileSync(join(skill, 'tokens', f), 'utf8')));
copyFileSync(join(skill, 'axion-logo.js'), join(out, 'axion/axion-logo.js'));
/* no font files: the three families point at what the visitor's system has */
writeFileSync(join(out, 'axion/fonts/fonts.css'),
  ':root, [data-theme] {\n  --family-display: "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;\n  --family-text: "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;\n  --family-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;\n}\n');
writeFileSync(join(out, '.nojekyll'), '');

const list = (d, p = '') => readdirSync(join(out, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? list(join(d, e.name), p + e.name + '/') : [p + e.name]));
console.log(list('').join('\n'));
