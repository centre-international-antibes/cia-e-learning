import { describe, expect, it } from 'vitest';

import {
  currentStepIndex,
  initialPlayerState,
  isReplaying,
  lessonOutcome,
  playerReducer,
  type PlayerAction,
  type PlayerState,
} from '@/components/course-player/playerReducer';

const config = (totalSteps: number) => ({ totalSteps });

function run(state: PlayerState, actions: PlayerAction[], totalSteps: number): PlayerState {
  return actions.reduce((s, a) => playerReducer(s, a, config(totalSteps)), state);
}

const answer = (correct: boolean, replayable = true): PlayerAction => ({
  type: 'answer',
  graded: true,
  correct,
  replayable,
});
const advance = (): PlayerAction => ({ type: 'advance' });

describe('séquence nominale', () => {
  it('leçon parfaite de 8 questions : 8 justes, série de 8', () => {
    const actions = Array.from({ length: 8 }, () => [answer(true), advance()]).flat();
    const state = run(initialPlayerState(), actions, 8);

    expect(state.phase).toBe('done');
    expect(lessonOutcome(state, 8)).toEqual({
      score: 100,
      correct: 8,
      questionCount: 8,
      bestCombo: 8,
    });
  });

  it('une étape libre ne compte pas comme question', () => {
    const state = run(
      initialPlayerState(),
      [{ type: 'answer', graded: false, correct: true, replayable: false }, advance()],
      1,
    );
    expect(state.answeredCount).toBe(0);
    expect(lessonOutcome(state, 0).questionCount).toBe(0);
  });

  it('la série repart de zéro à la première erreur', () => {
    const state = run(
      initialPlayerState(),
      [answer(true), advance(), answer(true), advance(), answer(false), advance(), answer(true)],
      4,
    );
    expect(state.bestCombo).toBe(2);
    expect(state.combo).toBe(1);
  });
});

describe('rejeu des erreurs', () => {
  it('met l’étape ratée en file et la rejoue une fois, après un intertitre', () => {
    let state = run(initialPlayerState(), [answer(false), advance()], 2);
    expect(state.replayQueue).toEqual([0]);
    expect(state.phase).toBe('main');
    expect(currentStepIndex(state)).toBe(1);

    state = run(state, [answer(true), advance()], 2);
    expect(state.phase).toBe('interstitial');

    state = run(state, [advance()], 2);
    expect(state.phase).toBe('replay');
    expect(isReplaying(state)).toBe(true);
    expect(currentStepIndex(state)).toBe(0);

    state = run(state, [advance()], 2);
    expect(state.phase).toBe('done');
  });

  it('le rejeu ne touche ni au score, ni au combo, ni à l’XP', () => {
    let state = run(initialPlayerState(), [answer(false), advance(), advance()], 1);
    expect(state.phase).toBe('replay');
    const before = { ...state };

    state = run(state, [answer(true)], 1);

    expect(state.correctCount).toBe(before.correctCount);
    expect(state.answeredCount).toBe(before.answeredCount);
    expect(state.combo).toBe(before.combo);
    expect(state.bestCombo).toBe(before.bestCombo);
    expect(lessonOutcome(state, 1)).toEqual(lessonOutcome(before, 1));
  });

  it('ne rejoue pas deux fois la même étape', () => {
    const state = run(initialPlayerState(), [answer(false), answer(false)], 2);
    expect(state.replayQueue).toEqual([0]);
  });

  it('ne rejoue jamais une étape non rejouable (quiz final)', () => {
    const state = run(initialPlayerState(), [answer(false, false), advance()], 1);
    expect(state.replayQueue).toEqual([]);
    expect(state.phase).toBe('done');
  });

  it('sans erreur, il n’y a ni intertitre ni rejeu', () => {
    const state = run(initialPlayerState(), [answer(true), advance()], 1);
    expect(state.phase).toBe('done');
  });
});

describe('progression affichée', () => {
  it('ne recule jamais, même quand une erreur allonge la leçon', () => {
    let state = initialPlayerState();
    const seen: number[] = [state.progressPct];
    const actions: PlayerAction[] = [
      answer(true),
      advance(),
      answer(false),
      advance(),
      answer(false),
      advance(),
      advance(),
      advance(),
      advance(),
    ];
    for (const action of actions) {
      state = playerReducer(state, action, config(3));
      seen.push(state.progressPct);
    }
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i], `recul à l'étape ${i}`).toBeGreaterThanOrEqual(seen[i - 1]);
    }
    expect(seen[seen.length - 1]).toBe(100);
  });
});

describe('reprise de leçon', () => {
  it('restaure l’état complet, file de rejeu comprise', () => {
    const saved = run(initialPlayerState(), [answer(false), advance(), answer(true)], 3);
    const restored = playerReducer(
      initialPlayerState(),
      { type: 'restore', state: saved },
      config(3),
    );
    expect(restored).toEqual(saved);
    expect(restored.replayQueue).toEqual([0]);
  });
});
