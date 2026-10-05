import * as React from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Flame, Sparkles, Target } from 'lucide-react';

import { RollingNumber } from '@/components/ui/rolling-number';
import { PathNode, NODE_SIZE, type NodeState } from '@/design-system/PathNode';
import { UnitBanner } from '@/design-system/UnitBanner';
import { objectForModule } from '@/design-system/objects/objectForModule';
import { getSpring } from '@/lib/motion/tuning';
import { stagger } from '@/lib/motion';
import { LessonStartSheet, type LessonStartSheetModule } from './LessonStartSheet';

/**
 * Parcours — écran pilote de la refonte.
 *
 * Il rend exactement les mêmes données que l'écran actuel : c'est la direction
 * artistique qui change, pas le contenu ni la logique de progression. Les
 * cibles viennent des mesures de `design/refs/ANALYSE.md` :
 *
 *   - **70 % de blanc** et **une seule couleur saturée** par unité ;
 *   - une **bannière pleine largeur** de 104 pt par section ;
 *   - des nœuds de **67 pt** à tranche de 6 pt, espacés de **84 pt** ;
 *   - un objet du quotidien par module, jamais une icône dans un cercle.
 *
 * Vit derrière `?redesign=1` : sans le drapeau, l'écran historique est rendu.
 */

export interface ParcoursModule {
  id: string;
  number: number;
  title: string;
  theme?: string;
  totalLessons: number;
  completedLessons: number;
  durationMinutes: number;
  xpReward: number;
  progress: number;
  state: NodeState;
  lessons: { id: number; completed: boolean; href?: string }[];
}

export interface ParcoursSection {
  level: string;
  title: string;
  objective: string;
  modules: ParcoursModule[];
}

interface Props {
  sections: ParcoursSection[];
  tintFor: (level: string) => string;
  streak: number;
  totalXP: number;
  /** Modules faits aujourd'hui sur l'objectif du jour. */
  dailyGoal?: { done: number; target: number };
  stampedId?: string | null;
  unlockingId?: string | null;
  /** Nœud sur lequel Spark est posé. */
  currentModuleId?: string | null;
  onOpenModule: (module: ParcoursModule) => void;
  registerNode?: (id: string, el: HTMLElement | null) => void;
}

/** Espacement vertical entre deux nœuds — mesuré entre 76 et 95 pt. */
const STEP = 84;
/** Amplitude du zig-zag. Le chemin se lit d'un coup d'œil, sans serpenter trop. */
const SWING = 68;

/** Serpentine : un aller-retour complet tous les six nœuds, comme la référence. */
const offsetAt = (i: number) => Math.round(Math.sin((i * Math.PI) / 2) * SWING);

/** Largeur réelle du conteneur : le chemin se trace en pixels, pas en %. */
function useWidth<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    setWidth(node.offsetWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(node.offsetWidth));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Chaîne de nœuds d'une unité, chemin compris. */
function NodeChain({ children, count, render }: {
  children?: never;
  count: number;
  render: (width: number) => React.ReactNode;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="relative mx-auto mt-20"
      style={{ height: count * STEP + NODE_SIZE }}
    >
      {render(width)}
    </div>
  );
}

export function ParcoursRedesign({
  sections,
  tintFor,
  streak,
  totalXP,
  dailyGoal,
  stampedId,
  unlockingId,
  currentModuleId,
  onOpenModule,
  registerNode,
}: Props) {
  const { t } = useTranslation();
  const reduced = useReducedMotionConfig() ?? false;
  const [sheet, setSheet] = React.useState<LessonStartSheetModule | null>(null);
  const [sheetTint, setSheetTint] = React.useState('hsl(var(--cia-blue-500))');

  const open = (m: ParcoursModule, tint: string) => {
    setSheetTint(tint);
    setSheet(m);
  };

  return (
    <div className="bg-background pb-24">
      {/* ── En-tête : série, XP, objectif du jour ── */}
      <header className="sticky top-14 z-30 border-b-2 border-ink-100 bg-background/95 backdrop-blur-sm sm:top-16">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-6 py-3">
          <span className="flex items-center gap-1.5" aria-label={t('parcours.streakLabel')}>
            <Flame className="h-5 w-5 fill-streak-500 text-streak-500" aria-hidden />
            <span className="font-display text-lg font-extrabold tabular-nums text-streak-600">
              {streak}
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-cia-gold-500" aria-hidden />
            <RollingNumber
              value={totalXP}
              className="text-lg font-extrabold text-cia-gold-700"
              data-xp-origin
            />
          </span>

          {dailyGoal && (
            <span className="flex items-center gap-1.5">
              <Target className="h-5 w-5 text-cia-blue-500" aria-hidden />
              <span className="font-display text-lg font-extrabold tabular-nums text-cia-blue-700">
                {dailyGoal.done}/{dailyGoal.target}
              </span>
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-md px-6">
        {sections.map((section, si) => {
          const tint = tintFor(section.level);
          const done = section.modules.filter((m) => m.state === 'completed').length;

          return (
            <section key={section.level} className="pt-6">
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={getSpring('gentle')}
              >
                <UnitBanner
                  tint={tint}
                  eyebrow={t('parcours.eyebrow', { level: section.level, unit: si + 1 })}
                  title={section.title}
                  meta={t('parcours.modulesCount', { done, total: section.modules.length })}
                  indexLabel={t('parcours.openIndex')}
                />
              </motion.div>

              {/* ── Chaîne de nœuds ── */}
              <NodeChain
                count={section.modules.length}
                render={(width) => (
                  <>
                    {width > 0 && (
                      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                        <path
                          d={section.modules
                            .map((_, i) => {
                              const x = width / 2 + offsetAt(i);
                              const y = i * STEP + NODE_SIZE / 2;
                              return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
                            })
                            .join(' ')}
                          fill="none"
                          stroke="hsl(var(--ink-200))"
                          strokeWidth={10}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}

                    {section.modules.map((m, i) => (
                      <motion.div
                        key={m.id}
                        className="absolute flex -translate-x-1/2 justify-center"
                        style={{ top: i * STEP, left: `calc(50% + ${offsetAt(i)}px)` }}
                        initial={reduced ? false : { opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ ...getSpring('gentle'), delay: Math.min(i, 6) * stagger.loose }}
                      >
                        <PathNode
                          ref={(el) => registerNode?.(m.id, el)}
                          state={m.state}
                          tint={tint}
                          object={objectForModule(m.id)}
                          label={String(m.number).padStart(2, '0')}
                          stars={
                            m.state === 'completed'
                              ? { done: m.completedLessons, total: m.totalLessons }
                              : undefined
                          }
                          withSpark={m.id === (unlockingId ?? currentModuleId)}
                          stamped={stampedId === m.id}
                          unlocking={unlockingId === m.id}
                          ariaLabel={t('parcours.moduleLabel', { number: m.number, title: m.title })}
                          onClick={() => {
                            if (m.state === 'locked') return;
                            open(m, tint);
                          }}
                        />
                      </motion.div>
                    ))}
                  </>
                )}
              />
            </section>
          );
        })}
      </div>

      <LessonStartSheet
        module={sheet}
        tint={sheetTint}
        onOpenChange={(o) => !o && setSheet(null)}
        onStart={(m) => {
          setSheet(null);
          const full = sections.flatMap((s) => s.modules).find((x) => x.id === m.id);
          if (full) onOpenModule(full);
        }}
      />
    </div>
  );
}
