import { useReducedMotionConfig } from 'framer-motion';

/**
 * Préférence « animations réduites », telle qu'elle s'applique réellement.
 *
 * Lit le réglage du `<MotionConfig>` englobant (cf. `App.tsx`, qui le passe
 * en `"user"`) et non uniquement la préférence système : un
 * `MotionConfig reducedMotion="always"` — le bouton de simulation du Motion
 * Lab, par exemple — est donc pris en compte ici aussi.
 *
 * Sert aux animations maison (CSS, canvas, Lottie) qui ne passent pas par
 * framer-motion ; celles qui y passent sont déjà neutralisées.
 *
 * @returns `true` si les animations doivent être réduites.
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotionConfig() ?? false;
}
