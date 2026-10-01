/**
 * Séquencement d'une leçon — logique pure, testable sans React.
 *
 * Trois choses y vivent ensemble parce qu'elles se répondent :
 *   - l'ordre de passage des étapes, rejeu des erreurs compris ;
 *   - le score envoyé au serveur (bonnes réponses, meilleure série) ;
 *   - la progression affichée, qui ne doit jamais reculer.
 *
 * Règle du rejeu : une étape notée ratée revient **une seule fois** en fin de
 * leçon, derrière un intertitre. Ce second passage ne compte ni dans le score,
 * ni dans l'XP, ni dans le combo — il sert à revoir, pas à rattraper.
 */

export type PlayerPhase = 'main' | 'interstitial' | 'replay' | 'done';

export interface PlayerState {
  phase: PlayerPhase;
  /** Index dans `content.steps` pendant la séquence principale. */
  mainIndex: number;
  /** Index dans `replayQueue` pendant le rejeu. */
  replayIndex: number;
  /** Étapes notées ratées, à rejouer une fois. */
  replayQueue: number[];
  correctCount: number;
  /** Questions notées répondues — première tentative uniquement. */
  answeredCount: number;
  combo: number;
  bestCombo: number;
  /** Étapes franchies, rejeu compris : la progression s'appuie dessus. */
  playedCount: number;
  /** Progression affichée, monotone croissante. */
  progressPct: number;
}

export interface PlayerConfig {
  /** Nombre total d'étapes de la leçon. */
  totalSteps: number;
}

export type PlayerAction =
  | {
      type: 'answer';
      /** L'étape est-elle notée ? */
      graded: boolean;
      correct: boolean;
      /** Une étape non rejouable (quiz final) ne rejoint jamais la file. */
      replayable: boolean;
    }
  | { type: 'advance' }
  | { type: 'restore'; state: PlayerState };

export function initialPlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    phase: 'main',
    mainIndex: 0,
    replayIndex: 0,
    replayQueue: [],
    correctCount: 0,
    answeredCount: 0,
    combo: 0,
    bestCombo: 0,
    playedCount: 0,
    progressPct: 0,
    ...overrides,
  };
}

/** Index de l'étape à afficher, `null` sur l'intertitre et à la fin. */
export function currentStepIndex(state: PlayerState): number | null {
  if (state.phase === 'main') return state.mainIndex;
  if (state.phase === 'replay') return state.replayQueue[state.replayIndex] ?? null;
  return null;
}

/** Sommes-nous dans le second passage ? (aucun impact sur le score) */
export const isReplaying = (state: PlayerState): boolean => state.phase === 'replay';

function computeProgress(state: PlayerState, config: PlayerConfig): number {
  // Le dénominateur grandit quand une erreur ajoute une étape à rejouer ;
  // la valeur affichée ne redescend jamais pour autant.
  const planned =
    config.totalSteps + state.replayQueue.length + (state.replayQueue.length > 0 ? 1 : 0);
  const raw = planned > 0 ? Math.round((state.playedCount / planned) * 100) : 0;
  return Math.max(state.progressPct, Math.min(100, raw));
}

export function playerReducer(
  state: PlayerState,
  action: PlayerAction,
  config: PlayerConfig,
): PlayerState {
  switch (action.type) {
    case 'restore':
      return action.state;

    case 'answer': {
      // Le rejeu ne touche à rien : ni score, ni combo, ni file.
      if (isReplaying(state) || !action.graded) return state;

      const stepIndex = state.mainIndex;
      if (action.correct) {
        const combo = state.combo + 1;
        return {
          ...state,
          correctCount: state.correctCount + 1,
          answeredCount: state.answeredCount + 1,
          combo,
          bestCombo: Math.max(state.bestCombo, combo),
        };
      }

      const alreadyQueued = state.replayQueue.includes(stepIndex);
      return {
        ...state,
        answeredCount: state.answeredCount + 1,
        combo: 0,
        replayQueue:
          action.replayable && !alreadyQueued
            ? [...state.replayQueue, stepIndex]
            : state.replayQueue,
      };
    }

    case 'advance': {
      const played = { ...state, playedCount: state.playedCount + 1 };

      if (state.phase === 'main') {
        if (state.mainIndex + 1 < config.totalSteps) {
          const next = { ...played, mainIndex: state.mainIndex + 1 };
          return { ...next, progressPct: computeProgress(next, config) };
        }
        if (state.replayQueue.length > 0) {
          const next: PlayerState = { ...played, phase: 'interstitial' };
          return { ...next, progressPct: computeProgress(next, config) };
        }
        const done: PlayerState = { ...played, phase: 'done', progressPct: 100 };
        return done;
      }

      if (state.phase === 'interstitial') {
        const next: PlayerState = { ...played, phase: 'replay', replayIndex: 0 };
        return { ...next, progressPct: computeProgress(next, config) };
      }

      if (state.phase === 'replay') {
        if (state.replayIndex + 1 < state.replayQueue.length) {
          const next = { ...played, replayIndex: state.replayIndex + 1 };
          return { ...next, progressPct: computeProgress(next, config) };
        }
        return { ...played, phase: 'done', progressPct: 100 };
      }

      return state;
    }

    default:
      return state;
  }
}

/** Résultats envoyés au serveur en fin de leçon. */
export interface LessonOutcome {
  score: number;
  correct: number;
  questionCount: number;
  bestCombo: number;
}

export function lessonOutcome(state: PlayerState, questionCount: number): LessonOutcome {
  const answered = state.answeredCount;
  return {
    score: answered > 0 ? Math.round((state.correctCount / answered) * 100) : 100,
    correct: state.correctCount,
    questionCount: Math.max(questionCount, answered),
    bestCombo: state.bestCombo,
  };
}
