import * as React from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';

import { Pressable } from '@/components/ui/pressable';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';

/**
 * Option de réponse — même geste et même langage visuel pour le QCM, la
 * compréhension orale et le quiz final.
 *
 * En saisie : un tap sélectionne, un autre tap change d'avis. Rien n'est
 * validé. Après validation : la bonne réponse éclot, le mauvais choix tremble,
 * le reste s'efface.
 */

export interface StepOptionProps {
  label: string;
  /** Pastille de gauche : lettre (A, B…) ou numéro de raccourci clavier. */
  marker: string;
  selected: boolean;
  revealed: boolean;
  isCorrect: boolean;
  onSelect: () => void;
}

export function StepOption({
  label,
  marker,
  selected,
  revealed,
  isCorrect,
  onSelect,
}: StepOptionProps) {
  const reduced = useReducedMotionConfig() ?? false;
  const wrongPick = revealed && selected && !isCorrect;
  const showCorrect = revealed && isCorrect;
  const dimmed = revealed && !isCorrect && !selected;

  return (
    <motion.div
      animate={
        reduced
          ? undefined
          : showCorrect
            ? { scale: [1, 1.04, 1] }
            : wrongPick
              ? { x: [0, -6, 6, -5, 5, 0] }
              : { scale: 1, x: 0 }
      }
      transition={showCorrect ? spring.bouncy : { duration: 0.3, ease: 'easeOut' }}
      className={cn('w-full', dimmed && 'opacity-50')}
    >
      <Pressable
        tone={showCorrect ? 'success' : wrongPick ? 'danger' : 'neutral'}
        depth="md"
        pressed={selected && !revealed}
        scope="player"
        silent
        disabled={revealed}
        onClick={onSelect}
        className="min-h-touch w-full justify-start gap-3 rounded-2xl px-4 py-3 text-left font-medium disabled:opacity-100"
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold tabular-nums',
            showCorrect && 'border-white/40',
            wrongPick && 'border-white/40',
          )}
          aria-hidden
        >
          {marker}
        </span>
        <span className="min-w-0 flex-1 whitespace-normal">{label}</span>
        {showCorrect && <CheckMark reduced={reduced} />}
      </Pressable>
    </motion.div>
  );
}

/** Coche dessinée au trait, plutôt qu'une icône qui apparaît d'un coup. */
function CheckMark({ reduced }: { reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="ml-auto h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <motion.path
        d="M4 12.5 L9.5 18 L20 6.5"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.32, ease: 'easeOut' }}
      />
    </svg>
  );
}
