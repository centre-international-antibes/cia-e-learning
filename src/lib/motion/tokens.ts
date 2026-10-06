/**
 * Tokens motion — source de vérité du mouvement de l'app.
 *
 * Règle d'or :
 *   - transform (x / y / scale / rotate) → TOUJOURS un spring
 *   - `duration` → réservé à l'opacité et aux couleurs
 *
 * Un `linear` reste légitime pour une boucle décorative infinie (rotation
 * continue, balayage de lueur) : une physique de ressort y produirait des
 * à-coups à chaque répétition.
 */

/**
 * Les quatre presets historiques, désormais dérivés de `presets.ts`.
 *
 * Les valeurs y sont exprimées en `visualDuration` / `bounce` — ce qu'on voit
 * plutôt que la physique — et reproduisent **exactement** le comportement
 * mesuré des anciens ressorts : arrivée à 170 / 105 / 355 / 575 ms, dépassement
 * à 0,9 / 24,2 / 0,1 / 0 %. L'app ne bouge pas, le vocabulaire change.
 *
 * `bouncy` est le seul hors norme (dépassement de 24 %, là où les standards
 * tiennent le rebond entre 10 et 30 %) : il est marqué comme tel dans MOTION.md
 * et réglable dans le Motion Lab.
 */
import { PRESETS, toSpring } from './presets';

export const spring = {
  /** press, toggle, sélection — réponse immédiate, pas de rebond visible */
  snappy: toSpring(PRESETS.snappy),
  /** pop, badge, check, combo — rebond assumé */
  bouncy: toSpring(PRESETS.bouncy),
  /** panneaux, sheets, layout — glisse posée */
  gentle: toSpring(PRESETS.gentle),
  /** macro (level-up, chemin) — mouvement ample et lisible */
  slow: toSpring(PRESETS.slow),
} as const;

/** Durées d'opacité / couleur, en secondes. Jamais pour une transform. */
export const fade = { fast: 0.12, base: 0.2, slow: 0.35 } as const;

/** Décalages d'entrée en cascade, en secondes. */
export const stagger = { tight: 0.03, base: 0.05, loose: 0.07 } as const;

export type SpringToken = keyof typeof spring;
export type FadeToken = keyof typeof fade;
export type StaggerToken = keyof typeof stagger;
