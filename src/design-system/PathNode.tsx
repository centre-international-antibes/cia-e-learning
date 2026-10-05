import * as React from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { Check, Gift, Lock, Star, Trophy } from 'lucide-react';

import { Spark } from '@/components/spark/Spark';
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
 * Un nœud n'est pas une icône dans un cercle : c'est un **objet** (cf. la
 * direction d'illustration arbitrée), et la couleur vient du niveau CECR.
 */

export type NodeState = 'locked' | 'available' | 'current' | 'completed';
export type NodeKind = 'module' | 'chest' | 'trophy';

export const NODE_SIZE = 67;
const EDGE = 6;
const PRESSED_EDGE = 2;

export interface PathNodeProps {
  kind?: NodeKind;
  state: NodeState;
  /** Teinte du niveau CECR, en `hsl(...)`. Ignorée si verrouillé. */
  tint: string;
  object?: ModuleObjectName;
  /** Numéro affiché sous le nœud. */
  label?: string;
  /** Leçons réussies sur le total — dessine les étoiles sous le nœud. */
  stars?: { done: number; total: number };
  /** Spark est posé sur ce nœud. */
  withSpark?: boolean;
  /** Le nœud vient d'être validé : il encaisse le tampon. */
  stamped?: boolean;
  /** Le nœud vient de se déverrouiller. */
  unlocking?: boolean;
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
    stars,
    withSpark,
    stamped,
    unlocking,
    onClick,
    ariaLabel,
  },
  ref,
) {
  const reduced = useReducedMotionConfig() ?? false;
  const [pressed, setPressed] = React.useState(false);
  const locked = state === 'locked';
  const done = state === 'completed';

  // Un module encore à faire est légèrement en retrait du module courant :
  // la hiérarchie se lit sans ajouter une seconde couleur.
  const face = locked
    ? 'hsl(var(--ink-200))'
    : state === 'available'
      ? `color-mix(in srgb, ${tint} 78%, white)`
      : tint;
  const edgeColor = locked ? 'hsl(var(--ink-300))' : 'color-mix(in srgb, ' + tint + ' 70%, black)';
  const depth = pressed && !locked ? PRESSED_EDGE : EDGE;

  return (
    <div className="relative flex flex-col items-center gap-1.5">
      {withSpark && (
        <motion.div
          // `layoutId` partagé : quand Spark change de nœud, framer-motion
          // l'anime d'une position à l'autre — il saute, il ne se téléporte pas.
          // Le flottement vit à l'intérieur : sinon la projection de layout se
          // remesure à chaque frame, et plus rien n'est jamais « stable ».
          layoutId="parcours-spark"
          className="pointer-events-none absolute -top-12 z-10"
          transition={reduced ? { duration: 0 } : getSpring('hero')}
        >
          <motion.div
            animate={reduced ? {} : { y: [-5, -11, -5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Spark mood={done ? 'celebrating' : 'idle'} size={44} halo />
          </motion.div>
        </motion.div>
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
          width: NODE_SIZE,
          height: NODE_SIZE,
          background: face,
          borderColor: locked
            ? 'hsl(var(--ink-300))'
            : state === 'current'
              ? 'rgba(255,255,255,.95)'
              : 'rgba(255,255,255,.35)',
          boxShadow: `0 ${depth}px 0 0 ${edgeColor}`,
          transform: `translateY(${EDGE - depth}px)`,
          transition: reduced ? 'none' : 'box-shadow 90ms ease-out, transform 90ms ease-out',
        }}
        animate={unlocking && !reduced ? { scale: [1, 1.12, 1] } : {}}
        transition={getSpring('bouncy')}
      >
        {kind === 'chest' ? (
          <Gift className="h-8 w-8" aria-hidden />
        ) : kind === 'trophy' ? (
          <Trophy className="h-8 w-8" aria-hidden />
        ) : locked ? (
          <Lock className="h-6 w-6" aria-hidden />
        ) : object ? (
          <ModuleObject name={object} size={38} fill="rgba(255,255,255,.28)" />
        ) : (
          <Star className="h-8 w-8 fill-current" aria-hidden />
        )}

        {/* Le tampon frappe par-dessus l'objet, il ne le remplace pas. */}
        {stamped && (
          <motion.span
            className="absolute inset-0 flex items-center justify-center rounded-full bg-success-500/90"
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 1.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: -10 }}
            transition={getSpring('stamp')}
          >
            <Check className="h-9 w-9 text-white" strokeWidth={3.5} aria-hidden />
          </motion.span>
        )}
      </motion.button>

      {label && (
        <span
          className={cn(
            'font-mono text-[10px] font-bold tabular-nums tracking-[.18em]',
            locked ? 'text-ink-300' : 'text-ink-500',
          )}
        >
          {label}
        </span>
      )}

      {stars && stars.total > 0 && (
        <span className="flex gap-0.5" aria-hidden>
          {Array.from({ length: Math.min(3, stars.total) }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-3 w-3',
                i < Math.round((stars.done / stars.total) * 3)
                  ? 'fill-cia-gold-400 text-cia-gold-400'
                  : 'fill-ink-200 text-ink-200',
              )}
            />
          ))}
        </span>
      )}
    </div>
  );
});
