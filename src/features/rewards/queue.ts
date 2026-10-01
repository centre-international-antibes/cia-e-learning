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
}

export const emptyQueue = (): QueueState => ({ queue: [], seen: new Map() });

/** Position d'insertion : à la fin des meso si la récompense est meso. */
function insertionIndex(queue: QueuedReward[], reward: Reward): number {
  if (rewardScale(reward) === 'macro') return queue.length;
  const firstMacro = queue.findIndex((q) => rewardScale(q.reward) === 'macro');
  return firstMacro === -1 ? queue.length : firstMacro;
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
  queue.splice(insertionIndex(queue, reward), 0, entry);

  const seen = new Map(state.seen);
  seen.set(key, now);
  // On ne garde que les clés encore utiles au dédoublonnage.
  for (const [k, at] of seen) {
    if (now - at >= DEDUPE_WINDOW_MS) seen.delete(k);
  }

  return { queue, seen };
}

export function dequeueReward(state: QueueState): QueueState {
  if (state.queue.length === 0) return state;
  return { ...state, queue: state.queue.slice(1) };
}
