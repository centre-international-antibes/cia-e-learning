import { useTranslation } from 'react-i18next';

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