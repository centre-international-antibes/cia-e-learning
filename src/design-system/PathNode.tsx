import * as React from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';

import { getSpring } from '@/lib/motion/tuning';
import { cn } from '@/lib/utils';
import { ModuleObject, type ModuleObjectName } from './objects/ModuleObject';

/**
 * Nœud du parcours.
 *
 * Géométrie reprise des mesures de `design/refs/ANALYSE.md` : **67 pt de
 * diamètre, tranche de 6 pt**. C'est le même langage de profondeur que
 * `Pressable` — translation et tranche qui s'écrase, jamais de scale — étendu
 * au parcours, qui en était jusqu'ici dépourvu.
 *
 * Trois états, trois lectures immédiates :
 *   - **terminé** : couleur pleine, coche dessinée, trois étoiles ;
 *   - **courant** : plus grand, anneau de progression, bulle « Commencer » ;
 *   - **à venir** : gris, cadenas.
 *
 * Aucune icône tierce : cadenas, coche, coffre et trophée sont dessinés dans le
 * même tracé que les objets du quotidien.
 */

export type NodeState = 'locked' | 'available' | 'current' | 'completed';
export type NodeKind = 'module' | 'chest' | 'trophy';

export const NODE_SIZE = 67;
export const NODE_SIZE_CURRENT = 84;
/** Premier contact : le nœud d'entrée est le seul objet de l'écran qui compte. */
export const NODE_SIZE_FIRST = 110;
const EDGE = 6;
/** « Tranche de 4 à 8 pt selon la taille » (DESIGN.md § 4) — 8 pour le gros nœud. */
const EDGE_FIRST = 8;
const PRESSED_EDGE = 2;
const RING = 5;

export interface PathNodeProps {
  kind?: NodeKind;
  state: NodeState;
  /** Teinte du niveau CECR, en `hsl(...)`. Ignorée si verrouillé. */
  tint: string;
  object?: ModuleObjectName;
  /** Numéro affiché sous le nœud. */
  label?: string;
  /** Leçons réussies sur le total — anneau de progression et étoiles. */
  progress?: { done: number; total: number };
  /** Libellé de la bulle flottante du nœud courant. */
  callToAction?: string;
  /** Le nœud vient d'être validé : il encaisse le tampon. */
  stamped?: boolean;
  /** Le nœud vient de se déverrouiller. */
  unlocking?: boolean;
  /**
   * `first` : nœud d'entrée du premier contact — 110 pt, tranche de 8.
   * Il n'y en a qu'un par parcours, et seulement tant que rien n'est commencé.
   */
  emphasis?: 'normal' | 'first';
  /** Nœud en retrait : il existe, il se tape, mais il n'appelle pas le regard. */
  dimmed?: boolean;
  onClick?: () => void;
  ariaLabel: string;
}

