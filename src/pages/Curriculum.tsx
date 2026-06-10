import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { LevelBadge } from '@/components/courses/LevelBadge';
import { curriculum } from '@/data/curriculum';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { ModuleNode, type ModuleNodeState } from '@/components/courses/ModuleNode';
import { ZigzagPath } from '@/components/courses/ZigzagPath';
import { ModuleDrawer } from '@/components/courses/ModuleDrawer';
import { Spark } from '@/components/spark/Spark';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { XPBurst } from '@/components/gamification/XPBurst';
import { levelUpSequence } from '@/lib/confetti';
import { notify } from '@/lib/notify';
import { getModuleIcon } from '@/lib/moduleIcon';
import {
  computeParcoursCoords,
  computeParcoursTotalHeight,
} from '@/lib/curriculumPath';
import { XPChestNode, type ChestState } from '@/components/parcours/XPChestNode';
import { TrophyNode, type TrophyState } from '@/components/parcours/TrophyNode';
import { CompletionStamp } from '@/components/parcours/CompletionStamp';
import { UnlockPulse } from '@/components/parcours/UnlockPulse';
import { useCompletionSequence } from '@/lib/parcoursSequencer';
import { useSfx } from '@/hooks/useSfx';
import type { CECRLevel } from '@/data/demo-courses';
import { Sparkles } from 'lucide-react';
import { readCourseProgressMap } from '@/lib/courseProgress';

/**
 * Item du parcours — un module, un coffre (palier bonus tous les 3 modules)
 * ou un trophée (fin d'unité). Tous placés sur la même spline.
 */
interface DrawerLesson { id: number; title: string; completed: boolean }

type ParcoursItem =
  | { kind: 'module';  module: { id: string; number: number; title: string; theme?: string; totalLessons: number; completedLessons: number; durationMinutes: number; xpReward: number; progress: number; state: ModuleNodeState; lessons: DrawerLesson[] } }
  | { kind: 'chest';   chestId: string; state: ChestState; xpReward: number; afterModuleId: string }
  | { kind: 'trophy';  trophyId: string; state: TrophyState };

const LEVELS: CECRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * Échelle CECR — couleur par niveau (Batch « simplify » Bloc 2).
 * Source unique : tokens `cecr-*` dans `tailwind.config.ts`.
 * Le path du parcours et le LevelBadge consomment ces mêmes valeurs.
 */
const CECR_PATH_TINT: Partial<Record<CECRLevel, string>> = {
  A1: 'hsl(var(--cecr-a1))',
  A2: 'hsl(var(--cecr-a2))',
  B1: 'hsl(var(--cecr-b1))',
  B2: 'hsl(var(--cecr-b2))',
  C1: 'hsl(var(--cecr-c1))',
  C2: 'hsl(var(--cecr-c2))',
};

interface ModuleWithMeta {
  id: string;
  number: number;
  title: string;
  theme?: string;
  totalLessons: number;
  completedLessons: number;
  durationMinutes: number;
  xpReward: number;
  progress: number;
  state: ModuleNodeState;
  lessons: DrawerLesson[];
}

interface SectionWithMeta {
  level: CECRLevel;
  title: string;
  objective: string;
  modules: ModuleWithMeta[];
}

interface RewardEvent {
  /** Center coordinates (viewport) for the XPBurst origin. */
  x: number;
  y: number;
  xp: number;
  /** Identifier so React re-renders the burst on every event. */
  key: number;
}

