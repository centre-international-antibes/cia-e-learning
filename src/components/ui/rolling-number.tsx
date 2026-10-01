import * as React from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotionConfig,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';

/**
 * RollingNumber — un nombre qui roule de sa valeur précédente vers la
 * nouvelle. Jamais depuis zéro : passer de 120 à 125 anime 120 → 125, ce qui
 * rend le gain lisible au lieu de rejouer tout le compteur.
 *
 * Le texte est dérivé de la MotionValue et réécrit directement dans le nœud
 * DOM : aucun `setState` par frame, donc aucun re-render de l'arbre React
 * pendant l'animation.
 */

export interface RollingNumberProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'children'
> {
  value: number;
  /** Préfixe collé au nombre, typiquement `+`. */
  prefix?: string;
  /** Suffixe collé au nombre, typiquement ` XP`. */
  suffix?: string;
  /** Options Intl.NumberFormat ; la locale suit celle de l'interface. */
  format?: Intl.NumberFormatOptions;
  /** Petit sursaut d'échelle à chaque hausse. */
  bump?: boolean;
  /** Appelé une fois la valeur atteinte. */
  onSettle?: (value: number) => void;
}

export function RollingNumber({
  value,
  prefix = '',
  suffix = '',
  format,
  bump = false,
  onSettle,
  className,
  ...props
}: RollingNumberProps) {
  const { i18n } = useTranslation();
  // Suit le `<MotionConfig>` englobant, pas seulement la préférence système.
  const reduced = useReducedMotionConfig() ?? false;

  // La valeur de départ est la première valeur reçue, jamais 0.
  const motionValue = useMotionValue(value);
  const animated = useSpring(motionValue, spring.gentle);
  const source = reduced ? motionValue : animated;

  const scale = useMotionValue(1);
  const previous = React.useRef(value);
  const settleRef = React.useRef(onSettle);
  settleRef.current = onSettle;

  const formatter = React.useMemo(
    () => new Intl.NumberFormat(i18n.language || 'fr', format),
    [i18n.language, format],
  );

  const text = useTransform(
    source,
    (latest) => `${prefix}${formatter.format(Math.round(latest))}${suffix}`,
  );

  React.useEffect(() => {
    if (value === previous.current) return;
    const rising = value > previous.current;
    previous.current = value;
    motionValue.set(value);
    // Sans animation, aucun `animationComplete` n'est émis : on prévient ici.
    if (reduced) settleRef.current?.(value);
    if (!bump || !rising || reduced) return;
    // 1 → 1.12 → 1 : le nombre « encaisse » le gain.
    scale.set(1.12);
    const timer = window.setTimeout(() => scale.set(1), 140);
    return () => window.clearTimeout(timer);
  }, [value, motionValue, scale, bump, reduced]);

  React.useEffect(() => {
    if (reduced) return;
    return source.on('animationComplete', () => {
      settleRef.current?.(Math.round(source.get()));
    });
  }, [source, reduced]);

  const scaleSpring = useSpring(scale, spring.bouncy);
  const transform = useTransform(scaleSpring, (s) => `scale(${s})`);

  return (
    <span className={cn('tabular-nums font-display', className)} {...props}>
      {bump && !reduced ? (
        <motion.span style={{ transform, display: 'inline-block' }}>{text}</motion.span>
      ) : (
        <motion.span>{text}</motion.span>
      )}
    </span>
  );
}
