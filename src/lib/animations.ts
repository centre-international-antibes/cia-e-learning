/**
 * @deprecated — utiliser `@/lib/motion` (tokens `spring` / `fade` / `stagger`)
 * et les primitives `Pressable` / `RollingNumber` pour tout nouveau mouvement.
 *
 * Ce fichier reste en place pour les écrans déjà câblés : les exports gardent
 * leur nom et leur forme, mais sont ré-implémentés sur les tokens motion.
 * Les transforms passent donc par des springs ; les `duration` restantes ne
 * portent plus que de l'opacité.
 */
import type { Variants } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';
import { fade, spring, stagger } from '@/lib/motion';

/* =========================================================================
 * Primitives — API inchangée, implémentation sur tokens
 * ========================================================================= */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: fade.slow } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...spring.gentle, opacity: { duration: fade.base } },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger.base, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...spring.gentle, opacity: { duration: fade.base } },
  },
};

export const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { ...spring.bouncy, opacity: { duration: fade.base } },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: fade.base } },
};

export const hoverLift = {
  rest: { y: 0, scale: 1, transition: spring.snappy },
  hover: { y: -4, scale: 1.01, transition: spring.snappy },
};

export const xpBurst: Variants = {
  hidden: { opacity: 1, x: 0, y: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: [1, 1, 0],
    x: Math.cos((i / 8) * Math.PI * 2) * 60,
    y: Math.sin((i / 8) * Math.PI * 2) * 60,
    scale: [0, 1, 0.5],
    // Keyframes : une durée est ici la seule façon de séquencer la rafale.
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  }),
};

/**
 * Transition de page. Plus aucune rotation 3D : le `rotateX` créait un
 * stacking context persistant sur le conteneur de page (cause racine du
 * portal du CoursePlayer).
 */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    // Une fois la page posée, on retire la transform : plus de stacking
    // context, les overlays (player, modales) se superposent normalement.
    transitionEnd: { transform: 'none' },
  },
  exit: { opacity: 0 },
  transition: { ...spring.gentle, opacity: { duration: fade.fast } },
};

/* =========================================================================
 * Primitives d'accent
 * ========================================================================= */

/**
 * springPop — rebond physique pour les éléments qui doivent donner une
 * sensation de matérialité : trophées, badges débloqués, niveau au level-up.
 */
export const springPop: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -30 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { ...spring.bouncy, opacity: { duration: fade.base } },
  },
  exit: { opacity: 0, scale: 0.5, rotate: 15, transition: { duration: fade.base } },
};

/**
 * floatY — lévitation infinie verticale (décoratif : mascottes en attente,
 * badges flottants). Boucle continue → easing, pas de spring.
 */
export const floatY: Variants = {
  float: {
    y: [0, -8, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

/**
 * slideRotate — slide directionnel pour les transitions de step.
 * La rotation 3D (`rotateY`) a été retirée : même cause que `pageTransition`.
 */
export const slideRotate = (direction: 1 | -1) => ({
  initial: { opacity: 0, x: direction * 80 },
  animate: { opacity: 1, x: 0, transitionEnd: { transform: 'none' } },
  exit: { opacity: 0, x: -direction * 80 },
  transition: { ...spring.gentle, opacity: { duration: fade.fast } },
});

/**
 * useTilt3D — props pointer + style transform pour un tilt 3D au survol.
 *
 * Seul endroit où une rotation 3D subsiste, et volontairement : l'angle suit
 * le pointeur en continu, ce n'est pas une animation jouée. Le `perspective`
 * est posé sur l'élément lui-même, pas sur le conteneur de page — donc pas de
 * stacking context au-dessus des overlays. Utilisé par les cartes de la
 * landing et le CourseCard.
 */
export interface UseTilt3DOptions {
  /** Angle max en degrés (défaut 12) */
  max?: number;
  /** Activé seulement au hover (défaut true) */
  active?: boolean;
  /** Perspective en px (défaut 1000) */
  perspective?: number;
  /** Scale au hover (défaut 1.02) */
  scale?: number;
}

export function useTilt3D(options: UseTilt3DOptions = {}) {
  const { max = 12, active = true, perspective = 1000, scale = 1.02 } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!active || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      setRot({
        x: Math.max(-max, Math.min(max, -dy * max)),
        y: Math.max(-max, Math.min(max, dx * max)),
      });
    },
    [active, max],
  );

  const handlePointerEnter = useCallback(() => setHovering(true), []);
  const handlePointerLeave = useCallback(() => {
    setHovering(false);
    setRot({ x: 0, y: 0 });
  }, []);

  return {
    ref,
    bind: {
      ref,
      onPointerMove: handlePointerMove,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
    },
    style: {
      transform: `perspective(${perspective}px) rotateX(${rot.x}deg) rotateY(${rot.y}deg) scale(${hovering ? scale : 1})`,
      transformStyle: 'preserve-3d' as const,
      transition: 'transform 0.15s ease-out',
    },
    hovering,
    rotation: rot,
  };
}