export default function Curriculum() {
  const { t } = useTranslation();
  const { cecrLevel, totalXP } = useUserProgress();
  const { streak } = useDailyChallenge();
  const reduced = useReducedMotion();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  /** Modules « complétés à la volée » dans cette session (démo,
   *  ne touche pas la BDD — sprint 4). */
  const [demoCompleted, setDemoCompleted] = useState<Set<string>>(() => new Set());
  const [reward, setReward] = useState<RewardEvent | null>(null);
  const [sparkMood, setSparkMood] = useState<'encouraging' | 'celebrating' | 'idle'>('encouraging');
  /** Bloc 5 — oscillation idle : toggle court pour casser le statique
   *  (6-10s random, désactivé sous reduced-motion). */
  const [sparkOscillate, setSparkOscillate] = useState(false);
  /** Refs vers chaque bouton de nœud — sert à localiser le centre pour le XPBurst. */
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  /** Ref vers le compteur XP du sub-header — cible du « +N XP » fly du coffre. */
  const xpCounterRef = useRef<HTMLSpanElement>(null);
  /** Coffres ouverts dans cette session (démo, pas de mutation BDD). */
  const [openedChests, setOpenedChests] = useState<Set<string>>(() => new Set());
  /** Refs vers chaque section CECR — Bloc 5 : hook de transition d'univers
   *  (scroll vers le niveau suivant après le beat unit-complete). */
  const sectionRefs = useRef<Map<CECRLevel, HTMLElement>>(new Map());
  /** SFX opt-in (Bloc 6) — muet par défaut. */
  const { play: playSfx } = useSfx();

  /* Bloc 5 — idle ambient : toutes les 6-10s, Spark cligne / oscille brièvement
     (uniquement si pas en mode celebrating). Gated reduced-motion. */
  useEffect(() => {
    if (reduced) return;
    if (sparkMood === 'celebrating') return;
    const schedule = () => {
      const delay = 6000 + Math.random() * 4000;
      return window.setTimeout(() => {
        // Tirage : 60 % oscillation, 30 % mood swap 800 ms, 10 % rien
        const r = Math.random();
        if (r < 0.6) {
          setSparkOscillate(true);
          window.setTimeout(() => setSparkOscillate(false), 600);
        } else if (r < 0.9) {
          setSparkMood((m) => (m === 'encouraging' ? 'idle' : 'encouraging'));
          window.setTimeout(
            () => setSparkMood((m) => (m === 'celebrating' ? m : 'encouraging')),
            900,
          );
        }
      }, delay);
    };
    const id = schedule();
    const interval = window.setInterval(() => {
      window.clearTimeout(id);
      schedule();
    }, 9000);
    return () => {
      window.clearTimeout(id);
      window.clearInterval(interval);
    };
  }, [reduced, sparkMood]);

  const sections: SectionWithMeta[] = useMemo(() => {
    const userIdx = LEVELS.indexOf(cecrLevel as CECRLevel);
    return LEVELS.map((level) => {
      const data = curriculum.find((c) => c.level === level);
      const levelIdx = LEVELS.indexOf(level);
      const modulesRaw = data?.modules ?? [];

      let currentMarked = false;
      const modules: ModuleWithMeta[] = modulesRaw.map((m, idx) => {
        const lessonsCount = m.lessons?.length ?? 0;
        const isDemoCompleted = demoCompleted.has(m.id);
        const progress: number = isDemoCompleted ? 100 : 0;

        let state: ModuleNodeState;
        if (isDemoCompleted) {
          state = 'completed';
        } else if (levelIdx > userIdx + 1) {
          state = 'locked';
        } else if (level === cecrLevel && !currentMarked) {
          state = 'current';
          currentMarked = true;
        } else if (levelIdx === userIdx + 1 && idx === 0 && !currentMarked) {
          // Premier module du niveau suivant = available (incite à avancer)
          state = 'available';
        } else if (levelIdx <= userIdx) {
          state = 'available';
        } else {
          state = 'locked';
        }

        return {
          id: m.id,
          number: m.number ?? idx + 1,
          title: m.title ?? `${t('curriculum.module')} ${idx + 1}`,
          theme: m.theme,
          totalLessons: lessonsCount,
          durationMinutes: lessonsCount * 12,
          xpReward: lessonsCount * 50,
          progress,
          state,
        };
      });

      return {
        level,
        title: data?.title ?? '',
        objective: data?.objective ?? '',
        modules,
      };
    });
  }, [cecrLevel, t, demoCompleted]);

  const selectedModule = useMemo(() => {
    if (!selectedKey) return null;
    for (const section of sections) {
      const m = section.modules.find((x) => x.id === selectedKey);
      if (m) return { section, module: m };
    }
    return null;
  }, [selectedKey, sections]);

  /** Total des modules complétés (tous niveaux) — pilote la fierté globale. */
  const totalCompleted = useMemo(
    () => sections.reduce((acc, s) => acc + s.modules.filter((m) => m.state === 'completed').length, 0),
    [sections],
  );
  const totalModules = useMemo(
    () => sections.reduce((acc, s) => acc + s.modules.length, 0),
    [sections],
  );

  /** Bloc 1 — orchestrateur de complétion (3 s étagés). */
  const [stampedId, setStampedId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  /** Lookup pré-calculé : moduleId → nextModuleId (déterminé avant commit). */
  const pendingNextRef = useRef<string | null>(null);

  /** Bloc 3 — détection scroll manuel. L'auto-scroll de fin de séquence
   *  ne force pas si l'utilisateur scrolle depuis < 1.5 s. */
  const lastUserScrollRef = useRef(0);
  useEffect(() => {
    const onScroll = () => { lastUserScrollRef.current = Date.now(); };
    window.addEventListener('wheel', onScroll, { passive: true });
    window.addEventListener('touchmove', onScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onScroll);
      window.removeEventListener('touchmove', onScroll);
    };
  }, []);

  /** Séquence récompense étagée (Batch B) — la timeline est dans
   *  `parcoursSequencer.ts`. Chaque beat est routé vers son state visible. */
  const sequence = useCompletionSequence(
    {
      onStamp: (id) => {
        setStampedId(id);
        playSfx('pop');
      },
      onBurst: (id) => {
        const el = nodeRefs.current.get(id);
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        if (el) {
          const r = el.getBoundingClientRect();
          x = r.left + r.width / 2;
          y = r.top + r.height / 2;
        }
        // xp value passé via ref pour éviter de réinventer les beats signatures
        setReward({ x, y, xp: pendingXpRef.current, key: Date.now() });
      },
      onCommit: (id) => {
        setDemoCompleted((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        setSparkMood('celebrating');
        playSfx('whoosh');
      },
      onStampEnd: () => setStampedId(null),
      onUnlockPop: () => {
        if (pendingNextRef.current) {
          setUnlockingId(pendingNextRef.current);
          window.setTimeout(() => setUnlockingId(null), 900);
        }
      },
      onUnitComplete: (id) => {
        const section = sections.find((s) => s.modules.some((m) => m.id === id));
        if (!section) return;
        const remaining = section.modules.filter(
          (m) => m.id !== id && m.state !== 'completed',
        ).length;
        if (remaining !== 0) return;

        // Bloc 5 — beat fin d'unité : confetti bleu+blanc + toast + fanfare.
        levelUpSequence();
        playSfx('fanfare');
        notify.success(t('curriculum.unit_complete_toast', { level: section.level }));

        // Transition vers la section suivante : scroll smooth simple
        // (les fonds étant désormais uniformes, plus de cross-fade à orchestrer).
        const idx = LEVELS.indexOf(section.level);
        const nextLevel = idx >= 0 ? LEVELS[idx + 1] : undefined;
        if (nextLevel) {
          window.setTimeout(() => {
            if (Date.now() - lastUserScrollRef.current < 1500) return;
            const nextEl = sectionRefs.current.get(nextLevel);
            nextEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 1200);
        }
      },
      onAutoScroll: () => {
        if (!pendingNextRef.current) return;
        // Respecte un scroll manuel récent (< 1.5 s) — ne force pas l'utilisateur.
        if (Date.now() - lastUserScrollRef.current < 1500) return;
        const el = nodeRefs.current.get(pendingNextRef.current);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      onSparkReset: () => setSparkMood('encouraging'),
      onEnd: () => {
        pendingNextRef.current = null;
      },
    },
    !!reduced,
  );
  const pendingXpRef = useRef(0);

  /** Lance la chorégraphie pour `moduleId`. Calcule à l'avance le
   *  nœud suivant (pour l'unlock pop + l'auto-scroll). */
  const handleSimulateComplete = useCallback(
    (moduleId: string, xpReward: number) => {
      const section = sections.find((s) => s.modules.some((m) => m.id === moduleId));
      if (!section) return;
      const idx = section.modules.findIndex((m) => m.id === moduleId);
      const next = idx >= 0 && idx + 1 < section.modules.length
        ? section.modules[idx + 1].id
        : null;
      pendingNextRef.current = next;
      pendingXpRef.current = xpReward;
      sequence.run(moduleId);
    },
    [sections, sequence],
  );

  /* ===== Reveal premium : sub-header + sections en stagger ===== */
  const sectionItem = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring' as const, stiffness: 220, damping: 24 },
        },
      };

  return (
    <div className="relative pb-20">
      {/* Sub-header sticky — titre parcours + cluster stats compact.
          Glass discret sous le header global de l'app. */}
      <div className="sticky top-14 sm:top-16 z-30 backdrop-blur-md bg-background/80 border-b border-ink-100">
        <div className="container max-w-3xl py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <LevelBadge level={cecrLevel} size={36} />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-cia-blue-500">
                {t('curriculum.title')}
              </p>
              <p className="font-display font-extrabold text-sm md:text-base text-foreground truncate tabular-nums">
                {totalCompleted} / {totalModules}{' '}
                <span className="text-muted-foreground font-normal">modules</span>
              </p>
            </div>
          </div>

          {/* Cluster stats compact — pas tout UserIndicators pour rester sobre */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="streak" className="gap-1.5 px-2 py-1">
              <StreakFlame streak={streak} />
              <span className="tabular-nums text-xs">{streak}</span>
            </Badge>
            <Badge variant="xp" className="gap-1.5 px-2 py-1 hidden xs:inline-flex">
              <Sparkles className="h-3 w-3" />
              <span ref={xpCounterRef} className="tabular-nums text-xs">{totalXP.toLocaleString('fr-FR')}</span>
            </Badge>
          </div>
        </div>
      </div>

      <main className="container max-w-2xl py-6 sm:py-10 space-y-12">
        {sections.map((section) => {
          const sectionCompleted = section.modules.filter((m) => m.state === 'completed').length;
          const sectionTotal = section.modules.length;
          /** Position du nœud current dans cette section (pour la bulle Spark). */
          const remaining = sectionTotal - sectionCompleted;
          const bubbleText = (() => {
            if (sectionCompleted === 0) return t('curriculum.bubble_start_unit');
            if (remaining === 1) return t('curriculum.bubble_continue');
            return t(
              remaining > 1 ? 'curriculum.bubble_keep_going_plural' : 'curriculum.bubble_keep_going',
              { count: remaining },
            );
          })();

          return (
            <motion.section
              key={section.level}
              id={`niveau-${section.level.toLowerCase()}`}
              ref={(el) => {
                if (el) sectionRefs.current.set(section.level, el);
                else sectionRefs.current.delete(section.level);
              }}
              variants={sectionItem}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              {/* Header d'unité — radius 24px, fond blanc, bordure ink-100 */}
              <div className="rounded-3xl bg-card border border-ink-100 px-5 py-4 mb-6 shadow-sm flex items-center gap-4">
                <LevelBadge level={section.level} size={48} />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[.2em] text-cia-blue-500">
                    {t('curriculum.unit_label')} · {section.level}
                  </p>
                  <h2 className="font-display font-extrabold text-lg md:text-xl text-foreground truncate tracking-[-0.01em]">
                    {section.title || section.objective || section.level}
                  </h2>
                </div>
                {sectionTotal > 0 && (
                  <div className="text-right shrink-0">
                    <p className="font-display font-extrabold tabular-nums text-cia-blue-700 dark:text-cia-blue-300">
                      {sectionCompleted}
                      <span className="text-muted-foreground font-normal">/{sectionTotal}</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t('curriculum.module')}
                    </p>
                  </div>
                )}
              </div>

              {section.modules.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground italic">
                  {t('curriculum.coming_soon')}
                </div>
              ) : (() => {
                /* Bloc 4 — items enrichis : module → chest (tous les 3) → trophy fin. */
                const items: ParcoursItem[] = [];
                section.modules.forEach((m, i) => {
                  items.push({ kind: 'module', module: m });
                  // Insérer un coffre après chaque 3e module (sauf le dernier)
                  if ((i + 1) % 3 === 0 && i < section.modules.length - 1) {
                    const chestId = `${section.level}-chest-${i}`;
                    const chestState: ChestState =
                      openedChests.has(chestId) ? 'opened'
                      : m.state === 'completed' ? 'openable'
                      : 'locked';
                    items.push({
                      kind: 'chest',
                      chestId,
                      state: chestState,
                      xpReward: 150,
                      afterModuleId: m.id,
                    });
                  }
                });
                // Trophée fin d'unité
                const allCompleted = section.modules.every((m) => m.state === 'completed');
                items.push({
                  kind: 'trophy',
                  trophyId: `${section.level}-trophy`,
                  state: allCompleted ? 'unlocked' : 'locked',
                });

                /* Bloc 1 — spline continue + positionnement absolu sur les items. */
                const coords = computeParcoursCoords(
                  items.map((it) => ({ kind: it.kind })),
                );
                const sectionHeight = computeParcoursTotalHeight(items.length);
                const fillRatio =
                  items.length > 1
                    ? sectionCompleted / Math.max(1, items.length - 1)
                    : sectionCompleted;
                const tint = CECR_PATH_TINT[section.level];
                /** Index dans items du module current — pour bulle Spark + braises. */
                const currentItemIdx = items.findIndex(
                  (it) => it.kind === 'module' && it.module.state === 'current',
                );
                const currentCoord = currentItemIdx >= 0 ? coords[currentItemIdx] : null;

                return (
                <div
                  className="relative"
                  style={{ height: sectionHeight }}
                >
                  <ZigzagPath
                    coords={coords}
                    stroke={tint}
                    fillRatio={fillRatio}
                  />

                  {/* Bloc 5 — Spark vivant : un seul rendu par section, position
                      animée le long de la spline (spring 180/22) quand le current
                      change. Idle ambient via `sparkOscillate` toutes les 6-10s. */}
                  {currentCoord && (
                    <motion.div
                      className="absolute z-20 pointer-events-none hidden sm:block"
                      initial={false}
                      animate={
                        reduced
                          ? { left: `${currentCoord.x}%`, top: currentCoord.y }
                          : {
                              left: `${currentCoord.x}%`,
                              top: currentCoord.y,
                            }
                      }
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 180, damping: 22 }
                      }
                      style={{ willChange: 'transform' }}
                    >
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-2 ${
                          currentCoord.side === 'right'
                            ? 'left-full ml-3 flex-row'         // nœud à X=78% → satellite à droite (côté extérieur)
                            : 'right-full mr-3 flex-row-reverse' // nœud à X=22% → satellite à gauche (côté extérieur)
                        }`}
                      >
                        <motion.div
                          animate={
                            reduced
                              ? { scale: 1 }
                              : { scale: sparkOscillate ? [1, 1.08, 0.98, 1] : 1 }
                          }
                          transition={{ duration: 0.6, ease: 'easeInOut' }}
                        >
                          <Spark mood={sparkMood} size={56} halo />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            delay: 0.6,
                            type: 'spring',
                            stiffness: 300,
                            damping: 22,
                          }}
                          className="relative max-w-[200px] bg-card border border-cia-spark-mid/30 rounded-2xl px-3 py-2 shadow-elev-lg"
                        >
                          <p className="text-xs font-semibold text-foreground leading-snug">
                            {bubbleText}
                          </p>
                          <span
                            aria-hidden="true"
                            className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 bg-card border-cia-spark-mid/30 ${
                              currentCoord.side === 'right'
                                ? 'left-[-7px] border-l border-b'
                                : 'right-[-7px] border-r border-t'
                            }`}
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    className="relative w-full h-full"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={
                      reduced
                        ? { hidden: {}, visible: { transition: { duration: 0 } } }
                        : { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }
                    }
                  >
                    {items.map((item, itemIdx) => {
                      const coord = coords[itemIdx];
                      const itemKey =
                        item.kind === 'module' ? item.module.id :
                        item.kind === 'chest'  ? item.chestId    :
                                                 item.trophyId;
                      const itemVariants = reduced
                        ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
                        : {
                            hidden: { opacity: 0, scale: 0.85 },
                            visible: {
                              opacity: 1,
                              scale: 1,
                              transition: { type: 'spring' as const, damping: 12, stiffness: 220, mass: 0.8 },
                            },
                          };
                      return (
                        <motion.div
                          key={itemKey}
                          variants={itemVariants}
                          className="absolute"
                          style={{
                            left: `${coord.x}%`,
                            top: coord.y,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <div className="relative flex items-center gap-3">
                            {item.kind === 'module' && (
                              <div
                                ref={(el) => {
                                  if (el) nodeRefs.current.set(item.module.id, el);
                                  else nodeRefs.current.delete(item.module.id);
                                }}
                                className="relative"
                              >
                                <ModuleNode
                                  index={item.module.number - 1}
                                  title={item.module.title}
                                  icon={getModuleIcon(item.module.title, item.module.theme)}
                                  state={item.module.state}
                                  onClick={() => setSelectedKey(item.module.id)}
                                />
                                {/* Bloc 2 — Stamp overlay (T=0 → T=600 ms) */}
                                <CompletionStamp show={stampedId === item.module.id} />
                                {/* Bloc 2 — Unlock pulse (T=1600 → T=2500 ms) */}
                                <UnlockPulse show={unlockingId === item.module.id} />
                              </div>
                            )}

                            {item.kind === 'chest' && (
                              <XPChestNode
                                state={item.state}
                                xpReward={item.xpReward}
                                xpFlyTargetRef={xpCounterRef}
                                onOpenComplete={(xp) => {
                                  setOpenedChests((prev) => {
                                    const next = new Set(prev);
                                    next.add(item.chestId);
                                    return next;
                                  });
                                  playSfx('chime');
                                  notify.success(`+${xp} XP du coffre !`);
                                }}
                              />
                            )}

                            {item.kind === 'trophy' && (
                              <TrophyNode state={item.state} level={section.level} />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
                );
              })()}
            </motion.section>
          );
        })}
      </main>

      {/* Mobile : barre flottante avec Spark + bulle (toujours visible) */}
      <div
        className="fixed bottom-20 right-4 z-40 sm:hidden flex items-end gap-2 pointer-events-none"
        aria-hidden="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 20 }}
        >
          <Spark mood={sparkMood} size={56} halo />
        </motion.div>
      </div>

      {selectedModule && (
        <ModuleDrawer
          open={selectedKey != null}
          onOpenChange={(o) => !o && setSelectedKey(null)}
          moduleId={selectedModule.module.id}
          index={selectedModule.module.number - 1}
          title={selectedModule.module.title}
          theme={selectedModule.module.theme}
          icon={getModuleIcon(selectedModule.module.title, selectedModule.module.theme)}
          state={selectedModule.module.state}
          level={selectedModule.section.level}
          totalLessons={selectedModule.module.totalLessons}
          durationMinutes={selectedModule.module.durationMinutes}
          xpReward={selectedModule.module.xpReward}
          progress={selectedModule.module.progress}
        />
      )}

      {/* Séquence récompense : XPBurst au centre du nœud cliqué. */}
      {reward && (
        <XPBurst
          key={reward.key}
          x={reward.x}
          y={reward.y}
          amount={reward.xp}
          onComplete={() => setReward(null)}
        />
      )}
    </div>
  );
}
