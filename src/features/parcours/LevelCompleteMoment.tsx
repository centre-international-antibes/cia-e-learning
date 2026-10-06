import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Pressable } from '@/components/ui/pressable';
import { RollingNumber } from '@/components/ui/rolling-number';
import { Spark } from '@/components/spark/Spark';
import { ModuleObject } from '@/design-system/objects/ModuleObject';
import { feedback } from '@/lib/feedback';
import { getSpring } from '@/lib/motion/tuning';
import { fade } from '@/lib/motion';

/**
 * Fin de niveau — moment signature n° 4 de `MOTION.md`.
 *
 * Le plus rare et le plus fort : la carte de niveau arrive de loin, pivote et
 * se pose. Il ne se joue **qu'à l'instant où le dernier module d'une unité
 * tombe**, jamais à chaque visite du parcours, et jamais sur une hausse d'XP —
 * le niveau CECR est pédagogique (invariant de `DESIGN.md`).
 *
 * Les trois temps :
 *   - **anticipation** : la carte part de loin, de haut, pivotée ;
 *   - **impact** : elle se pose en `hero`, le son tombe à la pose ;
 *   - **suivi** : halo qui pulse, éclats d'or aux formes CIA, Spark qui réagit,
 *     puis le chiffre de ce qui a été fait, puis l'action.
 *
 * C'est le seul endroit où l'inclinaison 3D au doigt est permise.
 */

/** Éclats d'or du suivi — formes CIA, jamais du confetti générique. */
const SHARDS = 10;
/** Amplitude de l'inclinaison au doigt, en degrés. */
const TILT = 9;

export interface LevelCompleteMomentProps {
  /** Niveau dont l'unité vient d'être terminée. */
  level: string;
  /** Niveau suivant, s'il existe — il porte l'action. */
  nextLevel?: string;
  /** Teinte CECR du niveau terminé. */
  tint: string;
  /** Ce qui a été fait, et que le chiffre géant compte. */
  modules: number;
  lessons: number;
  onClose: () => void;
}

