import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import {
  getDailyLesson,
  computeStreakUpdate,
  effectiveStreak,
  todayKey,
  type DailyLessonInfo,
} from '@/lib/dailyChallenge';
import { toast } from 'sonner';
import type { CECRLevel } from '@/data/demo-courses';

const STREAK_BONUS_XP = 25;
const LS_STREAK = 'daily-streak';
const LS_LAST = 'daily-last-date';

interface MarkDailyDoneResult {
  awarded: boolean;
  reason?: string;
  xp_awarded?: number;
  streak: number;
  total_xp_after?: number;
  level_after?: CECRLevel;
}

export function useDailyChallenge(initialLevel?: CECRLevel) {
  const { user } = useAuth();
  const { cecrLevel, addLocalXP } = useUserProgress();
  const [selectedLevel, setSelectedLevel] = useState<CECRLevel>(initialLevel || cecrLevel);
  const [streak, setStreak] = useState(0);
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialLevel) setSelectedLevel(cecrLevel);
  }, [cecrLevel, initialLevel]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('daily_streak, last_daily_completed_at')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled) return;
        const stored = data?.daily_streak ?? 0;
        const last = (data?.last_daily_completed_at as string) ?? null;
        const eff = effectiveStreak(last, stored);
        setStreak(eff);
        setLastDate(last);
        // Note: la correction auto est désormais faite côté serveur via mark_daily_done
      } else {
        const stored = parseInt(localStorage.getItem(LS_STREAK) || '0', 10);
        const last = localStorage.getItem(LS_LAST);
        const eff = effectiveStreak(last, stored);
        setStreak(eff);
        setLastDate(last);
        if (eff !== stored) localStorage.setItem(LS_STREAK, String(eff));
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dailyLesson: DailyLessonInfo | null = getDailyLesson(selectedLevel);
  const isDoneToday = lastDate === todayKey();

  const markDoneToday = useCallback(async (): Promise<{
    awarded: boolean;
    xp: number;
    newStreak: number;
  }> => {
    if (user) {
      const { data, error } = await supabase.rpc('mark_daily_done');
      if (error) {
        console.error('[markDoneToday] mark_daily_done failed', error);
        toast.error(`Erreur défi du jour: ${error.message}`);
        return { awarded: false, xp: 0, newStreak: streak };
      }
      const result = data as MarkDailyDoneResult | null;
      const today = todayKey();
      if (!result?.awarded) {
        // Déjà fait aujourd'hui — synchronise l'état local
        const s = result?.streak ?? streak;
        setStreak(s);
        setLastDate(today);
        return { awarded: false, xp: 0, newStreak: s };
      }
      const newStreak = result.streak;
      const xpAwarded = result.xp_awarded ?? STREAK_BONUS_XP;
      setStreak(newStreak);
      setLastDate(today);
      // Diffuse les events pour synchroniser l'UI XP
      if (typeof result.total_xp_after === 'number' && result.level_after) {
        window.dispatchEvent(
          new CustomEvent('xp-update', {
            detail: { xp: result.total_xp_after, level: result.level_after },
          }),
        );
      }
      window.dispatchEvent(new CustomEvent('weekly-xp-update'));
      if ([7, 14, 30, 100].includes(newStreak)) {
        window.dispatchEvent(
          new CustomEvent('streak-milestone', { detail: { streak: newStreak } }),
        );
      }
      return { awarded: true, xp: xpAwarded, newStreak };
    }

    // Anonyme — fallback local
    const { streak: newStreak, alreadyDone } = computeStreakUpdate(lastDate, streak);
    if (alreadyDone) return { awarded: false, xp: 0, newStreak: streak };
    const today = todayKey();
    setStreak(newStreak);
    setLastDate(today);
    localStorage.setItem(LS_STREAK, String(newStreak));
    localStorage.setItem(LS_LAST, today);
    addLocalXP(STREAK_BONUS_XP);
    if ([7, 14, 30, 100].includes(newStreak)) {
      window.dispatchEvent(new CustomEvent('streak-milestone', { detail: { streak: newStreak } }));
    }
    return { awarded: true, xp: STREAK_BONUS_XP, newStreak };
  }, [lastDate, streak, user, addLocalXP]);

  return {
    selectedLevel,
    setSelectedLevel,
    dailyLesson,
    streak,
    isDoneToday,
    loading,
    markDoneToday,
  };
}
