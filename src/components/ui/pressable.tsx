import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { motion, type HTMLMotionProps } from 'framer-motion';

import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';
import { feedback, type SfxScope } from '@/lib/feedback';

/** Créé une seule fois : un `motion.create()` dans le render remonterait
 *  l'enfant à chaque passage, ce qui perdrait focus, état et animation. */
const MotionSlot = motion.create(Slot) as typeof motion.button;

/**
 * Pressable — surface tactile 3D, signature gestuelle de l'app.
 *
 * Un seul geste : l'enfoncement vertical. La surface descend de sa
 * profondeur exacte et son ombre portée disparaît, comme une touche qu'on
 * presse. Pas de `scale` : un bouton qui rétrécit ne s'enfonce pas, il
 * s'éloigne.
 *
 * Sert de base aux boutons, aux options de QCM (M3) et aux nœuds du
 * parcours (M6).
 */

export type PressableTone = 'primary' | 'gold' | 'success' | 'danger' | 'neutral';
export type PressableDepth = 'sm' | 'md' | 'lg';

/** Profondeur en px — c'est aussi la distance d'enfoncement. */
const DEPTH_PX: Record<PressableDepth, number> = { sm: 2, md: 3, lg: 4 };

const TONE_CLASS: Record<PressableTone, string> = {
  primary: 'bg-primary text-primary-foreground hover:brightness-110',
  gold: 'bg-cia-gold-500 text-cia-blue-900 hover:bg-cia-gold-400',
  success: 'bg-success-500 text-white hover:bg-success-600',
  danger: 'bg-cia-red-500 text-white hover:bg-cia-red-600',
  // Le neutre est la future option de QCM : fond blanc, liseré ink.
  neutral: 'bg-background text-foreground border-2 border-ink-200 hover:border-primary/40',
};

/** Couleur de la tranche, par ton. */
const TONE_EDGE: Record<PressableTone, string> = {
  primary: 'hsl(var(--cia-blue-700))',
  gold: 'hsl(var(--cia-gold-600))',
  success: 'hsl(var(--success-600))',
  danger: 'hsl(var(--cia-red-600))',
  neutral: 'hsl(var(--ink-200))',
};

/** État sélectionné persistant : la surface reste enfoncée. */
const TONE_PRESSED: Record<PressableTone, string> = {
  primary: 'ring-2 ring-primary/40',
  gold: 'ring-2 ring-cia-gold-500/50',
  success: 'ring-2 ring-success-500/40',
  danger: 'ring-2 ring-cia-red-500/40',
  neutral: 'border-primary bg-cia-blue-50',
};

type MotionButtonProps = HTMLMotionProps<'button'>;

export interface PressableProps extends Omit<MotionButtonProps, 'ref'> {
  tone?: PressableTone;
  depth?: PressableDepth;
  /** Sélection persistante (option choisie, filtre actif). */
  pressed?: boolean;
  /** Rend l'enfant à la place du `button` (lien, label…). */
  asChild?: boolean;
  /** N'émet ni son ni vibration au toucher. */
  silent?: boolean;
  /** Contexte sonore ; `player` est audible par défaut, `app` est muet. */
  scope?: SfxScope;
}

function edgeShadow(tone: PressableTone, depth: number): string {
  return `0 ${depth}px 0 0 ${TONE_EDGE[tone]}`;
}

export const Pressable = React.forwardRef<HTMLButtonElement, PressableProps>(
  (
    {
      className,
      tone = 'primary',
      depth = 'md',
      pressed = false,
      asChild = false,
      silent = false,
      scope = 'app',
      disabled,
      onPointerDown,
      children,
      ...props
    },
    ref,
  ) => {
    const px = DEPTH_PX[depth];
    const Comp = asChild ? MotionSlot : motion.button;

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!silent && !disabled) feedback.tap({ scope });
      onPointerDown?.(event);
    };

    return (
      <Comp
        ref={ref}
        disabled={disabled}
        data-pressed={pressed || undefined}
        aria-pressed={props['aria-pressed'] ?? (pressed ? true : undefined)}
        onPointerDown={handlePointerDown}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl',
          'px-5 py-2 text-sm font-semibold font-display',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-4',
          'focus-visible:ring-cia-spark-mid/30 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
          TONE_CLASS[tone],
          pressed && TONE_PRESSED[tone],
          className,
        )}
        // Désactivé ou déjà enfoncé : pas de profondeur, donc rien à enfoncer.
        initial={false}
        animate={{
          y: disabled ? 0 : pressed ? px : 0,
          boxShadow: disabled || pressed ? '0 0 0 0 rgba(0,0,0,0)' : edgeShadow(tone, px),
        }}
        whileHover={disabled || pressed ? undefined : { y: -1 }}
        whileTap={disabled ? undefined : { y: px, boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
        transition={spring.snappy}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
Pressable.displayName = 'Pressable';
