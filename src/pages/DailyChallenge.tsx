import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Calendar, Play, Check, Trophy, ArrowLeft, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { DAILY_LEVELS, todayKey } from '@/lib/dailyChallenge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CECRLevel } from '@/data/demo-courses';
import { AnimatedCounter } from '@/components/gamification/AnimatedCounter';
import { CountdownDigit } from '@/components/leaderboard/CountdownDigit';
import { SparkPresence } from '@/components/spark';
import type { SparkMood } from '@/components/spark/Spark';
import { useUserProgress } from '@/hooks/useUserProgress';

type StreakRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  daily_streak: number;
  cecr_level: string | null;
};

const todayLabel = (locale: string) => {
  const d = new Date();
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
};

function useTimeUntilMidnightParis() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const paris = new Date(new Date(now).toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const next = new Date(paris);
  next.setHours(24, 0, 0, 0);
  const diff = Math.max(0, next.getTime() - paris.getTime());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { h, m, s };
}

export default function DailyChallenge() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedLevel, setSelectedLevel, dailyLesson, streak, isDoneToday } = useDailyChallenge();
  const { cecrLevel } = useUserProgress();
  const [topStreaks, setTopStreaks] = useState<StreakRow[]>([]);
  const tilMidnight = useTimeUntilMidnightParis();

  const mascotMood: SparkMood = isDoneToday
    ? 'celebrating'
    : streak >= 7
      ? 'encouraging'
      : 'talking';

  const mascotMessage = isDoneToday
    ? t('daily.mascot.done')
    : streak >= 30
      ? t('daily.mascot.streak_long')
      : streak >= 7
        ? t('daily.mascot.streak_medium')
        : streak >= 1
          ? t('daily.mascot.streak_short')
          : t('daily.mascot.first_time');

  useEffect(() => {
    supabase
      .from('leaderboard')
      .select('user_id, first_name, last_name, avatar_url, daily_streak, cecr_level')
      .gt('daily_streak', 0)
      .order('daily_streak', { ascending: false })
      .limit(10)
      .then(({ data }) => setTopStreaks((data as StreakRow[]) || []));
  }, [streak]);

  const displayName = (e: StreakRow) => {
    const fn = (e.first_name || '').trim();
    const ln = (e.last_name || '').trim();
    if (!fn && !ln) return t('daily.learnerFallback');
    return `${fn}${ln ? ' ' + ln[0] + '.' : ''}`;
  };

  return (
    <div className="container py-8 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> {t('nav.home')}
      </Link>

      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-streak-500 to-cia-red-500 shadow-lg"
          >
            <div className="absolute inset-0 rounded-2xl bg-streak-500/40 blur-xl -z-10 animate-pulse" />
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            >
              <Flame className="h-9 w-9 text-white" />
            </motion.div>
          </motion.div>
          <Badge className="bg-streak-500 text-white">{t('daily.tag')}</Badge>
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-primary mb-1">{t('daily.todayLessonTitle')}</h1>
        <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
          <Calendar className="h-4 w-4" /> {todayLabel(i18n.language)}
        </p>
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cia-streak/15 text-cia-streak font-extrabold relative"
        >
          {streak >= 7 && (
            <span className="absolute inset-0 rounded-full bg-streak-500/30 blur-lg -z-10 animate-pulse" />
          )}
          <Flame className="h-5 w-5" />
          <AnimatedCounter target={streak} duration={800} /> {t('daily.streakLabel', { count: streak })}
        </motion.div>

        {/* Mascot with contextual bubble — desktop only */}
        <div className="hidden lg:flex justify-center mt-6">
          <SparkPresence
            mood={mascotMood}
            message={mascotMessage}
            bubbleSide="right"
            size={96}
          />
        </div>
      </div>

      {/* Level selector */}
      <div className="mb-6">
        <p className="text-xs font-bold text-muted-foreground mb-2 text-center">{t('daily.chooseLevel')}</p>
        <div className="relative grid grid-cols-6 gap-2">
          {DAILY_LEVELS.map((lv) => (
            <motion.button
              key={lv}
              whileTap={{ scale: 0.94 }}
              onClick={() => setSelectedLevel(lv as CECRLevel)}
              className={`relative py-2.5 rounded-xl text-sm font-extrabold transition-colors ${
                selectedLevel === lv
                  ? 'text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {selectedLevel === lv && (
                <motion.span
                  layoutId="daily-level-pill"
                  className="absolute inset-0 rounded-xl bg-primary shadow-lg"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative z-10">{lv}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Daily lesson card */}
      {dailyLesson ? (
        <motion.div
          key={`${selectedLevel}-${isDoneToday ? 'done' : 'todo'}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
        <Card className={`p-6 rounded-3xl mb-8 border-2 ${
          isDoneToday
            ? 'bg-gradient-to-br from-success-50 to-success-50 dark:from-success-700/30 dark:to-success-700/20 border-success-500'
            : 'bg-gradient-to-br from-cia-gold-50 to-cia-red-50 dark:from-cia-gold-900/30 dark:to-cia-red-900/20 border-streak-500/50'
        }`}>
          {isDoneToday && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-500 text-white text-xs font-bold mb-3"
            >
              <Check className="h-3.5 w-3.5" /> {t('daily.doneToday')}
            </motion.div>
          )}
          <Badge variant="outline" className="mb-2 font-bold">{selectedLevel} · {dailyLesson.moduleId}</Badge>
          <h2 className="font-display text-2xl mb-1">{dailyLesson.title}</h2>
          <p className="text-sm text-muted-foreground mb-5">{t('daily.moduleLabel', { module: dailyLesson.moduleTitle })}</p>

          {isDoneToday ? (
            <div className="text-center py-2">
              <p className="text-sm font-bold text-success-700 dark:text-success-500 mb-2">
                {t('daily.doneMessage')}
              </p>
              <p className="text-xs text-muted-foreground mb-4 inline-flex items-center gap-1">
                {t('daily.nextIn')}&nbsp;
                <CountdownDigit value={tilMidnight.h} className="font-bold text-foreground" />h
                <CountdownDigit value={tilMidnight.m} className="font-bold text-foreground" />m
                <CountdownDigit value={tilMidnight.s} className="font-bold text-foreground" />s
              </p>
              <Button onClick={() => navigate(`/cours/${dailyLesson.lessonId}`)} variant="outline" className="rounded-xl">
                {t('daily.redoLesson')}
              </Button>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => navigate(`/cours/${dailyLesson.lessonId}?daily=1`)}
                size="lg"
                className="w-full rounded-2xl gap-2 bg-gradient-to-r from-streak-500 via-cia-red-500 to-streak-500 bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-700 font-bold shadow-lg hover:shadow-xl"
              >
                <Play className="h-5 w-5" /> {t('daily.startCta')}
              </Button>
            </motion.div>
          )}
          <p className="text-[11px] text-center text-muted-foreground mt-3">
            {t('daily.bonusHint')}
          </p>
        </Card>
        </motion.div>
      ) : (
        <Card className="p-6 text-center rounded-3xl mb-8">
          <p className="text-muted-foreground">{t('daily.noLessonForLevel')}</p>
        </Card>
      )}

      {/* Streak leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg flex items-center gap-2">
            <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
              <Trophy className="h-5 w-5 text-cia-gold-500" />
            </motion.span>
            {t('daily.topStreaks')}
          </h3>
          <Link to="/classement" className="text-xs text-primary hover:underline font-bold">{t('daily.seeAll')}</Link>
        </div>
        {topStreaks.length === 0 ? (
          <Card className="p-6 text-center rounded-2xl text-sm text-muted-foreground">
            {t('daily.firstToStart')}
          </Card>
        ) : (
          <div className="space-y-2">
            {topStreaks.map((row, i) => {
              const isMe = user?.id === row.user_id;
              const initial = (row.first_name?.[0] || row.last_name?.[0] || '?').toUpperCase();
              return (
                <motion.div
                  key={row.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border ${isMe ? 'bg-primary/10 border-primary ring-2 ring-primary/30 animate-pulse-soft' : 'bg-card border-border/40'}`}
                >
                  <div className={`w-8 text-center font-extrabold ${i === 0 ? 'text-cia-gold-500' : i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {i === 0 ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        // Rotation décorative continue : `linear` est volontaire,
                        // c'est la seule courbe qui boucle sans à-coup.
                        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                        className="inline-block"
                      >
                        <Crown className="h-5 w-5 inline" />
                      </motion.span>
                    ) : `#${i + 1}`}
                  </div>
                  {row.avatar_url ? (
                    <img src={row.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover border-2 border-primary/30" loading="lazy" decoding="async" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary border-2 border-primary/30">{initial}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{displayName(row)} {isMe && <span className="text-xs text-primary">({t('daily.you')})</span>}</p>
                    <p className="text-xs text-muted-foreground">{row.cecr_level || 'A1'}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-cia-streak/15 text-cia-streak text-sm font-extrabold flex items-center gap-1">
                    <Flame className="h-4 w-4" /> {row.daily_streak}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
