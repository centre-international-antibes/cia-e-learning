import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, FileText, Headphones, Video, BookOpen, Mic, Play, Trophy, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { LevelBadge } from '@/components/courses/LevelBadge';
import { demoCourses } from '@/data/demo-courses';
import { getCourseContent } from '@/data/course-content';
import { getLessonById, curriculum } from '@/data/curriculum';
import { getEntryLessonForModule, getRegistryModule } from '@/data/contentRegistry';
import { useCurriculumI18n } from '@/lib/curriculumI18n';
import { CoursePlayer } from '@/components/course-player/CoursePlayer';
import { useUserProgress, isLevelAccessible } from '@/hooks/useUserProgress';
import { useAuth } from '@/hooks/useAuth';
import { getNewlyUnlockedModules, isModuleComplete, computeLevelFromProgress } from '@/hooks/useModuleUnlock';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { getDailyLesson } from '@/lib/dailyChallenge';
import { readCourseProgressMap, writeCourseProgressMap, setLastLessonOpened } from '@/lib/courseProgress';
import { upsertLessonProgress } from '@/lib/lessonProgressSync';
import { toast } from 'sonner';
import { notify } from '@/lib/notify';

const contentTypeIcons: Record<string, { i18nKey: string; icon: React.ElementType }> = {
  text:         { i18nKey: 'courseDetail.contentType.text',       icon: FileText },
  audio:        { i18nKey: 'courseDetail.contentType.audio',      icon: Headphones },
  video:        { i18nKey: 'courseDetail.contentType.video',      icon: Video },
  qcm:          { i18nKey: 'courseDetail.contentType.qcm',        icon: BookOpen },
  'drag-drop':  { i18nKey: 'courseDetail.contentType.dragDrop',   icon: BookOpen },
  'fill-blank': { i18nKey: 'courseDetail.contentType.fillBlank',  icon: FileText },
  flashcard:    { i18nKey: 'courseDetail.contentType.flashcard',  icon: BookOpen },
  voice:        { i18nKey: 'courseDetail.contentType.voice',      icon: Mic },
  lesson:       { i18nKey: 'courseDetail.contentType.lesson',     icon: FileText },
  listening:    { i18nKey: 'courseDetail.contentType.listening',  icon: Headphones },
  'final-quiz': { i18nKey: 'courseDetail.contentType.finalQuiz',  icon: Trophy },
};

