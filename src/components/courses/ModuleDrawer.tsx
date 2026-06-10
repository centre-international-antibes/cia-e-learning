import { ArrowRight, BookOpen, Clock, Sparkles, Lock, Check, Play, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ModuleNodeState } from './ModuleNode';
import type { ModuleIconType } from '@/lib/moduleIcon';
import { getEntryLessonForModule } from '@/data/contentRegistry';
import { readCourseProgressMap } from '@/lib/courseProgress';

export interface DrawerLessonItem {
  id: number;
  title: string;
  completed: boolean;
}

interface ModuleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  index: number;
  title: string;
  theme?: string;
  description?: string;
  icon: ModuleIconType;
  state: ModuleNodeState;
  level: string;
  totalLessons: number;
  completedLessons: number;
  durationMinutes: number;
  xpReward: number;
  progress: number;
  lessons: DrawerLessonItem[];
}

export function ModuleDrawer(props: ModuleDrawerProps) {
  const { t } = useTranslation();
  const {
    open, onOpenChange, moduleId, index, title, theme, description,
    icon, state, level, totalLessons, completedLessons, durationMinutes,
    xpReward, progress, lessons,
  } = props;

  const ctaLabel =
    state === 'locked'    ? t('curriculum.drawer.locked_cta') :
    state === 'completed' ? t('curriculum.drawer.completed_cta') :
    progress > 0          ? t('curriculum.drawer.continue_cta') :
                            t('curriculum.drawer.start_cta');

  // Resolve the canonical lesson route via the content registry. Same rule
  // as the Catalogue : send the user to the first not-yet-completed lesson
  // of the module — never to `/cours/${moduleId}`, which lands on
  // "Cours introuvable" because moduleId is not a content key.
  const progressMap = readCourseProgressMap();
  const completedIds = new Set(
    Object.entries(progressMap)
      .filter(([, p]) => p?.completed)
      .map(([id]) => id),
  );
  const entryLesson = getEntryLessonForModule(moduleId, completedIds);
  const ctaHref = entryLesson ? `/cours/${entryLesson.lessonId}` : `/cours/${moduleId}`;

  const renderHeroIcon = () => {
    if (state === 'locked') return <Lock className="h-9 w-9 text-ink-400" />;
    if (state === 'completed') return <Check className="h-9 w-9 text-success-600" strokeWidth={3} />;
    const Icon = icon;
    return <Icon className="h-9 w-9 text-cia-blue-700" strokeWidth={2.2} />;
  };

  const isOpenable = state === 'available' || state === 'current';
  const isLockedState = state === 'locked';
  const isCompletedState = state === 'completed';
  const nextLessonIdx = lessons.findIndex((l) => !l.completed);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-center pb-2">
          {/* Hero icon : fond bleu pur charte v2 (gradient or → bleu interdit) */}
          <div className="mx-auto h-20 w-20 rounded-2xl bg-cia-blue-50 dark:bg-cia-blue-900/40 flex items-center justify-center mb-3 shadow-md">
            {renderHeroIcon()}
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <Badge variant="level">{level}</Badge>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t('curriculum.module')} {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          <DrawerTitle className="font-display text-2xl text-center">{title}</DrawerTitle>

          {theme && (
            <DrawerDescription className="text-center text-base mt-1">
              {theme}
            </DrawerDescription>
          )}
        </DrawerHeader>

        <div className="px-6 py-4 space-y-4">
          {description && (
            <p className="text-sm text-foreground/85 leading-relaxed">{description}</p>
          )}

          {/* Suivi d'avancement — toujours visible, même à 0 % */}
          <div
            className={`rounded-2xl p-4 border ${
              isCompletedState
                ? 'bg-success-50 dark:bg-success-900/30 border-success-200/60 dark:border-success-700/40'
                : 'bg-cia-blue-50 dark:bg-cia-blue-900/30 border-cia-blue-100 dark:border-cia-blue-800/50'
            }`}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-semibold">
                {t('curriculum.drawer.lessons_done', {
                  done: completedLessons,
                  total: totalLessons,
                  defaultValue: '{{done}} / {{total}} leçons terminées',
                })}
              </span>
              {isCompletedState ? (
                <span className="text-xs font-bold uppercase tracking-wider text-success-600 dark:text-success-400 inline-flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  {t('curriculum.drawer.completed_badge', { defaultValue: 'Terminé' })}
                </span>
              ) : (
                <span className="text-sm font-display font-bold tabular-nums text-cia-blue-700 dark:text-cia-blue-300">
                  {progress}%
                </span>
              )}
            </div>
            <div className="h-2 bg-white/60 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isCompletedState ? 'bg-success-500' : 'bg-cia-blue-500'
                }`}
                style={{ width: `${Math.max(progress, isCompletedState ? 100 : 0)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <BookOpen className="h-4 w-4 mx-auto mb-1 text-cia-blue-500" />
              <div className="font-display font-bold tabular-nums">
                {completedLessons}<span className="text-muted-foreground">/{totalLessons}</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('curriculum.drawer.lessons')}</div>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-cia-blue-500" />
              <div className="font-display font-bold tabular-nums">{durationMinutes}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('curriculum.drawer.minutes')}</div>
            </div>
            {/* Carte XP : fond bleu charte + dot micro-gradient `g-sun` charte v2 §3
                (or autorisé uniquement via micro-gradient, pas en aplat). */}
            <div className="bg-cia-blue-50 dark:bg-cia-blue-900/40 rounded-xl p-3 text-center relative">
              <div className="h-4 w-4 mx-auto mb-1 rounded-full bg-g-sun flex items-center justify-center shadow-sm">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
              <div className="font-display font-bold text-cia-blue-700 dark:text-cia-blue-300 tabular-nums">+{xpReward}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">XP</div>
            </div>
          </div>

          {lessons.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">
                {t('curriculum.drawer.lessons_list', { defaultValue: 'Leçons du module' })}
              </h3>
              <ul className="max-h-[260px] overflow-y-auto pr-1 -mr-1 space-y-1.5">
                {lessons.map((l, i) => {
                  const isNext = !isLockedState && i === nextLessonIdx;
                  return (
                    <li
                      key={l.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                        l.completed
                          ? 'bg-success-50/60 dark:bg-success-900/20 border-success-200/50 dark:border-success-800/40'
                          : isNext
                            ? 'bg-cia-blue-50 dark:bg-cia-blue-900/30 border-cia-blue-200 dark:border-cia-blue-700 ring-1 ring-cia-blue-500/30'
                            : isLockedState
                              ? 'bg-muted/40 border-transparent opacity-60'
                              : 'bg-card border-border/50'
                      }`}
                    >
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground w-5 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className={`flex-1 truncate ${l.completed ? 'text-foreground/80' : 'text-foreground'}`}>
                        {l.title}
                      </span>
                      {l.completed ? (
                        <Check className="h-4 w-4 shrink-0 text-success-600" strokeWidth={3} />
                      ) : isNext ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cia-blue-700 dark:text-cia-blue-300">
                          <Play className="h-3.5 w-3.5 fill-current" />
                          {t('curriculum.drawer.next_lesson', { defaultValue: 'Prochaine' })}
                        </span>
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <DrawerFooter className="pt-2">
          {state === 'locked' ? (
            <Button variant="outline" disabled className="w-full">
              <Lock className="h-4 w-4 mr-2" /> {ctaLabel}
            </Button>
          ) : (
            /* CTA primaire : bleu 3D charte (variant default), pas de gradient or */
            <Button asChild size="cta" className="w-full">
              <Link
                to={ctaHref}
                onClick={() => onOpenChange(false)}
                className="gap-2"
              >
                {ctaLabel} <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px]" />
              </Link>
            </Button>
          )}

          <DrawerClose asChild>
            <Button variant="ghost" size="sm">{t('curriculum.drawer.close')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
