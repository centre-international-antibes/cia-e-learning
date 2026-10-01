import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type EditableProfile = {
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  interface_language: string | null;
  avatar_url: string | null;
  phone: string | null;
};

export type ProfileSnapshot = EditableProfile & {
  email: string | null;
  cecr_level: string | null;
  total_xp: number;
  /** XP de la semaine en cours — remis à zéro chaque lundi côté serveur. */
  weekly_xp: number;
  league: string | null;
  daily_streak: number;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Sensitive PII columns (email/phone/nationality) are not readable via direct
    // table select. Use the SECURITY DEFINER RPC that scopes to auth.uid().
    const { data } = await supabase.rpc('get_my_profile');
    if (data) setProfile(data as unknown as ProfileSnapshot);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const update = useCallback(
    async (patch: Partial<EditableProfile>): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'not_authenticated' };
      const { error } = await supabase.from('profiles').update(patch).eq('user_id', user.id);
      if (error) return { ok: false, error: error.message };
      setProfile((p) => (p ? { ...p, ...patch } : p));
      return { ok: true };
    },
    [user],
  );

  return { profile, loading, update, refetch };
}
