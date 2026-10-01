import * as React from 'react';

import { useAchievements } from '@/hooks/useAchievements';
import { useRewards } from './RewardDirector';

/**
 * Adaptateur des anciens événements `window` vers la file du Director.
 *
 * `level-up`, `streak-milestone` et `achievement-unlocked` sont encore émis
 * par des hooks (succès) et par le défi du jour. Plutôt que de laisser chacun
 * ouvrir sa propre célébration — c'était le rôle de `GamificationOverlay` —
 * on les fait entrer dans la file commune.
 */
export function RewardEventBridge() {
  // Les succès continuent d'être calculés ici ; leur event est capté ci-dessous.
  useAchievements();
  const { enqueue } = useRewards();

  React.useEffect(() => {
    const onLevelUp = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.level) return;
      enqueue({
        kind: 'levelUp',
        id: String(detail.level),
        level: detail.level,
        previousLevel: detail.previousLevel,
      });
    };

    const onStreakMilestone = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.streak || ![7, 14, 30, 100].includes(detail.streak)) return;
      enqueue({ kind: 'streakMilestone', id: String(detail.streak), streak: detail.streak });
    };

    const onAchievement = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.achievement) return;
      enqueue({
        kind: 'achievement',
        id: detail.achievement.id,
        achievement: detail.achievement,
      });
    };

    window.addEventListener('level-up', onLevelUp);
    window.addEventListener('streak-milestone', onStreakMilestone);
    window.addEventListener('achievement-unlocked', onAchievement);
    return () => {
      window.removeEventListener('level-up', onLevelUp);
      window.removeEventListener('streak-milestone', onStreakMilestone);
      window.removeEventListener('achievement-unlocked', onAchievement);
    };
  }, [enqueue]);

  return null;
}
