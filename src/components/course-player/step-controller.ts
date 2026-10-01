import * as React from 'react';

/**
 * Contrat entre le player et ses étapes.
 *
 * Avant M3, chaque étape validait elle-même au premier tap et rendait son
 * propre bouton : le geste changeait d'un type d'étape à l'autre et le bouton
 * se déplaçait selon la hauteur du contenu. Désormais l'étape ne fait que
 * **déclarer sa réponse** ; c'est la CheckBar, fixe en bas, qui valide et fait
 * avancer.
 */

export interface StepAnswerResult {
  correct: boolean;
  /** Libellé de la bonne réponse, affiché quand l'apprenant s'est trompé. */
  solution?: string;
}

export interface StepAnswer {
  /** Une réponse complète est saisie : « Vérifier » devient actif. */
  ready: boolean;
  /** Évalue la réponse au moment où l'apprenant valide. */
  evaluate: () => StepAnswerResult;
}

export type StepPhase = 'answering' | 'revealed';

export interface StepController {
  phase: StepPhase;
  /** Résultat de la validation, `null` tant que l'apprenant n'a pas validé. */
  result: StepAnswerResult | null;
  /** L'étape déclare (ou retire) sa réponse courante. */
  setAnswer: (answer: StepAnswer | null) => void;
  /**
   * Une étape à questions internes (quiz final) prend la main sur
   * « Continuer » : tant qu'un handler est posé, le player le laisse décider.
   */
  setContinueHandler: (handler: (() => void) | null) => void;
  /** Repasse en saisie — utilisé par le quiz final entre deux questions. */
  resetPhase: () => void;
  /**
   * Force le mode de la barre. Le player le déduit du type d'étape ; le quiz
   * final le bascule en « Continuer » sur son écran de résultat.
   */
  setMode: (mode: 'check' | 'continue' | null) => void;
  /** Une étape à options s'abonne aux touches 1–4. */
  setOptionShortcut: (handler: ((index: number) => void) | null) => void;
}

/**
 * Le contexte est exporté tel quel (et non via un composant `Provider`
 * maison) : ce fichier n'exporte alors que des hooks et des types, ce qui
 * garde le Fast Refresh fonctionnel.
 */
export const StepControllerContext = React.createContext<StepController | null>(null);

export function useStepController(): StepController {
  const ctx = React.useContext(StepControllerContext);
  if (!ctx) {
    throw new Error('useStepController doit être utilisé dans une étape du CoursePlayer');
  }
  return ctx;
}

/**
 * Déclare la réponse courante de l'étape auprès du player.
 * `evaluate` est gardée dans une ref : la redéclarer à chaque frappe ne doit
 * pas relancer l'effet.
 */
export function useDeclareAnswer(ready: boolean, evaluate: () => StepAnswerResult) {
  const { setAnswer } = useStepController();
  const evaluateRef = React.useRef(evaluate);
  evaluateRef.current = evaluate;

  React.useEffect(() => {
    setAnswer({ ready, evaluate: () => evaluateRef.current() });
    return () => setAnswer(null);
  }, [ready, setAnswer]);
}

/** Abonne une étape aux raccourcis clavier `1`–`4` de sélection d'option. */
export function useOptionShortcut(handler: (index: number) => void) {
  const { setOptionShortcut } = useStepController();
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    setOptionShortcut((index) => handlerRef.current(index));
    return () => setOptionShortcut(null);
  }, [setOptionShortcut]);
}
