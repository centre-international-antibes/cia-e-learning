import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Pressable } from '@/components/ui/pressable';

describe('Pressable', () => {
  it('rend un bouton par défaut', () => {
    render(<Pressable>Valider</Pressable>);
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
  });

  it('rend l’enfant avec asChild', () => {
    render(
      <Pressable asChild>
        <a href="/cours">Reprendre</a>
      </Pressable>,
    );
    expect(screen.getByRole('link', { name: 'Reprendre' })).toBeInTheDocument();
  });

  it('ne remonte pas l’enfant entre deux renders (asChild)', () => {
    const { rerender } = render(
      <Pressable asChild tone="primary">
        <a href="/cours" data-testid="child">
          Reprendre
        </a>
      </Pressable>,
    );
    const first = screen.getByTestId('child');

    rerender(
      <Pressable asChild tone="success" depth="lg" pressed>
        <a href="/cours" data-testid="child">
          Reprendre
        </a>
      </Pressable>,
    );

    // Même nœud DOM : le composant motion est créé au niveau module, donc
    // l'identité du type ne change pas d'un render à l'autre.
    expect(screen.getByTestId('child')).toBe(first);
    expect(first.isConnected).toBe(true);
  });

  it('expose l’état sélectionné', () => {
    render(<Pressable pressed>Option A</Pressable>);
    expect(screen.getByRole('button', { name: 'Option A' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
