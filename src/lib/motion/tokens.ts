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

export const spring = {
  /** press, toggle, sélection — réponse immédiate, pas de rebond visible */
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.8 },
  /** pop, badge, check, combo — rebond assumé */
  bouncy: { type: 'spring', stiffness: 420, damping: 16, mass: 0.9 },
  /** panneaux, sheets, layout — glisse posée */
  gentle: { type: 'spring', stiffness: 210, damping: 26, mass: 1 },
  /** macro (level-up, chemin) — mouvement ample et lisible */
  slow: { type: 'spring', stiffness: 120, damping: 22, mass: 1.1 },
} as const;

/** Durées d'opacité / couleur, en secondes. Jamais pour une transform. */
export const fade = { fast: 0.12, base: 0.2, slow: 0.35 } as const;

/** Décalages d'entrée en cascade, en secondes. */
export const stagger = { tight: 0.04, base: 0.08, loose: 0.12 } as const;

export type SpringToken = keyof typeof spring;
export type FadeToken = keyof typeof fade;
export type StaggerToken = keyof typeof stagger;
