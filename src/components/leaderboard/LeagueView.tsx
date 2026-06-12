import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Clock, Sparkles, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useLeague, type League, type LeagueMember } from '@/hooks/useLeague';
import { LeagueBadge, leagueLabel } from './LeagueBadge';
import { CountdownDigit } from './CountdownDigit';
import { PromoZoneIndicator } from './PromoZoneIndicator';

const LEAGUES: League[] = ['bronze', 'argent', 'or'];

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s };
}

const displayName = (e: LeagueMember) => {
  const fn = (e.first_name || '').trim();
  const ln = (e.last_name || '').trim();
  if (!fn && !ln) return 'Apprenant';
  return `${fn}${ln ? ' ' + ln[0] + '.' : ''}`;
};

const Avatar = ({ entry }: { entry: LeagueMember }) => {
  const initial = (entry.first_name?.[0] || entry.last_name?.[0] || '?').toUpperCase();
  if (entry.avatar_url) {
    return <img src={entry.avatar_url} alt={displayName(entry)} className="h-10 w-10 rounded-full object-cover border-2 border-primary/30" loading="lazy" decoding="async" />;
  }
  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border-2 border-primary/30">
      {initial}
    </div>
  );
};

function MemberRow({ entry, rank, zone, isMe }: { entry: LeagueMember; rank: number; zone: 'promo' | 'safe' | 'releg'; isMe: boolean }) {
  const zoneStyle =
    zone === 'promo'
      ? 'border-l-4 border-l-success-500 bg-success-50/40 dark:bg-success-700/10'
      : zone === 'releg'
      ? 'border-l-4 border-l-destructive bg-destructive/5'
      : 'border-l-4 border-l-transparent';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 p-3 rounded-2xl ${zoneStyle} ${isMe ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted/50'} border border-border/40 ${isMe ? '' : 'bg-card'} transition-colors`}
    >
      <div className={`w-8 text-center font-extrabold ${rank <= 3 ? 'text-success-600' : 'text-muted-foreground'}`}>#{rank}</div>
      <Avatar entry={entry} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">
          {displayName(entry)} {isMe && <span className="text-xs text-primary">(vous)</span>}
        </p>
        <p className="text-xs text-muted-foreground">Niveau {entry.cecr_level || 'A1'}</p>
      </div>
      {zone === 'promo' && <ArrowUp className="h-4 w-4 text-success-600 animate-pulse" />}
      {zone === 'releg' && <ArrowDown className="h-4 w-4 text-destructive animate-pulse" />}
      <div className="px-3 py-1.5 rounded-full bg-cia-xp/15 text-cia-xp text-xs font-bold">⚡ {entry.weekly_xp.toLocaleString()}</div>
    </motion.div>
  );
}

