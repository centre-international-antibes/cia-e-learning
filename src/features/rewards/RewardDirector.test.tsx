import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Import direct (et non via l'index) : la scène tire les composants de
// célébration, donc Lottie, que jsdom ne sait pas rendre. Ce test porte sur la
// file et le hold, pas sur le rendu.
import { RewardDirectorProvider, useRewards } from '@/features/rewards/RewardDirector';

/** Sonde : affiche l'état du Director et permet de le piloter. */
function Probe() {
  const { enqueue, hold, release, current, skip, pending, held } = useRewards();
  return (
    <div>
      <span data-testid="current">{current ? `${current.kind}:${current.id}` : 'none'}</span>
      <span data-testid="pending">{pending}</span>
      <span data-testid="held">{String(held)}</span>
      <button onClick={() => enqueue({ kind: 'xp', id: 'a', amount: 10 })}>xp</button>
      <button onClick={() => enqueue({ kind: 'levelUp', id: 'A2', level: 'A2' })}>level</button>
      <button onClick={() => enqueue({ kind: 'badge', id: 'b', label: 'Badge' })}>badge</button>
      <button onClick={hold}>hold</button>
      <button onClick={release}>release</button>
      <button onClick={skip}>skip</button>
    </div>
  );
}

const click = (name: string) => act(() => screen.getByText(name).click());
const current = () => screen.getByTestId('current').textContent;

describe('RewardDirector', () => {
  it('n’affiche rien quand la file est vide', () => {
    render(
      <RewardDirectorProvider>
        <Probe />
      </RewardDirectorProvider>,
    );
    expect(current()).toBe('none');
  });

  it('affiche une seule récompense à la fois, macro en dernier', () => {
    render(
      <RewardDirectorProvider>
        <Probe />
      </RewardDirectorProvider>,
    );
    click('level');
    click('xp');
    click('badge');

    expect(screen.getByTestId('pending').textContent).toBe('3');
    expect(current()).toBe('xp:a');
    click('skip');
    expect(current()).toBe('badge:b');
    click('skip');
    expect(current()).toBe('levelUp:A2');
    click('skip');
    expect(current()).toBe('none');
  });

  it('hold() retient la file, release() la relâche', () => {
    render(
      <RewardDirectorProvider>
        <Probe />
      </RewardDirectorProvider>,
    );
    click('hold');
    click('xp');
    expect(screen.getByTestId('held').textContent).toBe('true');
    expect(current()).toBe('none');
    expect(screen.getByTestId('pending').textContent).toBe('1');

    click('release');
    expect(current()).toBe('xp:a');
  });

  it('dédoublonne une même récompense enfilée deux fois de suite', () => {
    render(
      <RewardDirectorProvider>
        <Probe />
      </RewardDirectorProvider>,
    );
    click('xp');
    click('xp');
    expect(screen.getByTestId('pending').textContent).toBe('1');
  });

  it('Échap passe la récompense courante', () => {
    render(
      <RewardDirectorProvider>
        <Probe />
      </RewardDirectorProvider>,
    );
    click('xp');
    expect(current()).toBe('xp:a');
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(current()).toBe('none');
  });
});
