import { describe, expect, it } from 'vitest';

import { emptyQueue, enqueueReward, dequeueReward, markShown } from '@/features/rewards/queue';
import { DEDUPE_WINDOW_MS, type Reward } from '@/features/rewards/types';

const xp = (id: string, amount = 50): Reward => ({ kind: 'xp', id, amount });
const badge = (id: string): Reward => ({ kind: 'badge', id, label: `Badge ${id}` });
const levelUp = (id: string): Reward => ({ kind: 'levelUp', id, level: id });
const milestone = (id: string): Reward => ({ kind: 'streakMilestone', id, streak: 7 });

const kinds = (state: ReturnType<typeof emptyQueue>) => state.queue.map((q) => q.reward.kind);

describe('file des récompenses', () => {
  it('sert les meso dans l’ordre d’arrivée', () => {
    let s = emptyQueue();
    s = enqueueReward(s, xp('a'), 1000);
    s = enqueueReward(s, badge('b'), 1001);
    expect(kinds(s)).toEqual(['xp', 'badge']);
  });

  it('place toujours les macro après les meso, même arrivées avant', () => {
    let s = emptyQueue();
    s = enqueueReward(s, levelUp('A2'), 1000);
    s = enqueueReward(s, xp('a'), 1001);
    s = enqueueReward(s, badge('b'), 1002);
    expect(kinds(s)).toEqual(['xp', 'badge', 'levelUp']);
  });

  it('garde l’ordre d’arrivée entre deux macro', () => {
    let s = emptyQueue();
    s = enqueueReward(s, levelUp('A2'), 1000);
    s = enqueueReward(s, milestone('7'), 1001);
    expect(s.queue.map((q) => q.reward.id)).toEqual(['A2', '7']);
  });

  it('ignore un doublon dans la fenêtre de dédoublonnage', () => {
    let s = emptyQueue();
    s = enqueueReward(s, badge('A1.1'), 1000);
    s = enqueueReward(s, badge('A1.1'), 1000 + DEDUPE_WINDOW_MS - 1);
    expect(s.queue).toHaveLength(1);
  });

  it('réaccepte la même clé une fois la fenêtre passée', () => {
    let s = emptyQueue();
    s = enqueueReward(s, badge('A1.1'), 1000);
    s = dequeueReward(s);
    s = enqueueReward(s, badge('A1.1'), 1000 + DEDUPE_WINDOW_MS + 1);
    expect(s.queue).toHaveLength(1);
  });

  it('distingue deux récompenses de même type mais d’id différent', () => {
    let s = emptyQueue();
    s = enqueueReward(s, badge('A1.1'), 1000);
    s = enqueueReward(s, badge('A1.2'), 1001);
    expect(s.queue).toHaveLength(2);
  });

  it('défile une récompense à la fois', () => {
    let s = emptyQueue();
    s = enqueueReward(s, xp('a'), 1000);
    s = enqueueReward(s, levelUp('A2'), 1001);
    s = dequeueReward(s);
    expect(kinds(s)).toEqual(['levelUp']);
    s = dequeueReward(s);
    expect(s.queue).toHaveLength(0);
    expect(dequeueReward(s).queue).toHaveLength(0);
  });

  it('ordonne une fin de leçon complète : xp, badge, unlock, puis niveau', () => {
    let s = emptyQueue();
    s = enqueueReward(s, xp('lesson-1'), 1000);
    s = enqueueReward(s, { kind: 'streak', id: 'd1', days: 3 }, 1001);
    s = enqueueReward(s, levelUp('A2'), 1002);
    s = enqueueReward(s, { kind: 'unlock', id: 'A1.2', label: 'A1.2' }, 1003);
    expect(kinds(s)).toEqual(['xp', 'streak', 'unlock', 'levelUp']);
  });

  it("ne coupe pas la récompense à l'écran : une meso tardive passe derrière", () => {
    let s = emptyQueue();
    s = enqueueReward(s, levelUp('A2'), 1000);
    s = markShown(s); // la macro est passée à l'écran
    s = enqueueReward(s, { kind: 'unlock', id: 'A1.2', label: 'A1.2' }, 1500);
    expect(kinds(s)).toEqual(['levelUp', 'unlock']);
  });

  it('range les meso devant une macro qui attend encore son tour', () => {
    let s = emptyQueue();
    s = enqueueReward(s, levelUp('A2'), 1000);
    s = enqueueReward(s, { kind: 'badge', id: 'b', label: 'b' }, 1002);
    expect(kinds(s)).toEqual(['badge', 'levelUp']);
  });

  it('le verrou part avec la récompense qui sort', () => {
    let s = emptyQueue();
    s = enqueueReward(s, levelUp('A2'), 1000);
    s = markShown(s);
    s = dequeueReward(s);
    expect(s.shown).toBeUndefined();
  });
});
