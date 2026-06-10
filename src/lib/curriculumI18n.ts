import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { curriculum, type LevelCurriculum, type Module, type Lesson } from '@/data/curriculum';

/**
 * Reads translated metadata for curriculum levels, modules and lessons.
 * Falls back transparently to French (the source of truth) when a key
 * is missing in the active locale.
 *
 * Only NAMES / TITLES / THEMES / DESCRIPTIONS are translated.
 * Lesson exercise content (dialogues, QCM, flashcards) stays in French.
 */
export function useCurriculumI18n() {
  const { t } = useTranslation();

  const tr = (key: string, fallback: string) =>
    t(key, { defaultValue: fallback }) as string;

  return {
    levelTitle: (level: string, fallback = '') =>
      tr(`curriculum.levels.${level}.title`, fallback),
    levelObjective: (level: string, fallback = '') =>
      tr(`curriculum.levels.${level}.objective`, fallback),
    moduleTitle: (id: string, fallback = '') =>
      tr(`curriculum.modules.${id}.title`, fallback),
    moduleTheme: (id: string, fallback = '') =>
      tr(`curriculum.modules.${id}.theme`, fallback),
    moduleBadge: (id: string, fallback = '') =>
      tr(`curriculum.modules.${id}.badge`, fallback),
    lessonTitle: (id: number | string, fallback = '') =>
      tr(`curriculum.lessons.${id}.title`, fallback),
    lessonDescription: (id: number | string, fallback = '') =>
      tr(`curriculum.lessons.${id}.description`, fallback),
  };
}

/**
 * Returns a translated copy of the full `curriculum` array (same shape
 * as `src/data/curriculum.ts`). Falls back to French when a key is
 * missing in the active locale.
 *
 * Memoized per language so re-renders are cheap.
 */
export function useTranslatedCurriculum(): LevelCurriculum[] {
  const { t, i18n } = useTranslation();

  return useMemo(() => {
    const tr = (key: string, fb: string) => t(key, { defaultValue: fb }) as string;
    return curriculum.map((lv) => ({
      ...lv,
      title: tr(`curriculum.levels.${lv.level}.title`, lv.title),
      objective: tr(`curriculum.levels.${lv.level}.objective`, lv.objective),
      modules: lv.modules.map((m: Module) => ({
        ...m,
        title: tr(`curriculum.modules.${m.id}.title`, m.title),
        theme: tr(`curriculum.modules.${m.id}.theme`, m.theme),
        badge: tr(`curriculum.modules.${m.id}.badge`, m.badge),
        lessons: m.lessons.map((l: Lesson) => ({
          ...l,
          title: tr(`curriculum.lessons.${l.id}.title`, l.title),
          description: tr(`curriculum.lessons.${l.id}.description`, l.description),
        })),
      })),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, t]);
}

/**
 * Look up a single translated lesson by its global ID (1..300).
 * Returns undefined when the ID does not exist.
 */
export function useTranslatedLesson(lessonId: number | undefined) {
  const list = useTranslatedCurriculum();
  return useMemo(() => {
    if (lessonId == null) return undefined;
    for (const lv of list) {
      for (const m of lv.modules) {
        const l = m.lessons.find((x) => x.id === lessonId);
        if (l) return { level: lv, module: m, lesson: l };
      }
    }
    return undefined;
  }, [list, lessonId]);
}