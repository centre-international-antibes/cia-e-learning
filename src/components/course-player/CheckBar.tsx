import * as React from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Pressable } from '@/components/ui/pressable';
import { Spark } from '@/components/spark/Spark';
import { cn } from '@/lib/utils';
import { fade, spring } from '@/lib/motion';
import type { StepAnswerResult } from './step-controller';

/**
 * CheckBar — la barre qui porte toute la boucle de la leçon.
 *
 * Deux garanties tiennent la mise en page :
 *   - le **bouton** est ancré en bas et ne bouge jamais, quel que soit l'état ;
 *   - le **panneau** de résultat grandit vers le haut, donc une solution longue
 *     s'affiche en entier (jusqu'à trois lignes) sans déplacer le bouton.
 *
 * La hauteur réelle est remontée au player (`onHeightChange`) : c'est elle qui
 * détermine l'espace réservé sous le contenu, safe-area comprise.
 */

/** Six formulations, tirées au sort : la même phrase à chaque bonne réponse lasse. */
const PRAISE_KEYS = [
  'player.praise.excellent',
  'player.praise.perfect',
  'player.praise.wellDone',
  'player.praise.spotOn',
  'player.praise.bravo',
  'player.praise.keepGoing',
] as const;

export type CheckBarMode = 'check' | 'continue';

export interface CheckBarProps {
  /** `check` : étape notée (Vérifier puis Continuer). `continue` : étape libre. */
  mode: CheckBarMode;
  /** Une réponse complète est saisie. */
  ready: boolean;
  /** Résultat affiché, `null` tant que l'apprenant n'a pas validé. */
  result: StepAnswerResult | null;
  onCheck: () => void;
  onContinue: () => void;
  /** Explication facultative affichée dans le panneau. */
  explanation?: string;
  /** Hauteur réelle de la barre, mesurée à chaque changement. */
  onHeightChange?: (height: number) => void;
}

export function CheckBar({
  mode,
  ready,
  result,
  onCheck,
  onContinue,
  explanation,
  onHeightChange,
}: CheckBarProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotionConfig() ?? false;
  const barRef = React.useRef<HTMLDivElement>(null);

  // Une formulation par étape validée, pas une par rendu.
  const praiseKey = React.useMemo(
    () => PRAISE_KEYS[Math.floor(Math.random() * PRAISE_KEYS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result],
  );

  // Le focus suit l'action : après validation, « Continuer » est sous le doigt
  // et sous la touche Entrée. On attend la frame suivante, le temps que le
  // panneau ait remplacé le bouton « Vérifier ».
  React.useEffect(() => {
    if (!result) return;
    const frame = requestAnimationFrame(() => {
      barRef.current?.querySelector<HTMLButtonElement>('[data-continue]')?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [result]);

  // La hauteur varie avec le contenu du panneau : on la mesure plutôt que de
  // la deviner, pour que l'espace réservé sous le contenu colle au pixel.
  React.useLayoutEffect(() => {
    const node = barRef.current;
    if (!node || !onHeightChange) return;
    onHeightChange(node.offsetHeight);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => onHeightChange(node.offsetHeight));
    // `border-box` : la safe-area vit dans le padding de la barre, et un
    // changement de padding seul ne bouge pas la boîte de contenu.
    observer.observe(node, { box: 'border-box' });
    return () => observer.disconnect();
  }, [onHeightChange]);

  const isCorrect = result?.correct === true;
  const panel = result !== null;

  return (
    <div
      ref={barRef}
      className={cn(
        'absolute inset-x-0 bottom-0 z-30 border-t-2 transition-colors',
        !panel && 'bg-card border-ink-100',
        panel && isCorrect && 'bg-success-50 border-success-500',
        panel && !isCorrect && 'bg-cia-red-50 border-cia-red-500',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 pt-3">
        {/* Panneau : il pousse vers le haut, jamais vers le bas. */}
        <AnimatePresence initial={false}>
          {panel && (
            <motion.div
              key={isCorrect ? 'correct' : 'incorrect'}
              initial={reduced ? { opacity: 0 } : { y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduced ? { duration: fade.fast } : spring.gentle}
              className="flex items-start gap-3"
              role="status"
              aria-live="polite"
            >
              <Spark
                mood={isCorrect ? 'celebrating' : 'encouraging'}
                size={56}
                halo={isCorrect}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1 pt-1">
                <p
                  className={cn(
                    'font-display text-base font-bold',
                    isCorrect ? 'text-success-700' : 'text-cia-red-600',
                  )}
                >
                  {isCorrect ? t(praiseKey) : t('player.notQuite')}
                </p>
                {!isCorrect && result?.solution && (
                  <p className="line-clamp-3 text-sm text-cia-red-600">
                    {t('player.correctAnswerIs', { solution: result.solution })}
                  </p>
                )}
                {isCorrect && explanation && (
                  <p className="line-clamp-3 text-sm text-success-700/80">{explanation}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rangée d'action — hauteur constante, ancrée au bas de la barre. */}
        <div className="flex h-14 shrink-0 items-center gap-3 pb-3 sm:gap-4">
          {!panel && (
            <p className="hidden min-w-0 flex-1 text-sm text-muted-foreground sm:block">
              {mode === 'check' ? t('player.checkHint') : ''}
            </p>
          )}

          {panel ? (
            <Pressable
              data-continue
              tone={isCorrect ? 'success' : 'danger'}
              depth="lg"
              scope="player"
              onClick={onContinue}
              className="ml-auto h-full min-w-[8rem] px-8 text-base"
            >
              {t('player.continue')}
            </Pressable>
          ) : (
            <Pressable
              tone="primary"
              depth="lg"
              scope="player"
              disabled={!ready}
              onClick={mode === 'check' ? onCheck : onContinue}
              className="h-full w-full px-8 text-base sm:ml-auto sm:w-auto sm:min-w-[10rem]"
            >
              {mode === 'check' ? t('player.check') : t('player.continue')}
            </Pressable>
          )}
        </div>
      </div>
    </div>
  );
}
