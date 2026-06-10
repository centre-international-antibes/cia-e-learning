import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RecommendedLesson } from '@/hooks/useRecommendedLessons';
import { useCurriculumI18n } from '@/lib/curriculumI18n';

interface Props {
  lessons: RecommendedLesson[];
}

export function RecommendedCarousel({ lessons }: Props) {
  const { t } = useTranslation();
  const ci = useCurriculumI18n();
  if (lessons.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-5">
        <h2 className="font-display font-extrabold text-2xl md:text-3xl">
          {t('dashboard.recommended.title')}
        </h2>
        <Link
          to="/catalogue"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-cia-blue-700 hover:text-cia-blue-900 transition-colors"
        >
          {t('dashboard.recommended.see_all')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map((lesson, i) => (
          <motion.div
            key={lesson.lessonId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.05 * i }}
          >
            <Card interactive className="p-5 h-full flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="level" className="shrink-0">{lesson.level}</Badge>
                <span className="text-2xl" aria-hidden="true">{lesson.badgeEmoji}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-base md:text-lg leading-tight">
                  {ci.lessonTitle(lesson.lessonId, lesson.title)}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {ci.lessonDescription(lesson.lessonId, lesson.description)}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-cia-blue-500">
                  <BookOpen className="h-3 w-3" />
                  {lesson.competence}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="self-start gap-2">
                <Link to={`/cours/lesson-${lesson.lessonId}`}>
                  {t('dashboard.recommended.start')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
