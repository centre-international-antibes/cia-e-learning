import type { Achievement } from '@/data/achievements';

/**
 * Types de récompenses orchestrées par le Reward Director.
 *
 * Deux échelles :
 *   - **meso** : court, non bloquant (XP, série, badge, module débloqué, succès) ;
 *   - **macro** : plein écran, marque un cap (passage de niveau, palier de série).
 *
 * La file sert les meso dans l'ordre d'arrivée, puis les macro : un passage de
 * niveau se regarde après avoir vu ce qui l'a produit, pas avant.
 */

export type RewardKind =
  | 'xp'
  | 'streak'
  | 'badge'
  | 'unlock'
  | 'achievement'
  | 'levelUp'
  | 'streakMilestone';

export type RewardScale = 'meso' | 'macro';

export const REWARD_SCALE: Record<RewardKind, RewardScale> = {
  xp: 'meso',
  streak: 'meso',
  badge: 'meso',
  unlock: 'meso',
  achievement: 'meso',
  levelUp: 'macro',
  streakMilestone: 'macro',
};

interface BaseReward {
  /** Identifiant de dédoublonnage ; `kind + id` doit être stable. */
  id: string;
}

export interface XpReward extends BaseReward {
  kind: 'xp';
  amount: number;
  label?: string;
}

export interface StreakReward extends BaseReward {
  kind: 'streak';
  days: number;
  xp?: number;
}

export interface BadgeReward extends BaseReward {
  kind: 'badge';
  label: string;
  emoji?: string;
}

export interface UnlockReward extends BaseReward {
  kind: 'unlock';
  label: string;
  emoji?: string;
}

export interface AchievementReward extends BaseReward {
  kind: 'achievement';
  achievement: Achievement;
}

export interface LevelUpReward extends BaseReward {
  kind: 'levelUp';
  level: string;
  previousLevel?: string;
  /**
   * Ce qui a été fait dans l'unité qu'on vient de terminer. Renseigné par le
   * parcours, qui est le seul à le savoir ; le moment de fin de niveau de la
   * refonte s'en sert pour son chiffre géant, et s'en passe sinon.
   */
  unit?: { tint: string; modules: number; lessons: number };
}

export interface StreakMilestoneReward extends BaseReward {
  kind: 'streakMilestone';
  streak: number;
}

export type Reward =
  | XpReward
  | StreakReward
  | BadgeReward
  | UnlockReward
  | AchievementReward
  | LevelUpReward
  | StreakMilestoneReward;

/** Récompense enfilée, avec sa date d'arrivée (ordre et dédoublonnage). */
export interface QueuedReward {
  reward: Reward;
  queuedAt: number;
  key: string;
}

export const rewardKey = (reward: Reward): string => `${reward.kind}:${reward.id}`;

export const rewardScale = (reward: Reward): RewardScale => REWARD_SCALE[reward.kind];

/** Durée d'affichage par défaut, en millisecondes. */
export const REWARD_DURATION: Record<RewardScale, number> = {
  meso: 2500,
  macro: 5000,
};

/** Fenêtre de dédoublonnage : une même clé ne repasse pas avant 10 s. */
export const DEDUPE_WINDOW_MS = 10_000;
