import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Lock, Check } from 'lucide-react';
import { curriculum } from '@/data/curriculum';
import { isModuleUnlocked, isModuleComplete } from '@/hooks/useModuleUnlock';
import type { CECRLevel } from '@/data/demo-courses';
import { useCurriculumI18n } from '@/lib/curriculumI18n';

interface Props {
  currentLevel: CECRLevel;
}

type NodeState = 'completed' | 'current' | 'available' | 'locked';

interface NodeData {
  moduleId: string;
  title: string;
  badgeEmoji: string;
  state: NodeState;
}

function pickWindow(level: CECRLevel): NodeData[] {
  const levelData = curriculum.find((c) => c.level === level);
  if (!levelData || levelData.modules.length === 0) return [];

  // Find the first non-completed module (= "current")
  let currentIdx = levelData.modules.findIndex((m) => !isModuleComplete(m));
  if (currentIdx === -1) currentIdx = levelData.modules.length - 1;

  // 4-item window: 1 before, current, 2 after (clamped)
  const start = Math.max(0, currentIdx - 1);
  const end = Math.min(levelData.modules.length, start + 4);

  return levelData.modules.slice(start, end).map((mod, i) => {
    const indexInArray = start + i;
    const completed = isModuleComplete(mod);
    const unlocked = isModuleUnlocked(mod.id);
    let state: NodeState;
    if (completed) state = 'completed';
    else if (indexInArray === currentIdx) state = 'current';
    else if (unlocked) state = 'available';
    else state = 'locked';
    return {
      moduleId: mod.id,
      title: mod.title,
      badgeEmoji: mod.badgeEmoji,
      state,
    };
  });
}

const STATE_BG: Record<NodeState, string> = {
  completed: 'bg-gradient-to-br from-success-500 to-success-700 text-white',
  /* Charte v2 §8 — module current : « bleu, halo bleu + ring, pulse »
     (l'aplat doré précédent contrevenait à la règle « or banni des aplats »). */
  current: 'bg-cia-blue-500 text-white ring-4 ring-cia-spark-mid/40',
  available: 'bg-card text-cia-blue-700 ring-2 ring-cia-blue-200',
  locked: 'bg-muted text-muted-foreground/60',
};

export function MiniZigzag({ currentLevel }: Props) {
  const { t } = useTranslation();
  const ci = useCurriculumI18n();
  const nodes = pickWindow(currentLevel);
  if (nodes.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-5">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl">
          {t('dashboard.path.title')}{' '}
          <span className="text-cia-blue-500">· {currentLevel}</span>
        </h2>
        <Link
          to="/programme"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-cia-blue-700 hover:text-cia-blue-900 transition-colors"
        >
          {t('dashboard.path.see_all')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative">
        <div className="grid grid-cols-4 gap-3 md:gap-5 items-end">
          {nodes.map((node, i) => (
            <motion.div
              key={node.moduleId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
              className={`flex flex-col items-center gap-2 ${i % 2 === 1 ? 'mt-6' : ''}`}
            >
              <Link
                to={`/programme?module=${node.moduleId}`}
                className={`relative inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full shadow-md transition-transform duration-200 ${
                  node.state === 'locked' ? 'cursor-default pointer-events-none' : 'hover:-translate-y-1 active:translate-y-0'
                } ${STATE_BG[node.state]}`}
                aria-label={`${t('dashboard.path.module_aria')} ${node.moduleId}: ${ci.moduleTitle(node.moduleId, node.title)}`}
              >
                {node.state === 'locked' ? (
                  <Lock className="h-6 w-6" />
                ) : node.state === 'completed' ? (
                  <Check className="h-7 w-7" strokeWidth={3} />
                ) : (
                  <span className="text-2xl md:text-3xl">{node.badgeEmoji}</span>
                )}
                {node.state === 'current' && (
                  <motion.span
                    className="absolute -inset-2 rounded-full bg-cia-spark-mid/30 pointer-events-none"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    aria-hidden="true"
                  />
                )}
              </Link>
              <span
                className={`text-[10px] md:text-xs font-display font-bold text-center max-w-[80px] leading-tight ${
                  node.state === 'locked' ? 'text-muted-foreground/60' : 'text-foreground'
                }`}
              >
                {node.moduleId}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <Link
        to="/programme"
        className="sm:hidden mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-cia-blue-700"
      >
        {t('dashboard.path.see_all')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
