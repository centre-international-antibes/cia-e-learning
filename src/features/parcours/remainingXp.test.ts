import { describe, expect, it } from 'vitest';

import { ESTIMATED_LESSON_XP, remainingXp } from './remainingXp';

/**
 * XP restante annoncée par la feuille de départ.
 *
 * Ce test vaut surtout pour l'estimation : **aucun module du programme n'est
 * aujourd'hui à moitié rempli** — 17 le sont entièrement, 13 pas du tout, zéro
 * entre les deux. L'estimation ne se déclenche donc jamais à l'écran, et seul
 * ce test dit ce qu'elle fera le jour où une leçon sera mise en ligne seule.
 */
const lesson = (completed: boolean, href?: string) => ({ completed, href });

describe('XP restante de la feuille', () => {
  it('ne compte pas les leçons déjà faites', () => {
    const { total, estimated } = remainingXp([lesson(true, '/cours/lesson-1')]);
    expect(total).toBe(0);
    expect(estimated).toBe(false);
  });

  it('estime une leçon sans contenu à la médiane, et le dit', () => {
    const { total, estimated } = remainingXp([lesson(false), lesson(false)]);
    expect(total).toBe(ESTIMATED_LESSON_XP * 2);
    expect(estimated).toBe(true);
  });

  it('mélange le barème réel et l’estimation sur un module à moitié rempli', () => {
    const { total, estimated } = remainingXp([
      lesson(false, '/cours/lesson-1'),
      lesson(false),
    ]);
    // La leçon 1 existe : son total vient du barème, pas de l'estimation.
    expect(total).toBeGreaterThan(ESTIMATED_LESSON_XP);
    expect(estimated).toBe(true);
  });
});
