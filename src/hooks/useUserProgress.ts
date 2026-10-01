import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { CECRLevel } from '@/data/demo-courses';

const LEVEL_ORDER: CECRLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const XP_PER_LEVEL = 5000;

const XP_UPDATE_EVENT = 'xp-update';

/** Réponse d'une RPC serveur qui crédite de l'XP (`complete_lesson`, …). */
export interface ServerXpResult {
  xp_after?: number;
  weekly_xp_after?: number;
}

interface SetPlacementLevelResult {
  level: CECRLevel;
  total_xp: number;
  taken_at: string;
}

function emitXPUpdate(xp: number, level: CECRLevel) {
  window.dispatchEvent(new CustomEvent(XP_UPDATE_EVENT, { detail: { xp, level } }));
}

/**
 * @deprecated Mode anonyme uniquement. Sur un compte, le niveau CECR vient de
 * la progression pédagogique (`computeLevelFromProgress`) ou du test de
 * placement — jamais du total d'XP.
 */
export function getLevelFromXP(xp: number): CECRLevel {
  const idx = Math.min(Math.floor(xp / XP_PER_LEVEL), LEVEL_ORDER.length - 1);
  return LEVEL_ORDER[idx];
}

export function isLevelAccessible(courseLevel: CECRLevel, userLevel: CECRLevel): boolean {
  const userIdx = LEVEL_ORDER.indexOf(userLevel);
  const courseIdx = LEVEL_ORDER.indexOf(courseLevel);
  return courseIdx <= userIdx + 1;
}

export function getXPForLevel(level: CECRLevel): number {
  const idx = LEVEL_ORDER.indexOf(level);
  return idx * XP_PER_LEVEL;
}

export function useUserProgress() {
  const { user } = useAuth();
  const [totalXP, setTotalXP] = useState(0);
  const [cecrLevel, setCecrLevel] = useState<CECRLevel>('A1');
  const [placementTestTakenAt, setPlacementTestTakenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cross-component sync
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      setTotalXP((prev) => (prev === detail.xp ? prev : detail.xp));
      setCecrLevel((prev) => (prev === detail.level ? prev : detail.level));
    };
    window.addEventListener(XP_UPDATE_EVENT, handler);
    return () => window.removeEventListener(XP_UPDATE_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('user-xp');
      const storedLevel = localStorage.getItem('user-cecr-level');
      if (storedLevel) {
        setCecrLevel(storedLevel as CECRLevel);
        const xp = stored ? parseInt(stored, 10) : getXPForLevel(storedLevel as CECRLevel);
        setTotalXP(xp);
      } else if (stored) {
        const xp = parseInt(stored, 10);
        setTotalXP(xp);
        setCecrLevel(getLevelFromXP(xp));
      }
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('total_xp, cecr_level, placement_test_taken_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setTotalXP(data.total_xp || 0);
        setCecrLevel((data.cecr_level as CECRLevel) || 'A1');
        setPlacementTestTakenAt(data.placement_test_taken_at ?? null);
      }
      setLoading(false);
    };
    fetchProgress();
  }, [user]);

  /**
   * Applique à l'état local l'XP renvoyée par une RPC serveur.
   *
   * Le client ne crédite plus rien lui-même : `complete_lesson`,
   * `complete_speed_test` et `mark_daily_done` sont les seules sources d'XP,
   * et le niveau CECR ne dépend plus du total.
   */
  const applyServerXp = useCallback(
    (result: ServerXpResult | null | undefined) => {
      if (!result || typeof result.xp_after !== 'number') return;
      setTotalXP(result.xp_after);
      emitXPUpdate(result.xp_after, cecrLevel);
      window.dispatchEvent(new CustomEvent('weekly-xp-update'));
    },
    [cecrLevel],
  );

  /**
   * Gain d'XP en mode anonyme uniquement (pas de compte où créditer).
   * Sur un compte, l'XP vient exclusivement du serveur.
   */
  const addLocalXP = useCallback(
    (amount: number) => {
      if (user) return;
      if (!Number.isFinite(amount) || amount <= 0) return;
      const newXP = Math.max(0, totalXP + amount);
      setTotalXP(newXP);
      emitXPUpdate(newXP, cecrLevel);
      localStorage.setItem('user-xp', String(newXP));
    },
    [totalXP, cecrLevel, user],
  );

  // Auto-progression CECRL (multi-appel)
  const setLevel = useCallback(
    async (level: CECRLevel) => {
      setCecrLevel(level);
      emitXPUpdate(totalXP, level);

      if (user) {
        const { error } = await supabase.rpc('set_cecr_level', { _level: level });
        if (error) {
          console.error('[setLevel] set_cecr_level failed', error);
          toast.error(`Erreur niveau: ${error.message}`);
        }
      } else {
        localStorage.setItem('user-cecr-level', level);
      }
    },
    [user, totalXP],
  );

  // Test de placement (one-shot côté serveur)
  const setPlacementLevel = useCallback(
    async (level: CECRLevel): Promise<{ ok: boolean; alreadyTaken: boolean; message?: string }> => {
      if (!user) {
        // Anonyme : applique localement
        const xp = getXPForLevel(level);
        setTotalXP(xp);
        setCecrLevel(level);
        emitXPUpdate(xp, level);
        localStorage.setItem('user-xp', String(xp));
        localStorage.setItem('user-cecr-level', level);
        return { ok: true, alreadyTaken: false };
      }
      const { data, error } = await supabase.rpc('set_placement_level', { _level: level });
      if (error) {
        const msg = error.message || '';
        const already = msg.includes('déjà passé');
        if (already) {
          toast.warning("Test de placement déjà passé — votre niveau n'a pas été modifié.");
        } else {
          toast.error(`Erreur test de placement: ${msg}`);
        }
        return { ok: false, alreadyTaken: already, message: msg };
      }
      const result = data as SetPlacementLevelResult | null;
      const newXP = result?.total_xp ?? totalXP;
      setTotalXP(newXP);
      setCecrLevel(level);
      setPlacementTestTakenAt(result?.taken_at ?? new Date().toISOString());
      emitXPUpdate(newXP, level);
      window.dispatchEvent(new CustomEvent('weekly-xp-update'));
      return { ok: true, alreadyTaken: false };
    },
    [user, totalXP],
  );

  return {
    totalXP,
    cecrLevel,
    placementTestTakenAt,
    loading,
    applyServerXp,
    addLocalXP,
    setLevel,
    setPlacementLevel,
  };
}
