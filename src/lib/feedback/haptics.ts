/**
 * Retour haptique — seul endroit de l'app qui appelle `navigator.vibrate`.
 *
 * No-op quand l'API n'existe pas (iOS Safari, desktop) ou quand
 * l'utilisateur demande des animations réduites : une vibration est une
 * animation comme une autre.
 *
 * Limite assumée : ce module n'est pas un hook, il lit donc directement
 * `matchMedia` — c'est-à-dire la préférence du système, pas le réglage d'un
 * `<MotionConfig reducedMotion="always">`. Simuler le reduced-motion depuis
 * l'app (Motion Lab) coupe les animations mais pas les vibrations ; seul le
 * réglage OS les coupe. Pour les suivre aussi, il faudrait passer le réglage
 * à `vibrate()` depuis un composant.
 */

export type HapticPattern = 'tap' | 'correct' | 'wrong' | 'combo' | 'celebrate';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 8,
  correct: 12,
  wrong: [20, 40, 20],
  combo: [10, 30, 10, 30, 20],
  celebrate: [50, 30, 50, 30, 100],
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Le support haptique est-il utilisable ici et maintenant ? */
export function canVibrate(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false;
  return !prefersReducedMotion();
}

/** Joue un motif haptique. Sans support : ne fait rien. */
export function vibrate(pattern: HapticPattern): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* certains navigateurs lèvent hors geste utilisateur */
  }
}
