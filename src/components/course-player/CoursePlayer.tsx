import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { X, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import type { CourseContent, CourseStep } from '@/data/course-content';
import { LessonStep } from './LessonStep';
import { QCMStep } from './QCMStep';
import { FillBlankStep } from './FillBlankStep';
import { DragDropStep } from './DragDropStep';
import { FlashcardStep } from './FlashcardStep';
import { ListeningStep } from './ListeningStep';
import { FinalQuizStep } from './FinalQuizStep';
import {
  readCoursePlayerProgress,
  writeCoursePlayerProgress,
  clearCoursePlayerProgress,
} from '@/lib/courseProgress';
import { Spark } from '@/components/spark/Spark';
import { SparkMini } from '@/components/spark/SparkMini';
import type { SparkMood } from '@/components/spark/Spark';
import { useUserProgress } from '@/hooks/useUserProgress';
import { levelUpSequence } from '@/lib/confetti';

interface Props {
  content: CourseContent;
  courseTitle: string;
  onExit: () => void;
  onComplete: (score: number) => void;
}

interface SavedProgress {
  step: number;
  correctCount: number;
  totalQuestions: number;
}

interface FeedbackBubble {
  text: string;
  mood: 'encouraging' | 'sad';
}

const MOOD_RESET_DELAY = 1500;
const BUBBLE_LIFETIME = 1800;

function loadProgress(courseId: string): SavedProgress {
  const parsed = readCoursePlayerProgress(courseId);
  if (parsed) {
    return {
      step: parsed.step ?? 0,
      correctCount: parsed.correctCount ?? 0,
      totalQuestions: parsed.totalQuestions ?? 0,
    };
  }
  return { step: 0, correctCount: 0, totalQuestions: 0 };
}

function saveProgress(courseId: string, progress: SavedProgress) {
  writeCoursePlayerProgress(courseId, progress);
}

export function CoursePlayer({ content, courseTitle, onExit, onComplete }: Props) {
  const { t } = useTranslation();
  const { cecrLevel } = useUserProgress();
  const reduced = useReducedMotion();
  const saved = loadProgress(content.courseId);
  const [currentStep, setCurrentStep] = useState(Math.min(saved.step, content.steps.length - 1));
  const [correctCount, setCorrectCount] = useState(saved.correctCount);
  const [totalQuestions, setTotalQuestions] = useState(saved.totalQuestions);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [mascotMood, setMascotMood] = useState<SparkMood>('idle');
  const [bubble, setBubble] = useState<FeedbackBubble | null>(null);
  const [scoreBump, setScoreBump] = useState(0);

  const moodTimerRef = useRef<number | null>(null);
  const bubbleTimerRef = useRef<number | null>(null);

  const step = content.steps[currentStep];
  const totalSteps = content.steps.length;
  const progressPct = completed
    ? 100
    : ((currentStep + (totalQuestions > 0 ? 0.5 : 0)) / totalSteps) * 100;
  const xpPreview = useMemo(() => correctCount * 5, [correctCount]);

  /* Persist progress + cleanup timers on unmount */
  useEffect(() => {
    if (!completed) {
      saveProgress(content.courseId, { step: currentStep, correctCount, totalQuestions });
    }
  }, [currentStep, correctCount, totalQuestions, content.courseId, completed]);

  useEffect(() => {
    return () => {
      if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
      if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  /* Mood auto-reset : 1.5 s après un mood non-idle (charte §2) */
  useEffect(() => {
    if (mascotMood === 'idle' || completed) return;
    if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
    moodTimerRef.current = window.setTimeout(() => {
      setMascotMood('idle');
    }, MOOD_RESET_DELAY);
    return () => {
      if (moodTimerRef.current) window.clearTimeout(moodTimerRef.current);
    };
  }, [mascotMood, completed]);

  /* Confetti at completion (palette LEVELUP_BLUE_WHITE — charte §8) */
  useEffect(() => {
    if (completed) {
      levelUpSequence();
    }
  }, [completed]);

  /* P0.1 — Lock body scroll while the player is mounted, so there's no
     double scroll with the marketing page underneath that bleeds through. */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const showBubble = (text: string, mood: 'encouraging' | 'sad') => {
    setBubble({ text, mood });
    if (bubbleTimerRef.current) window.clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = window.setTimeout(() => setBubble(null), BUBBLE_LIFETIME);
  };

  const handleNext = (correct?: boolean) => {
    const newCorrect = correctCount + (correct === true ? 1 : 0);
    const newTotal = totalQuestions + (correct !== undefined ? 1 : 0);

    if (correct !== undefined) {
      setTotalQuestions(newTotal);
      if (correct) {
        setCorrectCount(newCorrect);
        setScoreBump((b) => b + 1);
        setMascotMood('encouraging');
        showBubble(t('player.bubbleCorrect'), 'encouraging');
      } else {
        setMascotMood('sad');
        showBubble(t('player.bubbleWrong'), 'sad');
      }
    }

    if (currentStep + 1 >= totalSteps) {
      const score = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 100;
      clearCoursePlayerProgress(content.courseId);
      setFinalScore(score);
      setDurationSeconds(Math.floor((Date.now() - startedAt) / 1000));
      setCompleted(true);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const renderStep = (s: CourseStep) => {
    switch (s.type) {
      case 'lesson': return <LessonStep step={s} onNext={() => handleNext()} />;
      case 'qcm': return <QCMStep step={s} onNext={(c) => handleNext(c)} />;
      case 'fill-blank': return <FillBlankStep step={s} onNext={(c) => handleNext(c)} />;
      case 'drag-drop': return <DragDropStep step={s} onNext={(c) => handleNext(c)} />;
      case 'flashcard': return <FlashcardStep step={s} onNext={() => handleNext()} />;
      case 'listening': return <ListeningStep step={s} onNext={(c) => handleNext(c)} />;
      case 'final-quiz': return <FinalQuizStep step={s} onNext={(c) => handleNext(c)} />;
      default: return null;
    }
  };

  /* ===== STAGE animations ===== */
  const stepVariants = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.2 } },
        exit:    { opacity: 0, transition: { duration: 0.15 } },
      }
    : {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
        exit:    { opacity: 0, x: -40, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
      };

  /* P0.1 — Portal to `document.body` so the player escapes the
     transformed stacking context created by AppLayout's pageTransition
     wrapper (which clamps `position: fixed` and lets the marketing
     footer bleed through). Combined with body scroll lock above. */
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-background flex flex-col lg:flex-row overflow-hidden"
      style={{ isolation: 'isolate', height: '100dvh' }}
    >
      {/* ===== MOBILE top bar (sticky) ===== */}
      <header
        className="lg:hidden shrink-0 z-20 bg-card/95 backdrop-blur-md border-b border-ink-100 px-4 pt-safe pb-3 flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          aria-label={t('player.exit')}
          className="shrink-0 mt-3"
        >
          <X className="h-5 w-5" />
        </Button>
        <p className="flex-1 min-w-0 mt-3 truncate font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">
          {courseTitle}
        </p>
      </header>

      {/* ===== DESKTOP sidebar + main ===== */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 lg:overflow-hidden">
        {/* Sidebar desktop (col-span-3) */}
        <aside
          className="hidden lg:flex lg:col-span-3 bg-cia-blue-500 text-white flex-col items-center justify-between p-6 sticky top-0 h-screen"
          aria-label="Tableau de bord de leçon"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            aria-label={t('player.exit')}
            className="self-start text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/40"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Spark + score */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Spark
                mood={completed ? 'celebrating' : mascotMood}
                size={80}
                halo
                embers={completed}
              />
              {/* Bulle contextuelle au feedback */}
              <AnimatePresence>
                {bubble && (
                  <motion.div
                    key={bubble.text}
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    className="absolute -top-2 left-full ml-3 max-w-[180px] bg-white text-foreground border-2 border-cia-spark-mid/30 rounded-2xl px-3 py-2 shadow-elev-lg"
                  >
                    <p className="text-xs font-semibold leading-snug whitespace-nowrap">
                      {bubble.text}
                    </p>
                    <span
                      aria-hidden="true"
                      className="absolute top-3 -left-[7px] h-3 w-3 rotate-45 bg-white border-l-2 border-b-2 border-cia-spark-mid/30"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/70">{t('player.sparkLabel')}</p>

            {/* Score session */}
            <div className="text-center mt-2">
              <motion.p
                key={`score-${scoreBump}`}
                initial={reduced ? false : { scale: 0.92, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                className="font-display font-extrabold text-3xl tabular-nums text-white drop-shadow-[0_2px_8px_hsl(var(--cia-blue-900)/0.4)]"
              >
                +{xpPreview}
              </motion.p>
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/70 mt-1">
                {t('player.xpEarned')}
              </p>
            </div>
          </div>

          {/* Progress bar — bg-g-shine charte §6 */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-[.2em] text-white/70">
              <span>{t('player.step')}</span>
              <span className="tabular-nums">
                {Math.min(currentStep + 1, totalSteps)} / {totalSteps}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-g-shine"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="text-[10px] uppercase tracking-[.2em] text-white/60 truncate font-mono">
              {courseTitle}
            </p>
          </div>
        </aside>

        {/* Main zone step */}
        <main className="lg:col-span-9 flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="px-4 py-6 lg:px-8 lg:py-12 max-w-3xl mx-auto w-full pb-[180px] lg:pb-12">
            <AnimatePresence mode="wait" initial={false}>
              {!completed && step && (
                <motion.div
                  key={step.id}
                  initial={stepVariants.initial}
                  animate={stepVariants.animate}
                  exit={stepVariants.exit}
                >
                  {renderStep(step)}
                </motion.div>
              )}

              {completed && (
                <motion.div
                  key="completion"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <CompletionScreen
                    courseTitle={courseTitle}
                    score={finalScore}
                    totalSteps={totalSteps}
                    durationSeconds={durationSeconds}
                    correctCount={correctCount}
                    totalQuestions={totalQuestions}
                    onContinue={() => onComplete(finalScore)}
                    onExit={onExit}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ===== MOBILE bottom dock ===== */}
      {!completed && (
        <div
          className="lg:hidden shrink-0 relative z-30 bg-cia-blue-500 text-white rounded-t-2xl shadow-elev-lg px-4 pt-3 pb-safe"
          aria-label="Tableau de bord de leçon"
        >
          {/* Bulle de feedback ancrée au-dessus du Spark */}
          <AnimatePresence>
            {bubble && (
              <motion.div
                key={bubble.text}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="absolute -top-12 left-4 max-w-[70%] bg-white text-foreground border-2 border-cia-spark-mid/30 rounded-2xl px-3 py-2 shadow-elev-lg"
              >
                <p className="text-xs font-semibold leading-snug">{bubble.text}</p>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[7px] left-6 h-3 w-3 rotate-45 bg-white border-r-2 border-b-2 border-cia-spark-mid/30"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <motion.div
              animate={mascotMood === 'idle' ? { scale: 1 } : { scale: [1, 1.15, 1] }}
              transition={{ duration: 0.5 }}
              className="shrink-0"
            >
              <Spark mood={mascotMood} size={52} halo />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[.2em] text-white/70 mb-1.5">
                <span className="tabular-nums">
                  {t('player.step')} {Math.min(currentStep + 1, totalSteps)} / {totalSteps}
                </span>
                <motion.span
                  key={`m-score-${scoreBump}`}
                  initial={reduced ? false : { scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                  className="font-display font-extrabold text-sm text-white tabular-nums"
                >
                  +{xpPreview} XP
                </motion.span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-g-shine"
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function CompletionScreen({
  courseTitle, score, totalSteps, durationSeconds, correctCount, totalQuestions, onContinue, onExit,
}: {
  courseTitle: string;
  score: number;
  totalSteps: number;
  durationSeconds: number;
  correctCount: number;
  totalQuestions: number;
  onContinue: () => void;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const xpEarned = Math.max(5, Math.round(score * 5));
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const formattedTime = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="max-w-xl mx-auto text-center space-y-8 py-8">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="mx-auto h-24 w-24 rounded-full bg-cia-blue-500 flex items-center justify-center shadow-glow-blue"
      >
        <Trophy className="h-12 w-12 text-white" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="font-display font-extrabold text-3xl tracking-[-0.01em]">
          {t('player.completion.title')}
        </h2>
        <p className="text-muted-foreground">{courseTitle}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', damping: 13, stiffness: 200 }}
        className="flex justify-center"
      >
        <Spark mood="celebrating" size={120} halo embers />
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-ink-100 shadow-elev-lg">
          <p className="font-display font-extrabold text-2xl tabular-nums text-cia-blue-700">
            +{xpEarned}
          </p>
          <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mt-1 font-mono">
            XP
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-ink-100 shadow-elev-lg">
          <p className="font-display font-extrabold text-2xl tabular-nums text-cia-blue-700">
            {totalQuestions > 0 ? `${correctCount}/${totalQuestions}` : totalSteps}
          </p>
          <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mt-1 font-mono">
            {totalQuestions > 0 ? t('player.completion.correct') : t('player.completion.steps')}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-ink-100 shadow-elev-lg">
          <p className="font-display font-extrabold text-2xl tabular-nums text-cia-blue-700">
            {formattedTime}
          </p>
          <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground mt-1 font-mono">
            {t('player.completion.time')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button size="cta" onClick={onContinue} className="gap-2">
          {t('player.completion.next_course')} <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onExit} className="gap-2">
          <RotateCcw className="h-4 w-4" /> {t('player.completion.back_catalogue')}
        </Button>
      </div>
    </div>
  );
}
