import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { describe, expect, it } from 'vitest';

import tailwindConfig from '../../tailwind.config';

/**
 * Garde-fou : la palette doit vivre dans `:root`, sans condition.
 *
 * La refonte a un jour enfermé **toute** la palette — CIA, neutres, sémantique,
 * gamification, CECR et les mappings shadcn — dans `:root[data-redesign]`.
 * Résultat : sans le drapeau, `--background`, `--primary` et `--card` n'étaient
 * définis nulle part, et l'application entière perdait ses couleurs. Le build
 * passait, les tests passaient, le typecheck passait.
 *
 * On lit donc le CSS **compilé**, pas la source : c'est le seul état qui dise
 * ce que le navigateur recevra, après Tailwind et ses couches.
 */

/** Ce qui suffit à peindre un écran : un fond, une couleur d'action, une carte. */
const ESSENTIELS = ['--background', '--primary', '--card'] as const;

async function compiledCss(): Promise<string> {
  const source = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
  const result = await postcss([
    // La vraie configuration du projet — `@apply bg-background` dans la
    // feuille en dépend. Seul `content` est neutralisé : on ne veut que les
    // couches `base`, pas les utilitaires tirés du balayage du dépôt, et le
    // test reste rapide.
    tailwindcss({ ...tailwindConfig, content: [{ raw: '', extension: 'html' }] }),
    autoprefixer(),
  ]).process(source, { from: resolve(__dirname, '../index.css') });
  return result.css;
}

/** Déclarations portées par un `:root` nu — ni attribut, ni classe. */
function rootNuDeclarations(css: string): Map<string, string> {
  const out = new Map<string, string>();
  postcss.parse(css).walkRules((rule) => {
    const nu = rule.selectors.some((s) => s.trim() === ':root');
    if (!nu) return;
    rule.walkDecls((decl) => {
      out.set(decl.prop, decl.value);
    });
  });
  return out;
}

describe('palette dans :root', () => {
  it('définit le fond, la couleur d’action et la carte sans drapeau', async () => {
    const declarations = rootNuDeclarations(await compiledCss());
    for (const token of ESSENTIELS) {
      expect(declarations.has(token), `${token} manque dans un \`:root\` nu`).toBe(true);
      expect(declarations.get(token)).not.toBe('');
    }
  });

  it('ne laisse sous le drapeau que ce qui diffère vraiment', async () => {
    const css = await compiledCss();
    const sousDrapeau = new Set<string>();
    postcss.parse(css).walkRules((rule) => {
      if (!rule.selectors.some((s) => s.includes('[data-redesign]'))) return;
      rule.walkDecls((decl) => {
        sousDrapeau.add(decl.prop);
      });
    });
    // Les familles de polices sont la seule chose que le drapeau bascule.
    // Tout le reste qui atterrirait ici disparaîtrait sans le drapeau.
    expect([...sousDrapeau].sort()).toEqual(['--font-display', '--font-text']);
  });

  it('résout la chaîne : --background pointe sur un token défini lui aussi', async () => {
    const declarations = rootNuDeclarations(await compiledCss());
    for (const token of ESSENTIELS) {
      const value = declarations.get(token) ?? '';
      const reference = /^var\((--[\w-]+)\)$/.exec(value.trim());
      if (!reference) continue; // valeur littérale : rien à résoudre
      expect(
        declarations.has(reference[1]),
        `${token} renvoie à ${reference[1]}, qui n’est pas défini dans \`:root\``,
      ).toBe(true);
    }
  });
});
