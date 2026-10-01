import type { CourseContent, CourseStep } from '@/data/course-content';
import { allContent } from '@/data/course-content';
import { curriculum } from '@/data/curriculum';

/**
 * Référentiel d'une leçon : combien d'étapes, combien de questions notées.
 *
 * C'est la source unique de cette règle de comptage. Elle sert à trois
 * endroits qui doivent rester d'accord, sinon l'XP serveur et l'aperçu
 * client divergent :
 *   - `CoursePlayer`, qui incrémente `totalQuestions` à chaque étape notée ;
 *   - la table `lesson_xp_spec` (seed généré par `scripts/gen-lesson-xp-spec.ts`),
 *     que `complete_lesson` utilise pour borner `_correct` et détecter une
 *     leçon parfaite ;
 *   - le garde-fou `too_fast` du serveur, qui part de `step_count`.
 */

/**
 * Étapes qui remontent une réponse juste ou fausse — exactement celles dont
 * le composant appelle `onNext(correct: boolean)` dans `CoursePlayer`.
 * Une étape `final-quiz` ne compte que pour **une** question, quel que soit
 * son nombre de sous-questions : c'est ce que fait le player.
 */
export const GRADED_STEP_TYPES = [
  'qcm',
  'fill-blank',
  'drag-drop',
  'listening',
  'final-quiz',
] as const satisfies readonly CourseStep['type'][];

export type GradedStepType = (typeof GRADED_STEP_TYPES)[number];

export interface LessonSpec {
  courseId: string;
  /** Nombre total d'étapes, notées ou non. */
  stepCount: number;
  /** Nombre d'étapes notées. */
  questionCount: number;
  /** Niveau CECRL de la leçon, `null` pour les contenus hors programme. */
  level: string | null;
}

export function isGradedStep(step: CourseStep): boolean {
  return (GRADED_STEP_TYPES as readonly string[]).includes(step.type);
}

export function countQuestions(steps: readonly CourseStep[]): number {
  return steps.filter(isGradedStep).length;
}

/** Niveau CECRL par identifiant de leçon du programme (`lesson-42` → `B1`). */
function buildLevelIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const level of curriculum) {
    for (const mod of level.modules) {
      for (const lesson of mod.lessons) {
        index.set(`lesson-${lesson.id}`, level.level);
      }
    }
  }
  return index;
}

export function lessonSpecFor(content: CourseContent, levels = buildLevelIndex()): LessonSpec {
  return {
    courseId: content.courseId,
    stepCount: content.steps.length,
    questionCount: countQuestions(content.steps),
    level: levels.get(content.courseId) ?? null,
  };
}

/** Référentiel complet, trié par identifiant pour un seed stable. */
export function buildLessonSpecs(contents: readonly CourseContent[] = allContent): LessonSpec[] {
  const levels = buildLevelIndex();
  return contents
    .map((content) => lessonSpecFor(content, levels))
    .sort((a, b) => a.courseId.localeCompare(b.courseId, 'en'));
}