export function LeagueView() {
  const { user } = useAuth();
  const [viewedLeague, setViewedLeague] = useState<League | undefined>(undefined);
  const { myLeague, myWeeklyXP, members, lastResult, loading, weekEnd } = useLeague(viewedLeague);
  const cd = useCountdown(weekEnd);
  const [resultDismissed, setResultDismissed] = useState(false);

  useEffect(() => {
    if (lastResult) {
      const key = `league-result-seen:${lastResult.week_start}`;
      if (localStorage.getItem(key) === '1') setResultDismissed(true);
      else setResultDismissed(false);
    }
  }, [lastResult]);

  const dismissResult = () => {
    if (lastResult) localStorage.setItem(`league-result-seen:${lastResult.week_start}`, '1');
    setResultDismissed(true);
  };

  const activeLeague = viewedLeague || myLeague;
  const n = members.length;
  const promoteCount = activeLeague === 'or' ? 0 : n >= 6 ? 3 : n >= 2 ? 1 : 0;
  const demoteCount = activeLeague === 'bronze' ? 0 : n >= 6 ? 3 : n >= 2 ? 1 : 0;

  const myRank = useMemo(() => {
    if (!user) return null;
    const idx = members.findIndex((m) => m.user_id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [members, user]);

  const lastDay = cd.d === 0;
  const countdownColorClass = lastDay && cd.h < 6 ? 'text-destructive' : lastDay ? 'text-cia-gold-600' : 'text-muted-foreground';

  return (
    <div className="space-y-5">
      {/* Header card */}
      <Card className="p-5 rounded-3xl bg-gradient-to-br from-card to-muted/40 border-2">
        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeLeague}
              initial={{ scale: 0.6, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <LeagueBadge league={activeLeague} size="lg" />
            </motion.div>
          </AnimatePresence>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-muted-foreground tracking-wider">VOTRE LIGUE</p>
            <h2 className="font-display text-2xl text-primary">Ligue {leagueLabel(activeLeague)}</h2>
            <div className={`flex items-center gap-1.5 text-xs mt-1 ${countdownColorClass}`}>
              <Clock className="h-3.5 w-3.5" />
              <span className="inline-flex items-center gap-0.5">
                Fin dans&nbsp;
                <CountdownDigit value={cd.d} className="font-bold" /><span>j&nbsp;</span>
                <CountdownDigit value={cd.h} className="font-bold" /><span>h&nbsp;</span>
                <CountdownDigit value={cd.m} className="font-bold" /><span>m&nbsp;</span>
                <CountdownDigit value={cd.s} className="font-bold" /><span>s</span>
              </span>
            </div>
          </div>
          {user && (
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Cette semaine</p>
              <p className="font-extrabold text-cia-xp text-lg">⚡ {myWeeklyXP.toLocaleString()}</p>
              {myRank && <p className="text-xs font-bold">Rang #{myRank}</p>}
            </div>
          )}
        </div>
      </Card>

      {/* Result of previous week */}
      <AnimatePresence>
        {lastResult && !resultDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className={`relative p-4 rounded-2xl border-2 overflow-hidden ${lastResult.outcome === 'promoted' ? 'bg-success-50 dark:bg-success-700/30 border-success-100' : lastResult.outcome === 'demoted' ? 'bg-cia-red-50 dark:bg-cia-red-900/30 border-cia-red-300' : 'bg-muted/30 border-border'}`}>
              <button onClick={dismissResult} aria-label="Fermer" className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/60 text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-3 pr-6">
                {lastResult.outcome === 'promoted' && <Sparkles className="h-5 w-5 text-success-600 animate-pulse" />}
                {lastResult.outcome === 'demoted' && <ArrowDown className="h-5 w-5 text-destructive" />}
                {lastResult.outcome === 'stayed' && <ShieldCheck className="h-5 w-5 text-muted-foreground" />}
                <p className="text-sm font-bold">
                  {lastResult.outcome === 'promoted' && `🎉 Promu en Ligue ${leagueLabel(lastResult.league_after)} la semaine dernière !`}
                  {lastResult.outcome === 'demoted' && `Relégué en Ligue ${leagueLabel(lastResult.league_after)} — courage, à vous de remonter !`}
                  {lastResult.outcome === 'stayed' && `Maintenu en Ligue ${leagueLabel(lastResult.league_after)} (rang #${lastResult.final_rank})`}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* League selector */}
      <div className="grid grid-cols-3 gap-2">
        {LEAGUES.map((l) => (
          <motion.button
            key={l}
            whileTap={{ scale: 0.96 }}
            onClick={() => setViewedLeague(l)}
            className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${activeLeague === l ? 'border-primary bg-primary/5' : 'border-border/40 bg-card hover:bg-muted/50'}`}
          >
            <LeagueBadge league={l} size="sm" />
            <span className="text-[11px] font-extrabold tracking-wider">{leagueLabel(l)}</span>
          </motion.button>
        ))}
      </div>

      {/* Members list */}
      {loading ? (
        <LeaderboardSkeleton />
        /* Loading skeleton */ 
      ) : members.length === 0 ? (
        <Card className="p-10 text-center rounded-3xl">
          <p className="text-muted-foreground font-bold">Aucun apprenant dans cette ligue.</p>
          <p className="text-xs text-muted-foreground mt-2">Gagnez des XP cette semaine pour apparaître ici !</p>
        </Card>
      ) : (
        <motion.div layout className="space-y-2">
          {members.map((m, i) => {
            const rank = i + 1;
            const zone: 'promo' | 'safe' | 'releg' =
              i < promoteCount ? 'promo' : i >= n - demoteCount ? 'releg' : 'safe';
            const isMe = !!user && m.user_id === user.id;
            const showPromoHeader = i === 0 && promoteCount > 0;
            const showRelegHeader = i === n - demoteCount && demoteCount > 0;
            return (
              <div key={m.user_id}>
                {showPromoHeader && <PromoZoneIndicator zone="promo" />}
                {showRelegHeader && <PromoZoneIndicator zone="releg" />}
                {i === promoteCount && promoteCount > 0 && i < n - demoteCount && <PromoZoneIndicator zone="safe" />}
                <MemberRow entry={m} rank={rank} zone={zone} isMe={isMe} />
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}