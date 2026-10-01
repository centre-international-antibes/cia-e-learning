import { RollingNumber } from '@/components/ui/rolling-number';

interface AnimatedCounterProps {
  target: number;
  /** @deprecated — la durée est désormais donnée par le spring `gentle`. */
  duration?: number;
  suffix?: string;
  className?: string;
}

/**
 * Compteur animé — API conservée, implémentation déléguée à `RollingNumber`.
 *
 * Changement de comportement voulu : une mise à jour anime désormais depuis
 * la valeur affichée, et non depuis zéro.
 */
export function AnimatedCounter({ target, suffix = '', className }: AnimatedCounterProps) {
  return <RollingNumber value={target} suffix={suffix} className={className} />;
}
