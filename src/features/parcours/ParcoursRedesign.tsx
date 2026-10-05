import * as React from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Flame, Sparkles, Target } from 'lucide-react';

import { RollingNumber } from '@/components/ui/rolling-number';
import { Spark } from '@/components/spark/Spark';
import {
  PathNode,
  NODE_SIZE,
  NODE_SIZE_CURRENT,
  type NodeState,
} from '@/design-system/PathNode';
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
 *   - des nœuds de **67 pt** à tranche de 6 pt, espacés de **80 pt** ;
 *   - un objet du quotidien par module, jamais une icône tierce.
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
const STEP = 80;
/** Amplitude du zigzag. Plus ample que la référence : nos nœuds sont moins nombreux. */
const SWING = 88;
/** Un coffre tous les trois modules, comme sur l'écran historique. */
const CHEST_EVERY = 3;
/** Spark occupe environ un quart de la largeur de l'écran. */
const SPARK_RATIO = 0.25;

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

type ChainItem =
  | { kind: 'module'; module: ParcoursModule }
  | { kind: 'chest'; id: string; unlocked: boolean };

/** Modules et coffres sur la même ligne, dans l'ordre où on les rencontre. */
function buildChain(modules: ParcoursModule[]): ChainItem[] {
  const items: ChainItem[] = [];
  modules.forEach((module, i) => {
    items.push({ kind: 'module', module });
    const last = i === modules.length - 1;
    if (!last && (i + 1) % CHEST_EVERY === 0) {
      items.push({
        kind: 'chest',
        id: `chest-${module.id}`,
        unlocked: modules.slice(0, i + 1).every((m) => m.state === 'completed'),
      });
    }
  });
  return items;
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

  // Spark suit le nœud qui vient de se déverrouiller, sinon le nœud courant.
  const sparkTarget = unlockingId ?? currentModuleId ?? null;

  return (
    <div className="bg-background pb-20">
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
          const chain = buildChain(section.modules);

          return (
            <section key={section.level} className="pt-5">
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

              <Chain
                items={chain}
                tint={tint}
                reduced={reduced}
                sparkTarget={sparkTarget}
                stampedId={stampedId}
                unlockingId={unlockingId}
                registerNode={registerNode}
                onOpen={(m) => {
                  setSheetTint(tint);
                  setSheet(m);
                }}
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

function Chain({
  items,
  tint,
  reduced,
  sparkTarget,
  stampedId,
  unlockingId,
  registerNode,
  onOpen,
}: {
  items: ChainItem[];
  tint: string;
  reduced: boolean;
  sparkTarget: string | null;
  stampedId?: string | null;
  unlockingId?: string | null;
  registerNode?: (id: string, el: HTMLElement | null) => void;
  onOpen: (m: ParcoursModule) => void;
}) {
  const { t } = useTranslation();
  const [ref, width] = useWidth<HTMLDivElement>();

  const sparkIndex = items.findIndex((it) => it.kind === 'module' && it.module.id === sparkTarget);
  const sparkSize = Math.round(Math.max(76, width * SPARK_RATIO * 1.1));

  return (
    <div
      ref={ref}
      className="relative mx-auto mt-16"
      style={{ height: (items.length - 1) * STEP + NODE_SIZE_CURRENT + 34 }}
    >
      {width > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <path
            d={items
              .map((_, i) => {
                const x = width / 2 + offsetAt(i);
                const y = i * STEP + NODE_SIZE / 2;
                return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="hsl(var(--ink-200))"
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Spark, posé **à côté** du nœud courant : une présence, pas une vignette. */}
      {width > 0 && sparkIndex >= 0 && (
        <motion.div
          layoutId="parcours-spark"
          className="pointer-events-none absolute z-10"
          style={{
            top: sparkIndex * STEP - sparkSize * 0.42,
            left:
              width / 2 +
              offsetAt(sparkIndex) +
              (offsetAt(sparkIndex) > 0 ? -1 : 1) * (NODE_SIZE_CURRENT / 2 + sparkSize * 0.52),
            translateX: '-50%',
          }}
          transition={reduced ? { duration: 0 } : getSpring('hero')}
        >
          <motion.div
            animate={reduced ? {} : { y: [-4, -10, -4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Spark mood="idle" size={sparkSize} halo />
          </motion.div>
        </motion.div>
      )}

      {items.map((item, i) => (
        <motion.div
          key={item.kind === 'module' ? item.module.id : item.id}
          className="absolute flex -translate-x-1/2 justify-center"
          style={{ top: i * STEP, left: `calc(50% + ${offsetAt(i)}px)` }}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ ...getSpring('gentle'), delay: Math.min(i, 6) * stagger.loose }}
        >
          {item.kind === 'chest' ? (
            <PathNode
              kind="chest"
              state={item.unlocked ? 'available' : 'locked'}
              tint="hsl(var(--cia-gold-500))"
              ariaLabel={t('parcours.chest')}
            />
          ) : (
            <PathNode
              ref={(el) => registerNode?.(item.module.id, el)}
              state={item.module.state}
              tint={tint}
              object={objectForModule(item.module.id)}
              label={String(item.module.number).padStart(2, '0')}
              progress={{
                done: item.module.completedLessons,
                total: item.module.totalLessons,
              }}
              callToAction={
                item.module.completedLessons > 0 ? t('parcours.resume') : t('parcours.start')
              }
              stamped={stampedId === item.module.id}
              unlocking={unlockingId === item.module.id}
              ariaLabel={t('parcours.moduleLabel', {
                number: item.module.number,
                title: item.module.title,
              })}
              onClick={() => {
                if (item.module.state === 'locked') return;
                onOpen(item.module);
              }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
