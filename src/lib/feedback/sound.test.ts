import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isSoundEnabled, MAX_COMBO_STEP, SFX_STORAGE_KEY, stepFrequency } from '@/lib/feedback';

describe('stepFrequency', () => {
  it('monte strictement avec le combo', () => {
    const freqs = Array.from({ length: MAX_COMBO_STEP + 1 }, (_, step) => stepFrequency(step));
    for (let i = 1; i < freqs.length; i++) {
      expect(freqs[i]).toBeGreaterThan(freqs[i - 1]);
    }
  });

  it('borne les paliers hors intervalle', () => {
    expect(stepFrequency(-5)).toBe(stepFrequency(0));
    expect(stepFrequency(99)).toBe(stepFrequency(MAX_COMBO_STEP));
  });

  it('couvre une octave du premier au dernier palier', () => {
    expect(stepFrequency(MAX_COMBO_STEP)).toBeCloseTo(stepFrequency(0) * 2, 5);
  });

  it('retombe sur le premier palier pour une entrée invalide', () => {
    expect(stepFrequency(Number.NaN)).toBe(stepFrequency(0));
  });
});

describe('isSoundEnabled', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('clé absente : actif dans le player, muet dans le reste de l’app', () => {
    expect(isSoundEnabled('player')).toBe(true);
    expect(isSoundEnabled('app')).toBe(false);
  });

  it('clé à "true" : actif dans les deux scopes', () => {
    window.localStorage.setItem(SFX_STORAGE_KEY, 'true');
    expect(isSoundEnabled('player')).toBe(true);
    expect(isSoundEnabled('app')).toBe(true);
  });

  it('clé à "false" : muet dans les deux scopes, player compris', () => {
    window.localStorage.setItem(SFX_STORAGE_KEY, 'false');
    expect(isSoundEnabled('player')).toBe(false);
    expect(isSoundEnabled('app')).toBe(false);
  });

  it('scope par défaut : app', () => {
    expect(isSoundEnabled()).toBe(false);
  });
});
