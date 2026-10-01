import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, Trophy, Timer, ArrowLeft, RotateCcw, Crown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  SPEED_TEST_QUESTIONS,
  SPEED_TEST_DURATION,
  type SpeedQuestion,
} from '@/data/speed-test-questions';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useAuth } from '@/hooks/useAuth';
import { useRewards } from '@/features/rewards';
import { supabase } from '@/integrations/supabase/client';
import { curriculum } from '@/data/curriculum';
import { isModuleComplete } from '@/hooks/useModuleUnlock';
import type { CECRLevel } from '@/data/demo-courses';
import { toast } from 'sonner';
import { RadialTimer } from '@/components/speed-test/RadialTimer';
import { AnswerBurst } from '@/components/speed-test/AnswerBurst';
import { ComboBadge } from '@/components/speed-test/ComboBadge';
import { AnimatedCounter } from '@/components/gamification/AnimatedCounter';

type Phase = 'intro' | 'playing' | 'done';

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

function shuffleQuestion(q: SpeedQuestion): SpeedQuestion {
  const correct = q.options[q.correctIndex];
  const opts = shuffle(q.options);
  return { question: q.question, options: opts, correctIndex: opts.indexOf(correct) };
}

/** Réponse de la RPC `complete_speed_test`. */
interface CompleteSpeedTestResult {
  outcome: 'rewarded' | 'replay_cap';
  xp_awarded: number;
  is_record: boolean;
  best_score: number;
  xp_after: number;
}

