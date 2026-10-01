import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RollingNumber } from '@/components/ui/rolling-number';

/** Chiffres affichés, sans séparateur de milliers ni espace insécable. */
function shown(): number {
  const text = screen.getByTestId('rolling').textContent ?? '';
  return Number(text.replace(/[^\d-]/g, ''));
}

describe('RollingNumber', () => {
  it('affiche la valeur initiale telle quelle', () => {
    render(<RollingNumber value={120} data-testid="rolling" />);
    expect(shown()).toBe(120);
  });

  it('atteint la valeur finale après une mise à jour', async () => {
    const { rerender } = render(<RollingNumber value={120} data-testid="rolling" />);
    rerender(<RollingNumber value={125} data-testid="rolling" />);
    await waitFor(() => expect(shown()).toBe(125));
  });

  it('ne repasse jamais par zéro entre deux valeurs', async () => {
    const seen: number[] = [];
    const { rerender } = render(<RollingNumber value={120} data-testid="rolling" />);
    seen.push(shown());

    rerender(<RollingNumber value={125} data-testid="rolling" />);
    // On échantillonne pendant toute l'animation.
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      seen.push(shown());
    }
    await waitFor(() => expect(shown()).toBe(125));
    seen.push(shown());

    expect(Math.min(...seen)).toBeGreaterThanOrEqual(120);
    expect(Math.max(...seen)).toBeLessThanOrEqual(125);
  });

  it('applique préfixe et suffixe', () => {
    render(<RollingNumber value={42} prefix="+" suffix=" XP" data-testid="rolling" />);
    expect(screen.getByTestId('rolling').textContent).toBe('+42 XP');
  });
});
