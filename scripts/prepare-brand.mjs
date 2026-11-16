// Builds brand + map assets from the official sources:
//  - assets-src/brand/logo-cia.pdf (vector) -> public/brand/*.svg
//      logo-primary.svg        colour, WITHOUT baseline (charte: version primaire)
//      logo-primary-white.svg  white monochrome (dark backgrounds)
//      logo-bandeau-white.svg  symbol + wordmark side by side (small sizes)
//    + src/presentation/brand.generated.json : baseline glyph outlines
//      ("Don't learn French. Live it." set in Better Together inside the logo),
//      used to pen-trace "Live it." without needing the font file.
//  - world-atlas (Natural Earth 1:10m, public domain) -> public/geo/riviera.json
// Usage: node scripts/prepare-brand.mjs
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'public', 'brand');
fs.mkdirSync(OUT, {recursive: true});

const tmpSvg = path.join(OUT, '.logo-src.svg');
execFileSync('pdftocairo', ['-svg', path.join(ROOT, 'assets-src/brand/logo-cia.pdf'), tmpSvg]);
const src = fs.readFileSync(tmpSvg, 'utf8');
fs.unlinkSync(tmpSvg);

const defs = src.slice(src.indexOf('<defs>'), src.indexOf('</defs>') + 7);
const body = src.slice(src.indexOf('</defs>') + 7, src.lastIndexOf('</svg>'));

// Top-level elements of the body: <path .../> or <g ...>...</g>
const elements = [];
const re = /<path\b[^>]*\/>|<g\b[^>]*>[\s\S]*?<\/g>/g;
let m;
while ((m = re.exec(body))) elements.push(m[0]);

const NAVY = 'rgb(7.099915%, 14.898682%, 23.498535%)';
const RED = 'rgb(90.19928%, 20.799255%, 25.898743%)';
const isBaseline = (e) => e.startsWith('<g') && e.includes(RED) && e.includes('glyph-2-');
const isFlag = (e) => e.startsWith('<path') && /M 1(3[0-9]|4[0-9]|5[0-9])\.\d+ 208\./.test(e);
const isWordmark = (e) => e.startsWith('<g') && e.includes(NAVY);
const isSymbol = (e) => e.startsWith('<path') && e.includes(NAVY) && !isFlag(e);

const symbol = elements.filter(isSymbol);
const wordmark = elements.filter(isWordmark);
const flag = elements.filter(isFlag);
const baseline = elements.filter(isBaseline);
console.log(`logo parts: symbol ${symbol.length}, wordmark ${wordmark.length}, flag ${flag.length}, baseline ${baseline.length}`);
if (!symbol.length || !wordmark.length || flag.length !== 3 || !baseline.length) {
  throw new Error('Unexpected logo structure — check logo-cia.pdf');
}

// Bounding boxes measured in a real browser (Playwright/Chromium)
const {chromium} = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const bbox = async (inner) => {
  await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="300">${defs}<g id="t">${inner}</g></svg>`);
  return page.evaluate(() => {
    const b = document.getElementById('t').getBBox();
    return {x: b.x, y: b.y, w: b.width, h: b.height};
  });
};

const r = (n) => Math.round(n * 1000) / 1000;
const write = (name, vb, inner) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${r(vb.x)} ${r(vb.y)} ${r(vb.w)} ${r(vb.h)}">${defs}${inner}</svg>\n`;
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log('wrote', name, `${r(vb.w)}x${r(vb.h)}`);
};
const white = (s) => s.replaceAll(NAVY, '#FFFFFF').replaceAll(RED, '#FFFFFF').replace(/fill="rgb\([^"]*\)"/g, 'fill="#FFFFFF"');

// 1) Primary logo, colour, no baseline (flag kept: it is part of the mark)
const primaryInner = [...symbol, ...wordmark, ...flag].join('\n');
const pb = await bbox(primaryInner);
write('logo-primary.svg', pb, primaryInner);
write('logo-primary-white.svg', pb, white(primaryInner));

// 2) Bandeau: symbol on the left, wordmark (+flag) on the right
const sb = await bbox(symbol.join('\n'));
const wb = await bbox([...wordmark, ...flag].join('\n'));
const gap = wb.h * 0.16;
const scaleSym = (wb.h * 1.0) / sb.h;
const symW = sb.w * scaleSym;
const bandeauInner = (s) => `<g transform="translate(${r(-sb.x * scaleSym)} ${r(wb.y - sb.y * scaleSym)}) scale(${r(scaleSym)})">${s(symbol.join('\n'))}</g>` +
  `<g transform="translate(${r(symW + gap - wb.x)} 0)">${s([...wordmark, ...flag].join('\n'))}</g>`;
