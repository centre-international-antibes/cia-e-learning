/*
 * Captures avant/après du hotfix de palette, **sans le drapeau de refonte**.
 *
 *   node design/audit/capture-palette.mjs <suffixe>
 *
 * Le `localStorage` est vidé à chaque page : pas de `cia-redesign`, donc l'app
 * telle que la voit un visiteur. Une session est forgée en local pour atteindre
 * le dashboard et le player, qui sont derrière une authentification ; elle ne
 * parle à aucun serveur, les appels réseau échouent et c'est sans importance —
 * ce qu'on regarde ici, ce sont les couleurs.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const SUFFIXE = process.argv[2] ?? 'apres';
const BASE = 'http://127.0.0.1:8081';
const OUT = 'design/audit/palette';
mkdirSync(OUT, { recursive: true });

const env = readFileSync('.env', 'utf8');
const ref = new URL(
  /VITE_SUPABASE_URL=(.*)/.exec(env)[1].trim().replace(/^"|"$/g, ''),
).hostname.split('.')[0];

const session = {
  access_token: 'local-preview',
  token_type: 'bearer',
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  expires_in: 86400,
  refresh_token: 'local-preview',
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'jules@example.test',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: { full_name: 'Jules', first_name: 'Jules' },
  },
};

/** Player déjà terminé : l'écran de fin s'affiche sans jouer dix étapes. */
const playerDone = {
  player: {
    phase: 'done',
    mainIndex: 10,
    replayIndex: 0,
    replayQueue: [],
    correctCount: 9,
    answeredCount: 10,
    combo: 5,
    bestCombo: 7,
    playedCount: 10,
    progressPct: 100,
  },
};

const UID = session.user.id;

const seed = `
  localStorage.clear();
  localStorage.setItem(${JSON.stringify('sb-' + ref + '-auth-token')}, ${JSON.stringify(JSON.stringify(session))});
  // useAuth cloisonne la progression par compte dès qu'une session existe :
  // les clés doivent porter le même suffixe, sinon rien n'est relu.
  localStorage.setItem('cia-active-user-id', ${JSON.stringify(UID)});
  localStorage.setItem('cia-onboarding-done', new Date().toISOString());
  localStorage.setItem('cia-onboarding-skip-until', String(Date.now() + 31536000000));
  localStorage.setItem('user-cecr-level', 'A1');
  localStorage.setItem('user-xp', '1240');
  (function () {
    const now = new Date().toISOString(); const m = {};
    for (let i = 1; i <= 12; i++) m['lesson-' + i] = { completed: true, score: 100, date: now };
    localStorage.setItem('course-progress:' + ${JSON.stringify(UID)}, JSON.stringify(m));
  })();
`;

/** L'accueil guidé se glisse devant tout : on le referme avant de mesurer. */
async function fermerOnboarding(page) {
  const passer = page.getByRole('button', { name: /Passer pour l'instant|Fermer/ }).first();
  if (await passer.isVisible().catch(() => false)) {
    await passer.click().catch(() => {});
    await page.waitForTimeout(500);
  }
}

const VIEWS = { '375': { width: 375, height: 812 }, '1440': { width: 1440, height: 900 } };

/** Ce que le navigateur a réellement résolu — un chiffre, pas une impression. */
const TOKENS = ['--background', '--primary', '--card', '--foreground', '--border'];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const [view, viewport] of Object.entries(VIEWS)) {
  const ctx = await b.newContext({ viewport, locale: 'fr-FR' });
  await ctx.addInitScript(seed);

  const shot = async (nom, url, apres) => {
    const page = await ctx.newPage();
    await page.goto(BASE + url, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1500);
    await fermerOnboarding(page);
    if (apres) await apres(page);
    const mesures = await page.evaluate((tokens) => {
      const cs = getComputedStyle(document.documentElement);
      const body = getComputedStyle(document.body);
      return {
        tokens: Object.fromEntries(tokens.map((t) => [t, cs.getPropertyValue(t).trim()])),
        fondBody: body.backgroundColor,
        drapeau: document.documentElement.hasAttribute('data-redesign'),
      };
    }, TOKENS);
    await page.screenshot({ path: `${OUT}/${nom}-${view}-${SUFFIXE}.png` });
    const vides = Object.entries(mesures.tokens).filter(([, v]) => !v).map(([k]) => k);
    console.log(
      `${nom}/${view}`.padEnd(22),
      `drapeau:${mesures.drapeau ? 'oui' : 'non'}`,
      `fond:${mesures.fondBody}`,
      vides.length ? `TOKENS VIDES: ${vides.join(' ')}` : 'tokens: tous définis',
    );
    return page;
  };

  await (await shot('accueil', '/')).close();
  await (await shot('parcours', '/programme')).close();

  const dash = await shot('dashboard', '/dashboard');
  const salutation = await dash.evaluate(() => {
    const el = [...document.querySelectorAll('h1, h2, p, span')].find((e) =>
      /Bonjour/i.test(e.textContent ?? ''),
    );
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { texte: el.textContent.trim().slice(0, 40), police: cs.fontFamily, taille: cs.fontSize };
  });
  console.log(`  salutation/${view}`, JSON.stringify(salutation));
  await dash.close();

  await (
    await shot('player', '/cours/lesson-1', async (page) => {
      const cta = page.getByRole('button', { name: /Commencer le cours|Reprendre/ }).first();
      await cta.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(2000);
    })
  ).close();

  const fin = await ctx.newPage();
  await fin.addInitScript(
    `localStorage.setItem('course-player-progress:' + ${JSON.stringify(UID)} + ':lesson-1', ${JSON.stringify(JSON.stringify(playerDone))});`,
  );
  await fin.goto(BASE + '/cours/lesson-1', { waitUntil: 'networkidle' }).catch(() => {});
  await fin.waitForTimeout(1500);
  await fermerOnboarding(fin);
  // On clique par le DOM : le libellé du bouton change selon l'état sauvegardé
  // (« Commencer », « Reprendre », « Revoir »…), et un sélecteur par nom rate.
  const clic = await fin.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((e) =>
      /cours|leçon|commencer|reprendre|rejouer|revoir|continuer/i.test(e.textContent ?? ''),
    );
    if (!b) return { trouve: false, boutons: [...document.querySelectorAll('button')].map((e) => e.textContent.trim()).slice(0, 10) };
    b.scrollIntoView();
    b.click();
    return { trouve: true, libelle: b.textContent.trim() };
  });
  console.log('  clic écran de fin :', JSON.stringify(clic));
  await fin.waitForTimeout(2500);
  await fin.screenshot({ path: `${OUT}/ecran-de-fin-${view}-${SUFFIXE}.png` });
  console.log(
    `ecran-de-fin/${view}`.padEnd(22),
    JSON.stringify((await fin.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 70)),
  );
  await fin.close();
  await ctx.close();
}

await b.close();
console.log('captures « ' + SUFFIXE + ' » écrites dans', OUT);
