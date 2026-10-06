import * as React from 'react';

import { XPBurst } from '@/components/gamification/XPBurst';
import { LevelUpCelebration } from '@/components/gamification/LevelUpCelebration';
import { StreakMilestone } from '@/components/gamification/StreakMilestone';
import { AchievementToast } from '@/components/gamification/AchievementToast';
import { LevelCompleteMoment } from '@/features/parcours/LevelCompleteMoment';
import { notify } from '@/lib/notify';
import { useRedesign } from '@/lib/redesign';
import { useRewards } from './RewardDirector';
import type { Reward } from './types';

/**
 * Scène des récompenses — rend la récompense courante avec les composants
 * existants, sans les modifier (leur refonte visuelle est M5).
 *
 * Les récompenses « toast » (série, badge, module débloqué) passent toujours
 * par sonner : ce qui change, c'est qu'elles sont déclenchées une par une par
 * le Director, et plus en rafale par les appelants.
 */

function xpOrigin(): { x: number; y: number } {
  const el = document.querySelector('[data-xp-origin]');
  if (el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: window.innerWidth - 80, y: 50 };
}

/** Récompenses rendues par un toast : le Director n'a qu'à le déclencher. */
function fireToast(reward: Reward): boolean {
  switch (reward.kind) {
    case 'streak':
      notify.streak(reward.days, reward.xp);
      return true;
    case 'badge':
      notify.badge(reward.label, reward.emoji);
      return true;
    case 'unlock':
      notify.unlock(reward.label, reward.emoji);
      return true;
    default:
      return false;
  }
}

export function RewardStage() {
  const { current, skip } = useRewards();
  const redesign = useRedesign();
  const firedRef = React.useRef<Reward | null>(null);

  // Les toasts sont « tirés » une fois, à l'affichage de la récompense.
  React.useEffect(() => {
    if (!current || firedRef.current === current) return;
    firedRef.current = current;
    fireToast(current);
  }, [current]);

  if (!current) return null;

  switch (current.kind) {
    case 'xp': {
      const origin = xpOrigin();
      return (
        <XPBurst
          key={`${current.kind}-${current.id}`}
          x={origin.x}
          y={origin.y}
          amount={current.amount}
          onComplete={skip}
        />
      );
    }
    case 'achievement':
      return (
        <AchievementToast
          key={`${current.kind}-${current.id}`}
          achievement={current.achievement}
          onDismiss={skip}
        />
      );
    case 'levelUp':
      // La refonte remplace la modale historique par le moment signature n° 4 :
      // carte qui arrive de loin, se pose, et inclinaison 3D au doigt.
      if (redesign) {
        return (
          <LevelCompleteMoment
            key={`${current.kind}-${current.id}`}
            level={current.previousLevel ?? current.level}
            nextLevel={
              current.previousLevel && current.previousLevel !== current.level
                ? current.level
                : undefined
            }
            tint={current.unit?.tint ?? 'hsl(var(--cia-blue-500))'}
            modules={current.unit?.modules ?? 0}
            lessons={current.unit?.lessons ?? 0}
            onClose={skip}
          />
        );
      }
      return (
        <LevelUpCelebration
          key={`${current.kind}-${current.id}`}
          level={current.level}
          previousLevel={current.previousLevel}
          open
          onClose={skip}
        />
      );
    case 'streakMilestone':
      return (
        <StreakMilestone
          key={`${current.kind}-${current.id}`}
          streak={current.streak}
          open
          onClose={skip}
        />
      );
    default:
      // streak / badge / unlock : rendus par le toast tiré ci-dessus.
      return null;
  }
}
