import { StrictMode } from 'react';
import { MotionConfig } from 'framer-motion';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Lottie attaque un <canvas> dès l'import : inutile ici, et jsdom n'en a pas.
vi.mock('lottie-react', () => ({ default: () => null }));

import { CompletionScreen } from '@/components/course-player/CompletionScreen';
import type { LessonSubmitResult } from '@/components/course-player/lesson-result';
import i18n from '@/i18n';

const PERFECT_8 = {
  courseTitle: 'Les salutations',
  totalSteps: 10,
  durationSeconds: 154,
  correctCount: 8,
  totalQuestions: 8,
  bestCombo: 8,
};

/** Réponse serveur d'une leçon parfaite à 8 questions : 50 + 40 + 5 + 20. */
const REWARDED_115: LessonSubmitResult = {
  status: 'rewarded',
  xpAwarded: 115,
  breakdown: { base: 50, correct: 40, combo: 5, perfect: 20 },
  xpBefore: 1200,
  xpAfter: 1315,
};

/** Rend l'écran, mouvement coupé : tout est posé, rien à attendre. */
function renderPosed(
  result: LessonSubmitResult,
  props: Partial<React.ComponentProps<typeof CompletionScreen>> = {},
) {
  const submit = vi.fn(() => Promise.resolve(result));
  const onSettled = vi.fn();
  const onContinue = vi.fn();
  const view = render(
    <MotionConfig reducedMotion="always">
      <CompletionScreen
        {...PERFECT_8}
        submit={submit}
        onSettled={onSettled}
        onContinue={onContinue}
        {...props}
      />
    </MotionConfig>,
  );
  return { submit, onSettled, onContinue, ...view };
}

const tile = (name: string) => document.querySelector(`[data-tile="${name}"]`);
/** Le compteur de la tuile XP, sans les puces de détail qui suivent. */
const xpCounter = () => tile('xp')?.querySelector('span')?.textContent ?? '';

