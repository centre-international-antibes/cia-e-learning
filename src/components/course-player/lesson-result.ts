/**
 * Contrat de fin de leçon — ce que le player remonte, ce que la page renvoie.
 *
 * Le player ne sait rien du serveur : il livre des chiffres (`LessonResult`) et
 * reçoit en retour ce qui a réellement été accordé (`LessonSubmitResult`). Le
 * barème reste l'affaire de `complete_lesson` ; l'écran de fin n'affiche que ce
 * que la réponse contient.
 */

/** Résultats remontés en fin de leçon. Aucun montant d'XP : le barème est
 *  appliqué par le serveur à partir de ces chiffres (cf. M2). */
export interface LessonResult {
  score: number;
  correct: number;
  questionCount: number;
  bestCombo: number;
}

/**
 * Sort de la soumission.
 *
 *   - `rewarded`   : XP accordée par le serveur ;
 *   - `too_fast`   : leçon bouclée trop vite, aucune XP (garde anti-rush) ;
 *   - `replay_cap` : plafond de rejeu du jour atteint sur cette leçon ;
 *   - `offline`    : le serveur n'a pas répondu — montant local, à synchroniser ;
 *   - `anonymous`  : pas de compte où créditer, barème appliqué localement.
 */
export type LessonSubmitStatus = 'rewarded' | 'too_fast' | 'replay_cap' | 'offline' | 'anonymous';

/** Détail du barème, tel que le serveur le renvoie. */
export interface LessonXpParts {
  base: number;
  correct: number;
  combo: number;
  perfect: number;
}

export interface LessonSubmitResult {
  status: LessonSubmitStatus;
  /** Montant réellement accordé — 0 pour `too_fast` et `replay_cap`. */
  xpAwarded: number;
  breakdown?: LessonXpParts;
  /** Total d'XP du compte avant / après. Alimente la pastille « XP totale ». */
  xpBefore?: number;
  xpAfter?: number;
}

/** Les statuts qui ne créditent rien : la tuile XP affiche 0, en ton neutre. */
export const NO_XP_STATUSES: readonly LessonSubmitStatus[] = ['too_fast', 'replay_cap'];
