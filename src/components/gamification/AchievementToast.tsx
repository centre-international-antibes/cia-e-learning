import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Flame, Sparkles, Crown, Medal, Target, Trophy, Star, Rocket, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Achievement, AchievementIcon, AchievementRarity } from '@/data/achievements';

const ICONS: Record<AchievementIcon, React.ComponentType<{ className?: string }>> = {
  graduation: GraduationCap, flame: Flame, sparkles: Sparkles, crown: Crown,
  medal: Medal, target: Target, trophy: Trophy, star: Star, rocket: Rocket, heart: Heart,
};

const RARITY_STYLES: Record<AchievementRarity, string> = {
  common:    'from-cia-blue-50 to-cia-blue-100 border-cia-blue-300 text-cia-blue-700',
  rare:      'from-cia-gold-50 to-cia-gold-100 border-cia-gold-300 text-cia-gold-700',
  epic:      'from-cia-spark-light/15 to-cia-spark-mid/20 border-cia-spark-mid/60 text-cia-blue-700',
  legendary: 'from-cia-gold-100 to-cia-gold-200 border-cia-gold-400 text-cia-gold-700 shadow-glow',
};

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, x: 80, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-[201] max-w-sm cursor-pointer"
          onClick={onDismiss}
        >
          <div className={cn(
            'flex items-start gap-3 rounded-xl border-2 bg-gradient-to-br p-4 shadow-xl',
            RARITY_STYLES[achievement.rarity],
          )}>
            <div className="h-12 w-12 rounded-full bg-white/70 flex items-center justify-center shrink-0 shadow-inner">
              {(() => {
                const Icon = ICONS[achievement.icon];
                return <Icon className="h-6 w-6" />;
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-bold opacity-80">
                {t(`achievements.rarity.${achievement.rarity}`)} · {t('achievements.unlocked')}
              </p>
              <p className="font-bold font-display text-base leading-tight mt-0.5">
                {t(achievement.titleKey)}
              </p>
              <p className="text-xs opacity-90 mt-1">{t(achievement.descriptionKey)}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}