export default function SpeedTest() {
  const { t } = useTranslation();
  const { level: levelParam } = useParams();
  const level = (levelParam as CECRLevel) || 'A1';
  const navigate = useNavigate();
  const { applyServerXp, addLocalXP } = useUserProgress();
  const { user } = useAuth();
  const { enqueue } = useRewards();

  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<SpeedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SPEED_TEST_DURATION);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [newRecord, setNewRecord] = useState(false);
  const [combo, setCombo] = useState(0);
  const [burstKey, setBurstKey] = useState(0);

  // Le record fait autorité côté serveur ; `localStorage` n'est plus qu'un
  // cache d'affichage, pour que l'écran d'intro ne soit pas vide au chargement.
  const bestKey = `speed-test-best:${level}`;
  const [bestScore, setBestScore] = useState(() => {
    const v = localStorage.getItem(bestKey);
    return v ? parseInt(v, 10) : 0;
  });

  const intervalRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Check unlock: at least one module of the level fully completed
  const levelData = curriculum.find((l) => l.level === level);
  const unlocked = useMemo(() => {
    if (!levelData) return false;
    return levelData.modules.some((m) => isModuleComplete(m));
  }, [levelData]);

  const finish = useCallback(
    async (finalScore: number) => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setPhase('done');

      if (user) {
        // Barème, record et plafond de rejeu : tout est décidé par le serveur.
        const { data, error } = await supabase.rpc('complete_speed_test', {
          _level: level,
          _score: finalScore,
        });
        if (error) {
          console.error('[complete_speed_test]', error);
          setXpEarned(0);
          return;
        }
        const res = data as CompleteSpeedTestResult | null;
        if (!res) return;
        applyServerXp(res);
        setXpEarned(res.xp_awarded);
        setNewRecord(res.is_record);
        setBestScore(res.best_score);
        localStorage.setItem(bestKey, String(res.best_score));
        if (res.xp_awarded > 0) {
          enqueue({
            kind: 'xp',
            id: `speed-${level}-${Date.now()}`,
            amount: res.xp_awarded,
            label: t('speedTest.title', { defaultValue: 'Speed test' }),
          });
        } else if (res.outcome === 'replay_cap') {
          toast.info(
            t('speedTest.replayCap', {
              defaultValue:
                'Déjà 5 parties comptabilisées sur ce niveau aujourd’hui — le score compte, pas les XP.',
            }),
          );
        }
        return;
      }

      // Anonyme : même barème, appliqué localement.
      const effective = Math.min(finalScore, 60);
      const record = effective > bestScore;
      const xp = effective * 10 + (record ? 50 : 0);
      if (record) {
        setBestScore(effective);
        localStorage.setItem(bestKey, String(effective));
      }
      setXpEarned(xp);
      setNewRecord(record);
      if (xp > 0) {
        addLocalXP(xp);
        enqueue({
          kind: 'xp',
          id: `speed-local-${Date.now()}`,
          amount: xp,
          label: t('speedTest.title', { defaultValue: 'Speed test' }),
        });
      }
    },
    [user, level, bestKey, bestScore, applyServerXp, addLocalXP, enqueue, t],
  );

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          // use ref to access latest score
          return 0;
        }
        return Math.max(0, t - 0.1);
      });
    }, 100);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [phase]);

  // Trigger finish when timer hits 0
  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      finish(score);
    }
  }, [timeLeft, phase, score, finish]);

  const start = () => {
    const pool = SPEED_TEST_QUESTIONS[level] || SPEED_TEST_QUESTIONS.A1;
    const shuffled = shuffle(pool).map(shuffleQuestion);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setScore(0);
    setErrors(0);
    setTimeLeft(SPEED_TEST_DURATION);
    setFeedback(null);
    setXpEarned(0);
    setNewRecord(false);
    setCombo(0);
    setPhase('playing');
  };

  const answer = (idx: number) => {
    if (feedback || phaseRef.current !== 'playing') return;
    const q = questions[currentIdx];
    const correct = idx === q.correctIndex;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      setScore((s) => s + 1);
      setCombo((c) => c + 1);
    } else {
      setErrors((e) => e + 1);
      setCombo(0);
    }
    setBurstKey((k) => k + 1);
    setTimeout(() => {
      setFeedback(null);
      setCurrentIdx((i) => {
        const next = i + 1;
        if (next >= questions.length) {
          // re-shuffle pool to keep going
          const pool = SPEED_TEST_QUESTIONS[level] || SPEED_TEST_QUESTIONS.A1;
          setQuestions(shuffle(pool).map(shuffleQuestion));
          return 0;
        }
        return next;
      });
    }, 350);
  };

  const stop = () => finish(score);

  // ─── Locked screen ──────────────────────────────────
  if (!unlocked) {
    return (
      <div className="container py-12 max-w-2xl">
        <Link
          to="/programme"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Programme
        </Link>
        <Card className="p-8 text-center rounded-3xl">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-muted items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl text-primary mb-2">
            {t('speedTest.lockedTitle', { level })}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {t('speedTest.lockedBody', { level })}
          </p>
          <Link to="/programme">
            <Button className="rounded-xl">{t('speedTest.backToProgramme')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ─── Intro ──────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="container py-8 max-w-2xl">
        <Link
          to="/programme"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Programme
        </Link>
        <Card className="p-8 text-center rounded-3xl bg-gradient-to-br from-cia-gold-50 to-cia-gold-100 dark:from-cia-gold-900/30 dark:to-cia-gold-900/20 border-2 border-cia-gold-300 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-cia-gold-400/20 blur-3xl pointer-events-none" />
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="inline-flex h-20 w-20 rounded-3xl bg-gradient-to-br from-cia-gold-400 to-streak-500 items-center justify-center mb-4 shadow-xl relative"
          >
            <div className="absolute inset-0 rounded-3xl bg-cia-gold-400/40 blur-xl -z-10" />
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            >
              <Zap className="h-10 w-10 text-white" />
            </motion.div>
          </motion.div>
          <h1 className="font-display text-3xl md:text-4xl text-primary mb-2">
            Test de vitesse {level}
          </h1>
          <p className="text-muted-foreground mb-6">
            Réponds correctement au plus de questions possible en 1 min 30 !
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
            {[
              { Icon: Timer, color: 'text-primary', big: '90 sec', sub: 'de challenge' },
              { Icon: Zap, color: 'text-cia-xp', big: '+10 XP', sub: 'par bonne rép.' },
              { Icon: Crown, color: 'text-cia-gold-500', big: '+50 XP', sub: 'si record' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                className="p-3 rounded-2xl bg-card border"
              >
                <s.Icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                <p className="font-bold">{s.big}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {bestScore > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cia-gold-100 dark:bg-cia-gold-800/30 text-cia-gold-700 dark:text-cia-gold-300 text-sm font-bold"
            >
              <Trophy className="h-4 w-4" /> Ton record :{' '}
              <AnimatedCounter target={bestScore} duration={800} /> bonnes réponses
            </motion.div>
          )}

          <Button
            size="lg"
            onClick={start}
            className="w-full rounded-2xl text-base font-bold gap-2 bg-gradient-to-r from-cia-gold-500 to-streak-500 hover:from-cia-gold-600 hover:to-streak-500 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Zap className="h-5 w-5" /> Commencer le test
          </Button>
        </Card>
      </div>
    );
  }

  // ─── Done ──────────────────────────────────
  if (phase === 'done') {
    const total = score + errors;
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return (
      <div className="container py-8 max-w-2xl">
        <Card className="p-8 text-center rounded-3xl bg-gradient-to-br from-cia-gold-50 to-cia-gold-100 dark:from-cia-gold-900/30 dark:to-cia-gold-900/20 border-2 border-cia-gold-300 relative overflow-hidden">
          {newRecord && !reduced && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 0.4;
                const duration = 2 + Math.random() * 1.4;
                const colors = [
                  'bg-cia-gold-400',
                  'bg-streak-500',
                  'bg-cia-blue-500',
                  'bg-cia-success',
                ];
                return (
                  <motion.span
                    key={i}
                    className={`absolute top-[-20px] block w-1.5 h-3 rounded-sm ${colors[i % colors.length]}`}
                    style={{ left: `${left}%` }}
                    initial={{ y: -20, rotate: 0, opacity: 1 }}
                    animate={{ y: 600, rotate: 720, opacity: [1, 1, 0] }}
                    // Chute de confettis en boucle : `linear` est volontaire —
                    // un spring produirait un à-coup à chaque répétition.
                    transition={{ duration, delay, ease: 'linear', repeat: Infinity }}
                  />
                );
              })}
            </div>
          )}
          {newRecord && (
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cia-gold-400 text-white text-sm font-bold mb-4"
            >
              <Crown className="h-4 w-4" /> NOUVEAU RECORD !
            </motion.div>
          )}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Trophy className="h-16 w-16 mx-auto mb-4 text-cia-gold-500 drop-shadow-lg" />
          </motion.div>
          <h1 className="font-display text-3xl text-primary mb-2">{t('speedTest.doneTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('speedTest.doneSubtitle', { level })}</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                v: score,
                suffix: '',
                cls: 'text-cia-success',
                border: 'border-cia-success/30',
                label: t('speedTest.correct'),
              },
              {
                v: errors,
                suffix: '',
                cls: 'text-destructive',
                border: 'border-destructive/30',
                label: t('speedTest.errors'),
              },
              {
                v: accuracy,
                suffix: '%',
                cls: 'text-primary',
                border: 'border-primary/30',
                label: t('speedTest.accuracy'),
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                className={`p-4 rounded-2xl bg-card border-2 ${s.border}`}
              >
                <p className={`text-3xl font-extrabold ${s.cls}`}>
                  <AnimatedCounter target={s.v} duration={1000} suffix={s.suffix} />
                </p>
                <p className="text-xs text-muted-foreground font-bold">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="mb-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cia-xp/15 text-cia-xp font-extrabold"
          >
            <Zap className="h-5 w-5" /> +<AnimatedCounter target={xpEarned} duration={900} /> XP
          </motion.div>

          <div className="flex gap-3">
            <Button
              onClick={start}
              size="lg"
              className="flex-1 rounded-2xl gap-2 bg-gradient-to-r from-cia-gold-500 to-streak-500 hover:from-cia-gold-600 hover:to-streak-500"
            >
              <RotateCcw className="h-4 w-4" /> {t('speedTest.replay')}
            </Button>
            <Button
              onClick={() => navigate('/programme')}
              size="lg"
              variant="outline"
              className="flex-1 rounded-2xl"
            >
              {t('nav.curriculum')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Playing ──────────────────────────────────
  const q = questions[currentIdx];

  return (
    <div className="container py-6 max-w-2xl">
      {/* Top bar: radial timer + score */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <RadialTimer timeLeft={timeLeft} total={SPEED_TEST_DURATION} />
        <div className="flex-1 flex justify-center">
          <ComboBadge combo={combo} />
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            layout
            className="px-3 py-1 rounded-full bg-cia-success/15 text-cia-success text-sm font-bold"
          >
            ✓ <AnimatedCounter target={score} duration={300} />
          </motion.div>
          <motion.div
            layout
            className="px-3 py-1 rounded-full bg-destructive/15 text-destructive text-sm font-bold"
          >
            ✗ <AnimatedCounter target={errors} duration={300} />
          </motion.div>
          <Button size="sm" variant="ghost" onClick={stop} className="text-xs">
            {t('speedTest.stop')}
          </Button>
        </div>
      </div>

      {/* Question */}
      <div className="relative">
        <AnimatePresence>
          {feedback && (
            <AnswerBurst key={burstKey} correct={feedback === 'correct'} onDone={() => {}} />
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{
              opacity: 1,
              x: feedback === 'wrong' ? [0, -8, 8, -6, 6, 0] : 0,
            }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card
              className={`p-6 rounded-3xl transition-colors duration-200 ${
                feedback === 'correct'
                  ? 'bg-cia-success/10 border-cia-success ring-4 ring-cia-success/30'
                  : feedback === 'wrong'
                    ? 'bg-destructive/10 border-destructive ring-4 ring-destructive/30'
                    : ''
              }`}
            >
              <p className="text-xs text-muted-foreground font-bold mb-2">
                QUESTION {currentIdx + 1}
              </p>
              <h2 className="text-xl md:text-2xl font-bold mb-6 leading-snug">{q?.question}</h2>
              <div className="grid gap-3">
                {q?.options.map((opt, i) => {
                  const isCorrect = feedback && i === q.correctIndex;
                  const isWrong = feedback === 'wrong' && i !== q.correctIndex;
                  return (
                    <motion.button
                      key={i}
                      onClick={() => answer(i)}
                      disabled={!!feedback}
                      whileTap={{ scale: 0.97 }}
                      whileHover={!feedback ? { scale: 1.01 } : {}}
                      className={`w-full text-left p-4 rounded-2xl border-2 font-semibold transition-all ${
                        isCorrect
                          ? 'bg-cia-success text-primary-foreground border-cia-success'
                          : isWrong
                            ? 'opacity-40 border-border'
                            : 'bg-card border-border hover:border-primary hover:bg-muted'
                      }`}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
