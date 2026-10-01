#!/usr/bin/env node
/**
 * Génère le seed de `public.lesson_xp_spec` depuis le contenu pédagogique.
 *
 * Le serveur borne l'XP d'une leçon avec `question_count` et son garde-fou
 * `too_fast` avec `step_count` : ces deux nombres doivent donc toujours
 * refléter `src/data/*-content.ts`. Le test `src/lib/lessonSpec.test.ts`
 * échoue si le contenu bouge sans que le seed soit régénéré.
 *
 * Usage :
 *   npm run gen:lesson-xp-spec            # écrit le bloc SQL sur la sortie standard
 *   npm run gen:lesson-xp-spec -- --write # réécrit le bloc dans la migration M2
 *
 * Le fichier est en TypeScript mais exécuté par Node : les modules de données
 * sont bundlés à la volée par esbuild (imports sans extension, alias `@/`),
 * ce que Node ne sait pas résoudre seul.
 */
import { build } from 'esbuild';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { LessonSpec } from '../src/lib/lessonSpec.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION = path.join(ROOT, 'supabase/migrations/20261001145102_m2_xp_pipeline.sql');
const BEGIN_MARKER = '-- >>> lesson_xp_spec seed (généré — ne pas éditer à la main)';
const END_MARKER = '-- <<< lesson_xp_spec seed';

async function loadSpecs(): Promise<LessonSpec[]> {
  const dir = await mkdtemp(path.join(tmpdir(), 'cia-lesson-spec-'));
  const outfile = path.join(dir, 'specs.mjs');
  await build({
    stdin: {
      contents: `export { buildLessonSpecs } from '@/lib/lessonSpec';`,
      resolveDir: ROOT,
      sourcefile: 'gen-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    outfile,
    alias: { '@': path.join(ROOT, 'src') },
    logLevel: 'warning',
  });
  const mod = (await import(pathToFileURL(outfile).href)) as {
    buildLessonSpecs: () => LessonSpec[];
  };
  const specs = mod.buildLessonSpecs();
  await rm(dir, { recursive: true, force: true });
  return specs;
}

const sqlText = (value: string | null): string =>
  value === null ? 'NULL' : `'${value.replace(/'/g, "''")}'`;

export function renderSeed(specs: LessonSpec[]): string {
  const rows = specs
    .map(
      (s) => `  (${sqlText(s.courseId)}, ${s.stepCount}, ${s.questionCount}, ${sqlText(s.level)})`,
    )
    .join(',\n');
  return `${BEGIN_MARKER}
-- Régénérer : npm run gen:lesson-xp-spec -- --write
INSERT INTO public.lesson_xp_spec (course_id, step_count, question_count, level) VALUES
${rows}
ON CONFLICT (course_id) DO UPDATE
  SET step_count = EXCLUDED.step_count,
      question_count = EXCLUDED.question_count,
      level = EXCLUDED.level;
${END_MARKER}`;
}

const specs = await loadSpecs();
const seed = renderSeed(specs);

if (process.argv.includes('--write')) {
  const sql = await readFile(MIGRATION, 'utf8');
  const start = sql.indexOf(BEGIN_MARKER);
  const end = sql.indexOf(END_MARKER);
  if (start === -1 || end === -1) {
    console.error(`Marqueurs de seed introuvables dans ${path.relative(ROOT, MIGRATION)}`);
    process.exit(1);
  }
  const next = sql.slice(0, start) + seed + sql.slice(end + END_MARKER.length);
  await writeFile(MIGRATION, next);
  console.error(`Seed réécrit dans ${path.relative(ROOT, MIGRATION)} — ${specs.length} leçons.`);
} else {
  console.log(seed);
  console.error(`${specs.length} leçons.`);
}
