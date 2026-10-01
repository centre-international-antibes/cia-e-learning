import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotionConfig } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { X, Flame, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import type { CourseContent, CourseStep } from '@/data/course-content';
import { LessonStep } from './LessonStep';
import { QCMStep } from './QCMStep';
import { FillBlankStep } from './FillBlankStep';
import { DragDropStep } from './DragDropStep';
import { FlashcardStep } from './FlashcardStep';
import { ListeningStep } from './ListeningStep';
import { FinalQuizStep } from './FinalQuizStep';
import { CheckBar, type CheckBarMode } from './CheckBar';
import {
  StepControllerContext,
  type StepAnswer,
  type StepAnswerResult,
  type StepController,
  type StepPhase,
} from './step-controller';
import {
  currentStepIndex,
  initialPlayerState,
  isReplaying,
  lessonOutcome,
  playerReducer,
  type PlayerState,
} from './playerReducer';
import {
  readCoursePlayerProgress,
  writeCoursePlayerProgress,
  clearCoursePlayerProgress,
} from '@/lib/courseProgress';
import { Spark } from '@/components/spark/Spark';
import { SoundToggle } from '@/components/ui/sound-toggle';
import { RollingNumber } from '@/components/ui/rolling-number';
import { computeLessonXp } from '@/lib/xp/lessonXp';
import { countQuestions } from '@/lib/lessonSpec';
import { feedback, MAX_COMBO_STEP } from '@/lib/feedback';
import { useOptionalRewards } from '@/features/rewards';
import { levelUpSequence } from '@/lib/confetti';
import { spring, fade } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** Résultats remontés en fin de leçon. Aucun montant d'XP : le barème est
 *  appliqué par le serveur à partir de ces chiffres (cf. M2). */
export interface LessonResult {
  score: number;
  correct: number;
  questionCount: number;
  bestCombo: number;
}

interface Props {
  content: CourseContent;
  courseTitle: string;
  onExit: () => void;
  onComplete: (result: LessonResult) => void;
}

/** Étapes qui remontent juste/faux — même règle que `lib/lessonSpec`. */
const GRADED: ReadonlySet<CourseStep['type']> = new Set([
  'qcm',
  'fill-blank',
  'drag-drop',
  'listening',
  'final-quiz',
]);

/** Paliers où le combo se montre. */
const COMBO_MILESTONES = [3, 5, 10];

function loadProgress(courseId: string): Partial<PlayerState> {
  const parsed = readCoursePlayerProgress(courseId);
  // La sauvegarde vient du navigateur : on ne lui fait pas confiance au point
  // de la relire sans vérifier qu'elle a la forme attendue.
  const saved = parsed?.player as Partial<PlayerState> | undefined;
  if (!saved || typeof saved.mainIndex !== 'number' || !Array.isArray(saved.replayQueue)) {
    return {};
  }
  return saved;
}

export function CoursePlayer({ content, courseTitle, onExit, onComplete }: Props) {
  const { t } = useTranslation();
  const reduced = useReducedMotionConfig() ?? false;
  const totalSteps = content.steps.length;
  const config = useMemo(() => ({ totalSteps }), [totalSteps]);

  const [state, dispatch] = useReducer(
    (s: PlayerState, a: Parameters<typeof playerReducer>[1]) => playerReducer(s, a, config),
    undefined,
    () => initialPlayerState(loadProgress(content.courseId)),
  );

  const [phase, setPhase] = useState<StepPhase>('answering');
  const [result, setResult] = useState<StepAnswerResult | null>(null);
  const [modeOverride, setModeOverride] = useState<CheckBarMode | null>(null);
  const [comboFlash, setComboFlash] = useState<{ value: number; id: number } | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [finalResult, setFinalResult] = useState<LessonResult | null>(null);
  /** Hauteur réelle de la CheckBar, mesurée — safe-area comprise. */
  const [barHeight, setBarHeight] = useState(0);

  const answerRef = useRef<StepAnswer | null>(null);
  const continueHandlerRef = useRef<(() => void) | null>(null);
  const optionShortcutRef = useRef<((index: number) => void) | null>(null);
  const [ready, setReady] = useState(false);

  const stepIndex = currentStepIndex(state);
  const step = stepIndex !== null ? content.steps[stepIndex] : null;
  const graded = step ? GRADED.has(step.type) : false;
  const replaying = isReplaying(state);
  const completed = state.phase === 'done';

  const questionCount = useMemo(() => countQuestions(content.steps), [content.steps]);
  const xpPreview = useMemo(
    () =>
      computeLessonXp({
        correct: state.correctCount,
        questionCount,
        bestCombo: state.bestCombo,
      }).total,
    [state.correctCount, questionCount, state.bestCombo],
  );

  /* ── Le Director retient ses célébrations tant que la leçon tourne ── */
  const rewards = useOptionalRewards();
  const holdRef = useRef(false);
  useEffect(() => {
    if (!rewards) return;
    if (!completed && !holdRef.current) {
      holdRef.current = true;
      rewards.hold();
    }
    if (completed && holdRef.current) {
      holdRef.current = false;
      rewards.release();
    }
  }, [rewards, completed]);
  useEffect(
    () => () => {
      if (holdRef.current) {
        holdRef.current = false;
        rewards?.release();
      }
    },
    [rewards],
  );

  /* ── Sauvegarde de reprise : étape, score, combo et file de rejeu ── */
  useEffect(() => {
    if (completed) return;
    writeCoursePlayerProgress(content.courseId, {
      step: state.mainIndex,
      correctCount: state.correctCount,
      totalQuestions: state.answeredCount,
      combo: state.combo,
      bestCombo: state.bestCombo,
      player: state as unknown as Record<string, unknown>,
    });
  }, [state, content.courseId, completed]);

  /* ── Fin de leçon ── */
  useEffect(() => {
    if (!completed || finalResult) return;
    clearCoursePlayerProgress(content.courseId);
    setDurationSeconds(Math.floor((Date.now() - startedAt) / 1000));
    setFinalResult(lessonOutcome(state, questionCount));
    levelUpSequence();
  }, [completed, finalResult, content.courseId, startedAt, state, questionCount]);

  /* Remonter en haut à chaque étape, et verrouiller le scroll du fond */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: reduced ? 'auto' : 'smooth' });
  }, [stepIndex, state.phase, reduced]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /* ── Contrôleur d'étape ── */
  const setAnswer = useCallback((answer: StepAnswer | null) => {
    answerRef.current = answer;
    setReady(answer?.ready ?? false);
  }, []);
  const setContinueHandler = useCallback((handler: (() => void) | null) => {
    continueHandlerRef.current = handler;
  }, []);
  const setOptionShortcut = useCallback((handler: ((index: number) => void) | null) => {
    optionShortcutRef.current = handler;
  }, []);
  const resetPhase = useCallback(() => {
    setPhase('answering');
    setResult(null);
  }, []);

  const controller = useMemo<StepController>(
    () => ({
      phase,
      result,
      setAnswer,
      setContinueHandler,
      setOptionShortcut,
      resetPhase,
      setMode: setModeOverride,
    }),
    [phase, result, setAnswer, setContinueHandler, setOptionShortcut, resetPhase],
  );

  /* ── Valider ── */
  const handleCheck = useCallback(() => {
    const answer = answerRef.current;
    if (!answer?.ready || phase === 'revealed') return;
    const evaluated = answer.evaluate();
    setResult(evaluated);
    setPhase('revealed');

    if (evaluated.correct) {
      // La note monte avec la série : le son suit la progression de l'apprenant.
      const comboStep = replaying ? 0 : Math.min(state.combo, MAX_COMBO_STEP);
      feedback.correct(comboStep, { scope: 'player' });
    } else {
      feedback.wrong({ scope: 'player' });
    }

    if (!replaying && graded) {
      const nextCombo = evaluated.correct ? state.combo + 1 : 0;
      if (evaluated.correct && COMBO_MILESTONES.includes(nextCombo)) {
        setComboFlash({ value: nextCombo, id: Date.now() });
      }
      dispatch({
        type: 'answer',
        graded: true,
        correct: evaluated.correct,
        replayable: step?.type !== 'final-quiz',
      });
    }
  }, [phase, replaying, graded, state.combo, step?.type]);

  /* ── Continuer ── */
  const handleContinue = useCallback(() => {
    // Une étape à questions internes (quiz final) garde la main.
    if (continueHandlerRef.current) {
      continueHandlerRef.current();
      return;
    }
    answerRef.current = null;
    setReady(false);
    setPhase('answering');
    setResult(null);
    setModeOverride(null);
    dispatch({ type: 'advance' });
  }, []);

  /* ── Le badge de combo s'efface tout seul ── */
  useEffect(() => {
    if (!comboFlash) return;
    const timer = window.setTimeout(() => setComboFlash(null), 1500);
    return () => window.clearTimeout(timer);
  }, [comboFlash]);

  /* ── Clavier : Entrée valide / continue, 1–4 sélectionnent ── */
  useEffect(() => {
    if (completed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (phase === 'revealed') handleContinue();
        else if (mode === 'continue') handleContinue();
        else if (ready) handleCheck();
        return;
      }
      if (/^[1-4]$/.test(e.key) && phase === 'answering') {
        optionShortcutRef.current?.(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, phase, ready, handleCheck, handleContinue, modeOverride, graded]);

  const mode: CheckBarMode = modeOverride ?? (graded ? 'check' : 'continue');
  const mascotMood = result ? (result.correct ? 'celebrating' : 'encouraging') : 'idle';
  const goldProgress = comboFlash !== null && comboFlash.value >= 5;

  const onSelect = useCallback(() => feedback.select({ scope: 'player' }), []);

  const renderStep = (s: CourseStep) => {
    switch (s.type) {
      case 'lesson':
        return <LessonStep step={s} />;
      case 'qcm':
        return <QCMStep step={s} onSelect={onSelect} />;
      case 'fill-blank':
        return <FillBlankStep step={s} onSelect={onSelect} />;
      case 'drag-drop':
        return <DragDropStep step={s} onSelect={onSelect} />;
      case 'flashcard':
        return <FlashcardStep step={s} />;
      case 'listening':
        return <ListeningStep step={s} onSelect={onSelect} />;
      case 'final-quiz':
        return (
          <FinalQuizStep
            step={s}
            onSelect={onSelect}
            onFinish={() => {
              answerRef.current = null;
              setReady(false);
              setPhase('answering');
              setResult(null);
              setModeOverride(null);
              continueHandlerRef.current = null;
              dispatch({ type: 'advance' });
            }}
          />
        );
      default:
        return null;
    }
  };

  const stepVariants = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: fade.base } },
        exit: { opacity: 0, transition: { duration: fade.fast } },
      }
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0, transition: spring.snappy },
        exit: { opacity: 0, x: -24, transition: { duration: fade.fast } },
      };

  const progressBar = (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: goldProgress
            ? 'linear-gradient(90deg, hsl(var(--cia-gold-600)) 0%, hsl(var(--cia-gold-400)) 50%, hsl(var(--cia-gold-200)) 100%)'
            : 'linear-gradient(90deg, hsl(var(--cia-spark-deep)) 0%, hsl(var(--cia-spark-mid)) 60%, hsl(var(--cia-spark-light)) 100%)',
        }}
        initial={false}
        animate={{ width: `${state.progressPct}%` }}
        transition={reduced ? { duration: 0 } : spring.gentle}
      />
      {/* Un reflet traverse la barre à chaque bonne réponse. */}
      {!reduced && (
        <motion.div
          key={`shine-${state.correctCount}`}
          className="absolute inset-y-0 w-1/3"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.65) 50%, transparent 100%)',
          }}
          initial={{ x: '-100%' }}
          animate={{ x: '320%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}
    </div>
  );

  const comboBadge = (
    <AnimatePresence>
      {comboFlash && (
        <motion.div
          key={comboFlash.id}
          initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduced ? { duration: fade.fast } : spring.bouncy}
          className="pointer-events-none absolute -top-7 right-0 flex items-center gap-1 rounded-full bg-cia-gold-500 px-2.5 py-1 text-xs font-bold text-cia-blue-900 shadow-elev-lg"
        >
          <Flame className="h-3.5 w-3.5" aria-hidden />×{comboFlash.value}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background lg:flex-row"
      style={{ isolation: 'isolate', height: '100dvh' }}
    >
      {/* ===== MOBILE : barre haute (sortie, son, progression, XP) ===== */}
      <header className="z-20 shrink-0 border-b border-ink-100 bg-cia-blue-500 px-4 pb-3 pt-safe text-white lg:hidden">
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            aria-label={t('player.exit')}
            className="shrink-0 text-white hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
          <p className="min-w-0 flex-1 truncate font-mono text-[10px] uppercase tracking-[.2em] text-white/70">
            {courseTitle}
          </p>
          <SoundToggle scope="player" className="text-white hover:bg-white/10 hover:text-white" />
        </div>
        {!completed && (
          <div className="relative mt-2">
            {comboBadge}
            <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.2em] text-white/70">
              <span className="tabular-nums">{state.progressPct} %</span>
              <RollingNumber
                value={xpPreview}
                prefix="+"
                suffix=" XP"
                bump
                className="text-sm font-extrabold text-white"
              />
            </div>
            {progressBar}
          </div>
        )}
      </header>

      {/* ===== DESKTOP : colonne latérale ===== */}
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-12 lg:overflow-hidden">
        <aside
          className="sticky top-0 hidden h-screen flex-col items-center justify-between bg-cia-blue-500 p-6 text-white lg:col-span-3 lg:flex"
          aria-label={t('player.sparkLabel')}
        >
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={onExit}
              aria-label={t('player.exit')}
              className="text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/40"
            >
              <X className="h-5 w-5" />
            </Button>
            <SoundToggle scope="player" className="text-white hover:bg-white/10 hover:text-white" />
          </div>

          <div className="flex flex-col items-center gap-4">
            <Spark
              mood={completed ? 'celebrating' : mascotMood}
              size={80}
              halo
              embers={completed}
            />
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/70">
              {t('player.sparkLabel')}
            </p>
            <div className="mt-2 text-center">
              <RollingNumber
                value={xpPreview}
                prefix="+"
                bump
                className="text-3xl font-extrabold text-white drop-shadow-[0_2px_8px_hsl(var(--cia-blue-900)/0.4)]"
              />
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[.2em] text-white/70">
                {t('player.xpEarned')}
              </p>
            </div>
          </div>

          <div className="relative w-full space-y-2">
            {comboBadge}
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-[.2em] text-white/70">
              <span>{t('player.step')}</span>
              <span className="tabular-nums">{state.progressPct} %</span>
            </div>
            {progressBar}
            <p className="truncate font-mono text-[10px] uppercase tracking-[.2em] text-white/60">
              {courseTitle}
            </p>
          </div>
        </aside>

        {/* ===== Zone d'étape ===== */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain lg:col-span-9">
          <div
            className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-12"
            // La barre est en position absolue : elle recouvrirait la fin de
            // l'étape. On réserve sa hauteur mesurée (safe-area comprise) plus
            // une marge de respiration.
            style={{ paddingBottom: completed ? 48 : barHeight + 24 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {state.phase === 'interstitial' && (
                <motion.div
                  key="interstitial"
                  initial={stepVariants.initial}
                  animate={stepVariants.animate}
                  exit={stepVariants.exit}
                >
                  <ReplayInterstitial count={state.replayQueue.length} />
                </motion.div>
              )}

              {!completed && state.phase !== 'interstitial' && step && (
                <motion.div
                  key={`${state.phase}-${stepIndex}-${step.id}`}
                  initial={stepVariants.initial}
                  animate={stepVariants.animate}
                  exit={stepVariants.exit}
                >
                  <StepControllerContext.Provider value={controller}>
                    {replaying && (
                      <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">
                        {t('player.replayBadge')}
                      </p>
                    )}
                    {renderStep(step)}
                  </StepControllerContext.Provider>
                </motion.div>
              )}

              {completed && finalResult && (
                <motion.div
                  key="completion"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={reduced ? { duration: fade.base } : spring.gentle}
                >
                  <CompletionScreen
                    courseTitle={courseTitle}
                    totalSteps={totalSteps}
                    durationSeconds={durationSeconds}
                    correctCount={finalResult.correct}
                    totalQuestions={finalResult.questionCount}
                    bestCombo={finalResult.bestCombo}
                    onContinue={() => onComplete(finalResult)}
                    onExit={onExit}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ===== La barre, toujours au même endroit ===== */}
      {!completed && (
        <CheckBar
          mode={state.phase === 'interstitial' ? 'continue' : mode}
          ready={state.phase === 'interstitial' ? true : ready}
          result={state.phase === 'interstitial' ? null : result}
          onCheck={handleCheck}
          onContinue={handleContinue}
          onHeightChange={setBarHeight}
        />
      )}
    </div>,
    document.body,
  );
}

/** Intertitre qui ouvre la phase de rejeu. */
function ReplayInterstitial({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
      <Spark mood="encouraging" size={120} halo />
      <h2 className="font-display text-2xl font-bold">{t('player.replayTitle')}</h2>
      <p className="text-muted-foreground">{t('player.replayIntro', { count })}</p>
    </div>
  );
}
export function CompletionScreen({
  courseTitle,
  totalSteps,
  durationSeconds,
  correctCount,
  totalQuestions,
  bestCombo,
  onContinue,
  onExit,
}: {
  courseTitle: string;
  totalSteps: number;
  durationSeconds: number;
  correctCount: number;
  totalQuestions: number;
  bestCombo: number;
  onContinue: () => void;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  // Même barème que l'aperçu du header et que `complete_lesson` côté serveur :
  // un seul calcul, trois endroits qui l'affichent.
  const xpEarned = computeLessonXp({
    correct: correctCount,
    questionCount: totalQuestions,
    bestCombo,
  }).total;
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
          <p
            className="font-display font-extrabold text-2xl tabular-nums text-cia-blue-700"
            data-testid="completion-xp"
          >
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
