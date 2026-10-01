import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type League = 'bronze' | 'argent' | 'or';

export type LeagueMember = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  weekly_xp: number;
  cecr_level: string | null;
  league: League;
};

export type LeagueHistoryRow = {
  id: string;
  week_start: string;
  league_before: League;
  league_after: League;
  final_rank: number;
  weekly_xp_total: number;
  outcome: 'promoted' | 'demoted' | 'stayed';
};

function nextMondayParis(): Date {
  const now = new Date();
  const paris = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const dow = (paris.getDay() + 6) % 7; // 0 = Mon
  const daysUntilNext = 7 - dow;
  const next = new Date(paris);
  next.setHours(0, 0, 0, 0);
  next.setDate(paris.getDate() + daysUntilNext);
  const offsetDiff = next.getTime() - paris.getTime();
  return new Date(now.getTime() + offsetDiff);
}

export function useLeague(viewedLeague?: League) {
  const { user } = useAuth();
  const [myLeague, setMyLeague] = useState<League>('bronze');
  const [myWeeklyXP, setMyWeeklyXP] = useState(0);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [lastResult, setLastResult] = useState<LeagueHistoryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchCount = useRef(0);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    const currentFetchId = ++fetchCount.current;
    
    try {
      const { data: me } = await supabase
        .from('profiles')
        .select('league, weekly_xp')
        .eq('user_id', user.id)
        .maybeSingle();

      if (currentFetchId !== fetchCount.current) return;

      const currentLeague: League = (me?.league as League) || 'bronze';
      setMyLeague(currentLeague);
      setMyWeeklyXP(me?.weekly_xp || 0);

      const target = viewedLeague || currentLeague;
      const { data: list } = await supabase
        .from('leaderboard')
        .select('user_id, first_name, last_name, avatar_url, weekly_xp, cecr_level, league')
        .eq('league', target)
        .order('weekly_xp', { ascending: false })
        .limit(50);

      if (currentFetchId !== fetchCount.current) return;
      setMembers((list as LeagueMember[]) || []);

      const { data: hist } = await supabase
        .from('league_history')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1);

      if (currentFetchId !== fetchCount.current) return;
      setLastResult((hist?.[0] as LeagueHistoryRow) || null);
    } catch (err) {
      console.error('[useLeague] fetchAll error', err);
    } finally {
      if (currentFetchId === fetchCount.current) {
        setLoading(false);
      }
    }
  }, [user, viewedLeague]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
    const onUpdate = () => fetchAll();
    window.addEventListener('weekly-xp-update', onUpdate);
    window.addEventListener('xp-update', onUpdate);
    const interval = setInterval(fetchAll, 30000);
    return () => {
      window.removeEventListener('weekly-xp-update', onUpdate);
      window.removeEventListener('xp-update', onUpdate);
      clearInterval(interval);
    };
  }, [fetchAll]);

  return { myLeague, myWeeklyXP, members, lastResult, loading, weekEnd: nextMondayParis(), refetch: fetchAll };
}