write('logo-bandeau-white.svg', {x: 0, y: wb.y, w: symW + gap + wb.w, h: wb.h}, bandeauInner(white));
write('logo-bandeau.svg', {x: 0, y: wb.y, w: symW + gap + wb.w, h: wb.h}, bandeauInner((s) => s));

// 3) Baseline glyph outlines, in reading order
const glyphD = {};
for (const g of defs.matchAll(/<g id="(glyph-2-\d+)">([\s\S]*?)<\/g>/g)) {
  glyphD[g[1]] = [...g[2].matchAll(/\sd="([^"]*)"/g)].map((x) => x[1].trim()).join(' ');
}
const uses = [];
for (const b of baseline) for (const u of b.matchAll(/<use xlink:href="#(glyph-2-\d+)" x="([\d.]+)" y="([\d.]+)"\/>/g)) {
  uses.push({glyph: u[1], x: +u[2], y: +u[3], d: glyphD[u[1]]});
}
uses.sort((a, b) => a.x - b.x);
// "Live it." starts at the capital L (glyph after the full stop of "French.")
const liveStart = uses.findIndex((u, i) => i > 0 && uses[i - 1].glyph === uses[uses.length - 1].glyph && u.x > 160);
const glyphs = uses.map((u, i) => ({d: u.d, x: r(u.x), y: r(u.y), part: i >= liveStart ? 'live' : 'dont'}));
const liveBox = await bbox(uses.slice(liveStart).map((u) => `<use xlink:href="#${u.glyph}" x="${u.x}" y="${u.y}"/>`).join(''));
const dontBox = await bbox(uses.slice(0, liveStart).map((u) => `<use xlink:href="#${u.glyph}" x="${u.x}" y="${u.y}"/>`).join(''));
console.log('baseline glyphs', uses.length, 'Live it. from index', liveStart);

await browser.close();

// 4) Coastline / land around the Riviera (Natural Earth 10m via world-atlas)
const topo = JSON.parse(fs.readFileSync(require.resolve('world-atlas/countries-10m.json'), 'utf8'));
const {feature} = await import('topojson-client');
const countries = feature(topo, topo.objects.countries);
const keep = ['France', 'Italy', 'Monaco', 'Spain', 'Switzerland', 'Germany', 'Belgium', 'Luxembourg', 'Netherlands', 'Austria', 'Portugal', 'United Kingdom', 'Ireland', 'Andorra', 'San Marino', 'Vatican', 'Liechtenstein', 'Slovenia', 'Croatia', 'Denmark', 'Czechia', 'Poland', 'Hungary', 'Slovakia', 'Bosnia and Herz.', 'Tunisia', 'Algeria', 'Morocco', 'Montenegro', 'Serbia', 'Albania', 'Greece', 'North Macedonia', 'Kosovo', 'Malta', 'Sweden', 'Norway'];
const {merge} = await import('topojson-client');
const kept = topo.objects.countries.geometries.filter((g) => keep.includes(g.properties.name));
// Coastline only: merge the countries into one land mass (no borders drawn).
const merged = merge(topo, kept);
// d3-geo expects clockwise exterior rings (spherical winding): fix any ring
// whose area would cover the rest of the globe.
const {geoArea} = await import('d3-geo');
merged.coordinates = merged.coordinates.map((poly) => {
  const test = {type: 'Polygon', coordinates: [poly[0]]};
  return geoArea(test) > 2 * Math.PI ? poly.map((ring) => [...ring].reverse()) : poly;
});
const geo = {type: 'Feature', properties: {}, geometry: merged};
console.log('countries merged', kept.length, '/', keep.length);
fs.writeFileSync(path.join(ROOT, 'src', 'presentation', 'map', 'europe-10m.json'), JSON.stringify(geo));

const gen = {
  primary: {w: r(pb.w), h: r(pb.h)},
  bandeau: {w: r(symW + gap + wb.w), h: r(wb.h)},
  baseline: {glyphs, live: liveBox, dont: dontBox},
};
fs.writeFileSync(path.join(ROOT, 'src', 'presentation', 'brand.generated.json'), JSON.stringify(gen));
console.log('wrote src/presentation/brand.generated.json');