export function LevelCompleteMoment({
  level,
  nextLevel,
  tint,
  modules,
  lessons,
  onClose,
}: LevelCompleteMomentProps) {
  const { t } = useTranslation();
  // `MotionConfig reducedMotion="user"` neutralise déjà les transforms ; on s'en
  // sert aussi pour décider ce qu'on ne monte pas du tout (éclats, inclinaison).
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [landed, setLanded] = React.useState(reduced);

  /*
   * La pose est datée par une minuterie, **pas** par `onAnimationComplete` :
   * aucun état final ne doit dépendre de la fin d'une animation (MOTION.md § 3),
   * sinon un rendu interrompu laisserait la carte sans son chiffre ni son CTA.
   * 560 ms, c'est l'arrivée mesurée du preset `hero`.
   */
  React.useEffect(() => {
    if (landed) return;
    const id = window.setTimeout(() => setLanded(true), 560);
    return () => window.clearTimeout(id);
  }, [landed]);

  // Le son se pose sur l'impact, jamais sur le départ (MOTION.md § 6).
  React.useEffect(() => {
    if (!landed) return;
    feedback.levelUp({ scope: 'app' });
  }, [landed]);

  /* ── Inclinaison 3D au doigt ── */
  const tiltX = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const tiltY = useSpring(useMotionValue(0), { stiffness: 220, damping: 22 });
  const rotateX = useTransform(tiltX, (v) => `${v}deg`);
  const rotateY = useTransform(tiltY, (v) => `${v}deg`);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const box = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    tiltY.set(px * TILT * 2);
    tiltX.set(-py * TILT * 2);
  };
  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-overlay bg-cia-blue-900/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: fade.base }}
          />
        </DialogPrimitive.Overlay>

        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-celebration flex items-center justify-center p-6 outline-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
          // Rien ne ferme ce moment tout seul : c'est la récompense, elle reste
          // tant qu'on la regarde. Trois sorties, dont deux au doigt — un tap
          // n'importe où, l'action de la carte, et Échap.
          onClick={onClose}
        >
          {/* Les transforms 3D restent isolées dans ce wrapper (DESIGN.md § 6). */}
          <div style={{ perspective: 1000 }}>
            <motion.div
              className="relative w-[min(360px,86vw)] rounded-[20px] border-2 border-ink-100 bg-card shadow-elev-xl"
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              initial={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: -180, scale: 0.55, rotate: -8 }
              }
              animate={
                reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, rotate: 0 }
              }
              transition={reduced ? { duration: fade.base } : getSpring('hero')}
              onPointerMove={onPointerMove}
              onPointerLeave={resetTilt}
              onPointerCancel={resetTilt}
            >
              {/* Bandeau à la teinte du niveau — la seule couleur saturée ici. */}
              <div
                className="flex flex-col items-center gap-1 rounded-t-[18px] px-6 pb-5 pt-6 text-white"
                style={{ background: tint }}
              >
                <motion.span
                  className="relative mb-1 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{
                    background: 'hsl(var(--cia-gold-500))',
                    boxShadow: '0 6px 0 0 hsl(var(--cia-gold-700))',
                  }}
                  animate={
                    landed && !reduced
                      ? { boxShadow: [
                          '0 6px 0 0 hsl(var(--cia-gold-700))',
                          '0 6px 0 0 hsl(var(--cia-gold-700)), 0 0 0 14px hsl(var(--cia-gold-500) / 0)',
                          '0 6px 0 0 hsl(var(--cia-gold-700))',
                        ] }
                      : undefined
                  }
                  transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 1.4 }}
                >
                  <ModuleObject name="trophy" size={46} fill="rgba(255,255,255,.3)" />
                  {landed && !reduced && <Shards />}
                </motion.span>

                <p className="text-[11px] font-semibold uppercase tracking-[.16em] opacity-85">
                  {t('parcours.levelDone.eyebrow')}
                </p>
                <DialogPrimitive.Title className="font-display text-2xl font-extrabold leading-tight">
                  {t('parcours.levelDone.title', { level })}
                </DialogPrimitive.Title>
              </div>

              {/* Le chiffre géant compte ce qui a été fait. */}
              <div className="px-6 py-5 text-center">
                <RollingNumber
                  value={landed ? modules : 0}
                  className="font-display text-5xl font-extrabold leading-none tabular-nums text-foreground"
                  bump
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('parcours.levelDone.recap', { modules, lessons })}
                </p>
              </div>

              {/* Réaction de Spark, puis l'action. Jamais les deux en même temps. */}
              <motion.div
                className="flex flex-col items-center gap-3 px-6 pb-6"
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={landed ? { opacity: 1, y: 0 } : undefined}
                transition={{ ...getSpring('gentle'), delay: reduced ? 0 : 0.18 }}
              >
                <Spark mood="celebrating" size={88} halo />
                <Pressable
                  tone="primary"
                  depth="lg"
                  className="h-14 w-full text-base"
                  onClick={onClose}
                >
                  {nextLevel
                    ? t('parcours.levelDone.continue', { level: nextLevel })
                    : t('parcours.levelDone.back')}
                </Pressable>
              </motion.div>
            </motion.div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Suivi de l'impact : des éclats d'or qui partent du trophée.
 *
 * Dix éclats au plus, aux formes de la palette, et rien de tout cela n'est
 * nécessaire à la lecture de l'écran — c'est pourquoi le composant n'est pas
 * monté sous `prefers-reduced-motion`.
 */
function Shards() {
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: SHARDS }).map((_, i) => {
        const angle = (i / SHARDS) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-[2px]"
            style={{
              background:
                i % 3 === 0 ? 'hsl(var(--cia-gold-300))' : 'hsl(var(--cia-gold-500))',
            }}
            initial={{ x: -4, y: -4, scale: 0.4, opacity: 0 }}
            animate={{
              x: Math.cos(angle) * 74 - 4,
              y: Math.sin(angle) * 74 - 4,
              scale: [0.4, 1, 0.2],
              opacity: [0, 1, 0],
              rotate: 180,
            }}
            transition={{ duration: 0.72, delay: 0.04 * i, ease: 'easeOut' }}
          />
        );
      })}
    </span>
  );
}
