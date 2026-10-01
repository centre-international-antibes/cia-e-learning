import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Lottie attaque un <canvas> dès l'import : inutile ici, et jsdom n'en a pas.
vi.mock('lottie-react', () => ({ default: () => null }));

import { CompletionScreen } from '@/components/course-player/CoursePlayer';
import { computeLessonXp } from '@/lib/xp/lessonXp';
import '@/i18n';

/** Rend l'écran de fin et renvoie l'XP affichée dans la tuile « XP ». */
function shownXp(props: { correctCount: number; totalQuestions: number; bestCombo: number }) {
  const { unmount } = render(
    <CompletionScreen
      courseTitle="Leçon de test"
      totalSteps={5}
      durationSeconds={42}
      onContinue={() => {}}
      onExit={() => {}}
      {...props}
    />,
  );
  const value = Number(screen.getByTestId('completion-xp').textContent?.replace(/[^\d]/g, ''));
  unmount();
  return value;
}

describe('XP affichée en fin de leçon', () => {
  it('3 bonnes réponses sur 4 : 50 + 15 = 65 XP', () => {
    expect(shownXp({ correctCount: 3, totalQuestions: 4, bestCombo: 3 })).toBe(65);
  });

  it('leçon parfaite à 4 questions : 50 + 20 + 20 = 90 XP', () => {
    expect(shownXp({ correctCount: 4, totalQuestions: 4, bestCombo: 4 })).toBe(90);
  });

  it('aucune bonne réponse : la base reste acquise', () => {
    expect(shownXp({ correctCount: 0, totalQuestions: 4, bestCombo: 0 })).toBe(50);
  });

  it('série longue : le palier de combo est compté', () => {
    // 6 d'affilée sur 8 questions → 50 + 30 + 5, sans bonus sans-faute.
    expect(shownXp({ correctCount: 6, totalQuestions: 8, bestCombo: 6 })).toBe(85);
  });

  it('ne s’écarte jamais du barème partagé avec le serveur', () => {
    const cases = [
      { correct: 0, questionCount: 0, bestCombo: 0 },
      { correct: 3, questionCount: 4, bestCombo: 3 },
      { correct: 4, questionCount: 4, bestCombo: 4 },
      { correct: 10, questionCount: 12, bestCombo: 10 },
    ];
    for (const c of cases) {
      expect(
        shownXp({
          correctCount: c.correct,
          totalQuestions: c.questionCount,
          bestCombo: c.bestCombo,
        }),
        JSON.stringify(c),
      ).toBe(computeLessonXp(c).total);
    }
  });
});
