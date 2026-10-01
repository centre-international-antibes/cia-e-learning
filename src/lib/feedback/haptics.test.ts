import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { feedback } from '@/lib/feedback';

/** `navigator.vibrate` n'existe pas dans jsdom : on l'installe pour observer. */
function installVibrate() {
  const spy = vi.fn();
  Object.defineProperty(navigator, 'vibrate', {
    value: spy,
    configurable: true,
    writable: true,
  });
  return spy;
}

describe('feedback — haptique', () => {
  let vibrate: ReturnType<typeof installVibrate>;

  beforeEach(() => {
    vibrate = installVibrate();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    Reflect.deleteProperty(navigator, 'vibrate');
  });

  it('tap() ne vibre pas hors du player', () => {
    feedback.tap();
    feedback.tap({ scope: 'app' });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('tap() vibre dans le player', () => {
    feedback.tap({ scope: 'player' });
    expect(vibrate).toHaveBeenCalledWith(8);
  });

  it('select() suit la même règle que tap()', () => {
    feedback.select({ scope: 'app' });
    expect(vibrate).not.toHaveBeenCalled();
    feedback.select({ scope: 'player' });
    expect(vibrate).toHaveBeenCalledWith(8);
  });

  it('les retours de progression vibrent dans les deux scopes', () => {
    feedback.correct(0, { scope: 'app' });
    expect(vibrate).toHaveBeenLastCalledWith(12);

    feedback.correct(3, { scope: 'player' });
    expect(vibrate).toHaveBeenLastCalledWith([10, 30, 10, 30, 20]);

    feedback.wrong({ scope: 'app' });
    expect(vibrate).toHaveBeenLastCalledWith([20, 40, 20]);

    feedback.complete({ scope: 'app' });
    expect(vibrate).toHaveBeenLastCalledWith([50, 30, 50, 30, 100]);

    feedback.levelUp({ scope: 'app' });
    expect(vibrate).toHaveBeenLastCalledWith([50, 30, 50, 30, 100]);

    feedback.chest({ scope: 'app' });
    expect(vibrate).toHaveBeenLastCalledWith([10, 30, 10, 30, 20]);
  });

  it('ne vibre pas quand l’API est absente', () => {
    Reflect.deleteProperty(navigator, 'vibrate');
    expect(() => feedback.correct(0, { scope: 'player' })).not.toThrow();
  });
});
