import { getCourseContent } from '@/data/course-content';
import { countQuestions } from '@/lib/lessonSpec';
import { computeLessonXp } from '@/lib/xp/lessonXp';

/**
 * XP estimée d'une leçon dont le contenu n'est pas encore en ligne.
 *
 * **105, c'est la médiane et la moyenne arrondie** des 170 leçons jouables sur
 * un sans-faute — min 75, max 110, la dispersion est faible. Mieux vaut un
 * ordre de grandeur juste qu'un tiret qui n'apprend rien.
 *
 * Ce n'est **pas** le barème : le serveur reste la seule autorité
 * (`complete_lesson`), et cette constante n'a aucun équivalent en SQL.
 */
export const ESTIMATED_LESSON_XP = 105;

/**
 * XP restante à gagner sur le module, au **barème du serveur**.
 *
 * On additionne, pour chaque leçon non faite, ce que `complete_lesson`
 * accorderait sur un sans-faute : base + bonnes réponses + série + parfait.
 * Une leçon dont le contenu n'est pas encore en ligne compte pour une leçon
 * moyenne, et le total est alors annoncé comme une estimation.
 */
export function remainingXp(lessons: { completed: boolean; href?: string }[]): {
  total: number;
  estimated: boolean;
} {
  let total = 0;
  let estimated = false;
  for (const lesson of lessons) {
    if (lesson.completed) continue;
    if (!lesson.href) {
      total += ESTIMATED_LESSON_XP;
      estimated = true;
      continue;
    }
    const content = getCourseContent(lesson.href.replace('/cours/', ''));
    if (!content) continue;
    const questions = countQuestions(content.steps);
    total += computeLessonXp({
      correct: questions,
      questionCount: questions,
      bestCombo: questions,
    }).total;
  }
  return { total, estimated };
}
