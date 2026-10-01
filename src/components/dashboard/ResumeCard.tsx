import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Play, RotateCcw, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { LastLessonView } from '@/hooks/useLastLessonOpened';
import { readCoursePlayerProgress } from '@/lib/courseProgress';
import { useCurriculumI18n } from '@/lib/curriculumI18n';

interface Props {
  lastLesson: LastLessonView | null;
}

const HOVER = { y: -4, scale: 1.005 };
const TAP = { scale: 0.98 };

export function ResumeCard({ lastLesson }: Props) {
  const { t } = useTranslation();
  const ci = useCurriculumI18n();
  const reduced = useReducedMotion();
  const hoverProps = reduced ? {} : { whileHover: HOVER, whileTap: TAP };

  if (!lastLesson) {
    // New learner empty state — CTA to placement test
    return (
      <motion.div {...hoverProps} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
        <Card className="shadow-elev-lg p-7 md:p-8 h-full flex flex-col gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[.2em] text-cia-blue-500">
            {t('dashboard.resume.tag_start')}
          </p>
          <div className="flex-1">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-cia-blue-900 dark:text-foreground tracking-[-0.01em]">
              {t('dashboard.resume.empty_title')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t('dashboard.resume.empty_desc')}
            </p>
          </div>
          <Button asChild size="cta" className="self-start gap-2 group">
            <Link to="/test-niveau">
              <Sparkles className="h-4 w-4" />
              {t('dashboard.resume.empty_cta')}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px]" />
            </Link>
          </Button>
        </Card>
      </motion.div>
    );
  }

  // Compute lesson-internal progress
  const playerProgress = readCoursePlayerProgress(lastLesson.courseId);
  const totalQuestions = playerProgress?.totalQuestions ?? 0;
  const step = playerProgress?.step ?? 0;
  const progressPct = lastLesson.completed
    ? 100
    : totalQuestions > 0
      ? Math.min(100, Math.round((step / Math.max(totalQuestions, 1)) * 100))
      : 0;

  const ctaLabel = lastLesson.completed
    ? t('dashboard.resume.replay')
    : progressPct > 0
      ? t('dashboard.resume.continue')
      : t('dashboard.resume.start');

  const Icon = lastLesson.completed ? RotateCcw : Play;

  const lessonNumericId = (() => {
    const m = lastLesson.courseId?.match(/lesson-(\d+)/);
    return m ? Number(m[1]) : undefined;
  })();
  const translatedTitle = lessonNumericId
    ? ci.lessonTitle(lessonNumericId, lastLesson.title)
    : lastLesson.title;

  return (
    <motion.div {...hoverProps} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
      <Card className="shadow-elev-lg p-7 md:p-8 h-full flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[.2em] text-cia-blue-500">
            {t('dashboard.resume.tag_resume')}
          </p>
          {lastLesson.level && (
            <Badge variant="level" className="shrink-0">
              {lastLesson.level}
            </Badge>
          )}
        </div>

        <div className="flex-1">
          <h2 className="font-display font-extrabold text-xl md:text-2xl leading-snug">
            {translatedTitle}
          </h2>
          {lastLesson.moduleId && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard.resume.module_label')} {lastLesson.moduleId}
            </p>
          )}
        </div>

        {progressPct > 0 && !lastLesson.completed && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{t('dashboard.resume.progress_label')}</span>
              <span className="tabular-nums font-semibold text-foreground">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        {lastLesson.completed && lastLesson.score != null && (
          <div className="inline-flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('dashboard.resume.score_label')}</span>
            <span className="tabular-nums font-bold text-success-600">{lastLesson.score}/100</span>
          </div>
        )}

        <Button asChild size="cta" className="self-start gap-2 group">
          <Link to={`/cours/${lastLesson.courseId}`}>
            <Icon className="h-4 w-4" />
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px]" />
          </Link>
        </Button>
      </Card>
    </motion.div>
  );
}
