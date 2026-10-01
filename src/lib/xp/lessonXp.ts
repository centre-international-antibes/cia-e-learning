/**
 * Barème XP d'une leçon — copie client du calcul fait par `complete_lesson`.
 *
 * Le serveur reste la seule autorité : ce module ne sert qu'à deux choses,
 *   - l'aperçu « +X XP » affiché pendant la leçon,
 *   - le mode anonyme, qui n'a pas de compte où créditer l'XP.
 *
 * Toute modification ici doit être répercutée dans la migration SQL
 * (`complete_lesson`), et inversement. Les deux sont couverts par les mêmes
 * cas de test, documentés dans la PR.
 */

/** Complétion d'une leçon, quel que soit le score. */
export const XP_BASE = 50;
/** Par bonne réponse. */
export const XP_PER_CORRECT = 5;
/** Meilleure série d'affilée : paliers non cumulatifs. */
export const XP_COMBO_SMALL = 5;
export const XP_COMBO_LARGE = 10;
export const COMBO_SMALL_THRESHOLD = 5;
export const COMBO_LARGE_THRESHOLD = 10;
/** Sans faute sur une leçon qui comporte au moins une question. */
export const XP_PERFECT = 20;

export interface LessonXpInput {
  /** Nombre de bonnes réponses. */
  correct: number;
  /** Nombre de questions notées de la leçon. */
  questionCount: number;
  /** Plus longue série de bonnes réponses consécutives. */
  bestCombo: number;
}

export interface LessonXpBreakdown {
  base: number;
  correct: number;
  combo: number;
  perfect: number;
  total: number;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/** Palier de combo. Non cumulatif : 12 de série donne 10, pas 15. */
export function comboBonus(bestCombo: number): number {
  if (bestCombo >= COMBO_LARGE_THRESHOLD) return XP_COMBO_LARGE;
  if (bestCombo >= COMBO_SMALL_THRESHOLD) return XP_COMBO_SMALL;
  return 0;
}

export function computeLessonXp({
  correct,
  questionCount,
  bestCombo,
}: LessonXpInput): LessonXpBreakdown {
  const questions = Math.max(0, Math.floor(questionCount) || 0);
  const safeCorrect = clampInt(correct, 0, questions);
  const safeCombo = clampInt(bestCombo, 0, safeCorrect);

  const base = XP_BASE;
  const correctXp = safeCorrect * XP_PER_CORRECT;
  const combo = comboBonus(safeCombo);
  const perfect = questions > 0 && safeCorrect === questions ? XP_PERFECT : 0;

  return {
    base,
    correct: correctXp,
    combo,
    perfect,
    total: base + correctXp + combo + perfect,
  };
}