export default function CourseDetail() {
  const { t } = useTranslation();
  const ci = useCurriculumI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  // Le défi du jour autorise tous les niveaux, sans restriction d'accès.
  const isDailyChallenge = searchParams.get('daily') === '1';
  
  // Failsafe : older surfaces may still link to `/cours/${moduleId}` (e.g.
  // `A1.1`). Resolve those to the canonical first lesson of the module so
  // we never land on the misleading "Cours introuvable" screen.
  const moduleEntry = id ? getRegistryModule(id) : undefined;
  useEffect(() => {
    if (!moduleEntry) return;
    const entry = getEntryLessonForModule(moduleEntry.moduleId);
    if (entry) {
      const next = `/cours/${entry.lessonId}${isDailyChallenge ? '?daily=1' : ''}`;
      navigate(next, { replace: true });
    }
  }, [moduleEntry, navigate, isDailyChallenge]);

  // Check if this is a curriculum lesson (lesson-N) or a legacy demo course
  const isCurriculumLesson = id?.startsWith('lesson-');
  const lessonId = isCurriculumLesson ? parseInt(id!.replace('lesson-', '')) : null;
  const curriculumData = lessonId ? getLessonById(lessonId) : null;

  const course = isCurriculumLesson ? null : demoCourses.find((c) => c.id === id);
  const content = id ? getCourseContent(id) : undefined;
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const { cecrLevel, addXP, setLevel } = useUserProgress();
  const { markDoneToday } = useDailyChallenge();
  const { user, isLoading: authLoading } = useAuth();

  // Build a virtual course object for curriculum lessons
  const displayCourse = course || (curriculumData ? {
    id: id!,
    code: `${curriculumData.module.id}-${String(curriculumData.lesson.id).padStart(3, '0')}`,
    title: ci.lessonTitle(curriculumData.lesson.id, curriculumData.lesson.title),
    description: ci.lessonDescription(curriculumData.lesson.id, curriculumData.lesson.description),
    level: curriculumData.level.level,
    theme: ci.moduleTheme(curriculumData.module.id, curriculumData.module.theme),
    duration: 10,
    isNew: false,
    imageUrl: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?w=800&h=500&fit=crop&q=80',
    contentTypes: ['text', 'qcm', 'fill-blank'] as const,
  } : null);

  if (!displayCourse) {
    return (
      <div className="container py-16 text-center">
        <p className="text-lg text-muted-foreground">{t('courseDetail.notFound')}</p>
        <Link to="/programme">
          <Button variant="outline" className="mt-4">{t('courseDetail.backToProgramme')}</Button>
        </Link>
      </div>
    );
  }

  const locked = !isDailyChallenge && !isLevelAccessible(displayCourse.level, cecrLevel);

  if (playing && content && !locked) {
    return (
      <CoursePlayer
        content={content}
        courseTitle={displayCourse.title}
        onExit={() => setPlaying(false)}
        onComplete={async (score) => {
          setFinalScore(score);
          setPlaying(false);

          // Save progress
          const progress = readCourseProgressMap();
          progress[displayCourse.id] = { score, completed: true, date: new Date().toISOString() };
          writeCourseProgressMap(progress);

          // Award XP based on score
          const xpEarned = Math.max(5, Math.round(score * 5));
          const { leveledUp, newLevel } = await addXP(xpEarned, 'course_completion', displayCourse.id);
          notify.xp(xpEarned, t('courseDetail.completedToast'));

          // Daily challenge bonus :
          // - soit la leçon ouverte EST la leçon du jour pour son niveau (entrée naturelle depuis le programme),
          // - soit elle a été lancée explicitement via le défi du jour (?daily=1), peu importe le niveau choisi.
          const daily = getDailyLesson(displayCourse.level);
          const isDailyMatch = daily && daily.lessonId === displayCourse.id;
          if (isDailyChallenge || isDailyMatch) {
            const res = await markDoneToday();
            if (res.awarded) {
              setTimeout(() => notify.streak(res.newStreak, res.xp), 600);
            } else if (isDailyChallenge) {
              setTimeout(() => {
                toast(t('courseDetail.dailyAlreadyDone'), { duration: 4000 });
              }, 600);
            }
          }

          // Check if a module was just completed and unlock notifications
          if (curriculumData) {
            const mod = curriculumData.module;
            if (isModuleComplete(mod)) {
              // Badge earned toast
              notify.badge(mod.badge, mod.badgeEmoji);

              // Check newly unlocked modules
              const unlocked = getNewlyUnlockedModules(mod.id);
              for (const u of unlocked) {
                setTimeout(() => notify.unlock(`${u.id} — ${u.title}`, u.badgeEmoji), 1500);
              }

              // Update CECR level based on progress
              const newComputedLevel = computeLevelFromProgress();
              if (newComputedLevel !== cecrLevel) {
                await setLevel(newComputedLevel);
                notify.levelUp(newComputedLevel);
              }
            }
          }

          // Redirect after completion : retour au défi du jour si on y vient,
          // sinon retour au programme/module concerné.
          const moduleId = curriculumData?.module?.id;
          setTimeout(() => {
            if (isDailyChallenge) {
              navigate('/defi-du-jour');
            } else {
              navigate(moduleId ? `/programme?module=${moduleId}` : '/programme');
            }
          }, 1500);
        }}
      />
    );
  }

  // Check saved progress
  const savedProgress = readCourseProgressMap();
  const courseProgress = savedProgress[displayCourse.id];
  const displayScore = completed ? finalScore : courseProgress?.score;
  const isCompleted = completed || courseProgress?.completed;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={displayCourse.imageUrl} alt={displayCourse.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground">
          <div className="container">
            <Link to="/programme" className="inline-flex items-center gap-1 text-sm opacity-80 hover:opacity-100 mb-3">
              <ArrowLeft className="h-4 w-4" /> {t('nav.curriculum')}
            </Link>
            <div className="flex items-center gap-2 mb-2">
              <LevelBadge level={displayCourse.level} />
              <Badge variant="outline" className="text-primary-foreground border-primary-foreground/30">
                {displayCourse.theme}
              </Badge>
              {displayCourse.isNew && <Badge className="bg-accent text-accent-foreground">{t('course.new')}</Badge>}
              {locked && <Badge className="bg-destructive text-destructive-foreground">🔒 {t('courseDetail.lockedBadge')}</Badge>}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{displayCourse.title}</h1>
            <p className="text-sm font-mono opacity-70 mt-1">{displayCourse.code}</p>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Locked banner */}
            {locked && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-cia-gold-50 border-2 border-cia-gold-200 dark:bg-cia-gold-900 dark:border-cia-gold-800">
                <Lock className="h-8 w-8 text-cia-gold-600" />
                <div>
                  <p className="font-bold text-cia-gold-700 dark:text-cia-gold-400">{t('courseDetail.lockedTitle')}</p>
                  <p className="text-sm text-cia-gold-600 dark:text-cia-gold-500">
                    {t('courseDetail.lockedDescription', { required: displayCourse.level, current: cecrLevel })}
                  </p>
                </div>
              </div>
            )}

            {/* Completed banner */}
            {!locked && isCompleted && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-success-50 border-2 border-success-100 dark:bg-success-700 dark:border-success-700">
                <Trophy className="h-8 w-8 text-success-600" />
                <div>
                  <p className="font-bold text-success-700 dark:text-success-500">{t('courseDetail.completedTitle')}</p>
                  <p className="text-sm text-success-600 dark:text-success-500">{t('courseDetail.scoreLabel', { score: displayScore })}</p>
                </div>
              </div>
            )}

            <Card>
              <CardHeader><CardTitle>{t('courseDetail.descriptionTitle')}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{displayCourse.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('courseDetail.contentTitle')}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {content ? (
                    content.steps.map((s, i) => {
                      const typeInfo = contentTypeIcons[s.type];
                      const Icon = typeInfo?.icon ?? BookOpen;
                      const typeLabel = typeInfo ? t(typeInfo.i18nKey) : s.type;
                      return (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {i + 1}
                          </span>
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{s.title}</span>
                          <Badge variant="outline" className="ml-auto text-xs">{typeLabel}</Badge>
                        </div>
                      );
                    })
                  ) : (
                    displayCourse.contentTypes.map((type) => {
                      const info = contentTypeIcons[type];
                      if (!info) return null;
                      const Icon = info.icon;
                      return (
                        <div key={type} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{t(info.i18nKey)}</span>
                          <Badge variant="outline" className="ml-auto text-xs">{t('courseDetail.comingSoon')}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                {locked ? (
                  <Button size="lg" className="w-full gap-2" disabled>
                    <Lock className="h-4 w-4" /> {t('courseDetail.levelRequired', { level: displayCourse.level })}
                  </Button>
                ) : content ? (
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => {
                      if (!authLoading && !user) {
                        const redirect = `/cours/${displayCourse.id}${isDailyChallenge ? '?daily=1' : ''}`;
                        toast(t('courseDetail.loginRequired', { defaultValue: 'Connecte-toi pour commencer le cours' }));
                        navigate(`/connexion?redirect=${encodeURIComponent(redirect)}`);
                        return;
                      }
                      setLastLessonOpened({
                        courseId: displayCourse.id,
                        moduleId: curriculumData?.module?.id,
                        title: displayCourse.title,
                        level: displayCourse.level,
                      });
                      setPlaying(true);
                    }}
                  >
                    <Play className="h-4 w-4" />
                    {isCompleted
                      ? t('courseDetail.redo')
                      : courseProgress
                        ? t('courseDetail.continue')
                        : t('courseDetail.start')}
                  </Button>
                ) : (
                  <Button size="lg" className="w-full gap-2" disabled>
                    <Play className="h-4 w-4" /> {t('courseDetail.comingSoonCta')}
                  </Button>
                )}
                {content && !locked && (
                  <p className="text-xs text-muted-foreground text-center">
                    {t('courseDetail.stepsCount', { count: content.steps.length })}
                  </p>
                )}
                {displayScore !== undefined && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('courseDetail.score')}</span>
                      <span className="font-medium">{displayScore}/100</span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {t('courseDetail.estimatedDuration', { minutes: displayCourse.duration })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
