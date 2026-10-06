import { DEDUPE_WINDOW_MS, rewardKey, rewardScale, type QueuedReward, type Reward } from './types';

/**
 * File des récompenses — logique pure, testable sans React.
 *
 * Deux règles tiennent tout :
 *   - les meso passent dans leur ordre d'arrivée, les macro toujours après ;
 *   - une même clé (`kind:id`) ne repasse pas dans les 10 s, pour absorber les
 *     doublons (un événement émis à la fois par le serveur et par un listener).
 */

export interface QueueState {
  queue: QueuedReward[];
  /** Dernière apparition de chaque clé, pour le dédoublonnage. */
  seen: Map<string, number>;
  /**
   * Clé de la récompense **déjà passée à l'écran**, posée par le Director au
   * moment où elle devient visible. Tant qu'elle est là, plus rien ne passe
   * devant : une macro qu'on est en train de regarder ne se fait pas couper.
   */
  shown?: string;
}

export const emptyQueue = (): QueueState => ({ queue: [], seen: new Map() });

/** Le Director annonce que la tête de file est à l'écran. */
export function markShown(state: QueueState): QueueState {
  const head = state.queue[0];
  if (!head || state.shown === head.key) return state;
  return { ...state, shown: head.key };
}

/**
 * Position d'insertion : à la fin des meso si la récompense est meso, de sorte
 * qu'une macro se regarde toujours **après** ce qui l'a produite.
 *
 * Une seule réserve : si la tête de file est déjà à l'écran, on ne lui passe
 * pas devant. Sans cela, un succès débloqué entre-temps coupait en deux le
 * passage de niveau qu'on regardait, avant de le laisser reprendre à zéro.
 */
function insertionIndex(queue: QueuedReward[], reward: Reward, shown?: string): number {
  const locked = queue.length > 0 && queue[0].key === shown ? 1 : 0;
  if (rewardScale(reward) === 'macro') return queue.length;
  const firstMacro = queue.findIndex((q) => rewardScale(q.reward) === 'macro');
  return Math.max(firstMacro === -1 ? queue.length : firstMacro, locked);
}

export function enqueueReward(
  state: QueueState,
  reward: Reward,
  now: number = Date.now(),
): QueueState {
  const key = rewardKey(reward);
  const lastSeen = state.seen.get(key);
  if (lastSeen !== undefined && now - lastSeen < DEDUPE_WINDOW_MS) {
    return state; // doublon dans la fenêtre : on ignore
  }

  const entry: QueuedReward = { reward, queuedAt: now, key };
  const queue = [...state.queue];
  queue.splice(insertionIndex(queue, reward, state.shown), 0, entry);

  const seen = new Map(state.seen);
  seen.set(key, now);
  // On ne garde que les clés encore utiles au dédoublonnage.
  for (const [k, at] of seen) {
    if (now - at >= DEDUPE_WINDOW_MS) seen.delete(k);
  }

  return { ...state, queue, seen };
}

export function dequeueReward(state: QueueState): QueueState {
  if (state.queue.length === 0) return state;
  // Celle qui part emporte le verrou : la suivante n'est pas encore vue.
  return { ...state, queue: state.queue.slice(1), shown: undefined };
}
