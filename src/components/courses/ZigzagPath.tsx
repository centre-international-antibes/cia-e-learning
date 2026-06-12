import { motion, useReducedMotion } from 'framer-motion';
import {
  buildParcoursSplinePath,
  computeParcoursTotalHeight,
  type ParcoursNodeCoord,
} from '@/lib/curriculumPath';

interface ZigzagPathProps {
  /** Nœuds positionnés sur la spline (Parcours partage la même source). */
  coords: ParcoursNodeCoord[];
  /** Couleur HSL CSS (ex. `hsl(var(--cia-blue-500))`) pour le tracé. */
  stroke?: string;
  /** Ratio 0–1 indiquant la portion déjà parcourue (modules complétés). */
  fillRatio?: number;
}

/**
 * Chemin du Parcours — **spline continue lisse** (Batch A).
 *
 * Volontairement différent de la charte v2 §8 (`stroke-dasharray: 2 12`) :
 * Batch A repasse le tracé en **plein élégant**, plus lisible et plus
 * « vraie route » que le pointillé qui devenait du bruit visuel à grande
 * échelle. Le « segment parcouru » est rendu par un second path superposé
 * avec `pathLength` animé.
 *
 * Coordonnées partagées avec `Curriculum.tsx` via `lib/curriculumPath.ts` :
 * les nœuds DOM tombent exactement sur les extrema du tracé.
 */
export function ZigzagPath({ coords, stroke, fillRatio = 0 }: ZigzagPathProps) {
  const reduced = useReducedMotion();
  if (coords.length < 2) return null;

  const pathD = buildParcoursSplinePath(coords);
  const viewBoxHeight = computeParcoursTotalHeight(coords.length);
  const clampedFill = Math.min(1, Math.max(0, fillRatio));
  const strokeColor = stroke ?? 'hsl(var(--cia-blue-500))';

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 100 ${viewBoxHeight}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Tracé de fond — couleur de la section, opacité douce, plein lisse */}
      <motion.path
        d={pathD}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.35"
        initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
        animate={reduced ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Tracé « parcouru » — opaque, plus épais, animé sur progression */}
      <motion.path
        d={pathD}
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: clampedFill }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: 'spring', stiffness: 90, damping: 22, delay: 0.2 }
        }
      />
    </svg>
  );
}
