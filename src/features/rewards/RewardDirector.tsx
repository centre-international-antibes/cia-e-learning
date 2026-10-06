import * as React from 'react';

import { feedback } from '@/lib/feedback';
import { isRedesign } from '@/lib/redesign';
import { emptyQueue, enqueueReward, dequeueReward, markShown, type QueueState } from './queue';
import { REWARD_DURATION, rewardScale, type Reward } from './types';

/**
 * Reward Director — l'unique chef d'orchestre des récompenses visibles.
 *
 * Avant lui, une fin de leçon pouvait lancer en même temps un toast XP, un
 * toast badge, un toast de déblocage et une modale de niveau : quatre choses
 * concurrentes, dont certaines pendant que l'apprenant lisait encore sa leçon.
 *
 * Ici tout passe par `enqueue`, une seule célébration est à l'écran à la fois,
 * et `hold()` permet au player de retenir la file jusqu'à l'écran de fin.
 */

export interface RewardsApi {
  /** Met une récompense dans la file (dédoublonnée sur 10 s). */
  enqueue: (reward: Reward) => void;
  /** Retient la file : rien ne s'affiche jusqu'au `release()` correspondant. */
  hold: () => void;
  /** Relâche un `hold()`. La file reprend quand tous les holds sont levés. */
  release: () => void;
  /** Récompense affichée en ce moment, `null` si rien. */
  current: Reward | null;
  /** Passe la récompense courante. */
  skip: () => void;
  /** Nombre de récompenses en attente, courante comprise. */
  pending: number;
  /** La file est-elle retenue ? */
  held: boolean;
}

const RewardsContext = React.createContext<RewardsApi | null>(null);

/** Son et haptique associés à chaque type de récompense. */
function playFeedback(reward: Reward) {
  switch (reward.kind) {
    case 'levelUp':
      // Sous la refonte, le moment de fin de niveau joue son son **à la pose de
      // la carte** et pas à son départ (MOTION.md § 6) : il s'en charge
      // lui-même, sinon le son précéderait de 560 ms ce qu'on voit.
      if (!isRedesign()) feedback.levelUp();
      break;
    case 'unlock':
      feedback.chest();
      break;
    case 'xp':
    case 'streak':
    case 'badge':
    case 'achievement':
    case 'streakMilestone':
      feedback.complete();
      break;
  }
}

/**
 * Récompenses qui attendent un geste plutôt qu'une minuterie.
 *
 * Le moment de fin de niveau n'arrive qu'une fois par unité : c'est la
 * récompense elle-même, et la faire disparaître au bout de cinq secondes, c'est
 * la retirer. Il porte sa propre fermeture — son action, un tap n'importe où,
 * Échap — donc le Director le laisse en place.
 *
 * Les célébrations historiques, elles, n'ont aucune fermeture visible
 * (`[&>button]:hidden`) : leur minuterie reste leur seule sortie sur mobile.
 */
function waitsForDismiss(reward: Reward): boolean {
  return isRedesign() && reward.kind === 'levelUp';
}

export interface RewardDirectorProviderProps {
  children: React.ReactNode;
  /** Rendu des récompenses ; injectable pour les tests. */
  stage?: React.ComponentType;
}

export function RewardDirectorProvider({ children, stage: Stage }: RewardDirectorProviderProps) {
  const [state, setState] = React.useState<QueueState>(emptyQueue);
  const [holds, setHolds] = React.useState(0);

  const held = holds > 0;
  const currentEntry = held ? null : (state.queue[0] ?? null);
  const current = currentEntry?.reward ?? null;

  const enqueue = React.useCallback((reward: Reward) => {
    setState((prev) => enqueueReward(prev, reward));
  }, []);

  const skip = React.useCallback(() => {
    setState((prev) => dequeueReward(prev));
  }, []);

  const hold = React.useCallback(() => setHolds((n) => n + 1), []);
  const release = React.useCallback(() => setHolds((n) => Math.max(0, n - 1)), []);

  // Son et haptique au moment où la récompense devient visible. C'est aussi là
  // que la file apprend qu'elle est vue, et la verrouille contre les arrivées.
  React.useEffect(() => {
    if (!current) return;
    playFeedback(current);
    setState(markShown);
  }, [current]);

  // Avance automatique — sauf pour celles qui attendent un geste.
  //
  // La durée ne change pas sous `prefers-reduced-motion` : réduire le mouvement
  // ne veut pas dire réduire le temps de lecture. C'est même l'inverse — un
  // écran qui n'anime pas se lit aussi longtemps, pas deux fois plus vite.
  React.useEffect(() => {
    if (!current || waitsForDismiss(current)) return;
    const timer = window.setTimeout(skip, REWARD_DURATION[rewardScale(current)]);
    return () => window.clearTimeout(timer);
  }, [current, skip]);

  // Échap passe la récompense courante.
  React.useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, skip]);

  const api = React.useMemo<RewardsApi>(
    () => ({
      enqueue,
      hold,
      release,
      current,
      skip,
      pending: state.queue.length,
      held,
    }),
    [enqueue, hold, release, current, skip, state.queue.length, held],
  );

  return (
    <RewardsContext.Provider value={api}>
      {children}
      {Stage ? <Stage /> : null}
    </RewardsContext.Provider>
  );
}

export function useRewards(): RewardsApi {
  const ctx = React.useContext(RewardsContext);
  if (!ctx) {
    throw new Error('useRewards doit être utilisé sous <RewardDirectorProvider>');
  }
  return ctx;
}

/**
 * Variante tolérante : renvoie `null` hors provider, pour les composants qui
 * peuvent être rendus isolément (tests, Motion Lab, Storybook).
 */
export function useOptionalRewards(): RewardsApi | null {
  return React.useContext(RewardsContext);
}
