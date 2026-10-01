import * as React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';

/**
 * RollingNumber — un nombre qui roule de sa valeur précédente vers la
 * nouvelle. Jamais depuis zéro : passer de 120 à 125 anime 120 → 125, ce qui
 * rend le gain lisible au lieu de rejouer tout le compteur.
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
  const reduced = useReducedMotion();

  // La valeur de départ est la première valeur reçue, jamais 0.
  const motionValue = useMotionValue(value);
  const animated = useSpring(motionValue, spring.gentle);
  const source = reduced ? motionValue : animated;

  const scale = useMotionValue(1);
  const [display, setDisplay] = React.useState(value);
  const previous = React.useRef(value);
  const settleRef = React.useRef(onSettle);
  settleRef.current = onSettle;

  React.useEffect(() => {
    if (value === previous.current) return;
    const rising = value > previous.current;
    previous.current = value;
    motionValue.set(value);
    if (!bump || !rising || reduced) return;
    // 1 → 1.12 → 1 : le nombre « encaisse » le gain.
    scale.set(1.12);
    const timer = window.setTimeout(() => scale.set(1), 140);
    return () => window.clearTimeout(timer);
  }, [value, motionValue, scale, bump, reduced]);

  React.useEffect(() => {
    const unsubscribe = source.on('change', (latest) => {
      setDisplay(Math.round(latest));
    });
    return () => unsubscribe();
  }, [source]);

  React.useEffect(() => {
    if (display === value) settleRef.current?.(value);
  }, [display, value]);

  const formatter = React.useMemo(
    () => new Intl.NumberFormat(i18n.language || 'fr', format),
    [i18n.language, format],
  );

  const scaleSpring = useSpring(scale, spring.bouncy);
  const transform = useTransform(scaleSpring, (s) => `scale(${s})`);
  const text = `${prefix}${formatter.format(display)}${suffix}`;

  return (
    <span className={cn('tabular-nums font-display', className)} {...props}>
      {bump && !reduced ? (
        <motion.span style={{ transform, display: 'inline-block' }}>{text}</motion.span>
      ) : (
        text
      )}
    </span>
  );
}