beforeEach(async () => {
  // jsdom n'a pas de langue de navigateur : on fixe le français, comme l'app.
  await i18n.changeLanguage('fr');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('XP affichée en fin de leçon', () => {
  it('affiche le montant du serveur, et son détail', async () => {
    renderPosed(REWARDED_115);
    // La tuile contient le total puis les puces : on lit le compteur seul.
    await waitFor(() => expect(xpCounter()).toContain('115'));

    const breakdown = document.querySelector('[data-xp-breakdown]');
    expect(breakdown?.textContent).toContain('+50 leçon');
    expect(breakdown?.textContent).toContain('+40 réponses');
    expect(breakdown?.textContent).toContain('+5 série');
    expect(breakdown?.textContent).toContain('+20 parfait');
  });

  it('ne montre que les composantes non nulles', async () => {
    renderPosed({
      status: 'rewarded',
      xpAwarded: 80,
      breakdown: { base: 50, correct: 30, combo: 0, perfect: 0 },
      xpBefore: 1200,
      xpAfter: 1280,
    });
    await waitFor(() => expect(document.querySelector('[data-xp-breakdown]')).not.toBeNull());
    const breakdown = document.querySelector('[data-xp-breakdown]');
    expect(breakdown?.textContent).toContain('+50 leçon');
    expect(breakdown?.textContent).not.toContain('série');
    expect(breakdown?.textContent).not.toContain('parfait');
  });

  it('attend le serveur avant d’annoncer un montant', async () => {
    let resolve!: (r: LessonSubmitResult) => void;
    const submit = vi.fn(
      () =>
        new Promise<LessonSubmitResult>((r) => {
          resolve = r;
        }),
    );
    render(
      <MotionConfig reducedMotion="always">
        <CompletionScreen {...PERFECT_8} submit={submit} onContinue={() => {}} />
      </MotionConfig>,
    );
    // Tant que la réponse n'est pas là : un état d'attente, aucun chiffre.
    expect(document.querySelector('[data-xp-pending]')).not.toBeNull();
    expect(tile('xp')?.textContent).not.toContain('115');

    resolve(REWARDED_115);
    await waitFor(() => expect(document.querySelector('[data-xp-pending]')).toBeNull());
    await waitFor(() => expect(xpCounter()).toContain('115'));
  });
});

describe('soumission', () => {
  it('n’est lancée qu’une fois, même en StrictMode (double montage)', async () => {
    const submit = vi.fn(() => Promise.resolve(REWARDED_115));
    render(
      <StrictMode>
        <MotionConfig reducedMotion="always">
          <CompletionScreen {...PERFECT_8} submit={submit} onContinue={() => {}} />
        </MotionConfig>
      </StrictMode>,
    );
    await waitFor(() => expect(xpCounter()).toContain('115'));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('ne reste pas bloquée si la soumission échoue', async () => {
    const submit = vi.fn(() => Promise.reject(new Error('boom')));
    const onSettled = vi.fn();
    render(
      <MotionConfig reducedMotion="always">
        <CompletionScreen
          {...PERFECT_8}
          submit={submit}
          onSettled={onSettled}
          onContinue={() => {}}
        />
      </MotionConfig>,
    );
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
    expect(screen.getByText('XP en cours de synchronisation.')).toBeInTheDocument();
  });
});

describe('statuts sans XP', () => {
  it('too_fast : 0 XP et une mention neutre', async () => {
    renderPosed({ status: 'too_fast', xpAwarded: 0, xpBefore: 1200, xpAfter: 1200 });
    await waitFor(() =>
      expect(screen.getByText('Leçon trop rapide pour être récompensée.')).toBeInTheDocument(),
    );
    await waitFor(() => expect(xpCounter()).toContain('0'));
    expect(document.querySelector('[data-xp-breakdown]')).toBeNull();
    // Pas d'éclats : il n'y a rien à faire voler.
    expect(document.querySelector('[data-xp-flight]')).toBeNull();
  });

  it('replay_cap : plafond du jour, même ton neutre', async () => {
    renderPosed({ status: 'replay_cap', xpAwarded: 0, xpBefore: 1200, xpAfter: 1200 });
    await waitFor(() =>
      expect(
        screen.getByText('XP déjà gagnée 3 fois aujourd’hui sur cette leçon.'),
      ).toBeInTheDocument(),
    );
    expect(document.querySelector('[data-xp-flight]')).toBeNull();
  });

  it('offline : l’aperçu s’affiche et « Continuer » reste actif', async () => {
    const { onContinue } = renderPosed({
      status: 'offline',
      xpAwarded: 115,
      breakdown: { base: 50, correct: 40, combo: 5, perfect: 20 },
    });
    await waitFor(() =>
      expect(screen.getByText('XP en cours de synchronisation.')).toBeInTheDocument(),
    );
    const cta = screen.getByRole('button', { name: 'Continuer' });
    expect(cta).not.toBeDisabled();
    fireEvent.click(cta);
    expect(onContinue).toHaveBeenCalled();
  });

  it('anonyme : montant local, aucune mention', async () => {
    renderPosed({
      status: 'anonymous',
      xpAwarded: 115,
      breakdown: { base: 50, correct: 40, combo: 5, perfect: 20 },
      xpBefore: 0,
      xpAfter: 115,
    });
    await waitFor(() => expect(xpCounter()).toContain('115'));
    expect(screen.queryByText(/synchronisation|trop rapide|déjà gagnée/)).toBeNull();
  });
});

describe('chorégraphie', () => {
  it('reduced-motion : état final immédiat, aucune particule', async () => {
    const { onSettled } = renderPosed(REWARDED_115);
    // Le CTA est là dès la première frame.
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument();
    expect(screen.getByText('Leçon parfaite !')).toBeInTheDocument();
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
    expect(document.querySelector('[data-xp-flight]')).toBeNull();
  });

  it('Échap saute à l’état final et libère le Director', async () => {
    const submit = vi.fn(() => Promise.resolve(REWARDED_115));
    const onSettled = vi.fn();
    render(
      <CompletionScreen
        {...PERFECT_8}
        submit={submit}
        onSettled={onSettled}
        onContinue={() => {}}
      />,
    );
    // Avant le skip, le CTA n'est pas encore entré.
    expect(screen.queryByRole('button', { name: 'Continuer' })).toBeNull();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument();
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
    // Sauter coupe aussi le vol des éclats.
    expect(document.querySelector('[data-xp-flight]')).toBeNull();
  });

  it('Entrée déclenche Continuer quand le CTA est visible', async () => {
    const { onContinue } = renderPosed(REWARDED_115);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('un clic hors CTA saute la chorégraphie, un clic sur le CTA continue', async () => {
    const onContinue = vi.fn();
    render(
      <CompletionScreen
        {...PERFECT_8}
        submit={() => Promise.resolve(REWARDED_115)}
        onContinue={onContinue}
      />,
    );
    fireEvent.click(screen.getByText('Les salutations'));
    const cta = screen.getByRole('button', { name: 'Continuer' });
    expect(cta).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();
    fireEvent.click(cta);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('le tampon « Parfait ! » n’apparaît que sans faute', async () => {
    const { unmount } = renderPosed(REWARDED_115);
    await waitFor(() => expect(document.querySelector('[data-stamp]')).not.toBeNull());
    unmount();

    renderPosed(
      { status: 'rewarded', xpAwarded: 80, xpBefore: 1200, xpAfter: 1280 },
      { correctCount: 6, totalQuestions: 8, bestCombo: 3 },
    );
    expect(document.querySelector('[data-stamp]')).toBeNull();
  });
});
