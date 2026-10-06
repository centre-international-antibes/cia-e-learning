/*
 * Captures du parcours refondu — quatre états, deux formats, trois langues.
 *
 *   npm run build
 *   npx vite preview --host 127.0.0.1 --port 8081
 *   node design/audit/capture-parcours.mjs
 *
 * Le chemin de Chromium est explicite : la version installée dans l'image ne
 * correspond pas toujours à celle qu'attend le paquet playwright.
 * La sonde imprime des chiffres (taille du nœud d'entrée, ratio du tracé,
 * présence du moment de fin de niveau) — c'est elle qui tranche, pas l'œil.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:8081';
const OUT = 'design/audit/parcours-fin';
mkdirSync(OUT, { recursive: true });

const VIEWS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1440, height: 900 },
};

/** Sème la progression avant le premier rendu de l'application. */
function seed(upToLesson, xp) {
  return `
    localStorage.clear();
    localStorage.setItem('cia-redesign', '1');
    localStorage.setItem('cia-onboarding-done', new Date().toISOString());
    localStorage.setItem('user-cecr-level', 'A1');
    localStorage.setItem('user-xp', '${xp}');
    if (${upToLesson} > 0) {
      const now = new Date().toISOString();
      const map = {};
      for (let i = 1; i <= ${upToLesson}; i++) map['lesson-' + i] = { completed: true, score: 100, date: now };
      localStorage.setItem('course-progress', JSON.stringify(map));
    }
  `;
}

const CASES = [
  { name: 'vierge', lessons: 0, xp: 0, url: '/programme?redesign=1' },
  { name: 'progression', lessons: 25, xp: 2640, url: '/programme?redesign=1' },
  { name: 'retour-lecon', lessons: 25, xp: 2640, url: '/programme?redesign=1&module=A1.3' },
  { name: 'fin-de-niveau', lessons: 50, xp: 5250, url: '/programme?redesign=1&module=A1.5' },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const [view, viewport] of Object.entries(VIEWS)) {
  for (const c of CASES) {
    const context = await browser.newContext({ viewport, locale: 'fr-FR' });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.addInitScript(seed(c.lessons, c.xp));
    await page.goto(BASE + c.url, { waitUntil: 'networkidle' });
    // Le chemin se dessine en ~0,45 s, Spark saute après : on laisse finir.
    await page.waitForTimeout(4600);
    await page.screenshot({ path: `${OUT}/${c.name}-${view}.png` });
    if (c.name === 'retour-lecon') {
      // Mi-dessin : la capture d'un ressort ne dit rien, celle-ci sert de preuve
      // que le tracé part bien du nœud quitté.
      const mid = await context.newPage();
      await mid.addInitScript(seed(c.lessons, c.xp));
      await mid.goto(BASE + c.url);
      await mid.waitForTimeout(260);
      await mid.screenshot({ path: `${OUT}/${c.name}-midi-${view}.png` });
      await mid.close();
    }
    const probe = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const node = document.querySelector('button[aria-label^="Module 1"]');
      const paths = [...document.querySelectorAll('svg path')]
        .filter((p) => p.getAttribute('stroke-width') === '12');
      return {
        dialog: dialog ? dialog.textContent.replace(/\s+/g, ' ').slice(0, 80) : null,
        node1: node ? Math.round(node.getBoundingClientRect().width) : null,
        paths: paths.map((p) => p.getAttribute('stroke-dasharray') || 'plein'),
      };
    });
    console.log(`${c.name}/${view} — erreurs console : ${errors.length}`);
    console.log('    sonde :', JSON.stringify(probe));
    for (const e of errors.slice(0, 8)) console.log('   ', e.slice(0, 160));
    await context.close();
  }
}

/* Rendu russe et allemand du moment de fin de niveau : les deux langues qui
   débordent. */
for (const locale of ['ru', 'de']) {
  const context = await browser.newContext({ viewport: VIEWS.mobile, locale });
  const page = await context.newPage();
  await page.addInitScript(seed(50, 5250) + `localStorage.setItem('i18nextLng','${locale}');`);
  await page.goto(`${BASE}/programme?redesign=1&module=A1.5`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4600);
  await page.screenshot({ path: `${OUT}/fin-de-niveau-${locale}.png` });
  await context.close();
}

await browser.close();
console.log('captures écrites dans', OUT);
