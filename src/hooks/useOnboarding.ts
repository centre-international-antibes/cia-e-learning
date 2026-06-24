import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const LS_DONE = 'cia-onboarding-done';
const LS_SKIP_UNTIL = 'cia-onboarding-skip-until';

interface MarkOnboardingDoneResult {
  awarded: boolean;
  reason?: string;
  completed_at: string;
  xp_awarded?: number;
  total_xp_after?: number;
  level_after?: string;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [placementTakenAt, setPlacementTakenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) {
        setCompletedAt(localStorage.getItem(LS_DONE));
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed_at, placement_test_taken_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setCompletedAt(data?.onboarding_completed_at ?? null);
      setPlacementTakenAt(data?.placement_test_taken_at ?? null);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const skipUntil = typeof window !== 'undefined' ? localStorage.getItem(LS_SKIP_UNTIL) : null;
  const skipped = skipUntil ? Date.now() < parseInt(skipUntil, 10) : false;

  const needsOnboarding = !loading && !completedAt && !skipped;

  const markDone = useCallback(async () => {
    if (!user) {
      const now = new Date().toISOString();
      localStorage.setItem(LS_DONE, now);
      setCompletedAt(now);
      return { awarded: false };
    }
    const { data, error } = await supabase.rpc('mark_onboarding_done');
    if (error) {
      console.error('[onboarding] failed', error);
      return { awarded: false };
    }
    const result = data as MarkOnboardingDoneResult | null;
    setCompletedAt(result?.completed_at ?? new Date().toISOString());
    if (result?.awarded) {
      const xp = result?.xp_awarded ?? 50;
      const newXP = result?.total_xp_after;
      const newLevel = result?.level_after;
      if (newXP != null && newLevel) {
        window.dispatchEvent(new CustomEvent('xp-update', { detail: { xp: newXP, level: newLevel } }));
      }
      toast.success(`+${xp} XP de bienvenue !`);
    }
    return { awarded: !!result?.awarded };
  }, [user]);

  const skipForNow = useCallback(() => {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(LS_SKIP_UNTIL, String(until));
  }, []);

  const restart = useCallback(() => {
    localStorage.removeItem(LS_SKIP_UNTIL);
    if (!user) {
      localStorage.removeItem(LS_DONE);
      setCompletedAt(null);
    } else {
      // For logged users, can't undo DB flag; rely on URL flag
      window.location.assign('/dashboard?welcome=1');
    }
  }, [user]);

  return {
    loading,
    needsOnboarding,
    completedAt,
    placementTakenAt,
    markDone,
    skipForNow,
    restart,
  };
}