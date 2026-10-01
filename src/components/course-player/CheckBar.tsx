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
 * Elle ne bouge jamais : même position, même hauteur, que l'apprenant soit en
 * train de répondre, qu'il ait juste ou faux. Seul son fond change. C'est ce
 * qui supprime le saut de layout et le scroll qu'imposait l'ancien bouton
 * inséré sous le contenu.
 */

/**
 * Hauteur réservée dans le flux du player pour que rien ne passe dessous.
 * Elle couvre le cas le plus haut : panneau d'erreur sur deux lignes à 375 px.
 */
export const CHECK_BAR_HEIGHT = 112;

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
}

export function CheckBar({ mode, ready, result, onCheck, onContinue, explanation }: CheckBarProps) {
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
      {/* Hauteur figée : le panneau de résultat est plus haut que la ligne de
          saisie, et sans cela la barre « grandissait » de 12 px au moment de
          la validation — exactement le saut qu'elle est censée supprimer. */}
      <div
        className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:gap-4"
        style={{ minHeight: CHECK_BAR_HEIGHT - 16 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {panel ? (
            <motion.div
              key={isCorrect ? 'correct' : 'incorrect'}
              initial={reduced ? { opacity: 0 } : { y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={reduced ? { duration: fade.fast } : spring.gentle}
              className="flex min-w-0 flex-1 items-center gap-3"
              role="status"
              aria-live="polite"
            >
              <Spark
                mood={isCorrect ? 'celebrating' : 'encouraging'}
                size={56}
                halo={isCorrect}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'font-display text-base font-bold',
                    isCorrect ? 'text-success-700' : 'text-cia-red-600',
                  )}
                >
                  {isCorrect ? t(praiseKey) : t('player.notQuite')}
                </p>
                {!isCorrect && result?.solution && (
                  <p className="truncate text-sm text-cia-red-600">
                    {t('player.correctAnswerIs', { solution: result.solution })}
                  </p>
                )}
                {isCorrect && explanation && (
                  <p className="truncate text-sm text-success-700/80">{explanation}</p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="idle"
              initial={false}
              animate={{ opacity: 1 }}
              className="hidden min-w-0 flex-1 text-sm text-muted-foreground sm:block"
            >
              {mode === 'check' ? t('player.checkHint') : ''}
            </motion.p>
          )}
        </AnimatePresence>

        {panel ? (
          <Pressable
            data-continue
            tone={isCorrect ? 'success' : 'danger'}
            depth="lg"
            scope="player"
            onClick={onContinue}
            className="h-14 min-w-[8rem] px-8 text-base"
          >
            {t('player.continue')}
          </Pressable>
        ) : mode === 'check' ? (
          <Pressable
            tone="primary"
            depth="lg"
            scope="player"
            disabled={!ready}
            onClick={onCheck}
            className="h-14 w-full px-8 text-base sm:w-auto sm:min-w-[10rem]"
          >
            {t('player.check')}
          </Pressable>
        ) : (
          <Pressable
            tone="primary"
            depth="lg"
            scope="player"
            disabled={!ready}
            onClick={onContinue}
            className="h-14 w-full px-8 text-base sm:w-auto sm:min-w-[10rem]"
          >
            {t('player.continue')}
          </Pressable>
        )}
      </div>
    </div>
  );
}
