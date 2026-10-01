import { Crown, Medal, Trophy } from 'lucide-react';
import type { League } from '@/hooks/useLeague';

const CONFIG: Record<League, { label: string; icon: typeof Trophy; gradient: string; ring: string; text: string }> = {
  or: {
    label: 'OR',
    icon: Crown,
    gradient: 'bg-gradient-to-br from-cia-gold-300 via-cia-gold-400 to-cia-gold-600',
    ring: 'ring-cia-gold-400/60',
    text: 'text-cia-gold-900',
  },
  argent: {
    label: 'ARGENT',
    icon: Trophy,
    gradient: 'bg-gradient-to-br from-ink-200 via-ink-300 to-ink-500',
    ring: 'ring-ink-300/60',
    text: 'text-ink-800',
  },
  bronze: {
    label: 'BRONZE',
    icon: Medal,
    gradient: 'bg-gradient-to-br from-cia-gold-500 via-streak-500 to-cia-red-700',
    ring: 'ring-streak-500/60',
    text: 'text-cia-red-900',
  },
};

export function LeagueBadge({ league, size = 'md' }: { league: League; size?: 'sm' | 'md' | 'lg' }) {
  const c = CONFIG[league] || CONFIG.bronze;
  const Icon = c.icon;
  const sz = size === 'lg' ? 'h-24 w-24' : size === 'md' ? 'h-14 w-14' : 'h-9 w-9';
  const iconSz = size === 'lg' ? 'h-12 w-12' : size === 'md' ? 'h-7 w-7' : 'h-5 w-5';
  return (
    <div className={`${sz} rounded-2xl ${c.gradient} ${c.text} shadow-lg ring-4 ${c.ring} flex items-center justify-center`}>
      <Icon className={iconSz} />
    </div>
  );
}

export function leagueLabel(l: League) {
  return (CONFIG[l] || CONFIG.bronze).label;
}