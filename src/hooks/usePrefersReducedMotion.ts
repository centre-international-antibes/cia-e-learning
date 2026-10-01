import { useReducedMotion } from 'framer-motion';

/**
 * Préférence « animations réduites » du système.
 *
 * Ré-export de `useReducedMotion` de framer-motion : l'app est enveloppée
 * dans `<MotionConfig reducedMotion="user">` (cf. `App.tsx`), qui neutralise
 * déjà les transforms. Ce hook ne sert plus qu'aux animations maison (CSS,
 * canvas, Lottie) qui ne passent pas par framer-motion.
 *
 * @returns `true` si l'utilisateur demande des animations réduites.
 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}
