import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { allContent } from '@/data/course-content';
import { buildLessonSpecs, countQuestions, GRADED_STEP_TYPES } from '@/lib/lessonSpec';

/**
 * Le serveur borne l'XP d'une leçon avec `question_count` et son garde-fou
 * anti-rush avec `step_count`. Si un contenu change sans que le seed de la
 * migration soit régénéré, le barème serveur devient faux — d'où ce test.
 *
 * Régénérer le seed : `npm run gen:lesson-xp-spec -- --write`
 */

const MIGRATION = path.resolve(
  __dirname,
  '../../supabase/migrations/20261001144804_m2_xp_pipeline.sql',
);

interface SeedRow {
  courseId: string;
  stepCount: number;
  questionCount: number;
  level: string | null;
}

function readSeed(): SeedRow[] {
  const sql = readFileSync(MIGRATION, 'utf8');
  const begin = sql.indexOf('INSERT INTO public.lesson_xp_spec');
  const end = sql.indexOf('ON CONFLICT (course_id)', begin);
  expect(begin, 'bloc INSERT du seed introuvable dans la migration').toBeGreaterThan(-1);
  expect(end, 'clause ON CONFLICT introuvable dans la migration').toBeGreaterThan(begin);

  const values = sql.slice(begin, end);
  const rowPattern = /\('((?:[^']|'')*)',\s*(\d+),\s*(\d+),\s*(NULL|'((?:[^']|'')*)')\)/g;
  const rows: SeedRow[] = [];
  for (const match of values.matchAll(rowPattern)) {
    rows.push({
      courseId: match[1].replace(/''/g, "'"),
      stepCount: Number(match[2]),
      questionCount: Number(match[3]),
      level: match[4] === 'NULL' ? null : match[5].replace(/''/g, "'"),
    });
  }
  return rows;
}

describe('lesson_xp_spec — seed de la migration', () => {
  const seed = readSeed();
  const computed = buildLessonSpecs();

  it('couvre toutes les leçons jouables', () => {
    expect(seed.length).toBe(computed.length);
    expect(seed.map((r) => r.courseId).sort()).toEqual(computed.map((s) => s.courseId).sort());
  });

  it('correspond exactement au contenu de src/data', () => {
    const byId = new Map(seed.map((r) => [r.courseId, r]));
    const divergences = computed
      .filter((spec) => {
        const row = byId.get(spec.courseId);
        return (
          !row ||
          row.stepCount !== spec.stepCount ||
          row.questionCount !== spec.questionCount ||
          row.level !== spec.level
        );
      })
      .map((spec) => spec.courseId);

    expect(
      divergences,
      'seed obsolète — régénérer avec `npm run gen:lesson-xp-spec -- --write`',
    ).toEqual([]);
  });

  it('respecte les contraintes de la table', () => {
    for (const row of seed) {
      expect(row.stepCount, row.courseId).toBeGreaterThan(0);
      expect(row.questionCount, row.courseId).toBeGreaterThanOrEqual(0);
      expect(row.questionCount, row.courseId).toBeLessThanOrEqual(row.stepCount);
    }
  });
});

describe('règle de comptage des questions', () => {
  it('ne compte que les étapes notées', () => {
    const steps = allContent[0].steps;
    const graded = steps.filter((s) =>
      (GRADED_STEP_TYPES as readonly string[]).includes(s.type),
    ).length;
    expect(countQuestions(steps)).toBe(graded);
  });

  it('compte un quiz final comme une seule question, comme le player', () => {
    const withFinalQuiz = allContent.find((c) => c.steps.some((s) => s.type === 'final-quiz'));
    expect(withFinalQuiz).toBeDefined();
    const finalQuizzes = withFinalQuiz!.steps.filter((s) => s.type === 'final-quiz');
    expect(finalQuizzes.length).toBeGreaterThan(0);
    const otherGraded = withFinalQuiz!.steps.filter(
      (s) => s.type !== 'final-quiz' && (GRADED_STEP_TYPES as readonly string[]).includes(s.type),
    ).length;
    expect(countQuestions(withFinalQuiz!.steps)).toBe(otherGraded + finalQuizzes.length);
  });
});