export const PathNode = React.forwardRef<HTMLButtonElement, PathNodeProps>(function PathNode(
  {
    kind = 'module',
    state,
    tint,
    object,
    label,
    progress,
    callToAction,
    stamped,
    unlocking,
    emphasis = 'normal',
    dimmed,
    onClick,
    ariaLabel,
  },
  ref,
) {
  const reduced = useReducedMotionConfig() ?? false;
  const [pressed, setPressed] = React.useState(false);
  const locked = state === 'locked';
  const done = state === 'completed';
  const current = state === 'current';

  const first = emphasis === 'first';
  const size = first ? NODE_SIZE_FIRST : current ? NODE_SIZE_CURRENT : NODE_SIZE;
  const restEdge = first ? EDGE_FIRST : EDGE;
  const face = locked
    ? 'hsl(var(--ink-200))'
    : state === 'available'
      ? `color-mix(in srgb, ${tint} 78%, white)`
      : tint;
  const edgeColor = locked ? 'hsl(var(--ink-300))' : `color-mix(in srgb, ${tint} 70%, black)`;
  const depth = pressed && !locked ? PRESSED_EDGE : restEdge;

  // Anneau de progression du nœud courant : un cercle tracé, pas une barre.
  const ratio = progress && progress.total > 0 ? progress.done / progress.total : 0;
  const ringR = (size + RING * 2 + 6) / 2;
  const circumference = 2 * Math.PI * ringR;

  const picto: ModuleObjectName | undefined =
    kind === 'chest' ? 'chest' : kind === 'trophy' ? 'trophy' : locked ? 'lock' : object;

  return (
    <div
      className="relative flex flex-col items-center gap-1.5"
      style={dimmed ? { opacity: 0.6 } : undefined}
    >
      {current && callToAction && (
        <motion.span
          className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-xl border-2 border-ink-100 bg-card px-3 py-1 font-display text-xs font-extrabold text-cia-blue-700 shadow-elev-lg"
          initial={reduced ? false : { y: 2, opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { y: [-2, -6, -2], opacity: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.2 } }
          }
        >
          {callToAction}
          <span
            className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b-2 border-r-2 border-ink-100 bg-card"
            aria-hidden
          />
        </motion.span>
      )}

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Pas d'anneau au premier contact : à 0 %, un cercle vide autour du
            nœud d'entrée ne dit rien et brouille le seul objet de l'écran. */}
        {current && !first && progress && progress.total > 0 && (
          <svg
            className="pointer-events-none absolute"
            width={ringR * 2 + RING}
            height={ringR * 2 + RING}
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)' }}
            aria-hidden
          >
            <circle
              cx={ringR + RING / 2}
              cy={ringR + RING / 2}
              r={ringR}
              fill="none"
              stroke="hsl(var(--ink-100))"
              strokeWidth={RING}
            />
            <motion.circle
              cx={ringR + RING / 2}
              cy={ringR + RING / 2}
              r={ringR}
              fill="none"
              stroke={tint}
              strokeWidth={RING}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - ratio) }}
              transition={reduced ? { duration: 0 } : getSpring('gentle')}
            />
          </svg>
        )}

        <motion.button
          ref={ref}
          type="button"
          disabled={locked}
          aria-label={ariaLabel}
          onClick={onClick}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          className={cn(
            'relative flex items-center justify-center rounded-full border-[3px] outline-none',
            'focus-visible:ring-4 focus-visible:ring-cia-spark-mid/30',
            locked ? 'cursor-default text-ink-400' : 'text-white',
          )}
          style={{
            width: size,
            height: size,
            background: face,
            borderColor: locked
              ? 'hsl(var(--ink-300))'
              : current
                ? 'rgba(255,255,255,.95)'
                : 'rgba(255,255,255,.35)',
            boxShadow: `0 ${depth}px 0 0 ${edgeColor}`,
            transform: `translateY(${restEdge - depth}px)`,
            transition: reduced ? 'none' : 'box-shadow 90ms ease-out, transform 90ms ease-out',
          }}
          animate={unlocking && !reduced ? { scale: [1, 1.12, 1] } : {}}
          transition={getSpring('bouncy')}
        >
          {picto && (
            <ModuleObject
              name={picto}
              size={Math.round(size * 0.56)}
              fill={locked ? 'hsl(var(--ink-300))' : 'rgba(255,255,255,.28)'}
            />
          )}

          {/* Le tampon frappe par-dessus l'objet, il ne le remplace pas. */}
          {stamped && (
            <motion.span
              className="absolute inset-0 flex items-center justify-center rounded-full bg-success-500/90 text-white"
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 1.7, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: -10 }}
              transition={getSpring('stamp')}
            >
              <ModuleObject name="check" size={Math.round(size * 0.62)} fill="transparent" />
            </motion.span>
          )}

          {/* Terminé : la coche reste, discrète, en pastille. */}
          {done && !stamped && (
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success-500 text-white ring-2 ring-background">
              <ModuleObject name="check" size={18} fill="transparent" />
            </span>
          )}
        </motion.button>
      </div>

      {label && (
        <span
          className={cn(
            'font-display text-sm font-extrabold tabular-nums',
            locked ? 'text-ink-300' : current ? 'text-cia-blue-700' : 'text-ink-500',
          )}
        >
          {label}
        </span>
      )}

      {done && progress && progress.total > 0 && (
        <span className="flex gap-0.5" aria-hidden>
          {Array.from({ length: 3 }).map((_, i) => (
            <svg key={i} width="11" height="11" viewBox="0 0 24 24">
              <path
                d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"
                fill={
                  i < Math.round((progress.done / progress.total) * 3)
                    ? 'hsl(var(--cia-gold-400))'
                    : 'hsl(var(--ink-200))'
                }
              />
            </svg>
          ))}
        </span>
      )}
    </div>
  );
});
