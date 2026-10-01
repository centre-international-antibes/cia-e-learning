import { describe, expect, it } from 'vitest';

import { computeLessonXp, comboBonus } from '@/lib/xp/lessonXp';

/**
 * Ces cas doivent donner exactement le même total que `complete_lesson` en
 * SQL. Ils sont rejoués des deux côtés et listés dans la PR.
 */
describe('computeLessonXp', () => {
  it('leçon parfaite à 8 questions avec un combo de 8 → 115', () => {
    expect(computeLessonXp({ correct: 8, questionCount: 8, bestCombo: 8 })).toEqual({
      base: 50,
      correct: 40,
      combo: 5,
      perfect: 20,
      total: 115,
    });
  });

  it('aucune bonne réponse → la complétion seule', () => {
    expect(computeLessonXp({ correct: 0, questionCount: 8, bestCombo: 0 }).total).toBe(50);
  });

  it('sans faute sur 10 questions avec combo 10 → palier haut', () => {
    expect(computeLessonXp({ correct: 10, questionCount: 10, bestCombo: 10 })).toEqual({
      base: 50,
      correct: 50,
      combo: 10,
      perfect: 20,
      total: 130,
    });
  });

  it('une faute : ni combo ni bonus parfait', () => {
    expect(computeLessonXp({ correct: 5, questionCount: 6, bestCombo: 4 })).toEqual({
      base: 50,
      correct: 25,
      combo: 0,
      perfect: 0,
      total: 75,
    });
  });

  it('leçon sans question : pas de bonus parfait', () => {
    expect(computeLessonXp({ correct: 0, questionCount: 0, bestCombo: 0 })).toEqual({
      base: 50,
      correct: 0,
      combo: 0,
      perfect: 0,
      total: 50,
    });
  });
});

describe('paliers de combo', () => {
  it('franchit à 5 et à 10, sans cumuler', () => {
    expect(comboBonus(0)).toBe(0);
    expect(comboBonus(4)).toBe(0);
    expect(comboBonus(5)).toBe(5);
    expect(comboBonus(9)).toBe(5);
    expect(comboBonus(10)).toBe(10);
    expect(comboBonus(25)).toBe(10);
  });
});

describe('résultats incohérents', () => {
  it('borne les bonnes réponses au nombre de questions', () => {
    expect(computeLessonXp({ correct: 99, questionCount: 6, bestCombo: 99 }).correct).toBe(30);
  });

  it('borne le combo au nombre de bonnes réponses', () => {
    expect(computeLessonXp({ correct: 3, questionCount: 8, bestCombo: 50 }).combo).toBe(0);
  });

  it('ne casse pas sur des entrées non numériques', () => {
    expect(
      computeLessonXp({ correct: Number.NaN, questionCount: 5, bestCombo: Number.NaN }).total,
    ).toBe(50);
  });
});
